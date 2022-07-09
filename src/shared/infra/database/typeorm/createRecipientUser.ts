import { User } from "../../../../modules/users/entities/User";
import { createUser } from "./createUser";
import { Connection } from "typeorm";

export async function createRecipientUser(connection: Connection): Promise<User> {
  const recipientUserCreationData = {
    name: "recipient-test-name",
    email: "recipient-test@test.com",
    password: "fake-password",
  }

  const user = await createUser(connection, recipientUserCreationData);

  return user;
}