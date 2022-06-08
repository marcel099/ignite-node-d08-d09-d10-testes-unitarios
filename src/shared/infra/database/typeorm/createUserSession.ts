import { sign } from "jsonwebtoken";
import { Connection } from "typeorm";

import authConfig from '../../../../config/auth';
import { userCreationData } from "./createUser";

export async function createUserSession(connection: Connection) {
  const queryResponse = await connection.query(`
    SELECT *
    FROM users
    WHERE email = '${userCreationData.email}';
  `);

  const user = queryResponse[0];

  const { expiresIn } = authConfig.jwt;
  const secret = process.env.JWT_SECRET as string;

  const token = sign({ user }, secret, {
    subject: user.id,
    expiresIn,
  });

  return {
    token
  }
}