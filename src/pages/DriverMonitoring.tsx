import React, { useEffect, useRef, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import {
  ArrowLeft, Eye, AlertOctagon, Camera, CameraOff,
  Activity, Brain, Zap, MonitorSmartphone,
} from 'lucide-react';
import { GlassCard } from '@/components/safedrive/GlassCard';
import { useApp } from '@/contexts/AppContext';

// ─── EAR (Eye Aspect Ratio) helper ────────────────────────────────────
// Landmark indices for MediaPipe FaceMesh (468 points)
// Left eye:  362 (inner) 385 263 (outer) 387 373 380
// Right eye: 33 (inner) 160  7 (outer) 158 144 153
const EYE_LANDMARKS = {
  leftEye: [362, 385, 387, 263, 373, 380],
  rightEye: [33, 160, 158, 133, 153, 144],
};

function dist(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function computeEAR(landmarks: { x: number; y: number }[], indices: number[]) {
  const p = indices.map((i) => landmarks[i]);
  if (p.some((pt) => !pt)) return 0.3;
  // EAR = (|p1-p5| + |p2-p4|) / (2 * |p0-p3|)
  const vertical1 = dist(p[1], p[5]);
  const vertical2 = dist(p[2], p[4]);
  const horizontal = dist(p[0], p[3]);
  if (horizontal === 0) return 0.3;
  return (vertical1 + vertical2) / (2.0 * horizontal);
}

// ─── Sim Demo Mode (fallback) ──────────────────────────────────────────
const SimDemoMode: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [eyeClosure, setEyeClosure] = useState(5);
  const [headTilt, setHeadTilt] = useState(2);
  const [drowsy, setDrowsy] = useState(false);
  const [scanning] = useState(true);

  useEffect(() => {
    const iv = setInterval(() => {
      const ec = Math.round(Math.random() * 28);
      setEyeClosure(ec);
      setHeadTilt(parseFloat((Math.random() * 12 - 6).toFixed(1)));
      if (ec > 22) {
        setDrowsy(true);
        setTimeout(() => setDrowsy(false), 4000);
      }
    }, 2800);
    return () => clearInterval(iv);
  }, []);

  const facePoints = Array.from({ length: 68 }, (_, i) => ({
    id: i,
    x: 30 + (i % 12) * 3.5 + Math.sin(i * 0.5) * 8,
    y: 25 + Math.floor(i / 12) * 8 + Math.cos(i * 0.3) * 5,
  }));

  return (
    <div className="min-h-screen bg-black pb-24 pt-4 px-4 screen-enter">
      <div className="flex items-center gap-3 mb-5">
        <button onClick={onBack} className="w-9 h-9 rounded-lg glass-card flex items-center justify-center">
          <ArrowLeft size={18} className="text-white/70" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-white">Driver Monitor</h1>
          <p className="text-[10px] text-amber-warning/80">Demo Mode — Camera access denied</p>
        </div>
      </div>

      {/* Simulated feed */}
      <div className="relative mx-auto rounded-xl overflow-hidden bg-gradient-to-b from-gray-900 to-black border border-white/10 mb-5 w-full" style={{ height: 260 }}>
        {facePoints.map((pt) => (
          <div key={pt.id} className="absolute w-1 h-1 rounded-full bg-ai-blue/50"
            style={{ left: `${pt.x}%`, top: `${pt.y}%` }} />
        ))}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-28 h-36 rounded-full border-2 border-dashed border-ai-blue/30" />
        </div>
        {scanning && <div className="absolute inset-0 ai-scan-overlay" />}
        <div className="absolute top-3 left-3 px-2 py-1 rounded bg-black/60 backdrop-blur-sm">
          <span className="text-[10px] text-ai-blue font-mono">SIM MODE · 68 PTS</span>
        </div>
        {drowsy && (
          <div className="absolute inset-0 bg-danger-red/25 flex items-center justify-center animate-shake">
            <div className="text-center">
              <AlertOctagon size={36} className="text-danger-red mx-auto mb-2" />
              <p className="text-danger-red font-bold">DROWSINESS DETECTED</p>
              <p className="text-white/80 text-xs mt-1">You seem drowsy. Please take a break.</p>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <GlassCard className={`p-3.5 ${eyeClosure > 22 ? 'danger-border' : ''}`}>
          <Eye size={14} className={`mb-1.5 ${eyeClosure > 22 ? 'text-danger-red' : 'text-ai-blue'}`} />
          <p className={`text-xl font-bold stat-value ${eyeClosure > 22 ? 'text-danger-red' : 'text-white'}`}>{eyeClosure}%</p>
          <p className="text-[10px] text-white/40">Eye Closure</p>
        </GlassCard>
        <GlassCard className="p-3.5">
          <Activity size={14} className="text-ai-blue mb-1.5" />
          <p className="text-xl font-bold stat-value text-white">{headTilt > 0 ? '+' : ''}{headTilt}°</p>
          <p className="text-[10px] text-white/40">Head Tilt</p>
        </GlassCard>
      </div>

      <GlassCard className="flex items-center justify-between p-4">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${drowsy ? 'bg-danger-red animate-pulse' : 'bg-neon-green'}`} />
          <span className="text-sm text-white">{drowsy ? 'Drowsiness Alert!' : 'Driver Alert: Normal'}</span>
        </div>
        <span className="text-xs text-amber-warning font-mono">SIM</span>
      </GlassCard>
    </div>
  );
};

// ─── Real AI Mode ──────────────────────────────────────────────────────
const FACEMESH_CDN = 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh';
const EAR_CLOSED_THRESH = 0.22;      // below this = eye closed
const CLOSED_FRAMES_LIMIT = 18;       // ~2 s at ~9 fps

const RealAIMode: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const faceMeshRef = useRef<any>(null);
  const closedFrames = useRef(0);
  const lastAlertTime = useRef(0);

  const [modelReady, setModelReady] = useState(false);
  const [modelError, setModelError] = useState('');
  const [earLeft, setEarLeft] = useState(0.3);
  const [earRight, setEarRight] = useState(0.3);
  const [headTilt, setHeadTilt] = useState(0);
  const [drowsy, setDrowsy] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);

  // Draw mesh on canvas
  const drawMesh = useCallback((landmarks: { x: number; y: number; z: number }[]) => {
    const canvas = canvasRef.current;
    const video = webcamRef.current?.video;
    if (!canvas || !video) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = video.videoWidth || 320;
    canvas.height = video.videoHeight || 240;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw landmark dots
    ctx.fillStyle = 'rgba(0, 194, 255, 0.65)';
    for (const pt of landmarks) {
      ctx.beginPath();
      ctx.arc(pt.x * canvas.width, pt.y * canvas.height, 1.4, 0, 2 * Math.PI);
      ctx.fill();
    }

    // Eye contour highlight
    const drawEyeContour = (indices: number[], color: string) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      indices.forEach((idx, i) => {
        const pt = landmarks[idx];
        const x = pt.x * canvas.width;
        const y = pt.y * canvas.height;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.closePath();
      ctx.stroke();
    };

    const avgEAR = (earLeft + earRight) / 2;
    const eyeColor = avgEAR < EAR_CLOSED_THRESH ? '#FF3B30' : '#00FF99';
    drawEyeContour(EYE_LANDMARKS.leftEye, eyeColor);
    drawEyeContour(EYE_LANDMARKS.rightEye, eyeColor);
  }, [earLeft, earRight]);

  const onFaceResults = useCallback((results: any) => {
    if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
      setFaceDetected(false);
      return;
    }
    setFaceDetected(true);
    const lm = results.multiFaceLandmarks[0];

    // EAR calculation
    const earL = computeEAR(lm, EYE_LANDMARKS.leftEye);
    const earR = computeEAR(lm, EYE_LANDMARKS.rightEye);
    setEarLeft(parseFloat(earL.toFixed(3)));
    setEarRight(parseFloat(earR.toFixed(3)));

    // Head tilt: angle between nose tip (1) and forehead (10)
    const noseTip = lm[1];
    const forehead = lm[10];
    const dx = noseTip.x - forehead.x;
    const dy = noseTip.y - forehead.y;
    const tiltAngle = parseFloat((Math.atan2(dx, dy) * (180 / Math.PI)).toFixed(1));
    setHeadTilt(tiltAngle);

    // Drowsiness detection
    const avgEAR = (earL + earR) / 2;
    if (avgEAR < EAR_CLOSED_THRESH) {
      closedFrames.current += 1;
    } else {
      closedFrames.current = Math.max(0, closedFrames.current - 1);
    }

    const now = Date.now();
    if (closedFrames.current >= CLOSED_FRAMES_LIMIT && now - lastAlertTime.current > 5000) {
      lastAlertTime.current = now;
      setDrowsy(true);
      if ('vibrate' in navigator) navigator.vibrate([400, 200, 400]);
      setTimeout(() => {
        setDrowsy(false);
        closedFrames.current = 0;
      }, 5000);
    }

    drawMesh(lm);
  }, [drawMesh]);

  // Init MediaPipe FaceMesh
  useEffect(() => {
    let running = true;
    let animId: number;

    const init = async () => {
      try {
        const { FaceMesh } = await import('@mediapipe/face_mesh');
        const fm = new FaceMesh({
          locateFile: (file: string) => `${FACEMESH_CDN}/${file}`,
        });
        fm.setOptions({
          maxNumFaces: 1,
          refineLandmarks: true,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });
        fm.onResults(onFaceResults);
        await fm.initialize();
        faceMeshRef.current = fm;
        setModelReady(true);

        // Inference loop
        const loop = async () => {
          if (!running) return;
          const video = webcamRef.current?.video;
          if (video && video.readyState === 4 && faceMeshRef.current) {
            try { await faceMeshRef.current.send({ image: video }); } catch (_) {}
          }
          animId = requestAnimationFrame(loop);
        };
        loop();
      } catch (e) {
        setModelError('MediaPipe failed to load. Using fallback.');
      }
    };

    init();
    return () => {
      running = false;
      cancelAnimationFrame(animId);
      faceMeshRef.current?.close?.();
    };
  }, [onFaceResults]);

  const avgEAR = ((earLeft + earRight) / 2);
  const eyeClosurePct = Math.max(0, Math.min(100, Math.round((1 - avgEAR / 0.35) * 100)));
  const eyeStatusColor = avgEAR < EAR_CLOSED_THRESH ? 'text-danger-red' : 'text-neon-green';
  const headStatusColor = Math.abs(headTilt) > 15 ? 'text-amber-warning' : 'text-neon-green';

  if (modelError) {
    return <SimDemoMode onBack={onBack} />;
  }

  return (
    <div className="min-h-screen bg-black pb-24 pt-4 px-4 screen-enter">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={onBack} className="w-9 h-9 rounded-lg glass-card flex items-center justify-center">
          <ArrowLeft size={18} className="text-white/70" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-white">Driver Monitor</h1>
          <p className="text-[10px] text-neon-green">
            {modelReady ? '● AI Active · MediaPipe FaceMesh' : '⌛ Initializing model…'}
          </p>
        </div>
        <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-ai-blue/15 border border-ai-blue/25">
          <Brain size={12} className="text-ai-blue" />
          <span className="text-[9px] text-ai-blue font-mono">LIVE</span>
        </div>
      </div>

      {/* Video + Canvas overlay */}
      <div className="relative rounded-xl overflow-hidden bg-black border border-white/10 mb-4 w-full" style={{ height: 256 }}>
        <Webcam
          ref={webcamRef}
          audio={false}
          mirrored
          className="absolute inset-0 w-full h-full object-cover"
          videoConstraints={{ facingMode: 'user', width: 320, height: 240 }}
        />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          style={{ mixBlendMode: 'screen' }}
        />

        {/* HUD overlays */}
        <div className="absolute inset-0 pointer-events-none">
          {/* corner brackets */}
          {[
            'top-2 left-2 border-t border-l',
            'top-2 right-2 border-t border-r',
            'bottom-2 left-2 border-b border-l',
            'bottom-2 right-2 border-b border-r',
          ].map((cls, i) => (
            <div key={i} className={`absolute w-5 h-5 border-ai-blue/60 ${cls}`} />
          ))}

          <div className="absolute top-3 left-3 px-2 py-0.5 rounded bg-black/60 backdrop-blur-sm">
            <span className="text-[9px] text-ai-blue font-mono">
              {faceDetected ? `FACE · EAR L:${earLeft.toFixed(2)} R:${earRight.toFixed(2)}` : 'SCANNING…'}
            </span>
          </div>

          {!modelReady && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60">
              <div className="text-center">
                <div className="flex gap-1.5 justify-center mb-2">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="w-2 h-2 rounded-full bg-ai-blue typing-dot" style={{ animationDelay: `${i * 0.2}s` }} />
                  ))}
                </div>
                <p className="text-xs text-ai-blue font-mono">Loading AI model…</p>
              </div>
            </div>
          )}

          {drowsy && (
            <div className="absolute inset-0 bg-danger-red/25 flex items-center justify-center animate-shake">
              <div className="text-center px-4">
                <AlertOctagon size={36} className="text-danger-red mx-auto mb-2" />
                <p className="text-danger-red font-bold text-base">DROWSINESS DETECTED</p>
                <p className="text-white/80 text-xs mt-1">You seem drowsy. Please take a break.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <GlassCard className={`p-3.5 ${avgEAR < EAR_CLOSED_THRESH ? 'danger-border' : ''}`}>
          <Eye size={14} className={`mb-1.5 ${avgEAR < EAR_CLOSED_THRESH ? 'text-danger-red' : 'text-ai-blue'}`} />
          <p className={`text-xl font-bold stat-value ${eyeStatusColor}`}>{eyeClosurePct}%</p>
          <p className="text-[10px] text-white/40">Eye Closure</p>
        </GlassCard>

        <GlassCard className={`p-3.5 ${Math.abs(headTilt) > 15 ? 'danger-border' : ''}`}>
          <Activity size={14} className={`mb-1.5 ${headStatusColor}`} />
          <p className={`text-xl font-bold stat-value ${headStatusColor}`}>
            {headTilt > 0 ? '+' : ''}{headTilt}°
          </p>
          <p className="text-[10px] text-white/40">Head Tilt</p>
        </GlassCard>

        <GlassCard className="p-3.5">
          <Zap size={14} className="text-amber-warning mb-1.5" />
          <p className="text-sm font-bold text-white stat-value">
            {faceDetected ? 'Detected' : 'None'}
          </p>
          <p className="text-[10px] text-white/40">Face Lock</p>
        </GlassCard>

        <GlassCard className={`p-3.5 ${drowsy ? 'danger-border' : ''}`}>
          <Brain size={14} className={`mb-1.5 ${drowsy ? 'text-danger-red' : 'text-neon-green'}`} />
          <p className={`text-sm font-bold stat-value ${drowsy ? 'text-danger-red' : 'text-neon-green'}`}>
            {drowsy ? 'Fatigued' : 'Alert'}
          </p>
          <p className="text-[10px] text-white/40">Status</p>
        </GlassCard>
      </div>

      <GlassCard className="flex items-center justify-between p-4">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${drowsy ? 'bg-danger-red animate-pulse' : 'bg-neon-green'}`} />
          <span className="text-sm text-white">{drowsy ? 'Drowsiness Alert Active' : 'Driver Alert: Normal'}</span>
        </div>
        <span className="text-xs text-white/40 font-mono">LIVE AI</span>
      </GlassCard>
    </div>
  );
};

// ─── Entry: Permission Gate ────────────────────────────────────────────
type PermState = 'asking' | 'granted' | 'denied';

const DriverMonitoring: React.FC = () => {
  const { navigate } = useApp();
  const [permState, setPermState] = useState<PermState>('asking');

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        stream.getTracks().forEach((t) => t.stop()); // release immediately
        setPermState('granted');
      })
      .catch(() => setPermState('denied'));
  }, []);

  if (permState === 'asking') {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 screen-enter">
        <div className="w-16 h-16 rounded-2xl bg-ai-blue/15 border border-ai-blue/30 flex items-center justify-center mb-5">
          <Camera size={32} className="text-ai-blue" />
        </div>
        <h2 className="text-lg font-bold text-white mb-2">Camera Permission</h2>
        <p className="text-sm text-white/50 text-center text-pretty mb-6">
          SafeDrive AI needs webcam access to enable real-time drowsiness and head-tilt detection.
        </p>
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="w-2 h-2 rounded-full bg-ai-blue typing-dot" style={{ animationDelay: `${i * 0.2}s` }} />
          ))}
        </div>
      </div>
    );
  }

  if (permState === 'denied') {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 screen-enter">
        <div className="w-16 h-16 rounded-2xl bg-amber-warning/15 border border-amber-warning/30 flex items-center justify-center mb-5">
          <CameraOff size={32} className="text-amber-warning" />
        </div>
        <h2 className="text-lg font-bold text-white mb-2">Camera Access Denied</h2>
        <p className="text-sm text-white/50 text-center text-pretty mb-2">
          Switching to demo mode with simulated detection.
        </p>
        <p className="text-[10px] text-amber-warning text-center mb-6">
          To enable real AI detection, allow camera access in browser settings.
        </p>
        <button onClick={() => setPermState('denied')} className="hidden" />
        <SimDemoMode onBack={() => navigate('home')} />
      </div>
    );
  }

  return <RealAIMode onBack={() => navigate('home')} />;
};

export default DriverMonitoring;
