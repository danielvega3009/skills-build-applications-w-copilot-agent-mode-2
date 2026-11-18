import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type Entry = { teamName: string; totalPoints: number; rank: number };

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    getJson<{ leaderboard: Entry[] }>('/api/leaderboard')
      .then((data) => setLeaderboard(data.leaderboard))
      .catch((cause: Error) => setError(cause.message))
      .finally(() => setLoading(false));
  }, []);
  return (
    <CapabilityCard title="Leaderboard" description="Compare team point totals." loading={loading} error={error} empty={leaderboard.length === 0} emptyText="No leaderboard scores">
      <ol className="list-group">
        {leaderboard.map((entry) => (
          <li className="list-group-item" key={entry.teamName}>Rank {entry.rank}: {entry.teamName} - {entry.totalPoints} points</li>
        ))}
      </ol>
    </CapabilityCard>
  );
}
