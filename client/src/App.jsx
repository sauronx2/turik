import { useState, useEffect } from 'react';
import io from 'socket.io-client';
import AuthScreen from './components/AuthScreen';
import TournamentBracket from './components/TournamentBracket';
import BettingPanel from './components/BettingPanel';
import Leaderboard from './components/Leaderboard';
import Chat from './components/Chat';
import AdminPanel from './components/AdminPanel';
import ServerInfo from './components/ServerInfo';
import Toast, { useToast } from './components/Toast';
import { useLanguage } from './contexts/LanguageContext';
import { useTheme } from './contexts/ThemeContext';

// Connect to backend (auto-detect local or network IP)
// In Electron, window.location.protocol is 'file:' so we always use localhost
const isElectron = window.location.protocol === 'file:';
const backendUrl = isElectron || window.location.hostname === 'localhost'
    ? 'http://localhost:3000'
    : `http://${window.location.hostname}:3000`;

console.log('🔌 Connecting to:', backendUrl);

const socket = io(backendUrl, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5
});

// Detailed Socket.io event logging
socket.on('connect', () => {
    console.log('%c✅ Socket Connected', 'color: green; font-weight: bold');
    console.log('Socket ID:', socket.id);
    console.log('Transport:', socket.io.engine.transport.name);
});

socket.on('connect_error', (error) => {
    console.error('%c❌ Socket Connection Error', 'color: red; font-weight: bold');
    console.error('Error:', error.message);
    console.error('Details:', error);
});

socket.on('disconnect', (reason) => {
    console.log('%c🔌 Socket Disconnected', 'color: orange; font-weight: bold');
    console.log('Reason:', reason);
});

// Log all outgoing events
const originalEmit = socket.emit.bind(socket);
socket.emit = function (event, ...args) {
    console.log(`%c⬆️ Emit: ${event}`, 'color: blue', args.filter(arg => typeof arg !== 'function'));
    return originalEmit(event, ...args);
};

// Log all incoming events
const eventsList = [
    'tournament-state',
    'users-list',
    'active-bets',
    'chat-message',
    'chat-history',
    'muted-users'
];

eventsList.forEach(event => {
    socket.on(event, (data) => {
        console.log(`%c⬇️ Receive: ${event}`, 'color: purple', data);
    });
});

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

    const { toast, showToast, showSuccess, showError, showInfo, showWarning, hideToast } = useToast();
    const { t, language, toggleLanguage } = useLanguage();
    const { theme, toggleTheme, isDark } = useTheme();

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

    const handleAuth = async (user, admin, userBottles) => {
        setUsername(user);
        setIsAdmin(admin);
        setBottles(userBottles);
        setIsAuthenticated(true);

        // Auto-start dev server for admin in Electron
        if (admin && window.electronAPI && window.electronAPI.startDevServer) {
            try {
                console.log('🔍 Checking server status...');
                const status = await window.electronAPI.getServerStatus();
                console.log('📊 Server status:', status);

                if (!status.isRunning) {
                    showInfo('Запускаю сервер для інших учасників...', 'Це займе 2-3 секунди');
                    console.log('🚀 Starting server...');

                    const result = await window.electronAPI.startDevServer();
                    console.log('📨 Server start result:', result);

                    if (result.success) {
                        showSuccess(result.message, result.url || result.details);
                    } else {
                        showError(result.message, result.details);
                    }
                } else {
                    console.log('✅ Server already running');
                }
            } catch (error) {
                console.error('❌ Error auto-starting server:', error);
                showError('Помилка запуску сервера', error.message || error.toString());
            }
        }
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

    const handleLogout = () => {
        if (confirm('Ви впевнені що хочете вийти?')) {
            // Clear localStorage
            localStorage.removeItem('turik_session');

            // Disconnect socket
            socket.disconnect();

            // Reset all state
            setIsAuthenticated(false);
            setUsername('');
            setIsAdmin(false);
            setBottles(20);
            setTournamentState(null);
            setActiveBets({});
            setUsersList([]);
            setChatMessages([]);
            setMutedUsers({});
            setShowAdminPanel(false);

            // Reconnect socket for next login
            setTimeout(() => {
                socket.connect();
            }, 100);
        }
    };

    if (!isAuthenticated) {
        return <AuthScreen socket={socket} onAuth={handleAuth} />;
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-dark-bg transition-colors">
            {/* Toast Notifications */}
            <Toast toast={toast} onClose={hideToast} />

            {/* Header */}
            <header className="bg-white dark:bg-dark-surface border-b border-gray-200 dark:border-dark-border sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex-1 min-w-0">
                            <h1 className="text-xl sm:text-2xl font-normal text-gray-900 dark:text-dark-text truncate">
                                {t('tournament')}
                                {isAdmin && (
                                    <button
                                        onClick={() => setShowAdminPanel(!showAdminPanel)}
                                        className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 ml-2 sm:ml-3 hover:text-blue-700 dark:hover:text-blue-300"
                                    >
                                        {showAdminPanel ? t('backToMain') : t('adminButton')}
                                    </button>
                                )}
                            </h1>
                            <p className="text-xs sm:text-sm text-gray-500 dark:text-dark-text-secondary mt-0.5 sm:mt-1">
                                {username} • {bottles} 🍺
                            </p>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3">
                            {/* Language Toggle */}
                            <button
                                onClick={toggleLanguage}
                                className="px-2 py-1.5 text-xs sm:text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition font-medium"
                                title={language === 'uk' ? 'Switch to English' : 'Перемкнути на українську'}
                            >
                                {language === 'uk' ? '🇺🇦' : '🇬🇧'}
                            </button>

                            {/* Theme Toggle */}
                            <button
                                onClick={toggleTheme}
                                className="px-2 py-1.5 text-xs sm:text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                                title={isDark ? 'Light Mode' : 'Dark Mode'}
                            >
                                {isDark ? '☀️' : '🌙'}
                            </button>

                            {/* Server Info / Network */}
                            <ServerInfo isAdmin={isAdmin} showToast={showToast} />

                            {/* Users Count */}
                            <div className="text-xs sm:text-sm text-gray-500 dark:text-dark-text-secondary">
                                👥 {usersList.length}
                            </div>

                            {/* Logout */}
                            <button
                                onClick={handleLogout}
                                className="px-3 py-1.5 text-xs sm:text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition font-medium"
                                title={t('logout')}
                            >
                                🚪 {t('logout')}
                            </button>
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
                        socket={socket}
                    />
                ) : (
                    <div className="space-y-4">
                        {/* Betting Panel - Horizontal (full width) */}
                        {tournamentState && (
                            <BettingPanel
                                tournamentState={tournamentState}
                                activeBets={activeBets}
                                username={username}
                                bottles={bottles}
                                onPlaceBet={handlePlaceBet}
                            />
                        )}

                        {/* Tournament Bracket + Chat Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
                            {/* Tournament Bracket (2/3 width) */}
                            <div className="lg:col-span-2">
                                <TournamentBracket
                                    tournamentState={tournamentState}
                                    isAdmin={isAdmin}
                                    onSetGroupWinner={handleSetGroupWinner}
                                    onSetQuarterFinalWinner={handleSetQuarterFinalWinner}
                                    onSetSemiFinalWinner={handleSetSemiFinalWinner}
                                    onSetFinalWinner={handleSetFinalWinner}
                                />

                                {/* Leaderboard below bracket on mobile */}
                                <div className="mt-4 lg:hidden">
                                    <Leaderboard usersList={usersList} currentUsername={username} />
                                </div>
                            </div>

                            {/* Right Sidebar (1/3 width) */}
                            <div className="space-y-4">
                                {/* Leaderboard - desktop only */}
                                <div className="hidden lg:block">
                                    <Leaderboard usersList={usersList} currentUsername={username} />
                                </div>

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
                    </div>
                )}
            </main>
        </div>
    );
}

export default App;
