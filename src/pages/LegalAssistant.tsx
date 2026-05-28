import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Mic, Send, Scale, User } from 'lucide-react';
import { GlassCard } from '@/components/safedrive/GlassCard';
import { VoiceWave } from '@/components/safedrive/VoiceWave';
import { useApp } from '@/contexts/AppContext';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  rule?: string;
  fine?: string;
  advice?: string;
}

interface TrafficRule {
  keyword: string;
  rule: string;
  fine: string;
  advice: string;
}

const trafficRules: TrafficRule[] = [
  {
    keyword: 'helmet',
    rule: 'Wearing a helmet is mandatory for both rider and pillion on two-wheelers as per Andhra Pradesh Motor Vehicles Act.',
    fine: '₹1,000 for first offense, ₹2,000 for repeat offense',
    advice: 'Always wear ISI-certified helmets. Ensure the pillion rider also wears one. It reduces head injury risk by 70%.',
  },
  {
    keyword: 'triple',
    rule: 'Maximum two persons are allowed on a two-wheeler including the rider. Triple riding is prohibited.',
    fine: '₹1,000',
    advice: 'Never carry more than one pillion. It affects vehicle balance, braking distance, and is a major cause of accidents.',
  },
  {
    keyword: 'mobile',
    rule: 'Using handheld mobile phones while driving is strictly prohibited. This includes calls, texting, or using apps.',
    fine: '₹1,500',
    advice: 'Use hands-free devices or park safely before using your phone. A 2-second distraction at 60 km/h means 33 meters of blind driving.',
  },
  {
    keyword: 'school',
    rule: 'Speed limit in school zones is restricted to 25 km/h during operational hours for child safety.',
    fine: '₹2,000',
    advice: 'Always reduce speed near schools. Children can be unpredictable. Watch for crossing guards and school buses.',
  },
  {
    keyword: 'seatbelt',
    rule: 'Wearing seatbelts is mandatory for all occupants in a motor vehicle in Andhra Pradesh.',
    fine: '₹1,000',
    advice: 'Buckle up before starting the engine. Seatbelts reduce fatal injury risk by 45% and moderate-to-critical injuries by 50%.',
  },
  {
    keyword: 'drunk',
    rule: 'Driving under the influence of alcohol or drugs is a serious offense with strict penalties.',
    fine: '₹10,000 and/or imprisonment up to 6 months for first offense',
    advice: 'Never drink and drive. Use cab services or designate a sober driver. Even small amounts of alcohol impair judgment.',
  },
];

const initialMessages: ChatMessage[] = [
  {
    id: 'welcome',
    role: 'assistant',
    content: 'Hello! I am your SafeDrive AI Legal Assistant. I can help you understand Andhra Pradesh traffic rules, fines, and safety advice. Ask me about helmet fines, triple riding, mobile usage, school zones, and more.',
  },
];

const LegalAssistant: React.FC = () => {
  const { navigate } = useApp();
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const findRule = (query: string): TrafficRule | undefined => {
    const lower = query.toLowerCase();
    return trafficRules.find((r) => lower.includes(r.keyword));
  };

  const handleSend = () => {
    if (!input.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');

    setTimeout(() => {
      const rule = findRule(input);
      if (rule) {
        const assistantMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `Here's what I found about ${rule.keyword} violations:`,
          rule: rule.rule,
          fine: rule.fine,
          advice: rule.advice,
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } else {
        const assistantMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'I can help with: helmet fines, triple riding, mobile usage while driving, school zone speed limits, seatbelt rules, and drunk driving penalties. Please ask about one of these topics.',
        };
        setMessages((prev) => [...prev, assistantMsg]);
      }
    }, 800);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSend();
  };

  const handleMic = () => {
    setIsListening(true);
    setTimeout(() => {
      setIsListening(false);
      setInput('What is the fine for not wearing a helmet?');
    }, 2000);
  };

  const suggestions = ['Helmet fine', 'Triple riding', 'Mobile usage', 'School zone'];

  return (
    <div className="min-h-screen bg-black flex flex-col pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-white/10">
        <button onClick={() => navigate('home')} className="w-9 h-9 rounded-lg glass-card flex items-center justify-center">
          <ArrowLeft size={18} className="text-white/70" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-white flex items-center gap-2">
            <Scale size={18} className="text-ai-blue" />
            Legal Assistant
          </h1>
          <p className="text-[10px] text-white/50">AP Traffic Rules & Compliance</p>
        </div>
      </div>

      {/* Chat Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
              msg.role === 'assistant' ? 'bg-ai-blue/20' : 'bg-neon-green/20'
            }`}>
              {msg.role === 'assistant' ? (
                <Scale size={14} className="text-ai-blue" />
              ) : (
                <User size={14} className="text-neon-green" />
              )}
            </div>
            <div className={`max-w-[80%] ${msg.role === 'user' ? 'text-right' : ''}`}>
              {msg.role === 'assistant' && msg.rule ? (
                <GlassCard className="text-left">
                  <p className="text-sm text-white/90 mb-3">{msg.content}</p>
                  <div className="space-y-2.5">
                    <div className="p-2.5 rounded-lg bg-white/5">
                      <p className="text-[10px] text-ai-blue uppercase tracking-wider mb-1">Rule</p>
                      <p className="text-xs text-white/80">{msg.rule}</p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-white/5">
                      <p className="text-[10px] text-danger-red uppercase tracking-wider mb-1">Fine Amount</p>
                      <p className="text-sm font-bold text-danger-red">{msg.fine}</p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-white/5">
                      <p className="text-[10px] text-neon-green uppercase tracking-wider mb-1">Safety Advice</p>
                      <p className="text-xs text-white/80">{msg.advice}</p>
                    </div>
                  </div>
                </GlassCard>
              ) : (
                <div className={`inline-block px-4 py-2.5 rounded-2xl text-sm ${
                  msg.role === 'assistant'
                    ? 'bg-white/10 text-white/90 rounded-tl-none'
                    : 'bg-neon-green/20 text-white rounded-tr-none'
                }`}>
                  {msg.content}
                </div>
              )}
            </div>
          </div>
        ))}

        {isListening && (
          <div className="flex justify-center">
            <VoiceWave active color="#00C2FF" />
          </div>
        )}
      </div>

      {/* Suggestions */}
      <div className="px-4 pb-2 flex gap-2 overflow-x-auto">
        {suggestions.map((s) => (
          <button
            key={s}
            onClick={() => { setInput(s); }}
            className="px-3 py-1.5 rounded-full text-xs bg-white/5 text-white/60 border border-white/10 whitespace-nowrap active:bg-white/10"
          >
            {s}
          </button>
        ))}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-2 glass-card p-2">
          <button
            onClick={handleMic}
            className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-colors ${
              isListening ? 'bg-ai-blue/30' : 'bg-white/5'
            }`}
          >
            <Mic size={18} className={isListening ? 'text-ai-blue' : 'text-white/50'} />
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about AP traffic rules..."
            className="flex-1 bg-transparent text-sm text-white placeholder-white/30 outline-none"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="w-9 h-9 rounded-full bg-neon-green flex items-center justify-center disabled:opacity-30 active:scale-95 transition-transform"
          >
            <Send size={16} className="text-black" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default LegalAssistant;
