import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { InMemoryUsersRepository } from "../../repositories/in-memory/InMemoryUsersRepository";
import { AuthenticateUserUseCase } from "./AuthenticateUserUseCase";
import { IncorrectEmailOrPasswordError } from "./IncorrectEmailOrPasswordError";

let inMemoryUsersRepository: InMemoryUsersRepository;
let authenticateUserUseCase: AuthenticateUserUseCase;

let compareMocked: jest.SpyInstance;
let signMocked: jest.SpyInstance;

const tokenValue = "fake-token";

const userCreationData = {
  name: 'test-name',
  email: "test@test.com",
  password: "fake-password",
};

describe("Authenticate User", () => {
  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository();
    authenticateUserUseCase = new AuthenticateUserUseCase(
      inMemoryUsersRepository
    );

    compareMocked = jest.spyOn(bcrypt, "compare").mockImplementation(
      () => Promise.resolve(true)
    );

    signMocked = jest.spyOn(jwt, "sign").mockImplementation(
      () => tokenValue
    );
  });

  it("should be able to authenticate a user and return a token in response", async () => {
    await inMemoryUsersRepository.create(userCreationData);

    const userAuthenticationData = {
      email: userCreationData.email,
      password: userCreationData.password,
    };

    const authenticationData = await authenticateUserUseCase.execute(userAuthenticationData);

    expect(authenticationData).toHaveProperty("user");

    expect(authenticationData.user).toHaveProperty("id");
    expect(authenticationData.user.id).toBeTruthy();

    expect(authenticationData.user).toHaveProperty("name");
    expect(authenticationData.user.name).toBe(userCreationData.name);

    expect(authenticationData.user).toHaveProperty("email");
    expect(authenticationData.user.email).toBe(userCreationData.email);

    expect(authenticationData).toHaveProperty("token");
    expect(authenticationData.token).toBe(tokenValue);

    expect(compareMocked).toHaveBeenCalled();
    expect(signMocked).toHaveBeenCalled();
  });

  it("should not be able to authenticate a user that doesn't exist", async () => {
    const userAuthenticationData = {
      email: userCreationData.email,
      password: userCreationData.password,
    };

    expect(
      authenticateUserUseCase.execute(userAuthenticationData)
    ).rejects.toEqual(new IncorrectEmailOrPasswordError());
  });

  it("should not be able to authenticate a user with an incorrect password given", async () => {
    compareMocked.mockReset().mockImplementation(
      () => Promise.resolve(false)
    );

    await inMemoryUsersRepository.create(userCreationData);

    const userAuthenticationData = {
      email: userCreationData.email,
      password: userCreationData.password,
    };

    expect(
      authenticateUserUseCase.execute(userAuthenticationData)
    ).rejects.toEqual(new IncorrectEmailOrPasswordError());
  });
});