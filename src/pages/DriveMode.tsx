import React, { useEffect, useState, useRef, useCallback } from 'react';
import { ArrowLeft, AlertOctagon, Navigation, Gauge, Activity, MapPin, WifiOff, ShieldCheck } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { VoiceAlertBanner } from '@/components/safedrive/VoiceAlertBanner';
import { useGpsSpeed } from '@/hooks/useGpsSpeed';
import { useSpeedLimit } from '@/hooks/useSpeedLimit';

// ── Zone badge colours ────────────────────────────────────────────────────
const ZONE_COLORS: Record<string, string> = {
  highway:     '#00C2FF',
  city:        '#00FF99',
  residential: '#FFC107',
  school:      '#FF3B30',
  unknown:     '#ffffff44',
};
const ZONE_LABELS: Record<string, string> = {
  highway:     'HIGHWAY',
  city:        'CITY',
  residential: 'RESIDENTIAL',
  school:      'SCHOOL ZONE',
  unknown:     'ROAD',
};

interface DetectedObject {
  id: number;
  type: 'car' | 'bike' | 'pedestrian' | 'truck';
  x: number;
  y: number;
  w: number;
  h: number;
  distance: number;
}

const objectColors: Record<string, string> = {
  car: '#00FF99',
  bike: '#00C2FF',
  pedestrian: '#FFC107',
  truck: '#FF3B30',
};
const objectLabels: Record<string, string> = {
  car: 'CAR', bike: 'BIKE', pedestrian: 'PED', truck: 'TRUCK',
};

const DriveMode: React.FC = () => {
  const { navigate, addAlert, startDrive, endDrive, updateSpeed, updateLocation, addRoutePoint } = useApp();

  // ── Real GPS speed + coords ─────────────────────────────────────────
  const gps = useGpsSpeed();
  const speed = gps.speed;

  // ── Dynamic speed limit from Overpass / heuristics ──────────────────
  const speedLimitInfo = useSpeedLimit(gps.lat, gps.lng);
  const speedLimit = speedLimitInfo.limit;
  const isOverLimit = speed > speedLimit;

  const [brakeHarshness, setBrakeHarshness] = useState(12);
  const [laneDrift, setLaneDrift] = useState(98);
  const [safetyScore, setSafetyScore] = useState(87);
  const [objects, setObjects] = useState<DetectedObject[]>([]);
  const [alertMsg, setAlertMsg] = useState<string | null>(null);
  const [alertSeverity, setAlertSeverity] = useState<'danger' | 'warning'>('danger');
  const [laneLines] = useState<{ left: number; right: number }>({ left: 30, right: 70 });
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [elapsed, setElapsed] = useState(0);

  // ── Background GPS worker ────────────────────────────────────────────
  const workerRef = useRef<Worker | null>(null);

  // ── Wake Lock — keeps screen on / prevents background throttle ───────
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  const triggerAlert = useCallback((msg: string, severity: 'danger' | 'warning' = 'danger') => {
    setAlertMsg(msg);
    setAlertSeverity(severity);
    addAlert(msg);
  }, [addAlert]);

  // Sync live GPS speed + location into AppContext
  useEffect(() => {
    updateSpeed(speed);
  }, [speed, updateSpeed]);

  useEffect(() => {
    if (gps.lat !== null && gps.lng !== null) {
      updateLocation(gps.lat, gps.lng);
      addRoutePoint(gps.lat, gps.lng);
      // Post to background worker
      workerRef.current?.postMessage({ type: 'ADD_POINT', lat: gps.lat, lng: gps.lng, ts: Date.now() });
    }
  }, [gps.lat, gps.lng, updateLocation, addRoutePoint]);

  // Overspeed alert driven by real GPS speed vs dynamic limit
  const prevOverLimitRef = useRef(false);
  useEffect(() => {
    if (isOverLimit && !prevOverLimitRef.current) {
      triggerAlert(`Overspeeding ${speed} km/h — Limit ${speedLimit} km/h`, 'warning');
    }
    prevOverLimitRef.current = isOverLimit;
  }, [isOverLimit, speed, speedLimit, triggerAlert]);

  // School zone alert
  const prevZoneRef = useRef('');
  useEffect(() => {
    if (speedLimitInfo.zone === 'school' && prevZoneRef.current !== 'school') {
      triggerAlert('⚠️ School Zone — Slow to 20 km/h', 'danger');
    }
    prevZoneRef.current = speedLimitInfo.zone;
  }, [speedLimitInfo.zone, triggerAlert]);

  useEffect(() => {
    startDrive();

    // ── Background GPS worker ──────────────────────────────────────
    workerRef.current = new Worker('/route-worker.js');
    workerRef.current.postMessage({ type: 'START_DRIVE' });

    // ── Screen Wake Lock (keeps GPS active when screen dims) ───────
    if ('wakeLock' in navigator) {
      navigator.wakeLock.request('screen').then((lock) => {
        wakeLockRef.current = lock;
      }).catch(() => { /* graceful — not all browsers support this */ });
    }

    // Re-acquire wake lock if page becomes visible again
    const onVisibility = () => {
      if (document.visibilityState === 'visible' && 'wakeLock' in navigator) {
        navigator.wakeLock.request('screen').then((lock) => {
          wakeLockRef.current = lock;
        }).catch(() => {});
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    const clockId = setInterval(() => setElapsed((p) => p + 1), 1000);

    intervalRef.current = setInterval(() => {
      // Speed is real GPS — only simulate non-GPS sensors below
      const bh = Math.round(Math.random() * 30);
      setBrakeHarshness(bh);
      if (bh > 20) triggerAlert('Harsh Braking Detected', 'warning');

      setLaneDrift(Math.round(90 + Math.random() * 10));
      setSafetyScore((prev) => Math.max(60, Math.min(100, prev + (Math.random() - 0.5) * 5)));

      const newObjects: DetectedObject[] = [
        { id: 1, type: 'car', x: 20 + Math.random() * 20, y: 30, w: 18, h: 14, distance: Math.round(8 + Math.random() * 25) },
        { id: 2, type: Math.random() > 0.5 ? 'bike' : 'pedestrian', x: 55 + Math.random() * 15, y: 50, w: 8, h: 10, distance: Math.round(5 + Math.random() * 18) },
      ];
      if (Math.random() > 0.6) {
        newObjects.push({ id: 3, type: 'truck', x: 10 + Math.random() * 10, y: 20, w: 22, h: 16, distance: Math.round(15 + Math.random() * 25) });
      }
      setObjects(newObjects);

      const tooClose = newObjects.find((o) => o.distance < 10);
      if (tooClose) triggerAlert(`${objectLabels[tooClose.type]} Too Close — ${tooClose.distance}m`, 'danger');
    }, 2200);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      clearInterval(clockId);
      document.removeEventListener('visibilitychange', onVisibility);
      wakeLockRef.current?.release().catch(() => {});
      workerRef.current?.postMessage({ type: 'END_DRIVE' });
      workerRef.current?.terminate();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stopAndGoTo = (dest: 'driveSummary' | 'sos' | 'home') => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    endDrive();
    navigate(dest);
  };

  const fmtElapsed = `${String(Math.floor(elapsed / 60)).padStart(2, '0')}:${String(elapsed % 60).padStart(2, '0')}`;

  return (
    <div className="min-h-screen bg-black flex flex-col screen-enter">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-2">
        <button onClick={() => stopAndGoTo('home')} className="w-9 h-9 rounded-lg glass-card flex items-center justify-center">
          <ArrowLeft size={18} className="text-white/70" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-white">Drive Mode</h1>
          <p className="text-[10px] text-white/40 font-mono">AI HUD Active · {fmtElapsed}</p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neon-green/10 border border-neon-green/30">
          <div className="w-2 h-2 rounded-full bg-neon-green animate-pulse" />
          <span className="text-xs text-neon-green font-bold tracking-widest">LIVE</span>
        </div>
      </div>

      {/* Camera Preview */}
      <div className="relative mx-4 rounded-2xl overflow-hidden bg-gradient-to-b from-gray-900 to-gray-800 border border-white/10 flex-shrink-0" style={{ height: '260px' }}>
        {/* Road perspective lines */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <line x1="50" y1="0" x2={laneLines.left} y2="100" stroke="rgba(255,255,255,0.15)" strokeWidth="0.4" />
          <line x1="50" y1="0" x2={laneLines.right} y2="100" stroke="rgba(255,255,255,0.15)" strokeWidth="0.4" />
          <line x1="50" y1="20" x2="50" y2="100" stroke="rgba(255,255,255,0.08)" strokeWidth="0.3" strokeDasharray="2 3" />
        </svg>

        {/* Bounding boxes */}
        {objects.map((obj) => (
          <div
            key={obj.id}
            className="absolute border-2 transition-all duration-700"
            style={{ left: `${obj.x}%`, top: `${obj.y}%`, width: `${obj.w}%`, height: `${obj.h}%`, borderColor: objectColors[obj.type], boxShadow: `0 0 10px ${objectColors[obj.type]}30` }}
          >
            <div className="absolute -top-5 left-0 px-1.5 py-0.5 rounded text-[9px] font-bold text-black" style={{ backgroundColor: objectColors[obj.type] }}>
              {objectLabels[obj.type]} {obj.distance}m
            </div>
            {/* Corner ticks */}
            {['-top-1 -left-1 border-t-2 border-l-2', '-top-1 -right-1 border-t-2 border-r-2', '-bottom-1 -left-1 border-b-2 border-l-2', '-bottom-1 -right-1 border-b-2 border-r-2'].map((cls) => (
              <div key={cls} className={`absolute w-2 h-2 ${cls}`} style={{ borderColor: objectColors[obj.type] }} />
            ))}
          </div>
        ))}

        {/* AI scan line */}
        <div className="absolute inset-0 ai-scan-overlay pointer-events-none" />

        {/* HUD overlays */}
        <div className="absolute top-3 left-3 px-2 py-1 rounded-lg bg-black/70 backdrop-blur-sm flex items-center gap-1.5">
          <Navigation size={11} className="text-neon-green" />
          <span className="text-[9px] text-white/80 font-mono">REAR CAM · AI v2.1</span>
        </div>
        <div className="absolute top-3 right-3 px-2 py-1 rounded-lg bg-black/70 backdrop-blur-sm flex items-center gap-1.5">
          {gps.acquiring ? (
            <span className="text-[9px] text-ai-blue font-mono animate-pulse">GPS…</span>
          ) : gps.gpsAvailable ? (
            <>
              <MapPin size={9} className="text-neon-green" />
              <span className={`text-[9px] font-mono font-bold ${isOverLimit ? 'text-danger-red animate-pulse' : 'text-neon-green'}`}>
                {speed} km/h
              </span>
            </>
          ) : (
            <>
              <WifiOff size={9} className="text-amber-warning" />
              <span className="text-[9px] text-amber-warning font-mono">No GPS</span>
            </>
          )}
        </div>

        {/* Speed limit zone badge — bottom left */}
        <div
          className="absolute bottom-3 left-3 px-2 py-1 rounded-lg bg-black/70 backdrop-blur-sm flex items-center gap-1.5"
          style={{ borderLeft: `2px solid ${ZONE_COLORS[speedLimitInfo.zone]}` }}
        >
          <ShieldCheck size={9} style={{ color: ZONE_COLORS[speedLimitInfo.zone] }} />
          <span className="text-[9px] font-mono font-bold" style={{ color: ZONE_COLORS[speedLimitInfo.zone] }}>
            {speedLimitInfo.loading ? '…' : `${speedLimit} km/h`}
          </span>
          <span className="text-[8px] text-white/40 uppercase tracking-wide">
            {ZONE_LABELS[speedLimitInfo.zone]}
          </span>
        </div>

        <div className="absolute bottom-3 right-3 px-2 py-1 rounded-lg bg-black/70 backdrop-blur-sm">
          <span className="text-[9px] text-white/60 font-mono">{objects.length} obj detected</span>
        </div>
      </div>

      {/* Voice Alert Banner */}
      <VoiceAlertBanner message={alertMsg} severity={alertSeverity} onDismiss={() => setAlertMsg(null)} />

      {/* Stats Panel */}
      <div className="mx-4 mt-3 glass-card-strong p-4">
        <div className="grid grid-cols-4 gap-2 text-center">
          {[
            {
              label: 'Speed',
              value: gps.acquiring ? '…' : speed,
              unit: 'km/h',
              color: gps.acquiring
                ? 'text-ai-blue'
                : isOverLimit
                ? 'text-danger-red'
                : 'text-neon-green',
            },
            { label: 'Brake', value: brakeHarshness, unit: '%', color: brakeHarshness > 20 ? 'text-danger-red' : 'text-amber-warning' },
            { label: 'Lane', value: laneDrift, unit: 'score', color: 'text-ai-blue' },
            { label: 'Safety', value: Math.round(safetyScore), unit: 'score', color: 'text-neon-green' },
          ].map((stat, i) => (
            <div key={stat.label} className={i < 3 ? 'border-r border-dashed border-white/10' : ''}>
              <p className="text-[9px] text-white/40 uppercase tracking-wider mb-1">{stat.label}</p>
              <p className={`text-xl font-bold stat-value ${stat.color}`}>{stat.value}</p>
              <p className="text-[9px] text-white/30">{stat.unit}</p>
            </div>
          ))}
        </div>

        {/* Zone pill + GPS source row */}
        <div className="mt-2 flex items-center gap-2 flex-wrap">
          {/* Zone badge */}
          <div
            className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide"
            style={{ backgroundColor: `${ZONE_COLORS[speedLimitInfo.zone]}18`, color: ZONE_COLORS[speedLimitInfo.zone], border: `1px solid ${ZONE_COLORS[speedLimitInfo.zone]}40` }}
          >
            <ShieldCheck size={9} />
            {ZONE_LABELS[speedLimitInfo.zone]} · {speedLimitInfo.loading ? '…' : `${speedLimit} km/h limit`}
          </div>

          {/* GPS source */}
          {!gps.acquiring && (
            gps.gpsAvailable ? (
              <div className="flex items-center gap-1">
                <MapPin size={9} className="text-neon-green" />
                <span className="text-[9px] text-neon-green font-mono">
                  GPS Live{gps.accuracy !== null ? ` · ±${gps.accuracy}m` : ''}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <WifiOff size={9} className="text-amber-warning" />
                <span className="text-[9px] text-amber-warning">{gps.error ?? 'GPS unavailable'}</span>
              </div>
            )
          )}
        </div>

        {/* Safety score bar */}
        <div className="mt-3">
          <div className="flex justify-between mb-1">
            <div className="flex items-center gap-1.5">
              <Activity size={10} className="text-neon-green" />
              <span className="text-[9px] text-white/40">Safety Score</span>
            </div>
            <span className="text-[9px] text-neon-green font-mono">{Math.round(safetyScore)}/100</span>
          </div>
          <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-neon-green to-ai-blue rounded-full transition-all duration-500"
              style={{ width: `${safetyScore}%` }}
            />
          </div>
        </div>

        {/* Speed gauge bar — relative to dynamic speed limit */}
        <div className="mt-2">
          <div className="flex justify-between mb-1">
            <div className="flex items-center gap-1.5">
              <Gauge size={10} className={isOverLimit ? 'text-danger-red' : 'text-ai-blue'} />
              <span className="text-[9px] text-white/40">Speed</span>
            </div>
            <span className={`text-[9px] font-mono ${isOverLimit ? 'text-danger-red' : 'text-ai-blue'}`}>
              {speed}/{speedLimit} km/h
            </span>
          </div>
          <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${isOverLimit ? 'bg-danger-red' : 'bg-ai-blue'}`}
              style={{ width: `${Math.min((speed / speedLimit) * 100, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-auto p-4 grid grid-cols-2 gap-3 pb-6">
        <button
          onClick={() => stopAndGoTo('sos')}
          className="py-3 rounded-xl bg-danger-red/20 border border-danger-red/40 text-danger-red font-semibold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
        >
          <AlertOctagon size={16} />
          Sim Crash
        </button>
        <button
          onClick={() => stopAndGoTo('driveSummary')}
          className="py-3 rounded-xl bg-neon-green text-black font-bold text-sm active:scale-[0.98] transition-transform"
        >
          End Drive
        </button>
      </div>
    </div>
  );
};

export default DriveMode;
