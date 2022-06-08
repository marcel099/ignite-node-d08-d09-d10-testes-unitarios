import { hash } from "bcryptjs";
import { Connection } from "typeorm";
import { v4 as uuidV4} from "uuid";

export const userCreationData = {
  name: "test-name",
  email: "test@test.com",
  password: "test-password",
};

export async function createUser(connection: Connection) {
  const {
    name,
    email,
    password
  } = userCreationData;

  const id = uuidV4();
  const hashedPassword = await hash(password, 8);

  await connection.query(`
    INSERT INTO users(id, name, email, password, created_at, updated_at)
    VALUES('${id}', '${name}', '${email}', '${hashedPassword}', now(), now());
  `);
}