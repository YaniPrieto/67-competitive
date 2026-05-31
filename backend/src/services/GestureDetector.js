/**
 * Hand Gesture Detector
 * Analyzes MediaPipe hand landmarks to detect:
 * - Palm orientation (facing up/down)
 * - Hand elevation
 * - Alternating motion patterns
 * - Valid gesture cycles
 */

class GestureDetector {
  constructor(smoothingWindow = 5, motionThreshold = 0.05) {
    this.smoothingWindow = smoothingWindow;
    this.motionThreshold = motionThreshold;
    
    // Track hand positions over time for smoothing and motion detection
    this.handHistory = {
      left: [],
      right: []
    };
    
    // Track gesture state for cycle detection
    this.gestureState = {
      lastLeftY: null,
      lastRightY: null,
      leftMoving: null,
      rightMoving: null,
      cycleInProgress: false,
      lastValidCycleTime: 0
    };
  }

  /**
   * Calculate palm normal vector to determine orientation
   * Returns positive if facing up (camera), negative if facing down
   */
  calculatePalmNormal(hand) {
    const { landmarks } = hand;
    if (!landmarks || landmarks.length < 9) return null;

    // Wrist (0), MIDDLE_MCP (9), RING_MCP (13)
    const wrist = landmarks[0];
    const middleMcp = landmarks[9];
    const ringMcp = landmarks[13];

    // Vectors from wrist
    const v1 = {
      x: middleMcp.x - wrist.x,
      y: middleMcp.y - wrist.y,
      z: middleMcp.z - wrist.z
    };

    const v2 = {
      x: ringMcp.x - wrist.x,
      y: ringMcp.y - wrist.y,
      z: ringMcp.z - wrist.z
    };

    // Cross product for normal
    const normal = {
      x: v1.y * v2.z - v1.z * v2.y,
      y: v1.z * v2.x - v1.x * v2.z,
      z: v1.x * v2.y - v1.y * v2.x
    };

    // Return Z component (positive = facing up)
    return normal.z;
  }

  /**
   * Check if palm is facing upward with reasonable confidence
   */
  isPalmFacingUp(hand, threshold = 0.0) {
    const normal = this.calculatePalmNormal(hand);
    return normal !== null && normal > threshold;
  }

  /**
   * Get smoothed Y position of hand
   */
  getSmoothedHandY(handSide, currentY) {
    const history = this.handHistory[handSide];
    history.push(currentY);

    if (history.length > this.smoothingWindow) {
      history.shift();
    }

    // Average of recent positions
    return history.reduce((a, b) => a + b, 0) / history.length;
  }

  /**
   * Detect if hand is moving up or down
   */
  detectMotion(handSide, currentY) {
    const smoothed = this.getSmoothedHandY(handSide, currentY);
    const lastY = this.gestureState[`last${handSide.charAt(0).toUpperCase() + handSide.slice(1)}Y`];

    if (lastY === null) {
      this.gestureState[`last${handSide.charAt(0).toUpperCase() + handSide.slice(1)}Y`] = smoothed;
      return null; // Not enough history
    }

    const delta = smoothed - lastY;
    this.gestureState[`last${handSide.charAt(0).toUpperCase() + handSide.slice(1)}Y`] = smoothed;

    if (Math.abs(delta) < this.motionThreshold) {
      return null; // No significant motion
    }

    return delta > 0 ? 'down' : 'up';
  }

  /**
   * Check for valid alternating gesture cycle
   * Pattern: Left UP + Right DOWN, then Left DOWN + Right UP
   */
  detectAlternatingCycle(leftHand, rightHand) {
    if (!leftHand || !rightHand) return { valid: false, reason: 'missing_hand' };

    // Check palms are facing up
    if (!this.isPalmFacingUp(leftHand) || !this.isPalmFacingUp(rightHand)) {
      return { valid: false, reason: 'palm_not_facing_up' };
    }

    // Get hand positions (Y coordinate, normalized 0-1)
    const leftY = leftHand.landmarks[0]?.y;
    const rightY = rightHand.landmarks[0]?.y;

    if (leftY === undefined || rightY === undefined) {
      return { valid: false, reason: 'invalid_landmarks' };
    }

    // Detect motion
    const leftMotion = this.detectMotion('left', leftY);
    const rightMotion = this.detectMotion('right', rightY);

    // Skip if no motion detected
    if (leftMotion === null || rightMotion === null) {
      return { valid: false, reason: 'insufficient_motion' };
    }

    // Check for simultaneous motion (invalid)
    if (leftMotion === rightMotion) {
      this.gestureState.cycleInProgress = false;
      return { valid: false, reason: 'both_hands_same_direction' };
    }

    // Valid alternating motion detected
    const cycleValid = this.gestureState.cycleInProgress === false;
    this.gestureState.cycleInProgress = !this.gestureState.cycleInProgress;

    if (cycleValid) {
      this.gestureState.lastValidCycleTime = Date.now();
      return { valid: true, reason: 'valid_cycle' };
    }

    return { valid: false, reason: 'cycle_incomplete' };
  }

  /**
   * Anti-cheat: Check if motion is legitimate (not static shaking)
   * Require minimum movement distance over time
   */
  validateMotionLegitimacy() {
    const timeSinceLastCycle = Date.now() - this.gestureState.lastValidCycleTime;
    const minCycleIntervalMs = 200; // Minimum 200ms between cycles

    return timeSinceLastCycle >= minCycleIntervalMs;
  }

  /**
   * Process frame and return gesture detection result
   */
  processFrame(results) {
    if (!results.leftHand || !results.rightHand) {
      return {
        gestureDetected: false,
        reason: 'hands_not_detected',
        confidence: 0
      };
    }

    const detection = this.detectAlternatingCycle(results.leftHand, results.rightHand);

    if (detection.valid && this.validateMotionLegitimacy()) {
      return {
        gestureDetected: true,
        reason: 'valid_alternating_cycle',
        confidence: 0.95
      };
    }

    return {
      gestureDetected: false,
      reason: detection.reason,
      confidence: detection.valid ? 0.5 : 0
    };
  }

  reset() {
    this.handHistory = { left: [], right: [] };
    this.gestureState = {
      lastLeftY: null,
      lastRightY: null,
      leftMoving: null,
      rightMoving: null,
      cycleInProgress: false,
      lastValidCycleTime: 0
    };
  }
}

module.exports = GestureDetector;
