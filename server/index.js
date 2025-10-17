import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: true, // Allow all origins in local network
        methods: ["GET", "POST"],
        credentials: true
    }
});

// Admin credentials
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'Whitepower1488';

// Tournament state - according to the schema
// Groups: 3 players each, top 2 advance
let tournamentState = {
    groups: {
        A: { name: 'Група A', players: ['Черняк Юрій', 'Костюк Артем', 'Мороз Олександр'], first: null, second: null },
        B: { name: 'Група B', players: ['Денисюк Іван', 'Віка', 'Ройко Діма'], first: null, second: null },
        C: { name: 'Група C', players: ['Назарук Богдан', 'Вітя', 'Тарас'], first: null, second: null },
        D: { name: 'Група D', players: ['Дракон', 'Черняк Микола', 'Ліна'], first: null, second: null }
    },
    quarterFinals: [
        { id: 1, name: '1/4 фіналу 1', players: [null, null], winner: null }, // A1 vs B2
        { id: 2, name: '1/4 фіналу 2', players: [null, null], winner: null }, // B1 vs A2
        { id: 3, name: '1/4 фіналу 3', players: [null, null], winner: null }, // C1 vs D2
        { id: 4, name: '1/4 фіналу 4', players: [null, null], winner: null }  // D1 vs C2
    ],
    semiFinals: [
        { id: 1, name: 'Півфінал 1', players: [null, null], winner: null }, // Winner QF1 vs Winner QF2
        { id: 2, name: 'Півфінал 2', players: [null, null], winner: null }  // Winner QF3 vs Winner QF4
    ],
    final: { name: 'Фінал', players: [null, null], winner: null },
    currentRound: 'groups' // groups, quarterFinals, semiFinals, final, finished
};

// Registered users - { username: { password, bottles } }
let registeredUsers = {};

// Active bets for current stage - { playerName: { username: amount } }
let activeBets = {};

// Persistence - save/load users to file
// Persistence files
const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const TOURNAMENT_FILE = path.join(DATA_DIR, 'tournament.json');
const BETS_FILE = path.join(DATA_DIR, 'bets.json');
const CHAT_FILE = path.join(DATA_DIR, 'chat.json');

// Create data directory if it doesn't exist
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    console.log('📁 Created data directory');
}

function saveUsers() {
    try {
        fs.writeFileSync(USERS_FILE, JSON.stringify(registeredUsers, null, 2));
        console.log('💾 Users saved');
    } catch (error) {
        console.error('❌ Error saving users:', error);
    }
}

function loadUsers() {
    try {
        if (fs.existsSync(USERS_FILE)) {
            const data = fs.readFileSync(USERS_FILE, 'utf8');
            registeredUsers = JSON.parse(data);
            console.log(`✅ Loaded ${Object.keys(registeredUsers).length} users`);
        } else {
            console.log('📝 No users file found, starting fresh');
        }
    } catch (error) {
        console.error('❌ Error loading users:', error);
        registeredUsers = {};
    }
}

function saveTournament() {
    try {
        fs.writeFileSync(TOURNAMENT_FILE, JSON.stringify(tournamentState, null, 2));
        console.log('💾 Tournament saved');
    } catch (error) {
        console.error('❌ Error saving tournament:', error);
    }
}

function loadTournament() {
    try {
        if (fs.existsSync(TOURNAMENT_FILE)) {
            const data = fs.readFileSync(TOURNAMENT_FILE, 'utf8');
            tournamentState = JSON.parse(data);
            console.log('✅ Tournament state loaded');
        } else {
            console.log('📝 No tournament file found, using default');
        }
    } catch (error) {
        console.error('❌ Error loading tournament:', error);
    }
}

function saveBets() {
    try {
        fs.writeFileSync(BETS_FILE, JSON.stringify(activeBets, null, 2));
        console.log('💾 Bets saved');
    } catch (error) {
        console.error('❌ Error saving bets:', error);
    }
}

function loadBets() {
    try {
        if (fs.existsSync(BETS_FILE)) {
            const data = fs.readFileSync(BETS_FILE, 'utf8');
            activeBets = JSON.parse(data);
            console.log(`✅ Loaded ${Object.keys(activeBets).length} active bets`);
        } else {
            console.log('📝 No bets file found, starting fresh');
        }
    } catch (error) {
        console.error('❌ Error loading bets:', error);
        activeBets = {};
    }
}

function saveChat() {
    try {
        fs.writeFileSync(CHAT_FILE, JSON.stringify(chatMessages, null, 2));
        console.log('💾 Chat saved');
    } catch (error) {
        console.error('❌ Error saving chat:', error);
    }
}

function loadChat() {
    try {
        if (fs.existsSync(CHAT_FILE)) {
            const data = fs.readFileSync(CHAT_FILE, 'utf8');
            chatMessages = JSON.parse(data);
            console.log(`✅ Loaded ${chatMessages.length} chat messages`);
        } else {
            console.log('📝 No chat file found, starting fresh');
        }
    } catch (error) {
        console.error('❌ Error loading chat:', error);
        chatMessages = [];
    }
}

// Connected users - { socketId: { username, isAdmin } }
let connectedUsers = {};

// Chat messages - { id, username, message, timestamp }
let chatMessages = [];

// Muted users - { username: unmuteTimestamp }
let mutedUsers = {};

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

    // Helper function to get users list without admin
    const getUsersList = () => {
        return Object.entries(registeredUsers).map(([username, data]) => ({
            username,
            bottles: data.bottles,
            isOnline: Object.values(connectedUsers).some(u => u.username === username && !u.isAdmin)
        }));
    };

    // Send initial state
    socket.emit('tournament-state', tournamentState);
    socket.emit('users-list', getUsersList());
    socket.emit('active-bets', activeBets);
    socket.emit('chat-history', chatMessages);
    socket.emit('muted-users', mutedUsers);

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

        saveUsers(); // Save to file

        // Auto-login after registration
        connectedUsers[socket.id] = { username, isAdmin: false };

        io.emit('users-list', getUsersList());
        callback({ success: true, isAdmin: false, bottles: 20, username });
    });

    // Login
    socket.on('login', ({ username, password }, callback) => {
        // Check admin
        if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
            connectedUsers[socket.id] = { username, isAdmin: true };
            callback({ success: true, isAdmin: true, bottles: Infinity, username });
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
            bottles: registeredUsers[username].bottles,
            username
        });

        io.emit('users-list', getUsersList());
    });

    // Admin: Set group rankings (1st and 2nd place)
    socket.on('set-group-rankings', ({ group, first, second }) => {
        if (!connectedUsers[socket.id]?.isAdmin) return;

        const groupData = tournamentState.groups[group];
        groupData.first = first;
        groupData.second = second;

        // Check if all groups finished, move to quarter finals
        const allGroupsFinished = Object.values(tournamentState.groups).every(g => g.first && g.second);
        if (allGroupsFinished) {
            // Cross bracket: A1-B2, B1-A2, C1-D2, D1-C2
            tournamentState.quarterFinals[0].players = [
                tournamentState.groups.A.first,
                tournamentState.groups.B.second
            ];
            tournamentState.quarterFinals[1].players = [
                tournamentState.groups.B.first,
                tournamentState.groups.A.second
            ];
            tournamentState.quarterFinals[2].players = [
                tournamentState.groups.C.first,
                tournamentState.groups.D.second
            ];
            tournamentState.quarterFinals[3].players = [
                tournamentState.groups.D.first,
                tournamentState.groups.C.second
            ];
            tournamentState.currentRound = 'quarterFinals';
        }

        saveTournament();
        io.emit('tournament-state', tournamentState);
        io.emit('users-list', getUsersList());
    });

    // Admin: Set quarter final winner
    socket.on('set-quarterfinal-winner', ({ matchId, winner }) => {
        if (!connectedUsers[socket.id]?.isAdmin) return;

        const match = tournamentState.quarterFinals.find(m => m.id === matchId);
        if (!match) return;

        const loser = match.players.find(p => p !== winner);
        match.winner = winner;

        if (loser) processBetsForWinner(winner, loser);

        // Check if all 4 quarter finals finished
        if (tournamentState.quarterFinals.every(m => m.winner)) {
            tournamentState.semiFinals[0].players = [
                tournamentState.quarterFinals[0].winner,
                tournamentState.quarterFinals[1].winner
            ];
            tournamentState.semiFinals[1].players = [
                tournamentState.quarterFinals[2].winner,
                tournamentState.quarterFinals[3].winner
            ];
            tournamentState.currentRound = 'semiFinals';
        }

        saveTournament();
        saveBets();
        io.emit('tournament-state', tournamentState);
        io.emit('users-list', getUsersList());
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

        // Move to final when both semis are done
        if (tournamentState.semiFinals.every(m => m.winner)) {
            tournamentState.final.players = [
                tournamentState.semiFinals[0].winner,
                tournamentState.semiFinals[1].winner
            ];
            tournamentState.currentRound = 'final';
        }

        saveTournament();
        saveBets();
        io.emit('tournament-state', tournamentState);
        io.emit('users-list', getUsersList());
        io.emit('active-bets', activeBets);
    });

    // Admin: Set final winner
    socket.on('set-final-winner', ({ winner }) => {
        if (!connectedUsers[socket.id]?.isAdmin) return;

        const loser = tournamentState.final.players.find(p => p !== winner);
        tournamentState.final.winner = winner;

        if (loser) processBetsForWinner(winner, loser);

        tournamentState.currentRound = 'finished';

        saveTournament();
        saveBets();
        io.emit('tournament-state', tournamentState);
        io.emit('users-list', getUsersList());
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

        saveUsers();
        saveBets();
        io.emit('active-bets', activeBets);
        io.emit('users-list', getUsersList());

        // Send updated bottles to user
        socket.emit('update-bottles', userData.bottles);
    });

    // Admin: Remove user's bet
    socket.on('admin-remove-bet', ({ player, targetUsername }) => {
        const user = connectedUsers[socket.id];
        if (!user?.isAdmin) return;

        const userData = registeredUsers[targetUsername];
        if (!userData || !activeBets[player]?.[targetUsername]) return;

        userData.bottles += activeBets[player][targetUsername];
        delete activeBets[player][targetUsername];

        if (Object.keys(activeBets[player]).length === 0) {
            delete activeBets[player];
        }

        saveUsers();
        saveBets();
        io.emit('active-bets', activeBets);
        io.emit('users-list', Object.entries(registeredUsers).map(([username, data]) => ({
            username,
            bottles: data.bottles,
            isOnline: Object.values(connectedUsers).some(u => u.username === username)
        })));
    });

    // Admin: Reset match
    socket.on('admin-reset-match', ({ stage, matchId }) => {
        if (!connectedUsers[socket.id]?.isAdmin) return;

        if (stage === 'group') {
            tournamentState.groups[matchId].first = null;
            tournamentState.groups[matchId].second = null;
        } else if (stage === 'quarterFinals') {
            const match = tournamentState.quarterFinals.find(m => m.id === matchId);
            if (match) match.winner = null;
        } else if (stage === 'semiFinals') {
            const match = tournamentState.semiFinals.find(m => m.id === matchId);
            if (match) match.winner = null;
        } else if (stage === 'final') {
            tournamentState.final.winner = null;
        }

        saveTournament();
        io.emit('tournament-state', tournamentState);
    });

    // Admin: Full tournament reset
    socket.on('admin-full-reset', () => {
        if (!connectedUsers[socket.id]?.isAdmin) return;

        console.log('⚠️ FULL RESET initiated by admin');

        // Reset tournament to initial state
        tournamentState = {
            groups: {
                A: { name: 'Група A', players: ['Черняк Юрій', 'Костюк Артем', 'Мороз Олександр'], first: null, second: null },
                B: { name: 'Група B', players: ['Денисюк Іван', 'Віка', 'Ройко Діма'], first: null, second: null },
                C: { name: 'Група C', players: ['Назарук Богдан', 'Вітя', 'Тарас'], first: null, second: null },
                D: { name: 'Група D', players: ['Дракон', 'Черняк Микола', 'Ліна'], first: null, second: null }
            },
            quarterFinals: [
                { id: 1, name: '1/4 фіналу 1', players: [null, null], winner: null },
                { id: 2, name: '1/4 фіналу 2', players: [null, null], winner: null },
                { id: 3, name: '1/4 фіналу 3', players: [null, null], winner: null },
                { id: 4, name: '1/4 фіналу 4', players: [null, null], winner: null }
            ],
            semiFinals: [
                { id: 1, name: 'Півфінал 1', players: [null, null], winner: null },
                { id: 2, name: 'Півфінал 2', players: [null, null], winner: null }
            ],
            final: { name: 'Фінал', players: [null, null], winner: null },
            currentRound: 'groups'
        };

        // Reset all user balances to 20
        Object.keys(registeredUsers).forEach(username => {
            registeredUsers[username].bottles = 20;
        });

        saveUsers(); // Save updated balances

        // Clear all active bets
        activeBets = {};

        // Clear chat
        chatMessages = [];

        // Clear mutes
        mutedUsers = {};

        // Save all data
        saveTournament();
        saveBets();
        saveChat();
        // users already saved above

        // Broadcast updates
        io.emit('tournament-state', tournamentState);
        io.emit('users-list', getUsersList());
        io.emit('active-bets', activeBets);
        io.emit('chat-history', chatMessages);
        io.emit('muted-users', mutedUsers);

        console.log('✅ FULL RESET completed');
    });

    // Admin: Replace player
    socket.on('admin-replace-player', ({ oldPlayer, newPlayer }) => {
        if (!connectedUsers[socket.id]?.isAdmin) return;

        // Replace in groups
        Object.values(tournamentState.groups).forEach(group => {
            const idx = group.players.indexOf(oldPlayer);
            if (idx !== -1) {
                group.players[idx] = newPlayer;
            }
            if (group.first === oldPlayer) {
                group.first = newPlayer;
            }
            if (group.second === oldPlayer) {
                group.second = newPlayer;
            }
        });

        // Replace in quarter finals
        tournamentState.quarterFinals.forEach(match => {
            match.players = match.players.map(p => p === oldPlayer ? newPlayer : p);
            if (match.winner === oldPlayer) match.winner = newPlayer;
        });

        // Replace in semi finals
        tournamentState.semiFinals.forEach(match => {
            match.players = match.players.map(p => p === oldPlayer ? newPlayer : p);
            if (match.winner === oldPlayer) match.winner = newPlayer;
        });

        // Replace in final
        tournamentState.final.players = tournamentState.final.players.map(p => p === oldPlayer ? newPlayer : p);
        if (tournamentState.final.winner === oldPlayer) {
            tournamentState.final.winner = newPlayer;
        }

        // Replace in bets
        if (activeBets[oldPlayer]) {
            activeBets[newPlayer] = activeBets[oldPlayer];
            delete activeBets[oldPlayer];
        }

        saveTournament();
        saveBets();
        io.emit('tournament-state', tournamentState);
        io.emit('active-bets', activeBets);
    });

    // Chat message
    socket.on('chat-message', ({ message }) => {
        const user = connectedUsers[socket.id];
        console.log('Chat message received:', { user, message, isAdmin: user?.isAdmin });

        if (!user) {
            console.log('Message rejected: no user');
            return;
        }

        // Check if user is muted (not for admin)
        if (!user.isAdmin && mutedUsers[user.username]) {
            const now = Date.now();
            if (mutedUsers[user.username] > now) {
                const remainingSeconds = Math.ceil((mutedUsers[user.username] - now) / 1000);
                socket.emit('chat-error', { message: `Ви в муті ще ${remainingSeconds} секунд` });
                console.log('Message rejected: user is muted');
                return;
            } else {
                // Mute expired
                delete mutedUsers[user.username];
            }
        }

        const chatMessage = {
            id: Date.now(),
            username: user.username,
            message: message.trim().substring(0, 200),
            timestamp: new Date().toISOString(),
            isAdmin: user.isAdmin || false
        };

        console.log('Broadcasting chat message:', chatMessage);
        chatMessages.push(chatMessage);

        // Keep only last 100 messages
        if (chatMessages.length > 100) {
            chatMessages = chatMessages.slice(-100);
        }

        saveChat();
        io.emit('chat-message', chatMessage);
    });

    // Admin: Mute user
    socket.on('admin-mute-user', ({ targetUsername, minutes }) => {
        const user = connectedUsers[socket.id];
        if (!user?.isAdmin) return;

        if (targetUsername === 'admin') return; // Can't mute admin

        const muteUntil = Date.now() + (minutes * 60 * 1000);
        mutedUsers[targetUsername] = muteUntil;

        console.log(`Admin muted ${targetUsername} for ${minutes} minutes`);

        // Notify all users about muted list
        io.emit('muted-users', mutedUsers);
    });

    // Admin: Unmute user
    socket.on('admin-unmute-user', ({ targetUsername }) => {
        const user = connectedUsers[socket.id];
        if (!user?.isAdmin) return;

        delete mutedUsers[targetUsername];

        console.log(`Admin unmuted ${targetUsername}`);

        io.emit('muted-users', mutedUsers);
    });

    // Admin: Get all registered users (CRUD)
    socket.on('admin-get-all-users', (callback) => {
        const user = connectedUsers[socket.id];
        if (!user?.isAdmin) {
            callback({ success: false, message: 'Unauthorized' });
            return;
        }

        const allUsers = Object.keys(registeredUsers).map(username => ({
            username,
            bottles: registeredUsers[username].bottles,
            password: registeredUsers[username].password // Include for admin view
        }));

        callback({ success: true, users: allUsers });
    });

    // Admin: Delete user
    socket.on('admin-delete-user', ({ targetUsername }, callback) => {
        const user = connectedUsers[socket.id];
        if (!user?.isAdmin) {
            callback({ success: false, message: 'Unauthorized' });
            return;
        }

        if (targetUsername === 'admin') {
            callback({ success: false, message: 'Cannot delete admin' });
            return;
        }

        if (!registeredUsers[targetUsername]) {
            callback({ success: false, message: 'User not found' });
            return;
        }

        delete registeredUsers[targetUsername];

        // Remove their bets
        Object.keys(activeBets).forEach(playerName => {
            if (activeBets[playerName][targetUsername]) {
                delete activeBets[playerName][targetUsername];
            }
        });

        saveUsers();

        console.log(`Admin deleted user: ${targetUsername}`);

        io.emit('users-list', getUsersList());
        io.emit('active-bets', activeBets);
        callback({ success: true, message: `Користувача ${targetUsername} видалено` });
    });

    // Admin: Reset user password
    socket.on('admin-reset-password', ({ targetUsername, newPassword }, callback) => {
        const user = connectedUsers[socket.id];
        if (!user?.isAdmin) {
            callback({ success: false, message: 'Unauthorized' });
            return;
        }

        if (targetUsername === 'admin') {
            callback({ success: false, message: 'Cannot reset admin password' });
            return;
        }

        if (!registeredUsers[targetUsername]) {
            callback({ success: false, message: 'User not found' });
            return;
        }

        registeredUsers[targetUsername].password = newPassword;
        saveUsers();

        console.log(`Admin reset password for: ${targetUsername}`);

        callback({ success: true, message: `Пароль для ${targetUsername} скинуто` });
    });

    // Admin: Update user bottles
    socket.on('admin-update-bottles', ({ targetUsername, newBottles }, callback) => {
        const user = connectedUsers[socket.id];
        if (!user?.isAdmin) {
            callback({ success: false, message: 'Unauthorized' });
            return;
        }

        if (targetUsername === 'admin') {
            callback({ success: false, message: 'Cannot modify admin' });
            return;
        }

        if (!registeredUsers[targetUsername]) {
            callback({ success: false, message: 'User not found' });
            return;
        }

        registeredUsers[targetUsername].bottles = parseInt(newBottles);
        saveUsers();

        console.log(`Admin updated bottles for ${targetUsername}: ${newBottles}`);

        io.emit('users-list', getUsersList());
        callback({ success: true, message: `Баланс ${targetUsername} оновлено` });
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        delete connectedUsers[socket.id];
        io.emit('users-list', getUsersList());
    });
});

// Load all data from files on startup
loadUsers();
loadTournament();
loadBets();
loadChat();

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
    console.log(`📡 Accessible on local network`);
});
