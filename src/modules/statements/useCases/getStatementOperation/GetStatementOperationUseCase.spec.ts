import { InMemoryUsersRepository } from "../../../users/repositories/in-memory/InMemoryUsersRepository";
import { OperationType } from "../../entities/Statement";
import { InMemoryStatementsRepository } from "../../repositories/in-memory/InMemoryStatementsRepository";
import { GetStatementOperationError } from "./GetStatementOperationError";
import { GetStatementOperationUseCase } from "./GetStatementOperationUseCase";

let inMemoryUsersRepository: InMemoryUsersRepository;
let inMemoryStatementsRepository: InMemoryStatementsRepository;
let getStatementOperationUseCase: GetStatementOperationUseCase;

let userId: string;

describe("Get Statement Operation", () => {
  beforeEach(async () => {
    inMemoryUsersRepository = new InMemoryUsersRepository();
    inMemoryStatementsRepository = new InMemoryStatementsRepository();

    getStatementOperationUseCase = new GetStatementOperationUseCase(
      inMemoryUsersRepository,
      inMemoryStatementsRepository
    );

    const user = await inMemoryUsersRepository.create({
      name: "test-name",
      email: "test@test.com",
      password: "fake-password",
    });

    userId = user.id as string;
  });

  it("should be able to get a statement operation", async () => {
    const depositStatementCreateData = {
      description: "fake-description-1",
      amount: 300,
      type: OperationType.DEPOSIT,
      user_id: userId,
    };

    const depositStatement = await inMemoryStatementsRepository.create(
      depositStatementCreateData
    );

    const statementOperation = await getStatementOperationUseCase.execute({
      user_id: userId,
      statement_id: depositStatement.id as string
    });

    expect(statementOperation).toHaveProperty("id");
    expect(statementOperation.id).toBe(depositStatement.id);

    expect(statementOperation).toHaveProperty("user_id");
    expect(statementOperation.user_id).toBe(userId);

    expect(statementOperation).toHaveProperty("description");
    expect(statementOperation.description).toBe(depositStatement.description);

    expect(statementOperation).toHaveProperty("amount");
    expect(statementOperation.amount).toBe(depositStatement.amount);

    expect(statementOperation).toHaveProperty("type");
    expect(statementOperation.type).toBe(depositStatement.type);
  });

  it("should not be able to get a statement operation due to user not being found", async () => {
    const depositStatementCreateData = {
      description: "fake-description-1",
      amount: 300,
      type: OperationType.DEPOSIT,
      user_id: userId,
    };

    const depositStatement = await inMemoryStatementsRepository.create(
      depositStatementCreateData
    );

    expect(
      getStatementOperationUseCase.execute({
        user_id: "fake-id",
        statement_id: depositStatement.id as string
      })
    ).rejects.toEqual(new GetStatementOperationError.UserNotFound());
  });

  it("should not be able to get a statement operation that doesn't exist", async () => {
    expect(
      getStatementOperationUseCase.execute({
        user_id: userId,
        statement_id: "fake-id",
      })
    ).rejects.toEqual(new GetStatementOperationError.StatementNotFound());
  });
});
