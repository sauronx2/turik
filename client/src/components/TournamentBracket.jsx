import { useState } from 'react';

function TournamentBracket({ tournamentState, isAdmin, onUpdate }) {
    const [selectedPlayer, setSelectedPlayer] = useState(null);
    const [selectedStage, setSelectedStage] = useState(null);
    const [selectedIndex, setSelectedIndex] = useState(null);

    if (!tournamentState) return null;

    const handleGroupWinner = (groupIndex) => {
        if (!isAdmin) return;

        const group = tournamentState.groups[groupIndex];
        setSelectedStage('group');
        setSelectedIndex(groupIndex);
    };

    const handleSelectWinner = (player) => {
        if (!isAdmin || !selectedStage) return;

        const newState = { ...tournamentState };

        if (selectedStage === 'group') {
            // Move to semifinals
            newState.semifinals[selectedIndex] = player;
            if (newState.semifinals.every(p => p !== null)) {
                newState.currentRound = 'semifinals';
            }
        } else if (selectedStage === 'semifinal') {
            // Move to finals
            newState.finals[selectedIndex] = player;
            if (newState.finals.every(p => p !== null)) {
                newState.currentRound = 'finals';
            }
        } else if (selectedStage === 'final') {
            // Set winner
            newState.winner = player;
            newState.currentRound = 'winner';
        }

        onUpdate(newState);
        setSelectedStage(null);
        setSelectedIndex(null);
    };

    return (
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 shadow-xl">
            <h2 className="text-2xl font-bold text-white mb-6">Турнірна сітка</h2>

            {/* Groups */}
            <div className="grid grid-cols-2 gap-4 mb-8">
                {tournamentState.groups.map((group, idx) => (
                    <div key={group.id} className="bg-white/20 rounded-xl p-4">
                        <h3 className="text-lg font-semibold text-white mb-3">{group.name}</h3>
                        <div className="space-y-2">
                            {group.players.map((player, pIdx) => (
                                <div
                                    key={pIdx}
                                    onClick={() => {
                                        if (isAdmin && selectedStage === 'group' && selectedIndex === idx) {
                                            handleSelectWinner(player);
                                        }
                                    }}
                                    className={`bg-white/80 p-3 rounded-lg text-gray-800 font-medium transition cursor-pointer hover:bg-white ${selectedStage === 'group' && selectedIndex === idx
                                            ? 'ring-4 ring-yellow-400 scale-105'
                                            : ''
                                        } ${tournamentState.semifinals[idx] === player ? 'bg-green-200' : ''}`}
                                >
                                    {player}
                                </div>
                            ))}
                        </div>
                        {isAdmin && !tournamentState.semifinals[idx] && (
                            <button
                                onClick={() => handleGroupWinner(idx)}
                                className="mt-3 w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition text-sm"
                            >
                                Обрати переможця
                            </button>
                        )}
                        {tournamentState.semifinals[idx] && (
                            <div className="mt-3 text-center text-green-300 font-bold">
                                ✓ {tournamentState.semifinals[idx]}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Semifinals */}
            {tournamentState.semifinals.some(p => p !== null) && (
                <div className="mb-8">
                    <h3 className="text-xl font-bold text-white mb-4">Півфінали</h3>
                    <div className="grid grid-cols-2 gap-4">
                        {[0, 1].map((matchIdx) => (
                            <div key={matchIdx} className="bg-white/20 rounded-xl p-4">
                                <h4 className="text-white mb-3">Півфінал {matchIdx + 1}</h4>
                                <div className="space-y-2">
                                    {[matchIdx * 2, matchIdx * 2 + 1].map((playerIdx) => {
                                        const player = tournamentState.semifinals[playerIdx];
                                        if (!player) return null;
                                        return (
                                            <div
                                                key={playerIdx}
                                                onClick={() => {
                                                    if (isAdmin && selectedStage === 'semifinal' && selectedIndex === matchIdx) {
                                                        handleSelectWinner(player);
                                                    }
                                                }}
                                                className={`bg-white/80 p-3 rounded-lg text-gray-800 font-medium transition cursor-pointer hover:bg-white ${selectedStage === 'semifinal' && selectedIndex === matchIdx
                                                        ? 'ring-4 ring-yellow-400 scale-105'
                                                        : ''
                                                    } ${tournamentState.finals[matchIdx] === player ? 'bg-green-200' : ''}`}
                                            >
                                                {player}
                                            </div>
                                        );
                                    })}
                                </div>
                                {isAdmin && !tournamentState.finals[matchIdx] && tournamentState.semifinals.every(p => p) && (
                                    <button
                                        onClick={() => {
                                            setSelectedStage('semifinal');
                                            setSelectedIndex(matchIdx);
                                        }}
                                        className="mt-3 w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition text-sm"
                                    >
                                        Обрати переможця
                                    </button>
                                )}
                                {tournamentState.finals[matchIdx] && (
                                    <div className="mt-3 text-center text-green-300 font-bold">
                                        ✓ {tournamentState.finals[matchIdx]}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Finals */}
            {tournamentState.finals.some(p => p !== null) && (
                <div className="mb-8">
                    <h3 className="text-xl font-bold text-white mb-4">🏆 Фінал</h3>
                    <div className="bg-white/20 rounded-xl p-6 max-w-md mx-auto">
                        <div className="space-y-3">
                            {tournamentState.finals.map((player, idx) => {
                                if (!player) return null;
                                return (
                                    <div
                                        key={idx}
                                        onClick={() => {
                                            if (isAdmin && selectedStage === 'final') {
                                                handleSelectWinner(player);
                                            }
                                        }}
                                        className={`bg-white/80 p-4 rounded-lg text-gray-800 font-bold text-lg transition cursor-pointer hover:bg-white ${selectedStage === 'final'
                                                ? 'ring-4 ring-yellow-400 scale-105'
                                                : ''
                                            } ${tournamentState.winner === player ? 'bg-yellow-200' : ''}`}
                                    >
                                        {player}
                                    </div>
                                );
                            })}
                        </div>
                        {isAdmin && !tournamentState.winner && tournamentState.finals.every(p => p) && (
                            <button
                                onClick={() => setSelectedStage('final')}
                                className="mt-4 w-full bg-yellow-600 text-white py-3 rounded-lg hover:bg-yellow-700 transition font-bold"
                            >
                                Обрати переможця фіналу
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Winner */}
            {tournamentState.winner && (
                <div className="text-center">
                    <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl p-8 shadow-2xl">
                        <div className="text-6xl mb-4">🏆</div>
                        <h2 className="text-3xl font-bold text-white mb-2">Переможець!</h2>
                        <p className="text-4xl font-black text-white">{tournamentState.winner}</p>
                    </div>
                </div>
            )}
        </div>
    );
}

export default TournamentBracket;
