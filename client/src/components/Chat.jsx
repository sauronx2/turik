import { useState, useRef, useEffect } from 'react';

function Chat({ messages, currentUsername, isAdmin, mutedUsers, onSendMessage, onMuteUser, onUnmuteUser }) {
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
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 lg:p-4">
            <h2 className="text-base lg:text-lg font-medium text-gray-900 mb-3 lg:mb-4">
                💬 Чат {isAdmin && <span className="text-xs text-blue-600">(Адмін)</span>}
            </h2>

            {/* Messages */}
            <div className="h-48 lg:h-64 overflow-y-auto mb-3 lg:mb-4 space-y-2 lg:space-y-3">
                {messages.map((msg) => {
                    const muteTime = getRemainingMuteTime(msg.username);
                    return (
                        <div
                            key={msg.id}
                            className={`${msg.username === currentUsername
                                    ? 'bg-blue-50 border-blue-200'
                                    : msg.isAdmin
                                        ? 'bg-yellow-50 border-yellow-200'
                                        : 'bg-gray-50 border-gray-200'
                                } border rounded-lg p-3 relative`}
                        >
                            <div className="flex items-center justify-between mb-1">
                                <span className={`text-sm font-medium ${msg.username === currentUsername ? 'text-blue-900' :
                                        msg.isAdmin ? 'text-yellow-900' : 'text-gray-900'
                                    }`}>
                                    {msg.isAdmin && '👑 '}
                                    {msg.username}
                                    {msg.username === currentUsername && (
                                        <span className="text-xs text-blue-600 ml-1">(ви)</span>
                                    )}
                                    {muteTime && (
                                        <span className="text-xs text-red-600 ml-2">🔇 {muteTime}с</span>
                                    )}
                                </span>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-500">{formatTime(msg.timestamp)}</span>
                                    {isAdmin && msg.username !== currentUsername && msg.username !== 'admin' && (
                                        <div className="relative">
                                            <button
                                                onClick={() => setShowMuteMenu(showMuteMenu === msg.id ? null : msg.id)}
                                                className="text-xs text-gray-500 hover:text-gray-700"
                                            >
                                                ⚙️
                                            </button>
                                            {showMuteMenu === msg.id && (
                                                <div className="absolute right-0 top-6 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-10 min-w-[120px]">
                                                    {getRemainingMuteTime(msg.username) ? (
                                                        <button
                                                            onClick={() => {
                                                                onUnmuteUser(msg.username);
                                                                setShowMuteMenu(null);
                                                            }}
                                                            className="w-full text-left px-2 py-1 text-xs hover:bg-gray-100 rounded"
                                                        >
                                                            Зняти мут
                                                        </button>
                                                    ) : (
                                                        <>
                                                            <button
                                                                onClick={() => handleMute(msg.username, 1)}
                                                                className="w-full text-left px-2 py-1 text-xs hover:bg-gray-100 rounded"
                                                            >
                                                                Мут 1 хв
                                                            </button>
                                                            <button
                                                                onClick={() => handleMute(msg.username, 3)}
                                                                className="w-full text-left px-2 py-1 text-xs hover:bg-gray-100 rounded"
                                                            >
                                                                Мут 3 хв
                                                            </button>
                                                            <button
                                                                onClick={() => handleMute(msg.username, 5)}
                                                                className="w-full text-left px-2 py-1 text-xs hover:bg-gray-100 rounded"
                                                            >
                                                                Мут 5 хв
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <p className="text-sm text-gray-700 break-words">{msg.message}</p>
                        </div>
                    );
                })}
                {messages.length === 0 && (
                    <div className="text-center py-8 text-gray-400 text-sm">
                        Ще немає повідомлень
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
                    placeholder="Напишіть повідомлення..."
                    maxLength={200}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
                <button
                    type="submit"
                    disabled={!message.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm"
                >
                    📩
                </button>
            </form>

            {/* Mute indicator for current user */}
            {!isAdmin && getRemainingMuteTime(currentUsername) && (
                <div className="mt-2 text-xs text-center text-red-600 bg-red-50 border border-red-200 rounded py-1">
                    🔇 Ви в муті ще {getRemainingMuteTime(currentUsername)} секунд
                </div>
            )}
        </div>
    );
}

export default Chat;
