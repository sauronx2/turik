import { useState, useRef, useEffect } from 'react';

function Chat({ messages, currentUsername, onSendMessage }) {
  const [message, setMessage] = useState('');
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

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Чат</h2>
      
      {/* Messages */}
      <div className="h-64 overflow-y-auto mb-4 space-y-3">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`${
              msg.username === currentUsername
                ? 'bg-blue-50 border-blue-200'
                : 'bg-gray-50 border-gray-200'
            } border rounded-lg p-3`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className={`text-sm font-medium ${
                msg.username === currentUsername ? 'text-blue-900' : 'text-gray-900'
              }`}>
                {msg.username}
                {msg.username === currentUsername && (
                  <span className="text-xs text-blue-600 ml-1">(ви)</span>
                )}
              </span>
              <span className="text-xs text-gray-500">{formatTime(msg.timestamp)}</span>
            </div>
            <p className="text-sm text-gray-700 break-words">{msg.message}</p>
          </div>
        ))}
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
    </div>
  );
}

export default Chat;

