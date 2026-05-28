import React from 'react';
import { Home, Car, Eye, MessageSquare, BarChart3 } from 'lucide-react';
import { useApp, type Screen } from '@/contexts/AppContext';

interface NavItem {
  screen: Screen;
  label: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { screen: 'home',      label: 'Home',      icon: Home },
  { screen: 'drive',     label: 'Drive',     icon: Car },
  { screen: 'monitor',   label: 'Monitor',   icon: Eye },
  { screen: 'assistant', label: 'Assistant', icon: MessageSquare },
  { screen: 'analytics', label: 'Analytics', icon: BarChart3 },
];

export const BottomNav: React.FC = () => {
  const { state, navigate } = useApp();

  const isActive = (screen: Screen) =>
    screen === 'home'
      ? state.currentScreen === 'home' || state.currentScreen === 'splash'
      : state.currentScreen === screen;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 h-16 border-t border-white/10 backdrop-blur-xl"
         style={{ background: 'rgba(0,0,0,0.92)' }}>
      <div className="flex items-center justify-around h-full max-w-lg mx-auto px-1">
        {navItems.map((item) => {
          const active = isActive(item.screen);
          const Icon = item.icon;
          return (
            <button
              key={item.screen}
              onClick={() => navigate(item.screen)}
              className={`relative flex flex-col items-center justify-center gap-0.5 w-16 h-full transition-all duration-200 active:scale-90 ${
                active ? 'text-neon-green' : 'text-white/35 hover:text-white/60'
              }`}
            >
              {/* Active pill background */}
              {active && (
                <span className="absolute inset-x-2 top-2 bottom-2 rounded-xl bg-neon-green/10 -z-10" />
              )}
              {/* Active top line */}
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-neon-green rounded-full shadow-[0_0_6px_rgba(0,255,153,0.8)]" />
              )}
              <Icon
                size={22}
                strokeWidth={active ? 2.5 : 1.5}
                className={active ? 'drop-shadow-[0_0_6px_rgba(0,255,153,0.6)]' : ''}
              />
              <span className={`text-[9px] font-semibold tracking-wide ${active ? 'text-neon-green' : ''}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
