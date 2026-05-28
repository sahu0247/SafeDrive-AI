import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AppProvider, useApp } from '@/contexts/AppContext';
import { BottomNav } from '@/components/safedrive/BottomNav';
import { PanicButton } from '@/components/safedrive/PanicButton';
import { Toaster } from '@/components/ui/sonner';

import SplashScreen from '@/pages/SplashScreen';
import OnboardingFlow from '@/pages/OnboardingFlow';
import HomeDashboard from '@/pages/HomeDashboard';
import DriveMode from '@/pages/DriveMode';
import DriveSummary from '@/pages/DriveSummary';
import DriverMonitoring from '@/pages/DriverMonitoring';
import LegalAssistant from '@/pages/LegalAssistant';
import CrashSOS from '@/pages/CrashSOS';
import IncidentReporter from '@/pages/IncidentReporter';
import Analytics from '@/pages/Analytics';
import Settings from '@/pages/Settings';

const ScreenRouter: React.FC = () => {
  const { state } = useApp();

  switch (state.currentScreen) {
    case 'splash':
      return <SplashScreen />;
    case 'onboarding':
      return <OnboardingFlow />;
    case 'home':
      return <HomeDashboard />;
    case 'drive':
      return <DriveMode />;
    case 'driveSummary':
      return <DriveSummary />;
    case 'monitor':
      return <DriverMonitoring />;
    case 'assistant':
      return <LegalAssistant />;
    case 'sos':
      return <CrashSOS />;
    case 'incident':
      return <IncidentReporter />;
    case 'analytics':
      return <Analytics />;
    case 'settings':
      return <Settings />;
    default:
      return <HomeDashboard />;
  }
};

const AppContent: React.FC = () => {
  const { state } = useApp();
  const uiScreens = ['splash', 'onboarding', 'drive', 'sos'];
  const showNav = !uiScreens.includes(state.currentScreen);
  const showPanic = state.currentScreen !== 'splash' && state.currentScreen !== 'onboarding';

  return (
    <div className="min-h-screen bg-black max-w-lg mx-auto relative">
      <ScreenRouter />
      {showPanic && <PanicButton />}
      {showNav && <BottomNav />}
      <Toaster />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </Router>
  );
};

export default App;
