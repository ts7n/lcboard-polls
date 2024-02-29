import type { NextApiRequest, NextApiResponse } from 'next';
import { kv } from '@vercel/kv';
import axios from 'axios';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const matches = (await axios.get('https://api.challonge.com/v1/tournaments/favoritelatinlunch/matches.json', {
    auth: {
      username: process.env.CHALLONGE_USERNAME!,
      password: process.env.CHALLONGE_API_KEY!
    }
  })).data.map((m: any) => m.match);

  const current = matches.sort((a: any, b: any) => a.round - b.round).find((match: any) => match.state === 'open');

  if(!current) {
    const winner = (await axios.get(`https://api.challonge.com/v1/tournaments/favoritelatinlunch/participants/${matches.at(-1).winner_id}.json`, {
      auth: {
        username: process.env.CHALLONGE_USERNAME!,
        password: process.env.CHALLONGE_API_KEY!
      }
    })).data.participant;

    return res.status(200).json({ winner: winner.name });
  }

  const aVotes = (await kv.get('a')) || 0;
  const bVotes = (await kv.get('b')) || 0;

  const participantA = (await axios.get(`https://api.challonge.com/v1/tournaments/favoritelatinlunch/participants/${current.player1_id}.json`, {
    auth: {
      username: process.env.CHALLONGE_USERNAME!,
      password: process.env.CHALLONGE_API_KEY!
    }
  })).data.participant;

  const participantB = (await axios.get(`https://api.challonge.com/v1/tournaments/favoritelatinlunch/participants/${current.player2_id}.json`, {
    auth: {
      username: process.env.CHALLONGE_USERNAME!,
      password: process.env.CHALLONGE_API_KEY!
    }
  })).data.participant;

  return res.status(200).json({
    optionA: participantA.name,
    optionB: participantB.name,
    aVotes,
    bVotes
  });
}