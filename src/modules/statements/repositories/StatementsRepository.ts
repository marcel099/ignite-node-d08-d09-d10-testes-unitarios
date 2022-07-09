import { getRepository, Repository } from "typeorm";

import { Statement } from "../entities/Statement";
import { ICreateStatementDTO } from "../useCases/createStatement/ICreateStatementDTO";
import { IGetBalanceDTO } from "../useCases/getBalance/IGetBalanceDTO";
import { IGetStatementOperationDTO } from "../useCases/getStatementOperation/IGetStatementOperationDTO";
import { IStatementsRepository } from "./IStatementsRepository";

export class StatementsRepository implements IStatementsRepository {
  private repository: Repository<Statement>;

  constructor() {
    this.repository = getRepository(Statement);
  }

  async create({
    user_id,
    sender_id,
    amount,
    description,
    type
  }: ICreateStatementDTO): Promise<Statement> {
    const statement = this.repository.create({
      user_id,
      sender_id,
      amount,
      description,
      type
    });

    const savedStatement = await this.repository.save(statement);

    savedStatement.amount = Number(savedStatement.amount);

    return savedStatement;
  }

  async findStatementOperation({ statement_id, user_id }: IGetStatementOperationDTO): Promise<Statement | undefined> {
    const statement = await this.repository.findOne(statement_id, {
      where: { user_id }
    });

    if (statement !== undefined) {
      statement.amount = Number(statement.amount);
    }

    return statement;
  }

  async getUserBalance({ user_id, with_statement = false }: IGetBalanceDTO):
    Promise<
      { balance: number } | { balance: number, statement: Statement[] }
    >
  {
    const userStatements = await this.repository.find({
      where: { user_id }
    });

    userStatements.forEach((statement) => {
      statement.amount = Number(statement.amount);
    })

    const userStatementsBalance = userStatements.reduce((acc, operation) => {
      if (operation.type === 'deposit' || operation.type === 'transfer') {
        return acc + operation.amount;
      } else {
        return acc - operation.amount;
      }
    }, 0)

    const userSentTransferStatements = await this.repository.find({
      where: { sender_id: user_id }
    });

    const sentTransfersBalance = userSentTransferStatements.reduce((acc, operation) => {
      return acc + operation.amount;
    }, 0)

    const allStatements = [...userStatements, ...userSentTransferStatements];

    allStatements.sort((a,b) => (a.created_at > b.created_at) ? 1 : ((b.created_at > a.created_at) ? -1 : 0))

    const balance = userStatementsBalance - sentTransfersBalance;

    if (with_statement) {
      return {
        statement: allStatements,
        balance
      }
    }

    return { balance }
  }
}
