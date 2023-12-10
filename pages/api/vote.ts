import type { NextApiRequest, NextApiResponse } from 'next';
import { kv } from '@vercel/kv';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await kv.incr(req.body.option);
  return res.status(200).json({ success: true });
}