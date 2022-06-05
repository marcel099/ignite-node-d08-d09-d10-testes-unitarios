import request from "supertest";
import { Connection } from "typeorm";

import { app } from "../../../../app";
import createConnection from "../../../../database";
import { CreateUserError } from "./CreateUserError";

let connection: Connection;

const userCreationData = {
  name: "test-name",
  email: "test@test.com",
  password: "fake-password",
};

describe("Create User Controller", () => {
  beforeAll(async () => {
    connection = await createConnection("localhost");
    await connection.runMigrations();
  });

  afterAll(async () => {
    await connection.dropDatabase();
    await connection.close();
  });

  it("should be able to create a user", async () => {
    const response = await request(app)
      .post("/api/v1/users")
      .send(userCreationData);

    expect(response.status).toBe(201);
  });

  it("should not be able to create a user if another user with the same email already exists", async () => {
    const response = await request(app)
      .post("/api/v1/users")
      .send(userCreationData);

    const responseErrorMessage = JSON.parse(response?.text).message;
    const createUserErrorMessage = new CreateUserError().message;
    
    expect(response.status).toBe(400);
    expect(responseErrorMessage).toBe(createUserErrorMessage)
  });
})
