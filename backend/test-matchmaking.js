const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');

const players = [
  { playerId: uuidv4(), username: `TestPlayer_${Date.now()}_1`, elo: 1000 },
  { playerId: uuidv4(), username: `TestPlayer_${Date.now()}_2`, elo: 1000 }
];

const ws1 = new WebSocket('ws://localhost:5000');
const ws2 = new WebSocket('ws://localhost:5000');

ws1.on('open', () => {
  console.log('[Player 1] Connected');
  ws1.send(JSON.stringify({
    type: 'join_queue',
    payload: players[0]
  }));
});

ws1.on('message', (data) => {
  const message = JSON.parse(data);
  console.log('[Player 1] Received:', message.type, message.payload);
});

ws2.on('open', () => {
  console.log('[Player 2] Connected');
  // Wait a moment before joining, then join
  setTimeout(() => {
    console.log('[Player 2] Sending join_queue...');
    ws2.send(JSON.stringify({
      type: 'join_queue',
      payload: players[1]
    }));
  }, 500);
});

ws2.on('message', (data) => {
  const message = JSON.parse(data);
  console.log('[Player 2] Received:', message.type, message.payload);
});

ws1.on('error', (err) => console.error('[Player 1] Error:', err));
ws2.on('error', (err) => console.error('[Player 2] Error:', err));

setTimeout(() => {
  console.log('\nClosing connections...');
  ws1.close();
  ws2.close();
  process.exit(0);
}, 10000);
