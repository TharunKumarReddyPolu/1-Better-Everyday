import React, { useState, useRef, useEffect } from 'react';
import { UserProfile } from '../types';
import { Sparkles, Send, Bot, User, BrainCircuit, ShieldCheck, Zap, AlertTriangle } from 'lucide-react';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface AICoachProps {
  profile: UserProfile;
  onUpgradeToPremium: () => Promise<void>;
  offlineMode: boolean;
}

export default function AICoach({ profile, onUpgradeToPremium, offlineMode }: AICoachProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: `Hello **${profile.username}**! I'm your AI Growth Coach. I can help you reframe obstacles, apply EQ methods, build daily habit loops, or unpack any of your flashcard concepts. What goal are we conquering today?`
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('Consulting psychological frameworks...');
  const [errorMsg, setErrorMsg] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isPremium = profile.subscription === 'premium';

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Rotating coaching thoughts
  useEffect(() => {
    if (!loading) return;
    const messagesPool = [
      'Reframing mental obstacles...',
      'Mapping atomic habit stack cues...',
      'Designing actionable micro-steps...',
      'Synthesizing leadership strategies...',
      'Calibrating emotional pause parameters...'
    ];
    let idx = 0;
    const interval = setInterval(() => {
      idx = (idx + 1) % messagesPool.length;
      setLoadingMsg(messagesPool[idx]);
    }, 2000);
    return () => clearInterval(interval);
  }, [loading]);

  const handleSend = async (textToSend?: string) => {
    const finalMsg = (textToSend || input).trim();
    if (!finalMsg) return;
    if (offlineMode) {
      setErrorMsg("Coaching is unavailable offline. Reconnect to sync with your AI growth consultant.");
      return;
    }

    setInput('');
    setErrorMsg('');
    const userMsg: ChatMessage = { role: 'user', content: finalMsg };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const response = await fetch('/api/ai/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: profile.email,
          message: finalMsg,
          history: messages.slice(-6)
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to get coaching response');
      }

      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Something went wrong. Verify your internet connection or Gemini API secrets.');
    } finally {
      setLoading(false);
    }
  };

  const starterPrompts = [
    { label: 'Stop Procrastinating', text: "I am procrastinating on an important project. How do I apply the 2-Minute Rule?" },
    { label: 'Active Listening Tips', text: "How can I practice Active Listening during my team's heated standup meeting?" },
    { label: 'Reframe Failure', text: "I just failed an interview. Help me cognitively reframe this with a Growth Mindset." },
    { label: 'Build Focus Block', text: "How do I structure a 90-minute Deep Work block without distractions?" }
  ];

  if (!isPremium) {
    return (
      <div className="bg-white border-4 border-brand-dark rounded-[32px] p-6 text-center relative overflow-hidden shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]" id="coach-section">
        {/* Border strip */}
        <div className="absolute top-0 left-0 w-full h-2 bg-brand-orange border-b-2 border-brand-dark" />
        
        <div className="max-w-md mx-auto py-6">
          <div className="w-16 h-16 bg-brand-yellow border-2 border-brand-dark rounded-2xl flex items-center justify-center mx-auto text-brand-dark mb-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <Bot className="w-9 h-9" />
          </div>

          <span className="bg-[#FFF4E5] text-brand-orange text-xs font-black px-3 py-1 rounded-full border-2 border-brand-dark uppercase tracking-widest">
            Premium Pro Feature
          </span>

          <h3 className="text-2xl font-black text-brand-dark mt-4 tracking-tight uppercase">AI Growth Consultant</h3>
          <p className="text-xs font-bold text-brand-dark/60 uppercase mt-1">Reframing EQ and Compounding Mindsets</p>
          <p className="text-sm font-medium text-brand-dark/80 mt-3 leading-relaxed">
            Unlock direct chat counseling with a hyper-personalized Growth Coach, powered by Google Gemini. Get tailored advice, habit stacking feedback, and mindset checks instantly.
          </p>

          <div className="mt-6 bg-[#F0F2F5] border-2 border-brand-dark rounded-2xl p-4 text-left space-y-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex gap-2.5 items-start text-xs font-bold text-brand-dark">
              <ShieldCheck className="w-4 h-4 text-brand-blue shrink-0 mt-0.5" />
              <span><strong>Unlimited Coaching:</strong> Direct, 24/7 personal chat support</span>
            </div>
            <div className="flex gap-2.5 items-start text-xs font-bold text-brand-dark">
              <BrainCircuit className="w-4 h-4 text-brand-blue shrink-0 mt-0.5" />
              <span><strong>Uncapped AI Flashcards:</strong> Generate custom cards on any niche skill</span>
            </div>
            <div className="flex gap-2.5 items-start text-xs font-bold text-brand-dark">
              <Zap className="w-4 h-4 text-brand-blue shrink-0 mt-0.5" />
              <span><strong>Bonus XP:</strong> Receive +300 XP premium activation bonus</span>
            </div>
          </div>

          <button
            onClick={onUpgradeToPremium}
            className="w-full mt-6 py-3.5 bg-brand-orange hover:bg-brand-orange/90 text-white border-2 border-brand-dark rounded-xl font-black text-sm transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-2 cursor-pointer active:translate-y-0.5"
          >
            <Sparkles className="w-4 h-4" />
            Activate Premium (Free Mock Trial)
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border-4 border-brand-dark rounded-[32px] flex flex-col h-[480px] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden" id="coach-section">
      {/* Header */}
      <div className="p-4 border-b-2 border-brand-dark bg-[#FFF4E5] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-brand-yellow border-2 border-brand-dark rounded-xl text-brand-dark shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-black text-brand-dark uppercase flex items-center gap-1.5 leading-none">
              Growth Consultant
              <span className="bg-brand-orange text-white border border-brand-dark text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider scale-90">
                PRO
              </span>
            </h3>
            <p className="text-[10px] font-bold text-brand-dark/60 uppercase mt-0.5">Consultant is ready to solve objectives</p>
          </div>
        </div>

        {offlineMode && (
          <span className="text-[9px] bg-brand-orange text-white border-2 border-brand-dark px-2 py-0.5 rounded-full font-black tracking-wider font-mono uppercase">
            OFFLINE
          </span>
        )}
      </div>

      {/* Messages viewport */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 custom-scrollbar bg-brand-light">
        {messages.map((m, idx) => (
          <div key={idx} className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : ''}`}>
            {m.role === 'assistant' && (
              <div className="w-7 h-7 bg-brand-yellow border-2 border-brand-dark rounded-lg flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-brand-dark" />
              </div>
            )}
            <div
              className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed border-2 border-brand-dark shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
                m.role === 'user'
                  ? 'bg-brand-blue text-white rounded-tr-none font-black'
                  : 'bg-white text-brand-dark rounded-tl-none font-medium'
              }`}
            >
              {m.content}
            </div>
            {m.role === 'user' && (
              <div className="w-7 h-7 bg-brand-blue border-2 border-brand-dark rounded-lg flex items-center justify-center shrink-0">
                <User className="w-4 h-4 text-white" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 items-center">
            <div className="w-7 h-7 bg-brand-yellow border-2 border-brand-dark rounded-lg flex items-center justify-center shrink-0 animate-pulse">
              <Bot className="w-4 h-4 text-brand-dark" />
            </div>
            <div className="bg-white text-brand-dark border-2 border-brand-dark rounded-2xl rounded-tl-none px-3.5 py-2.5 text-xs flex items-center gap-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-brand-orange rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-brand-orange rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-brand-orange rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="italic font-bold ml-1 text-brand-dark/70">{loadingMsg}</span>
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 bg-white border-2 border-brand-dark rounded-xl text-brand-orange text-xs flex gap-2 items-start shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-brand-orange" />
            <span className="font-bold uppercase text-[10px]">{errorMsg}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Starter quick links */}
      {messages.length === 1 && !loading && (
        <div className="p-3 border-t-2 border-brand-dark bg-brand-light">
          <p className="text-[10px] text-brand-dark/60 uppercase tracking-wider font-black mb-1.5">Coach Topics</p>
          <div className="flex flex-wrap gap-1.5">
            {starterPrompts.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(p.text)}
                disabled={offlineMode}
                className="px-2.5 py-1.5 bg-[#FFF4E5] hover:bg-brand-yellow border-2 border-brand-dark rounded-xl text-[10px] text-brand-dark font-black uppercase transition cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input controls */}
      <div className="p-3 bg-[#F0F2F5] border-t-2 border-brand-dark">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading || offlineMode}
            placeholder={offlineMode ? 'Re-enable online mode to chat...' : 'Ask your growth coach anything...'}
            className="flex-1 bg-white border-2 border-brand-dark focus:bg-brand-light text-brand-dark text-xs rounded-xl px-3.5 py-2.5 outline-none placeholder-brand-dark/50 disabled:opacity-50 font-black"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading || offlineMode}
            className="p-2.5 bg-brand-orange hover:bg-brand-orange/90 disabled:bg-brand-dark/20 text-white disabled:text-brand-dark/40 border-2 border-brand-dark rounded-xl transition cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
