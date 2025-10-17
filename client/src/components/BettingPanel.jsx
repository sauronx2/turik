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
            <div className="bg-white dark:bg-dark-surface rounded-lg shadow-sm border border-gray-200 dark:border-dark-border p-4 lg:p-6">
                <h2 className="text-base lg:text-lg font-medium text-gray-900 dark:text-dark-text mb-3 lg:mb-4">{t('bets')}</h2>
                <div className="text-center py-6 lg:py-8 text-gray-500 dark:text-gray-400 text-sm lg:text-base">
                    {t('tournamentFinished')}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-dark-surface rounded-lg shadow-sm border border-gray-200 dark:border-dark-border p-4 lg:p-6">
            <h2 className="text-base lg:text-lg font-medium text-gray-900 dark:text-dark-text mb-4 lg:mb-6">🍺 {t('bets')}</h2>

            {/* My bottles */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3 lg:p-4 mb-4 lg:mb-6">
                <div className="text-center">
                    <div className="text-4xl mb-2">🍺</div>
                    <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">{bottles}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">{t('yourBottles')}</div>
                </div>
            </div>

            {/* Place Bet */}
            <div className="space-y-3 mb-4 lg:mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('makeBet')}
                </label>

                {/* Select Player */}
                <select
                    value={selectedPlayer}
                    onChange={(e) => setSelectedPlayer(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                >
                    <option value="">{t('selectPlayer')}</option>
                    {activePlayers.map((player) => (
                        <option key={player} value={player}>
                            {player} ({getTotalBetsOnPlayer(player)} 🍺)
                        </option>
                    ))}
                </select>

                {/* Amount Slider */}
                <div>
                    <div className="flex justify-between items-center mb-2">
                        <label className="text-sm text-gray-700 dark:text-gray-300">{t('amount')}</label>
                        <span className="text-lg font-bold text-blue-600 dark:text-blue-400">{betAmount} 🍺</span>
                    </div>
                    <input
                        type="range"
                        min="1"
                        max={Math.min(bottles, 10)}
                        value={betAmount}
                        onChange={(e) => setBetAmount(Number(e.target.value))}
                        className="w-full"
                        disabled={!selectedPlayer || bottles < 1}
                    />
                </div>

                {/* Place Bet Button */}
                <button
                    onClick={handlePlaceBet}
                    disabled={!selectedPlayer || betAmount < 1 || betAmount > bottles}
                    className="w-full py-2 px-4 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed transition font-medium text-sm"
                >
                    {t('placeBet')} {betAmount} 🍺
                </button>
            </div>

            {/* All Bets */}
            <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('allBets')}</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                    {myBets.length === 0 ? (
                        <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
                            {t('noBetsYet')}
                        </div>
                    ) : (
                        myBets.map(([player, userBets]) => (
                            <div
                                key={player}
                                className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800 rounded-md text-sm"
                            >
                                <span className="font-medium text-gray-900 dark:text-gray-100">{player}</span>
                                <span className="text-blue-600 dark:text-blue-400 font-semibold">
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
