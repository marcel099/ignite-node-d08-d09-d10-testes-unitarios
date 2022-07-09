import { Request, Response } from 'express';
import { container } from 'tsyringe';

import { Statement } from '../../entities/Statement';
import { CreateStatementUseCase } from './CreateStatementUseCase';

enum OperationType {
  DEPOSIT = 'deposit',
  WITHDRAW = 'withdraw',
  TRANSFER = 'transfer',
}

export class CreateStatementController {
  async execute(request: Request, response: Response) {
    const { id: user_id } = request.user;
    const { amount, description } = request.body;
    const { user_id: recipient_id } = request.params;

    const splittedPath = request.originalUrl.split('/')

    const statements_path_part_index = splittedPath.findIndex(path_part => path_part == 'statements')
    const type = splittedPath[statements_path_part_index + 1] as OperationType;

    const createStatement = container.resolve(CreateStatementUseCase);

    let statement: Statement;

    if (type === 'deposit' || type === 'withdraw') {
      statement = await createStatement.execute({
        user_id,
        type,
        amount,
        description,
      });
    }
    else {
      statement = await createStatement.execute({
        user_id: recipient_id,
        sender_id: user_id,
        type,
        amount,
        description,
      });
    }

    return response.status(201).json(statement);
  }
}
