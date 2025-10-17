import { useState } from 'react';

function AdminPanel({ tournamentState, activeBets, usersList, onResetMatch, onReplacePlayer, onRemoveBet, onFullReset }) {
  const [oldPlayerName, setOldPlayerName] = useState('');
  const [newPlayerName, setNewPlayerName] = useState('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState('');

  const handleFullReset = () => {
    if (resetConfirmText.toLowerCase() === 'скинути все') {
      onFullReset();
      setShowResetConfirm(false);
      setResetConfirmText('');
    }
  };

    if (!tournamentState) return null;

    const getAllPlayers = () => {
        const players = new Set();
        Object.values(tournamentState.groups).forEach(group => {
            group.players.forEach(p => players.add(p));
        });
        return Array.from(players);
    };

    const allPlayers = getAllPlayers();

    const handleReplacePlayer = (e) => {
        e.preventDefault();
        if (!oldPlayerName || !newPlayerName) return;
        onReplacePlayer(oldPlayerName, newPlayerName);
        setOldPlayerName('');
        setNewPlayerName('');
    };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-medium text-gray-900">Адмін-панель</h1>
        <button
          onClick={() => setShowResetConfirm(true)}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold"
        >
          ⚠️ Повний скид турніру
        </button>
      </div>

      {/* Full Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h2 className="text-xl font-bold text-red-600 mb-4">⚠️ УВАГА!</h2>
            <p className="text-gray-700 mb-4">
              Це скине <strong>ВСЕ</strong>:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
              <li>Позиції всіх гравців</li>
              <li>Результати всіх матчів</li>
              <li>Баланси користувачів (→ 20 🍺)</li>
              <li>Всі ставки</li>
              <li>Історію чату</li>
            </ul>
            <p className="text-sm text-gray-600 mb-4">
              Введіть <code className="bg-gray-100 px-2 py-1 rounded">скинути все</code> для підтвердження:
            </p>
            <input
              type="text"
              value={resetConfirmText}
              onChange={(e) => setResetConfirmText(e.target.value)}
              placeholder="скинути все"
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-500 mb-4"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={handleFullReset}
                disabled={resetConfirmText.toLowerCase() !== 'скинути все'}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-semibold"
              >
                Підтвердити скид
              </button>
              <button
                onClick={() => {
                  setShowResetConfirm(false);
                  setResetConfirmText('');
                }}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
              >
                Скасувати
              </button>
            </div>
          </div>
        </div>
      )}

            {/* Reset Matches */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Скинути результати</h2>

                <div className="space-y-4">
                    {/* Groups */}
                    <div>
                        <h3 className="text-sm font-medium text-gray-700 mb-2">Групи</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {Object.entries(tournamentState.groups).map(([key, group]) => (
                                <button
                                    key={key}
                                    onClick={() => onResetMatch('group', key)}
                                    disabled={!group.winner}
                                    className="px-3 py-2 bg-red-50 text-red-700 border border-red-300 rounded-md hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm"
                                >
                                    {group.name}
                                </button>
                            ))}
                        </div>
                    </div>

          {/* Quarter Finals */}
          {tournamentState.currentRound !== 'groups' && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">1/4 фіналу</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {tournamentState.quarterFinals.map((match) => (
                  <button
                    key={match.id}
                    onClick={() => onResetMatch('quarterFinals', match.id)}
                    disabled={!match.winner}
                    className="px-3 py-2 bg-red-50 text-red-700 border border-red-300 rounded-md hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm"
                  >
                    {match.name}
                  </button>
                ))}
              </div>
            </div>
          )}

                    {/* Semi Finals */}
                    {['semiFinals', 'final', 'finished'].includes(tournamentState.currentRound) && (
                        <div>
                            <h3 className="text-sm font-medium text-gray-700 mb-2">Півфінали</h3>
                            <div className="grid grid-cols-2 gap-2">
                                {tournamentState.semiFinals.filter(m => m).map((match) => (
                                    <button
                                        key={match.id}
                                        onClick={() => onResetMatch('semiFinals', match.id)}
                                        disabled={!match.winner}
                                        className="px-3 py-2 bg-red-50 text-red-700 border border-red-300 rounded-md hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm"
                                    >
                                        {match.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Final */}
                    {['final', 'finished'].includes(tournamentState.currentRound) && (
                        <div>
                            <h3 className="text-sm font-medium text-gray-700 mb-2">Фінал</h3>
                            <button
                                onClick={() => onResetMatch('final')}
                                disabled={!tournamentState.final.winner}
                                className="px-3 py-2 bg-red-50 text-red-700 border border-red-300 rounded-md hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm"
                            >
                                Скинути фінал
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Replace Player */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Замінити гравця</h2>

                <form onSubmit={handleReplacePlayer} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Старий гравець
                            </label>
                            <select
                                value={oldPlayerName}
                                onChange={(e) => setOldPlayerName(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                            >
                                <option value="">Оберіть...</option>
                                {allPlayers.map((player) => (
                                    <option key={player} value={player}>
                                        {player}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Новий гравець
                            </label>
                            <input
                                type="text"
                                value={newPlayerName}
                                onChange={(e) => setNewPlayerName(e.target.value)}
                                placeholder="Ім'я нового гравця"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition"
                    >
                        Замінити гравця
                    </button>
                </form>
            </div>

            {/* Manage Bets */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Управління ставками</h2>

                <div className="space-y-3">
                    {Object.entries(activeBets).map(([player, userBets]) => (
                        <div key={player} className="border border-gray-200 rounded-lg p-4">
                            <h3 className="font-medium text-gray-900 mb-3">{player}</h3>
                            <div className="space-y-2">
                                {Object.entries(userBets).map(([username, amount]) => (
                                    <div key={username} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                                        <div>
                                            <span className="text-sm text-gray-900">{username}</span>
                                            <span className="text-sm text-gray-500 ml-2">— {amount} 🍺</span>
                                        </div>
                                        <button
                                            onClick={() => onRemoveBet(player, username)}
                                            className="text-xs text-red-600 hover:text-red-700 font-medium"
                                        >
                                            Скасувати
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                    {Object.keys(activeBets).length === 0 && (
                        <div className="text-center py-8 text-gray-400 text-sm">
                            Немає активних ставок
                        </div>
                    )}
                </div>
            </div>

            {/* Users List */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Користувачі</h2>

                <div className="space-y-2">
                    {usersList.map((user) => (
                        <div key={user.username} className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
                            <div className="flex items-center gap-3">
                                <div className={`w-2 h-2 rounded-full ${user.isOnline ? 'bg-green-500' : 'bg-gray-300'
                                    }`} />
                                <span className="text-sm font-medium text-gray-900">{user.username}</span>
                            </div>
                            <span className="text-sm text-gray-600">{user.bottles} 🍺</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default AdminPanel;
