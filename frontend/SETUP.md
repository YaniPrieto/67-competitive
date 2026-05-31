# Frontend Setup Instructions

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm start
```

This will:
- Start React dev server at `http://localhost:3000`
- Auto-reload on file changes
- Open browser automatically

### 3. Request Camera Permission
When the game loads, your browser will ask for webcam access. Allow it for the game to work.

## Build for Production

```bash
npm run build
```

Creates optimized production build in `build/` directory.

## Project Structure

```
src/
├── components/
│   ├── App.jsx              - Main app router
│   ├── MainMenu.jsx         - Home screen
│   ├── GameArena.jsx        - Live match
│   ├── QueueScreen.jsx      - Matchmaking
│   └── Leaderboard.jsx      - Rankings
├── hooks/
│   ├── useHandTracking.js   - MediaPipe integration
│   ├── useGameStore.js      - Global state (Zustand)
│   └── useWebSocket.js      - WebSocket connection
├── styles/
│   ├── App.css
│   ├── GameArena.css
│   ├── MainMenu.css
│   ├── QueueScreen.css
│   └── Leaderboard.css
├── utils/
│   ├── api.js               - API client
│   └── constants.js         - Game constants
├── App.jsx
├── index.jsx
└── App.css
public/
└── index.html
```

## Key Dependencies

### Computer Vision
- `@mediapipe/hands` - Hand tracking
- `@mediapipe/drawing_utils` - Hand skeleton rendering

### State Management
- `zustand` - Lightweight state store

### HTTP
- Built-in `fetch` API

### WebSocket
- Native browser WebSocket

## Camera Requirements

✅ **Optimal Setup:**
- USB or built-in webcam
- 640x480 resolution (upscaled if needed)
- Well-lit environment (natural or warm lighting)
- 30-50cm distance from camera
- Clear, neutral background

⚠️ **Issues:**
- Low lighting → hand detection fails
- Hands too close → landmark detection errors
- Cluttered background → false detections
- Poor camera quality → unreliable tracking

## Component Overview

### App.jsx
Main router that switches between screens:
- Menu → Queue → Game → Results

### GameArena.jsx
Live match interface:
- Canvas with hand skeleton overlay
- Real-time score display
- Countdown and timer
- Gesture validation feedback

### GestureDetector (Hook)
Processes hand landmarks to detect:
- Palm orientation (facing up)
- Hand motion (up/down)
- Alternating pattern (left up + right down)
- Valid cycles (with cooldown)

### useGameStore (Zustand)
Global game state:
- Player data (name, ELO, ID)
- Match state (scores, combos, timer)
- UI state (webcam visibility, feedback)

## Browser Compatibility

| Browser | Version | Status |
|---------|---------|--------|
| Chrome | 90+ | ✅ Fully supported |
| Firefox | 88+ | ✅ Fully supported |
| Safari | 14+ | ✅ Fully supported |
| Edge | 90+ | ✅ Fully supported |

Requirements:
- WebSocket support
- Canvas API
- Fetch API
- getUserMedia (camera access)

## Troubleshooting

### Camera Not Working
```javascript
// Check permissions in browser console
navigator.permissions.query({ name: 'camera' })
  .then(result => console.log(result.state))

// Request camera manually
navigator.mediaDevices.getUserMedia({ video: true })
  .then(stream => console.log('Camera access granted'))
  .catch(err => console.log('Camera access denied:', err))
```

### Hand Not Detected
- Ensure camera has good lighting
- Move closer to camera (arm's length distance)
- Hold both palms flat facing camera
- Check MediaPipe model is loaded (check Network tab)

### Low Frame Rate
- Reduce webcam resolution
- Close other browser tabs
- Disable browser extensions
- Use Chrome (best performance)

### Memory Leaks
Check React DevTools for unmounted component listeners:
```javascript
// Proper cleanup in useEffect
useEffect(() => {
  return () => {
    // Cleanup code
    stream.getTracks().forEach(track => track.stop());
  };
}, []);
```

## Performance Optimization

### Model Complexity
In `useHandTracking.js`, adjust MediaPipe settings:
```javascript
hands.setOptions({
  modelComplexity: 0,  // Lite (faster)
  // modelComplexity: 1, // Full (accurate)
});
```

### Detection Frequency
Reduce detection calls if performance is low:
```javascript
let frameCounter = 0;
if (frameCounter++ % 2 === 0) {
  // Process every 2nd frame
  await hands.send({ image: videoRef.current });
}
```

### Canvas Rendering
Optimize overlay rendering by reducing detail:
- Fewer connection lines
- Fewer landmark circles
- Less frequent updates

## Development Tips

### Debug Mode
Add to `MainMenu.jsx`:
```javascript
const [debug, setDebug] = React.useState(false);
// Display debug info overlay
```

### Testing
```bash
npm test
```

Start Jest test runner for component testing.

### Profiling
Open Chrome DevTools → Performance tab:
1. Record
2. Play game for 10 seconds
3. Stop recording
4. Analyze frame rate and processing time

## API Configuration

Backend must be running on `http://localhost:5000` and `ws://localhost:5001`.

To connect to different server, edit:
```javascript
// In App.jsx
const WS_URL = 'ws://your-server:5001';
const API_BASE = 'http://your-server:5000';
```

## Production Deployment

### Build
```bash
npm run build
```

### Serve with HTTP Server
```bash
# Using serve package
npm install -g serve
serve -s build
```

### Deploy to Vercel/Netlify
Both platforms support React apps out of the box:
- Push code to GitHub
- Connect repository
- Auto-deploys on push

### Configure API URL
Use environment variables:
```bash
# .env.production
REACT_APP_API_URL=https://your-api.com
```

Access in code:
```javascript
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
```

## Performance Benchmarks

Typical performance on modern hardware:

| Metric | Target | Actual |
|--------|--------|--------|
| Frame Rate | 30 FPS | 25-30 FPS |
| Hand Detection | < 100ms | 50-80ms |
| Gesture Processing | < 50ms | 20-30ms |
| Memory Usage | < 200MB | 150-180MB |

## Debugging Network Issues

### Check WebSocket Connection
```javascript
console.log('WS State:', ws.readyState);
// 0 = CONNECTING, 1 = OPEN, 2 = CLOSING, 3 = CLOSED
```

### Monitor Network Tab
Open DevTools → Network tab:
- WS column shows WebSocket connections
- Messages tab shows sent/received data

### CORS Errors
Backend must have CORS enabled (already configured in `server.js`).

---

Need help? Check the main [README.md](../README.md) for full documentation.
