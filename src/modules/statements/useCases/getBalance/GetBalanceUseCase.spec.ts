import { InMemoryUsersRepository } from "../../../users/repositories/in-memory/InMemoryUsersRepository";
import { OperationType } from "../../entities/Statement";
import { InMemoryStatementsRepository } from "../../repositories/in-memory/InMemoryStatementsRepository";
import { GetBalanceError } from "./GetBalanceError";
import { GetBalanceUseCase } from "./GetBalanceUseCase";

let inMemoryUsersRepository: InMemoryUsersRepository;
let inMemoryStatementsRepository: InMemoryStatementsRepository;
let getBalanceUseCase: GetBalanceUseCase;

let userId: string;

describe("Get Balance", () => {
  beforeEach(async () => {
    inMemoryStatementsRepository = new InMemoryStatementsRepository();
    inMemoryUsersRepository = new InMemoryUsersRepository();

    getBalanceUseCase = new GetBalanceUseCase(
      inMemoryStatementsRepository,
      inMemoryUsersRepository,
    );

    const user = await inMemoryUsersRepository.create({
      name: "test-name",
      email: "test@test.com",
      password: "fake-password",
    })

    userId = user.id as string;
  });

  it("should be able to get a balance even without having a statement", async () => {
    const balanceResponse = await getBalanceUseCase.execute({ user_id: userId });

    expect(balanceResponse).toHaveProperty("balance");
    expect(balanceResponse.balance).toBe(0);

    expect(balanceResponse).toHaveProperty("statement");
    expect(balanceResponse.statement).toHaveLength(0);
  });

  it("should be able to get the correct balance having 2 deposit statements", async () => {
    const depositStatement1CreationData = {
      description: "fake-description-1",
      amount: 100,
      type: OperationType.DEPOSIT,
      user_id: userId,
    };

    const depositStatement2CreationData = {
      description: "fake-description-2",
      amount: 150,
      type: OperationType.DEPOSIT,
      user_id: userId,
    };

    const depositStatement1 = await inMemoryStatementsRepository.create(
      depositStatement1CreationData
    );
    const depositStatement2 = await inMemoryStatementsRepository.create(
      depositStatement2CreationData
    );

    const balanceResponse = await getBalanceUseCase.execute({ user_id: userId });

    expect(balanceResponse.balance).toBe(
      depositStatement1.amount + depositStatement2.amount
    );

    expect(balanceResponse.statement).toHaveLength(2);
    expect(balanceResponse.statement[0]).toEqual(depositStatement1);
    expect(balanceResponse.statement[1]).toEqual(depositStatement2);
  });

  it("should be able to get the correct balance having 1 deposit e 1 withdraw statements", async () => {
    const depositStatementCreationData = {
      description: "fake-description-1",
      amount: 300,
      type: OperationType.DEPOSIT,
      user_id: userId,
    };

    const withdrawStatementCreationData = {
      description: "fake-description-2",
      amount: 200,
      type: OperationType.WITHDRAW,
      user_id: userId,
    };

    const depositStatement = await inMemoryStatementsRepository.create(
      depositStatementCreationData
    );
    const withdrawStatement = await inMemoryStatementsRepository.create(
      withdrawStatementCreationData
    );

    const balanceResponse = await getBalanceUseCase.execute({ user_id: userId });

    expect(balanceResponse.balance).toBe(
      depositStatement.amount - withdrawStatement.amount
    );

    expect(balanceResponse.statement).toHaveLength(2);
    expect(balanceResponse.statement[0]).toEqual(depositStatement);
    expect(balanceResponse.statement[1]).toEqual(withdrawStatement);
  });

  it("should be able to get the correct balance having 1 deposit, 1 withdraw, 1 sent transfer and 1 received transfer statements", async () => {
    const recipientUser = await inMemoryUsersRepository.create({
      name: "recipient-test-name",
      email: "recipient-test@test.com",
      password: "fake-password",
    })

    const depositStatementCreationData = {
      description: "fake-deposit-statement",
      amount: 300,
      type: OperationType.DEPOSIT,
      user_id: userId,
    };

    const withdrawStatementCreationData = {
      description: "fake-withdraw-statement",
      amount: 200,
      type: OperationType.WITHDRAW,
      user_id: userId,
    };

    const sentTransferStatementCreationData = {
      description: "fake-sent-transfer-statement",
      amount: 50,
      type: OperationType.TRANSFER,
      user_id: recipientUser.id ?? "",
      sender_id: userId,
    };

    const receivedTransferStatementCreationData = {
      description: "fake-received-transfer-statement",
      amount: 10,
      type: OperationType.TRANSFER,
      user_id: userId,
      sender_id: recipientUser.id ?? "",
    };

    const depositStatement = await inMemoryStatementsRepository.create(
      depositStatementCreationData
    );
    const withdrawStatement = await inMemoryStatementsRepository.create(
      withdrawStatementCreationData
    );
    const sentTransferStatement = await inMemoryStatementsRepository.create(
      sentTransferStatementCreationData
    );
    const receivedTransferStatement = await inMemoryStatementsRepository.create(
      receivedTransferStatementCreationData
    );

    const balanceResponse = await getBalanceUseCase.execute({ user_id: userId });

    expect(balanceResponse.balance).toBe(
      depositStatement.amount
      - withdrawStatement.amount
      - sentTransferStatement.amount
      + receivedTransferStatement.amount
    );

    expect(balanceResponse.statement).toHaveLength(4);
    expect(balanceResponse.statement[0]).toEqual(depositStatement);
    expect(balanceResponse.statement[1]).toEqual(withdrawStatement);
    expect(balanceResponse.statement[2]).toEqual(sentTransferStatement);
    expect(balanceResponse.statement[3]).toEqual(receivedTransferStatement);
  });

  it("should not be able to get a balance due to user not being found", async () => {
    await expect(
      getBalanceUseCase.execute({ user_id: "fake-id" })
    ).rejects.toEqual(new GetBalanceError())
  });
});
