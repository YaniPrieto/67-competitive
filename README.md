# 🎮 Gesture Battle - Multiplayer Computer Vision Game

A real-time multiplayer web game where players compete by performing hand gestures detected through their webcam using MediaPipe Hands tracking.

## 🎯 Game Concept

Players perform an alternating hand gesture pattern:
- **Hold both palms facing upward**
- **Alternately move hands up and down:**
  - Left hand UP ↑ + Right hand DOWN ↓
  - Right hand UP ↑ + Left hand DOWN ↓
  - Repeat for points
- **Maintain rhythm for combo multipliers**
- **Match duration: 60 seconds**
- **Highest score wins!**

## 🏆 Features

### Core Gameplay
✅ Real-time hand detection with MediaPipe  
✅ Gesture recognition (alternating motion, palm orientation)  
✅ Scoring system with combo multipliers  
✅ Anti-cheat validation (motion legitimacy, visible hands)  
✅ 60-second competitive matches  

### Multiplayer
✅ WebSocket-based real-time synchronization  
✅ Intelligent matchmaking by ELO rating  
✅ 3-second countdown before matches  
✅ Live score and combo updates  
✅ Opponent disconnection handling  

### Progression & Ranking
✅ **ELO Rating System:**
  - Bronze (< 1200)
  - Silver (1200-1400)
  - Gold (1400-1600)
  - Platinum (1600-1800)
  - Diamond (> 1800)

✅ **Player Stats:**
  - Wins/Losses
  - Highest combo
  - Total gestures
  - Match history

✅ **Leaderboards:**
  - Global rankings
  - Tier-based filtering
  - Win rate tracking

### Visual Polish
✅ Hand skeleton overlay with color-coded left/right hands  
✅ Real-time validation feedback (green/red)  
✅ Combo streak animations  
✅ Score popups  
✅ Victory/defeat screen  
✅ Modern gradient UI  

## 📋 Tech Stack

### Backend
- **Node.js** with Express.js
- **WebSocket** (ws) for real-time multiplayer
- **SQLite3** for persistent storage
- **CORS** and **Helmet** for security

### Frontend
- **React 18** for UI components
- **MediaPipe Hands** for computer vision
- **Zustand** for state management
- **CSS3** with animations and gradients

### Computer Vision
- **MediaPipe Hands** - Real-time hand landmark detection
- **Canvas API** - Hand skeleton visualization

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and npm
- Webcam (any standard USB or built-in camera)
- Modern browser (Chrome, Firefox, Safari, Edge)
- Decent lighting for camera

### Backend Setup

```bash
cd gesture-battle/backend
npm install
```

Create `.env` file:
```
PORT=5000
WS_PORT=5001
NODE_ENV=development
DATABASE_PATH=./data/gesture-battle.db
```

Start backend:
```bash
npm run dev
```

The backend will:
- Initialize SQLite database
- Start HTTP server on port 5000
- Start WebSocket server on port 5001

### Frontend Setup

```bash
cd gesture-battle/frontend
npm install
```

Start frontend (development server with hot reload):
```bash
npm start
```

Frontend will open at `http://localhost:3000`

### Production Build

```bash
npm run build
```

## 🎮 How to Play

1. **Open the game** at `http://localhost:3000`
2. **Enter a username** (3+ characters)
3. **Click "Play Ranked"** to join the matchmaking queue
4. **Wait for opponent match** (usually < 30 seconds)
5. **Watch the 3-second countdown**
6. **Perform the gesture:**
   - Hold both palms UP to the camera
   - Move LEFT hand UP while RIGHT hand moves DOWN
   - Then reverse: LEFT DOWN, RIGHT UP
   - Repeat continuously
7. **Valid cycles earn points** (10 points + combo multiplier)
8. **Highest score at 60 seconds wins**
9. **See results** and new ELO rating

## 📊 Scoring System

| Event | Points |
|-------|--------|
| Valid alternating cycle | 10 base points |
| Combo multiplier (x2-x5) | Variable |
| Match win | +32 ELO (default) |
| Match loss | -32 ELO (default) |

### Combo System
- Each successful gesture increases combo counter
- Breaking rhythm (invalid motion) resets combo to 0
- Combo multiplier ranges from 1x to 5x
- Display shows current combo streak

## 🔍 Gesture Detection Algorithm

### Hand Detection
- MediaPipe detects both hands with 21 landmarks each
- Minimum 70% confidence for hand recognition
- Smoothing filter (5-frame window) reduces jitter

### Palm Orientation
- Calculates palm normal vector from wrist to MCP points
- Faces up = positive Z-component
- Rejects hands with palms facing down or sideways

### Motion Detection
- Tracks Y position (vertical) of wrist over time
- Calculates velocity with motion threshold (0.05)
- Detects UP (decreasing Y) or DOWN (increasing Y) motion

### Cycle Validation
- Left hand must move opposite to right hand
- Both hands must show motion in opposite directions
- Minimum 200ms cooldown between valid cycles
- Prevents score inflation from static shaking

### Anti-Cheat
✅ Both hands must be visible  
✅ Palms must face upward  
✅ Motion must be above threshold (not tiny shakes)  
✅ Hands must alternate (not move together)  
✅ Debounce timer prevents rapid spam cycles  

## 📚 Project Structure

```
gesture-battle/
├── backend/
│   ├── src/
│   │   ├── server.js              # Express + WebSocket server
│   │   ├── db.js                  # SQLite database setup
│   │   ├── models/
│   │   │   ├── Player.js          # Player data model
│   │   │   └── Match.js           # Match data model
│   │   ├── services/
│   │   │   ├── GestureDetector.js # CV gesture recognition
│   │   │   └── GameManager.js     # Match logic & multiplayer
│   │   └── routes/
│   │       ├── players.js         # Player API endpoints
│   │       ├── matches.js         # Match API endpoints
│   │       └── leaderboard.js     # Ranking API endpoints
│   ├── package.json
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── App.jsx            # Main app component
│   │   │   ├── MainMenu.jsx       # Home screen
│   │   │   ├── GameArena.jsx      # Live match screen
│   │   │   ├── QueueScreen.jsx    # Matchmaking queue
│   │   │   └── Leaderboard.jsx    # Rankings display
│   │   ├── hooks/
│   │   │   ├── useHandTracking.js # MediaPipe integration
│   │   │   └── useGameStore.js    # Global state
│   │   ├── styles/
│   │   │   ├── GameArena.css
│   │   │   ├── MainMenu.css
│   │   │   ├── Leaderboard.css
│   │   │   └── QueueScreen.css
│   │   ├── App.jsx
│   │   ├── index.jsx
│   │   └── App.css
│   ├── public/
│   │   └── index.html
│   └── package.json
│
└── README.md
```

## 🔌 API Endpoints

### Players
- `POST /api/players/register` - Create new player
- `GET /api/players/:id` - Get player profile
- `GET /api/players/username/:username` - Find player by name
- `GET /api/players/:id/history` - Get match history
- `PATCH /api/players/:id` - Update player

### Matches
- `GET /api/matches/:id` - Get match details
- `GET /api/matches/player/:playerId` - Get player's matches

### Leaderboard
- `GET /api/leaderboard` - Global leaderboard
- `GET /api/leaderboard/seasonal/top` - Top 100 players
- `GET /api/leaderboard/player/:playerId` - Player rank

## 🔌 WebSocket Events

### Client → Server
```json
{
  "type": "join_queue",
  "payload": { "playerId": "uuid", "username": "str", "elo": 1000 }
}

{
  "type": "gesture_detected",
  "payload": { "playerId": "uuid", "matchId": "uuid", "confidence": 0.95 }
}

{
  "type": "match_end",
  "payload": { "matchId": "uuid" }
}
```

### Server → Client
```json
{
  "type": "match_found",
  "payload": { "matchId": "uuid", "opponent": "uuid", "countdownSeconds": 3 }
}

{
  "type": "score_update",
  "payload": { 
    "player1Score": 100, "player2Score": 80,
    "player1Combo": 5, "player2Combo": 3
  }
}

{
  "type": "gesture_accepted",
  "payload": { "points": 50, "newCombo": 5 }
}

{
  "type": "match_end",
  "payload": { 
    "winnerId": "uuid",
    "player1Final": { "score": 150, "combo": 10, "eloChange": +32 },
    "player2Final": { "score": 120, "combo": 8, "eloChange": -32 }
  }
}
```

## 🎨 Visual Features

### Hand Tracking Display
- Live webcam feed with hand skeleton overlay
- Left hand: Red (#FF6B6B) joints and connections
- Right hand: Teal (#4ECDC4) joints and connections
- Hand visibility indicators at top
- Real-time score and timer display

### Feedback System
- ✅ Green validation flash for accepted gestures
- ❌ Red flash for invalid motions
- 📊 Score popup animations (+10 points, combo x5)
- 🎊 Victory animations and confetti effects

### UI Themes
- Modern dark theme with gradient backgrounds
- Neon accent colors (teal, gold, red)
- Smooth transitions and hover effects
- Responsive design for mobile and desktop

## 🛡️ Anti-Cheat Measures

1. **Server-Side Validation**
   - Gestures validated by GestureDetector on backend
   - Players can't submit fake scores
   - Confidence scoring (0-1) for motion validation

2. **Motion Analysis**
   - Tracks motion history for legitimacy
   - Rejects tiny shakes (< 0.05 threshold)
   - Requires minimum 200ms between cycles
   - Detects static looping patterns

3. **Hand Requirements**
   - Both hands must be visible (70%+ confidence)
   - Palms must face upward (Z-normal > 0)
   - Invalid hand positions rejected

4. **Rate Limiting**
   - Debounce timer prevents rapid-fire scores
   - One cycle counts as one point
   - Cooldown enforced server-side

## 📊 Database Schema

### Players Table
```sql
CREATE TABLE players (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  elo INTEGER DEFAULT 1000,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  totalGestures INTEGER DEFAULT 0,
  highestCombo INTEGER DEFAULT 0,
  createdAt DATETIME,
  lastPlayedAt DATETIME
);
```

### Matches Table
```sql
CREATE TABLE matches (
  id TEXT PRIMARY KEY,
  player1Id TEXT NOT NULL,
  player2Id TEXT NOT NULL,
  player1Score INTEGER DEFAULT 0,
  player2Score INTEGER DEFAULT 0,
  winnerId TEXT,
  eloChangePlayer1 INTEGER,
  eloChangePlayer2 INTEGER,
  createdAt DATETIME,
  completedAt DATETIME
);
```

## 🐛 Troubleshooting

### Camera Not Working
- Check browser permissions for camera access
- Make sure camera is not in use by another app
- Try different browser (Chrome recommended)
- Check lighting - MediaPipe works better with good lighting

### Hand Not Detected
- Ensure both hands are visible to camera
- Move closer to camera (30-50cm range optimal)
- Improve lighting in room
- Use neutral background (non-hands)
- Hold palms directly facing camera

### Connection Issues
- Ensure backend is running on port 5001
- Check firewall settings
- Try refreshing page
- Check browser console for errors

### Gesture Not Registering
- Make sure palms face upward (not down/sideways)
- Increase movement magnitude (small shakes won't count)
- Match pace slower than 200ms per cycle
- Ensure left/right hands move opposite directions
- Wait for green validation flash

## 🚀 Future Enhancements

- [ ] Spectator mode with live replay
- [ ] Daily challenges and achievements
- [ ] Custom game modes (relay, team battles)
- [ ] Gesture customization and variants
- [ ] Sound effects and background music
- [ ] Mobile app with PWA support
- [ ] Discord integration and stats tracking
- [ ] Tournament mode with brackets
- [ ] Skin/cosmetics shop
- [ ] AI practice bot for training
- [ ] Replay system with highlights
- [ ] Streaming integration (Twitch/YouTube)
- [ ] Cross-platform multiplayer
- [ ] Advanced analytics and heatmaps
- [ ] Gesture difficulty levels

## 📝 License

MIT License - Feel free to use and modify!

## 👥 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create feature branch
3. Make your changes
4. Submit pull request

## 🎉 Have Fun!

Gesture Battle is designed to be fast, competitive, and addictive. Master your rhythm, climb the rankings, and become the ultimate gesture champion!

**Good luck on the arena! ⚡**
