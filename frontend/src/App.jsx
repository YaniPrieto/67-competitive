import React, { useState } from 'react';
import { MainMenu } from './components/MainMenu';
import { QueueScreen } from './components/QueueScreen';
import { GameArena } from './components/GameArena';
import { Leaderboard } from './components/Leaderboard';
import { useGameStore } from './hooks/useGameStore';
import { useWebSocket } from './hooks/useHandTracking';
import { WS_URL } from './utils/network';
import './App.css';

function App() {
  const store = useGameStore();
  const [screen, setScreen] = useState('menu'); // menu, queue, game, leaderboard
  const [matchEndPayload, setMatchEndPayload] = useState(null);
  const [opponentCameraFrame, setOpponentCameraFrame] = useState(null);

  const { send: sendWS } = useWebSocket(WS_URL, handleWSMessage);

  function handleWSMessage(message) {
    const { type, payload } = message;

    switch (type) {
      case 'queue_joined':
        setScreen('queue');
        break;
      case 'match_found':
        setMatchEndPayload(null);
        setOpponentCameraFrame(null);
        store.setOpponent(payload.opponent);
        store.setMatchId(payload.matchId);
        store.setMatchState('countdown');
        store.setCountdown(payload.countdownSeconds);
        setScreen('game');
        break;
      case 'countdown':
        store.setCountdown(payload.seconds);
        break;
      case 'match_start':
        store.setMatchState('active');
        break;
      case 'score_update':
        store.updateScores(
          payload.player1Score,
          payload.player2Score,
          payload.player1Combo,
          payload.player2Combo
        );
        break;
      case 'match_timer':
        store.setMatchTimer(payload.remainingSeconds);
        break;
      case 'match_end':
        store.setMatchState('finished');
        store.setWinner(payload.winnerId);
        setMatchEndPayload(payload);
        break;
      case 'opponent_camera_frame':
        setOpponentCameraFrame({
          image: payload.image,
          receivedAt: Date.now()
        });
        break;
      case 'error':
        console.error('Server error:', payload.message);
        break;
      default:
        break;
    }
  }

  const handleStartGame = () => {
    // Player registered, show main menu
    setScreen('menu');
  };

  const handlePlayRanked = () => {
    // Send join queue message
    sendWS({
      type: 'join_queue',
      payload: {
        playerId: store.playerId,
        username: store.username,
        elo: store.elo
      }
    });
  };

  const handleCancelQueue = () => {
    sendWS({
      type: 'leave_queue',
      payload: { playerId: store.playerId }
    });
    setScreen('menu');
  };

  const handleViewLeaderboard = () => {
    setScreen('leaderboard');
  };

  const handleLeaderboardBack = () => {
    setScreen('menu');
  };

  const handleExitMatch = () => {
    setMatchEndPayload(null);
    setOpponentCameraFrame(null);
    store.resetMatch();
    setScreen('menu');
  };

  return (
    <div className="app">
      {screen === 'menu' && (
        <MainMenu
          onStartGame={handleStartGame}
          onPlayRanked={handlePlayRanked}
          onViewLeaderboard={handleViewLeaderboard}
        />
      )}

      {screen === 'queue' && (
        <QueueScreen
          onCancel={handleCancelQueue}
          wsUrl={WS_URL}
        />
      )}

      {screen === 'game' && (
        <GameArena
          wsUrl={WS_URL}
          onExit={handleExitMatch}
          matchEndPayload={matchEndPayload}
          opponentCameraFrame={opponentCameraFrame}
        />
      )}

      {screen === 'leaderboard' && (
        <Leaderboard onBack={handleLeaderboardBack} />
      )}
    </div>
  );
}

export default App;
