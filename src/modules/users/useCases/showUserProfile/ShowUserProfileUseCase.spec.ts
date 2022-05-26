import bcrypt from "bcryptjs";

import { InMemoryUsersRepository } from "../../repositories/in-memory/InMemoryUsersRepository";
import { CreateUserUseCase } from "../createUser/CreateUserUseCase";
import { ShowUserProfileError } from "./ShowUserProfileError";
import { ShowUserProfileUseCase } from "./ShowUserProfileUseCase";

let inMemoryUsersRepository: InMemoryUsersRepository;
let showUserProfileUseCase: ShowUserProfileUseCase;
let createUserUseCase: CreateUserUseCase;

describe("Show User Profile", () => {
  beforeEach(async () => {
    inMemoryUsersRepository = new InMemoryUsersRepository();
    showUserProfileUseCase = new ShowUserProfileUseCase(
      inMemoryUsersRepository
    );
  });

  it("should be able to get a user profile", async () => {
    createUserUseCase = new CreateUserUseCase(
      inMemoryUsersRepository
    );

    const encryptedPassword = "fake-encrypted-password";

    jest.spyOn(bcrypt, "hash").mockImplementation(
      () => Promise.resolve(encryptedPassword)
    );

    const userCreationData = {
      name: "test-name",
      email: "test@test.com",
      password: "fake-password",
    };

    const createdUser = await createUserUseCase.execute(userCreationData);

    const user = await showUserProfileUseCase.execute(createdUser.id as string);

    expect(user).toHaveProperty("id");
    expect(user.id).toBeTruthy();

    expect(user).toHaveProperty("name");
    expect(user.name).toBe(userCreationData.name);

    expect(user).toHaveProperty("email");
    expect(user.email).toBe(userCreationData.email);

    expect(user).toHaveProperty("password");
    expect(user.password).toBe(encryptedPassword);
  });

  it("should not be able to get the user profile of a user that doesn't exist", async () => {
    expect(
      showUserProfileUseCase.execute("fake-id")
    ).rejects.toEqual(new ShowUserProfileError());
  })
});