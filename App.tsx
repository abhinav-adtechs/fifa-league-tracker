import React, { useState, useEffect } from 'react';
import { Player, Match, Tab } from './types';
import type { StandingsView } from './types';
import { Standings } from './components/Standings';
import { getLeader, getNormalisedScoreDisplay, computePlayersWithStats } from './utils/standings';
import { MatchList } from './components/MatchList';
import { PlayerManager } from './components/PlayerManager';
import { MatchForm } from './components/MatchForm';
import { Dashboard } from './components/Dashboard';
import { MyPerformance } from './components/MyPerformance';
import { Login } from './components/Login';
import { LoginDetails } from './components/LoginDetails';
import { db } from './services/storage';
import { auth, Admin } from './services/auth';
import { Trophy, Users, History, PlusCircle, LayoutDashboard, Lock, Zap, ChevronRight, User, Palette } from 'lucide-react';

type ThemeKey = 'dark' | 'light' | 'breeze' | 'amber' | 'rose' | 'forest' | 'galaxy';

const THEME_LIST: ThemeKey[] = ['dark', 'light', 'breeze', 'amber', 'rose', 'forest', 'galaxy'];

const THEME_LABELS: Record<ThemeKey, string> = {
  dark: 'Dark', light: 'Light', breeze: 'Breeze',
  amber: 'Amber', rose: 'Rose', forest: 'Forest', galaxy: 'Galaxy',
};

const THEMES: Record<ThemeKey, Record<string, string>> = {
  dark: {
    '--bg':'#050510','--surface-0':'#050510','--surface-1':'#0a0a1a','--surface-2':'#0f0f24',
    '--surface-3':'#15152e','--surface-4':'#1c1c3a',
    '--surface-0-80':'rgba(5,5,16,0.80)','--surface-0-70':'rgba(5,5,16,0.70)',
    '--text-primary':'#EAEAF0','--text-secondary':'#8888A0','--text-muted':'#55556A',
    '--accent':'#00E676','--accent-dim':'#00C853','--accent-2':'#FFD740','--accent-2-dim':'#FFC400',
    '--accent-blue':'#448AFF','--accent-purple':'#7C4DFF','--accent-red':'#FF5252','--accent-orange':'#FF6E40',
    '--glass-bg':'rgba(255,255,255,0.03)','--glass-bg-hover':'rgba(255,255,255,0.04)',
    '--glass-bg-strong':'rgba(255,255,255,0.05)','--glass-border':'rgba(255,255,255,0.06)',
    '--glass-border-hover':'rgba(255,255,255,0.10)','--glass-light':'rgba(255,255,255,0.04)',
    '--glass-medium':'rgba(255,255,255,0.06)','--glass-strong':'rgba(255,255,255,0.08)',
    '--orb-1':'rgba(0,230,118,0.08)','--orb-2':'rgba(124,77,255,0.06)',
    '--gradient-text':'linear-gradient(135deg,#00E676,#00C853,#FFD740,#7C4DFF)',
    '--gradient-text-static':'linear-gradient(135deg,#00E676 0%,#FFD740 100%)',
    '--btn-primary-bg':'linear-gradient(135deg,#00E676,#00C853)',
    '--btn-primary-color':'#050510','--btn-primary-glow':'rgba(0,230,118,0.40)',
    '--btn-ghost-bg':'rgba(255,255,255,0.04)','--btn-ghost-border':'rgba(255,255,255,0.06)',
    '--btn-ghost-bg-hover':'rgba(255,255,255,0.08)','--btn-ghost-border-hover':'rgba(255,255,255,0.12)',
    '--gradient-border-c1':'rgba(0,230,118,0.30)','--gradient-border-c2':'rgba(124,77,255,0.30)',
    '--gradient-border-c3':'rgba(255,215,64,0.30)','--tab-active-indicator':'#00E676',
    '--input-focus-border':'rgba(0,230,118,0.40)','--input-focus-shadow':'rgba(0,230,118,0.08)',
    '--modal-overlay-bg':'rgba(5,5,16,0.85)','--modal-content-bg':'rgba(15,15,36,0.98)',
    '--selection-bg':'rgba(0,230,118,0.20)','--card-top-line':'rgba(0,230,118,0.30)',
    '--card-bg':'rgba(255,255,255,0.02)','--card-border':'rgba(255,255,255,0.05)',
    '--card-border-hover':'rgba(255,255,255,0.10)','--table-border':'rgba(255,255,255,0.04)',
    '--table-row-hover':'rgba(255,255,255,0.02)','--tooltip-bg':'rgba(15,15,36,0.95)',
    '--tooltip-border':'rgba(255,255,255,0.08)','--shimmer-mid':'rgba(255,255,255,0.04)',
    '--scrollbar-thumb':'rgba(255,255,255,0.08)','--scrollbar-thumb-hover':'rgba(255,255,255,0.14)',
    '--avatar-border':'rgba(255,255,255,0.06)','--avatar-border-hover':'rgba(0,230,118,0.30)',
  },
  light: {
    '--bg':'#F0F2F8','--surface-0':'#F0F2F8','--surface-1':'#FFFFFF','--surface-2':'#F7F8FC',
    '--surface-3':'#EDF0F8','--surface-4':'#E2E6F0',
    '--surface-0-80':'rgba(240,242,248,0.88)','--surface-0-70':'rgba(240,242,248,0.78)',
    '--text-primary':'#1A1A2E','--text-secondary':'#555577','--text-muted':'#8888AA',
    '--accent':'#059669','--accent-dim':'#047857','--accent-2':'#D97706','--accent-2-dim':'#B45309',
    '--accent-blue':'#2563EB','--accent-purple':'#7C3AED','--accent-red':'#DC2626','--accent-orange':'#EA580C',
    '--glass-bg':'rgba(255,255,255,0.72)','--glass-bg-hover':'rgba(255,255,255,0.88)',
    '--glass-bg-strong':'rgba(255,255,255,0.80)','--glass-border':'rgba(0,0,0,0.08)',
    '--glass-border-hover':'rgba(0,0,0,0.16)','--glass-light':'rgba(255,255,255,0.55)',
    '--glass-medium':'rgba(255,255,255,0.65)','--glass-strong':'rgba(255,255,255,0.75)',
    '--orb-1':'rgba(5,150,105,0.08)','--orb-2':'rgba(124,58,237,0.06)',
    '--gradient-text':'linear-gradient(135deg,#059669,#047857,#D97706,#7C3AED)',
    '--gradient-text-static':'linear-gradient(135deg,#059669 0%,#D97706 100%)',
    '--btn-primary-bg':'linear-gradient(135deg,#059669,#047857)',
    '--btn-primary-color':'#FFFFFF','--btn-primary-glow':'rgba(5,150,105,0.35)',
    '--btn-ghost-bg':'rgba(0,0,0,0.04)','--btn-ghost-border':'rgba(0,0,0,0.08)',
    '--btn-ghost-bg-hover':'rgba(0,0,0,0.07)','--btn-ghost-border-hover':'rgba(0,0,0,0.14)',
    '--gradient-border-c1':'rgba(5,150,105,0.30)','--gradient-border-c2':'rgba(124,58,237,0.30)',
    '--gradient-border-c3':'rgba(217,119,6,0.30)','--tab-active-indicator':'#059669',
    '--input-focus-border':'rgba(5,150,105,0.40)','--input-focus-shadow':'rgba(5,150,105,0.08)',
    '--modal-overlay-bg':'rgba(240,242,248,0.88)','--modal-content-bg':'rgba(255,255,255,0.98)',
    '--selection-bg':'rgba(5,150,105,0.15)','--card-top-line':'rgba(5,150,105,0.30)',
    '--card-bg':'rgba(255,255,255,0.75)','--card-border':'rgba(0,0,0,0.07)',
    '--card-border-hover':'rgba(0,0,0,0.14)','--table-border':'rgba(0,0,0,0.06)',
    '--table-row-hover':'rgba(0,0,0,0.03)','--tooltip-bg':'rgba(255,255,255,0.98)',
    '--tooltip-border':'rgba(0,0,0,0.10)','--shimmer-mid':'rgba(0,0,0,0.04)',
    '--scrollbar-thumb':'rgba(0,0,0,0.12)','--scrollbar-thumb-hover':'rgba(0,0,0,0.22)',
    '--avatar-border':'rgba(0,0,0,0.08)','--avatar-border-hover':'rgba(5,150,105,0.40)',
  },
  breeze: {
    '--bg':'#0F1929','--surface-0':'#0F1929','--surface-1':'#152238','--surface-2':'#1B2C47',
    '--surface-3':'#213556','--surface-4':'#274065',
    '--surface-0-80':'rgba(15,25,41,0.85)','--surface-0-70':'rgba(15,25,41,0.75)',
    '--text-primary':'#E8F4FF','--text-secondary':'#7AAACF','--text-muted':'#4A7090',
    '--accent':'#38BDF8','--accent-dim':'#0EA5E9','--accent-2':'#34D399','--accent-2-dim':'#10B981',
    '--accent-blue':'#60A5FA','--accent-purple':'#818CF8','--accent-red':'#F87171','--accent-orange':'#FB923C',
    '--glass-bg':'rgba(56,189,248,0.04)','--glass-bg-hover':'rgba(56,189,248,0.07)',
    '--glass-bg-strong':'rgba(56,189,248,0.06)','--glass-border':'rgba(56,189,248,0.12)',
    '--glass-border-hover':'rgba(56,189,248,0.22)','--glass-light':'rgba(56,189,248,0.04)',
    '--glass-medium':'rgba(56,189,248,0.06)','--glass-strong':'rgba(56,189,248,0.09)',
    '--orb-1':'rgba(56,189,248,0.10)','--orb-2':'rgba(52,211,153,0.07)',
    '--gradient-text':'linear-gradient(135deg,#38BDF8,#0EA5E9,#34D399,#818CF8)',
    '--gradient-text-static':'linear-gradient(135deg,#38BDF8 0%,#34D399 100%)',
    '--btn-primary-bg':'linear-gradient(135deg,#38BDF8,#0EA5E9)',
    '--btn-primary-color':'#0F1929','--btn-primary-glow':'rgba(56,189,248,0.40)',
    '--btn-ghost-bg':'rgba(56,189,248,0.05)','--btn-ghost-border':'rgba(56,189,248,0.10)',
    '--btn-ghost-bg-hover':'rgba(56,189,248,0.09)','--btn-ghost-border-hover':'rgba(56,189,248,0.18)',
    '--gradient-border-c1':'rgba(56,189,248,0.30)','--gradient-border-c2':'rgba(129,140,248,0.30)',
    '--gradient-border-c3':'rgba(52,211,153,0.30)','--tab-active-indicator':'#38BDF8',
    '--input-focus-border':'rgba(56,189,248,0.40)','--input-focus-shadow':'rgba(56,189,248,0.10)',
    '--modal-overlay-bg':'rgba(15,25,41,0.88)','--modal-content-bg':'rgba(21,34,56,0.98)',
    '--selection-bg':'rgba(56,189,248,0.20)','--card-top-line':'rgba(56,189,248,0.35)',
    '--card-bg':'rgba(56,189,248,0.03)','--card-border':'rgba(56,189,248,0.09)',
    '--card-border-hover':'rgba(56,189,248,0.18)','--table-border':'rgba(56,189,248,0.07)',
    '--table-row-hover':'rgba(56,189,248,0.03)','--tooltip-bg':'rgba(21,34,56,0.96)',
    '--tooltip-border':'rgba(56,189,248,0.12)','--shimmer-mid':'rgba(56,189,248,0.05)',
    '--scrollbar-thumb':'rgba(56,189,248,0.12)','--scrollbar-thumb-hover':'rgba(56,189,248,0.22)',
    '--avatar-border':'rgba(56,189,248,0.10)','--avatar-border-hover':'rgba(56,189,248,0.35)',
  },
  amber: {
    '--bg':'#100A00','--surface-0':'#100A00','--surface-1':'#1C1200','--surface-2':'#261900',
    '--surface-3':'#302100','--surface-4':'#3A2800',
    '--surface-0-80':'rgba(16,10,0,0.85)','--surface-0-70':'rgba(16,10,0,0.75)',
    '--text-primary':'#FFF8E7','--text-secondary':'#C8A85A','--text-muted':'#7A6030',
    '--accent':'#FBBF24','--accent-dim':'#F59E0B','--accent-2':'#F97316','--accent-2-dim':'#EA580C',
    '--accent-blue':'#60A5FA','--accent-purple':'#C084FC','--accent-red':'#F87171','--accent-orange':'#FB923C',
    '--glass-bg':'rgba(251,191,36,0.04)','--glass-bg-hover':'rgba(251,191,36,0.07)',
    '--glass-bg-strong':'rgba(251,191,36,0.06)','--glass-border':'rgba(251,191,36,0.12)',
    '--glass-border-hover':'rgba(251,191,36,0.22)','--glass-light':'rgba(251,191,36,0.04)',
    '--glass-medium':'rgba(251,191,36,0.06)','--glass-strong':'rgba(251,191,36,0.09)',
    '--orb-1':'rgba(251,191,36,0.10)','--orb-2':'rgba(249,115,22,0.07)',
    '--gradient-text':'linear-gradient(135deg,#FBBF24,#F59E0B,#F97316,#EF4444)',
    '--gradient-text-static':'linear-gradient(135deg,#FBBF24 0%,#F97316 100%)',
    '--btn-primary-bg':'linear-gradient(135deg,#FBBF24,#F59E0B)',
    '--btn-primary-color':'#100A00','--btn-primary-glow':'rgba(251,191,36,0.40)',
    '--btn-ghost-bg':'rgba(251,191,36,0.05)','--btn-ghost-border':'rgba(251,191,36,0.12)',
    '--btn-ghost-bg-hover':'rgba(251,191,36,0.09)','--btn-ghost-border-hover':'rgba(251,191,36,0.20)',
    '--gradient-border-c1':'rgba(251,191,36,0.30)','--gradient-border-c2':'rgba(192,132,252,0.30)',
    '--gradient-border-c3':'rgba(249,115,22,0.30)','--tab-active-indicator':'#FBBF24',
    '--input-focus-border':'rgba(251,191,36,0.40)','--input-focus-shadow':'rgba(251,191,36,0.10)',
    '--modal-overlay-bg':'rgba(16,10,0,0.88)','--modal-content-bg':'rgba(28,18,0,0.98)',
    '--selection-bg':'rgba(251,191,36,0.20)','--card-top-line':'rgba(251,191,36,0.35)',
    '--card-bg':'rgba(251,191,36,0.03)','--card-border':'rgba(251,191,36,0.09)',
    '--card-border-hover':'rgba(251,191,36,0.18)','--table-border':'rgba(251,191,36,0.07)',
    '--table-row-hover':'rgba(251,191,36,0.03)','--tooltip-bg':'rgba(28,18,0,0.96)',
    '--tooltip-border':'rgba(251,191,36,0.12)','--shimmer-mid':'rgba(251,191,36,0.05)',
    '--scrollbar-thumb':'rgba(251,191,36,0.12)','--scrollbar-thumb-hover':'rgba(251,191,36,0.22)',
    '--avatar-border':'rgba(251,191,36,0.10)','--avatar-border-hover':'rgba(251,191,36,0.35)',
  },
  rose: {
    '--bg':'#130812','--surface-0':'#130812','--surface-1':'#1F0E1D','--surface-2':'#2B1428',
    '--surface-3':'#371A33','--surface-4':'#43203E',
    '--surface-0-80':'rgba(19,8,18,0.85)','--surface-0-70':'rgba(19,8,18,0.75)',
    '--text-primary':'#FFE8F5','--text-secondary':'#C077A5','--text-muted':'#7A4568',
    '--accent':'#F472B6','--accent-dim':'#EC4899','--accent-2':'#A78BFA','--accent-2-dim':'#8B5CF6',
    '--accent-blue':'#60A5FA','--accent-purple':'#C084FC','--accent-red':'#F87171','--accent-orange':'#FB923C',
    '--glass-bg':'rgba(244,114,182,0.04)','--glass-bg-hover':'rgba(244,114,182,0.07)',
    '--glass-bg-strong':'rgba(244,114,182,0.06)','--glass-border':'rgba(244,114,182,0.12)',
    '--glass-border-hover':'rgba(244,114,182,0.22)','--glass-light':'rgba(244,114,182,0.04)',
    '--glass-medium':'rgba(244,114,182,0.06)','--glass-strong':'rgba(244,114,182,0.09)',
    '--orb-1':'rgba(244,114,182,0.10)','--orb-2':'rgba(167,139,250,0.07)',
    '--gradient-text':'linear-gradient(135deg,#F472B6,#EC4899,#A78BFA,#60A5FA)',
    '--gradient-text-static':'linear-gradient(135deg,#F472B6 0%,#A78BFA 100%)',
    '--btn-primary-bg':'linear-gradient(135deg,#F472B6,#EC4899)',
    '--btn-primary-color':'#130812','--btn-primary-glow':'rgba(244,114,182,0.40)',
    '--btn-ghost-bg':'rgba(244,114,182,0.05)','--btn-ghost-border':'rgba(244,114,182,0.12)',
    '--btn-ghost-bg-hover':'rgba(244,114,182,0.09)','--btn-ghost-border-hover':'rgba(244,114,182,0.20)',
    '--gradient-border-c1':'rgba(244,114,182,0.30)','--gradient-border-c2':'rgba(167,139,250,0.30)',
    '--gradient-border-c3':'rgba(96,165,250,0.30)','--tab-active-indicator':'#F472B6',
    '--input-focus-border':'rgba(244,114,182,0.40)','--input-focus-shadow':'rgba(244,114,182,0.10)',
    '--modal-overlay-bg':'rgba(19,8,18,0.88)','--modal-content-bg':'rgba(31,14,29,0.98)',
    '--selection-bg':'rgba(244,114,182,0.20)','--card-top-line':'rgba(244,114,182,0.35)',
    '--card-bg':'rgba(244,114,182,0.03)','--card-border':'rgba(244,114,182,0.09)',
    '--card-border-hover':'rgba(244,114,182,0.18)','--table-border':'rgba(244,114,182,0.07)',
    '--table-row-hover':'rgba(244,114,182,0.03)','--tooltip-bg':'rgba(31,14,29,0.96)',
    '--tooltip-border':'rgba(244,114,182,0.12)','--shimmer-mid':'rgba(244,114,182,0.05)',
    '--scrollbar-thumb':'rgba(244,114,182,0.12)','--scrollbar-thumb-hover':'rgba(244,114,182,0.22)',
    '--avatar-border':'rgba(244,114,182,0.10)','--avatar-border-hover':'rgba(244,114,182,0.40)',
  },
  forest: {
    '--bg':'#011208','--surface-0':'#011208','--surface-1':'#031D0E','--surface-2':'#052814',
    '--surface-3':'#07331A','--surface-4':'#0A3F21',
    '--surface-0-80':'rgba(1,18,8,0.85)','--surface-0-70':'rgba(1,18,8,0.75)',
    '--text-primary':'#E8F5EE','--text-secondary':'#6AAA88','--text-muted':'#3A6A50',
    '--accent':'#4ADE80','--accent-dim':'#22C55E','--accent-2':'#86EFAC','--accent-2-dim':'#4ADE80',
    '--accent-blue':'#60A5FA','--accent-purple':'#A78BFA','--accent-red':'#F87171','--accent-orange':'#FB923C',
    '--glass-bg':'rgba(74,222,128,0.04)','--glass-bg-hover':'rgba(74,222,128,0.07)',
    '--glass-bg-strong':'rgba(74,222,128,0.06)','--glass-border':'rgba(74,222,128,0.12)',
    '--glass-border-hover':'rgba(74,222,128,0.22)','--glass-light':'rgba(74,222,128,0.04)',
    '--glass-medium':'rgba(74,222,128,0.06)','--glass-strong':'rgba(74,222,128,0.09)',
    '--orb-1':'rgba(74,222,128,0.10)','--orb-2':'rgba(134,239,172,0.07)',
    '--gradient-text':'linear-gradient(135deg,#4ADE80,#22C55E,#86EFAC,#34D399)',
    '--gradient-text-static':'linear-gradient(135deg,#4ADE80 0%,#86EFAC 100%)',
    '--btn-primary-bg':'linear-gradient(135deg,#4ADE80,#22C55E)',
    '--btn-primary-color':'#011208','--btn-primary-glow':'rgba(74,222,128,0.40)',
    '--btn-ghost-bg':'rgba(74,222,128,0.05)','--btn-ghost-border':'rgba(74,222,128,0.10)',
    '--btn-ghost-bg-hover':'rgba(74,222,128,0.09)','--btn-ghost-border-hover':'rgba(74,222,128,0.18)',
    '--gradient-border-c1':'rgba(74,222,128,0.30)','--gradient-border-c2':'rgba(134,239,172,0.30)',
    '--gradient-border-c3':'rgba(52,211,153,0.30)','--tab-active-indicator':'#4ADE80',
    '--input-focus-border':'rgba(74,222,128,0.40)','--input-focus-shadow':'rgba(74,222,128,0.10)',
    '--modal-overlay-bg':'rgba(1,18,8,0.88)','--modal-content-bg':'rgba(3,29,14,0.98)',
    '--selection-bg':'rgba(74,222,128,0.20)','--card-top-line':'rgba(74,222,128,0.35)',
    '--card-bg':'rgba(74,222,128,0.03)','--card-border':'rgba(74,222,128,0.09)',
    '--card-border-hover':'rgba(74,222,128,0.18)','--table-border':'rgba(74,222,128,0.07)',
    '--table-row-hover':'rgba(74,222,128,0.03)','--tooltip-bg':'rgba(3,29,14,0.96)',
    '--tooltip-border':'rgba(74,222,128,0.12)','--shimmer-mid':'rgba(74,222,128,0.05)',
    '--scrollbar-thumb':'rgba(74,222,128,0.12)','--scrollbar-thumb-hover':'rgba(74,222,128,0.22)',
    '--avatar-border':'rgba(74,222,128,0.10)','--avatar-border-hover':'rgba(74,222,128,0.40)',
  },
  galaxy: {
    '--bg':'#0D0015','--surface-0':'#0D0015','--surface-1':'#150022','--surface-2':'#1C002E',
    '--surface-3':'#23003B','--surface-4':'#2A0047',
    '--surface-0-80':'rgba(13,0,21,0.85)','--surface-0-70':'rgba(13,0,21,0.75)',
    '--text-primary':'#EDE8FF','--text-secondary':'#9977CC','--text-muted':'#5A3A88',
    '--accent':'#C084FC','--accent-dim':'#A855F7','--accent-2':'#818CF8','--accent-2-dim':'#6366F1',
    '--accent-blue':'#60A5FA','--accent-purple':'#E879F9','--accent-red':'#F87171','--accent-orange':'#FB923C',
    '--glass-bg':'rgba(192,132,252,0.04)','--glass-bg-hover':'rgba(192,132,252,0.07)',
    '--glass-bg-strong':'rgba(192,132,252,0.06)','--glass-border':'rgba(192,132,252,0.12)',
    '--glass-border-hover':'rgba(192,132,252,0.22)','--glass-light':'rgba(192,132,252,0.04)',
    '--glass-medium':'rgba(192,132,252,0.06)','--glass-strong':'rgba(192,132,252,0.09)',
    '--orb-1':'rgba(192,132,252,0.10)','--orb-2':'rgba(129,140,248,0.07)',
    '--gradient-text':'linear-gradient(135deg,#C084FC,#A855F7,#818CF8,#60A5FA)',
    '--gradient-text-static':'linear-gradient(135deg,#C084FC 0%,#818CF8 100%)',
    '--btn-primary-bg':'linear-gradient(135deg,#C084FC,#A855F7)',
    '--btn-primary-color':'#0D0015','--btn-primary-glow':'rgba(192,132,252,0.40)',
    '--btn-ghost-bg':'rgba(192,132,252,0.05)','--btn-ghost-border':'rgba(192,132,252,0.10)',
    '--btn-ghost-bg-hover':'rgba(192,132,252,0.09)','--btn-ghost-border-hover':'rgba(192,132,252,0.18)',
    '--gradient-border-c1':'rgba(192,132,252,0.30)','--gradient-border-c2':'rgba(129,140,248,0.30)',
    '--gradient-border-c3':'rgba(232,121,249,0.30)','--tab-active-indicator':'#C084FC',
    '--input-focus-border':'rgba(192,132,252,0.40)','--input-focus-shadow':'rgba(192,132,252,0.10)',
    '--modal-overlay-bg':'rgba(13,0,21,0.88)','--modal-content-bg':'rgba(21,0,34,0.98)',
    '--selection-bg':'rgba(192,132,252,0.20)','--card-top-line':'rgba(192,132,252,0.35)',
    '--card-bg':'rgba(192,132,252,0.03)','--card-border':'rgba(192,132,252,0.09)',
    '--card-border-hover':'rgba(192,132,252,0.18)','--table-border':'rgba(192,132,252,0.07)',
    '--table-row-hover':'rgba(192,132,252,0.03)','--tooltip-bg':'rgba(21,0,34,0.96)',
    '--tooltip-border':'rgba(192,132,252,0.12)','--shimmer-mid':'rgba(192,132,252,0.05)',
    '--scrollbar-thumb':'rgba(192,132,252,0.12)','--scrollbar-thumb-hover':'rgba(192,132,252,0.22)',
    '--avatar-border':'rgba(192,132,252,0.10)','--avatar-border-hover':'rgba(192,132,252,0.40)',
  },
};

function applyTheme(key: ThemeKey) {
  const vars = THEMES[key];
  let el = document.getElementById('runtime-theme') as HTMLStyleElement | null;
  if (!el) {
    el = document.createElement('style');
    el.id = 'runtime-theme';
    document.head.appendChild(el);
  }
  el.textContent = `:root{${Object.entries(vars).map(([k,v])=>`${k}:${v}`).join(';')}}`;
  document.body.style.background = vars['--bg'];
  document.body.style.color = vars['--text-primary'];
}

const App: React.FC = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>(Tab.STANDINGS);
  const [standingsView, setStandingsView] = useState<StandingsView>('NORMALISED');
  const [showMatchForm, setShowMatchForm] = useState(false);
  const [currentAdmin, setCurrentAdmin] = useState<Admin | null>(null);
  const [theme, setTheme] = useState<ThemeKey>(() => {
    return (localStorage.getItem('app-theme') as ThemeKey) || 'dark';
  });

  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem('app-theme', theme);
  }, [theme]);

  const cycleTheme = () => {
    const idx = THEME_LIST.indexOf(theme);
    setTheme(THEME_LIST[(idx + 1) % THEME_LIST.length]);
  };

  const getPlayerAvatar = (name: string): string => {
    const nameLower = name.toLowerCase().trim();
    const avatarMap: Record<string, string> = {
      'abhinav': 'https://img.a.transfermarkt.technology/portrait/header/433179-1672832000.jpg?lm=1',
      'karan': 'https://img.a.transfermarkt.technology/portrait/header/342229-1672832000.jpg?lm=1',
      'manan': 'https://img.a.transfermarkt.technology/portrait/header/38253-1672832000.jpg?lm=1',
      'sagar': 'https://img.a.transfermarkt.technology/portrait/header/418560-1672832000.jpg?lm=1',
      'ayush': 'https://img.a.transfermarkt.technology/portrait/header/636999-1672832000.jpg?lm=1'
    };
    if (avatarMap[nameLower]) return avatarMap[nameLower];
    for (const [key, value] of Object.entries(avatarMap)) {
      if (nameLower.includes(key) || key.includes(nameLower)) return value;
    }
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}&backgroundColor=fae100,6b46c1,1a1625`;
  };

  useEffect(() => {
    const loadData = async () => {
      const [loadedPlayers, loadedMatches] = await Promise.all([
        db.getPlayers(),
        db.getMatches()
      ]);
      const updatedPlayers = loadedPlayers.map(player => ({
        ...player,
        avatarUrl: getPlayerAvatar(player.name)
      }));
      const avatarsChanged = updatedPlayers.some((p, i) => p.avatarUrl !== loadedPlayers[i]?.avatarUrl);
      if (avatarsChanged && updatedPlayers.length > 0) {
        db.savePlayers(updatedPlayers).catch(console.error);
      }
      setPlayers(updatedPlayers);
      setMatches(loadedMatches);
    };
    loadData();
    auth.isAuthenticated().then((ok) => {
      if (ok) auth.getCurrentAdmin().then(setCurrentAdmin);
    });
  }, []);

  const handleAddPlayer = (name: string) => {
    if (!currentAdmin) {
      alert('Admin access required. Please login first.');
      setActiveTab(Tab.LOGIN);
      return;
    }
    const newPlayer: Player = {
      id: crypto.randomUUID(),
      name,
      avatarUrl: getPlayerAvatar(name),
      played: 0, wins: 0, draws: 0, losses: 0,
      gf: 0, ga: 0, gd: 0, points: 0, ppg: 0, form: []
    };
    const updated = [...players, newPlayer];
    setPlayers(updated);
    db.savePlayers(updated).catch(console.error);
  };

  const handleDeletePlayer = (id: string) => {
    if (!currentAdmin) {
      alert('Admin access required. Please login first.');
      setActiveTab(Tab.LOGIN);
      return;
    }
    const updated = players.filter(p => p.id !== id);
    setPlayers(updated);
    db.savePlayers(updated).catch(console.error);
  };

  const handleAddMatch = async (p1Id: string, p2Id: string, s1: number, s2: number) => {
    if (!currentAdmin) {
      alert('Admin access required. Please login first.');
      setShowMatchForm(false);
      setActiveTab(Tab.LOGIN);
      return;
    }
    const newMatch: Match = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      player1Id: p1Id,
      player2Id: p2Id,
      score1: s1,
      score2: s2
    };
    const updatedMatches = [newMatch, ...matches];
    setMatches(updatedMatches);
    db.saveMatches(updatedMatches).catch(console.error);
    setShowMatchForm(false);
    setActiveTab(Tab.MATCHES);
  };

  const tabs = [
    { id: Tab.STANDINGS, label: 'Table', icon: Trophy },
    { id: Tab.MATCHES, label: 'Matches', icon: History },
    { id: Tab.MY_PERFORMANCE, label: 'My Performance', icon: User },
    { id: Tab.DASHBOARD, label: 'Stats', icon: LayoutDashboard },
    { id: Tab.PLAYERS, label: 'Squad', icon: Users },
    { id: Tab.LOGIN, label: 'Admin', icon: Lock },
  ];

  // Top player for the hero section — follows active standings view (Norm / PPG / Table)
  // Always derive live stats from raw matches instead of relying on stored stats
  const playersWithStats = computePlayersWithStats(players, matches);

  const topPlayer = getLeader(playersWithStats, standingsView);

  return (
    <div className="relative z-10 min-h-screen">
      {/* ===== TOP NAVIGATION BAR ===== */}
      <header className="sticky top-0 z-50">
        <div className="absolute inset-0 bg-surface-0/80 backdrop-blur-xl border-b border-glass-border"></div>
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6">
          <div className="h-14 sm:h-16 flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-accent-green/20 to-accent-gold/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-glass-medium border border-glass-border flex items-center justify-center overflow-hidden">
                  <img src="/fc26-logo.svg" alt="FC26" className="w-6 h-6 sm:w-7 sm:h-7" />
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm sm:text-base font-bold text-text-primary tracking-tight">FIFA</span>
                <span className="text-sm sm:text-base font-bold gradient-text-static tracking-tight">LEAGUE</span>
              </div>
              <span className="hidden sm:inline-flex items-center text-[10px] font-mono font-medium text-text-muted bg-glass-light border border-glass-border rounded-md px-1.5 py-0.5">
                S1
              </span>
            </div>

            {/* Right controls */}
            <div className="flex items-center gap-2">
              {/* Theme Randomizer */}
              <button
                onClick={cycleTheme}
                title={`Theme: ${THEME_LABELS[theme]} — click to cycle`}
                className="relative w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-200 group"
                style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}
              >
                <Palette className="w-3.5 h-3.5 transition-transform duration-300 group-hover:rotate-12" style={{ color: 'var(--accent)' }} />
                <span
                  className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] font-mono font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {THEME_LABELS[theme]}
                </span>
              </button>

              {/* Record Result Button */}
              <button
                onClick={() => {
                  if (!currentAdmin) {
                    alert('Admin access required. Please login first.');
                    setActiveTab(Tab.LOGIN);
                    return;
                  }
                  setShowMatchForm(true);
                }}
                disabled={players.length < 2 || !currentAdmin}
                className="btn-primary flex items-center gap-2 text-xs sm:text-sm disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:transform-none disabled:hover:shadow-none"
              >
                <PlusCircle className="w-4 h-4" />
                <span className="hidden sm:inline">Record Result</span>
                <span className="sm:hidden">Result</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ===== HERO SECTION ===== */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-surface-0 via-surface-1/50 to-surface-0"></div>
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="animate-fade-up">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-accent-green animate-glow-pulse"></div>
                <span className="text-[11px] font-mono font-medium text-accent-green uppercase tracking-widest">Live Season</span>
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-text-primary leading-[1.1]">
                FC26 League<br />
                <span className="gradient-text">Tracker</span>
              </h1>
              <p className="mt-3 text-sm text-text-secondary max-w-md leading-relaxed">
                Track matches, standings, and stats for your FIFA league. 
                {matches.length > 0 && ` ${matches.length} matches played so far this season.`}
              </p>
            </div>

            {/* Leader Card */}
            {topPlayer && (
              <div className="animate-stagger-2 glass-card gradient-border p-4 sm:p-5 min-w-[200px]">
                <div className="flex items-center gap-2 mb-3">
                  <Trophy className="w-3.5 h-3.5 text-accent-gold" />
                  <span className="text-[10px] font-semibold text-accent-gold uppercase tracking-widest">League Leader</span>
                </div>
                <div className="flex items-center gap-3">
                  <img
                    src={topPlayer.avatarUrl}
                    alt={topPlayer.name}
                    className="avatar w-10 h-10 sm:w-12 sm:h-12"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${topPlayer.name}`;
                    }}
                  />
                  <div>
                    <div className="font-bold text-text-primary text-base sm:text-lg leading-tight">{topPlayer.name}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xl sm:text-2xl font-extrabold gradient-text-static font-mono">
                        {standingsView === 'NORMALISED'
                          ? getNormalisedScoreDisplay(topPlayer)
                          : standingsView === 'PPG'
                            ? (topPlayer.played > 0 ? (topPlayer.points / topPlayer.played).toFixed(2) : '0.00')
                            : topPlayer.points}
                      </span>
                      <span className="text-[10px] text-text-muted font-medium">
                        {standingsView === 'NORMALISED' ? 'NORM' : standingsView === 'PPG' ? 'PPG' : 'PTS'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ===== TAB NAVIGATION ===== */}
      <nav className="sticky top-14 sm:top-16 z-40">
        <div className="absolute inset-0 bg-surface-0/70 backdrop-blur-xl"></div>
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-1 py-2 overflow-x-auto scrollbar-none border-b border-glass-border">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`tab-item ${activeTab === tab.id ? 'active' : ''}`}
              >
                <tab.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* ===== MAIN CONTENT ===== */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <div className="animate-fade-up min-h-[50vh]">
          {activeTab === Tab.STANDINGS && (
            <Standings
              players={playersWithStats}
              matches={matches}
              view={standingsView}
              onViewChange={setStandingsView}
            />
          )}
          {activeTab === Tab.MATCHES && <MatchList matches={matches} players={playersWithStats} />}
          {activeTab === Tab.MY_PERFORMANCE && (
            <MyPerformance
              players={playersWithStats}
              matches={matches}
              currentAdmin={currentAdmin}
            />
          )}
          {activeTab === Tab.DASHBOARD && <Dashboard players={playersWithStats} matches={matches} />}
          {activeTab === Tab.PLAYERS && (
            <PlayerManager players={playersWithStats} onAddPlayer={handleAddPlayer} onDeletePlayer={handleDeletePlayer} />
          )}
          {activeTab === Tab.LOGIN && (
            <div className="space-y-6">
              <Login currentAdmin={currentAdmin} onLogin={(admin) => setCurrentAdmin(admin)} onLogout={() => setCurrentAdmin(null)} />
              {currentAdmin && <LoginDetails />}
            </div>
          )}
        </div>
      </main>

      {/* ===== FOOTER ===== */}
      <footer className="relative border-t border-glass-border mt-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Zap className="w-4 h-4 text-text-muted" />
              <span className="text-xs font-medium text-text-muted">FIFA League Tracker</span>
              <span className="text-text-muted">·</span>
              <span className="text-xs text-text-muted">FC26 Season 1</span>
            </div>
            <div className="text-[11px] text-text-muted font-medium">
              Powered by <span className="text-text-secondary">Superjoin</span>
            </div>
          </div>
        </div>
      </footer>

      {/* ===== MATCH FORM MODAL ===== */}
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
