import React from 'react';
import { ArrowLeft, Route, Shield, AlertTriangle, Bell, MessageSquare, MapPin } from 'lucide-react';
import { GlassCard } from '@/components/safedrive/GlassCard';
import { useApp } from '@/contexts/AppContext';
import { MapContainer, TileLayer, Polyline, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default Leaflet marker icons broken by bundlers
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Auto-fit map to the polyline bounds
function FitBounds({ positions }: { positions: [number, number][] }) {
  const map = useMap();
  React.useEffect(() => {
    if (positions.length >= 2) {
      map.fitBounds(L.latLngBounds(positions), { padding: [24, 24] });
    } else if (positions.length === 1) {
      map.setView(positions[0], 15);
    }
  }, [map, positions]);
  return null;
}

const DriveSummary: React.FC = () => {
  const { state, navigate } = useApp();
  const { driveSession } = state;

  // Use last saved log's routePath (most recent drive) or session path
  const lastLog = state.driveLogs[0];
  const routePath: Array<{ lat: number; lng: number }> =
    driveSession.routePath.length > 0
      ? driveSession.routePath
      : (lastLog?.routePath ?? []);

  const positions: [number, number][] = routePath.map((p) => [p.lat, p.lng]);
  const hasRoute = positions.length >= 2;
  const startPos = positions[0];
  const endPos   = positions[positions.length - 1];

  const getFeedback = (score: number) => {
    if (score >= 90) return 'Excellent driving! Your awareness and control were outstanding. Keep it up!';
    if (score >= 80) return 'Good drive overall. Watch your speed in high-traffic zones and maintain safe following distances.';
    if (score >= 70) return 'Fair drive. Several alerts were triggered. Please stay more focused and avoid sudden braking.';
    return 'Multiple safety alerts detected. Consider taking a defensive driving refresher course.';
  };

  const scoreColor = driveSession.alertsTriggered === 0 ? 'text-neon-green' : driveSession.alertsTriggered <= 2 ? 'text-amber-warning' : 'text-danger-red';

  return (
    <div className="min-h-screen bg-black pb-24 pt-4 px-4 screen-enter">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('home')} className="w-9 h-9 rounded-lg glass-card flex items-center justify-center">
          <ArrowLeft size={18} className="text-white/70" />
        </button>
        <h1 className="text-xl font-bold text-white">Drive Summary</h1>
      </div>

      {/* Score Card */}
      <GlassCard strong neon className="mb-5 text-center py-8">
        <div className="w-24 h-24 mx-auto rounded-full border-4 border-neon-green/30 flex items-center justify-center mb-4 relative">
          <div className="absolute inset-0 rounded-full border-4 border-neon-green animate-pulse-glow" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 60%, 0 60%)' }} />
          <Shield size={36} className="text-neon-green" />
        </div>
        <p className={`text-4xl font-bold ${scoreColor} stat-value`}>
          {Math.round(state.drivingScore)}
        </p>
        <p className="text-sm text-white/60 mt-1">Safety Score</p>
      </GlassCard>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <GlassCard className="p-4">
          <Route size={18} className="text-ai-blue mb-2" />
          <p className="text-2xl font-bold text-white stat-value">{(Math.round(driveSession.distance * 10) / 10).toFixed(1)}</p>
          <p className="text-xs text-white/50">km driven</p>
        </GlassCard>
        <GlassCard className="p-4">
          <AlertTriangle size={18} className="text-amber-warning mb-2" />
          <p className="text-2xl font-bold text-white stat-value">{driveSession.harshBraking}</p>
          <p className="text-xs text-white/50">harsh braking</p>
        </GlassCard>
        <GlassCard className="p-4">
          <Bell size={18} className="text-danger-red mb-2" />
          <p className="text-2xl font-bold text-white stat-value">{driveSession.alertsTriggered}</p>
          <p className="text-xs text-white/50">alerts triggered</p>
        </GlassCard>
        <GlassCard className="p-4">
          <Shield size={18} className="text-neon-green mb-2" />
          <p className="text-2xl font-bold text-white stat-value">{(Math.round(state.safeKm * 10) / 10).toFixed(1)}</p>
          <p className="text-xs text-white/50">safe km total</p>
        </GlassCard>
      </div>

      {/* Route Map */}
      {hasRoute ? (
        <GlassCard className="mb-5 overflow-hidden p-0">
          <div className="flex items-center gap-2 px-4 pt-3 pb-2">
            <MapPin size={14} className="text-ai-blue" />
            <span className="text-sm font-semibold text-white">GPS Route</span>
            <span className="text-[10px] text-white/40 ml-auto">{positions.length} points recorded</span>
          </div>
          <div style={{ height: 220, width: '100%' }}>
            <MapContainer
              center={startPos ?? [17.4065, 78.4772]}
              zoom={14}
              style={{ height: '100%', width: '100%', background: '#111' }}
              zoomControl={false}
              attributionControl={false}
            >
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://carto.com/">CARTO</a>'
              />
              <Polyline
                positions={positions}
                pathOptions={{ color: '#00FF99', weight: 4, opacity: 0.9 }}
              />
              {startPos && (
                <Marker position={startPos} />
              )}
              {endPos && endPos !== startPos && (
                <Marker position={endPos} />
              )}
              <FitBounds positions={positions} />
            </MapContainer>
          </div>
          <div className="flex justify-between px-4 py-2">
            <span className="text-[9px] text-neon-green font-mono">● Start</span>
            <span className="text-[9px] text-ai-blue font-mono">● End</span>
          </div>
        </GlassCard>
      ) : (
        <GlassCard className="mb-5 p-4 flex items-center gap-3">
          <MapPin size={16} className="text-white/30 shrink-0" />
          <p className="text-xs text-white/40">No GPS route recorded for this drive.</p>
        </GlassCard>
      )}

      {/* AI Feedback */}
      <GlassCard className="mb-5">
        <div className="flex items-center gap-2 mb-3">
          <MessageSquare size={16} className="text-ai-blue" />
          <span className="text-sm font-semibold text-white">AI Safety Feedback</span>
        </div>
        <p className="text-sm text-white/70 leading-relaxed">{getFeedback(state.drivingScore)}</p>
      </GlassCard>

      {/* Alerts List */}
      {state.alerts.length > 0 && (
        <GlassCard danger className="mb-5">
          <p className="text-sm font-semibold text-danger-red mb-2">Alerts During Drive</p>
          <div className="space-y-1.5">
            {state.alerts.map((alert, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-white/60">
                <AlertTriangle size={12} className="text-amber-warning shrink-0" />
                {alert}
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      <button
        onClick={() => navigate('home')}
        className="w-full py-3.5 rounded-xl bg-neon-green text-black font-semibold text-sm active:scale-[0.98] transition-transform"
      >
        Return to Home
      </button>
    </div>
  );
};

export default DriveSummary;
