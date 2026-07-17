import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BookOpen, Flame, Award, Shield, User, LogIn, LogOut, CheckCircle2,
  Sparkles, AlertCircle, RefreshCw, Zap, Star, ChevronRight, ChevronLeft,
  Share2, ShieldCheck, Play, HelpCircle, Bell, Plus, Info, Check, CloudLightning, RefreshCcw
} from 'lucide-react';

import { UserProfile, Flashcard, Badge, Milestone, LeaderboardEntry, DailyLog, SyncData } from './types';
import { STATIC_FLASHCARDS, BADGES, MILESTONES } from './data/personalityContent';

import AnalyticsCharts from './components/AnalyticsCharts';
import NotificationSettings from './components/NotificationSettings';
import Leaderboard from './components/Leaderboard';
import AICoach from './components/AICoach';

// Initial local fallback profile
const INITIAL_PROFILE: UserProfile = {
  username: 'GrowthLearner',
  email: 'learner@personality.com',
  currentStreak: 0,
  highestStreak: 0,
  lastActiveDate: null,
  level: 1,
  xp: 0,
  subscription: 'free',
  badges: [],
  milestones: [],
  notificationsEnabled: false,
  notificationTime: '09:00'
};

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'Mindset':
      return { bg: 'bg-[#FF6321] text-white', labelBg: 'bg-white text-[#1A1A1A]' };
    case 'EQ':
      return { bg: 'bg-[#FF63B1] text-white', labelBg: 'bg-white text-[#1A1A1A]' };
    case 'Habits':
      return { bg: 'bg-[#2D31FA] text-white', labelBg: 'bg-white text-[#1A1A1A]' };
    case 'Focus':
      return { bg: 'bg-[#00FF00] text-[#1A1A1A]', labelBg: 'bg-white text-[#1A1A1A]' };
    case 'Leadership':
      return { bg: 'bg-[#FFB347] text-[#1A1A1A]', labelBg: 'bg-white text-[#1A1A1A]' };
    case 'Communication':
      return { bg: 'bg-[#FF63B1] text-white', labelBg: 'bg-white text-[#1A1A1A]' };
    default:
      return { bg: 'bg-[#FF63B1] text-white', labelBg: 'bg-white text-[#1A1A1A]' };
  }
};

export default function App() {
  // Application states
  const [profile, setProfile] = useState<UserProfile>(INITIAL_PROFILE);
  const [flashcards, setFlashcards] = useState<Flashcard[]>(STATIC_FLASHCARDS);
  const [customCards, setCustomCards] = useState<Flashcard[]>([]);
  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>([]);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [readHistory, setReadHistory] = useState<Record<string, string>>({}); // cardId -> lastReadDate
  
  // UX / UI control states
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [currentCardIdx, setCurrentCardIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [offlineMode, setOfflineMode] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'pending' | 'offline'>('synced');
  
  // Auth Form states
  const [authEmail, setAuthEmail] = useState('');
  const [authUsername, setAuthUsername] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Leaderboard data
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  // AI Card generator state
  const [aiTopic, setAiTopic] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiError, setAiError] = useState('');

  // Celebration notifications
  const [unlockedBadgeToast, setUnlockedBadgeToast] = useState<Badge | null>(null);
  const [systemNotification, setSystemNotification] = useState<string | null>(null);

  // Filtered flashcard helper
  const getFilteredCards = () => {
    const all = [...flashcards, ...customCards];
    if (selectedCategory === 'All') return all;
    return all.filter(c => c.category === selectedCategory);
  };

  const filteredCards = getFilteredCards();
  const currentCard = filteredCards[currentCardIdx] || null;

  // 1. Initial mounting and loading cached localStorage values
  useEffect(() => {
    const cachedProfile = localStorage.getItem('pdb_profile');
    const cachedLogs = localStorage.getItem('pdb_logs');
    const cachedRatings = localStorage.getItem('pdb_ratings');
    const cachedHistory = localStorage.getItem('pdb_history');
    const cachedCustom = localStorage.getItem('pdb_custom_cards');
    const cachedEmail = localStorage.getItem('pdb_auth_email');

    if (cachedProfile) setProfile(JSON.parse(cachedProfile));
    if (cachedLogs) setDailyLogs(JSON.parse(cachedLogs));
    if (cachedRatings) setRatings(JSON.parse(cachedRatings));
    if (cachedHistory) setReadHistory(JSON.parse(cachedHistory));
    if (cachedCustom) setCustomCards(JSON.parse(cachedCustom));
    if (cachedEmail) {
      setAuthEmail(cachedEmail);
      setIsLoggedIn(true);
    }

    // Load initial leaderboard
    fetchLeaderboard();

    // Setup network status checking
    const handleOnline = () => {
      setOfflineMode(false);
      setSyncStatus('pending');
    };
    const handleOffline = () => {
      setOfflineMode(true);
      setSyncStatus('offline');
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    if (!navigator.onLine) {
      setOfflineMode(true);
      setSyncStatus('offline');
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Sync state helper to trigger server sync whenever offline state toggles or state variables change
  useEffect(() => {
    if (isLoggedIn && !offlineMode) {
      const delaySync = setTimeout(() => {
        syncWithServer();
      }, 1500); // Debounce syncs
      return () => clearTimeout(delaySync);
    }
  }, [profile, dailyLogs, ratings, readHistory, customCards, offlineMode, isLoggedIn]);

  // Persist local storage as cache on every state change
  useEffect(() => {
    localStorage.setItem('pdb_profile', JSON.stringify(profile));
    localStorage.setItem('pdb_logs', JSON.stringify(dailyLogs));
    localStorage.setItem('pdb_ratings', JSON.stringify(ratings));
    localStorage.setItem('pdb_history', JSON.stringify(readHistory));
    localStorage.setItem('pdb_custom_cards', JSON.stringify(customCards));
  }, [profile, dailyLogs, ratings, readHistory, customCards]);

  // Fetch leaderboard API
  const fetchLeaderboard = async () => {
    try {
      const response = await fetch('/api/leaderboard');
      if (response.ok) {
        const data = await response.json();
        setLeaderboard(data);
      }
    } catch (err) {
      console.warn('Failed to fetch leaderboard from API, offline or dev restarted:', err);
    }
  };

  // Sync with cloud server API
  const syncWithServer = async () => {
    if (!profile.email) return;
    setSyncStatus('pending');
    try {
      const payload: SyncData = {
        profile,
        dailyLogs,
        ratings,
        readHistory,
        customCards
      };

      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: profile.email, syncData: payload })
      });

      if (res.ok) {
        setSyncStatus('synced');
        fetchLeaderboard();
      } else {
        setSyncStatus('pending');
      }
    } catch (err) {
      console.warn('Sync failed, queuing changes locally:', err);
      setSyncStatus('pending');
    }
  };

  // 2. Registration / Cloud Sign In
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail || !authEmail.includes('@')) {
      setAuthError('Please enter a valid email.');
      return;
    }

    setAuthLoading(true);
    setAuthError('');

    try {
      const clientData: SyncData = {
        profile,
        dailyLogs,
        ratings,
        readHistory,
        customCards
      };

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: authEmail,
          username: authUsername || authEmail.split('@')[0],
          clientData
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Merge downloaded server-side sync state
      setProfile(data.profile);
      setDailyLogs(data.dailyLogs || []);
      setRatings(data.ratings || {});
      setReadHistory(data.readHistory || {});
      setCustomCards(data.customCards || []);

      setIsLoggedIn(true);
      localStorage.setItem('pdb_auth_email', authEmail);
      triggerSystemNotification(`Connected successfully as @${data.profile.username}! Cloud sync is active.`);
      
      // Load leaderboard again
      fetchLeaderboard();
    } catch (err: any) {
      setAuthError(err.message || 'Server connection failed. Caching progress offline.');
      // Fallback: log in locally anyway to preserve experience
      setIsLoggedIn(true);
      const localProfile = { ...profile, email: authEmail, username: authUsername || authEmail.split('@')[0] };
      setProfile(localProfile);
      localStorage.setItem('pdb_auth_email', authEmail);
    } finally {
      setAuthLoading(false);
    }
  };

  // Log out
  const handleLogOut = () => {
    setIsLoggedIn(false);
    setProfile(INITIAL_PROFILE);
    setDailyLogs([]);
    setRatings({});
    setReadHistory({});
    setCustomCards([]);
    localStorage.clear();
    triggerSystemNotification('Logged out. Switched to offline-only sandbox mode.');
  };

  // 3. Rating & Reading Interactive Flashcards
  const handleRateCard = (cardId: string, ratingValue: number) => {
    setRatings(prev => ({ ...prev, [cardId]: ratingValue }));
    
    // Give initial read badge trigger or rating XP
    if (!ratings[cardId]) {
      addXp(15, 'Rating flashcard insight');
      triggerBadgeCheck('badge_first_card');
    }
    
    // Check all categories read badge
    triggerBadgeCheck('badge_all_categories');
  };

  // Complete Daily Read
  const handleCompleteRead = () => {
    if (!currentCard) return;

    const todayStr = new Date().toISOString().split('T')[0];
    const isAlreadyReadToday = readHistory[currentCard.id] === todayStr;

    if (isAlreadyReadToday) {
      triggerSystemNotification('You have already logged reading this card today. Challenge yourself with a new one!');
      return;
    }

    // Update history
    setReadHistory(prev => ({ ...prev, [currentCard.id]: todayStr }));

    // Calculate Streak
    let newStreak = profile.currentStreak;
    const lastActive = profile.lastActiveDate;

    if (!lastActive) {
      newStreak = 1;
    } else {
      const lastDate = new Date(lastActive);
      const todayDate = new Date(todayStr);
      const diffTime = todayDate.getTime() - lastDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        newStreak += 1;
      } else if (diffDays > 1) {
        newStreak = 1; // reset if missed
      }
      // if diffDays === 0, keep same
    }

    const highestStreak = Math.max(profile.highestStreak, newStreak);

    // Track daily logs for the chart
    setDailyLogs(prev => {
      const existing = prev.find(l => l.date === todayStr);
      if (existing) {
        return prev.map(l => l.date === todayStr ? { ...l, cardsRead: l.cardsRead + 1, xpEarned: l.xpEarned + 40 } : l);
      } else {
        return [...prev, { date: todayStr, cardsRead: 1, xpEarned: 40 }];
      }
    });

    // Update Profile Stats
    const updatedProfile = {
      ...profile,
      currentStreak: newStreak,
      highestStreak,
      lastActiveDate: todayStr
    };

    setProfile(updatedProfile);
    addXp(40, 'Completed daily flashcard reading');

    // Trigger streak badge validation checks
    if (newStreak >= 3) triggerBadgeCheck('badge_streak_3');
    if (newStreak >= 7) triggerBadgeCheck('badge_streak_7');
    triggerBadgeCheck('badge_all_categories');

    triggerSystemNotification(`🔥 Amazing! Streak: ${newStreak} days. You received +40 XP for becoming 1% better today!`);
  };

  // Leveling engine and XP additions
  const addXp = (amount: number, reason: string) => {
    setProfile(prev => {
      const newXp = prev.xp + amount;
      const newLevel = Math.floor(newXp / 150) + 1; // 150 XP per level
      
      const levelUp = newLevel > prev.level;
      if (levelUp) {
        setTimeout(() => {
          triggerSystemNotification(`🎉 CONGRATULATIONS! You leveled up to Level ${newLevel}! Keep compounding your mindset.`);
        }, 1000);
      }

      // Sync level up achievements with Milestones list
      const unlockedMilestones = [...prev.milestones];
      MILESTONES.forEach(m => {
        if (newXp >= m.xpRequired && !unlockedMilestones.includes(m.id)) {
          unlockedMilestones.push(m.id);
        }
      });

      return {
        ...prev,
        xp: newXp,
        level: newLevel,
        milestones: unlockedMilestones
      };
    });
  };

  // Badge Unlock checker
  const triggerBadgeCheck = (badgeId: string) => {
    setProfile(prev => {
      if (prev.badges.includes(badgeId)) return prev;

      const targetBadge = BADGES.find(b => b.id === badgeId);
      if (!targetBadge) return prev;

      // Double check custom unlock parameters
      if (badgeId === 'badge_all_categories') {
        const uniqueReadCategories = new Set(
          Object.keys(readHistory).map(id => {
            const card = [...flashcards, ...customCards].find(c => c.id === id);
            return card?.category;
          }).filter(Boolean)
        );
        // If they read at least 4 unique personality categories
        if (uniqueReadCategories.size < 4) return prev;
      }

      // Success unlocking badge
      setTimeout(() => {
        setUnlockedBadgeToast(targetBadge);
        addXp(targetBadge.xpReward, `Unlocked Badge: ${targetBadge.title}`);
      }, 500);

      return {
        ...prev,
        badges: [...prev.badges, badgeId]
      };
    });
  };

  // 4. Generate Personalized Custom AI Personality Card
  const handleGenerateAiCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiTopic.trim()) return;

    if (!isLoggedIn) {
      setAiError('Please sign in with your email first to store your custom AI cards.');
      return;
    }

    setAiGenerating(true);
    setAiError('');

    try {
      const response = await fetch('/api/ai/generate-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: profile.email,
          topic: aiTopic.trim(),
          category: 'Custom'
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate custom card');
      }

      // Success
      setCustomCards(prev => [...prev, data.card]);
      setProfile(data.profile); // Sync profile containing updated XP / Badge
      setAiTopic('');
      
      // Select the custom category to view instantly
      setSelectedCategory('Custom');
      setCurrentCardIdx(customCards.length); // Index of new card is length before push
      setIsFlipped(false);
      
      triggerSystemNotification(`✨ Personalized AI Card on "${data.card.title}" generated successfully! Added to your custom shelf (+150 XP).`);
    } catch (err: any) {
      console.error(err);
      setAiError(err.message || 'Connection lost. Custom AI modules require an active internet connection.');
    } finally {
      setAiGenerating(false);
    }
  };

  // 5. Mock Premium Pro Upgrade Trigger
  const handleUpgradeToPremium = async () => {
    if (!isLoggedIn) {
      triggerSystemNotification('Please login with an email to lock in your premium cloud subscription.');
      return;
    }
    try {
      const response = await fetch('/api/subscription/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: profile.email })
      });
      const data = await response.json();
      if (response.ok) {
        setProfile(data.profile);
        triggerBadgeCheck('badge_premium');
        triggerSystemNotification('🌟 Premium Activated! You unlocked unlimited AI Coaching, infinite flashcard generation, and +300 bonus XP.');
      }
    } catch (err) {
      // Fallback premium trigger offline
      const upgraded = { ...profile, subscription: 'premium' as const };
      setProfile(upgraded);
      triggerSystemNotification('🌟 Premium activated in local sandbox! (Will sync when server is reachable).');
    }
  };

  // System alert popups
  const triggerSystemNotification = (msg: string) => {
    setSystemNotification(msg);
    setTimeout(() => setSystemNotification(null), 5000);

    // Trigger local push notification if browser permissions allow
    if ('Notification' in window && Notification.permission === 'granted' && profile.notificationsEnabled) {
      new Notification('Personality Builder Daily', {
        body: msg,
        icon: 'https://cdn-icons-png.flaticon.com/512/3248/3248386.png'
      });
    }
  };

  const handleUpdateNotificationSettings = (enabled: boolean, time: string) => {
    setProfile(prev => ({
      ...prev,
      notificationsEnabled: enabled,
      notificationTime: time
    }));
  };

  // Nav index helper
  const nextCard = () => {
    setIsFlipped(false);
    setCurrentCardIdx(prev => (prev + 1) % filteredCards.length);
  };

  const prevCard = () => {
    setIsFlipped(false);
    setCurrentCardIdx(prev => (prev - 1 + filteredCards.length) % filteredCards.length);
  };

  return (
    <div className="min-h-screen bg-[#F7F9FC] text-[#1A1A1A] flex flex-col font-sans selection:bg-brand-orange selection:text-white">
      
      {/* 1. Header Navigation Bar */}
      <header className="border-b-4 border-brand-dark bg-white sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-orange border-2 border-brand-dark rounded-lg flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <div className="w-4 h-4 bg-white rotate-45"></div>
              </div>
              <div>
                <h1 className="text-xl font-black text-brand-dark font-display flex items-center gap-1.5 leading-none uppercase">
                  Mindset<span className="text-brand-blue">+</span>
                  {profile.subscription === 'premium' && (
                    <span className="bg-brand-yellow text-brand-dark border-2 border-brand-dark text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider scale-90">
                      PRO
                    </span>
                  )}
                </h1>
                <p className="text-[10px] font-black text-brand-dark/60 uppercase tracking-wide mt-1">1% Better Everyday • Habit Engine</p>
              </div>
            </div>

            {/* Micro network pill on mobile */}
            <div className="md:hidden flex items-center gap-1.5">
              <button 
                onClick={() => {
                  setOfflineMode(!offlineMode);
                  setSyncStatus(offlineMode ? 'pending' : 'offline');
                }}
                className={`w-4 h-4 rounded-full border-2 border-brand-dark flex items-center justify-center text-[8px] font-bold ${
                  offlineMode 
                    ? 'bg-brand-orange' 
                    : syncStatus === 'synced'
                      ? 'bg-brand-green'
                      : 'bg-brand-yellow'
                }`}
                title="Force Offline Toggle (P2P Sandbox)"
              >
                {!offlineMode && syncStatus === 'pending' ? '↻' : ''}
              </button>
            </div>
          </div>

          {/* User Profile & Account Controls */}
          <div className="flex items-center flex-wrap gap-4">
            
            {/* Network Sync status pill */}
            <div className="hidden md:flex items-center gap-2 bg-white border-2 border-brand-dark px-3.5 py-1.5 rounded-full text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <button
                onClick={() => {
                  setOfflineMode(!offlineMode);
                  setSyncStatus(offlineMode ? 'pending' : 'offline');
                  triggerSystemNotification(offlineMode ? 'Online mode toggled. Synchronizing cached changes.' : 'Offline mode activated. Your changes are saved locally.');
                }}
                className={`w-2.5 h-2.5 rounded-full transition-all cursor-pointer ${
                  offlineMode 
                    ? 'bg-brand-orange border border-brand-dark animate-pulse' 
                    : syncStatus === 'synced' 
                      ? 'bg-brand-green border border-brand-dark' 
                      : 'bg-brand-yellow border border-brand-dark animate-pulse'
                }`}
              />
              <span className="text-[11px] font-black text-brand-dark uppercase">
                {offlineMode ? 'Offline Sandbox' : syncStatus === 'synced' ? 'Cloud Synced' : 'Syncing changes...'}
              </span>
              {!offlineMode && syncStatus !== 'synced' && (
                <button onClick={syncWithServer} className="text-brand-dark/50 hover:text-brand-dark transition shrink-0 ml-1 cursor-pointer">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                </button>
              )}
            </div>

            {/* Streak Tracker */}
            <div className="flex items-center gap-2 bg-[#FFF4E5] border-2 border-brand-dark px-3.5 py-1.5 rounded-full text-xs shrink-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <Flame className={`w-4 h-4 text-brand-orange ${profile.currentStreak > 0 ? 'animate-bounce' : ''}`} />
              <div className="text-left leading-none">
                <p className="text-[9px] text-brand-dark/60 uppercase tracking-widest font-black">Streak</p>
                <p className="text-xs font-black text-brand-dark mt-0.5">{profile.currentStreak} Days</p>
              </div>
            </div>

            {/* Profile Level */}
            <div className="flex items-center gap-3 bg-white border-2 border-brand-dark px-4 py-1.5 rounded-full shrink-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <div className="p-1 bg-brand-green border border-brand-dark rounded-lg text-brand-dark">
                <Award className="w-3.5 h-3.5" />
              </div>
              <div className="text-left leading-none">
                <p className="text-[9px] text-brand-dark/50 uppercase font-black">Level {profile.level}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-xs font-black text-brand-dark font-mono">{profile.xp} XP</span>
                  <div className="w-16 h-2 bg-[#F1F3F7] border border-brand-dark rounded-full overflow-hidden">
                    <div 
                      style={{ width: `${(profile.xp % 150) / 1.5}%` }} 
                      className="bg-brand-green h-full rounded-full transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Log in state details */}
            {isLoggedIn ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:block text-right">
                  <p className="text-xs font-black text-brand-dark uppercase">@{profile.username}</p>
                  <p className="text-[10px] text-brand-dark/60 font-mono truncate max-w-[120px]">{profile.email}</p>
                </div>
                <button
                  onClick={handleLogOut}
                  className="p-2 bg-brand-orange text-white border-2 border-brand-dark hover:bg-brand-orange/90 rounded-full transition cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5"
                  title="Sign out / Clear Sync Cache"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-white border-2 border-brand-dark px-3.5 py-1.5 rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <span className="text-[10px] text-brand-dark/60 font-black uppercase">Guest sandbox</span>
              </div>
            )}

          </div>
        </div>
      </header>

      {/* 2. Authentication Block for Guests */}
      {!isLoggedIn && (
        <section className="bg-white border-b-4 border-brand-dark py-6 px-4 shadow-[0px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-xl font-black text-brand-dark uppercase font-display flex items-center justify-center gap-2">
              <LogIn className="w-5 h-5 text-brand-orange" />
              Sync Your Personality Progress Everywhere
            </h2>
            <p className="text-xs font-bold text-brand-dark/60 uppercase mt-1.5 max-w-lg mx-auto">
              Register or login with any email to sync your flashcard ratings, daily streaks, unlocked badges, and custom AI coached sessions securely to our cloud service database.
            </p>
            
            <form onSubmit={handleAuthSubmit} className="mt-5 flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
              <input
                type="email"
                required
                value={authEmail}
                onChange={e => setAuthEmail(e.target.value)}
                placeholder="Enter email e.g. learner@domain.com"
                className="flex-1 bg-white border-2 border-brand-dark focus:bg-brand-light text-brand-dark text-xs font-black rounded-xl px-3.5 py-3.5 outline-none placeholder-brand-dark/50"
              />
              <input
                type="text"
                value={authUsername}
                onChange={e => setAuthUsername(e.target.value)}
                placeholder="Custom username (Optional)"
                className="sm:w-44 bg-white border-2 border-brand-dark focus:bg-brand-light text-brand-dark text-xs font-black rounded-xl px-3.5 py-3.5 outline-none placeholder-brand-dark/50"
              />
              <button
                type="submit"
                disabled={authLoading}
                className="bg-brand-green hover:bg-brand-green/85 text-brand-dark font-black uppercase text-xs px-6 py-3.5 rounded-xl border-2 border-brand-dark transition flex items-center justify-center gap-1.5 shrink-0 cursor-pointer shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5"
              >
                {authLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  'Start Growth Journey'
                )}
              </button>
            </form>
            {authError && <p className="text-xs text-brand-orange font-black uppercase mt-3">{authError}</p>}
          </div>
        </section>
      )}

      {/* 3. Global System Toasts / Notifications */}
      <AnimatePresence>
        {systemNotification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 bg-brand-yellow text-brand-dark border-2 border-brand-dark text-xs font-black uppercase py-3.5 px-6 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] z-50 flex items-center gap-2.5 max-w-md"
          >
            <div className="w-2.5 h-2.5 bg-brand-orange rounded-full animate-ping shrink-0" />
            <span>{systemNotification}</span>
            <button onClick={() => setSystemNotification(null)} className="text-brand-dark/70 hover:text-brand-dark font-black text-lg ml-2 cursor-pointer">×</button>
          </motion.div>
        )}

        {unlockedBadgeToast && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center bg-brand-dark/50 backdrop-blur-sm z-50 p-4"
          >
            <div className="bg-white border-4 border-brand-dark rounded-[32px] p-6 text-center max-w-sm w-full relative shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <div className="absolute top-0 left-0 w-full h-2 bg-brand-orange border-b-2 border-brand-dark rounded-t-2xl" />
              
              <div className="w-16 h-16 bg-brand-yellow border-2 border-brand-dark text-brand-dark rounded-full flex items-center justify-center mx-auto text-3xl mb-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                ★
              </div>

              <span className="text-[10px] uppercase font-black tracking-widest text-brand-dark bg-[#FFF4E5] border-2 border-brand-dark px-3 py-1 rounded-full">
                Badge Unlocked!
              </span>

              <h3 className="text-xl font-black text-brand-dark font-display mt-3 uppercase">{unlockedBadgeToast.title}</h3>
              <p className="text-xs font-medium text-brand-dark/80 mt-2 leading-relaxed px-2">
                {unlockedBadgeToast.description}
              </p>

              <div className="mt-4 bg-brand-light border-2 border-brand-dark p-3 rounded-2xl inline-block shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <p className="text-[10px] text-brand-dark/50 font-black uppercase tracking-wider">Completion Reward</p>
                <p className="text-sm font-black text-brand-blue">+{unlockedBadgeToast.xpReward} XP Added</p>
              </div>

              <button
                onClick={() => setUnlockedBadgeToast(null)}
                className="w-full mt-6 py-3 bg-brand-green hover:bg-brand-green/90 text-brand-dark border-2 border-brand-dark font-black text-xs uppercase rounded-xl transition cursor-pointer shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5"
              >
                Claim Growth Reward
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. Main Body Content Layout Split */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 grid grid-cols-1 lg:grid-cols-3 gap-6 my-4">
        
        {/* LEFT COMPACT COLUMN AND FLASHCARD CONSOLE (Takes 2/3 space on large screens) */}
        <section className="lg:col-span-2 space-y-6 flex flex-col">
          
          {/* A. CATEGORY TABS FILTER */}
          <div className="flex bg-white border-2 border-brand-dark p-1 rounded-2xl overflow-x-auto gap-1 custom-scrollbar shrink-0 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            {['All', 'Mindset', 'EQ', 'Habits', 'Focus', 'Leadership', 'Communication', 'Custom'].map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => {
                    setSelectedCategory(cat);
                    setCurrentCardIdx(0);
                    setIsFlipped(false);
                  }}
                  className={`px-3.5 py-2 text-xs font-black uppercase rounded-xl whitespace-nowrap transition cursor-pointer ${
                    isActive
                      ? 'bg-brand-blue text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] border border-brand-dark'
                      : 'text-brand-dark/75 hover:text-brand-dark hover:bg-brand-dark/5'
                  }`}
                >
                  {cat === 'Custom' ? 'Custom AI Cards' : cat}
                </button>
              );
            })}
          </div>

          {/* B. DYNAMIC 3D FLIPPING FLASHCARD DECK */}
          <div className="flex-1 min-h-[380px] flex flex-col justify-between" id="flashcards-deck">
            {filteredCards.length > 0 && currentCard ? (
              <div className="space-y-4">
                
                {/* 3D Container */}
                <div 
                  onClick={() => setIsFlipped(!isFlipped)}
                  className="perspective-1000 w-full h-[320px] cursor-pointer group"
                >
                  <div 
                    className={`relative w-full h-full transition-transform duration-700 preserve-3d ${
                      isFlipped ? 'rotate-y-180' : ''
                    }`}
                  >
                    
                    {/* CARD FRONT SIDE (Quote view) */}
                    <div className={`absolute inset-0 border-4 border-brand-dark rounded-[32px] p-6 flex flex-col justify-between backface-hidden shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] ${getCategoryColor(currentCard.category).bg}`}>
                      {/* Decorative elements */}
                      <div className="flex items-center justify-between border-b-2 border-brand-dark pb-3">
                        <span className={`border-2 border-brand-dark text-[10px] font-black uppercase px-2.5 py-1 rounded-full tracking-wider ${getCategoryColor(currentCard.category).labelBg}`}>
                          {currentCard.category}
                        </span>
                        <div className="flex items-center gap-1.5 text-xs font-black uppercase">
                          <BookOpen className="w-4 h-4" />
                          <span>Card {currentCardIdx + 1} of {filteredCards.length}</span>
                        </div>
                      </div>

                      {/* Display Quote / Thought */}
                      <div className="my-auto py-4 text-center">
                        <p className="text-xl md:text-2xl font-black font-display tracking-tight uppercase leading-snug max-w-lg mx-auto">
                          "{currentCard.frontQuote}"
                        </p>
                      </div>

                      {/* Instructions */}
                      <div className="flex items-center justify-between border-t-2 border-brand-dark pt-3 text-xs font-black uppercase">
                        <span className="flex items-center gap-1.5">
                          <Info className="w-4 h-4" />
                          <span>{ratings[currentCard.id] ? `Reviewed (${ratings[currentCard.id]}★)` : 'New Card'}</span>
                        </span>
                        <span className="bg-white text-brand-dark border-2 border-brand-dark px-4 py-2 rounded-xl text-xs font-black uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                          Flip Concept &rarr;
                        </span>
                      </div>
                    </div>

                    {/* CARD BACK SIDE (Action & details view) */}
                    <div className="absolute inset-0 bg-white border-4 border-brand-dark rounded-[32px] p-6 flex flex-col justify-between backface-hidden rotate-y-180 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-y-auto custom-scrollbar text-brand-dark">
                      <div className="flex items-center justify-between border-b-2 border-brand-dark pb-3">
                        <h4 className="text-base font-black font-display text-brand-blue tracking-wide uppercase">
                          {currentCard.title}
                        </h4>
                        <span className="text-[10px] font-black uppercase text-brand-dark/50">Concept Unwrapped</span>
                      </div>

                      {/* Scientific Concept detail */}
                      <div className="space-y-4 my-auto py-3">
                        <div>
                          <p className="text-[11px] font-black uppercase tracking-wider text-brand-dark/60">Core Lesson</p>
                          <p className="text-xs font-bold leading-relaxed mt-1">
                            {currentCard.concept}
                          </p>
                        </div>

                        {/* Three action insights */}
                        <div>
                          <p className="text-[11px] font-black uppercase tracking-wider mb-2 text-brand-dark/60">Action Takeaways</p>
                          <ul className="space-y-2">
                            {currentCard.takeaways.map((takeaway, tIdx) => (
                              <li key={tIdx} className="text-xs font-bold flex items-start gap-2.5 leading-normal">
                                <div className="w-5 h-5 rounded bg-brand-green border-2 border-brand-dark text-brand-dark flex items-center justify-center shrink-0 mt-0.5 animate-bounce">
                                  <Check className="w-3.5 h-3.5 stroke-[3px]" />
                                </div>
                                <span>{takeaway}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Practical Action Steps */}
                        <div className="bg-[#FFF4E5] border-2 border-brand-dark p-3.5 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                          <p className="text-[11px] text-brand-orange font-black uppercase tracking-wider flex items-center gap-1.5">
                            <Sparkles className="w-4 h-4 text-brand-orange" />
                            Daily Growth Action
                          </p>
                          <p className="text-xs font-bold leading-normal mt-1 italic">
                            "{currentCard.actionStep}"
                          </p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="border-t-2 border-brand-dark pt-3 flex items-center justify-between text-xs font-black uppercase text-brand-dark/50">
                        <span>Click card to show quote</span>
                        <span className="text-brand-blue font-black">Takeaways Loaded</span>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Deck Nav, Ratings & Complete Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white border-4 border-brand-dark rounded-[32px] p-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                  
                  {/* Rating Selector */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase text-brand-dark">Rate Concept:</span>
                    <div className="flex gap-1 bg-brand-light border-2 border-brand-dark p-1 rounded-xl">
                      {[1, 2, 3, 4, 5].map((star) => {
                        const isSelected = (ratings[currentCard.id] || 0) >= star;
                        return (
                          <button
                            key={star}
                            onClick={() => handleRateCard(currentCard.id, star)}
                            className="p-1 transition-all hover:scale-125 cursor-pointer"
                          >
                            <Star 
                              className={`w-4 h-4 ${
                                isSelected 
                                  ? 'fill-brand-orange text-brand-orange animate-bounce' 
                                  : 'text-brand-dark/40 hover:text-brand-orange'
                              }`} 
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Mark as read accountability */}
                  <button
                    onClick={handleCompleteRead}
                    className="w-full sm:w-auto px-6 py-3.5 bg-brand-green hover:bg-brand-green/90 text-brand-dark font-black uppercase text-xs rounded-2xl border-2 border-brand-dark transition shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-1.5 cursor-pointer shrink-0 active:translate-y-0.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Complete Daily Read (+40 XP)
                  </button>

                  {/* Navigation arrow buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={prevCard}
                      className="p-2 bg-white hover:bg-brand-light border-2 border-brand-dark rounded-xl transition cursor-pointer text-brand-dark shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5"
                      title="Previous Card"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <div className="px-3 bg-brand-light border-2 border-brand-dark rounded-xl flex items-center text-xs font-black font-mono text-brand-dark shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                      {currentCardIdx + 1} / {filteredCards.length}
                    </div>
                    <button
                      onClick={nextCard}
                      className="p-2 bg-white hover:bg-brand-light border-2 border-brand-dark rounded-xl transition cursor-pointer text-brand-dark shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5"
                      title="Next Card"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                </div>

              </div>
            ) : (
              <div className="bg-white border-4 border-brand-dark rounded-[32px] p-10 text-center flex flex-col justify-center items-center h-[320px] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <HelpCircle className="w-12 h-12 text-brand-dark/40 mb-3" />
                <h3 className="text-lg font-black uppercase text-brand-dark">No Flashcards Generated Yet</h3>
                <p className="text-xs font-bold text-brand-dark/60 uppercase mt-1 max-w-sm">
                  There are no custom flashcards on this category shelf. Sign in with your email and write a custom topic below to generate high-impact growth insights using AI!
                </p>
                {selectedCategory === 'Custom' && (
                  <button
                    onClick={() => setSelectedCategory('All')}
                    className="mt-4 px-5 py-2.5 bg-brand-orange text-white border-2 border-brand-dark rounded-xl text-xs font-black uppercase transition cursor-pointer shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5"
                  >
                    Browse Core Cards Instead
                  </button>
                )}
              </div>
            )}
          </div>

          {/* C. PREMIUM CUSTOM AI FLASHCARD GENERATOR */}
          <div className="bg-white border-4 border-brand-dark rounded-[32px] p-5 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]" id="ai-generator">
            <div className="flex items-center justify-between border-b-2 border-brand-dark pb-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-brand-yellow border-2 border-brand-dark rounded-lg text-brand-dark shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-brand-dark uppercase flex items-center gap-1.5">
                    Generate Custom Flashcards
                    {profile.subscription !== 'premium' && (
                      <span className="bg-[#FFF4E5] text-brand-orange border-2 border-brand-dark text-[9px] px-1.5 py-0.5 rounded font-black uppercase">
                        {customCards.length}/2 Free Slots
                      </span>
                    )}
                  </h3>
                  <p className="text-[10px] font-black uppercase text-brand-dark/50">Instruct Gemini to customize personality insights</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleGenerateAiCard} className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={aiTopic}
                onChange={e => setAiTopic(e.target.value)}
                disabled={aiGenerating}
                placeholder="e.g. Overcoming stage fright, Managing remote team conflicts..."
                className="flex-1 bg-white border-2 border-brand-dark focus:bg-brand-light text-brand-dark text-xs font-black rounded-xl px-3.5 py-2.5 outline-none placeholder-brand-dark/40"
              />
              <button
                type="submit"
                disabled={aiGenerating || !aiTopic.trim()}
                className="bg-brand-orange hover:bg-brand-orange/90 text-white border-2 border-brand-dark font-black text-xs uppercase px-5 py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 shrink-0 cursor-pointer shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5"
              >
                {aiGenerating ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    AI Crafting Card...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-white animate-pulse" />
                    Generate Card (+150 XP)
                  </>
                )}
              </button>
            </form>

            {aiError && (
              <div className="mt-3 bg-[#FFF4E5] border-2 border-brand-dark rounded-xl p-3 text-brand-dark text-xs flex gap-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-brand-orange" />
                <div>
                  <p className="font-black uppercase text-brand-orange">AI Generation Failed</p>
                  <p className="mt-0.5 font-bold leading-relaxed">{aiError}</p>
                  {aiError.includes('Upgrade') && (
                    <button
                      type="button"
                      onClick={handleUpgradeToPremium}
                      className="mt-2 font-black uppercase text-brand-blue hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      Unlock Pro Subscription Mode &rarr;
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* D. UNLOCKED BADGES SHELF */}
          <div className="bg-white border-4 border-brand-dark rounded-[32px] p-5 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]" id="badges-shelf">
            <h3 className="text-sm font-black text-brand-dark mb-4 flex items-center gap-2 uppercase">
              <Award className="w-4.5 h-4.5 text-brand-orange" />
              Achievements & Unlockable Badges
            </h3>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {BADGES.map((badge) => {
                const isUnlocked = profile.badges.includes(badge.id);
                return (
                  <div
                    key={badge.id}
                    className={`p-3 rounded-xl border-2 text-center transition group relative overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${
                      isUnlocked
                        ? 'bg-[#FFF4E5] border-brand-dark text-brand-dark'
                        : 'bg-brand-light border-brand-dark border-dashed opacity-45'
                    }`}
                  >
                    {/* Badge Icon mockup */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2 text-lg font-black border-2 border-brand-dark transition ${
                      isUnlocked
                        ? 'bg-brand-yellow text-brand-dark border-brand-dark shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                        : 'bg-brand-light text-brand-dark/40 border-brand-dark/20'
                    }`}>
                      ★
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-tight text-brand-dark leading-tight">
                      {badge.title}
                    </p>
                    <p className="text-[8px] font-mono font-black text-brand-blue mt-0.5">+{badge.xpReward} XP</p>
                    
                    {/* Tooltip detail hover popup */}
                    <div className="absolute inset-0 bg-white border-2 border-brand-dark p-2 text-[9px] flex flex-col justify-center items-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 text-center font-bold text-brand-dark">
                      <p className="font-black text-brand-dark leading-tight">{badge.title}</p>
                      <p className="text-brand-dark/70 mt-1 leading-normal text-[8px] font-medium">{badge.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </section>

        {/* RIGHT COLUMN SIDEBAR MODULES (Takes 1/3 space on large screens) */}
        <section className="space-y-6 flex flex-col">
          
          {/* I. INTERACTIVE AI GROWTH COACH */}
          <AICoach 
            profile={profile} 
            onUpgradeToPremium={handleUpgradeToPremium}
            offlineMode={offlineMode}
          />

          {/* II. PROGRESS VISUALIZATION CHART */}
          <AnalyticsCharts logs={dailyLogs} xp={profile.xp} />

          {/* III. LEADERBOARDS & CHALLENGES */}
          <Leaderboard
            entries={leaderboard}
            currentUsername={profile.username}
            currentStreak={profile.currentStreak}
            currentXp={profile.xp}
            currentLevel={profile.level}
          />

          {/* IV. PUSH NOTIFICATIONS / ACCOUNTABILITY SETTINGS */}
          <NotificationSettings
            notificationsEnabled={profile.notificationsEnabled}
            notificationTime={profile.notificationTime}
            onUpdateSettings={handleUpdateNotificationSettings}
            onSimulateNotification={(msg) => triggerSystemNotification(msg)}
          />

        </section>

      </main>

      {/* 5. Footer */}
      <footer className="border-t-4 border-brand-dark bg-white py-8 px-6 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-black uppercase text-brand-dark/70">
          <p>© 2026 Daily Personality Builder. Compounding growth by 1% everyday.</p>
          <div className="flex gap-4">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-brand-orange" />
              Secure Cloud Sandbox
            </span>
            <span>Premium Plan Active: {profile.subscription === 'premium' ? 'Yes' : 'No (Free slot)'}</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
