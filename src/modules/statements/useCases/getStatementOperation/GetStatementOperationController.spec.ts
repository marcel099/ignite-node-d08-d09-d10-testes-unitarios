import request from "supertest";
import { Connection } from "typeorm";

import { app } from "../../../../app";
import createConnection from "../../../../database";
import { createRecipientUser } from "../../../../shared/infra/database/typeorm/createRecipientUser";
import { createUser } from "../../../../shared/infra/database/typeorm/createUser";
import { createUserSession } from "../../../../shared/infra/database/typeorm/createUserSession";
import { User } from "../../../users/entities/User";
import { GetStatementOperationError } from "./GetStatementOperationError";

let connection: Connection;
let token: string;
let recipient_user: User;

describe("Get Statement Operation Controller", () => {
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

  it("should be able to get a deposit statement operation", async () => {
    const statementCreationData = {
      amount: 100,
      description: "test-deposit-statement",
    }

    const creationResponse = await request(app)
      .post("/api/v1/statements/deposit")
      .set({
        authorization: `bearer ${token}`
      })
      .send(statementCreationData);

    const { id } = creationResponse.body;


    const getResponse = await request(app)
      .get(`/api/v1/statements/${id}`)
      .set({
        authorization: `bearer ${token}`
      })
      .send();

    expect(getResponse.statusCode).toBe(200);

    expect(getResponse.body).toHaveProperty("id");
    expect(getResponse.body.id).toBe(id);

    expect(getResponse.body).toHaveProperty("user_id");
    expect(getResponse.body.user_id).toBe(creationResponse.body.user_id);

    expect(getResponse.body).toHaveProperty("description");
    expect(getResponse.body.description).toBe(statementCreationData.description);

    expect(getResponse.body).toHaveProperty("amount");
    expect(getResponse.body.amount).toBe(statementCreationData.amount);

    expect(getResponse.body).toHaveProperty("type");
    expect(getResponse.body.type).toBe("deposit");

    expect(getResponse.body).toHaveProperty("created_at");
    expect(getResponse.body.created_at).toBe(creationResponse.body.created_at);

    expect(getResponse.body).toHaveProperty("updated_at");
    expect(getResponse.body.updated_at).toBe(creationResponse.body.updated_at);
  });

  it("should be able to get a transfer statement operation", async () => {
    recipient_user = await createRecipientUser(connection);

    const recipientUserSession = await createUserSession(
      connection,
      recipient_user.email
    );

    const statementCreationData = {
      amount: 40,
      description: "test-transfer-statement",
    }

    const creationResponse = await request(app)
      .post(`/api/v1/statements/transfer/${recipient_user.id}`)
      .set({
        authorization: `bearer ${token}`
      })
      .send(statementCreationData);

    const { id } = creationResponse.body;

    const getResponse = await request(app)
      .get(`/api/v1/statements/${id}`)
      .set({
        authorization: `bearer ${recipientUserSession.token}`
      })
      .send();

    expect(getResponse.statusCode).toBe(200);

    expect(getResponse.body).toHaveProperty("id");
    expect(getResponse.body.id).toBe(id);

    expect(getResponse.body).toHaveProperty("user_id");
    expect(getResponse.body.user_id).toBe(creationResponse.body.user_id);

    expect(getResponse.body).toHaveProperty("sender_id");
    expect(getResponse.body.sender_id).toBeTruthy();

    expect(getResponse.body).toHaveProperty("description");
    expect(getResponse.body.description).toBe(statementCreationData.description);

    expect(getResponse.body).toHaveProperty("amount");
    expect(getResponse.body.amount).toBe(statementCreationData.amount);

    expect(getResponse.body).toHaveProperty("type");
    expect(getResponse.body.type).toBe("transfer");

    expect(getResponse.body).toHaveProperty("created_at");
    expect(getResponse.body.created_at).toBe(creationResponse.body.created_at);

    expect(getResponse.body).toHaveProperty("updated_at");
    expect(getResponse.body.updated_at).toBe(creationResponse.body.updated_at);
  });

  it("should not be able to get a statement operation that doesn't exist", async () => {
    const fakeId = "f8223c6e-ffe9-4389-9306-45fcd7364066";

    const response = await request(app)
      .get(`/api/v1/statements/${fakeId}`)
      .set({
        authorization: `bearer ${token}`,
      })
      .send();

    const statementNotFound = new GetStatementOperationError.StatementNotFound();
    const responseErrorMessage = response.body.message;


    expect(response.statusCode).toBe(404);
    expect(responseErrorMessage).toBe(statementNotFound.message);
  });
})