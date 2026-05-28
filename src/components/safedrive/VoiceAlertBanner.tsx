import React, { useEffect, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { VoiceWave } from './VoiceWave';

interface VoiceAlertBannerProps {
  message: string | null;
  onDismiss?: () => void;
  autoDismissMs?: number;
  severity?: 'warning' | 'danger' | 'info';
}

export const VoiceAlertBanner: React.FC<VoiceAlertBannerProps> = ({
  message,
  onDismiss,
  autoDismissMs = 4000,
  severity = 'danger',
}) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (message) {
      setVisible(true);
      const t = setTimeout(() => {
        setVisible(false);
        onDismiss?.();
      }, autoDismissMs);
      return () => clearTimeout(t);
    } else {
      setVisible(false);
    }
  }, [message, autoDismissMs, onDismiss]);

  if (!visible || !message) return null;

  const colors = {
    danger: { border: 'border-danger-red/50', bg: 'bg-danger-red/10', icon: 'text-danger-red', wave: '#FF3B30' },
    warning: { border: 'border-amber-warning/50', bg: 'bg-amber-warning/10', icon: 'text-amber-warning', wave: '#FFC107' },
    info: { border: 'border-ai-blue/50', bg: 'bg-ai-blue/10', icon: 'text-ai-blue', wave: '#00C2FF' },
  };
  const c = colors[severity];

  return (
    <div
      className={`alert-slide mx-4 mt-3 rounded-xl border ${c.border} ${c.bg} p-3 flex items-center gap-3`}
    >
      <AlertTriangle size={20} className={`${c.icon} shrink-0 animate-bounce-subtle`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white font-semibold truncate">{message}</p>
        <p className="text-[10px] text-white/40 mt-0.5">AI Voice Alert Active</p>
      </div>
      <VoiceWave active color={c.wave} />
      <button
        onClick={() => { setVisible(false); onDismiss?.(); }}
        className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center shrink-0"
      >
        <X size={12} className="text-white/60" />
      </button>
    </div>
  );
};
