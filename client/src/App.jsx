import { useState, useEffect } from 'react';
import io from 'socket.io-client';
import AuthScreen from './components/AuthScreen';
import TournamentBracket from './components/TournamentBracket';
import BettingPanel from './components/BettingPanel';
import Leaderboard from './components/Leaderboard';
import Chat from './components/Chat';
import AdminPanel from './components/AdminPanel';
import NetworkInfo from './components/NetworkInfo';

// Connect to backend (auto-detect local or network IP)
const backendUrl = window.location.hostname === 'localhost' 
  ? 'http://localhost:3000'
  : `http://${window.location.hostname}:3000`;

const socket = io(backendUrl);
window.socketInstance = socket; // Make socket globally accessible

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [username, setUsername] = useState('');
    const [isAdmin, setIsAdmin] = useState(false);
    const [bottles, setBottles] = useState(20);
    const [tournamentState, setTournamentState] = useState(null);
    const [activeBets, setActiveBets] = useState({});
    const [usersList, setUsersList] = useState([]);
    const [chatMessages, setChatMessages] = useState([]);
    const [showAdminPanel, setShowAdminPanel] = useState(false);
    const [mutedUsers, setMutedUsers] = useState({});

    // Load session from localStorage
    useEffect(() => {
        const savedSession = localStorage.getItem('turik_session');
        if (savedSession) {
            const { username: savedUsername, password } = JSON.parse(savedSession);
            socket.emit('login', { username: savedUsername, password }, (response) => {
                if (response.success) {
                    handleAuth(response.username, response.isAdmin, response.bottles);
                } else {
                    localStorage.removeItem('turik_session');
                }
            });
        }
    }, []);

    useEffect(() => {
        socket.on('tournament-state', (state) => {
            setTournamentState(state);
        });

        socket.on('active-bets', (bets) => {
            setActiveBets(bets);
        });

        socket.on('users-list', (users) => {
            // Filter out admin from the list
            setUsersList(users.filter(u => u.username !== 'admin'));
        });

        socket.on('update-bottles', (newBottles) => {
            setBottles(newBottles);
        });

        socket.on('chat-history', (messages) => {
            console.log('Chat history received:', messages);
            setChatMessages(messages);
        });

        socket.on('chat-message', (message) => {
            console.log('New chat message received:', message);
            setChatMessages(prev => [...prev, message]);
        });

        socket.on('muted-users', (muted) => {
            setMutedUsers(muted);
        });

        socket.on('chat-error', ({ message }) => {
            alert(message);
        });

        return () => {
            socket.off('tournament-state');
            socket.off('active-bets');
            socket.off('users-list');
            socket.off('update-bottles');
            socket.off('chat-history');
            socket.off('chat-message');
            socket.off('muted-users');
            socket.off('chat-error');
        };
    }, []);

    const handleAuth = (user, admin, userBottles) => {
        setUsername(user);
        setIsAdmin(admin);
        setBottles(userBottles);
        setIsAuthenticated(true);
    };

    const handleSetGroupWinner = (group, winner) => {
        socket.emit('set-group-winner', { group, winner });
    };

    const handleSetQuarterFinalWinner = (matchId, winner) => {
        socket.emit('set-quarterfinal-winner', { matchId, winner });
    };

    const handleSetSemiFinalWinner = (matchId, winner) => {
        socket.emit('set-semifinal-winner', { matchId, winner });
    };

    const handleSetFinalWinner = (winner) => {
        socket.emit('set-final-winner', { winner });
    };

    const handlePlaceBet = (player, amount) => {
        socket.emit('place-bet', { player, amount });
    };

    const handleSendMessage = (message) => {
        console.log('Sending message:', message, 'Is admin:', isAdmin);
        socket.emit('chat-message', { message });
    };

    const handleAdminResetMatch = (stage, matchId) => {
        socket.emit('admin-reset-match', { stage, matchId });
    };

    const handleAdminReplacePlayer = (oldPlayer, newPlayer) => {
        socket.emit('admin-replace-player', { oldPlayer, newPlayer });
    };

    const handleAdminRemoveBet = (player, targetUsername) => {
        socket.emit('admin-remove-bet', { player, targetUsername });
    };

    const handleAdminFullReset = () => {
        socket.emit('admin-full-reset');
    };

    const handleAdminMuteUser = (targetUsername, minutes) => {
        socket.emit('admin-mute-user', { targetUsername, minutes });
    };

    const handleAdminUnmuteUser = (targetUsername) => {
        socket.emit('admin-unmute-user', { targetUsername });
    };

    if (!isAuthenticated) {
        return <AuthScreen socket={socket} onAuth={handleAuth} />;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex-1 min-w-0">
                            <h1 className="text-xl sm:text-2xl font-normal text-gray-900 truncate">
                                Турнір
                                {isAdmin && (
                                    <button
                                        onClick={() => setShowAdminPanel(!showAdminPanel)}
                                        className="text-xs sm:text-sm text-blue-600 ml-2 sm:ml-3 hover:text-blue-700"
                                    >
                                        {showAdminPanel ? '← Назад' : '⚙️ Адмін'}
                                    </button>
                                )}
                            </h1>
                            <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">
                                {username} {!isAdmin && `• ${bottles} 🍺`}
                            </p>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3">
                            <NetworkInfo />
                            <div className="text-right">
                                <div className="text-xs sm:text-sm text-gray-500">👥 {usersList.length}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8">
                {showAdminPanel && isAdmin ? (
                    <AdminPanel
                        tournamentState={tournamentState}
                        activeBets={activeBets}
                        usersList={usersList}
                        onResetMatch={handleAdminResetMatch}
                        onReplacePlayer={handleAdminReplacePlayer}
                        onRemoveBet={handleAdminRemoveBet}
                        onFullReset={handleAdminFullReset}
                    />
                ) : (
                    <div className="flex flex-col lg:grid lg:grid-cols-4 gap-4 lg:gap-6">
                        {/* Tournament Bracket */}
                        <div className="lg:col-span-3 order-2 lg:order-1">
                            <TournamentBracket
                                tournamentState={tournamentState}
                                isAdmin={isAdmin}
                                onSetGroupWinner={handleSetGroupWinner}
                                onSetQuarterFinalWinner={handleSetQuarterFinalWinner}
                                onSetSemiFinalWinner={handleSetSemiFinalWinner}
                                onSetFinalWinner={handleSetFinalWinner}
                            />
                        </div>

                        {/* Right Sidebar */}
                        <div className="space-y-4 lg:space-y-6 order-1 lg:order-2">
                            {/* Betting Panel */}
                            {!isAdmin && tournamentState && (
                                <BettingPanel
                                    tournamentState={tournamentState}
                                    activeBets={activeBets}
                                    username={username}
                                    bottles={bottles}
                                    onPlaceBet={handlePlaceBet}
                                />
                            )}

                            {/* Leaderboard */}
                            <Leaderboard usersList={usersList} currentUsername={username} />

                            {/* Chat */}
                            <Chat
                                messages={chatMessages}
                                currentUsername={username}
                                isAdmin={isAdmin}
                                mutedUsers={mutedUsers}
                                onSendMessage={handleSendMessage}
                                onMuteUser={handleAdminMuteUser}
                                onUnmuteUser={handleAdminUnmuteUser}
                            />
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

export default App;
