import React, { useState, useEffect } from 'react';
import { LeaderboardEntry } from '../types';
import { Trophy, Share2, Users, Crown, Copy, Check, MessageSquare } from 'lucide-react';

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  currentUsername: string;
  currentStreak: number;
  currentXp: number;
  currentLevel: number;
}

export default function Leaderboard({
  entries,
  currentUsername,
  currentStreak,
  currentXp,
  currentLevel
}: LeaderboardProps) {
  const [activeTab, setActiveTab] = useState<'global' | 'friends'>('global');
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [copied, setCopied] = useState(false);
  const [shareText, setShareText] = useState('');
  const [friendUsername, setFriendUsername] = useState('');
  const [friendSuccess, setFriendSuccess] = useState('');

  useEffect(() => {
    // Generate sharing text
    setShareText(
      `🔥 I am on a ${currentStreak}-day self-improvement streak at Level ${currentLevel} (${currentXp} XP)! Can you beat me on the Daily Personality Builder leaderboard? Let's grow 1% better everyday! ⚡`
    );
  }, [currentStreak, currentXp, currentLevel]);

  // Combine static entries with live stats of current user
  useEffect(() => {
    const updatedEntries = [...entries];
    const userIndex = updatedEntries.findIndex(
      e => e.username.toLowerCase() === currentUsername.toLowerCase()
    );

    if (userIndex >= 0) {
      updatedEntries[userIndex] = {
        username: currentUsername,
        xp: currentXp,
        streak: currentStreak,
        level: currentLevel,
        isPremium: updatedEntries[userIndex].isPremium,
        isCurrentUser: true
      };
    } else if (currentUsername) {
      updatedEntries.push({
        username: currentUsername,
        xp: currentXp,
        streak: currentStreak,
        level: currentLevel,
        isPremium: false,
        isCurrentUser: true
      });
    }

    // Sort by XP desc
    const sorted = updatedEntries.sort((a, b) => b.xp - a.xp);
    setLeaderboardData(sorted);
  }, [entries, currentUsername, currentStreak, currentXp, currentLevel]);

  const handleCopy = () => {
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddFriend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!friendUsername.trim()) return;

    // Simulate adding friend and generating custom entry
    const mockCompetitor: LeaderboardEntry = {
      username: friendUsername.trim(),
      xp: Math.floor(Math.random() * 1500) + 100,
      streak: Math.floor(Math.random() * 8) + 1,
      level: Math.floor(Math.random() * 5) + 1,
      isPremium: Math.random() > 0.5
    };

    setLeaderboardData(prev => [...prev, mockCompetitor].sort((a, b) => b.xp - a.xp));
    setFriendSuccess(`Successfully added friend @${friendUsername}! Check the leaderboard.`);
    setFriendUsername('');
    setTimeout(() => setFriendSuccess(''), 4000);
  };

  return (
    <div className="bg-white border-4 border-brand-dark rounded-[32px] p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col" id="leaderboard-section">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-brand-yellow border-2 border-brand-dark rounded-2xl text-brand-dark">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-black text-brand-dark uppercase">Daily Leaderboard</h3>
            <p className="text-xs font-bold text-brand-dark/60 uppercase">Compete with friends to stay consistent</p>
          </div>
        </div>

        {/* Local Tab Switcher */}
        <div className="flex bg-brand-light p-1 rounded-2xl border-2 border-brand-dark self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('global')}
            className={`px-3 py-1.5 text-xs font-black uppercase rounded-xl transition-all cursor-pointer ${
              activeTab === 'global' 
                ? 'bg-brand-blue text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] border border-brand-dark' 
                : 'text-brand-dark/70 hover:text-brand-dark hover:bg-brand-dark/5'
            }`}
          >
            Global
          </button>
          <button
            onClick={() => setActiveTab('friends')}
            className={`px-3 py-1.5 text-xs font-black uppercase rounded-xl transition-all cursor-pointer ${
              activeTab === 'friends' 
                ? 'bg-brand-blue text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] border border-brand-dark' 
                : 'text-brand-dark/70 hover:text-brand-dark hover:bg-brand-dark/5'
            }`}
          >
            Social Invite
          </button>
        </div>
      </div>

      {activeTab === 'global' ? (
        <div className="space-y-4">
          {/* List layout */}
          <div className="max-h-80 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
            {leaderboardData.map((entry, idx) => {
              const isFirst = idx === 0;
              const isSecond = idx === 1;
              const isThird = idx === 2;
              const isUser = entry.isCurrentUser;

              return (
                <div
                  key={idx}
                  className={`flex items-center justify-between p-3.5 rounded-2xl transition border-2 border-brand-dark shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${
                    isUser
                      ? 'bg-brand-blue text-white'
                      : 'bg-[#F0F2F5] text-brand-dark hover:bg-[#E5E7EB]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Rank Badge */}
                    <div className="w-8 h-8 flex items-center justify-center font-black text-sm">
                      {isFirst ? (
                        <Crown className="w-6 h-6 text-brand-orange animate-bounce" />
                      ) : isSecond ? (
                        <div className="w-6 h-6 rounded-full bg-slate-300 text-brand-dark border-2 border-brand-dark flex items-center justify-center text-xs font-black">2</div>
                      ) : isThird ? (
                        <div className="w-6 h-6 rounded-full bg-brand-yellow text-brand-dark border-2 border-brand-dark flex items-center justify-center text-xs font-black">3</div>
                      ) : (
                        <span className={`font-mono font-black ${isUser ? 'text-white' : 'text-brand-dark/60'}`}>{idx + 1}</span>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-black uppercase">
                          {entry.username}
                        </span>
                        {entry.isPremium && (
                          <span className={`border border-brand-dark text-[9px] px-2 py-0.5 rounded-full font-black uppercase ${
                            isUser ? 'bg-white text-brand-blue' : 'bg-brand-yellow text-brand-dark'
                          }`}>
                            PRO
                          </span>
                        )}
                        {isUser && (
                          <span className="bg-white text-brand-blue text-[9px] px-2 py-0.5 rounded-full font-black uppercase">
                            YOU
                          </span>
                        )}
                      </div>
                      <div className={`flex items-center gap-2 mt-0.5 text-[10px] font-black uppercase ${
                        isUser ? 'text-white/80' : 'text-brand-dark/60'
                      }`}>
                        <span>Lvl {entry.level}</span>
                        <span>•</span>
                        <span>🔥 {entry.streak} Day Streak</span>
                      </div>
                    </div>
                  </div>

                  <span className="text-xs font-black font-mono">
                    {entry.xp} XP
                  </span>
                </div>
              );
            })}
          </div>

          {/* Direct Share triggers */}
          <div className="mt-4 pt-4 border-t-2 border-brand-dark">
            <h4 className="text-xs font-black text-brand-dark uppercase mb-2 flex items-center gap-1.5">
              <Share2 className="w-4 h-4 text-brand-orange" />
              Challenge Friends & Compete
            </h4>
            <div className="p-4 bg-[#FFF4E5] border-2 border-brand-dark rounded-2xl text-xs space-y-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="text-brand-dark font-semibold italic leading-relaxed text-[11px]">
                "{shareText}"
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={handleCopy}
                  className="flex-1 py-2 bg-white hover:bg-brand-light text-brand-dark rounded-xl text-xs font-black uppercase flex items-center justify-center gap-1.5 border-2 border-brand-dark transition shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-brand-blue" />
                      Copied Details!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copy Share Link
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    const messageUrl = `mailto:?subject=Challenge%20Me%20on%20Daily%20Personality%20Builder!&body=${encodeURIComponent(shareText)}`;
                    window.open(messageUrl, '_blank');
                  }}
                  className="px-4 py-2 bg-brand-green hover:bg-brand-green/85 text-brand-dark rounded-xl text-xs font-black uppercase flex items-center justify-center gap-1.5 border-2 border-brand-dark transition shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  Email Invite
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="p-4 bg-[#FFF4E5] border-2 border-brand-dark rounded-2xl text-xs shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <h4 className="font-black text-brand-dark flex items-center gap-1.5 mb-1.5 uppercase">
              <Users className="w-4 h-4 text-brand-orange" />
              Invite Your Friends
            </h4>
            <p className="font-medium text-brand-dark/80 leading-relaxed text-[11px]">
              Type in a friend's email or username below to register them on your local scoreboard. They will be added to your custom challenge pool.
            </p>
          </div>

          <form onSubmit={handleAddFriend} className="space-y-3">
            <div>
              <label className="block text-[10px] font-black text-brand-dark uppercase tracking-wider mb-1">
                Friend's Username
              </label>
              <input
                type="text"
                value={friendUsername}
                onChange={e => setFriendUsername(e.target.value)}
                placeholder="e.g. BrainyHacker, GrowthLover"
                className="w-full bg-white border-2 border-brand-dark focus:bg-brand-light text-brand-dark font-bold rounded-xl p-2.5 text-xs outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-brand-orange hover:bg-brand-orange/90 text-white border-2 border-brand-dark rounded-xl text-xs font-black uppercase transition shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 cursor-pointer"
            >
              Add Friend to Scoreboard
            </button>
          </form>

          {friendSuccess && (
            <p className="text-xs font-bold text-brand-dark bg-brand-green border-2 border-brand-dark p-2.5 rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              {friendSuccess}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
