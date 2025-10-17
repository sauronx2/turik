import { useState } from 'react';

function BettingPanel({ bets, users, currentUser, currentUserId, tournamentState, onPlaceBet, onRemoveBet }) {
    const [selectedPlayer, setSelectedPlayer] = useState('');
    const [betAmount, setBetAmount] = useState(1);

    if (!tournamentState || !currentUser) return null;

    // Get all active players
    const allPlayers = [
        ...tournamentState.groups.flatMap(g => g.players),
        ...tournamentState.semifinals.filter(p => p),
        ...tournamentState.finals.filter(p => p),
    ];

    const uniquePlayers = [...new Set(allPlayers)];

    const handlePlaceBet = () => {
        if (!selectedPlayer || betAmount < 1 || betAmount > currentUser.bottles) return;
        onPlaceBet(selectedPlayer, betAmount);
        setSelectedPlayer('');
        setBetAmount(1);
    };

    const myBets = Object.entries(bets).filter(([player, userBets]) =>
        userBets[currentUserId]
    );

    const getTotalBetsOnPlayer = (player) => {
        if (!bets[player]) return 0;
        return Object.values(bets[player]).reduce((sum, amount) => sum + amount, 0);
    };

    return (
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 shadow-xl">
            <h2 className="text-2xl font-bold text-white mb-6">🍺 Ставки</h2>

            {/* My bottles */}
            <div className="bg-white/20 rounded-xl p-4 mb-6">
                <div className="text-center">
                    <div className="text-5xl mb-2">🍺</div>
                    <div className="text-3xl font-bold text-white">{currentUser.bottles}</div>
                    <div className="text-white/70 text-sm">Ваші пляшки</div>
                </div>
            </div>

            {/* Place bet */}
            {!tournamentState.winner && (
                <div className="bg-white/20 rounded-xl p-4 mb-6">
                    <h3 className="text-white font-semibold mb-3">Зробити ставку</h3>
                    <div className="space-y-3">
                        <div>
                            <label className="block text-white/80 text-sm mb-2">Гравець</label>
                            <select
                                value={selectedPlayer}
                                onChange={(e) => setSelectedPlayer(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg bg-white/90 text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            >
                                <option value="">Оберіть гравця...</option>
                                {uniquePlayers.map((player) => (
                                    <option key={player} value={player}>
                                        {player} ({getTotalBetsOnPlayer(player)} 🍺)
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-white/80 text-sm mb-2">
                                Кількість пляшок: {betAmount}
                            </label>
                            <input
                                type="range"
                                min="1"
                                max={Math.max(1, currentUser.bottles)}
                                value={betAmount}
                                onChange={(e) => setBetAmount(Number(e.target.value))}
                                className="w-full"
                            />
                        </div>
                        <button
                            onClick={handlePlaceBet}
                            disabled={!selectedPlayer || currentUser.bottles < 1}
                            className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                        >
                            Поставити {betAmount} 🍺
                        </button>
                    </div>
                </div>
            )}

            {/* My bets */}
            {myBets.length > 0 && (
                <div className="bg-white/20 rounded-xl p-4 mb-6">
                    <h3 className="text-white font-semibold mb-3">Мої ставки</h3>
                    <div className="space-y-2">
                        {myBets.map(([player, userBets]) => (
                            <div key={player} className="bg-white/80 p-3 rounded-lg flex justify-between items-center">
                                <div>
                                    <div className="font-semibold text-gray-800">{player}</div>
                                    <div className="text-sm text-gray-600">{userBets[currentUserId]} 🍺</div>
                                </div>
                                {!tournamentState.winner && (
                                    <button
                                        onClick={() => onRemoveBet(player)}
                                        className="text-red-600 hover:text-red-700 font-bold"
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* All bets leaderboard */}
            <div className="bg-white/20 rounded-xl p-4">
                <h3 className="text-white font-semibold mb-3">Всі ставки</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                    {Object.entries(bets)
                        .map(([player, userBets]) => ({
                            player,
                            total: Object.values(userBets).reduce((sum, amount) => sum + amount, 0),
                        }))
                        .sort((a, b) => b.total - a.total)
                        .map(({ player, total }) => (
                            <div key={player} className="bg-white/80 p-3 rounded-lg flex justify-between items-center">
                                <span className="font-semibold text-gray-800">{player}</span>
                                <span className="text-purple-600 font-bold">{total} 🍺</span>
                            </div>
                        ))}
                    {Object.keys(bets).length === 0 && (
                        <div className="text-white/60 text-center py-4">
                            Ще немає ставок
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default BettingPanel;
