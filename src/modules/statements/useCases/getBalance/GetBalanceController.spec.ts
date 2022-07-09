import request from "supertest";
import { Connection } from "typeorm";

import { app } from "../../../../app";
import createConnection from "../../../../database";
import { createRecipientUser } from "../../../../shared/infra/database/typeorm/createRecipientUser";
import { createUser } from "../../../../shared/infra/database/typeorm/createUser";
import { createUserSession } from "../../../../shared/infra/database/typeorm/createUserSession";
import { User } from "../../../users/entities/User";

let connection: Connection;
let user: User;
let token: string;

const depositStatementCreationData = {
  amount: 50,
  description: "test-deposit-statement",
}

const withdrawStatementCreationData = {
  amount: 30,
  description: "test-withdraw-statement",
}

const sentTransferStatementCreationData = {
  amount: 10,
  description: "test-sent-transfer-statement",
}

const receivedTransferStatementCreationData = {
  amount: 2,
  description: "test-received-transfer-statement",
}

describe("Get Balance Controller", () => {
  beforeAll(async () => {
    connection = await createConnection("localhost");
    await connection.runMigrations();

    user = await createUser(connection);
    const userSession = await createUserSession(connection);
    token = userSession.token;
  });

  afterAll(async () => {
    await connection.dropDatabase();
    await connection.close();
  });

  it("should be able to get the correct balance having 1 deposit and 1 withdraw statements", async () => {
    await request(app)
      .post("/api/v1/statements/deposit")
      .set({
        authorization: `bearer ${token}`,
      })
      .send(depositStatementCreationData);

    await request(app)
      .post("/api/v1/statements/withdraw")
      .set({
        authorization: `bearer ${token}`,
      })
      .send(withdrawStatementCreationData);

    const response = await request(app)
      .get("/api/v1/statements/balance")
      .set({
        authorization: `bearer ${token}`,
      })
      .send();

    expect(response.statusCode).toBe(200);

    expect(response.body).toHaveProperty("balance");
    expect(response.body.balance).toBe(
      depositStatementCreationData.amount
      - withdrawStatementCreationData.amount
    );
  });

  it("should be able to get the correct balance having 1 deposit, 1 withdraw, 1 sent transfer and 1 received transfer statements", async () => {
    const recipient_user = await createRecipientUser(connection);

    const recipientUserSession = await createUserSession(
      connection,
      recipient_user.email
    );

    await request(app)
      .post(`/api/v1/statements/transfer/${recipient_user.id}`)
      .set({
        authorization: `bearer ${token}`,
      })
      .send(sentTransferStatementCreationData);

    await request(app)
      .post(`/api/v1/statements/transfer/${user.id}`)
      .set({
        authorization: `bearer ${recipientUserSession.token}`,
      })
      .send(receivedTransferStatementCreationData);

    const response = await request(app)
      .get("/api/v1/statements/balance")
      .set({
        authorization: `bearer ${token}`,
      })
      .send();

    expect(response.statusCode).toBe(200);

    expect(response.body).toHaveProperty("balance");
    expect(response.body.balance).toBe(
      depositStatementCreationData.amount
      - withdrawStatementCreationData.amount
      - sentTransferStatementCreationData.amount
      + receivedTransferStatementCreationData.amount
    );
  });
})