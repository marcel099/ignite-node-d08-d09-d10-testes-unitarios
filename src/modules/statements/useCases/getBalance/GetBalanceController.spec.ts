import request from "supertest";
import { Connection } from "typeorm";

import { app } from "../../../../app";
import createConnection from "../../../../database";
import { createUser } from "../../../../shared/infra/database/typeorm/createUser";
import { createUserSession } from "../../../../shared/infra/database/typeorm/createUserSession";

let connection: Connection;
let token: string;

describe("Get Balance Controller", () => {
  beforeAll(async () => {
    connection = await createConnection("localhost");
    await connection.runMigrations();

    await createUser(connection);
    const userSession = await createUserSession(connection);
    token = userSession.token;
  });

  afterAll(async () => {
    await connection.dropDatabase();
    await connection.close();
  });

  it("should be able to get a balance", async () => {
    const depositStatementCreationData = {
      amount: 50,
      description: "test-deposit-statement",
    }

    const withdrawStatementCreationData = {
      amount: 30,
      description: "test-withdraw-statement",
    }

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
})