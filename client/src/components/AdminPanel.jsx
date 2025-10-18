import { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import ConfirmDialog from './ConfirmDialog';

function AdminPanel({ tournamentState, activeBets, usersList, onResetMatch, onReplacePlayer, onRemoveBet, onFullReset, socket, showToast }) {
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState('server');
    
    // Server Control State
    const [serverStatus, setServerStatus] = useState({ isRunning: false, url: null });
    const [serverLoading, setServerLoading] = useState(false);
    const [showStopConfirm, setShowStopConfirm] = useState(false);
    
    // Tournament Control State
    const [oldPlayerName, setOldPlayerName] = useState('');
    const [newPlayerName, setNewPlayerName] = useState('');
    
    // User Management State
    const [allUsers, setAllUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [newPassword, setNewPassword] = useState('');
    const [newBottles, setNewBottles] = useState('');
    
    // Full Reset State
    const [showResetConfirm, setShowResetConfirm] = useState(false);
    const [resetConfirmText, setResetConfirmText] = useState('');

    // Check server status (for Server Control tab)
    useEffect(() => {
        checkServerStatus();
        const interval = setInterval(checkServerStatus, 3000);
        return () => clearInterval(interval);
    }, []);

    const checkServerStatus = async () => {
        if (window.electronAPI && window.electronAPI.getServerStatus) {
            try {
                const status = await window.electronAPI.getServerStatus();
                setServerStatus(status);
            } catch (error) {
                console.error('Error checking server status:', error);
            }
        }
    };

    const handleStartServer = async () => {
        setServerLoading(true);
        try {
            const result = await window.electronAPI.startDevServer();
            if (result.success) {
                showToast(t('serverStarted'), result.url || result.details, 'success');
                await checkServerStatus();
            } else {
                showToast(result.message, result.details, 'error');
            }
        } catch (error) {
            showToast(t('serverStartError'), error.message, 'error');
        } finally {
            setServerLoading(false);
        }
    };

    const handleStopServer = async () => {
        setServerLoading(true);
        try {
            const result = await window.electronAPI.stopDevServer();
            if (result.success) {
                showToast(t('serverStopped'), '', 'info');
                await checkServerStatus();
            } else {
                showToast(result.message, result.details, 'error');
            }
        } catch (error) {
            showToast(t('serverStopError'), error.message, 'error');
        } finally {
            setServerLoading(false);
            setShowStopConfirm(false);
        }
    };

    // Load users for User Management tab
    useEffect(() => {
        if (socket && activeTab === 'users') {
            socket.emit('admin-get-all-users', (response) => {
                if (response.success) {
                    setAllUsers(response.users);
                }
            });
        }
    }, [socket, activeTab]);

    const handleDeleteUser = (username) => {
        if (!confirm(`Видалити користувача ${username}? Це незворотня дія!`)) return;
        socket.emit('admin-delete-user', { targetUsername: username }, (response) => {
            if (response.success) {
                showToast('Користувача видалено', '', 'success');
                socket.emit('admin-get-all-users', (res) => {
                    if (res.success) setAllUsers(res.users);
                });
            } else {
                showToast('Помилка', response.message, 'error');
            }
        });
    };

    const handleUpdateBottles = (username) => {
        if (!newBottles) return;
        socket.emit('admin-update-bottles', { targetUsername: username, newBottles: parseInt(newBottles) }, (response) => {
            if (response.success) {
                showToast('Баланс оновлено', '', 'success');
                socket.emit('admin-get-all-users', (res) => {
                    if (res.success) setAllUsers(res.users);
                });
                setNewBottles('');
                setSelectedUser(null);
            } else {
                showToast('Помилка', response.message, 'error');
            }
        });
    };

    const handleResetPassword = (username) => {
        if (!newPassword) return;
        socket.emit('admin-reset-password', { targetUsername: username, newPassword }, (response) => {
            if (response.success) {
                showToast('Пароль скинуто', '', 'success');
                setNewPassword('');
                setSelectedUser(null);
            } else {
                showToast('Помилка', response.message, 'error');
            }
        });
    };

    const handleFullReset = () => {
        if (resetConfirmText.toLowerCase() === 'скинути все') {
            onFullReset();
            setShowResetConfirm(false);
            setResetConfirmText('');
        }
    };

    const tabs = [
        { id: 'server', label: '🖥️ Server', show: window.electronAPI },
        { id: 'tournament', label: '🏆 Tournament' },
        { id: 'users', label: '👥 Users' },
        { id: 'danger', label: '⚠️ Reset' },
    ].filter(tab => tab.show !== false);

    return (
        <div className="space-y-6">
            {/* Header with Tabs */}
            <div className="bg-white dark:bg-dark-surface rounded-lg shadow-sm border border-gray-200 dark:border-dark-border overflow-hidden">
                <div className="flex border-b border-gray-200 dark:border-dark-border">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 px-4 py-3 text-sm font-medium transition ${
                                activeTab === tab.id
                                    ? 'bg-blue-600 text-white'
                                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="p-6">
                    {/* Server Control Tab */}
                    {activeTab === 'server' && window.electronAPI && (
                        <div className="space-y-6">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Server Control</h3>
                            
                            {/* Status */}
                            <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <div className={`w-3 h-3 rounded-full ${serverStatus.isRunning ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                                <div>
                                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                        {serverStatus.isRunning ? 'Server Running' : 'Server Stopped'}
                                    </p>
                                    {serverStatus.url && (
                                        <p className="text-xs text-gray-600 dark:text-gray-400 font-mono">{serverStatus.url}</p>
                                    )}
                                </div>
                            </div>

                            {/* Controls */}
                            <div className="flex gap-3">
                                {!serverStatus.isRunning ? (
                                    <button
                                        onClick={handleStartServer}
                                        disabled={serverLoading}
                                        className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition font-medium"
                                    >
                                        {serverLoading ? '⏳ Starting...' : '🚀 Start Server'}
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => setShowStopConfirm(true)}
                                        disabled={serverLoading}
                                        className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition font-medium"
                                    >
                                        {serverLoading ? '⏳ Stopping...' : '🛑 Stop Server'}
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Tournament Control Tab */}
                    {activeTab === 'tournament' && (
                        <div className="space-y-6">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Tournament Control</h3>
                            
                            {/* Replace Player */}
                            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-3">
                                <h4 className="font-medium text-gray-900 dark:text-gray-100">Replace Player</h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <input
                                        type="text"
                                        placeholder="Old player name"
                                        value={oldPlayerName}
                                        onChange={(e) => setOldPlayerName(e.target.value)}
                                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                                    />
                                    <input
                                        type="text"
                                        placeholder="New player name"
                                        value={newPlayerName}
                                        onChange={(e) => setNewPlayerName(e.target.value)}
                                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                                    />
                                </div>
                                <button
                                    onClick={() => {
                                        if (oldPlayerName && newPlayerName) {
                                            onReplacePlayer(oldPlayerName, newPlayerName);
                                            setOldPlayerName('');
                                            setNewPlayerName('');
                                        }
                                    }}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition text-sm"
                                >
                                    Replace Player
                                </button>
                            </div>

                            {/* Active Bets */}
                            <div className="space-y-3">
                                <h4 className="font-medium text-gray-900 dark:text-gray-100">Active Bets (Admin Actions)</h4>
                                {Object.entries(activeBets).map(([player, userBets]) => (
                                    <div key={player} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                        <p className="font-medium text-gray-900 dark:text-gray-100 mb-2">{player}</p>
                                        {Object.entries(userBets).map(([user, amount]) => (
                                            <div key={user} className="flex justify-between items-center text-sm mb-1">
                                                <span className="text-gray-700 dark:text-gray-300">{user}: {amount} 🍺</span>
                                                <button
                                                    onClick={() => onRemoveBet(player, user)}
                                                    className="text-red-600 dark:text-red-400 hover:text-red-700 text-xs"
                                                >
                                                    ✕ Remove
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* User Management Tab */}
                    {activeTab === 'users' && (
                        <div className="space-y-6">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">User Management</h3>
                            
                            <div className="space-y-3">
                                {allUsers.filter(u => u.username !== 'admin').map((user) => (
                                    <div key={user.username} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <p className="font-medium text-gray-900 dark:text-gray-100">{user.username}</p>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">{user.bottles} 🍺</p>
                                            </div>
                                            <button
                                                onClick={() => handleDeleteUser(user.username)}
                                                className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 transition text-sm"
                                            >
                                                🗑️ Delete
                                            </button>
                                        </div>

                                        {selectedUser === user.username ? (
                                            <div className="space-y-2 pt-3 border-t border-gray-300 dark:border-gray-600">
                                                <div className="flex gap-2">
                                                    <input
                                                        type="number"
                                                        placeholder="New balance"
                                                        value={newBottles}
                                                        onChange={(e) => setNewBottles(e.target.value)}
                                                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                                                    />
                                                    <button
                                                        onClick={() => handleUpdateBottles(user.username)}
                                                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition text-sm"
                                                    >
                                                        💰 Update
                                                    </button>
                                                </div>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        placeholder="New password"
                                                        value={newPassword}
                                                        onChange={(e) => setNewPassword(e.target.value)}
                                                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                                                    />
                                                    <button
                                                        onClick={() => handleResetPassword(user.username)}
                                                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition text-sm"
                                                    >
                                                        🔑 Reset
                                                    </button>
                                                </div>
                                                <button
                                                    onClick={() => setSelectedUser(null)}
                                                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => setSelectedUser(user.username)}
                                                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                                            >
                                                ⚙️ Manage
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Danger Zone Tab */}
                    {activeTab === 'danger' && (
                        <div className="space-y-6">
                            <h3 className="text-lg font-medium text-red-600 dark:text-red-400">⚠️ Danger Zone</h3>
                            
                            <div className="p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-700 rounded-lg space-y-4">
                                <p className="text-sm text-red-900 dark:text-red-300">
                                    This will completely reset the tournament: all players, bets, chat, and user balances will be lost!
                                </p>
                                
                                {!showResetConfirm ? (
                                    <button
                                        onClick={() => setShowResetConfirm(true)}
                                        className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
                                    >
                                        🔥 Full Tournament Reset
                                    </button>
                                ) : (
                                    <div className="space-y-3">
                                        <p className="text-sm font-medium text-red-900 dark:text-red-300">
                                            Type "скинути все" to confirm:
                                        </p>
                                        <input
                                            type="text"
                                            value={resetConfirmText}
                                            onChange={(e) => setResetConfirmText(e.target.value)}
                                            placeholder="скинути все"
                                            className="w-full px-3 py-2 border-2 border-red-300 dark:border-red-700 rounded-md text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                                        />
                                        <div className="flex gap-3">
                                            <button
                                                onClick={handleFullReset}
                                                disabled={resetConfirmText.toLowerCase() !== 'скинути все'}
                                                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition"
                                            >
                                                Confirm Reset
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setShowResetConfirm(false);
                                                    setResetConfirmText('');
                                                }}
                                                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Confirmation Dialog for Stop Server */}
            <ConfirmDialog
                isOpen={showStopConfirm}
                title="Stop Server?"
                message="This will disconnect all users. Are you sure?"
                onConfirm={handleStopServer}
                onCancel={() => setShowStopConfirm(false)}
            />
        </div>
    );
}

export default AdminPanel;
