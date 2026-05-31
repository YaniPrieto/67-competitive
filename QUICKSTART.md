# 🚀 Gesture Battle - Quick Start Guide

Get the game up and running in 5 minutes!

## ⚡ Fastest Setup

### Terminal 1: Start Backend
```bash
cd gesture-battle/backend
npm install
npm run dev
```

✅ Backend ready at `http://localhost:5000` and `ws://localhost:5001`

### Terminal 2: Start Frontend
```bash
cd gesture-battle/frontend
npm install
npm start
```

✅ Game opens at `http://localhost:3000`

## 🎮 Play Your First Game

1. **Enter Username** → Type your player name (3+ characters)
2. **Click "Play Ranked"** → Join matchmaking queue
3. **Wait for Opponent** → Usually 10-30 seconds
4. **See Countdown** → 3...2...1... Game starts!
5. **Perform Gesture:**
   - Hold both palms UP facing camera
   - Move hands alternately up ↑ and down ↓
   - LEFT UP + RIGHT DOWN, then reverse
   - Repeat continuously for points
6. **60 Seconds** → Match ends, see results
7. **Win & Gain ELO** → Climb the rankings!

## 📋 System Requirements

- Node.js 16+
- npm or yarn
- Modern browser (Chrome recommended)
- Webcam (built-in or USB)
- Good lighting for camera

## 🎯 Gesture Pattern

**The Alternating Motion:**

```
Phase 1:        Phase 2:
L↑ R↓           L↓ R↑
```

- Left hand moves UP while Right moves DOWN
- Then Left DOWN while Right UP
- Repeat continuously
- Each complete cycle = +10 points + combo

## 📊 How to Win

| Strategy | Effect |
|----------|--------|
| Faster cycles | More points per second |
| Maintain rhythm | Build combo multiplier |
| Big movements | Better detection |
| Smooth motion | No jitter penalties |

## 🎓 Beginner Tips

✅ **DO:**
- Ensure good lighting
- Show both hands in frame
- Keep palms facing camera
- Use large, smooth movements
- Practice before ranked matches

❌ **DON'T:**
- Play in dark rooms
- Move hands too quickly
- Try tiny shaky motions
- Hide hands at edges
- Give up after first loss!

## 📈 ELO Ranks

| Tier | ELO Range | How to Get |
|------|-----------|-----------|
| 🥉 Bronze | < 1200 | New players start here |
| 🥈 Silver | 1200-1400 | Win 5-10 matches |
| 🥇 Gold | 1400-1600 | Master your rhythm |
| 💎 Platinum | 1600-1800 | Grind to glory |
| ⭐ Diamond | 1800+ | Become a legend! |

## 🔧 Troubleshooting

### "Camera not working"
- Check browser camera permissions
- Try different browser
- Restart browser
- Check lighting

### "Hands not detected"
- Move closer to camera
- Improve room lighting
- Face palms directly at camera
- Check camera isn't blocked

### "Backend connection failed"
- Ensure `npm run dev` running in backend terminal
- Check port 5001 not blocked
- Restart both servers

## 📱 Browser Support

- ✅ Chrome/Chromium (best)
- ✅ Firefox (good)
- ✅ Safari (good)
- ✅ Edge (good)
- ❌ Internet Explorer (not supported)

## 🎮 Game Modes

### Currently Available
- **Ranked** - Competitive 1v1 matches (60s)
- **Leaderboard** - Global rankings by ELO

### Coming Soon
- Casual (no ELO changes)
- Practice vs AI
- Custom game settings
- Tournament mode

## 💾 Your Data

- ✅ Player profile (username, ELO)
- ✅ Win/loss record
- ✅ Match history
- ✅ Global ranking
- 🔐 Stored locally on backend database

## 🌐 Configuration

### Default Ports
- Frontend: `http://localhost:3000` (React)
- Backend API: `http://localhost:5000`
- Backend WebSocket: `ws://localhost:5001`

### To Use Different Server
Edit in `frontend/src/App.jsx`:
```javascript
const WS_URL = 'ws://your-server:5001';
```

## 📚 Full Documentation

- [Main README](README.md) - Complete feature list
- [Backend Setup](backend/SETUP.md) - Server details
- [Frontend Setup](frontend/SETUP.md) - Client details

## ⚙️ Advanced Setup (Optional)

### Using Root Package.json
```bash
# Install all dependencies
npm run install-all

# Start both servers simultaneously
npm run dev

# Start only frontend
npm run dev:frontend

# Start only backend
npm run dev:backend
```

### Production Build
```bash
# Build frontend for production
npm run build

# Creates optimized version in frontend/build/
```

## 🐛 Common Issues

### Issue: WebSocket keeps disconnecting
**Solution:** Restart both backend and frontend

### Issue: Scores not updating
**Solution:** Check browser console for errors, verify backend is running

### Issue: One hand not detected
**Solution:** Ensure both hands visible in camera frame, improve lighting

### Issue: Port already in use
**Solution:**
```bash
# Windows: Find and kill process
netstat -ano | findstr :5000
taskkill /PID <number> /F

# Mac/Linux:
lsof -i :5000
kill -9 <PID>
```

## 🎉 Ready to Play?

```bash
# 1. Start backend (Terminal 1)
cd gesture-battle/backend && npm run dev

# 2. Start frontend (Terminal 2)
cd gesture-battle/frontend && npm start

# 3. Open http://localhost:3000 in browser

# 4. Enter username and click "Play Ranked"

# 5. Master the gesture and win! ⚡
```

## 💡 Pro Tips

- **Practice Solo First** - Get comfortable with motion before ranked
- **Consistent Rhythm** - Steady pace beats speed for points
- **Big Movements** - Larger hand movements = better detection
- **Stay Centered** - Keep hands in middle of frame
- **Learn Patterns** - Different opponents may have different speeds
- **Watch Replays** - Notice what works in opponent's style

## 🤝 Need Help?

Check error logs in browser console (F12):
- Camera permission errors
- WebSocket connection issues
- API failures

## 🎊 Have Fun!

You're ready to become a **Gesture Battle Champion!** 

Good luck on the arena! 

**⚡ May your hands be swift and your rhythm true! ⚡**

---

Questions? See [README.md](README.md) for full documentation.
