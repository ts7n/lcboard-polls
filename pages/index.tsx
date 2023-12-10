import { useEffect, useRef, useState } from 'react';
import { ArcElement, Chart as ChartJS, Legend, Tooltip } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import axios from 'axios';
import useSWR from 'swr';

const fetcher = (url: string) => axios.get(url).then(res => res.data);
ChartJS.register(ArcElement, Tooltip, Legend);

export default function Home() {
  const { data, error } = useSWR('/api/current', fetcher, { refreshInterval: 1000 });
  const [lastVote, setLastVote] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number>(10);
  const [aVotes, setAVotes] = useState<number>(0);
  const [bVotes, setBVotes] = useState<number>(0);
  const aRef = useRef<HTMLButtonElement>(null);
  const bRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    window.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'a' || e.key === 'ArrowLeft') {
        aRef.current?.click();
      } else if (e.key === 'd' || e.key === 'ArrowRight') {
        bRef.current?.click();
      }
    });
  }, []);

  useEffect(() => {
    setAVotes(data?.aVotes || 0);
    setBVotes(data?.bVotes || 0);
  }, [data]);

  const castVote = async (option: string) => {
    if (data.winner || lastVote) return;
    setCountdown(10);
    setLastVote(option);

    if (option === 'a') {
      setAVotes((prev) => prev + 1);
    } else {
      setBVotes((prev) => prev + 1);
    }

    await axios.post('/api/vote', { option });

    let secondsRemaining = 10;
    const doCount = () => {
      secondsRemaining -= 1;
      setCountdown(secondsRemaining);
      if (secondsRemaining === 0) {
        setLastVote(null);
      } else {
        setTimeout(doCount, 1000);
      }
    }
    setTimeout(doCount, 1000);
  }

  if (!data) return <h1 className="text-3xl">Loading...</h1>;

  return (
    <>
      <div className="flex justify-center gap-24 bg-black text-white text-center p-12">
        <div className="my-auto">
          <h1 className="text-4xl font-bold">What is your favorite Latin lunch?</h1>
          <p className="mt-1 text-lg font-mono text-gray-300">
            {data.winner ? <>
              We have a winner! 🎉🎉🎉 Thank you to everyone who participated!
            </> : <>
              {lastVote ? `You can vote again in ${countdown} seconds...` : 'Cast your vote by pressing the buttons below the screen!'}
            </>}
          </p>
          {!data.winner && <p className="mt-1 text-md font-mono text-gray-500">
            Organized by Latin's Tech Club
          </p>}

          {data.winner ? <div className="mt-5">
            <h3 className="font-bold text-4xl text-amber-400 text-glow">{data.winner} win!</h3>
          </div> : <div className="mt-5 flex gap-8 justify-center">
            {lastVote ? <>
              {lastVote === 'a' ? <>
                <button ref={aRef} disabled={true} className="ripple bg-green-500 text-xl px-9 py-4 rounded-lg">
                  {data.optionA} ({aVotes})
                </button>
              </> : <>
                <button ref={aRef} disabled={true} className="ripple bg-gray-700 text-xl px-9 py-4 rounded-lg">
                  {data.optionA} ({aVotes})
                </button>
              </>}
            </> : <>
              <button ref={aRef} onClick={() => castVote('a')} className="ripple bg-red-600 text-xl px-9 py-4 rounded-lg">
                {data.optionA} ({aVotes})
              </button>
            </>}

            {lastVote ? <>
              {lastVote === 'b' ? <>
                <button ref={aRef} disabled={true} className="ripple bg-green-500 text-xl px-9 py-4 rounded-lg">
                  {data.optionB} ({bVotes})
                </button>
              </> : <>
                <button ref={bRef} disabled={true} className="ripple bg-gray-700 text-xl px-9 py-4 rounded-lg">
                  {data.optionB} ({bVotes})
                </button>
              </>}
            </> : <>
              <button ref={bRef} onClick={() => castVote('b')} className="ripple bg-blue-700 text-xl px-9 py-4 rounded-lg">
                {data.optionB} ({bVotes})
              </button>
            </>}
          </div>}
        </div>

        {!data.winner && <div className="w-48 h-48">
          <Doughnut data={{
            labels: [data.optionA, data.optionB],
            datasets: [{
              data: [aVotes, bVotes],
              backgroundColor: ['red', 'blue'],
              hoverBackgroundColor: ['red', 'blue'],
              borderColor: 'white',
            }]
          }} options={{
            responsive: true,
            plugins: {
              legend: {
                labels: {
                  color: 'white',
                }
              }
            }
          }} />
        </div>}

      </div>
      <iframe className="h-full" src="https://challonge.com/favoritelatinlunchpreview/module" width="100%" frameBorder={0} allowTransparency />
    </>
  )
}
