import request from "supertest";
import { Connection } from "typeorm";
import { app } from "../../../../app";

import createConnection from "../../../../database";
import { createUser, defaultUserCreationData } from "../../../../shared/infra/database/typeorm/createUser";
import { IncorrectEmailOrPasswordError } from "./IncorrectEmailOrPasswordError";

let connection: Connection;

describe("Authenticate User Controller", () => {
  beforeAll(async () => {
    connection = await createConnection("localhost");
    await connection.runMigrations();

    await createUser(connection);
  });

  afterAll(async () => {
    await connection.dropDatabase();
    await connection.close();
  });

  it("should be able to authenticate a user and return a token in response", async () => {
    const sessionCreationData = {
      email: defaultUserCreationData.email,
      password: defaultUserCreationData.password,
    };

    const response = await request(app)
      .post("/api/v1/sessions")
      .send(sessionCreationData);

    expect(response.statusCode).toBe(200);

    expect(response.body).toHaveProperty("user");

    expect(response.body.user).toHaveProperty("id");
    expect(response.body.user.id).toBeTruthy();

    expect(response.body.user).toHaveProperty("name");
    expect(response.body.user.name).toBe(defaultUserCreationData.name);

    expect(response.body.user).toHaveProperty("email");
    expect(response.body.user.email).toBe(defaultUserCreationData.email);

    expect(response.body).toHaveProperty("token");
    expect(response.body.token).toBeTruthy();
  });

  it("should not be able to authenticate a user that doesn't exist", async () => {
    const sessionCreationData = {
      email: "fake-email",
      password: defaultUserCreationData.password,
    };

    const response = await request(app)
      .post("/api/v1/sessions")
      .send(sessionCreationData);

    const responseErrorMessage = response.body.message;
    const incorrectEmailOrPasswordError =
      new IncorrectEmailOrPasswordError();

    expect(response.statusCode).toBe(401);
    expect(responseErrorMessage)
      .toBe(incorrectEmailOrPasswordError.message);
  });

  it("should not be able to authenticate a user with an incorrect password given", async () => {
    const sessionCreationData = {
      email: defaultUserCreationData.email,
      password: "fake-password",
    };

    const response = await request(app)
      .post("/api/v1/sessions")
      .send(sessionCreationData);

    const responseErrorMessage = response.body.message;
    const incorrectEmailOrPasswordError =
      new IncorrectEmailOrPasswordError();

    expect(response.statusCode).toBe(401);
    expect(responseErrorMessage)
      .toBe(incorrectEmailOrPasswordError.message);
  });
});
