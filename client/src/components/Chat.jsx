import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

function Chat({ messages, currentUsername, isAdmin, mutedUsers, onSendMessage, onMuteUser, onUnmuteUser }) {
    const { t } = useLanguage();
    const [message, setMessage] = useState('');
    const [showMuteMenu, setShowMuteMenu] = useState(null);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!message.trim()) return;

        onSendMessage(message);
        setMessage('');
    };

    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });
    };

    const getRemainingMuteTime = (username) => {
        if (!mutedUsers[username]) return null;
        const remaining = mutedUsers[username] - Date.now();
        if (remaining <= 0) return null;
        return Math.ceil(remaining / 1000);
    };

    const handleMute = (username, minutes) => {
        onMuteUser(username, minutes);
        setShowMuteMenu(null);
    };

    return (
        <div className="bg-white dark:bg-dark-surface rounded-lg shadow-sm border border-gray-200 dark:border-dark-border p-3 lg:p-4">
            <h2 className="text-base lg:text-lg font-medium text-gray-900 dark:text-dark-text mb-3 lg:mb-4">
                💬 {t('chat')} {isAdmin && <span className="text-xs text-blue-600 dark:text-blue-400">{t('adminLabel')}</span>}
            </h2>

            {/* Messages */}
            <div className="h-48 lg:h-64 overflow-y-auto mb-3 lg:mb-4 space-y-2 lg:space-y-3">
                {messages.map((msg) => {
                    const muteTime = getRemainingMuteTime(msg.username);
                    return (
                        <div
                            key={msg.id}
                            className={`${msg.username === currentUsername
                                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700'
                                : msg.isAdmin
                                    ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700'
                                    : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                                } border rounded-lg p-3 relative`}
                        >
                            <div className="flex items-center justify-between mb-1">
                                <span className={`text-sm font-medium ${msg.username === currentUsername ? 'text-blue-900 dark:text-blue-300' :
                                    msg.isAdmin ? 'text-yellow-900 dark:text-yellow-300' : 'text-gray-900 dark:text-gray-100'
                                    }`}>
                                    {msg.isAdmin && '👑 '}
                                    {msg.username}
                                    {msg.username === currentUsername && (
                                        <span className="text-xs text-blue-600 dark:text-blue-400 ml-1">{t('you')}</span>
                                    )}
                                    {muteTime && (
                                        <span className="text-xs text-red-600 dark:text-red-400 ml-2">🔇 {muteTime}s</span>
                                    )}
                                </span>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-500 dark:text-gray-400">{formatTime(msg.timestamp)}</span>
                                    {isAdmin && msg.username !== currentUsername && msg.username !== 'admin' && (
                                        <div className="relative">
                                            <button
                                                onClick={() => setShowMuteMenu(showMuteMenu === msg.id ? null : msg.id)}
                                                className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                                            >
                                                {muteTime ? '🔊' : '🔇'}
                                            </button>
                                            {showMuteMenu === msg.id && (
                                                <div className="absolute right-0 top-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg p-2 z-10 min-w-[120px]">
                                                    {!muteTime ? (
                                                        <>
                                                            <button
                                                                onClick={() => handleMute(msg.username, 1)}
                                                                className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-900 dark:text-gray-100"
                                                            >
                                                                1 {t('minutes')}
                                                            </button>
                                                            <button
                                                                onClick={() => handleMute(msg.username, 3)}
                                                                className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-900 dark:text-gray-100"
                                                            >
                                                                3 {t('minutes')}
                                                            </button>
                                                            <button
                                                                onClick={() => handleMute(msg.username, 5)}
                                                                className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-900 dark:text-gray-100"
                                                            >
                                                                5 {t('minutes')}
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <button
                                                            onClick={() => {
                                                                onUnmuteUser(msg.username);
                                                                setShowMuteMenu(null);
                                                            }}
                                                            className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-green-600 dark:text-green-400 font-medium"
                                                        >
                                                            {t('unmute')}
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <p className="text-sm text-gray-700 dark:text-gray-300 break-words">{msg.message}</p>
                        </div>
                    );
                })}

                {messages.length === 0 && (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
                        {t('noMessages')}
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={t('typeMessage')}
                    disabled={getRemainingMuteTime(currentUsername)}
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                />
                <button
                    type="submit"
                    disabled={!message.trim() || getRemainingMuteTime(currentUsername)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed transition text-sm font-medium"
                >
                    ✉️
                </button>
            </form>

            {getRemainingMuteTime(currentUsername) && (
                <div className="mt-2 text-xs text-center text-red-600 dark:text-red-400">
                    🔇 {t('youAreMuted')} {getRemainingMuteTime(currentUsername)} {t('seconds')}
                </div>
            )}
        </div>
    );
}

export default Chat;
