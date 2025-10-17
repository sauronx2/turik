import { useState, useEffect } from 'react';

function NetworkInfo() {
  const [showInfo, setShowInfo] = useState(false);
  const [copied, setCopied] = useState(false);

  const getNetworkUrl = () => {
    const host = window.location.hostname;
    const port = window.location.port;
    return `http://${host}:${port}`;
  };

  const handleCopy = () => {
    const url = getNetworkUrl();
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
              <div>
                <p className="text-sm text-gray-600 mb-2">
                  Надішліть цю адресу учасникам:
                </p>
                <div className="bg-gray-100 p-4 rounded-lg border-2 border-gray-300">
                  <code className="text-lg font-mono text-blue-600 break-all">
                    {getNetworkUrl()}
                  </code>
                </div>
              </div>

              <button
                onClick={handleCopy}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
              >
                {copied ? '✅ Скопійовано!' : '📋 Копіювати адресу'}
              </button>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800 font-medium mb-2">
                  ⚠️ Важливо:
                </p>
                <ul className="text-sm text-yellow-700 space-y-1 list-disc list-inside">
                  <li>Всі мають бути в одній WiFi мережі</li>
                  <li>Якщо не працює - вимкніть firewall</li>
                  <li>IP може змінитись після перезагрузки роутера</li>
                </ul>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800 font-medium mb-2">
                  💡 Порада:
                </p>
                <p className="text-sm text-blue-700">
                  Створіть QR-код з цієї адреси на сайті{' '}
                  <a
                    href="https://www.qr-code-generator.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline font-medium"
                  >
                    qr-code-generator.com
                  </a>
                  {' '}і покажіть учасникам - вони зможуть просто відсканувати камерою!
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default NetworkInfo;
