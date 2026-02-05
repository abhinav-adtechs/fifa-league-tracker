import React, { useState, useEffect } from 'react';
import { Player, Match, Tab } from './types';
import { Standings } from './components/Standings';
import { MatchList } from './components/MatchList';
import { PlayerManager } from './components/PlayerManager';
import { MatchForm } from './components/MatchForm';
import { Dashboard } from './components/Dashboard';
import { Login } from './components/Login';
import { LoginDetails } from './components/LoginDetails';
import { db } from './services/storage';
import { auth, Admin } from './services/auth';
import { Trophy, Users, History, PlusCircle, Gamepad2, LayoutDashboard, Lock } from 'lucide-react';

const App: React.FC = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>(Tab.STANDINGS);
  const [showMatchForm, setShowMatchForm] = useState(false);
  const [currentAdmin, setCurrentAdmin] = useState<Admin | null>(null);

  // Initialize data and auth state
  useEffect(() => {
    const loadData = async () => {
      const [loadedPlayers, loadedMatches] = await Promise.all([
        db.getPlayers(),
        db.getMatches()
      ]);
      setPlayers(loadedPlayers);
      setMatches(loadedMatches);
    };

    loadData();
    
    // Check if user is already authenticated
    if (auth.isAuthenticated()) {
      setCurrentAdmin(auth.getCurrentAdmin());
    }
  }, []);

  const handleAddPlayer = (name: string) => {
    if (!currentAdmin) {
      alert('Admin access required to add players. Please login first.');
      setActiveTab(Tab.LOGIN);
      return;
    }
    
    const newPlayer: Player = {
      id: crypto.randomUUID(),
      name,
      // Auto-generate a beautiful avatar
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}&backgroundColor=b6e3f4,c0aede,d1d4f9`,
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      gf: 0,
      ga: 0,
      gd: 0,
      points: 0,
      ppg: 0,
      form: []
    };
    const updated = [...players, newPlayer];
    setPlayers(updated);
    db.savePlayers(updated).catch(console.error);
  };

  const handleDeletePlayer = (id: string) => {
    if (!currentAdmin) {
      alert('Admin access required to delete players. Please login first.');
      setActiveTab(Tab.LOGIN);
      return;
    }
    
    const updated = players.filter(p => p.id !== id);
    setPlayers(updated);
    db.savePlayers(updated).catch(console.error);
  };

  const handleAddMatch = async (p1Id: string, p2Id: string, s1: number, s2: number) => {
    if (!currentAdmin) {
      alert('Admin access required to add matches. Please login first.');
      setShowMatchForm(false);
      setActiveTab(Tab.LOGIN);
      return;
    }
    const matchId = crypto.randomUUID();
    const newMatch: Match = {
      id: matchId,
      timestamp: Date.now(),
      player1Id: p1Id,
      player2Id: p2Id,
      score1: s1,
      score2: s2
    };

    // Update matches
    const updatedMatches = [newMatch, ...matches];
    setMatches(updatedMatches);
    db.saveMatches(updatedMatches).catch(console.error);
    
    setShowMatchForm(false);
    setActiveTab(Tab.MATCHES);

    // Update players stats
    const updatedPlayers = players.map(p => {
      if (p.id !== p1Id && p.id !== p2Id) return p;

      const isP1 = p.id === p1Id;
      const myScore = isP1 ? s1 : s2;
      const oppScore = isP1 ? s2 : s1;
      
      let result: 'W' | 'D' | 'L' = 'D';
      if (myScore > oppScore) result = 'W';
      if (myScore < oppScore) result = 'L';

      const newPlayed = p.played + 1;
      const newWins = p.wins + (result === 'W' ? 1 : 0);
      const newDraws = p.draws + (result === 'D' ? 1 : 0);
      const newLosses = p.losses + (result === 'L' ? 1 : 0);
      const newPoints = p.points + (result === 'W' ? 3 : result === 'D' ? 1 : 0);

      const newStats: Player = {
        ...p,
        played: newPlayed,
        wins: newWins,
        draws: newDraws,
        losses: newLosses,
        gf: p.gf + myScore,
        ga: p.ga + oppScore,
        gd: p.gd + (myScore - oppScore),
        points: newPoints,
        ppg: newPoints / newPlayed,
        form: [...p.form, result]
      };
      return newStats;
    });

    setPlayers(updatedPlayers);
    db.savePlayers(updatedPlayers).catch(console.error);

  };

  return (
    <div className="min-h-screen bg-fifa-dark pb-32">
      {/* Top Navbar */}
      <div className="bg-fifa-dark border-b border-fifa-surface sticky top-0 z-40 backdrop-blur-md bg-opacity-90">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="relative">
                    <div className="absolute inset-0 bg-fifa-green blur opacity-50 rounded-lg"></div>
                    <div className="relative bg-black p-1.5 rounded-lg border border-fifa-surface">
                        <Gamepad2 className="w-5 h-5 text-fifa-green" />
                    </div>
                </div>
                <h1 className="text-xl font-black tracking-tighter text-white italic">
                    FIFA <span className="text-fifa-green">LEAGUE</span>
                </h1>
            </div>
            
            <button 
                onClick={() => {
                  if (!currentAdmin) {
                    alert('Admin access required to add matches. Please login first.');
                    setActiveTab(Tab.LOGIN);
                    return;
                  }
                  setShowMatchForm(true);
                }}
                disabled={players.length < 2 || !currentAdmin}
                className="bg-fifa-green hover:bg-emerald-400 disabled:bg-gray-800 disabled:text-gray-500 text-black font-bold py-2 px-4 rounded-full flex items-center gap-2 transition-all shadow-lg shadow-green-900/20 active:scale-95"
            >
                <PlusCircle className="w-5 h-5" />
                <span className="hidden sm:inline">Result</span>
            </button>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-8">
        
        {/* Navigation */}
        <div className="grid grid-cols-5 gap-2 p-1 bg-fifa-card rounded-xl border border-fifa-surface mb-8 sticky top-20 z-30 shadow-2xl">
            {[
                { id: Tab.STANDINGS, label: 'Table', icon: Trophy },
                { id: Tab.MATCHES, label: 'Matches', icon: History },
                { id: Tab.DASHBOARD, label: 'Stats', icon: LayoutDashboard },
                { id: Tab.PLAYERS, label: 'Clubs', icon: Users },
                { id: Tab.LOGIN, label: 'Login', icon: Lock },
            ].map(tab => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-3 rounded-lg text-[10px] sm:text-sm font-bold transition-all
                        ${activeTab === tab.id 
                            ? 'bg-fifa-surface text-white shadow-md border border-white/10' 
                            : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                >
                    <tab.icon className="w-4 h-4 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                    <span className="sm:hidden">{tab.label.slice(0,3)}</span>
                </button>
            ))}
        </div>

        <div className="animate-fade-in min-h-[50vh]">
            {activeTab === Tab.STANDINGS && (
                <Standings players={players} />
            )}
            
            {activeTab === Tab.MATCHES && (
                <MatchList matches={matches} players={players} />
            )}

            {activeTab === Tab.DASHBOARD && (
                <Dashboard players={players} matches={matches} />
            )}

            {activeTab === Tab.PLAYERS && (
                <PlayerManager 
                    players={players} 
                    onAddPlayer={handleAddPlayer} 
                    onDeletePlayer={handleDeletePlayer}
                />
            )}

            {activeTab === Tab.LOGIN && (
                <div className="space-y-6">
                    <Login 
                        currentAdmin={currentAdmin}
                        onLogin={(admin) => setCurrentAdmin(admin)}
                        onLogout={() => setCurrentAdmin(null)}
                    />
                    {currentAdmin && <LoginDetails />}
                </div>
            )}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 text-center text-gray-600 text-xs border-t border-fifa-surface bg-black/20">
        <p>FIFA LEAGUE TRACKER • SEASON 1</p>
      </footer>

      {/* Modal */}
      {showMatchForm && (
        <MatchForm 
            players={players} 
            onAddMatch={handleAddMatch} 
            onCancel={() => setShowMatchForm(false)} 
        />
      )}
    </div>
  );
};

export default App;
