import React from 'react';

interface VoiceWaveProps {
  active?: boolean;
  color?: string;
}

export const VoiceWave: React.FC<VoiceWaveProps> = ({ active = true, color = '#00FF99' }) => {
  return (
    <div className="flex items-center justify-center gap-1.5 h-8">
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className={`w-1 rounded-full transition-all duration-150 ${active ? 'animate-wave-bar' : 'h-3'}`}
          style={{
            backgroundColor: color,
            height: active ? undefined : '12px',
            animationDelay: `${i * 100}ms`,
            animationDuration: active ? `${0.6 + i * 0.15}s` : undefined,
            opacity: active ? 1 : 0.4,
          }}
        />
      ))}
    </div>
  );
};
