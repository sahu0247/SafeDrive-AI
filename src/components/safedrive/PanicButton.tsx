import React from 'react';
import { Siren } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';

export const PanicButton: React.FC = () => {
  const { navigate } = useApp();

  const handlePanic = () => {
    // Pre-warm GPS before navigating so CrashSOS picks it up faster
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        () => {},  // CrashSOS will request again with its own handler
        () => {},
        { timeout: 5000, maximumAge: 30000, enableHighAccuracy: true }
      );
    }
    navigate('sos');
  };

  return (
    <button
      onClick={handlePanic}
      className="fixed bottom-20 right-4 z-50 w-14 h-14 rounded-full bg-danger-red flex items-center justify-center shadow-lg animate-pulse-danger transition-transform active:scale-95"
      aria-label="Emergency SOS"
    >
      <Siren size={24} className="text-white" strokeWidth={2.5} />
    </button>
  );
};
