import React, { useState } from 'react';
import {
  Shield,
  User,
  Phone,
  Heart,
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  Droplets,
  BookUser,
} from 'lucide-react';
import { useApp, type UserProfile, type BloodGroup, type EmergencyContact } from '@/contexts/AppContext';
import { hasContactsApi } from '@/utils/deviceContacts';

const BLOOD_GROUPS: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

interface FormData {
  fullName: string;
  contact1Name: string;
  contact1Phone: string;
  contact2Name: string;
  contact2Phone: string;
  bloodGroup: BloodGroup;
}

const inputClass =
  'w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-neon-green/50 focus:bg-white/8 transition-all duration-200';
const labelClass = 'text-[10px] text-white/50 uppercase tracking-wider mb-1.5 block';

// Progress dots row
const ProgressBar: React.FC<{ step: number; total: number }> = ({ step, total }) => (
  <div className="flex items-center justify-center gap-2 mb-6">
    {Array.from({ length: total }).map((_, i) => (
      <React.Fragment key={i}>
        <div
          className={`transition-all duration-400 rounded-full ${
            i < step
              ? 'w-6 h-2 bg-neon-green shadow-[0_0_6px_rgba(0,255,153,0.6)]'
              : i === step
              ? 'w-8 h-2 bg-neon-green/80 shadow-[0_0_8px_rgba(0,255,153,0.5)]'
              : 'w-2 h-2 bg-white/15'
          }`}
        />
      </React.Fragment>
    ))}
  </div>
);

const OnboardingFlow: React.FC = () => {
  const { completeOnboarding } = useApp();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>({
    fullName: '',
    contact1Name: '',
    contact1Phone: '',
    contact2Name: '',
    contact2Phone: '',
    bloodGroup: '',
  });
  const [importStatus, setImportStatus] = useState<'idle' | 'loading' | 'done' | 'unsupported'>('idle');

  const set = (key: keyof FormData, val: string) =>
    setForm((p) => ({ ...p, [key]: val }));

  // Import up to 2 contacts from device address book
  const handleImportContacts = async () => {
    if (!hasContactsApi()) {
      setImportStatus('unsupported');
      setTimeout(() => setImportStatus('idle'), 3000);
      return;
    }
    setImportStatus('loading');
    try {
      const results = await navigator.contacts!.select(['name', 'tel'], { multiple: true });
      const picked = results.slice(0, 2);
      if (picked[0]) {
        const name  = picked[0].name?.[0]?.trim() ?? '';
        const phone = picked[0].tel?.[0]?.trim()  ?? '';
        if (name)  setForm((p) => ({ ...p, contact1Name: name }));
        if (phone) setForm((p) => ({ ...p, contact1Phone: phone }));
      }
      if (picked[1]) {
        const name  = picked[1].name?.[0]?.trim() ?? '';
        const phone = picked[1].tel?.[0]?.trim()  ?? '';
        if (name)  setForm((p) => ({ ...p, contact2Name: name }));
        if (phone) setForm((p) => ({ ...p, contact2Phone: phone }));
      }
      setImportStatus('done');
      setTimeout(() => setImportStatus('idle'), 2500);
    } catch {
      setImportStatus('idle');
    }
  };

  const handleComplete = () => {
    setStep(4);
    const profile: UserProfile = {
      fullName: form.fullName.trim(),
      bloodGroup: form.bloodGroup,
      onboardingComplete: true,
    };
    const contacts: EmergencyContact[] = [];
    if (form.contact1Name.trim() && form.contact1Phone.trim()) {
      contacts.push({ id: 'c1', name: form.contact1Name.trim(), phone: form.contact1Phone.trim() });
    }
    if (form.contact2Name.trim() && form.contact2Phone.trim()) {
      contacts.push({ id: 'c2', name: form.contact2Name.trim(), phone: form.contact2Phone.trim() });
    }
    // Navigate to home after brief success animation
    setTimeout(() => completeOnboarding(profile, contacts), 1800);
  };

  // ─── STEP 0 — Welcome ─────────────────────────────────────────────
  if (step === 0) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 screen-enter">
        {/* Logo */}
        <div className="relative mb-8">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-neon-green/20 to-neon-green/5 border border-neon-green/30 flex items-center justify-center">
            <Shield size={40} className="text-neon-green" strokeWidth={1.5} />
          </div>
          <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-neon-green flex items-center justify-center">
            <span className="text-black text-[9px] font-bold">AI</span>
          </div>
        </div>

        <h1 className="text-3xl font-bold text-white mb-2 text-balance text-center">
          Welcome to SafeDrive <span className="text-neon-green">AI</span>
        </h1>
        <p className="text-sm text-white/50 text-center mb-10 max-w-xs text-pretty">
          Let's set up your safety profile so we can protect you and your loved ones on every drive.
        </p>

        {/* Feature pills */}
        <div className="space-y-3 w-full max-w-xs mb-12">
          {[
            { icon: User, text: 'Personal ID for emergency responders' },
            { icon: Phone, text: 'Auto-contact during crash SOS' },
            { icon: Heart, text: 'Medical info for first responders' },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
              <div className="w-8 h-8 rounded-lg bg-neon-green/15 flex items-center justify-center shrink-0">
                <Icon size={16} className="text-neon-green" />
              </div>
              <p className="text-sm text-white/70">{text}</p>
            </div>
          ))}
        </div>

        <button
          onClick={() => setStep(1)}
          className="w-full max-w-xs py-4 rounded-2xl bg-neon-green text-black font-bold text-base flex items-center justify-center gap-2 active:scale-[0.98] transition-transform shadow-[0_0_20px_rgba(0,255,153,0.3)]"
        >
          Get Started
          <ChevronRight size={20} />
        </button>
        <p className="text-[10px] text-white/25 mt-4">Takes about 1 minute</p>
      </div>
    );
  }

  // ─── STEP 4 — Done ────────────────────────────────────────────────
  if (step === 4) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-8 screen-enter">
        {/* Success ring */}
        <div className="relative w-28 h-28 mb-6">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="42" stroke="rgba(0,255,153,0.15)" strokeWidth="5" fill="none" />
            <circle
              cx="50" cy="50" r="42" stroke="#00FF99" strokeWidth="5" fill="none"
              strokeLinecap="round" strokeDasharray="263.9" strokeDashoffset="0"
              style={{ filter: 'drop-shadow(0 0 8px rgba(0,255,153,0.6))', transition: 'stroke-dashoffset 1.2s ease-out' }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <CheckCircle size={42} className="text-neon-green" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2 text-balance">You're all set!</h2>
        <p className="text-sm text-white/50 text-center text-pretty">
          Safety profile saved. Launching SafeDrive AI…
        </p>
        <div className="flex gap-1.5 mt-8">
          {[0, 1, 2].map((i) => (
            <div key={i} className="w-2 h-2 rounded-full bg-neon-green typing-dot" style={{ animationDelay: `${i * 0.2}s` }} />
          ))}
        </div>
      </div>
    );
  }

  // ─── STEPS 1–3 — Form card wrapper ────────────────────────────────
  return (
    <div className="min-h-screen bg-black flex flex-col justify-center p-5 screen-enter">
      {/* Header */}
      <div className="text-center mb-6">
        <p className="text-[10px] text-white/40 uppercase tracking-widest mb-1">
          Step {step} of 3
        </p>
        <h2 className="text-xl font-bold text-white">
          {step === 1 && 'Your Profile'}
          {step === 2 && 'Emergency Contacts'}
          {step === 3 && 'Medical Info'}
        </h2>
        <p className="text-xs text-white/40 mt-1">
          {step === 1 && 'Tell us your name so responders can identify you'}
          {step === 2 && 'Who should we call if you\'re in an accident?'}
          {step === 3 && 'Optional — helps first responders in an emergency'}
        </p>
      </div>

      {/* Progress bar */}
      <ProgressBar step={step - 1} total={3} />

      {/* Card */}
      <div className="glass-card-strong rounded-2xl p-5 space-y-5">

        {/* ── Step 1: Personal Info ── */}
        {step === 1 && (
          <>
            <div>
              <label className={labelClass}>
                <User size={10} className="inline mr-1.5" />
                Full Name <span className="text-danger-red">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Arjun Reddy"
                value={form.fullName}
                onChange={(e) => set('fullName', e.target.value)}
                className={inputClass}
                autoFocus
              />
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-ai-blue/10 border border-ai-blue/20">
              <Shield size={15} className="text-ai-blue mt-0.5 shrink-0" />
              <p className="text-[11px] text-white/60 leading-relaxed">
                Your name will appear in emergency dispatch messages and crash reports shared with authorities.
              </p>
            </div>
          </>
        )}

        {/* ── Step 2: Emergency Contacts ── */}
        {step === 2 && (
          <>
            {/* Import from device button */}
            <button
              onClick={handleImportContacts}
              disabled={importStatus === 'loading'}
              className="w-full py-3 rounded-xl border border-dashed border-ai-blue/40 bg-ai-blue/5 flex items-center justify-center gap-2 text-sm text-ai-blue active:bg-ai-blue/10 transition-colors disabled:opacity-50"
            >
              {importStatus === 'loading' ? (
                <span className="animate-pulse text-ai-blue text-sm">Opening contacts…</span>
              ) : importStatus === 'done' ? (
                <><CheckCircle size={15} /><span>Contacts imported!</span></>
              ) : importStatus === 'unsupported' ? (
                <span className="text-xs text-amber-warning">Not supported — fill in manually below</span>
              ) : (
                <><BookUser size={15} /><span>Import from Device Contacts</span></>
              )}
            </button>

            {/* Contact 1 */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-full bg-neon-green flex items-center justify-center shrink-0">
                  <span className="text-black text-[10px] font-bold">1</span>
                </div>
                <span className="text-sm text-white font-semibold">Primary Contact</span>
                <span className="text-[9px] text-danger-red ml-auto">Required</span>
              </div>
              <div className="space-y-3">
                <div>
                  <label className={labelClass}>Contact Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Priya Reddy"
                    value={form.contact1Name}
                    onChange={(e) => set('contact1Name', e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Phone Number</label>
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={form.contact1Phone}
                    onChange={(e) => set('contact1Phone', e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            <div className="h-px bg-white/8" />

            {/* Contact 2 */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-full bg-white/15 flex items-center justify-center shrink-0">
                  <span className="text-white/60 text-[10px] font-bold">2</span>
                </div>
                <span className="text-sm text-white font-semibold">Secondary Contact</span>
                <span className="text-[9px] text-white/30 ml-auto">Optional</span>
              </div>
              <div className="space-y-3">
                <div>
                  <label className={labelClass}>Contact Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Ramesh Kumar"
                    value={form.contact2Name}
                    onChange={(e) => set('contact2Name', e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Phone Number</label>
                  <input
                    type="tel"
                    placeholder="+91 99887 65432"
                    value={form.contact2Phone}
                    onChange={(e) => set('contact2Phone', e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-warning/10 border border-amber-warning/20">
              <Phone size={15} className="text-amber-warning mt-0.5 shrink-0" />
              <p className="text-[11px] text-white/60 leading-relaxed">
                During a crash SOS, the native SMS app will open for each contact pre-filled with your GPS location.
              </p>
            </div>
          </>
        )}

        {/* ── Step 3: Medical Info ── */}
        {step === 3 && (
          <>
            <div>
              <label className={labelClass}>
                <Droplets size={10} className="inline mr-1.5" />
                Blood Group
                <span className="text-white/30 ml-1.5">(Optional)</span>
              </label>
              <div className="grid grid-cols-4 gap-2 mt-2">
                {BLOOD_GROUPS.map((bg) => (
                  <button
                    key={bg}
                    onClick={() => set('bloodGroup', form.bloodGroup === bg ? '' : bg)}
                    className={`py-3 rounded-xl text-sm font-bold transition-all duration-200 active:scale-95 ${
                      form.bloodGroup === bg
                        ? 'bg-danger-red/20 border-2 border-danger-red text-danger-red shadow-[0_0_8px_rgba(255,59,48,0.3)]'
                        : 'bg-white/5 border border-white/15 text-white/60 hover:border-white/30'
                    }`}
                  >
                    {bg}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-danger-red/10 border border-danger-red/20">
              <Heart size={15} className="text-danger-red mt-0.5 shrink-0" />
              <p className="text-[11px] text-white/60 leading-relaxed">
                Blood group is included in crash reports sent to emergency authorities to speed up medical response.
              </p>
            </div>
          </>
        )}
      </div>

      {/* Navigation */}
      <div className="flex gap-3 mt-5">
        <button
          onClick={() => setStep((p) => p - 1)}
          className="w-12 h-12 rounded-xl glass-card flex items-center justify-center shrink-0 active:scale-90 transition-transform"
        >
          <ChevronLeft size={20} className="text-white/60" />
        </button>

        {step < 3 ? (
          <button
            onClick={() => setStep((p) => p + 1)}
            disabled={
              (step === 1 && !form.fullName.trim()) ||
              (step === 2 && (!form.contact1Name.trim() || !form.contact1Phone.trim()))
            }
            className="flex-1 py-3.5 rounded-xl bg-neon-green text-black font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all duration-200 disabled:opacity-40 disabled:scale-100 shadow-[0_0_16px_rgba(0,255,153,0.25)]"
          >
            Next
            <ChevronRight size={18} />
          </button>
        ) : (
          <button
            onClick={handleComplete}
            className="flex-1 py-3.5 rounded-xl bg-neon-green text-black font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform shadow-[0_0_16px_rgba(0,255,153,0.25)]"
          >
            <CheckCircle size={18} />
            Complete Setup
          </button>
        )}
      </div>

      {/* Skip for now (Step 3 only) */}
      {step === 3 && (
        <button
          onClick={handleComplete}
          className="text-center text-[11px] text-white/30 mt-3 w-full py-2 active:text-white/50 transition-colors"
        >
          Skip for now
        </button>
      )}
    </div>
  );
};

export default OnboardingFlow;
