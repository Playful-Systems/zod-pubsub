import { query } from '@/database';
import { eventsPubSub } from '@/handlers';
import { NextApiRequest, NextApiResponse } from 'next';
import SQL from 'sql-template-strings';
import { z } from 'zod';

const messagesSchema = z.array(eventsPubSub.schemas.newMessage)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const result = await query(SQL`
    SELECT * FROM messages
  `);
  const messages = await messagesSchema.parseAsync(result);
  res.status(200).json(messages);
}