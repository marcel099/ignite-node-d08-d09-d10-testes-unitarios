import request from "supertest";
import { Connection } from "typeorm";
import { app } from "../../../../app";

import createConnection from "../../../../database";
import { userCreationData, createUser } from "../../../../shared/infra/database/typeorm/createUser";
import { createUserSession } from "../../../../shared/infra/database/typeorm/createUserSession";

let connection: Connection, token: string;

describe("Show User Profile Controller", () => {
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

  it("should be able to get a user profile", async () => {
    const response = await request(app)
      .get("/api/v1/profile")
      .set({
        authorization: `bearer ${token}`
      });
    
    expect(response.statusCode).toBe(200);

    expect(response.body).toHaveProperty("id");
    expect(response.body.id).toBeTruthy();

    expect(response.body).toHaveProperty("name");
    expect(response.body.name).toBe(userCreationData.name);

    expect(response.body).toHaveProperty("email");
    expect(response.body.email).toBe(userCreationData.email);

    expect(response.body).toHaveProperty("created_at");
    expect(response.body.created_at).toBeTruthy();

    expect(response.body).toHaveProperty("updated_at");
    expect(response.body.updated_at).toBeTruthy();
  });
});
