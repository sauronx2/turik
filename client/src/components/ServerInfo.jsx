import { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

function ServerInfo({ isAdmin }) {
    const { t } = useLanguage();
    const [showInfo, setShowInfo] = useState(false);
    const [serverStatus, setServerStatus] = useState({ isRunning: false, url: null });
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

    const handleCopy = () => {
        if (serverStatus.url) {
            navigator.clipboard.writeText(serverStatus.url);
        }
    };

    // Only show for admin in Electron
    if (!isAdmin || !window.electronAPI) return null;

    return (
        <div className="relative">
            {/* Server Status Badge */}
            <div className="flex items-center gap-2 bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-lg px-3 py-2 shadow-sm">
                {/* Status Indicator */}
                <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${serverStatus.isRunning ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        {serverStatus.isRunning ? t('serverRunning') : t('serverStopped')}
                    </span>
                </div>

                {/* URL (if running) */}
                {serverStatus.isRunning && serverStatus.url && (
                    <>
                        <div className="h-4 w-px bg-gray-300 dark:bg-gray-600"></div>
                        <code className="text-xs text-blue-600 dark:text-blue-400 font-mono">
                            {serverStatus.url}
                        </code>
                        <button
                            onClick={handleCopy}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition"
                            title={t('copyAddress')}
                        >
                            📋
                        </button>
                    </>
                )}

                {/* Info Button */}
                <div className="relative">
                    <button
                        onMouseEnter={() => setShowInfo(true)}
                        onMouseLeave={() => setShowInfo(false)}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition text-gray-500 dark:text-gray-400"
                        title="Important info"
                    >
                        ℹ️
                    </button>

                    {/* Info Popup */}
                    {showInfo && (
                        <div className="absolute right-0 top-full mt-2 w-80 bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-400 dark:border-yellow-600 rounded-lg p-4 shadow-xl z-50">
                            <div className="flex items-start gap-2 mb-3">
                                <span className="text-2xl">⚠️</span>
                                <h4 className="font-bold text-yellow-900 dark:text-yellow-300">Important:</h4>
                            </div>
                            <ul className="text-sm text-yellow-900 dark:text-yellow-200 space-y-2">
                                <li className="flex gap-2">
                                    <span>•</span>
                                    <span>Everyone must be on the same WiFi network</span>
                                </li>
                                <li className="flex gap-2">
                                    <span>•</span>
                                    <span>If not working - disable firewall</span>
                                </li>
                                <li className="flex gap-2">
                                    <span>•</span>
                                    <span>IP may change after router restart</span>
                                </li>
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ServerInfo;
