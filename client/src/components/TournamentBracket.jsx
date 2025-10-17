import { useState } from 'react';

function TournamentBracket({
    tournamentState,
    isAdmin,
    onSetGroupWinner,
    onSetQuarterFinalWinner,
    onSetSemiFinalWinner,
    onSetFinalWinner
}) {
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [firstPlace, setFirstPlace] = useState(null);
    const [secondPlace, setSecondPlace] = useState(null);
    const [selectedMatch, setSelectedMatch] = useState(null);

    if (!tournamentState) return null;

    const handleGroupSelection = (player) => {
        if (!firstPlace) {
            setFirstPlace(player);
        } else if (!secondPlace && player !== firstPlace) {
            setSecondPlace(player);
        }
    };

    const handleConfirmGroupRankings = () => {
        if (firstPlace && secondPlace && selectedGroup) {
            // Emit new event for group rankings
            const socket = window.socketInstance;
            if (socket) {
                socket.emit('set-group-rankings', {
                    group: selectedGroup,
                    first: firstPlace,
                    second: secondPlace
                });
            }
            setSelectedGroup(null);
            setFirstPlace(null);
            setSecondPlace(null);
        }
    };

    const GroupCard = ({ groupKey, group }) => (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">{group.name}</h3>
            <div className="space-y-2">
                {group.players.map((player, idx) => (
                    <button
                        key={idx}
                        onClick={() => {
                            if (isAdmin && selectedGroup === groupKey && !group.first) {
                                handleGroupSelection(player);
                            }
                        }}
                        disabled={!isAdmin || group.first}
                        className={`w-full text-left px-3 py-2 rounded-md text-sm transition ${group.first === player
                            ? 'bg-yellow-50 border-2 border-yellow-500 text-yellow-900 font-bold'
                            : group.second === player
                                ? 'bg-green-50 border-2 border-green-500 text-green-900 font-medium'
                                : selectedGroup === groupKey && firstPlace === player
                                    ? 'bg-yellow-100 border-2 border-yellow-400'
                                    : selectedGroup === groupKey && secondPlace === player
                                        ? 'bg-green-100 border-2 border-green-400'
                                        : selectedGroup === groupKey && isAdmin && !group.first
                                            ? 'bg-blue-50 border border-blue-300 hover:bg-blue-100'
                                            : 'bg-gray-50 border border-gray-200'
                            } ${!isAdmin || group.first ? 'cursor-default' : 'cursor-pointer'}`}
                    >
                        {player}
                        {group.first === player && ' 🥇'}
                        {group.second === player && ' 🥈'}
                    </button>
                ))}
            </div>

            {isAdmin && !group.first && (
                <>
                    {selectedGroup !== groupKey ? (
                        <button
                            onClick={() => {
                                setSelectedGroup(groupKey);
                                setFirstPlace(null);
                                setSecondPlace(null);
                            }}
                            className="mt-3 w-full text-sm py-2 px-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                        >
                            Обрати місця
                        </button>
                    ) : (
                        <div className="mt-3 space-y-2">
                            <div className="text-xs text-gray-600">
                                {!firstPlace && '1️⃣ Оберіть 1-ше місце'}
                                {firstPlace && !secondPlace && '2️⃣ Оберіть 2-ге місце'}
                                {firstPlace && secondPlace && '✅ Готово! Підтвердіть'}
                            </div>
                            {firstPlace && secondPlace && (
                                <button
                                    onClick={handleConfirmGroupRankings}
                                    className="w-full text-sm py-2 px-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
                                >
                                    Підтвердити
                                </button>
                            )}
                            <button
                                onClick={() => {
                                    setSelectedGroup(null);
                                    setFirstPlace(null);
                                    setSecondPlace(null);
                                }}
                                className="w-full text-sm py-2 px-3 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition"
                            >
                                Скасувати
                            </button>
                        </div>
                    )}
                </>
            )}

            {group.first && (
                <div className="mt-3 space-y-1">
                    <div className="text-center text-sm text-yellow-600 font-bold">
                        🥇 {group.first}
                    </div>
                    <div className="text-center text-sm text-green-600 font-medium">
                        🥈 {group.second}
                    </div>
                </div>
            )}
        </div>
    );

    const MatchCard = ({ match, title, onSelectWinner, stage }) => (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">{title}</h3>
            <div className="space-y-2">
                {match.players.map((player, idx) => {
                    if (!player) return (
                        <div key={idx} className="px-3 py-2 bg-gray-100 text-gray-400 text-sm rounded-md">
                            Очікування...
                        </div>
                    );
                    return (
                        <button
                            key={idx}
                            onClick={() => {
                                if (isAdmin && !match.winner && selectedMatch === `${stage}-${match.id}`) {
                                    onSelectWinner(match.id, player);
                                    setSelectedMatch(null);
                                }
                            }}
                            disabled={!isAdmin || match.winner || !match.players.every(p => p)}
                            className={`w-full text-left px-3 py-2 rounded-md text-sm transition ${match.winner === player
                                ? 'bg-green-50 border-2 border-green-500 text-green-900 font-medium'
                                : selectedMatch === `${stage}-${match.id}` && isAdmin && !match.winner
                                    ? 'bg-blue-50 border-2 border-blue-400 hover:bg-blue-100'
                                    : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                                } ${!isAdmin || match.winner ? 'cursor-default' : 'cursor-pointer'}`}
                        >
                            {player}
                        </button>
                    );
                })}
            </div>
            {isAdmin && !match.winner && match.players.every(p => p) && (
                <button
                    onClick={() => setSelectedMatch(selectedMatch === `${stage}-${match.id}` ? null : `${stage}-${match.id}`)}
                    className="mt-3 w-full text-sm py-2 px-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                >
                    {selectedMatch === `${stage}-${match.id}` ? 'Скасувати' : 'Обрати переможця'}
                </button>
            )}
            {match.winner && (
                <div className="mt-3 text-center text-sm text-green-600 font-medium">
                    ✓ {match.winner}
                </div>
            )}
        </div>
    );

    const FinalCard = () => (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 text-center">🏆 Фінал</h3>
            <div className="space-y-2">
                {tournamentState.final.players.map((player, idx) => {
                    if (!player) return (
                        <div key={idx} className="px-4 py-3 bg-gray-100 text-gray-400 text-sm rounded-md">
                            Очікування...
                        </div>
                    );
                    return (
                        <button
                            key={idx}
                            onClick={() => {
                                if (isAdmin && !tournamentState.final.winner && selectedMatch === 'final') {
                                    onSetFinalWinner(player);
                                    setSelectedMatch(null);
                                }
                            }}
                            disabled={!isAdmin || tournamentState.final.winner}
                            className={`w-full text-left px-4 py-3 rounded-md transition ${tournamentState.final.winner === player
                                ? 'bg-yellow-50 border-2 border-yellow-500 text-yellow-900 font-bold text-lg'
                                : selectedMatch === 'final' && isAdmin && !tournamentState.final.winner
                                    ? 'bg-blue-50 border-2 border-blue-400 hover:bg-blue-100 text-base'
                                    : 'bg-gray-50 border border-gray-200 hover:bg-gray-100 text-base'
                                } ${!isAdmin || tournamentState.final.winner ? 'cursor-default' : 'cursor-pointer'}`}
                        >
                            {player}
                        </button>
                    );
                })}
            </div>
            {isAdmin && !tournamentState.final.winner && tournamentState.final.players.every(p => p) && (
                <button
                    onClick={() => setSelectedMatch(selectedMatch === 'final' ? null : 'final')}
                    className="mt-4 w-full py-3 px-4 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition font-medium"
                >
                    {selectedMatch === 'final' ? 'Скасувати' : 'Обрати переможця'}
                </button>
            )}
            {tournamentState.final.winner && (
                <div className="mt-4 text-center">
                    <div className="text-4xl mb-2">🏆</div>
                    <div className="text-xl font-bold text-yellow-700">Переможець турніру!</div>
                    <div className="text-2xl font-black text-gray-900 mt-2">{tournamentState.final.winner}</div>
                </div>
            )}
        </div>
    );

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Groups */}
      <div>
        <h2 className="text-lg lg:text-xl font-medium text-gray-900 mb-3 lg:mb-4">Груповий етап</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
                    {Object.entries(tournamentState.groups).map(([key, group]) => (
                        <GroupCard key={key} groupKey={key} group={group} />
                    ))}
                </div>
            </div>

      {/* Quarter Finals */}
      {tournamentState.currentRound !== 'groups' && (
        <div>
          <h2 className="text-lg lg:text-xl font-medium text-gray-900 mb-3 lg:mb-4">1/4 фіналу</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
                        {tournamentState.quarterFinals.map((match) => (
                            <MatchCard
                                key={match.id}
                                match={match}
                                title={match.name}
                                onSelectWinner={onSetQuarterFinalWinner}
                                stage="qf"
                            />
                        ))}
                    </div>
                </div>
            )}

      {/* Semi Finals */}
      {['semiFinals', 'final', 'finished'].includes(tournamentState.currentRound) && (
        <div>
          <h2 className="text-lg lg:text-xl font-medium text-gray-900 mb-3 lg:mb-4">Півфінали</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
                        {tournamentState.semiFinals.map((match) => (
                            <MatchCard
                                key={match.id}
                                match={match}
                                title={match.name}
                                onSelectWinner={onSetSemiFinalWinner}
                                stage="sf"
                            />
                        ))}
                    </div>
                </div>
            )}

      {/* Final */}
      {['final', 'finished'].includes(tournamentState.currentRound) && (
        <div className="max-w-full sm:max-w-md mx-auto">
          <FinalCard />
        </div>
      )}
        </div>
    );
}

export default TournamentBracket;
