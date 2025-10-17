import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

// Admin credentials
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'Whitepower1488';

// Tournament state - according to the schema
let tournamentState = {
  groups: {
    A: { name: 'Група A', players: ['Черняк Юрій', 'Костюк Артем', 'Мороз Олександр'], winner: null },
    B: { name: 'Група B', players: ['Денисюк Іван', 'Віка', 'Ройко Діма'], winner: null },
    C: { name: 'Група C', players: ['Назарук Богдан', 'Вітя', 'Тарас'], winner: null },
    D: { name: 'Група D', players: ['Дракон', 'Черняк Микола', 'Ліна'], winner: null }
  },
  quarterFinals: [
    { id: 1, name: '1/4 фіналу 1', players: [null, null], winner: null }, // A vs B
    { id: 2, name: '1/4 фіналу 2', players: [null, null], winner: null }  // C vs D
  ],
  semiFinals: [
    { id: 1, name: 'Півфінал 1', players: [null, null], winner: null },
    { id: 2, name: 'Півфінал 2', players: [null, null], winner: null }
  ],
  final: { name: 'Фінал', players: [null, null], winner: null },
  currentRound: 'groups' // groups, quarterFinals, semiFinals, final, finished
};

// Registered users - { username: { password, bottles } }
let registeredUsers = {};

// Active bets for current stage - { playerName: { username: amount } }
let activeBets = {};

// Connected users - { socketId: { username, isAdmin } }
let connectedUsers = {};

// Helper to calculate bet payouts
const processBetsForWinner = (winner, loser) => {
  // Get all bets on winner and loser
  const winnerBets = activeBets[winner] || {};
  const loserBets = activeBets[loser] || {};
  
  // Calculate total pool
  const totalOnWinner = Object.values(winnerBets).reduce((sum, amt) => sum + amt, 0);
  const totalOnLoser = Object.values(loserBets).reduce((sum, amt) => sum + amt, 0);
  const totalPool = totalOnWinner + totalOnLoser;
  
  if (totalPool === 0) return;
  
  // Winners get their bet back + proportional share of losers' bets
  Object.entries(winnerBets).forEach(([username, amount]) => {
    if (registeredUsers[username]) {
      const share = totalOnLoser * (amount / totalOnWinner);
      registeredUsers[username].bottles += Math.floor(share);
    }
  });
  
  // Losers lose their bets (already deducted when placed)
};

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Send initial state
  socket.emit('tournament-state', tournamentState);
  socket.emit('users-list', Object.entries(registeredUsers).map(([username, data]) => ({
    username,
    bottles: data.bottles,
    isOnline: Object.values(connectedUsers).some(u => u.username === username)
  })));
  socket.emit('active-bets', activeBets);

  // Register new user
  socket.on('register', ({ username, password }, callback) => {
    if (!username || !password) {
      callback({ success: false, message: 'Логін та пароль обов\'язкові' });
      return;
    }
    
    if (registeredUsers[username]) {
      callback({ success: false, message: 'Користувач вже існує' });
      return;
    }
    
    registeredUsers[username] = {
      password,
      bottles: 20
    };
    
    callback({ success: true });
  });

  // Login
  socket.on('login', ({ username, password }, callback) => {
    // Check admin
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      connectedUsers[socket.id] = { username, isAdmin: true };
      callback({ success: true, isAdmin: true, bottles: Infinity });
      io.emit('users-list', Object.entries(registeredUsers).map(([username, data]) => ({
        username,
        bottles: data.bottles,
        isOnline: Object.values(connectedUsers).some(u => u.username === username)
      })));
      return;
    }
    
    // Check regular user
    if (!registeredUsers[username]) {
      callback({ success: false, message: 'Користувач не знайдений' });
      return;
    }
    
    if (registeredUsers[username].password !== password) {
      callback({ success: false, message: 'Невірний пароль' });
      return;
    }
    
    connectedUsers[socket.id] = { username, isAdmin: false };
    callback({ 
      success: true, 
      isAdmin: false, 
      bottles: registeredUsers[username].bottles 
    });
    
    io.emit('users-list', Object.entries(registeredUsers).map(([username, data]) => ({
      username,
      bottles: data.bottles,
      isOnline: Object.values(connectedUsers).some(u => u.username === username)
    })));
  });

  // Admin: Set group winner
  socket.on('set-group-winner', ({ group, winner }) => {
    if (!connectedUsers[socket.id]?.isAdmin) return;
    
    const loser = tournamentState.groups[group].players.find(p => p !== winner);
    tournamentState.groups[group].winner = winner;
    
    // Process bets
    if (loser) processBetsForWinner(winner, loser);
    
    // Check if all groups finished, move to quarter finals
    const allGroupsFinished = Object.values(tournamentState.groups).every(g => g.winner);
    if (allGroupsFinished) {
      tournamentState.quarterFinals[0].players = [
        tournamentState.groups.A.winner,
        tournamentState.groups.B.winner
      ];
      tournamentState.quarterFinals[1].players = [
        tournamentState.groups.C.winner,
        tournamentState.groups.D.winner
      ];
      tournamentState.currentRound = 'quarterFinals';
    }
    
    io.emit('tournament-state', tournamentState);
    io.emit('users-list', Object.entries(registeredUsers).map(([username, data]) => ({
      username,
      bottles: data.bottles,
      isOnline: Object.values(connectedUsers).some(u => u.username === username)
    })));
    io.emit('active-bets', activeBets);
  });

  // Admin: Set quarter final winner
  socket.on('set-quarterfinal-winner', ({ matchId, winner }) => {
    if (!connectedUsers[socket.id]?.isAdmin) return;
    
    const match = tournamentState.quarterFinals.find(m => m.id === matchId);
    if (!match) return;
    
    const loser = match.players.find(p => p !== winner);
    match.winner = winner;
    
    if (loser) processBetsForWinner(winner, loser);
    
    // Check if both quarter finals finished
    if (tournamentState.quarterFinals.every(m => m.winner)) {
      tournamentState.semiFinals[0].players = [
        tournamentState.quarterFinals[0].winner,
        tournamentState.quarterFinals[1].winner
      ];
      tournamentState.currentRound = 'semiFinals';
    }
    
    io.emit('tournament-state', tournamentState);
    io.emit('users-list', Object.entries(registeredUsers).map(([username, data]) => ({
      username,
      bottles: data.bottles,
      isOnline: Object.values(connectedUsers).some(u => u.username === username)
    })));
    io.emit('active-bets', activeBets);
  });

  // Admin: Set semi final winner
  socket.on('set-semifinal-winner', ({ matchId, winner }) => {
    if (!connectedUsers[socket.id]?.isAdmin) return;
    
    const match = tournamentState.semiFinals.find(m => m.id === matchId);
    if (!match) return;
    
    const loser = match.players.find(p => p !== winner);
    match.winner = winner;
    
    if (loser) processBetsForWinner(winner, loser);
    
    // Move to final
    if (tournamentState.semiFinals[0].winner) {
      tournamentState.final.players = [tournamentState.semiFinals[0].winner, null];
      tournamentState.currentRound = 'final';
    }
    
    io.emit('tournament-state', tournamentState);
    io.emit('users-list', Object.entries(registeredUsers).map(([username, data]) => ({
      username,
      bottles: data.bottles,
      isOnline: Object.values(connectedUsers).some(u => u.username === username)
    })));
    io.emit('active-bets', activeBets);
  });

  // Admin: Set final winner
  socket.on('set-final-winner', ({ winner }) => {
    if (!connectedUsers[socket.id]?.isAdmin) return;
    
    const loser = tournamentState.final.players.find(p => p !== winner);
    tournamentState.final.winner = winner;
    
    if (loser) processBetsForWinner(winner, loser);
    
    tournamentState.currentRound = 'finished';
    
    io.emit('tournament-state', tournamentState);
    io.emit('users-list', Object.entries(registeredUsers).map(([username, data]) => ({
      username,
      bottles: data.bottles,
      isOnline: Object.values(connectedUsers).some(u => u.username === username)
    })));
    io.emit('active-bets', activeBets);
  });

  // Place bet
  socket.on('place-bet', ({ player, amount }) => {
    const user = connectedUsers[socket.id];
    if (!user || user.isAdmin) return;
    
    const userData = registeredUsers[user.username];
    if (!userData || userData.bottles < amount) return;
    
    // Initialize bets for player
    if (!activeBets[player]) activeBets[player] = {};
    
    // Return previous bet if exists
    if (activeBets[player][user.username]) {
      userData.bottles += activeBets[player][user.username];
    }
    
    // Place new bet
    activeBets[player][user.username] = amount;
    userData.bottles -= amount;
    
    io.emit('active-bets', activeBets);
    io.emit('users-list', Object.entries(registeredUsers).map(([username, data]) => ({
      username,
      bottles: data.bottles,
      isOnline: Object.values(connectedUsers).some(u => u.username === username)
    })));
    
    // Send updated bottles to user
    socket.emit('update-bottles', userData.bottles);
  });

  // Remove bet
  socket.on('remove-bet', ({ player }) => {
    const user = connectedUsers[socket.id];
    if (!user || user.isAdmin) return;
    
    const userData = registeredUsers[user.username];
    if (!userData || !activeBets[player]?.[user.username]) return;
    
    userData.bottles += activeBets[player][user.username];
    delete activeBets[player][user.username];
    
    if (Object.keys(activeBets[player]).length === 0) {
      delete activeBets[player];
    }
    
    io.emit('active-bets', activeBets);
    io.emit('users-list', Object.entries(registeredUsers).map(([username, data]) => ({
      username,
      bottles: data.bottles,
      isOnline: Object.values(connectedUsers).some(u => u.username === username)
    })));
    
    socket.emit('update-bottles', userData.bottles);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    delete connectedUsers[socket.id];
    io.emit('users-list', Object.entries(registeredUsers).map(([username, data]) => ({
      username,
      bottles: data.bottles,
      isOnline: Object.values(connectedUsers).some(u => u.username === username)
    })));
  });
});

const PORT = 3000;
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
