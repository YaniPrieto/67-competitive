const { v4: uuidv4 } = require('uuid');
const Player = require('../models/Player');
const Match = require('../models/Match');
const GestureDetector = require('./GestureDetector');

/**
 * Manages active game rooms and multiplayer matches
 */
class GameManager {
  constructor(wss) {
    this.wss = wss;
    this.matchQueue = [];
    this.activeMatches = new Map(); // matchId -> Match instance
    this.playerSessions = new Map(); // playerId -> { ws, matchId, sessionId }
  }

  /**
   * Handle incoming WebSocket message
   */
  async handleMessage(ws, message) {
    const { type, payload } = message;

    try {
      switch (type) {
        case 'join_queue':
          await this.handleJoinQueue(ws, payload);
          break;
        case 'leave_queue':
          await this.handleLeaveQueue(ws, payload);
          break;
        case 'gesture_detected':
          await this.handleGestureDetected(ws, payload);
          break;
        case 'match_frame_data':
          await this.handleFrameData(ws, payload);
          break;
        case 'camera_frame':
          await this.handleCameraFrame(ws, payload);
          break;
        case 'match_end':
          await this.handleMatchEnd(ws, payload);
          break;
        default:
          console.warn('Unknown message type:', type);
      }
    } catch (error) {
      console.error('Error handling message:', error);
      ws.send(JSON.stringify({ type: 'error', payload: { message: error.message } }));
    }
  }

  /**
   * Player joins matchmaking queue
   */
  async handleJoinQueue(ws, payload) {
    const { playerId, username, elo } = payload;

    // Create or validate player
    let player = await Player.getById(playerId);
    if (!player) {
      player = await Player.create(username);
    }

    // Store session
    const sessionId = uuidv4();
    this.playerSessions.set(playerId, {
      ws,
      sessionId,
      elo: player.elo,
      queuedAt: Date.now()
    });

    this.matchQueue.push({
      playerId,
      sessionId,
      elo: player.elo,
      joinedAt: Date.now()
    });

    ws.send(JSON.stringify({
      type: 'queue_joined',
      payload: { queuePosition: this.matchQueue.length, sessionId }
    }));

    // Try to find match
    this.tryMatchmake();
  }

  /**
   * Matchmaking algorithm - finds closest ELO players
   */
  tryMatchmake() {
    if (this.matchQueue.length < 2) {
      console.log(`Queue size: ${this.matchQueue.length}`);
      return;
    }

    console.log(`Attempting to match from queue of ${this.matchQueue.length} players`);

    // Validate queue entries before matching
    for (let i = 0; i < Math.min(2, this.matchQueue.length); i++) {
      const player = this.matchQueue[i];
      console.log(`Queue[${i}]:`, JSON.stringify(player));
      if (!player || !player.playerId) {
        console.error(`[ERROR] Invalid queue entry at index ${i}:`, player);
        // Remove invalid entries
        this.matchQueue.splice(i, 1);
        return;
      }
    }

    // Take first 2 players in queue (simpler)
    const player1 = this.matchQueue.shift();
    const player2 = this.matchQueue.shift();

    console.log(`Matching players: ${player1.playerId} vs ${player2.playerId}`);
    this.createMatch(player1, player2);
  }

  /**
   * Create and start a match
   */
  async createMatch(player1Queue, player2Queue) {
    const match = await Match.create(player1Queue.playerId, player2Queue.playerId, 60);
    
    const matchData = {
      id: match.id,
      player1: {
        id: player1Queue.playerId,
        sessionId: player1Queue.sessionId,
        score: 0,
        combo: 0
      },
      player2: {
        id: player2Queue.playerId,
        sessionId: player2Queue.sessionId,
        score: 0,
        combo: 0
      },
      startTime: Date.now(),
      duration: 60000,
      state: 'countdown',
      countdownSeconds: 3
    };

    this.activeMatches.set(match.id, matchData);

    // Notify both players
    const p1Session = this.playerSessions.get(player1Queue.playerId);
    const p2Session = this.playerSessions.get(player2Queue.playerId);

    console.log(`Creating match ${match.id}`);
    console.log(`P1 Session exists: ${!!p1Session}, WS ready: ${p1Session?.ws?.readyState === 1}`);
    console.log(`P2 Session exists: ${!!p2Session}, WS ready: ${p2Session?.ws?.readyState === 1}`);

    if (p1Session?.ws) {
      p1Session.matchId = match.id;
      const msg = JSON.stringify({
        type: 'match_found',
        payload: { matchId: match.id, opponent: player2Queue.playerId, countdownSeconds: 3 }
      });
      console.log(`Sending match_found to P1: ${msg}`);
      p1Session.ws.send(msg);
    }

    if (p2Session?.ws) {
      p2Session.matchId = match.id;
      const msg = JSON.stringify({
        type: 'match_found',
        payload: { matchId: match.id, opponent: player1Queue.playerId, countdownSeconds: 3 }
      });
      console.log(`Sending match_found to P2: ${msg}`);
      p2Session.ws.send(msg);
    }

    // Start countdown
    this.startCountdown(match.id);
  }

  /**
   * Start pre-match countdown
   */
  startCountdown(matchId) {
    const match = this.activeMatches.get(matchId);
    if (!match) return;

    const countdownInterval = setInterval(() => {
      match.countdownSeconds--;

      // Broadcast countdown
      this.broadcastToMatch(matchId, {
        type: 'countdown',
        payload: { seconds: match.countdownSeconds }
      });

      if (match.countdownSeconds <= 0) {
        clearInterval(countdownInterval);
        match.state = 'active';
        match.startTime = Date.now();
        match.endTime = Date.now() + match.duration;

        this.broadcastToMatch(matchId, {
          type: 'match_start',
          payload: { durationSeconds: 60 }
        });

        // Start match timer
        this.startMatchTimer(matchId);
      }
    }, 1000);
  }

  /**
   * Start match timer and auto-end match
   */
  startMatchTimer(matchId) {
    const match = this.activeMatches.get(matchId);
    if (!match) return;

    const timerInterval = setInterval(() => {
      const elapsed = Date.now() - match.startTime;
      const remaining = Math.max(0, match.duration - elapsed);

      this.broadcastToMatch(matchId, {
        type: 'match_timer',
        payload: { remainingSeconds: Math.ceil(remaining / 1000) }
      });

      if (remaining <= 0) {
        clearInterval(timerInterval);
        this.endMatch(matchId).catch((error) => {
          console.error(`[startMatchTimer] Failed to end match ${matchId}:`, error);
        });
      }
    }, 100);
  }

  /**
   * Handle gesture detection from player
   */
  async handleGestureDetected(ws, payload) {
    const { playerId, matchId, confidence, gestureType } = payload;
    const session = this.playerSessions.get(playerId);

    if (!session || !matchId) return;

    const match = this.activeMatches.get(matchId);
    if (!match || match.state !== 'active') return;
    if (gestureType && gestureType !== 'six_seven_set') return;

    // Determine which player
    const isPlayer1 = match.player1.id === playerId;
    const playerKey = isPlayer1 ? 'player1' : 'player2';

    const points = 1;

    match[playerKey].score += points;
    match[playerKey].combo++;

    // Broadcast score update
    this.broadcastToMatch(matchId, {
      type: 'score_update',
      payload: {
        player1Score: match.player1.score,
        player2Score: match.player2.score,
        player1Combo: match.player1.combo,
        player2Combo: match.player2.combo
      }
    });

    // Send positive feedback
    ws.send(JSON.stringify({
      type: 'gesture_accepted',
      payload: { points, newCombo: match[playerKey].combo }
    }));
  }

  /**
   * Handle frame data (not used for scoring, just for validation)
   */
  async handleFrameData(ws, payload) {
    // Can be used for additional anti-cheat validation
    // For now, just acknowledge
  }

  async handleCameraFrame(ws, payload) {
    const { playerId, matchId, image } = payload;
    if (!playerId || !matchId || typeof image !== 'string') return;
    if (image.length > 150000) return;

    const session = this.playerSessions.get(playerId);
    const match = this.activeMatches.get(matchId);
    if (!session || !match || session.matchId !== matchId) return;

    const opponentId = match.player1.id === playerId ? match.player2.id : match.player1.id;
    const opponentSession = this.playerSessions.get(opponentId);

    if (opponentSession?.ws && opponentSession.ws.readyState === 1) {
      opponentSession.ws.send(JSON.stringify({
        type: 'opponent_camera_frame',
        payload: {
          playerId,
          image,
          sentAt: Date.now()
        }
      }));
    }
  }

  /**
   * End match and calculate ELO changes
   */
  async endMatch(matchId) {
    const match = this.activeMatches.get(matchId);
    if (!match || match.state === 'completed') return;

    match.state = 'completed';

    // Determine winner
    let winnerId = null;
    if (match.player1.score > match.player2.score) {
      winnerId = match.player1.id;
    } else if (match.player2.score > match.player1.score) {
      winnerId = match.player2.id;
    }

    let player1 = null;
    let player2 = null;
    let eloChange1 = 0;
    let eloChange2 = 0;

    try {
      player1 = await Player.getById(match.player1.id);
      player2 = await Player.getById(match.player2.id);

      if (player1 && player2) {
        const eloChanges = this.calculateEloChanges(
          match.player1.id,
          match.player2.id,
          winnerId,
          player1.elo,
          player2.elo
        );
        eloChange1 = eloChanges.eloChange1;
        eloChange2 = eloChanges.eloChange2;
      } else {
        console.error(`[endMatch] Missing player record: P1=${!!player1}, P2=${!!player2}`);
      }
    } catch (error) {
      console.error(`[endMatch] Failed to load players for ${matchId}:`, error);
    }

    // Notify players
    this.broadcastToMatch(matchId, {
      type: 'match_end',
      payload: {
        winnerId,
        player1Final: {
          playerId: match.player1.id,
          score: match.player1.score,
          combo: match.player1.combo,
          eloChange: eloChange1,
          newElo: (player1?.elo || 1000) + eloChange1
        },
        player2Final: {
          playerId: match.player2.id,
          score: match.player2.score,
          combo: match.player2.combo,
          eloChange: eloChange2,
          newElo: (player2?.elo || 1000) + eloChange2
        }
      }
    });

    try {
      await Match.updateScore(matchId, match.player1.score, match.player2.score);
      await Match.updateCombo(matchId, match.player1.combo, match.player2.combo);
      await Match.complete(matchId, winnerId, eloChange1, eloChange2);

      if (player1 && player2) {
        await Player.updateElo(match.player1.id, eloChange1);
        await Player.updateElo(match.player2.id, eloChange2);

        await Player.updateStats(match.player1.id, {
          wins: match.player1.score > match.player2.score ? 1 : 0,
          losses: match.player1.score < match.player2.score ? 1 : 0,
          highestCombo: match.player1.combo,
          totalGestures: match.player1.score
        });

        await Player.updateStats(match.player2.id, {
          wins: match.player2.score > match.player1.score ? 1 : 0,
          losses: match.player2.score < match.player1.score ? 1 : 0,
          highestCombo: match.player2.combo,
          totalGestures: match.player2.score
        });

        await Match.recordHistory(
          match.player1.id,
          matchId,
          match.player1.score,
          match.player1.combo,
          match.player1.score,
          winnerId === match.player1.id,
          eloChange1
        );
        await Match.recordHistory(
          match.player2.id,
          matchId,
          match.player2.score,
          match.player2.combo,
          match.player2.score,
          winnerId === match.player2.id,
          eloChange2
        );
      }
    } catch (error) {
      console.error(`[endMatch] Failed to persist match ${matchId}:`, error);
    }

    // Clean up
    setTimeout(() => {
      this.activeMatches.delete(matchId);
      this.playerSessions.delete(match.player1.id);
      this.playerSessions.delete(match.player2.id);
    }, 5000);
  }

  /**
   * Calculate ELO rating changes using simplified algorithm
   */
  calculateEloChanges(player1Id, player2Id, winnerId, player1Elo = 1000, player2Elo = 1000) {
    const K = 32; // ELO K-factor

    const expected1 = 1 / (1 + Math.pow(10, (player2Elo - player1Elo) / 400));
    const expected2 = 1 - expected1;

    const result1 = winnerId === player1Id ? 1 : (winnerId === player2Id ? 0 : 0.5);
    const result2 = 1 - result1;

    return {
      eloChange1: Math.round(K * (result1 - expected1)),
      eloChange2: Math.round(K * (result2 - expected2))
    };
  }

  /**
   * Broadcast message to both players in match
   */
  broadcastToMatch(matchId, message) {
    const match = this.activeMatches.get(matchId);
    if (!match) return;

    const p1Session = this.playerSessions.get(match.player1.id);
    const p2Session = this.playerSessions.get(match.player2.id);

    if (p1Session?.ws && p1Session.ws.readyState === 1) {
      p1Session.ws.send(JSON.stringify(message));
    }
    if (p2Session?.ws && p2Session.ws.readyState === 1) {
      p2Session.ws.send(JSON.stringify(message));
    }
  }

  /**
   * Handle player disconnect
   */
  handleDisconnect(ws) {
    for (const [playerId, session] of this.playerSessions.entries()) {
      if (session.ws === ws) {
        if (session.matchId) {
          // Forfeit match
          const match = this.activeMatches.get(session.matchId);
          if (match) {
            const opponent = match.player1.id === playerId ? match.player2.id : match.player1.id;
            // Award opponent victory
            this.endMatch(session.matchId);
          }
        }
        this.playerSessions.delete(playerId);
        break;
      }
    }
  }

  async handleLeaveQueue(ws, payload) {
    const { playerId } = payload;
    this.matchQueue = this.matchQueue.filter(p => p.playerId !== playerId);
    this.playerSessions.delete(playerId);
  }

  async handleMatchEnd(ws, payload) {
    // Handled by match timer, but can also be called by client
  }
}

module.exports = GameManager;
