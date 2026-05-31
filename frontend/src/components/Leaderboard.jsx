import React, { useState } from 'react';
import { api } from '../utils/api';
import '../styles/Leaderboard.css';

export const Leaderboard = ({ onBack }) => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('global');

  React.useEffect(() => {
    fetchLeaderboard();
  }, [filter]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const data = await api.getLeaderboard();
      setLeaderboard(data);
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="leaderboard">
      <div className="leaderboard-container">
        <button onClick={onBack} className="back-btn">← Back</button>

        <h1>Global Rankings</h1>

        <div className="filter-tabs">
          <button
            className={`tab ${filter === 'global' ? 'active' : ''}`}
            onClick={() => setFilter('global')}
          >
            Global
          </button>
          <button
            className={`tab ${filter === 'weekly' ? 'active' : ''}`}
            onClick={() => setFilter('weekly')}
          >
            Weekly
          </button>
          <button
            className={`tab ${filter === 'monthly' ? 'active' : ''}`}
            onClick={() => setFilter('monthly')}
          >
            Monthly
          </button>
        </div>

        {loading ? (
          <div className="loading">Loading rankings...</div>
        ) : (
          <div className="ranking-list">
            {leaderboard.map((player, idx) => (
              <div key={player.id} className="ranking-row">
                <div className="rank">
                  {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                </div>
                <div className="player-name">{player.username}</div>
                <div className="tier">{getTier(player.elo)}</div>
                <div className="elo">{player.elo}</div>
                <div className="stats">
                  <span>W: {player.wins}</span>
                  <span>L: {player.losses}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

function getTier(elo) {
  if (elo < 1200) return 'Bronze';
  if (elo < 1400) return 'Silver';
  if (elo < 1600) return 'Gold';
  if (elo < 1800) return 'Platinum';
  return 'Diamond';
}
