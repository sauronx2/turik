import { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import ConfirmDialog from './ConfirmDialog';

function ServerInfo({ isAdmin, showToast }) {
    const { t } = useLanguage();
    const [showInfo, setShowInfo] = useState(false);
    const [serverStatus, setServerStatus] = useState({ isRunning: false, url: null });
    const [loading, setLoading] = useState(false);
    const [showStopConfirm, setShowStopConfirm] = useState(false);
    const [localIP, setLocalIP] = useState(null);

    useEffect(() => {
        if (window.electronAPI && window.electronAPI.getLocalIP) {
            window.electronAPI.getLocalIP().then(ip => {
                setLocalIP(ip);
            }).catch(() => {
                setLocalIP('localhost');
            });
        }

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
                showToast(t('serverStarted'), result.url || result.details, 'success');
                await checkServerStatus();
            } else {
                showToast(result.message, result.details, 'error');
            }
        } catch (error) {
            showToast(t('serverStartError'), error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleStopServer = async () => {
        setLoading(true);
        try {
            const result = await window.electronAPI.stopDevServer();
            if (result.success) {
                showToast(t('serverStopped'), '', 'info');
                await checkServerStatus();
            } else {
                showToast(result.message, result.details, 'error');
            }
        } catch (error) {
            showToast(t('serverStartError'), error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleCopyUrl = () => {
        const url = serverStatus.url || (localIP ? `http://${localIP}:5173` : '');
        if (url) {
            navigator.clipboard.writeText(url);
            showToast(t('addressCopied'), '', 'success');
        }
    };

    const getDisplayUrl = () => {
        if (serverStatus.url) return serverStatus.url;
        if (localIP && localIP !== 'localhost') return `http://${localIP}:5173`;
        return window.location.hostname !== 'localhost' && window.location.hostname !== ''
            ? `http://${window.location.hostname}:5173`
            : null;
    };

    const displayUrl = getDisplayUrl();
    const isElectron = window.electronAPI;

    // Для адміна в Electron показуємо панель управління
    if (isAdmin && isElectron) {
        return (
            <>
                <div className="bg-white dark:bg-dark-surface rounded-lg shadow-sm border border-gray-200 dark:border-dark-border p-4 mb-6">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                        <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${serverStatus.isRunning ? 'bg-green-500 animate-pulse' : 'bg-gray-300 dark:bg-gray-600'}`} />
                            <div>
                                <h3 className="font-medium text-gray-900 dark:text-dark-text">
                                    {t('serverForParticipants')}
                                </h3>
                                {serverStatus.isRunning && displayUrl && (
                                    <div className="flex items-center gap-2 mt-1">
                                        <code className="text-sm text-blue-600 dark:text-blue-400 font-mono">{displayUrl}</code>
                                        <button
                                            onClick={handleCopyUrl}
                                            className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                                        >
                                            {t('copyAddress')}
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
                                    {loading ? t('startingServer') : t('startServer')}
                                </button>
                            ) : (
                                <button
                                    onClick={() => setShowStopConfirm(true)}
                                    disabled={loading}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                                >
                                    {loading ? t('stoppingServer') : t('stopServer')}
                                </button>
                            )}
                        </div>
                    </div>

                    {!serverStatus.isRunning && (
                        <p className="text-sm text-gray-600 dark:text-dark-text-secondary mt-3">
                            💡 {t('participantsCanConnect')}
                        </p>
                    )}
                </div>

                <ConfirmDialog
                    isOpen={showStopConfirm}
                    onClose={() => setShowStopConfirm(false)}
                    onConfirm={handleStopServer}
                    title={t('confirmStopServer')}
                    description={t('confirmStopServerDesc')}
                />
            </>
        );
    }

    // Для всіх (включно з адміном не в Electron) - кнопка показу адреси
    return (
        <>
            <button
                onClick={() => setShowInfo(true)}
                className="px-2 sm:px-3 py-1.5 sm:py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition text-xs sm:text-sm font-medium whitespace-nowrap"
            >
                <span className="hidden sm:inline">📡 {t('networkConnection')}</span>
                <span className="sm:hidden">📡</span>
            </button>

            {showInfo && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-dark-surface rounded-2xl p-6 max-w-lg w-full shadow-xl">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-dark-text">
                                📡 {t('networkConnection')}
                            </h2>
                            <button
                                onClick={() => setShowInfo(false)}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="space-y-4">
                            {displayUrl ? (
                                <>
                                    <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-300 dark:border-green-800 rounded-lg p-4">
                                        <p className="text-green-800 dark:text-green-400 font-medium mb-1">
                                            ✅ {t('shareAddress')}
                                        </p>
                                        <code className="block bg-white dark:bg-dark-bg text-green-900 dark:text-green-300 font-mono text-sm sm:text-base p-3 rounded border border-green-200 dark:border-green-700 break-all">
                                            {displayUrl}
                                        </code>
                                    </div>

                                    <button
                                        onClick={handleCopyUrl}
                                        className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition font-medium"
                                    >
                                        {t('copyAddress')}
                                    </button>

                                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                                        <p className="text-blue-800 dark:text-blue-400 text-sm">
                                            💡 {t('participantsCanConnect')}
                                        </p>
                                    </div>
                                </>
                            ) : (
                                <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                                    <p className="text-gray-600 dark:text-gray-400">
                                        ⚠️ {t('serverStopped')}
                                    </p>
                                </div>
                            )}

                            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                                <p className="text-yellow-800 dark:text-yellow-400 font-medium mb-2">
                                    ⚠️ {t('important')}
                                </p>
                                <ul className="text-sm text-yellow-700 dark:text-yellow-500 space-y-1">
                                    <li>• {t('sameWifi')}</li>
                                    <li>• {t('checkFirewall')}</li>
                                    <li>• {t('ipMayChange')}</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default ServerInfo;
