import { useState } from 'react';

function AuthScreen({ socket, onAuth }) {
    const [mode, setMode] = useState('login'); // 'login' or 'register'
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (mode === 'login') {
            socket.emit('login', { username, password }, (response) => {
                setLoading(false);
                if (response.success) {
                    // Save session to localStorage
                    localStorage.setItem('turik_session', JSON.stringify({ username, password }));
                    onAuth(response.username, response.isAdmin, response.bottles);
                } else {
                    setError(response.message);
                }
            });
        } else {
            socket.emit('register', { username, password }, (response) => {
                setLoading(false);
                if (response.success) {
                    // Auto-login after registration
                    localStorage.setItem('turik_session', JSON.stringify({ username, password }));
                    onAuth(response.username, response.isAdmin, response.bottles);
                } else {
                    setError(response.message);
                }
            });
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="max-w-md w-full">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-light text-gray-900 mb-2">Турнір</h1>
                    <p className="text-gray-500">
                        {mode === 'login' ? 'Увійдіть у свій обліковий запис' : 'Створіть обліковий запис'}
                    </p>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Логін
                            </label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                                autoFocus
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Пароль
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                            />
                        </div>

                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
                        >
                            {loading ? 'Зачекайте...' : mode === 'login' ? 'Увійти' : 'Зареєструватись'}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <button
                            onClick={() => {
                                setMode(mode === 'login' ? 'register' : 'login');
                                setError('');
                            }}
                            className="text-sm text-blue-600 hover:text-blue-700"
                        >
                            {mode === 'login' ? 'Немає облікового запису? Зареєструватись' : 'Вже є обліковий запис? Увійти'}
                        </button>
                    </div>

                    {mode === 'login' && (
                        <div className="mt-6 pt-6 border-t border-gray-200">
                            <p className="text-xs text-gray-500 text-center">
                                Адмін: логін <code className="bg-gray-100 px-1 py-0.5 rounded">admin</code>
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default AuthScreen;
