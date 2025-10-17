import { useState, useEffect } from 'react';

function NetworkInfo() {
  const [showInfo, setShowInfo] = useState(false);
  const [copied, setCopied] = useState(false);
  const [localIP, setLocalIP] = useState(null);

  useEffect(() => {
    // Get IP from Electron if available
    if (window.electronAPI && window.electronAPI.getLocalIP) {
      window.electronAPI.getLocalIP().then(ip => {
        setLocalIP(ip);
      }).catch(() => {
        setLocalIP('localhost');
      });
    }
  }, []);

  const getNetworkUrl = () => {
    // In Electron, use the IP from main process
    if (window.location.protocol === 'file:' && localIP) {
      return `http://${localIP}:5173`;
    }

    const host = window.location.hostname;
    const port = window.location.port || '5173';

    // If on localhost, show a message to use IP instead
    if (host === 'localhost' || host === '127.0.0.1' || host === '') {
      return 'localhost'; // We'll handle this separately
    }

    return `http://${host}:${port}`;
  };

  const isLocalhost = () => {
    const host = window.location.hostname;
    return host === 'localhost' || host === '127.0.0.1' || host === '' || window.location.protocol === 'file:';
  };

  const handleCopy = () => {
    const url = getNetworkUrl();
    if (url !== 'localhost') {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowInfo(true)}
        className="px-2 sm:px-3 py-1.5 sm:py-2 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-100 transition text-xs sm:text-sm font-medium whitespace-nowrap"
      >
        <span className="hidden sm:inline">📡 Адреса</span>
        <span className="sm:hidden">📡</span>
      </button>

      {showInfo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">📡 Підключення до турніру</h2>
              <button
                onClick={() => setShowInfo(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {isLocalhost() ? (
                // Show instructions when on localhost
                <>
                  <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4">
                    <p className="text-red-800 font-medium mb-2">
                      ⚠️ Ви на localhost!
                    </p>
                    <p className="text-sm text-red-700">
                      Інші пристрої не можуть підключитись через localhost.
                      Використайте IP адресу вашого комп'ютера.
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      📍 Як знайти вашу IP адресу:
                    </p>
                    <div className="bg-gray-100 p-3 rounded-lg space-y-2 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">macOS/Linux:</span>
                        <code className="block bg-white p-2 rounded mt-1 text-xs">
                          ifconfig | grep "inet " | grep -v 127.0.0.1
                        </code>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Windows:</span>
                        <code className="block bg-white p-2 rounded mt-1 text-xs">
                          ipconfig
                        </code>
                      </div>
                      <p className="text-gray-600 text-xs mt-2">
                        Шукайте IP виду: <span className="font-mono text-blue-600">192.168.x.x</span> або <span className="font-mono text-blue-600">10.0.x.x</span>
                      </p>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-800">
                      💡 <strong>Приклад:</strong> Якщо ваш IP <code>192.168.31.172</code>,
                      то адреса буде: <code className="font-bold">http://192.168.31.172:5173</code>
                    </p>
                  </div>
                </>
              ) : (
                // Show actual network URL
                <>
                  <div>
                    <p className="text-sm text-gray-600 mb-2">
                      ✅ Надішліть цю адресу учасникам:
                    </p>
                    <div className="bg-green-50 p-4 rounded-lg border-2 border-green-300">
                      <code className="text-lg font-mono text-green-700 break-all font-bold">
                        {getNetworkUrl()}
                      </code>
                    </div>
                  </div>

                  <button
                    onClick={handleCopy}
                    className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold"
                  >
                    {copied ? '✅ Скопійовано!' : '📋 Копіювати адресу'}
                  </button>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-800">
                      ✨ Учасники вже можуть підключатись з телефонів та інших пристроїв!
                    </p>
                  </div>
                </>
              )}

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800 font-medium mb-2">
                  ⚠️ Важливо:
                </p>
                <ul className="text-sm text-yellow-700 space-y-1 list-disc list-inside">
                  <li>Всі мають бути в одній WiFi мережі</li>
                  <li>Якщо не працює - вимкніть firewall</li>
                  <li>IP може змінитись після перезагрузки роутера</li>
                </ul>
              </div>

              {!isLocalhost() && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                  <p className="text-sm text-purple-800 font-medium mb-2">
                    📱 Швидке підключення через QR:
                  </p>
                  <p className="text-sm text-purple-700">
                    Створіть QR-код на{' '}
                    <a
                      href={`https://www.qr-code-generator.com/`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline font-medium"
                    >
                      qr-code-generator.com
                    </a>
                    {' '}та покажіть учасникам!
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default NetworkInfo;
