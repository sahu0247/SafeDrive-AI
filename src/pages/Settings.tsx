import React, { useState } from 'react';
import { ArrowLeft, Volume2, Bell, Moon, Gauge, Globe, UserPlus, Trash2, Save, BookUser, CheckCircle } from 'lucide-react';
import { GlassCard } from '@/components/safedrive/GlassCard';
import { useApp, type Language, type EmergencyContact } from '@/contexts/AppContext';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { hasContactsApi } from '@/utils/deviceContacts';

const languages: { code: Language; label: string }[] = [
  { code: 'English', label: 'English' },
  { code: 'Telugu', label: 'Telugu (తెలుగు)' },
  { code: 'Hindi', label: 'Hindi (हिंदी)' },
];

const Settings: React.FC = () => {
  const { state, navigate, updateSettings, addContact, removeContact } = useApp();
  const { settings, emergencyContacts } = state;
  const [newContactName, setNewContactName] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [importStatus, setImportStatus] = useState<'idle' | 'loading' | 'done' | 'unsupported'>('idle');

  const handleAddContact = () => {
    if (!newContactName.trim() || !newContactPhone.trim()) return;
    if (emergencyContacts.length >= 3) return;
    const contact: EmergencyContact = {
      id: Date.now().toString(),
      name: newContactName.trim(),
      phone: newContactPhone.trim(),
    };
    addContact(contact);
    setNewContactName('');
    setNewContactPhone('');
    setShowAddForm(false);
  };

  // Import contacts from device via Web Contacts API (Chrome Android + Safari iOS 14.4+)
  const handleImportFromDevice = async () => {
    if (!hasContactsApi()) {
      setImportStatus('unsupported');
      setTimeout(() => setImportStatus('idle'), 3000);
      return;
    }
    setImportStatus('loading');
    try {
      const slots = 3 - emergencyContacts.length;
      if (slots <= 0) return;
      const results = await navigator.contacts!.select(['name', 'tel'], { multiple: slots > 1 });
      let added = 0;
      for (const entry of results) {
        if (added >= slots) break;
        const name  = entry.name?.[0]?.trim() ?? '';
        const phone = entry.tel?.[0]?.trim()  ?? '';
        if (!name || !phone) continue;
        if (emergencyContacts.some((c) => c.phone === phone)) continue;
        addContact({ id: Date.now().toString() + added, name, phone });
        added++;
      }
      setImportStatus('done');
      setTimeout(() => setImportStatus('idle'), 2500);
    } catch {
      setImportStatus('idle');
    }
  };

  const handleSave = () => {
    navigate('home');
  };

  return (
    <div className="min-h-screen bg-black pb-24 pt-4 px-4 screen-enter">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('home')} className="w-9 h-9 rounded-lg glass-card flex items-center justify-center">
          <ArrowLeft size={18} className="text-white/70" />
        </button>
        <h1 className="text-xl font-bold text-white">Settings</h1>
      </div>

      {/* Alerts Section */}
      <h2 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">Alerts</h2>
      <GlassCard className="mb-5 p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-neon-green/20 flex items-center justify-center">
              <Volume2 size={18} className="text-neon-green" />
            </div>
            <div>
              <p className="text-sm text-white font-medium">Voice Alerts</p>
              <p className="text-[10px] text-white/40">Audio warnings during drive</p>
            </div>
          </div>
          <Switch
            checked={settings.voiceAlerts}
            onCheckedChange={(checked) => updateSettings({ voiceAlerts: checked })}
          />
        </div>

        <div className="h-px bg-white/10" />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-danger-red/20 flex items-center justify-center">
              <Bell size={18} className="text-danger-red" />
            </div>
            <div>
              <p className="text-sm text-white font-medium">Auto SOS</p>
              <p className="text-[10px] text-white/40">Automatically dispatch on crash</p>
            </div>
          </div>
          <Switch
            checked={settings.autoSOS}
            onCheckedChange={(checked) => updateSettings({ autoSOS: checked })}
          />
        </div>
      </GlassCard>

      {/* Crash Sensitivity */}
      <h2 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">Crash Detection</h2>
      <GlassCard className="mb-5 p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-lg bg-amber-warning/20 flex items-center justify-center">
            <Gauge size={18} className="text-amber-warning" />
          </div>
          <div>
            <p className="text-sm text-white font-medium">Crash Sensitivity</p>
            <p className="text-[10px] text-white/40">{settings.crashSensitivity}% — {settings.crashSensitivity < 30 ? 'Low' : settings.crashSensitivity < 70 ? 'Medium' : 'High'}</p>
          </div>
        </div>
        <Slider
          value={[settings.crashSensitivity]}
          onValueChange={(value) => updateSettings({ crashSensitivity: value[0] })}
          max={100}
          step={5}
          className="w-full"
        />
        <div className="flex justify-between mt-2">
          <span className="text-[10px] text-white/30">Less sensitive</span>
          <span className="text-[10px] text-white/30">More sensitive</span>
        </div>
      </GlassCard>

      {/* Night Mode */}
      <h2 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">Display</h2>
      <GlassCard className="mb-5 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-ai-blue/20 flex items-center justify-center">
              <Moon size={18} className="text-ai-blue" />
            </div>
            <div>
              <p className="text-sm text-white font-medium">Night Mode</p>
              <p className="text-[10px] text-white/40">Reduces brightness, warmer tones</p>
            </div>
          </div>
          <Switch
            checked={settings.nightMode}
            onCheckedChange={(checked) => updateSettings({ nightMode: checked })}
          />
        </div>
        {settings.nightMode && (
          <div className="mt-3 p-2.5 rounded-lg bg-amber-warning/10 border border-amber-warning/20">
            <p className="text-[10px] text-amber-warning">Night mode active: Screen brightness reduced, accent colors changed to warmer tones for reduced eye strain.</p>
          </div>
        )}
      </GlassCard>

      {/* Language */}
      <h2 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">Language</h2>
      <GlassCard className="mb-5 p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-lg bg-neon-green/20 flex items-center justify-center">
            <Globe size={18} className="text-neon-green" />
          </div>
          <p className="text-sm text-white font-medium">App Language</p>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => updateSettings({ language: lang.code })}
              className={`py-2.5 rounded-lg text-xs font-medium transition-all ${
                settings.language === lang.code
                  ? 'bg-neon-green text-black'
                  : 'bg-white/5 text-white/60 border border-white/10'
              }`}
            >
              {lang.label}
            </button>
          ))}
        </div>
      </GlassCard>

      {/* Emergency Contacts */}
      <h2 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">
        Emergency Contacts ({emergencyContacts.length}/3)
      </h2>
      <GlassCard className="mb-5 p-4">
        <div className="space-y-3">
          {emergencyContacts.map((contact) => (
            <div key={contact.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
              <div>
                <p className="text-sm text-white font-medium">{contact.name}</p>
                <p className="text-xs text-white/50 font-mono">{contact.phone}</p>
              </div>
              <button
                onClick={() => removeContact(contact.id)}
                className="w-8 h-8 rounded-lg bg-danger-red/20 flex items-center justify-center active:scale-95 transition-transform"
              >
                <Trash2 size={14} className="text-danger-red" />
              </button>
            </div>
          ))}

          {emergencyContacts.length < 3 && (
            <>
              {/* Import from device contacts */}
              <button
                onClick={handleImportFromDevice}
                disabled={importStatus === 'loading'}
                className="w-full py-3 rounded-lg border border-dashed border-ai-blue/40 bg-ai-blue/5 flex items-center justify-center gap-2 text-sm text-ai-blue active:bg-ai-blue/10 transition-colors disabled:opacity-50"
              >
                {importStatus === 'loading' ? (
                  <span className="text-sm text-ai-blue animate-pulse">Opening contacts…</span>
                ) : importStatus === 'done' ? (
                  <><CheckCircle size={15} /><span>Contact added!</span></>
                ) : importStatus === 'unsupported' ? (
                  <span className="text-xs text-amber-warning">Not supported on this browser. Use manual entry below.</span>
                ) : (
                  <><BookUser size={15} /><span>Import from Device Contacts</span></>
                )}
              </button>

              {!showAddForm ? (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="w-full py-3 rounded-lg border border-dashed border-white/20 flex items-center justify-center gap-2 text-sm text-white/50 active:bg-white/5 transition-colors"
                >
                  <UserPlus size={16} />
                  Add Manually
                </button>
              ) : (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={newContactName}
                    onChange={(e) => setNewContactName(e.target.value)}
                    placeholder="Contact name"
                    className="w-full px-3 py-2.5 rounded-lg bg-white/5 text-sm text-white placeholder-white/30 outline-none border border-white/10 focus:border-neon-green/50"
                  />
                  <input
                    type="tel"
                    value={newContactPhone}
                    onChange={(e) => setNewContactPhone(e.target.value)}
                    placeholder="Phone number"
                    className="w-full px-3 py-2.5 rounded-lg bg-white/5 text-sm text-white placeholder-white/30 outline-none border border-white/10 focus:border-neon-green/50"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowAddForm(false)}
                      className="flex-1 py-2.5 rounded-lg bg-white/5 text-white/60 text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddContact}
                      className="flex-1 py-2.5 rounded-lg bg-neon-green text-black text-sm font-medium"
                    >
                      Add
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {emergencyContacts.length >= 3 && (
            <p className="text-xs text-white/30 text-center">Maximum 3 contacts allowed</p>
          )}
        </div>
      </GlassCard>

      {/* SOS Settings Info */}
      <GlassCard className="mb-5 p-4">
        <p className="text-sm font-semibold text-white mb-2">SOS Settings</p>
        <div className="space-y-2 text-xs text-white/50">
          <p>Countdown duration: 10 seconds</p>
          <p>Location accuracy: GPS + Network</p>
          <p>SMS template includes location and timestamp</p>
        </div>
      </GlassCard>

      <button
        onClick={handleSave}
        className="w-full py-3.5 rounded-xl bg-neon-green text-black font-semibold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
      >
        <Save size={18} />
        Save Settings
      </button>
    </div>
  );
};

export default Settings;
