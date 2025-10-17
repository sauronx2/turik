import { useState, useEffect } from 'react';

function AuthScreen({ socket, onAuth }) {
    const [mode, setMode] = useState('login'); // 'login' or 'register'
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // Reset loading when mode changes
    useEffect(() => {
        setLoading(false);
        setError('');
    }, [mode]);

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');
        
        // Check if socket is connected
        if (!socket.connected) {
            setError('Підключення до сервера втрачено. Спробуйте пізніше.');
            console.error('Socket not connected');
            return;
        }

        setLoading(true);

        // Timeout to reset loading state if no response
        const timeout = setTimeout(() => {
            setLoading(false);
            setError('Час очікування вичерпано. Перевірте підключення.');
        }, 10000);

        if (mode === 'login') {
            socket.emit('login', { username, password }, (response) => {
                clearTimeout(timeout);
                setLoading(false);
                if (response && response.success) {
                    // Save session to localStorage
                    localStorage.setItem('turik_session', JSON.stringify({ username, password }));
                    onAuth(response.username, response.isAdmin, response.bottles);
                } else {
                    setError(response?.message || 'Помилка входу');
                }
            });
        } else {
            socket.emit('register', { username, password }, (response) => {
                clearTimeout(timeout);
                setLoading(false);
                if (response && response.success) {
                    // Auto-login after registration
                    localStorage.setItem('turik_session', JSON.stringify({ username, password }));
                    onAuth(response.username, response.isAdmin, response.bottles);
                } else {
                    setError(response?.message || 'Помилка реєстрації');
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
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                                    tabIndex={-1}
                                >
                                    {showPassword ? (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                        </svg>
                                    ) : (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
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
