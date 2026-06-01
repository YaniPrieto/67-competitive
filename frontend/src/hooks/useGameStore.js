import { create } from 'zustand';

const PLAYER_STORAGE_KEY = 'gestureBattlePlayer';

const loadStoredPlayer = () => {
  try {
    const rawPlayer = window.localStorage.getItem(PLAYER_STORAGE_KEY);
    return rawPlayer ? JSON.parse(rawPlayer) : null;
  } catch (error) {
    return null;
  }
};

const saveStoredPlayer = (player) => {
  try {
    if (player) {
      window.localStorage.setItem(PLAYER_STORAGE_KEY, JSON.stringify(player));
    } else {
      window.localStorage.removeItem(PLAYER_STORAGE_KEY);
    }
  } catch (error) {
    // Storage can be unavailable in private browsing; keep in-memory state working.
  }
};

const storedPlayer = loadStoredPlayer();

export const useGameStore = create((set) => ({
  // Player state
  player: storedPlayer,
  playerId: storedPlayer?.id || null,
  username: storedPlayer?.username || null,
  elo: storedPlayer?.elo || 1000,
  
  setPlayer: (player) => {
    saveStoredPlayer(player);
    set({ player, playerId: player.id, username: player.username, elo: player.elo });
  },
  updateElo: (elo) => set((state) => {
    const player = state.player ? { ...state.player, elo } : state.player;
    saveStoredPlayer(player);
    return { player, elo };
  }),
  logout: () => {
    saveStoredPlayer(null);
    set({ player: null, playerId: null, username: null, elo: 1000 });
  },

  // Match state
  matchId: null,
  matchState: 'idle', // idle, queuing, countdown, active, finished
  player1Score: 0,
  player2Score: 0,
  player1Combo: 0,
  player2Combo: 0,
  matchTimer: 60,
  countdownSeconds: 3,
  opponentId: null,
  winnerId: null,

  setMatchId: (matchId) => set({ matchId }),
  setMatchState: (matchState) => set({ matchState }),
  setCountdown: (countdownSeconds) => set({ countdownSeconds }),
  setMatchTimer: (matchTimer) => set({ matchTimer }),
  updateScores: (player1Score, player2Score, player1Combo, player2Combo) => 
    set({ player1Score, player2Score, player1Combo, player2Combo }),
  setOpponent: (opponentId) => set({ opponentId }),
  setWinner: (winnerId) => set({ winnerId }),

  // UI state
  showWebcam: true,
  showFeedback: false,
  feedbackMessage: '',
  feedbackColor: 'green',

  setShowWebcam: (show) => set({ showWebcam: show }),
  setFeedback: (message, color = 'green') => set({ feedbackMessage: message, feedbackColor: color, showFeedback: true }),
  clearFeedback: () => set({ showFeedback: false }),

  // Hand visibility
  leftHandVisible: false,
  rightHandVisible: false,
  setHandVisibility: (left, right) => set({ leftHandVisible: left, rightHandVisible: right }),

  // Reset match
  resetMatch: () => set({
    matchId: null,
    matchState: 'idle',
    player1Score: 0,
    player2Score: 0,
    player1Combo: 0,
    player2Combo: 0,
    matchTimer: 60,
    countdownSeconds: 3,
    opponentId: null,
    winnerId: null
  })
}));
