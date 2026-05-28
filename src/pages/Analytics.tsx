import React, { useMemo } from 'react';
import {
  ArrowLeft, TrendingUp, AlertTriangle, Gauge, Moon, Route,
  Clock, ChevronRight, BarChart2, Shield,
} from 'lucide-react';
import { GlassCard } from '@/components/safedrive/GlassCard';
import { useApp } from '@/contexts/AppContext';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, ReferenceLine,
} from 'recharts';

// ── Score ring ──────────────────────────────────────────────────────────
const RING_R = 40;
const RING_C = 2 * Math.PI * RING_R;

const ScoreRing: React.FC<{ score: number }> = ({ score }) => {
  const clampedScore = Math.min(100, Math.max(0, score));
  const offset = RING_C - (clampedScore / 100) * RING_C;
  const color = clampedScore >= 85 ? '#00FF99' : clampedScore >= 70 ? '#FFC107' : '#FF3B30';

  return (
    <div className="relative w-20 h-20 mx-auto shrink-0">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={RING_R} stroke="rgba(255,255,255,0.08)" strokeWidth="7" fill="none" />
        <circle
          cx="50" cy="50" r={RING_R}
          stroke={color} strokeWidth="7" fill="none"
          strokeLinecap="round"
          strokeDasharray={RING_C}
          strokeDashoffset={offset}
          style={{ filter: `drop-shadow(0 0 5px ${color})`, transition: 'stroke-dashoffset 1.2s ease-out' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold stat-value leading-none" style={{ color }}>
          {Number.isFinite(clampedScore) ? clampedScore.toFixed(1) : '--'}
        </span>
        <span className="text-[8px] text-white/40 mt-0.5">score</span>
      </div>
    </div>
  );
};

// ── Stat tile ───────────────────────────────────────────────────────────
interface StatTileProps {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  danger?: boolean;
  warn?: boolean;
}
const StatTile: React.FC<StatTileProps> = ({ icon, value, label, danger, warn }) => {
  const valColor = danger ? 'text-danger-red' : warn ? 'text-amber-warning' : 'text-white';
  return (
    <GlassCard className="p-3 flex flex-col min-w-0">
      <div className="mb-1.5 shrink-0">{icon}</div>
      <p className={`text-xl font-bold stat-value leading-none truncate ${valColor}`}>{value}</p>
      <p className="text-[10px] text-white/40 mt-1 leading-snug truncate">{label}</p>
    </GlassCard>
  );
};

// ── Main ─────────────────────────────────────────────────────────────────
const Analytics: React.FC = () => {
  const { state, navigate } = useApp();
  const { driveLogs, analyticsData } = state;

  // Derived stats — always computed from driveLogs, never from stale floats
  const computed = useMemo(() => {
    if (!driveLogs || driveLogs.length === 0) {
      return {
        totalDrives: 0,
        totalSafeKm: 0,
        avgScore: 0,
        overspeedAlerts: 0,
        harshBraking: 0,
        drowsinessReports: 0,
        hasData: false,
      };
    }
    const totalDrives = driveLogs.length;
    // Round to 1 decimal, avoid floating point chain errors
    const rawKm = driveLogs.reduce((sum, l) => sum + l.distance, 0);
    const totalSafeKm = Math.round(rawKm * 10) / 10;
    const rawAvg = driveLogs.reduce((sum, l) => sum + l.score, 0) / totalDrives;
    const avgScore = Math.round(rawAvg * 10) / 10;
    const overspeedAlerts = driveLogs.reduce((sum, l) => sum + (l.overspeedCount ?? l.alerts.filter(a => a.toLowerCase().includes('speed')).length), 0);
    const harshBraking = driveLogs.reduce((sum, l) => sum + l.harshBraking, 0);
    const drowsinessReports = driveLogs.reduce((sum, l) => sum + (l.drowsinessCount ?? 0), 0);

    return { totalDrives, totalSafeKm, avgScore, overspeedAlerts, harshBraking, drowsinessReports, hasData: true };
  }, [driveLogs]);

  const tooltipStyle = {
    contentStyle: {
      backgroundColor: 'rgba(0,0,0,0.92)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: '8px',
      fontSize: '11px',
    },
    labelStyle: { color: 'rgba(255,255,255,0.5)' },
  };

  // Safe KM display — always clean
  const safeKmDisplay = Number.isInteger(computed.totalSafeKm)
    ? computed.totalSafeKm.toString()
    : computed.totalSafeKm.toFixed(1);

  const avgScoreDisplay = Number.isInteger(computed.avgScore)
    ? computed.avgScore.toString()
    : computed.avgScore.toFixed(1);

  // Week trend from analyticsData (seeded) merged with real logs
  const weeklyData = analyticsData.weeklyScores;

  // Recent logs for history list
  const recentLogs = driveLogs.slice(0, 6);

  return (
    <div className="min-h-screen bg-black pb-24 pt-4 px-4 screen-enter">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => navigate('home')} className="w-9 h-9 rounded-lg glass-card flex items-center justify-center shrink-0">
          <ArrowLeft size={18} className="text-white/70" />
        </button>
        <h1 className="text-lg font-bold text-white truncate">Analytics & Logs</h1>
      </div>

      {/* ── Empty state ── */}
      {!computed.hasData && (
        <GlassCard className="py-12 text-center mb-4">
          <BarChart2 size={36} className="text-white/20 mx-auto mb-3" />
          <p className="text-sm font-medium text-white/50">No driving data available yet.</p>
          <p className="text-xs text-white/30 mt-1">Complete a drive session to see analytics.</p>
        </GlassCard>
      )}

      {/* ── Weekly Overview Header ── */}
      {computed.hasData && (
        <GlassCard strong neon className="mb-4 p-4">
          <div className="flex items-center gap-4">
            <ScoreRing score={computed.avgScore} />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-white/40 uppercase tracking-wider mb-2">Weekly Average Score</p>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="min-w-0">
                  <p className="text-base font-bold text-white stat-value truncate">{computed.totalDrives}</p>
                  <p className="text-[9px] text-white/40">drives</p>
                </div>
                <div className="min-w-0">
                  <p className="text-base font-bold text-amber-warning stat-value truncate">{computed.overspeedAlerts}</p>
                  <p className="text-[9px] text-white/40">alerts</p>
                </div>
                <div className="min-w-0">
                  <p className="text-base font-bold text-ai-blue stat-value truncate">{safeKmDisplay}</p>
                  <p className="text-[9px] text-white/40">safe km</p>
                </div>
              </div>
            </div>
          </div>
        </GlassCard>
      )}

      {/* ── Quick Stats Grid ── */}
      {computed.hasData && (
        <div className="grid grid-cols-2 gap-3 mb-4">
          <StatTile
            icon={<AlertTriangle size={14} className="text-amber-warning" />}
            value={computed.overspeedAlerts}
            label="Overspeed Alerts"
            warn
          />
          <StatTile
            icon={<Gauge size={14} className="text-danger-red" />}
            value={computed.harshBraking}
            label="Harsh Braking"
            danger
          />
          <StatTile
            icon={<Moon size={14} className="text-ai-blue" />}
            value={computed.drowsinessReports}
            label="Drowsiness Reports"
          />
          <StatTile
            icon={<Route size={14} className="text-neon-green" />}
            value={`${safeKmDisplay} km`}
            label="Safe KM Total"
          />
        </div>
      )}

      {/* ── Weekly Score Chart ── */}
      {computed.hasData && (
        <GlassCard className="mb-4 p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-white">Weekly Safety Scores</p>
            <div className="flex items-center gap-1">
              <TrendingUp size={12} className="text-neon-green" />
              <span className="text-[10px] text-neon-green">{avgScoreDisplay}/100</span>
            </div>
          </div>
          <div className="h-40 w-full min-w-0 overflow-hidden">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="day" stroke="rgba(255,255,255,0.25)" fontSize={10} tickLine={false} />
                <YAxis domain={[60, 100]} stroke="rgba(255,255,255,0.25)" fontSize={10} tickLine={false} />
                <ReferenceLine y={85} stroke="rgba(0,255,153,0.2)" strokeDasharray="4 4" />
                <Tooltip {...tooltipStyle} itemStyle={{ color: '#00FF99' }} formatter={(v: number) => [v.toFixed(1), 'Score']} />
                <Line
                  type="monotone" dataKey="score" stroke="#00FF99" strokeWidth={2.5}
                  dot={{ fill: '#00FF99', r: 3, strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: '#00FF99', stroke: 'rgba(0,255,153,0.4)', strokeWidth: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      )}

      {/* ── Monthly KM Chart ── */}
      {computed.hasData && (
        <GlassCard className="mb-4 p-4">
          <p className="text-sm font-semibold text-white mb-3">Monthly Safe Kilometers</p>
          <div className="h-36 w-full min-w-0 overflow-hidden">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analyticsData.monthlyKm} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="week" stroke="rgba(255,255,255,0.25)" fontSize={10} tickLine={false} />
                <YAxis stroke="rgba(255,255,255,0.25)" fontSize={10} tickLine={false} />
                <Tooltip {...tooltipStyle} itemStyle={{ color: '#00C2FF' }} formatter={(v: number) => [`${Math.round(v * 10) / 10} km`, 'Distance']} />
                <Bar dataKey="km" fill="url(#blueGrad)" radius={[4, 4, 0, 0]} />
                <defs>
                  <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00C2FF" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#00C2FF" stopOpacity={0.3} />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      )}

      {/* ── Safe vs Risky chart ── */}
      {computed.hasData && (
        <GlassCard className="mb-4 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Shield size={14} className="text-neon-green" />
            <p className="text-sm font-semibold text-white">Safe vs Risky Drives</p>
          </div>
          <div className="flex items-end gap-3">
            {/* Safe */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-neon-green">Safe</span>
                <span className="text-[10px] text-white/50">
                  {driveLogs.filter(l => l.score >= 80).length}
                </span>
              </div>
              <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-neon-green transition-all duration-700"
                  style={{ width: `${computed.totalDrives > 0 ? (driveLogs.filter(l => l.score >= 80).length / computed.totalDrives) * 100 : 0}%` }}
                />
              </div>
            </div>
            {/* Risky */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-danger-red">Risky</span>
                <span className="text-[10px] text-white/50">
                  {driveLogs.filter(l => l.score < 80).length}
                </span>
              </div>
              <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-danger-red transition-all duration-700"
                  style={{ width: `${computed.totalDrives > 0 ? (driveLogs.filter(l => l.score < 80).length / computed.totalDrives) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </GlassCard>
      )}

      {/* ── Recent Drive History ── */}
      <GlassCard className="mb-4 p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-white">Recent Drives</p>
          <Clock size={13} className="text-white/30 shrink-0" />
        </div>

        {recentLogs.length === 0 ? (
          <p className="text-xs text-white/30 text-center py-4">No drives yet. Start a drive to see logs.</p>
        ) : (
          <div className="space-y-2">
            {recentLogs.map((log) => {
              const scoreColor = log.score >= 85 ? 'text-neon-green' : log.score >= 70 ? 'text-amber-warning' : 'text-danger-red';
              // Safe display — clean 1-decimal, no float junk
              const distDisplay = (Math.round(log.distance * 10) / 10).toFixed(1);
              return (
                <div key={log.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5 min-w-0">
                  {/* Score */}
                  <div className="flex flex-col items-center shrink-0 w-10">
                    <div className={`text-sm font-bold stat-value leading-none ${scoreColor}`}>{log.score}</div>
                    <div className="text-[8px] text-white/30 mt-0.5">score</div>
                  </div>
                  <div className="w-px h-8 bg-white/10 shrink-0" />
                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                      <span className="text-xs text-white/80 font-medium">{distDisplay} km</span>
                      <span className="text-[9px] text-white/30">· {log.duration}m</span>
                      {log.alerts.length > 0 && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-danger-red/20 text-danger-red shrink-0">
                          {log.alerts.length} alert{log.alerts.length !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                    <p className="text-[9px] text-white/30 font-mono truncate">
                      {new Date(log.date).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <ChevronRight size={13} className="text-white/20 shrink-0" />
                </div>
              );
            })}
          </div>
        )}
      </GlassCard>
    </div>
  );
};

export default Analytics;
