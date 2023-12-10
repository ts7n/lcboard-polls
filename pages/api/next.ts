import type { NextApiRequest, NextApiResponse } from 'next';
import { kv } from '@vercel/kv';
import axios from 'axios';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // @ts-ignore
  const authHeader = req.headers.get('Authorization');
  if (
    !process.env.CRON_SECRET ||
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return res.status(401).json({ success: false, msg: 'Unauthorized' });
  }

  // const now = new Date();
  // if (now.getUTCHours() < 15 || now.getUTCHours() > 20) {
  //   return res.status(200).json({ success: true, result: 'offline' });
  // }

  const current = (await axios.get('https://api.challonge.com/v1/tournaments/favoritelatinlunchpreview/matches.json', {
    auth: {
      username: process.env.CHALLONGE_USERNAME!,
      password: process.env.CHALLONGE_API_KEY!
    }
  })).data.map((m: any) => m.match).sort((a: any, b: any) => a.round - b.round).find((match: any) => match.state === 'open');

  if ((await kv.get('a')) === (await kv.get('b'))) {
    return res.status(200).json({ success: true, result: 'tie' });
  }

  await axios.put(`https://api.challonge.com/v1/tournaments/favoritelatinlunchpreview/matches/${current.id}.json`, {}, {
    params: {
      'match[scores_csv]': `"${await kv.get('a')}-${await kv.get('b')}"`,
      'match[winner_id]': (await kv.get('a'))! > (await kv.get('b'))! ? current.player1_id : current.player2_id
    },
    auth: {
      username: process.env.CHALLONGE_USERNAME!,
      password: process.env.CHALLONGE_API_KEY!
    }
  });

  const next = (await axios.get('https://api.challonge.com/v1/tournaments/favoritelatinlunchpreview/matches.json', {
    auth: {
      username: process.env.CHALLONGE_USERNAME!,
      password: process.env.CHALLONGE_API_KEY!
    }
  })).data.map((m: any) => m.match).sort((a: any, b: any) => a.round - b.round).find((match: any) => match.state === 'open');

  if(next) {
    await axios.post(`https://api.challonge.com/v1/tournaments/favoritelatinlunchpreview/matches/${next.id}/mark_as_underway.json`, {}, {
      auth: {
        username: process.env.CHALLONGE_USERNAME!,
        password: process.env.CHALLONGE_API_KEY!
      }
    });
  }

  await kv.set('a', 0);
  await kv.set('b', 0);

  return res.status(200).json({ success: true, result: 'advance' });
}