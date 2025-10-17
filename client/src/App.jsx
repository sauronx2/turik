import { useState, useEffect } from 'react';
import io from 'socket.io-client';
import TournamentBracket from './components/TournamentBracket';
import BettingPanel from './components/BettingPanel';
import UserPanel from './components/UserPanel';

const socket = io('http://localhost:3000');

function App() {
    const [userName, setUserName] = useState('');
    const [isJoined, setIsJoined] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [tournamentState, setTournamentState] = useState(null);
    const [bets, setBets] = useState({});
    const [users, setUsers] = useState({});
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        socket.on('tournament-state', (state) => {
            setTournamentState(state);
        });

        socket.on('bets-state', (betsData) => {
            setBets(betsData);
        });

        socket.on('users-state', (usersData) => {
            setUsers(usersData);
            if (socket.id && usersData[socket.id]) {
                setCurrentUser(usersData[socket.id]);
            }
        });

        return () => {
            socket.off('tournament-state');
            socket.off('bets-state');
            socket.off('users-state');
        };
    }, []);

    const handleJoin = (e) => {
        e.preventDefault();
        if (!userName.trim()) return;

        const admin = userName.toLowerCase() === 'admin';
        setIsAdmin(admin);
        socket.emit('join', userName);
        setIsJoined(true);
    };

    const handlePlaceBet = (player, amount) => {
        socket.emit('place-bet', { player, amount });
    };

    const handleRemoveBet = (player) => {
        socket.emit('remove-bet', { player });
    };

    const handleUpdateTournament = (newState) => {
        socket.emit('update-tournament', newState);
    };

    if (!isJoined) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
                    <h1 className="text-4xl font-bold text-center mb-8 text-purple-600">
                        🏆 Турнір
                    </h1>
                    <form onSubmit={handleJoin} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Ваше ім'я
                            </label>
                            <input
                                type="text"
                                value={userName}
                                onChange={(e) => setUserName(e.target.value)}
                                placeholder="Введіть ім'я..."
                                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 transition"
                                autoFocus
                            />
                            <p className="mt-2 text-xs text-gray-500">
                                💡 Введіть "admin" для режиму адміністратора
                            </p>
                        </div>
                        <button
                            type="submit"
                            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition transform hover:scale-105"
                        >
                            Приєднатись
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 mb-6 shadow-xl">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                                🏆 Турнір {isAdmin && <span className="text-yellow-300">👑 Адмін</span>}
                            </h1>
                            <p className="text-white/70 mt-1">
                                {currentUser?.name} • {currentUser?.bottles || 0} 🍺
                            </p>
                        </div>
                        <UserPanel users={users} currentUserId={socket.id} />
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Tournament Bracket */}
                    <div className="lg:col-span-2">
                        <TournamentBracket
                            tournamentState={tournamentState}
                            isAdmin={isAdmin}
                            onUpdate={handleUpdateTournament}
                        />
                    </div>

                    {/* Betting Panel */}
                    <div>
                        <BettingPanel
                            bets={bets}
                            users={users}
                            currentUser={currentUser}
                            currentUserId={socket.id}
                            tournamentState={tournamentState}
                            onPlaceBet={handlePlaceBet}
                            onRemoveBet={handleRemoveBet}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default App;
