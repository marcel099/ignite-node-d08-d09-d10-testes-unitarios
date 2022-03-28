import { InMemoryUsersRepository } from "../../../users/repositories/in-memory/InMemoryUsersRepository";
import { OperationType } from "../../entities/Statement";
import { InMemoryStatementsRepository } from "../../repositories/in-memory/InMemoryStatementsRepository";
import { CreateStatementUseCase } from "./CreateStatementUseCase";
import { ICreateStatementDTO } from "./ICreateStatementDTO";

let inMemoryUsersRepository: InMemoryUsersRepository;
let inMemoryStatementsRepository: InMemoryStatementsRepository;
let createStatementUseCase: CreateStatementUseCase;

let userId: string;

describe("Create Statement", () => {
  beforeEach(async () => {
    inMemoryUsersRepository = new InMemoryUsersRepository();
    inMemoryStatementsRepository = new InMemoryStatementsRepository();
    createStatementUseCase = new CreateStatementUseCase(
      inMemoryUsersRepository,
      inMemoryStatementsRepository
    );

    const user = await inMemoryUsersRepository.create({
      name: "test-name",
      email: "test@test.com",
      password: "fake-password",
    })

    userId = user.id as string;
  });

  it("should be able to create a new deposit statement", async () => {
    const createStatementRequestData: ICreateStatementDTO = {
      user_id: userId,  // "fake-id"
      description: "fake-description",
      amount: 200,
      type: OperationType.DEPOSIT,
    };

    const statement = await createStatementUseCase.execute(
      createStatementRequestData
    );

    expect(statement).toHaveProperty("id");
    expect(statement.id).toBeTruthy();

    expect(statement).toHaveProperty("user_id");
    expect(statement.user_id).toBe(userId);

    expect(statement).toHaveProperty("description");
    expect(statement.description).toBe(createStatementRequestData.description);

    expect(statement).toHaveProperty("amount");
    expect(statement.amount).toBe(createStatementRequestData.amount);

    expect(statement).toHaveProperty("type");
    expect(statement.type).toBe(createStatementRequestData.type);
  });
});
