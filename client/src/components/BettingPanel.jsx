import { useState } from 'react';

function BettingPanel({ tournamentState, activeBets, username, bottles, onPlaceBet }) {
    const [selectedPlayer, setSelectedPlayer] = useState('');
    const [betAmount, setBetAmount] = useState(1);

    if (!tournamentState) return null;

    // Get all active players
    const getAllActivePlayers = () => {
        const players = [];

        // From groups that haven't finished
        Object.values(tournamentState.groups).forEach(group => {
            if (!group.winner) {
                players.push(...group.players);
            }
        });

        // From quarter finals
        if (tournamentState.currentRound === 'quarterFinals') {
            tournamentState.quarterFinals.forEach(match => {
                match.players.forEach(p => p && !match.winner && players.push(p));
            });
        }

        // From semi finals
        if (tournamentState.currentRound === 'semiFinals') {
            tournamentState.semiFinals.forEach(match => {
                match.players.forEach(p => p && !match.winner && players.push(p));
            });
        }

        // From final
        if (tournamentState.currentRound === 'final') {
            tournamentState.final.players.forEach(p => p && !tournamentState.final.winner && players.push(p));
        }

        return [...new Set(players)];
    };

    const activePlayers = getAllActivePlayers();

    const handlePlaceBet = () => {
        if (!selectedPlayer || betAmount < 1 || betAmount > bottles) return;
        onPlaceBet(selectedPlayer, betAmount);
        setSelectedPlayer('');
        setBetAmount(1);
    };

    // Get my bets
    const myBets = Object.entries(activeBets).filter(([player, userBets]) =>
        userBets[username]
    );

    const getTotalBetsOnPlayer = (player) => {
        if (!activeBets[player]) return 0;
        return Object.values(activeBets[player]).reduce((sum, amount) => sum + amount, 0);
    };

    if (tournamentState.currentRound === 'finished') {
        return (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Ставки</h2>
                <div className="text-center py-8 text-gray-500">
                    Турнір завершено!
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Ставки</h2>

            {/* My bottles */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="text-center">
                    <div className="text-4xl mb-2">🍺</div>
                    <div className="text-3xl font-bold text-gray-900">{bottles}</div>
                    <div className="text-sm text-gray-600">Ваші пляшки</div>
                </div>
            </div>

            {/* Place bet */}
            {activePlayers.length > 0 && (
                <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Зробити ставку</h3>
                    <div className="space-y-3">
                        <div>
                            <label className="block text-xs text-gray-600 mb-2">Гравець</label>
                            <select
                                value={selectedPlayer}
                                onChange={(e) => setSelectedPlayer(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            >
                                <option value="">Оберіть...</option>
                                {activePlayers.map((player) => (
                                    <option key={player} value={player}>
                                        {player} ({getTotalBetsOnPlayer(player)} 🍺)
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs text-gray-600 mb-2">
                                Кількість: {betAmount} 🍺
                            </label>
                            <input
                                type="range"
                                min="1"
                                max={Math.max(1, Math.min(bottles, 10))}
                                value={betAmount}
                                onChange={(e) => setBetAmount(Number(e.target.value))}
                                className="w-full"
                            />
                        </div>
                        <button
                            onClick={handlePlaceBet}
                            disabled={!selectedPlayer || bottles < 1}
                            className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm font-medium"
                        >
                            Поставити {betAmount} 🍺
                        </button>
                    </div>
                </div>
            )}

            {/* My active bets */}
            {myBets.length > 0 && (
                <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Мої ставки</h3>
                    <div className="space-y-2">
                        {myBets.map(([player, userBets]) => (
                            <div key={player} className="bg-gray-50 border border-gray-200 p-3 rounded-md">
                                <div className="text-sm font-medium text-gray-900">{player}</div>
                                <div className="text-xs text-gray-500">{userBets[username]} 🍺</div>
                            </div>
                        ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                        💡 Скасувати ставку може тільки адміністратор
                    </p>
                </div>
            )}

            {/* All bets */}
            <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Всі ставки</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                    {Object.entries(activeBets)
                        .map(([player, userBets]) => ({
                            player,
                            total: Object.values(userBets).reduce((sum, amount) => sum + amount, 0),
                        }))
                        .sort((a, b) => b.total - a.total)
                        .map(({ player, total }) => (
                            <div key={player} className="bg-gray-50 p-2 rounded-md flex justify-between items-center">
                                <span className="text-sm text-gray-900">{player}</span>
                                <span className="text-sm font-semibold text-blue-600">{total} 🍺</span>
                            </div>
                        ))}
                    {Object.keys(activeBets).length === 0 && (
                        <div className="text-center py-4 text-gray-400 text-sm">
                            Ще немає ставок
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default BettingPanel;
