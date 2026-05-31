import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useHandTracking, useGestureDetection, useWebSocket } from '../hooks/useHandTracking';
import { useGameStore } from '../hooks/useGameStore';
import '../styles/GameArena.css';

const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [17, 18], [18, 19], [19, 20],
  [0, 17]
];

const drawConnectors = (ctx, landmarks, connections, style) => {
  for (const [start, end] of connections) {
    const p1 = landmarks[start];
    const p2 = landmarks[end];
    if (!p1 || !p2) continue;
    
    ctx.strokeStyle = style.color;
    ctx.lineWidth = style.lineWidth;
    ctx.beginPath();
    ctx.moveTo(p1.x * ctx.canvas.width, p1.y * ctx.canvas.height);
    ctx.lineTo(p2.x * ctx.canvas.width, p2.y * ctx.canvas.height);
    ctx.stroke();
  }
};

const drawLandmarks = (ctx, landmarks, style) => {
  for (const landmark of landmarks) {
    ctx.fillStyle = style.color;
    ctx.beginPath();
    ctx.arc(
      landmark.x * ctx.canvas.width,
      landmark.y * ctx.canvas.height,
      style.radius,
      0,
      2 * Math.PI
    );
    ctx.fill();
  }
};

export const GameArena = ({ wsUrl, onExit, matchEndPayload, opponentCameraFrame }) => {
  const containerRef = useRef(null);
  const lastStatusUpdateRef = useRef(0);
  const lastCameraFrameSentRef = useRef(0);
  const cameraShareCanvasRef = useRef(null);
  const handRaiseStateRef = useRef({
    lastLeftY: null,
    lastRightY: null,
    lastLeftRaiseAt: 0,
    lastRightRaiseAt: 0,
    sequence: []
  });
  const feedbackIdRef = useRef(0);

  const store = useGameStore();
  const { send: sendWS } = useWebSocket(wsUrl, handleWSMessage);
  const { detectGesture } = useGestureDetection(onGestureDetected);

  const [validationFeedback, setValidationFeedback] = useState('');
  const [gestureStatus, setGestureStatus] = useState('Show both hands');
  const [handFeedback, setHandFeedback] = useState([]);
  const [setCompleteFlash, setSetCompleteFlash] = useState(false);
  const [matchResult, setMatchResult] = useState(null);
  const [opponentFrame, setOpponentFrame] = useState('');
  const [opponentFrameAt, setOpponentFrameAt] = useState(0);

  useEffect(() => {
    if (matchEndPayload) {
      const isPlayer1 = matchEndPayload.player1Final?.playerId === store.playerId;
      const yourFinal = isPlayer1 ? matchEndPayload.player1Final : matchEndPayload.player2Final;
      const opponentFinal = isPlayer1 ? matchEndPayload.player2Final : matchEndPayload.player1Final;
      const result = !matchEndPayload.winnerId
        ? 'draw'
        : matchEndPayload.winnerId === store.playerId
          ? 'win'
          : 'lose';

      setMatchResult({
        result,
        yourSets: yourFinal?.score ?? store.player1Score,
        opponentSets: opponentFinal?.score ?? store.player2Score,
        eloChange: yourFinal?.eloChange ?? 0,
        newElo: yourFinal?.newElo ?? store.elo
      });
    }
  }, [matchEndPayload, store.elo, store.player1Score, store.player2Score, store.playerId]);

  useEffect(() => {
    if (!opponentCameraFrame) return;

    setOpponentFrame(opponentCameraFrame.image);
    setOpponentFrameAt(opponentCameraFrame.receivedAt);
  }, [opponentCameraFrame]);

  function handleWSMessage(message) {
    const { type, payload } = message;

    switch (type) {
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
      case 'gesture_accepted':
        setValidationFeedback(`+${payload.points} set! Combo: ${payload.newCombo}`);
        setTimeout(() => setValidationFeedback(''), 1000);
        break;
      case 'match_end':
        store.setMatchState('finished');
        store.setWinner(payload.winnerId);
        setMatchResult(buildMatchResult(payload));
        break;
      case 'opponent_camera_frame':
        setOpponentFrame(payload.image);
        setOpponentFrameAt(Date.now());
        break;
      default:
        break;
    }
  }

  function onGestureDetected(gesture) {
    if (store.matchState !== 'active') return;

    // Send gesture to backend for validation and scoring
    sendWS({
      type: 'gesture_detected',
      payload: {
        playerId: store.playerId,
        matchId: store.matchId,
        confidence: gesture.confidence
      }
    });
  }

  const handleResults = (results) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw video frame
    if (results.image) {
      ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);
    }

    // Track hand visibility
    let leftHandDetected = false;
    let rightHandDetected = false;

    if (results.multiHandLandmarks && results.multiHandedness) {
      const detectedHands = [];
      results.multiHandLandmarks.forEach((landmarks, idx) => {
        const handedness = results.multiHandedness[idx].label;
        detectedHands.push({ landmarks, handedness });
        
        if (handedness === 'Left') leftHandDetected = true;
        if (handedness === 'Right') rightHandDetected = true;

        // Draw hand landmarks and connections
        drawConnectors(ctx, landmarks, HAND_CONNECTIONS, {
          color: handedness === 'Left' ? '#FF6B6B' : '#4ECDC4',
          lineWidth: 2
        });

        drawLandmarks(ctx, landmarks, {
          color: handedness === 'Left' ? '#FFB6B6' : '#B6F5F0',
          lineWidth: 1,
          radius: 3
        });
      });

      store.setHandVisibility(leftHandDetected, rightHandDetected);
      detectHandRaiseFeedback(detectedHands);

      const detection = detectGesture(results);
      updateGestureStatus(detection?.status);
    } else {
      store.setHandVisibility(false, false);
      handRaiseStateRef.current.lastLeftY = null;
      handRaiseStateRef.current.lastRightY = null;
      updateGestureStatus('Show both hands');
    }

    // Draw status overlay
    drawStatusOverlay(ctx, canvas, leftHandDetected, rightHandDetected);
  };

  const {
    videoRef,
    canvasRef,
    cameraError,
    isCameraReady,
    isTrackingReady
  } = useHandTracking(handleResults, { width: 640, height: 480 });

  const sendCameraPreviewFrame = useCallback(() => {
    if (!videoRef.current || !store.matchId || store.matchState === 'finished') return;

    const now = Date.now();
    if (now - lastCameraFrameSentRef.current < 250) return;

    const video = videoRef.current;
    if (video.readyState < 2) return;

    lastCameraFrameSentRef.current = now;

    const previewCanvas = cameraShareCanvasRef.current || document.createElement('canvas');
    cameraShareCanvasRef.current = previewCanvas;
    previewCanvas.width = 192;
    previewCanvas.height = 144;

    const previewCtx = previewCanvas.getContext('2d');
    previewCtx.drawImage(video, 0, 0, previewCanvas.width, previewCanvas.height);

    sendWS({
      type: 'camera_frame',
      payload: {
        playerId: store.playerId,
        matchId: store.matchId,
        image: previewCanvas.toDataURL('image/jpeg', 0.45)
      }
    });
  }, [sendWS, store.matchId, store.matchState, store.playerId, videoRef]);

  function updateGestureStatus(status) {
    if (!status) return;

    const now = Date.now();
    if (now - lastStatusUpdateRef.current < 180) return;

    lastStatusUpdateRef.current = now;
    setGestureStatus(status);
  }

  function detectHandRaiseFeedback(hands) {
    const leftHand = hands.find((hand) => hand.handedness === 'Left')?.landmarks;
    const rightHand = hands.find((hand) => hand.handedness === 'Right')?.landmarks;
    const now = Date.now();
    const state = handRaiseStateRef.current;

    if (leftHand) {
      const leftY = getHandCenterY(leftHand);
      if (
        state.lastLeftY !== null &&
        leftY < state.lastLeftY - 0.025 &&
        now - state.lastLeftRaiseAt > 450
      ) {
        state.lastLeftRaiseAt = now;
        state.sequence.push('left');
        spawnHandFeedback('6', leftHand, 'left');
      }
      state.lastLeftY = leftY;
    } else {
      state.lastLeftY = null;
    }

    if (rightHand) {
      const rightY = getHandCenterY(rightHand);
      if (
        state.lastRightY !== null &&
        rightY < state.lastRightY - 0.025 &&
        now - state.lastRightRaiseAt > 450
      ) {
        state.lastRightRaiseAt = now;
        state.sequence.push('right');
        spawnHandFeedback('7', rightHand, 'right');
      }
      state.lastRightY = rightY;
    } else {
      state.lastRightY = null;
    }

    if (state.sequence.length > 2) {
      state.sequence = state.sequence.slice(-2);
    }

    if (
      state.sequence.length === 2 &&
      state.sequence[0] !== state.sequence[1] &&
      Math.abs(state.lastLeftRaiseAt - state.lastRightRaiseAt) <= 1800
    ) {
      state.sequence = [];
      triggerSetCompleteFlash();

      if (store.matchState === 'active') {
        sendWS({
          type: 'gesture_detected',
          payload: {
            playerId: store.playerId,
            matchId: store.matchId,
            gestureType: 'six_seven_set',
            confidence: 1
          }
        });
      }
    }
  }

  function spawnHandFeedback(value, landmarks, side) {
    const wrist = landmarks[0];
    if (!wrist) return;

    const id = feedbackIdRef.current++;
    const feedback = {
      id,
      value,
      side,
      left: `${wrist.x * 100}%`,
      top: `${Math.max(8, wrist.y * 100 - 8)}%`
    };

    setHandFeedback((current) => [...current, feedback]);
    setTimeout(() => {
      setHandFeedback((current) => current.filter((item) => item.id !== id));
    }, 850);
  }

  function triggerSetCompleteFlash() {
    setSetCompleteFlash(true);
    setTimeout(() => setSetCompleteFlash(false), 450);
  }

  function buildMatchResult(payload) {
    const isPlayer1 = payload.player1Final?.playerId === store.playerId;
    const yourFinal = isPlayer1 ? payload.player1Final : payload.player2Final;
    const opponentFinal = isPlayer1 ? payload.player2Final : payload.player1Final;
    const result = !payload.winnerId
      ? 'draw'
      : payload.winnerId === store.playerId
        ? 'win'
        : 'lose';

    return {
      result,
      yourSets: yourFinal?.score ?? store.player1Score,
      opponentSets: opponentFinal?.score ?? store.player2Score,
      eloChange: yourFinal?.eloChange ?? 0,
      newElo: yourFinal?.newElo ?? store.elo
    };
  }

  function drawStatusOverlay(ctx, canvas, leftDetected, rightDetected) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, 60);

    ctx.fillStyle = '#fff';
    ctx.font = '16px Arial';
    
    const leftStatus = leftDetected ? '✓ Left' : '✗ Left';
    const rightStatus = rightDetected ? '✓ Right' : '✗ Right';

    ctx.fillStyle = leftDetected ? '#4ECB71' : '#E74C3C';
    ctx.fillText(leftStatus, 10, 25);

    ctx.fillStyle = rightDetected ? '#4ECB71' : '#E74C3C';
    ctx.fillText(rightStatus, 150, 25);

    // Match info
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 18px Arial';
    ctx.fillText(`Your Sets: ${store.player1Score} | Opponent: ${store.player2Score}`, 280, 25);
    ctx.fillText(`Combo: ${store.player1Combo}`, 10, 50);
    ctx.fillText(`Time: ${store.matchTimer}s`, canvas.width - 150, 50);
  }

  useEffect(() => {
    if (!isCameraReady || !store.matchId || store.matchState === 'finished') return;

    const intervalId = setInterval(() => {
      sendCameraPreviewFrame();
    }, 250);

    return () => clearInterval(intervalId);
  }, [isCameraReady, sendCameraPreviewFrame, store.matchId, store.matchState]);

  return (
    <div className="game-arena" ref={containerRef}>
      <div className="arena-container">
        <div className="webcam-display">
          <video
            ref={videoRef}
            className="camera-video"
            autoPlay
            muted
            playsInline
          />
          <canvas
            ref={canvasRef}
            width={640}
            height={480}
            className="game-canvas"
          />
          <div className={`set-complete-flash ${setCompleteFlash ? 'active' : ''}`} />
          {handFeedback.map((item) => (
            <div
              key={item.id}
              className={`hand-raise-pop hand-raise-pop-${item.side}`}
              style={{ left: item.left, top: item.top }}
            >
              {item.value}
            </div>
          ))}
          {!isCameraReady && !cameraError && (
            <div className="camera-status">Opening camera...</div>
          )}
          {isCameraReady && !isTrackingReady && !cameraError && (
            <div className="camera-status">Loading hand tracking...</div>
          )}
          {cameraError && (
            <div className="camera-status camera-error">{cameraError}</div>
          )}
          {isCameraReady && !cameraError && (
            <div className="gesture-status">{gestureStatus}</div>
          )}
          {validationFeedback && (
            <div className="validation-feedback">{validationFeedback}</div>
          )}
          {matchResult && (
            <div className={`match-result match-result-${matchResult.result}`}>
              <div className="match-result-panel">
                <div className="match-result-title">
                  {matchResult.result === 'win' && 'You Win'}
                  {matchResult.result === 'lose' && 'You Lose'}
                  {matchResult.result === 'draw' && 'Draw'}
                </div>
                <div className="match-result-score">
                  {matchResult.yourSets} - {matchResult.opponentSets}
                </div>
                <div className="match-result-label">6/7 Sets</div>
                <div className="match-result-elo">
                  ELO {matchResult.eloChange >= 0 ? '+' : ''}{matchResult.eloChange}
                  <span>{matchResult.newElo}</span>
                </div>
                <button className="match-result-button" onClick={onExit}>
                  Back to Menu
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="game-info">
          <div className="opponent-camera">
            <div className="opponent-camera-label">Opponent Camera</div>
            {opponentFrame ? (
              <img src={opponentFrame} alt="Opponent live camera" />
            ) : (
              <div className="opponent-camera-empty">Waiting for feed...</div>
            )}
            {opponentFrame && Date.now() - opponentFrameAt > 2000 && (
              <div className="opponent-camera-stale">Reconnecting...</div>
            )}
          </div>

          <div className="player-info player-1">
            <h3>You</h3>
            <div className="score">{store.player1Score}</div>
            <div className="combo">6/7 Sets: {store.player1Combo}</div>
            <div className="elo">ELO: {store.elo}</div>
          </div>

          <div className="timer">
            <div className="time-display">{store.matchTimer}s</div>
            {store.matchState === 'countdown' && (
              <div className="countdown">{store.countdownSeconds}</div>
            )}
          </div>

          <div className="player-info player-2">
            <h3>Opponent</h3>
            <div className="score">{store.player2Score}</div>
            <div className="combo">6/7 Sets: {store.player2Combo}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

function getHandCenterY(landmarks) {
  const trackedPoints = [0, 5, 9, 13, 17]
    .map((idx) => landmarks[idx])
    .filter(Boolean);

  if (trackedPoints.length === 0) {
    return landmarks[0]?.y || 0;
  }

  return trackedPoints.reduce((sum, point) => sum + point.y, 0) / trackedPoints.length;
}
