import create from 'zustand';

export const useGameStore = create((set) => ({
  // Player state
  player: null,
  playerId: null,
  username: null,
  elo: 1000,
  
  setPlayer: (player) => set({ player, playerId: player.id, username: player.username, elo: player.elo }),
  updateElo: (elo) => set({ elo }),

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
