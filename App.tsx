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

  // Player avatar mapping - FC26 themed with real player images
  // Using reliable image sources with proper player IDs
  const getPlayerAvatar = (name: string): string => {
    const nameLower = name.toLowerCase().trim();
    
    // Player image mapping - using multiple reliable sources
    const avatarMap: Record<string, string> = {
      // Abhinav - Rayane Cherki (Lyon/PSG)
      'abhinav': 'https://img.a.transfermarkt.technology/portrait/header/433179-1672832000.jpg?lm=1',
      // Karan - Kylian Mbappé (PSG)
      'karan': 'https://img.a.transfermarkt.technology/portrait/header/342229-1672832000.jpg?lm=1',
      // Manan - Robert Lewandowski (Barcelona)
      'manan': 'https://img.a.transfermarkt.technology/portrait/header/38253-1672832000.jpg?lm=1',
      // Sagar - Erling Haaland (Manchester City)
      'sagar': 'https://img.a.transfermarkt.technology/portrait/header/418560-1672832000.jpg?lm=1',
      // Ayush - Lamine Yamal (Barcelona)
      'ayush': 'https://img.a.transfermarkt.technology/portrait/header/636999-1672832000.jpg?lm=1'
    };
    
    // Try exact match first
    if (avatarMap[nameLower]) {
      return avatarMap[nameLower];
    }
    
    // Try partial match (handles variations like "Abhinav Das" matching "abhinav")
    for (const [key, value] of Object.entries(avatarMap)) {
      if (nameLower.includes(key) || key.includes(nameLower)) {
        return value;
      }
    }
    
    // Fallback to themed dicebear with purple/yellow theme
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}&backgroundColor=fae100,6b46c1,1a1625`;
  };

  // Initialize data and auth state
  useEffect(() => {
    const loadData = async () => {
      const [loadedPlayers, loadedMatches] = await Promise.all([
        db.getPlayers(),
        db.getMatches()
      ]);
      
      // Update player avatars to use new FC26 player images
      const updatedPlayers = loadedPlayers.map(player => ({
        ...player,
        avatarUrl: getPlayerAvatar(player.name)
      }));
      
      // Only save if avatars changed
      const avatarsChanged = updatedPlayers.some((p, i) => p.avatarUrl !== loadedPlayers[i]?.avatarUrl);
      if (avatarsChanged && updatedPlayers.length > 0) {
        db.savePlayers(updatedPlayers).catch(console.error);
      }
      
      setPlayers(updatedPlayers);
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
      avatarUrl: getPlayerAvatar(name),
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
      <div className="bg-fifa-dark/95 border-b border-fifa-surface sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 h-16 sm:h-20 flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
                {/* FC26 Logo */}
                <div className="relative">
                    <div className="absolute inset-0 bg-fifa-accent blur opacity-30 rounded-lg"></div>
                    <div className="relative bg-fifa-card p-1 sm:p-1.5 rounded-lg border border-fifa-surface card-shadow">
                        <img 
                            src="https://upload.wikimedia.org/wikipedia/en/thumb/0/05/FC_Barcelona_%28crest%29.svg/120px-FC_Barcelona_%28crest%29.svg.png" 
                            alt="FC26" 
                            className="w-6 h-6 sm:w-8 sm:h-8 object-contain"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              target.parentElement!.innerHTML = '<div class="w-6 h-6 sm:w-8 sm:h-8 bg-fc26-primary rounded flex items-center justify-center text-white font-bold text-xs">FC26</div>';
                            }}
                        />
                    </div>
                </div>
                {/* Superjoin Logo */}
                <div className="hidden sm:block relative">
                    <div className="relative bg-fifa-card p-1 rounded-lg border border-fifa-surface card-shadow">
                        <span className="text-[10px] font-black text-fifa-accent px-1">SUPERJOIN</span>
                    </div>
                </div>
                <h1 className="text-base sm:text-xl font-black tracking-tighter">
                    <span className="text-white">FIFA</span> <span className="text-fifa-accent">LEAGUE</span>
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
                className="bg-fifa-accent hover:opacity-90 disabled:bg-fifa-surface disabled:text-fifa-muted text-black font-bold py-2 px-3 sm:px-4 rounded-full flex items-center gap-1 sm:gap-2 transition-all shadow-lg shadow-yellow-900/30 active:scale-95 text-xs sm:text-sm"
            >
                <PlusCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Result</span>
            </button>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        
        {/* Navigation - Tab Style */}
        <div className="bg-fifa-card rounded-xl border border-fifa-surface mb-4 sm:mb-8 sticky top-16 sm:top-20 z-30 card-shadow overflow-hidden">
          <div className="flex items-center justify-between sm:justify-start gap-2 sm:gap-4 px-2 sm:px-4 py-2 sm:py-3 overflow-x-auto">
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
                    className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-bold transition-all relative whitespace-nowrap
                        ${activeTab === tab.id 
                            ? 'text-white' 
                            : 'text-fifa-muted hover:text-white'}`}
                >
                    <tab.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span>{tab.label}</span>
                    {activeTab === tab.id && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-fifa-accent"></div>
                    )}
                </button>
            ))}
          </div>
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
      <footer className="py-6 sm:py-8 text-center text-fifa-muted text-xs border-t border-fifa-surface bg-fifa-card/50">
        <div className="flex items-center justify-center gap-2 sm:gap-4 mb-2">
          <img 
            src="https://upload.wikimedia.org/wikipedia/en/thumb/0/05/FC_Barcelona_%28crest%29.svg/120px-FC_Barcelona_%28crest%29.svg.png" 
            alt="FC26" 
            className="h-4 sm:h-6 opacity-60"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
          <img 
            src="https://logos-world.net/wp-content/uploads/2021/02/FIFA-Logo.png" 
            alt="FIFA" 
            className="h-3 sm:h-5 opacity-60"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
        </div>
        <p className="text-[10px] sm:text-xs font-semibold">FIFA LEAGUE TRACKER • FC26 • SEASON 1</p>
        <p className="text-[9px] sm:text-[10px] text-fifa-muted/70 mt-1">Powered by Superjoin</p>
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
