import { useState, useEffect } from 'react';
import io from 'socket.io-client';
import AuthScreen from './components/AuthScreen';
import TournamentBracket from './components/TournamentBracket';
import BettingPanel from './components/BettingPanel';
import Leaderboard from './components/Leaderboard';

const socket = io('http://localhost:3000');

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [bottles, setBottles] = useState(20);
  const [tournamentState, setTournamentState] = useState(null);
  const [activeBets, setActiveBets] = useState({});
  const [usersList, setUsersList] = useState([]);

  useEffect(() => {
    socket.on('tournament-state', (state) => {
      setTournamentState(state);
    });

    socket.on('active-bets', (bets) => {
      setActiveBets(bets);
    });

    socket.on('users-list', (users) => {
      setUsersList(users);
    });

    socket.on('update-bottles', (newBottles) => {
      setBottles(newBottles);
    });

    return () => {
      socket.off('tournament-state');
      socket.off('active-bets');
      socket.off('users-list');
      socket.off('update-bottles');
    };
  }, []);

  const handleAuth = (user, admin, userBottles) => {
    setUsername(user);
    setIsAdmin(admin);
    setBottles(userBottles);
    setIsAuthenticated(true);
  };

  const handleSetGroupWinner = (group, winner) => {
    socket.emit('set-group-winner', { group, winner });
  };

  const handleSetQuarterFinalWinner = (matchId, winner) => {
    socket.emit('set-quarterfinal-winner', { matchId, winner });
  };

  const handleSetSemiFinalWinner = (matchId, winner) => {
    socket.emit('set-semifinal-winner', { matchId, winner });
  };

  const handleSetFinalWinner = (winner) => {
    socket.emit('set-final-winner', { winner });
  };

  const handlePlaceBet = (player, amount) => {
    socket.emit('place-bet', { player, amount });
  };

  const handleRemoveBet = (player) => {
    socket.emit('remove-bet', { player });
  };

  if (!isAuthenticated) {
    return <AuthScreen socket={socket} onAuth={handleAuth} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-normal text-gray-900">
                Турнір {isAdmin && <span className="text-sm text-blue-600 ml-2">Адміністратор</span>}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {username} {!isAdmin && `• ${bottles} 🍺`}
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Учасників: {usersList.length}</div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Tournament Bracket */}
          <div className="lg:col-span-3">
            <TournamentBracket
              tournamentState={tournamentState}
              isAdmin={isAdmin}
              onSetGroupWinner={handleSetGroupWinner}
              onSetQuarterFinalWinner={handleSetQuarterFinalWinner}
              onSetSemiFinalWinner={handleSetSemiFinalWinner}
              onSetFinalWinner={handleSetFinalWinner}
            />
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Betting Panel */}
            {!isAdmin && (
              <BettingPanel
                tournamentState={tournamentState}
                activeBets={activeBets}
                username={username}
                bottles={bottles}
                onPlaceBet={handlePlaceBet}
                onRemoveBet={handleRemoveBet}
              />
            )}

            {/* Leaderboard */}
            <Leaderboard usersList={usersList} currentUsername={username} />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
