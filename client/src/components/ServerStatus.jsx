import { useState, useEffect } from 'react';

function ServerStatus({ isAdmin, onStartServer, onStopServer, showToast }) {
  const [serverStatus, setServerStatus] = useState({ isRunning: false, url: null });
  const [loading, setLoading] = useState(false);

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
    setLoading(true);
    try {
      const result = await window.electronAPI.startDevServer();
      if (result.success) {
        showToast(result.message, 'success');
        await checkServerStatus();
      } else {
        showToast(result.message, 'error');
      }
    } catch (error) {
      showToast('Помилка запуску сервера', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleStopServer = async () => {
    setLoading(true);
    try {
      const result = await window.electronAPI.stopDevServer();
      if (result.success) {
        showToast(result.message, 'info');
        await checkServerStatus();
      } else {
        showToast(result.message, 'error');
      }
    } catch (error) {
      showToast('Помилка зупинки сервера', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyUrl = () => {
    if (serverStatus.url) {
      navigator.clipboard.writeText(serverStatus.url);
      showToast('Адресу скопійовано!', 'success');
    }
  };

  // Don't show if not in Electron or not admin
  if (!window.electronAPI || !isAdmin) return null;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${serverStatus.isRunning ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
          <div>
            <h3 className="font-medium text-gray-900">
              Сервер для інших учасників
            </h3>
            {serverStatus.isRunning && serverStatus.url && (
              <div className="flex items-center gap-2 mt-1">
                <code className="text-sm text-blue-600 font-mono">{serverStatus.url}</code>
                <button
                  onClick={handleCopyUrl}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  📋 Копіювати
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          {!serverStatus.isRunning ? (
            <button
              onClick={handleStartServer}
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? '⏳ Запуск...' : '🚀 Запустити сервер'}
            </button>
          ) : (
            <button
              onClick={handleStopServer}
              disabled={loading}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? '⏳ Зупинка...' : '🛑 Зупинити сервер'}
            </button>
          )}
        </div>
      </div>

      {!serverStatus.isRunning && (
        <p className="text-sm text-gray-600 mt-3">
          💡 Запустіть сервер, щоб інші учасники могли підключитися через браузер
        </p>
      )}
    </div>
  );
}

export default ServerStatus;

