import request from "supertest";
import { Connection } from "typeorm";

import { app } from "../../../../app";
import createConnection from "../../../../database";
import { createRecipientUser } from "../../../../shared/infra/database/typeorm/createRecipientUser";
import { createUser } from "../../../../shared/infra/database/typeorm/createUser";
import { createUserSession } from "../../../../shared/infra/database/typeorm/createUserSession";
import { User } from "../../../users/entities/User";
import { CreateStatementError } from "./CreateStatementError";

let connection: Connection;
let token: string;
let recipient_user: User;

describe("Create Statement Controller", () => {
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

  it("should be able to create a new deposit statement", async () => {
    const statementCreationData = {
      amount: 200,
      description: "test-deposit-statement"
    };

    const response = await request(app)
      .post("/api/v1/statements/deposit")
      .set({
        authorization: `bearer ${token}`
      })
      .send(statementCreationData);

    expect(response.statusCode).toBe(201);

    expect(response.body).toHaveProperty("id");
    expect(response.body.id).toBeTruthy();

    expect(response.body).toHaveProperty("user_id");
    expect(response.body.user_id).toBeTruthy();

    expect(response.body).toHaveProperty("description");
    expect(response.body.description).toBe(statementCreationData.description);

    expect(response.body).toHaveProperty("amount");
    expect(response.body.amount).toBe(statementCreationData.amount);

    expect(response.body).toHaveProperty("type");
    expect(response.body.type).toBe("deposit");

    expect(response.body).toHaveProperty("created_at");
    expect(response.body.created_at).toBeTruthy();

    expect(response.body).toHaveProperty("updated_at");
    expect(response.body.updated_at).toBeTruthy();
  });

  it("should be able to create a new withdraw statement only if there are enough funds", async () => {
    const statementCreationData = {
      amount: 50,
      description: "test-withdraw-statement"
    };

    const response = await request(app)
      .post("/api/v1/statements/withdraw")
      .set({
        authorization: `bearer ${token}`
      })
      .send(statementCreationData);

    expect(response.statusCode).toBe(201);

    expect(response.body).toHaveProperty("id");
    expect(response.body.id).toBeTruthy();

    expect(response.body).toHaveProperty("user_id");
    expect(response.body.user_id).toBeTruthy();

    expect(response.body).toHaveProperty("description");
    expect(response.body.description).toBe(statementCreationData.description);

    expect(response.body).toHaveProperty("amount");
    expect(response.body.amount).toBe(statementCreationData.amount);

    expect(response.body).toHaveProperty("type");
    expect(response.body.type).toBe("withdraw");

    expect(response.body).toHaveProperty("created_at");
    expect(response.body.created_at).toBeTruthy();

    expect(response.body).toHaveProperty("updated_at");
    expect(response.body.updated_at).toBeTruthy();
  });

  it("should be able to create a new transfer statement only if there are enough funds", async () => {
    recipient_user = await createRecipientUser(connection);

    const statementCreationData = {
      amount: 70,
      description: "test-transfer-statement"
    };

    const response = await request(app)
      .post(`/api/v1/statements/transfer/${recipient_user.id}`)
      .set({
        authorization: `bearer ${token}`
      })
      .send(statementCreationData);

    expect(response.statusCode).toBe(201);

    expect(response.body).toHaveProperty("id");
    expect(response.body.id).toBeTruthy();

    expect(response.body).toHaveProperty("user_id");
    expect(response.body.user_id).toBe(recipient_user.id);

    expect(response.body).toHaveProperty("sender_id");
    expect(response.body.sender_id).toBeTruthy();

    expect(response.body).toHaveProperty("description");
    expect(response.body.description).toBe(statementCreationData.description);

    expect(response.body).toHaveProperty("amount");
    expect(response.body.amount).toBe(statementCreationData.amount);

    expect(response.body).toHaveProperty("type");
    expect(response.body.type).toBe("transfer");

    expect(response.body).toHaveProperty("created_at");
    expect(response.body.created_at).toBeTruthy();

    expect(response.body).toHaveProperty("updated_at");
    expect(response.body.updated_at).toBeTruthy();
  });


  it("should not be able to create a new withdraw statement due to insufficient funds", async () => {
    const statementCreationData = {
      amount: 180,
      description: "test-withdraw-statement"
    };

    const response = await request(app)
      .post("/api/v1/statements/withdraw")
      .set({
        authorization: `bearer ${token}`,
      })
      .send(statementCreationData);

    const responseErrorMessage = response.body.message;
    const insufficientFunds = new CreateStatementError.InsufficientFunds();
    
    expect(response.statusCode).toBe(400);
    expect(responseErrorMessage).toBe(insufficientFunds.message);
  });

  it("should not be able to create a new transfer statement due to insufficient funds", async () => {
    const statementCreationData = {
      amount: 180,
      description: "test-transfer-statement"
    };

    const response = await request(app)
      .post(`/api/v1/statements/transfer/${recipient_user.id}`)
      .set({
        authorization: `bearer ${token}`,
      })
      .send(statementCreationData);

    const responseErrorMessage = response.body.message;
    const insufficientFunds = new CreateStatementError.InsufficientFunds();
    
    expect(response.statusCode).toBe(400);
    expect(responseErrorMessage).toBe(insufficientFunds.message);
  });
});