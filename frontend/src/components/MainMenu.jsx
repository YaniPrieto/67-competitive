import React, { useEffect, useState } from 'react';
import { useGameStore } from '../hooks/useGameStore';
import { api } from '../utils/api';
import { getTierByElo } from '../utils/constants';
import '../styles/MainMenu.css';

export const MainMenu = ({ onStartGame, onPlayRanked, onViewLeaderboard }) => {
  const store = useGameStore();
  const { playerId, elo, updateElo, logout } = store;
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [authMode, setAuthMode] = useState('login');
  const [error, setError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [profileStats, setProfileStats] = useState(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  useEffect(() => {
    if (!playerId) {
      setProfileStats(null);
      return;
    }

    let isCurrent = true;

    const loadPlayerStats = async () => {
      try {
        setIsLoadingStats(true);
        const stats = await api.getPlayerRank(playerId);

        if (!isCurrent) return;

        setProfileStats(stats);
        if (typeof stats.elo === 'number' && stats.elo !== elo) {
          updateElo(stats.elo);
        }
      } catch (err) {
        if (isCurrent) {
          if (err.message.includes('404')) {
            logout();
            setProfileStats(null);
            setError('Your saved session expired. Please login or register again.');
          } else {
            console.error('Failed to load profile stats:', err);
          }
        }
      } finally {
        if (isCurrent) {
          setIsLoadingStats(false);
        }
      }
    };

    loadPlayerStats();

    return () => {
      isCurrent = false;
    };
  }, [playerId, elo, updateElo, logout]);

  const handleAnonymousLogin = async () => {
    try {
      setIsLoggingIn(true);
      setError('');
      const player = await api.loginAnonymous();
      store.setPlayer(player);
      onStartGame();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handlePasswordAuth = async () => {
    if (!usernameInput.trim()) {
      setError('Enter a username');
      return;
    }

    if (passwordInput.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      setIsLoggingIn(true);
      setError('');
      const player = authMode === 'login'
        ? await api.loginPlayer(usernameInput.trim(), passwordInput)
        : await api.registerPlayer(usernameInput.trim(), passwordInput);

      store.setPlayer(player);
      onStartGame();
    } catch (err) {
      if (err.message.includes('401')) {
        setError('Invalid username or password');
      } else if (err.message.includes('409')) {
        setError('Username already taken');
      } else {
        setError(err.message);
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  if (!store.player) {
    return (
      <div className="main-menu">
        <div className="menu-container">
          <h1 className="game-title">⚡ Gesture Battle ⚡</h1>
          <p className="subtitle">Master the rhythm. Feel the flow. Dominate the arena.</p>

          <div className="registration-box">
            <h2>Enter the Arena</h2>
            <div className="auth-tabs">
              <button
                className={authMode === 'login' ? 'active' : ''}
                onClick={() => {
                  setAuthMode('login');
                  setError('');
                }}
              >
                Login
              </button>
              <button
                className={authMode === 'register' ? 'active' : ''}
                onClick={() => {
                  setAuthMode('register');
                  setError('');
                }}
              >
                Register
              </button>
            </div>
            <input
              type="text"
              placeholder="Username"
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handlePasswordAuth()}
              className="username-input"
            />
            <input
              type="password"
              placeholder="Password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handlePasswordAuth()}
              className="username-input"
            />
            {error && <div className="error-message">{error}</div>}
            <button onClick={handlePasswordAuth} className="register-btn" disabled={isLoggingIn}>
              {isLoggingIn
                ? 'Entering...'
                : authMode === 'login' ? 'Login' : 'Create Account'}
            </button>
            <div className="auth-divider">or</div>
            <button onClick={handleAnonymousLogin} className="register-btn" disabled={isLoggingIn}>
              Continue as Guest
            </button>
          </div>

          <div className="info-section">
            <h3>How to Play</h3>
            <ol>
              <li>Hold both palms facing up</li>
              <li>Alternately move hands up and down</li>
              <li>Left up ↑ + Right down ↓</li>
              <li>Then Left down ↓ + Right up ↑</li>
              <li>Repeat continuously for points</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  const displayedElo = profileStats?.elo ?? store.elo;
  const displayedRank = profileStats?.rank ? `#${profileStats.rank}` : (isLoadingStats ? '...' : 'Unranked');
  const displayedTier = profileStats?.tier ?? getTierByElo(displayedElo);

  return (
    <div className="main-menu">
      <div className="menu-container">
        <div className="player-profile">
          <h2>Welcome, {store.username}!</h2>
          <div className="profile-stats">
            <div className="stat">
              <span className="label">ELO</span>
              <span className="value">{displayedElo}</span>
            </div>
            <div className="stat">
              <span className="label">Rank</span>
              <span className="value">{displayedRank}</span>
            </div>
            <div className="stat">
              <span className="label">Tier</span>
              <span className="value">{displayedTier}</span>
            </div>
          </div>
        </div>

        <div className="menu-buttons">
          <button onClick={onPlayRanked} className="btn btn-primary">
            🎮 Play Ranked
          </button>
          <button onClick={onViewLeaderboard} className="btn btn-secondary">
            📊 Leaderboard
          </button>
          <button className="btn btn-secondary">
            ⚙️ Settings
          </button>
        </div>

        <div className="tips-section">
          <h3>🎯 Tips for Success</h3>
          <ul>
            <li>Keep your palms visible to the camera</li>
            <li>Maintain a steady rhythm for combo multipliers</li>
            <li>Faster, more accurate gestures = higher scores</li>
            <li>Stay calm under pressure</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
