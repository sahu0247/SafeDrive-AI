import React, { useEffect, useState } from 'react';
import { Shield, Activity } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';

const SplashScreen: React.FC = () => {
  const { state, navigate } = useApp();
  const [progress, setProgress] = useState(0);
  const [taglineVisible, setTaglineVisible] = useState(false);

  useEffect(() => {
    const taglineTimer = setTimeout(() => setTaglineVisible(true), 800);
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return Math.min(prev + Math.random() * 15 + 5, 100);
      });
    }, 300);

    const navTimer = setTimeout(() => {
      // Route to onboarding if setup not yet complete, else go home
      if (state.userProfile.onboardingComplete) {
        navigate('home');
      } else {
        navigate('onboarding');
      }
    }, 3000);

    return () => {
      clearTimeout(taglineTimer);
      clearInterval(progressInterval);
      clearTimeout(navTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clampedProgress = Math.min(progress, 100);

  return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center z-50">
      <div className="relative mb-8">
        <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/20 flex items-center justify-center animate-pulse-glow">
          <Shield size={48} className="text-neon-green" strokeWidth={1.5} />
        </div>
        <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-neon-green flex items-center justify-center">
          <Activity size={14} className="text-black" />
        </div>
      </div>

      <h1 className="text-3xl font-bold text-white tracking-tight mb-2">
        SafeDrive <span className="text-neon-green">AI</span>
      </h1>

      <div
        className={`transition-all duration-700 text-center px-8 ${
          taglineVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        <p className="text-white/70 text-sm mb-6 leading-relaxed text-pretty">
          Your Phone Becomes Your Smartest Driving Companion
        </p>
        <p className="text-ai-blue text-xs font-mono tracking-wider mb-8">
          Initializing AI Safety Systems...
        </p>
      </div>

      <div className="w-64 h-1 bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full bg-neon-green rounded-full transition-all duration-300 ease-out"
          style={{ width: `${clampedProgress}%` }}
        />
      </div>

      <div className="mt-3 text-xs text-white/40 font-mono">
        {Math.round(clampedProgress)}%
      </div>

      <div className="absolute bottom-8 flex gap-2">
        <div className="w-2 h-2 rounded-full bg-neon-green animate-bounce-subtle" />
        <div className="w-2 h-2 rounded-full bg-ai-blue animate-bounce-subtle" style={{ animationDelay: '0.2s' }} />
        <div className="w-2 h-2 rounded-full bg-neon-green animate-bounce-subtle" style={{ animationDelay: '0.4s' }} />
      </div>
    </div>
  );
};

export default SplashScreen;
