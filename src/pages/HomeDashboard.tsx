import React, { useEffect, useState } from 'react';
import {
  Car,
  Scale,
  Camera,
  BarChart3,
  ShieldCheck,
  Activity,
  AlertTriangle,
  Phone,
  Zap,
  ChevronRight,
  Settings,
  Clock,
  TrendingUp,
  MapPin,
  WifiOff,
} from 'lucide-react';
import { GlassCard } from '@/components/safedrive/GlassCard';
import { VoiceWave } from '@/components/safedrive/VoiceWave';
import { useApp } from '@/contexts/AppContext';
import { useGpsSpeed } from '@/hooks/useGpsSpeed';

function useClock() {
  const [time, setTime] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return time;
}

const HomeDashboard: React.FC = () => {
  const { state, navigate, updateSpeed } = useApp();
  const now = useClock();

  // ── Real GPS speed ──────────────────────────────────────────────────
  const gps = useGpsSpeed();
  const speed = gps.speed;

  // Keep AppContext.currentSpeed in sync
  useEffect(() => {
    updateSpeed(speed);
  }, [speed, updateSpeed]);

  const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  const dateStr = now.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });

  const quickActions = [
    { label: 'Start Drive Mode', icon: Car, screen: 'drive' as const, color: '#00FF99', sub: 'AI HUD + Object Detection' },
    { label: 'Legal Assistant', icon: Scale, screen: 'assistant' as const, color: '#00C2FF', sub: 'AP Traffic Rules' },
    { label: 'Incident Reporter', icon: Camera, screen: 'incident' as const, color: '#FFC107', sub: 'AI Hazard Detection' },
    { label: 'View Analytics', icon: BarChart3, screen: 'analytics' as const, color: '#00FF99', sub: 'Logs & Trends' },
  ];

  const statusWidgets = [
    {
      label: 'Live Speed',
      value: gps.acquiring ? '—' : `${speed}`,
      unit: gps.acquiring ? '' : 'km/h',
      icon: Zap,
      ok: speed <= 80,
    },
    { label: 'Safety Score', value: `${state.drivingScore}`, unit: '/100', icon: ShieldCheck, ok: state.drivingScore >= 80 },
    { label: 'Road Risk', value: speed > 80 ? 'High' : 'Low', unit: '', icon: Activity, ok: speed <= 80 },
    { label: 'Crash Detect', value: 'ON', unit: '', icon: ShieldCheck, ok: true },
    { label: 'SOS Contacts', value: `${state.emergencyContacts.length}`, unit: '/3', icon: Phone, ok: state.emergencyContacts.length > 0 },
    { label: 'Total Drives', value: `${state.analyticsData.totalDrives}`, unit: '', icon: TrendingUp, ok: true },
  ];

  const lastDrive = state.driveLogs[0];

  return (
    <div className="min-h-screen bg-black pb-24 screen-enter">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 pt-5 pb-3">
        <div>
          <h1 className="text-2xl font-bold text-white leading-none">
            SafeDrive <span className="text-neon-green">AI</span>
          </h1>
          <p className="text-[10px] text-white/40 mt-0.5 font-mono">{dateStr}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-lg font-bold text-white font-mono stat-value">{timeStr}</p>
            <div className="flex items-center justify-end gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-neon-green animate-pulse" />
              <p className="text-[9px] text-neon-green">AI ACTIVE</p>
            </div>
          </div>
          <button
            onClick={() => navigate('settings')}
            className="w-9 h-9 rounded-xl glass-card flex items-center justify-center active:scale-90 transition-transform"
          >
            <Settings size={18} className="text-white/60" />
          </button>
        </div>
      </div>

      {/* AI Assistant Strip */}
      <div className="px-4 mb-4">
        <GlassCard strong neon className="p-3.5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-neon-green/20 border border-neon-green/30 flex items-center justify-center shrink-0">
            <Activity size={18} className="text-neon-green" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-white font-semibold">AI Safety Co-pilot Ready</p>
            <p className="text-[10px] text-white/40">Tap to start voice interaction</p>
          </div>
          <VoiceWave active />
        </GlassCard>
      </div>

      {/* GPS Status Strip */}
      <div className="px-4 mb-4">
        {gps.permissionState === 'denied' || gps.permissionState === 'unsupported' ? (
          <GlassCard className="p-2.5 flex items-center gap-2.5">
            <WifiOff size={13} className="text-amber-warning shrink-0" />
            <p className="text-[10px] text-amber-warning leading-snug flex-1 min-w-0">
              {gps.error ?? 'GPS unavailable — speed data not available.'}
            </p>
          </GlassCard>
        ) : gps.acquiring ? (
          <GlassCard className="p-2.5 flex items-center gap-2.5">
            <div className="w-1.5 h-1.5 rounded-full bg-ai-blue animate-pulse shrink-0" />
            <p className="text-[10px] text-ai-blue">Acquiring GPS signal…</p>
          </GlassCard>
        ) : (
          <GlassCard className="p-2.5 flex items-center gap-2.5">
            <MapPin size={12} className="text-neon-green shrink-0" />
            <p className="text-[10px] text-neon-green">
              GPS Active
              {gps.accuracy !== null && (
                <span className="text-white/30 ml-1">· ±{gps.accuracy}m accuracy</span>
              )}
            </p>
            <div className="ml-auto flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-neon-green animate-pulse" />
              <span className="text-[9px] text-neon-green font-mono">LIVE</span>
            </div>
          </GlassCard>
        )}
      </div>

      {/* Status Widgets */}
      <div className="px-4 mb-4">
        <div className="grid grid-cols-3 gap-2">
          {statusWidgets.map((w) => {
            const Icon = w.icon;
            return (
              <GlassCard key={w.label} className="p-3">
                <Icon size={13} className={w.ok ? 'text-neon-green mb-1.5' : 'text-danger-red mb-1.5'} />
                <p className={`text-base font-bold stat-value leading-none ${w.ok ? 'text-white' : 'text-danger-red'}`}>
                  {w.value}<span className="text-[10px] text-white/30 font-normal">{w.unit}</span>
                </p>
                <p className="text-[9px] text-white/40 mt-0.5 leading-tight">{w.label}</p>
              </GlassCard>
            );
          })}
        </div>
      </div>

      {/* Last Drive Card */}
      {lastDrive && (
        <div className="px-4 mb-4">
          <GlassCard className="p-4">
            <div className="flex items-center gap-2 mb-2.5">
              <Clock size={13} className="text-ai-blue" />
              <span className="text-[10px] text-white/50 uppercase tracking-wider">Last Drive</span>
              <span className="text-[10px] text-white/30 ml-auto">
                {new Date(lastDrive.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-xl font-bold text-white stat-value">{lastDrive.distance.toFixed(1)}</p>
                <p className="text-[9px] text-white/40">km</p>
              </div>
              <div className="flex-1 h-px bg-white/10" />
              <div className="text-center">
                <p className={`text-xl font-bold stat-value ${lastDrive.score >= 85 ? 'text-neon-green' : lastDrive.score >= 70 ? 'text-amber-warning' : 'text-danger-red'}`}>{lastDrive.score}</p>
                <p className="text-[9px] text-white/40">score</p>
              </div>
              <div className="flex-1 h-px bg-white/10" />
              <div className="text-center">
                <p className="text-xl font-bold text-white stat-value">{lastDrive.alerts.length}</p>
                <p className="text-[9px] text-white/40">alerts</p>
              </div>
              <div className="flex-1 h-px bg-white/10" />
              <div className="text-center">
                <p className="text-xl font-bold text-white stat-value">{lastDrive.duration}m</p>
                <p className="text-[9px] text-white/40">duration</p>
              </div>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Safe KM Bar */}
      <div className="px-4 mb-4">
        <GlassCard strong className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-white/50 uppercase tracking-wider">Safe Km Total</span>
            <span className="text-neon-green text-sm font-bold stat-value">{state.safeKm} km</span>
          </div>
          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-neon-green to-ai-blue rounded-full transition-all duration-700"
              style={{ width: `${Math.min((state.safeKm / 300) * 100, 100)}%` }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[9px] text-white/20">0</span>
            <span className="text-[9px] text-white/20">300 km goal</span>
          </div>
        </GlassCard>
      </div>

      {/* Quick Actions */}
      <div className="px-4">
        <h2 className="text-[10px] font-semibold text-white/50 uppercase tracking-wider mb-3">Quick Actions</h2>
        <div className="space-y-2">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.label}
                onClick={() => navigate(action.screen)}
                className="w-full glass-card p-3.5 flex items-center gap-3.5 active:scale-[0.98] transition-transform"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${action.color}18`, border: `1px solid ${action.color}30` }}
                >
                  <Icon size={20} style={{ color: action.color }} />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-semibold text-white">{action.label}</p>
                  <p className="text-[10px] text-white/40">{action.sub}</p>
                </div>
                <ChevronRight size={15} className="text-white/20" />
              </button>
            );
          })}
        </div>
      </div>

      {/* Alerts row */}
      {state.alerts.length > 0 && (
        <div className="px-4 mt-4">
          <GlassCard danger className="p-3.5">
            <div className="flex items-center gap-2 mb-1.5">
              <AlertTriangle size={14} className="text-danger-red" />
              <span className="text-xs font-semibold text-danger-red">Active Alerts ({state.alerts.length})</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {state.alerts.map((a, i) => (
                <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-danger-red/20 text-danger-red border border-danger-red/30">{a}</span>
              ))}
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
};

export default HomeDashboard;
