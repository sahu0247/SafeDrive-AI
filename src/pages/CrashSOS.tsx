import React, { useEffect, useState, useCallback } from 'react';
import {
  Siren,
  MapPin,
  Phone,
  X,
  CheckCircle,
  Navigation,
  ShieldAlert,
  Send,
  UserCheck,
  MessageSquare,
  Loader2,
} from 'lucide-react';
import { GlassCard } from '@/components/safedrive/GlassCard';
import { useApp } from '@/contexts/AppContext';

const COUNTDOWN = 10;
const RADIUS = 45;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

interface GpsLocation {
  lat: number;
  lng: number;
  address: string;
  loading: boolean;
  error: boolean;
}

interface DispatchStep {
  id: number;
  icon: React.ElementType;
  label: string;
  sub: string;
  color: string;
}

// Reverse geocode using Nominatim (free, no API key)
async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      { headers: { 'Accept-Language': 'en' } }
    );
    const data = await res.json();
    const addr = data?.display_name as string | undefined;
    if (addr) {
      // Shorten: take first 2–3 parts
      const parts = addr.split(', ');
      return parts.slice(0, 3).join(', ');
    }
  } catch (_) {}
  return `${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E`;
}

const CrashSOS: React.FC = () => {
  const { state, navigate, goBack } = useApp();
  const { emergencyContacts, userProfile } = state;

  const [countdown, setCountdown] = useState(COUNTDOWN);
  const [dispatched, setDispatched] = useState(false);
  const [canceled, setCanceled] = useState(false);
  const [dispatchedSteps, setDispatchedSteps] = useState<number[]>([]);
  const [smsSteps, setSmsSteps] = useState<number[]>([]);
  const [impactForce] = useState(() => Math.round(62 + Math.random() * 28));
  const [gps, setGps] = useState<GpsLocation>({
    lat: 17.4065,
    lng: 78.4772,
    address: 'Gachibowli, Hyderabad',
    loading: true,
    error: false,
  });

  // ── Capture real GPS on mount ──────────────────────────────────────
  useEffect(() => {
    if (!navigator.geolocation) {
      setGps((g) => ({ ...g, loading: false, error: false }));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        const address = await reverseGeocode(lat, lng);
        setGps({ lat, lng, address, loading: false, error: false });
      },
      () => {
        // Fallback to Hyderabad default
        setGps((g) => ({ ...g, loading: false, error: true }));
      },
      { timeout: 8000, maximumAge: 30000, enableHighAccuracy: true }
    );
  }, []);

  const dashOffset = ((COUNTDOWN - countdown) / COUNTDOWN) * CIRCUMFERENCE;
  const strokeColor = countdown <= 3 ? '#FF3B30' : countdown <= 6 ? '#FFC107' : '#00FF99';

  const locationLabel = gps.loading
    ? 'Locating…'
    : gps.error
    ? `${gps.lat.toFixed(4)}°N, ${gps.lng.toFixed(4)}°E (approx.)`
    : gps.address;

  const locationCoords = `${gps.lat.toFixed(4)}°N, ${gps.lng.toFixed(4)}°E`;

  // Build dynamic dispatch steps with real location
  const buildDispatchSteps = useCallback((): DispatchStep[] => {
    const steps: DispatchStep[] = [
      {
        id: 1,
        icon: Navigation,
        label: 'GPS Location Captured',
        sub: `${locationLabel} · ${locationCoords}`,
        color: '#00C2FF',
      },
    ];

    emergencyContacts.forEach((contact, idx) => {
      steps.push({
        id: 10 + idx,
        icon: MessageSquare,
        label: `SMS opened for ${contact.name}`,
        sub: `📱 ${contact.phone} — "🆘 EMERGENCY! ${userProfile.fullName || 'SafeDrive User'} may be in an accident at ${locationLabel} (${locationCoords}). Please call immediately or contact emergency services. — SafeDrive AI"`,
        color: '#00FF99',
      });
    });

    if (emergencyContacts.length === 0) {
      steps.push({
        id: 10,
        icon: Phone,
        label: 'No contacts configured',
        sub: 'Add emergency contacts in Settings',
        color: '#FFC107',
      });
    }

    steps.push(
      { id: 2, icon: ShieldAlert, label: 'Police Control Room Alerted', sub: 'AP Emergency: 100', color: '#FFC107' },
      { id: 3, icon: Send, label: 'Ambulance Request Sent', sub: 'EMRI: 108 · ETA ~6 min', color: '#FF3B30' },
      { id: 4, icon: UserCheck, label: 'Incident Report Filed', sub: 'Ref: SD-' + Date.now().toString().slice(-6), color: '#00FF99' }
    );
    return steps;
  }, [locationLabel, locationCoords, emergencyContacts, userProfile.fullName]);

  // ── Open native SMS app for each contact ──────────────────────────
  const openSmsForContact = useCallback((contact: { name: string; phone: string }) => {
    const body = encodeURIComponent(
      `🆘 EMERGENCY! ${userProfile.fullName || 'SafeDrive User'} may be in an accident at ${locationLabel} (${locationCoords}). Please call immediately or contact emergency services. — SafeDrive AI`
    );
    // sms: URI scheme — opens native SMS app on Android & iOS
    const uri = `sms:${contact.phone.replace(/\s/g, '')}${/iPhone|iPad|iPod/i.test(navigator.userAgent) ? '&' : '?'}body=${body}`;
    window.open(uri, '_self');
  }, [locationLabel, locationCoords, userProfile.fullName]);

  useEffect(() => {
    if (canceled || dispatched) return;
    if (countdown <= 0) {
      setDispatched(true);
      const steps = buildDispatchSteps();

      // Open native SMS app for each emergency contact in sequence
      emergencyContacts.forEach((contact, i) => {
        setTimeout(() => openSmsForContact(contact), i * 1200);
      });

      steps.forEach((step, i) => {
        setTimeout(() => {
          setDispatchedSteps((prev) => [...prev, step.id]);
          if (step.id >= 10 && step.id < 20) {
            setTimeout(() => setSmsSteps((prev) => [...prev, step.id]), 350);
          }
        }, (i + 1) * 700);
      });
      return;
    }
    const t = setTimeout(() => setCountdown((p) => p - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown, canceled, dispatched, buildDispatchSteps, openSmsForContact, emergencyContacts]);

  const handleCancel = () => {
    setCanceled(true);
    setTimeout(() => {
      if (state.previousScreen && state.previousScreen !== 'splash') goBack();
      else navigate('home');
    }, 1800);
  };

  const dispatchSteps = buildDispatchSteps();

  return (
    <div className="min-h-screen bg-black flex flex-col screen-enter">
      {/* Header */}
      <div className="p-4 text-center border-b border-danger-red/20">
        <div className="flex items-center justify-center gap-2 mb-1">
          <Siren size={22} className="text-danger-red animate-pulse" />
          <h1 className="text-xl font-bold text-danger-red tracking-widest">EMERGENCY SOS</h1>
          <Siren size={22} className="text-danger-red animate-pulse" />
        </div>
        <p className="text-[10px] text-white/40 truncate">
          Crash Detection Triggered · Impact {impactForce}G
          {userProfile.fullName && (
            <span className="text-white/60"> · {userProfile.fullName}</span>
          )}
          {userProfile.bloodGroup && (
            <span className="text-danger-red font-bold"> · {userProfile.bloodGroup}</span>
          )}
        </p>
      </div>

      {!dispatched && !canceled ? (
        <>
          {/* Countdown Ring */}
          <div className="flex flex-col items-center justify-center pt-8 pb-4">
            <div className="relative w-40 h-40">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r={RADIUS} stroke="rgba(255,255,255,0.08)" strokeWidth="5" fill="none" />
                <circle
                  cx="50" cy="50" r={RADIUS}
                  stroke={strokeColor} strokeWidth="5" fill="none"
                  strokeLinecap="round"
                  strokeDasharray={CIRCUMFERENCE}
                  strokeDashoffset={dashOffset}
                  style={{ filter: `drop-shadow(0 0 6px ${strokeColor})`, transition: 'stroke-dashoffset 1s linear, stroke 0.3s ease' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-5xl font-bold stat-value transition-colors duration-300" style={{ color: strokeColor }}>
                  {countdown}
                </span>
                <span className="text-[10px] text-white/40 mt-1">seconds</span>
              </div>
            </div>

            {/* Contact preview */}
            <div className="mt-4 px-5 w-full max-w-sm">
              {emergencyContacts.length > 0 ? (
                <div className="space-y-1.5">
                  <p className="text-[10px] text-white/40 text-center mb-2">Emergency SMS will be sent to:</p>
                  {emergencyContacts.map((c) => (
                    <div key={c.id} className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white/5 border border-white/10">
                      <div className="w-6 h-6 rounded-full bg-neon-green/20 flex items-center justify-center shrink-0">
                        <Phone size={11} className="text-neon-green" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-white font-medium truncate">{c.name}</p>
                        <p className="text-[9px] text-white/40 font-mono">{c.phone}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-amber-warning text-center text-pretty">
                  No emergency contacts saved. Add contacts in Settings.
                </p>
              )}
            </div>
          </div>

          {/* GPS Card */}
          <div className="px-4">
            <GlassCard className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-ai-blue/20 flex items-center justify-center shrink-0">
                {gps.loading
                  ? <Loader2 size={18} className="text-ai-blue animate-spin" />
                  : <MapPin size={18} className="text-ai-blue" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-white/40 uppercase tracking-wider">Accident Location</p>
                <p className="text-sm text-white font-medium truncate">
                  {gps.loading ? 'Acquiring GPS…' : gps.error ? 'Approx. location' : gps.address}
                </p>
                <p className="text-[10px] text-white/40 font-mono">{locationCoords}</p>
              </div>
              <div className="relative w-8 h-8 shrink-0">
                <div className="absolute inset-0 rounded-full bg-ai-blue/30 gps-ping" />
                <div className="absolute inset-1 rounded-full bg-ai-blue/60" />
              </div>
            </GlassCard>
          </div>

          {/* Cancel */}
          <div className="mt-auto p-4 pb-8 space-y-3">
            <button
              onClick={handleCancel}
              className="w-full py-4 rounded-2xl bg-white/8 border border-white/20 text-white font-bold text-base flex items-center justify-center gap-3 active:scale-[0.98] transition-transform"
            >
              <X size={20} />
              Cancel — False Alarm
            </button>
            <p className="text-center text-[10px] text-white/30">Panic button always bypasses countdown</p>
          </div>
        </>

      ) : canceled ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="w-20 h-20 rounded-full bg-neon-green/20 border border-neon-green/30 flex items-center justify-center mb-5 animate-bounce-subtle">
            <CheckCircle size={40} className="text-neon-green" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">SOS Canceled</h2>
          <p className="text-sm text-white/50 text-center text-pretty">Emergency dispatch stopped. Returning to previous screen…</p>
        </div>

      ) : (
        /* Dispatched state */
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 text-center pt-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-danger-red/20 border border-danger-red/40 mb-3">
              <div className="w-2 h-2 rounded-full bg-danger-red animate-pulse" />
              <span className="text-sm font-bold text-danger-red">SOS DISPATCHED</span>
            </div>
            <p className="text-xs text-white/40">All emergency services have been notified</p>
            {userProfile.fullName && (
              <p className="text-xs text-white/60 mt-1">
                Incident registered under: <span className="text-white font-semibold">{userProfile.fullName}</span>
                {userProfile.bloodGroup && <span className="text-danger-red font-bold ml-1.5">· {userProfile.bloodGroup}</span>}
              </p>
            )}
            <p className="text-[10px] text-ai-blue font-mono mt-1">{locationLabel}</p>
          </div>

          {/* Dispatch Steps */}
          <div className="px-4 space-y-3 pb-4">
            {dispatchSteps.map((step) => {
              const Icon = step.icon;
              const done = dispatchedSteps.includes(step.id);
              const isSms = step.id >= 10 && step.id < 20;
              const smsTyping = done && isSms && !smsSteps.includes(step.id);
              const smsDone = done && smsSteps.includes(step.id);

              return (
                <div
                  key={step.id}
                  className={`glass-card p-4 flex items-start gap-3 transition-all duration-500 ${done ? 'opacity-100 step-pop' : 'opacity-0 pointer-events-none'}`}
                  style={done ? { border: `1px solid ${step.color}30` } : {}}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: `${step.color}18` }}>
                    <Icon size={18} style={{ color: step.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-semibold">{step.label}</p>
                    {isSms ? (
                      smsTyping ? (
                        <div className="flex items-center gap-1 mt-1">
                          {[0, 1, 2].map((i) => (
                            <div key={i} className="w-1.5 h-1.5 rounded-full bg-neon-green/60 typing-dot" style={{ animationDelay: `${i * 0.2}s` }} />
                          ))}
                          <span className="text-[9px] text-white/30 ml-1">Sending message…</span>
                        </div>
                      ) : (
                        <div className="mt-2 p-2.5 rounded-xl rounded-tl-sm text-[10px] leading-relaxed text-white/70 border break-words"
                          style={{ backgroundColor: `${step.color}10`, borderColor: `${step.color}20` }}>
                          {step.sub}
                        </div>
                      )
                    ) : (
                      <p className="text-[10px] text-white/40 truncate mt-0.5">{step.sub}</p>
                    )}
                  </div>
                  {(smsDone || (!isSms && done)) && (
                    <CheckCircle size={16} style={{ color: step.color }} className="shrink-0 mt-0.5" />
                  )}
                </div>
              );
            })}
          </div>

          <div className="px-4 pb-8 pt-2">
            <button
              onClick={() => navigate('home')}
              className="w-full py-3.5 rounded-xl bg-neon-green text-black font-bold text-sm active:scale-[0.98] transition-transform"
            >
              Return to Home
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CrashSOS;
