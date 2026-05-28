import React, { useState, useRef } from 'react';
import { ArrowLeft, Upload, MapPin, AlertTriangle, CheckCircle, Camera, Navigation, Building2, ShieldCheck, Truck, ArrowRight } from 'lucide-react';
import { GlassCard } from '@/components/safedrive/GlassCard';
import { useApp } from '@/contexts/AppContext';

interface HazardType {
  id: string;
  label: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  authority: string;
  authorityIcon: React.ElementType;
  authorityColor: string;
}

const hazardTypes: HazardType[] = [
  { id: 'pothole', label: 'Pothole', severity: 'Medium', authority: 'GHMC Road Dept', authorityIcon: Building2, authorityColor: '#FFC107' },
  { id: 'signal', label: 'Broken Traffic Signal', severity: 'Critical', authority: 'TS Traffic Police', authorityIcon: ShieldCheck, authorityColor: '#FF3B30' },
  { id: 'waterlogging', label: 'Waterlogging', severity: 'High', authority: 'HMWSSB Drainage', authorityIcon: Truck, authorityColor: '#00C2FF' },
  { id: 'crack', label: 'Road Crack', severity: 'Low', authority: 'NHAI / PWD', authorityIcon: Building2, authorityColor: '#00FF99' },
];

const severityColors: Record<string, string> = {
  Critical: '#FF3B30',
  High: '#FF6B35',
  Medium: '#FFC107',
  Low: '#00FF99',
};

type SubmitPhase = 'idle' | 'uploading' | 'analyzing' | 'routing' | 'done';

const IncidentReporter: React.FC = () => {
  const { navigate } = useApp();
  const [photo, setPhoto] = useState<string | null>(null);
  const [detectedHazard, setDetectedHazard] = useState<HazardType | null>(null);
  const [submitPhase, setSubmitPhase] = useState<SubmitPhase>('idle');
  const [refId] = useState('SD-' + Date.now().toString().slice(-6));
  const fileInputRef = useRef<HTMLInputElement>(null);

  const lat = '17.4065° N';
  const lng = '78.4772° E';
  const address = 'Gachibowli Main Road, Hyderabad';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSubmitPhase('analyzing');
    const reader = new FileReader();
    reader.onload = () => {
      setPhoto(reader.result as string);
      setTimeout(() => {
        const h = hazardTypes[Math.floor(Math.random() * hazardTypes.length)];
        setDetectedHazard(h);
        setSubmitPhase('idle');
      }, 1600);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = () => {
    setSubmitPhase('uploading');
    setTimeout(() => setSubmitPhase('analyzing'), 900);
    setTimeout(() => setSubmitPhase('routing'), 1800);
    setTimeout(() => setSubmitPhase('done'), 3200);
  };

  const handleReset = () => {
    setPhoto(null);
    setDetectedHazard(null);
    setSubmitPhase('idle');
  };

  if (submitPhase === 'done') {
    const Authority = detectedHazard?.authorityIcon ?? Building2;
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-8 pb-24 screen-enter">
        {/* Success ring */}
        <div className="relative w-28 h-28 mb-6">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="42" stroke="rgba(0,255,153,0.15)" strokeWidth="5" fill="none" />
            <circle cx="50" cy="50" r="42" stroke="#00FF99" strokeWidth="5" fill="none"
              strokeLinecap="round" strokeDasharray="263.9" strokeDashoffset="0"
              style={{ filter: 'drop-shadow(0 0 8px rgba(0,255,153,0.6))', transition: 'stroke-dashoffset 1s ease-out' }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <CheckCircle size={40} className="text-neon-green" />
          </div>
        </div>

        <h2 className="text-2xl font-bold text-white mb-1 text-balance">Report Submitted</h2>
        <p className="text-sm text-white/50 text-center text-pretty mb-6">
          Your incident has been logged and routed to the appropriate authority.
        </p>

        {/* Summary */}
        <GlassCard neon className="w-full mb-4 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-white/40 uppercase tracking-wider">Reference ID</span>
            <span className="text-sm text-neon-green font-mono font-bold">{refId}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-white/40 uppercase tracking-wider">Hazard Type</span>
            <span className="text-sm text-white">{detectedHazard?.label}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-white/40 uppercase tracking-wider">Severity</span>
            <span className="text-sm font-bold" style={{ color: severityColors[detectedHazard?.severity ?? 'Low'] }}>
              {detectedHazard?.severity}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-white/40 uppercase tracking-wider">Routed To</span>
            <div className="flex items-center gap-1.5">
              <Authority size={13} style={{ color: detectedHazard?.authorityColor }} />
              <span className="text-sm text-white">{detectedHazard?.authority}</span>
            </div>
          </div>
        </GlassCard>

        <div className="w-full space-y-2.5">
          <button onClick={handleReset} className="w-full py-3.5 rounded-xl bg-neon-green text-black font-bold text-sm active:scale-[0.98] transition-transform">
            Report Another
          </button>
          <button onClick={() => navigate('home')} className="w-full py-3.5 rounded-xl bg-white/8 text-white font-semibold text-sm active:scale-[0.98] transition-transform">
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pb-24 pt-4 px-4 screen-enter">
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => navigate('home')} className="w-9 h-9 rounded-lg glass-card flex items-center justify-center">
          <ArrowLeft size={18} className="text-white/70" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-white">Incident Reporter</h1>
          <p className="text-[10px] text-white/40">AI-Powered Road Hazard Detection</p>
        </div>
      </div>

      {/* GPS Card */}
      <GlassCard className="mb-4 p-3.5 flex items-center gap-3">
        <div className="relative w-9 h-9 shrink-0 flex items-center justify-center">
          <div className="absolute w-6 h-6 rounded-full bg-ai-blue/30 gps-ping" />
          <Navigation size={16} className="text-ai-blue relative" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-white font-medium truncate">{address}</p>
          <p className="text-[10px] text-white/40 font-mono">{lat}, {lng}</p>
        </div>
        <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-neon-green/10 border border-neon-green/20">
          <div className="w-1.5 h-1.5 rounded-full bg-neon-green animate-pulse" />
          <span className="text-[9px] text-neon-green font-bold">GPS LOCK</span>
        </div>
      </GlassCard>

      {/* Photo Upload */}
      <GlassCard strong className="mb-4 p-5">
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
        {!photo ? (
          <button onClick={() => fileInputRef.current?.click()} className="w-full py-8 rounded-xl border-2 border-dashed border-white/15 flex flex-col items-center gap-3 active:bg-white/5 transition-colors">
            <div className="w-14 h-14 rounded-full bg-ai-blue/20 flex items-center justify-center">
              <Upload size={24} className="text-ai-blue" />
            </div>
            <div className="text-center">
              <p className="text-sm text-white font-medium">Upload Road Issue Photo</p>
              <p className="text-[10px] text-white/30 mt-1">Tap to select from gallery or camera</p>
            </div>
          </button>
        ) : (
          <div className="relative">
            <img src={photo} alt="Incident" className="w-full h-44 object-cover rounded-xl" />
            {submitPhase === 'analyzing' && (
              <div className="absolute inset-0 rounded-xl bg-black/70 flex flex-col items-center justify-center gap-2 ai-scan-overlay">
                <p className="text-xs text-ai-blue font-mono z-10">AI Analyzing...</p>
                <div className="flex gap-1 z-10">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="w-2 h-2 rounded-full bg-ai-blue typing-dot" style={{ animationDelay: `${i * 0.2}s` }} />
                  ))}
                </div>
              </div>
            )}
            <button onClick={() => fileInputRef.current?.click()} className="absolute bottom-3 right-3 px-3 py-1.5 rounded-lg bg-black/70 backdrop-blur-sm text-xs text-white flex items-center gap-1.5">
              <Camera size={12} /> Change
            </button>
          </div>
        )}
      </GlassCard>

      {/* AI Detection Results */}
      {detectedHazard && (submitPhase === 'idle' || submitPhase === 'uploading' || submitPhase === 'routing') && (
        <div className="space-y-3 mb-4 screen-enter">
          <GlassCard className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={15} className="text-amber-warning" />
              <span className="text-sm font-semibold text-white">AI Detection Results</span>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <p className="text-[9px] text-white/40 uppercase tracking-wider mb-1">Hazard Type</p>
                <p className="text-sm font-bold text-white">{detectedHazard.label}</p>
              </div>
              <div>
                <p className="text-[9px] text-white/40 uppercase tracking-wider mb-1">Severity</p>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: severityColors[detectedHazard.severity] }} />
                  <span className="text-sm font-bold" style={{ color: severityColors[detectedHazard.severity] }}>
                    {detectedHazard.severity}
                  </span>
                </div>
              </div>
            </div>
            {/* Severity bar */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-[9px] text-white/30">Low</span>
                <span className="text-[9px] text-white/30">Critical</span>
              </div>
              <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: detectedHazard.severity === 'Critical' ? '100%' : detectedHazard.severity === 'High' ? '75%' : detectedHazard.severity === 'Medium' ? '50%' : '25%',
                    backgroundColor: severityColors[detectedHazard.severity],
                    boxShadow: `0 0 8px ${severityColors[detectedHazard.severity]}60`,
                  }}
                />
              </div>
            </div>
          </GlassCard>

          {/* Authority Routing */}
          <GlassCard className="p-4">
            <p className="text-[9px] text-white/40 uppercase tracking-wider mb-3">Authority Routing</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                <MapPin size={16} className="text-ai-blue" />
              </div>
              <ArrowRight size={14} className="text-white/20" />
              <div className="flex items-center gap-2 flex-1 px-3 py-2.5 rounded-xl" style={{ backgroundColor: `${detectedHazard.authorityColor}12`, border: `1px solid ${detectedHazard.authorityColor}30` }}>
                <detectedHazard.authorityIcon size={16} style={{ color: detectedHazard.authorityColor }} />
                <div>
                  <p className="text-xs font-semibold text-white">{detectedHazard.authority}</p>
                  <p className="text-[9px] text-white/40">Will receive report + GPS</p>
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Uploading/Routing progress */}
          {(submitPhase === 'uploading' || submitPhase === 'routing') && (
            <GlassCard className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="w-2 h-2 rounded-full bg-neon-green typing-dot" style={{ animationDelay: `${i * 0.2}s` }} />
                  ))}
                </div>
                <p className="text-xs text-white/60">
                  {submitPhase === 'uploading' ? 'Uploading evidence...' : 'Routing to authority...'}
                </p>
              </div>
            </GlassCard>
          )}

          <button
            onClick={handleSubmit}
            disabled={submitPhase !== 'idle'}
            className="w-full py-3.5 rounded-xl bg-neon-green text-black font-bold text-sm active:scale-[0.98] transition-transform disabled:opacity-50"
          >
            Submit Report to {detectedHazard.authority}
          </button>
        </div>
      )}

      {!photo && (
        <GlassCard className="p-4">
          <p className="text-[10px] text-white/40 mb-3">Supported hazard types:</p>
          <div className="flex flex-wrap gap-2">
            {hazardTypes.map((h) => (
              <span
                key={h.id}
                className="px-2.5 py-1.5 rounded-full text-[10px] border"
                style={{ color: severityColors[h.severity], borderColor: `${severityColors[h.severity]}40`, backgroundColor: `${severityColors[h.severity]}10` }}
              >
                {h.label} · {h.severity}
              </span>
            ))}
          </div>
        </GlassCard>
      )}
    </div>
  );
};

export default IncidentReporter;
