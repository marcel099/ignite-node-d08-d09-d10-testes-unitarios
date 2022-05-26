import bcrypt from 'bcryptjs';

import { InMemoryUsersRepository } from "../../repositories/in-memory/InMemoryUsersRepository";
import { CreateUserError } from './CreateUserError';
import { CreateUserUseCase } from "./CreateUserUseCase";

let inMemoryUsersRepository: InMemoryUsersRepository;
let createUserUseCase: CreateUserUseCase;

const encryptedPassword = "fake-encrypted-password";

let hashMocked: jest.SpyInstance;

describe("Create User", () => {
  beforeEach(async () => {
    inMemoryUsersRepository = new InMemoryUsersRepository();
    createUserUseCase = new CreateUserUseCase(
      inMemoryUsersRepository
    );

    hashMocked = jest.spyOn(bcrypt, "hash").mockImplementation(
      () => Promise.resolve(encryptedPassword)
    );
  });

  it("should be able to create an user", async () => {    
    const userCreationData = {
      name: "test-name",
      email: "test@test.com",
      password: "fake-password",
    };

    const user = await createUserUseCase.execute(userCreationData);

    expect(user).toHaveProperty("id");
    expect(user.id).toBeTruthy();

    expect(user).toHaveProperty("name");
    expect(user.name).toBe(userCreationData.name);

    expect(user).toHaveProperty("email");
    expect(user.email).toBe(userCreationData.email);

    expect(user).toHaveProperty("password");
    expect(user.password).toBe(encryptedPassword);

    expect(hashMocked).toHaveBeenCalled();
  });

  it("should not be able to create an user if another user with the same email already exists", async () => {
    const user1CreationData = {
      name: "test-name-1",
      email: "repeated_test_email@test.com",
      password: "fake-password",
    };

    inMemoryUsersRepository.create(user1CreationData);

    const user2CreationData = {
      name: "test-name-2",
      email: "repeated_test_email@test.com",
      password: "fake-password",
    };

    await expect(
      createUserUseCase.execute(user2CreationData)
    ).rejects.toEqual(new CreateUserError());
  });
})
