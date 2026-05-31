const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const fs = require('fs');
const http = require('http');
const https = require('https');
const WebSocket = require('ws');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const sslKeyFile = process.env.SSL_KEY_FILE;
const sslCertFile = process.env.SSL_CRT_FILE || process.env.SSL_CERT_FILE;
const useHttps = sslKeyFile && sslCertFile;
const server = useHttps
  ? https.createServer({
      key: fs.readFileSync(sslKeyFile),
      cert: fs.readFileSync(sslCertFile)
    }, app)
  : http.createServer(app);
const wss = new WebSocket.Server({ server });

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Database
const db = require('./db');
db.initialize();

// Import services and routes
const GameManager = require('./services/GameManager');
const matchRoutes = require('./routes/matches');
const playerRoutes = require('./routes/players');
const leaderboardRoutes = require('./routes/leaderboard');

// Routes
app.use('/api/matches', matchRoutes);
app.use('/api/players', playerRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// WebSocket
const gameManager = new GameManager(wss);

wss.on('connection', (ws) => {
  console.log('Client connected');
  
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data);
      gameManager.handleMessage(ws, message);
    } catch (error) {
      console.error('WebSocket message error:', error);
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
    gameManager.handleDisconnect(ws);
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  const protocol = useHttps ? 'https' : 'http';
  const wsProtocol = useHttps ? 'wss' : 'ws';
  console.log(`Server running at ${protocol}://localhost:${PORT}`);
  console.log(`WebSocket listening at ${wsProtocol}://localhost:${PORT}`);
});
