import { useCallback, useEffect, useRef, useState } from 'react';

const MEDIAPIPE_HANDS_VERSION = '0.4.1675469240';

/**
 * Hand Tracking Hook
 * Integrates MediaPipe Hands for real-time hand detection
 * MediaPipe is loaded from CDN in index.html
 */
export const useHandTracking = (onResults, options = {}) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const handsRef = useRef(null);
  const onResultsRef = useRef(onResults);
  const [cameraError, setCameraError] = useState('');
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isTrackingReady, setIsTrackingReady] = useState(false);
  const width = options.width || 640;
  const height = options.height || 480;

  useEffect(() => {
    onResultsRef.current = onResults;
  }, [onResults]);

  useEffect(() => {
    if (videoRef.current) {
      const video = videoRef.current;
      let isMounted = true;
      let animationFrameId = null;
      let hands = null;

      if (window.Hands) {
        hands = new window.Hands({
          locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/hands@${MEDIAPIPE_HANDS_VERSION}/${file}`;
          }
        });

        hands.setOptions({
          maxNumHands: 2,
          modelComplexity: 1,
          minDetectionConfidence: 0.7,
          minTrackingConfidence: 0.5
        });

        hands.onResults((results) => {
          onResultsRef.current?.(results);
        });
        handsRef.current = hands;
        setIsTrackingReady(true);
      } else {
        setCameraError('Hand tracking failed to load. Camera preview is still available.');
      }

      const startCamera = async () => {
        try {
          setCameraError('');
          const stream = await navigator.mediaDevices.getUserMedia({
            video: {
              width: { ideal: width },
              height: { ideal: height }
            },
            audio: false
          });

          video.srcObject = stream;

          video.onloadedmetadata = async () => {
            await video.play();
            setIsCameraReady(true);

            if (!hands) return;

            const frameLoop = async () => {
              if (!isMounted) return;

              try {
                await hands.send({ image: video });
              } catch (error) {
                console.error('Hand tracking failed:', error);
                setCameraError('Hand tracking failed. Restart the page or check the MediaPipe script.');
                return;
              }

              animationFrameId = requestAnimationFrame(frameLoop);
            };
            frameLoop();
          };
        } catch (error) {
          console.error('Failed to access camera:', error);
          setCameraError(
            error.name === 'NotAllowedError'
              ? 'Camera permission was blocked. Allow camera access in the browser.'
              : 'Could not open the camera. Check camera permissions and whether another app is using it.'
          );
        }
      };

      startCamera();

      return () => {
        isMounted = false;
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId);
        }
        if (video.srcObject) {
          const tracks = video.srcObject.getTracks();
          tracks.forEach(track => track.stop());
        }
        hands?.close?.();
        handsRef.current = null;
        setIsCameraReady(false);
        setIsTrackingReady(false);
      };
    }
  }, [width, height]);

  return { videoRef, canvasRef, handsRef, cameraError, isCameraReady, isTrackingReady };
};

/**
 * Gesture Detection Hook
 * Processes hand landmarks to detect valid gestures
 */
export const useGestureDetection = (onGestureDetected) => {
  const gestureStateRef = useRef({
    lastLeftY: null,
    lastRightY: null,
    lastValidCycleTime: 0,
    motionThreshold: 0.018,
    cooldownMs: 250
  });

  const detectGesture = (results) => {
    if (!results.multiHandLandmarks || results.multiHandLandmarks.length < 2) {
      gestureStateRef.current.lastLeftY = null;
      gestureStateRef.current.lastRightY = null;
      return { detected: false, status: 'Show both hands' };
    }

    const hands = results.multiHandLandmarks
      .slice(0, 2)
      .map((landmarks, idx) => ({
        landmarks,
        label: results.multiHandedness?.[idx]?.label
      }));

    const labeledLeft = hands.find((hand) => hand.label === 'Left');
    const labeledRight = hands.find((hand) => hand.label === 'Right');
    const sortedByX = [...hands].sort((a, b) => getHandCenterX(a.landmarks) - getHandCenterX(b.landmarks));
    const leftHand = labeledLeft?.landmarks || sortedByX[0]?.landmarks;
    const rightHand = labeledRight?.landmarks || sortedByX[1]?.landmarks;
    if (!leftHand || !rightHand) return null;

    const leftY = getHandCenterY(leftHand);
    const rightY = getHandCenterY(rightHand);
    const state = gestureStateRef.current;

    if (state.lastLeftY === null || state.lastRightY === null) {
      state.lastLeftY = leftY;
      state.lastRightY = rightY;
      return { detected: false, status: 'Move hands opposite ways' };
    }

    const leftDelta = leftY - state.lastLeftY;
    const rightDelta = rightY - state.lastRightY;
    state.lastLeftY = leftY;
    state.lastRightY = rightY;

    const leftMotion = Math.abs(leftDelta) >= state.motionThreshold
      ? leftDelta > 0 ? 'down' : 'up'
      : null;
    const rightMotion = Math.abs(rightDelta) >= state.motionThreshold
      ? rightDelta > 0 ? 'down' : 'up'
      : null;

    if (!leftMotion || !rightMotion) {
      return { detected: false, status: 'Move bigger' };
    }

    if (leftMotion === rightMotion) {
      return { detected: false, status: 'Move hands opposite ways' };
    }

    const now = Date.now();
    if (now - state.lastValidCycleTime < state.cooldownMs) {
      return { detected: false, status: 'Keep rhythm' };
    }

    state.lastValidCycleTime = now;

    return {
      detected: true,
      status: `Gesture counted: left ${leftMotion}, right ${rightMotion}`
    };
  };

  return { detectGesture };
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

function getHandCenterX(landmarks) {
  const trackedPoints = [0, 5, 9, 13, 17]
    .map((idx) => landmarks[idx])
    .filter(Boolean);

  if (trackedPoints.length === 0) {
    return landmarks[0]?.x || 0;
  }

  return trackedPoints.reduce((sum, point) => sum + point.x, 0) / trackedPoints.length;
}

/**
 * WebSocket Connection Hook
 */
export const useWebSocket = (url, onMessage) => {
  const wsRef = useRef(null);
  const onMessageRef = useRef(onMessage);
  const pendingMessagesRef = useRef([]);
  const [readyState, setReadyState] = useState(WebSocket.CONNECTING);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    const ws = new WebSocket(url);
    wsRef.current = ws;
    setReadyState(ws.readyState);

    ws.onopen = () => {
      console.log('WebSocket connected');
      setReadyState(ws.readyState);

      pendingMessagesRef.current.forEach((message) => {
        ws.send(JSON.stringify(message));
      });
      pendingMessagesRef.current = [];
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        onMessageRef.current?.(message);
      } catch (error) {
        console.error('WebSocket message parse error:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setReadyState(ws.readyState);
      if (wsRef.current === ws) {
        wsRef.current = null;
      }
    };

    return () => {
      pendingMessagesRef.current = [];
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [url]);

  const send = useCallback((message) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
      return true;
    }
    if (wsRef.current?.readyState === WebSocket.CONNECTING) {
      pendingMessagesRef.current.push(message);
      return true;
    }
    console.warn('WebSocket is not connected; message not sent:', message.type);
    return false;
  }, []);

  return { send, ws: wsRef.current, readyState };
};
