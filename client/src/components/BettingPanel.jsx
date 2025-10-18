import { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

function BettingPanel({ tournamentState, activeBets, username, bottles, onPlaceBet }) {
    const { t } = useLanguage();
    const [selectedPlayer, setSelectedPlayer] = useState('');
    const [betAmount, setBetAmount] = useState(1);

    if (!tournamentState) return null;

    // Get all active players
    const getAllActivePlayers = () => {
        const players = [];

        // From groups that haven't finished
        Object.values(tournamentState.groups).forEach(group => {
            if (!group.first) {
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
            <div className="bg-white dark:bg-dark-surface rounded-lg shadow-sm border border-gray-200 dark:border-dark-border p-3">
                <h3 className="text-sm font-medium text-gray-900 dark:text-dark-text mb-2">🍺 {t('bets')}</h3>
                <div className="text-center py-3 text-gray-500 dark:text-gray-400 text-sm">
                    {t('tournamentFinished')}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-dark-surface rounded-lg shadow-sm border border-gray-200 dark:border-dark-border p-3">
            {/* Header with Balance Badge */}
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-900 dark:text-dark-text">🍺 {t('bets')}</h3>
                <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-full">
                    <span className="text-lg font-bold text-gray-900 dark:text-gray-100">{bottles}</span>
                    <span className="text-xs text-gray-600 dark:text-gray-400">🍺</span>
                </div>
            </div>

            {/* Compact Bet Form */}
            <div className="space-y-2 pb-3 border-b border-gray-200 dark:border-gray-700">
                {/* Select Player */}
                <select
                    value={selectedPlayer}
                    onChange={(e) => setSelectedPlayer(e.target.value)}
                    className="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-md focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                >
                    <option value="">{t('selectPlayer')}</option>
                    {activePlayers.map((player) => (
                        <option key={player} value={player}>
                            {player} ({getTotalBetsOnPlayer(player)} 🍺)
                        </option>
                    ))}
                </select>

                {/* Amount Slider - Compact */}
                {selectedPlayer && (
                    <div className="flex items-center gap-2">
                        <input
                            type="range"
                            min="1"
                            max={Math.min(bottles, 10)}
                            value={betAmount}
                            onChange={(e) => setBetAmount(Number(e.target.value))}
                            className="flex-1 h-1"
                            disabled={!selectedPlayer || bottles < 1}
                        />
                        <span className="text-sm font-bold text-blue-600 dark:text-blue-400 min-w-[50px] text-right">
                            {betAmount} 🍺
                        </span>
                    </div>
                )}

                {/* Place Bet Button */}
                <button
                    onClick={handlePlaceBet}
                    disabled={!selectedPlayer || betAmount < 1 || betAmount > bottles}
                    className="w-full py-1.5 px-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed transition text-xs font-medium"
                >
                    {t('placeBet')} {betAmount} 🍺
                </button>
            </div>

            {/* My Bets - Compact List */}
            <div className="pt-3">
                <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">{t('myBets')}</h4>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                    {myBets.length === 0 ? (
                        <div className="text-center py-2 text-gray-500 dark:text-gray-400 text-xs">
                            {t('noBetsYet')}
                        </div>
                    ) : (
                        myBets.map(([player, userBets]) => (
                            <div
                                key={player}
                                className="flex justify-between items-center px-2 py-1 bg-gray-50 dark:bg-gray-800 rounded text-xs"
                            >
                                <span className="font-medium text-gray-900 dark:text-gray-100 truncate">{player}</span>
                                <span className="text-blue-600 dark:text-blue-400 font-semibold whitespace-nowrap ml-2">
                                    {userBets[username]} 🍺
                                </span>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

export default BettingPanel;
