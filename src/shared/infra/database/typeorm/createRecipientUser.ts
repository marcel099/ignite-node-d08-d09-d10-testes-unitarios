import { User } from "../../../../modules/users/entities/User";
import { createUser } from "./createUser";
import { Connection } from "typeorm";

export async function createRecipientUser(connection: Connection): Promise<User> {
  const recipientUserCreationData = {
    name: "recipient-test-name",
    email: "recipient-test@test.com",
    password: "fake-password",
  }

  await createUser(connection, recipientUserCreationData);

  const queryResponse = await connection.query(`
    SELECT *
    FROM users
    WHERE users.email = '${recipientUserCreationData.email}';
  `);

  const user = queryResponse[0];

  return user;
}