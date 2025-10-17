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

// Tournament state
let tournamentState = {
    groups: [
        { id: 1, name: 'Група 1', players: ['Черняк Юрій', 'Костюк Артем', 'Мороз Олександр'] },
        { id: 2, name: 'Група 2', players: ['Денисюк Іван', 'Віка', 'Ройко Діма'] },
        { id: 3, name: 'Група 3', players: ['Назарук Богдан', 'Вітя', 'Тарас'] },
        { id: 4, name: 'Група 4', players: ['Дракон', 'Черняк Микола', 'Ліна'] }
    ],
    semifinals: [null, null, null, null], // Winners from groups
    finals: [null, null], // Winners from semifinals
    winner: null,
    currentRound: 'groups' // groups, semifinals, finals, winner
};

// Betting state - { playerName: { userId: amount } }
let bets = {};

// User state - { socketId: { name, bottles } }
let users = {};

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Send initial state
    socket.emit('tournament-state', tournamentState);
    socket.emit('bets-state', bets);
    socket.emit('users-state', users);

    // User joins
    socket.on('join', (userName) => {
        users[socket.id] = {
            name: userName,
            bottles: 10, // Starting bottles
            isAdmin: userName === 'admin'
        };
        io.emit('users-state', users);
    });

    // Admin updates tournament
    socket.on('update-tournament', (newState) => {
        if (users[socket.id]?.isAdmin) {
            tournamentState = newState;
            io.emit('tournament-state', tournamentState);
        }
    });

    // Place bet
    socket.on('place-bet', ({ player, amount }) => {
        const user = users[socket.id];
        if (!user || user.bottles < amount) return;

        if (!bets[player]) bets[player] = {};

        // Return previous bet if exists
        if (bets[player][socket.id]) {
            user.bottles += bets[player][socket.id];
        }

        bets[player][socket.id] = amount;
        user.bottles -= amount;

        io.emit('bets-state', bets);
        io.emit('users-state', users);
    });

    // Remove bet
    socket.on('remove-bet', ({ player }) => {
        const user = users[socket.id];
        if (!user || !bets[player]?.[socket.id]) return;

        user.bottles += bets[player][socket.id];
        delete bets[player][socket.id];

        if (Object.keys(bets[player]).length === 0) {
            delete bets[player];
        }

        io.emit('bets-state', bets);
        io.emit('users-state', users);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        delete users[socket.id];
        io.emit('users-state', users);
    });
});

const PORT = 3000;
httpServer.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
