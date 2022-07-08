import { hash } from "bcryptjs";
import { Connection } from "typeorm";
import { v4 as uuidV4} from "uuid";

export const defaultUserCreationData = {
  name: "test-name",
  email: "test@test.com",
  password: "test-password",
};

interface UserCreationData {
  name: string;
  email: string; 
  password: string;
}

export async function createUser(connection: Connection, userCreationData?: UserCreationData) {
  const {
    name,
    email,
    password
  } = userCreationData ?? defaultUserCreationData;

  const id = uuidV4();
  const hashedPassword = await hash(password, 8);

  await connection.query(`
    INSERT INTO users(id, name, email, password, created_at, updated_at)
    VALUES('${id}', '${name}', '${email}', '${hashedPassword}', now(), now());
  `);
}