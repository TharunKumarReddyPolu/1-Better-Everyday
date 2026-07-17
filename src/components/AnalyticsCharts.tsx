import React, { useState } from 'react';
import { DailyLog } from '../types';
import { Sparkles, TrendingUp, Calendar, Zap } from 'lucide-react';

interface AnalyticsChartsProps {
  logs: DailyLog[];
  xp: number;
}

export default function AnalyticsCharts({ logs, xp }: AnalyticsChartsProps) {
  const [activeTab, setActiveTab] = useState<'xp' | 'cards'>('xp');

  // Fill in empty days if less than 7 logs to show a clean weekly view
  const last7Days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split('T')[0];
    const existingLog = logs.find(l => l.date === dateStr);
    
    // Short date label (e.g., "Jul 17")
    const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    
    return {
      date: dateStr,
      label,
      xpEarned: existingLog ? existingLog.xpEarned : 0,
      cardsRead: existingLog ? existingLog.cardsRead : 0
    };
  });

  const maxValue = activeTab === 'xp' 
    ? Math.max(...last7Days.map(d => d.xpEarned), 50) 
    : Math.max(...last7Days.map(d => d.cardsRead), 5);

  return (
    <div className="bg-white border-4 border-brand-dark rounded-[32px] p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col" id="analytics-section">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h3 className="text-xl font-black text-brand-dark uppercase flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-brand-blue" />
            1% Better Everyday
          </h3>
          <p className="text-xs font-bold text-brand-dark/60 uppercase">Track your personal compounding growth curve</p>
        </div>
        
        {/* Metric Switcher */}
        <div className="flex bg-brand-light p-1 rounded-2xl border-2 border-brand-dark">
          <button
            onClick={() => setActiveTab('xp')}
            className={`px-3 py-1.5 text-xs font-black uppercase rounded-xl transition-all cursor-pointer ${
              activeTab === 'xp' 
                ? 'bg-brand-blue text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] border border-brand-dark' 
                : 'text-brand-dark/70 hover:text-brand-dark hover:bg-brand-dark/5'
            }`}
          >
            XP Growth
          </button>
          <button
            onClick={() => setActiveTab('cards')}
            className={`px-3 py-1.5 text-xs font-black uppercase rounded-xl transition-all cursor-pointer ${
              activeTab === 'cards' 
                ? 'bg-brand-blue text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] border border-brand-dark' 
                : 'text-brand-dark/70 hover:text-brand-dark hover:bg-brand-dark/5'
            }`}
          >
            Flashcards Read
          </button>
        </div>
      </div>

      {/* Analytics Summary */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-brand-light border-2 border-brand-dark rounded-2xl p-3 flex items-center gap-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="p-2 bg-brand-green border border-brand-dark rounded-lg text-brand-dark">
            <Zap className="w-4 h-4 fill-current" />
          </div>
          <div>
            <p className="text-[10px] text-brand-dark/50 uppercase tracking-wider font-black">Total Progress XP</p>
            <p className="text-lg font-black text-brand-dark">{xp} XP</p>
          </div>
        </div>
        <div className="bg-brand-light border-2 border-brand-dark rounded-2xl p-3 flex items-center gap-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="p-2 bg-brand-yellow border border-brand-dark rounded-lg text-brand-dark">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] text-brand-dark/50 uppercase tracking-wider font-black">Weekly Growth</p>
            <p className="text-lg font-black text-brand-dark">
              +{last7Days.reduce((acc, d) => acc + (activeTab === 'xp' ? d.xpEarned : d.cardsRead), 0)} {activeTab === 'xp' ? 'XP' : 'Cards'}
            </p>
          </div>
        </div>
      </div>

      {/* Visual Chart Canvas */}
      <div className="h-44 flex items-end gap-2 pt-6 pb-2 px-1 border-b-2 border-brand-dark">
        {last7Days.map((day, idx) => {
          const val = activeTab === 'xp' ? day.xpEarned : day.cardsRead;
          const pct = maxValue > 0 ? (val / maxValue) * 100 : 0;
          
          return (
            <div key={idx} className="flex-1 flex flex-col items-center h-full group relative">
              {/* Hover tooltip */}
              <div className="absolute -top-10 bg-brand-dark text-white text-[10px] px-2 py-1.5 rounded-lg border-2 border-brand-dark shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 font-mono">
                {val} {activeTab === 'xp' ? 'XP' : 'Cards'}
              </div>

              {/* Interactive bar column */}
              <div className="w-full flex items-end justify-center h-full">
                <div 
                  style={{ height: `${Math.max(pct, 6)}%` }}
                  className={`w-full max-w-[28px] rounded-t-lg transition-all duration-500 ease-out border-2 border-b-0 border-brand-dark ${
                    val > 0 
                      ? 'bg-brand-green group-hover:bg-brand-orange shadow-[2px_0px_0px_0px_rgba(0,0,0,1)]' 
                      : 'bg-brand-light'
                  }`}
                />
              </div>

              {/* Day Label */}
              <span className="text-[10px] font-black text-brand-dark mt-2 font-mono truncate max-w-[42px] uppercase">
                {day.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Compounding Insight Card */}
      <div className="mt-5 bg-[#FFF4E5] border-2 border-brand-dark rounded-[20px] p-4 flex items-start gap-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <Sparkles className="w-5 h-5 text-brand-orange shrink-0 mt-0.5" />
        <div className="text-xs text-brand-dark">
          <h4 className="font-black uppercase tracking-tight text-brand-dark text-[13px]">The Power of Compounding 1%</h4>
          <p className="font-medium text-brand-dark/85 leading-relaxed mt-1">
            By reading just 1 card a day and learning daily, your capabilities will expand by <strong className="font-black text-brand-blue">37.7 times</strong> in a single year. Consistency is the ultimate multiplier!
          </p>
        </div>
      </div>
    </div>
  );
}
