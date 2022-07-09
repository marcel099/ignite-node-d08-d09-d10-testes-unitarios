import { Statement } from "../../entities/Statement";
import { ICreateStatementDTO } from "../../useCases/createStatement/ICreateStatementDTO";
import { IGetBalanceDTO } from "../../useCases/getBalance/IGetBalanceDTO";
import { IGetStatementOperationDTO } from "../../useCases/getStatementOperation/IGetStatementOperationDTO";
import { IStatementsRepository } from "../IStatementsRepository";

export class InMemoryStatementsRepository implements IStatementsRepository {
  private statements: Statement[] = [];

  async create(data: ICreateStatementDTO): Promise<Statement> {
    const statement = new Statement();

    Object.assign(statement, data);

    this.statements.push(statement);

    return statement;
  }

  async findStatementOperation({ statement_id, user_id }: IGetStatementOperationDTO): Promise<Statement | undefined> {
    return this.statements.find(operation => (
      operation.id === statement_id &&
      operation.user_id === user_id
    ));
  }

  async getUserBalance({ user_id, with_statement = false }: IGetBalanceDTO):
    Promise<
      { balance: number } | { balance: number, statement: Statement[] }
    >
  {
    const userStatements = this.statements.filter(operation =>
      operation.user_id === user_id || operation.sender_id === user_id
    );

    const userStatementsBalance = userStatements.reduce((acc, operation) => {
      if (operation.user_id === user_id) {
        if (operation.type === 'deposit' || operation.type === 'transfer') {
          return acc + operation.amount;
        } else {
          return acc - operation.amount;
        }
      } else {
        return acc;
      }
    }, 0)

    const sentTransfersBalance = userStatements.reduce((acc, operation) => {
      if (operation.sender_id === user_id) {
        return acc + operation.amount;
      } else {
        return acc;
      }
    }, 0)

    const balance = userStatementsBalance - sentTransfersBalance;

    if (with_statement) {
      return {
        statement: userStatements,
        balance
      }
    }

    return { balance }
  }
}
