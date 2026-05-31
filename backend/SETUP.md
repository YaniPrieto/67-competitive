# Backend Setup Instructions

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Create Environment File
Copy `.env.example` to `.env` and adjust if needed:
```bash
cp .env.example .env
```

### 3. Start Server
Development mode (with auto-reload):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

Server will be running at:
- HTTP: `http://localhost:5000`
- WebSocket: `ws://localhost:5001`

## Database

SQLite database is automatically created at:
```
./data/gesture-battle.db
```

Database is initialized with three tables:
- `players` - Player profiles and stats
- `matches` - Match records
- `matchHistory` - Individual match history entries

## API Endpoints

### Health Check
```
GET /api/health
```

### Player Management
```
POST   /api/players/register          - Create new player
GET    /api/players/:id                - Get player profile
GET    /api/players/username/:username - Find by username
GET    /api/players/:id/history        - Get match history
PATCH  /api/players/:id                - Update player
```

### Matches
```
GET /api/matches/:id                   - Get match details
GET /api/matches/player/:playerId      - Get player's matches
```

### Leaderboard
```
GET /api/leaderboard                   - Global leaderboard (paginated)
GET /api/leaderboard/seasonal/top      - Top 100 players
GET /api/leaderboard/player/:playerId  - Get player's rank
```

## WebSocket Events

### Server listens for:
- `join_queue` - Player joins matchmaking
- `leave_queue` - Player leaves queue
- `gesture_detected` - Gesture validation from client
- `match_frame_data` - Optional frame data
- `match_end` - Match end signal

### Server sends:
- `queue_joined` - Confirmation of queue join
- `match_found` - Match opponent found
- `countdown` - Pre-match countdown
- `match_start` - Game started
- `score_update` - Score changed
- `gesture_accepted` - Gesture validated
- `match_timer` - Time remaining
- `match_end` - Match completed with results
- `error` - Error message

## Troubleshooting

### Port Already in Use
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Mac/Linux
lsof -i :5000
kill -9 <PID>
```

### Database Locked
Delete `data/gesture-battle.db` and restart. Database will be recreated automatically.

### WebSocket Connection Failed
- Check firewall settings
- Ensure port 5001 is not blocked
- Check CORS configuration in `server.js`

## Performance Tips

- Adjust MediaPipe model complexity in frontend for performance
- Use connection pooling for database in production
- Add Redis caching for leaderboard
- Implement rate limiting on API endpoints
- Use nginx/reverse proxy for production

## Development

### Key Files

- `src/server.js` - Main server entry point
- `src/db.js` - Database setup and queries
- `src/services/GameManager.js` - Core game logic and multiplayer handling
- `src/services/GestureDetector.js` - Gesture recognition algorithm
- `src/models/Player.js` - Player data model
- `src/models/Match.js` - Match data model
- `src/routes/` - API endpoint handlers

### Adding Features

1. **New Player Stat** - Update `Player.js` model and database schema
2. **New Game Mode** - Extend `GameManager.js` with mode logic
3. **New API Endpoint** - Add route to `routes/` and database query
4. **New Gesture** - Modify `GestureDetector.js` recognition logic

## Production Deployment

### Requirements
- Node.js 16+ server
- SQLite (included) or PostgreSQL (recommended)
- SSL certificate for WebSocket (wss://)
- PM2 or similar process manager

### Recommended Setup
```bash
npm install -g pm2
pm2 start src/server.js --name gesture-battle
pm2 save
pm2 startup
```

### Environment Variables (Production)
```
NODE_ENV=production
PORT=5000
WS_PORT=5001
DATABASE_PATH=/data/gesture-battle.db
```

---

Need help? Check the main [README.md](../README.md) for full documentation.
