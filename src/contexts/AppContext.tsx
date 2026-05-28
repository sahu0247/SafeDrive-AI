import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';

export type Screen =
  | 'splash'
  | 'onboarding'
  | 'home'
  | 'drive'
  | 'driveSummary'
  | 'monitor'
  | 'assistant'
  | 'sos'
  | 'incident'
  | 'analytics'
  | 'settings';

export type Language = 'English' | 'Telugu' | 'Hindi';
export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'O+' | 'O-' | 'AB+' | 'AB-' | '';

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
}

export interface UserProfile {
  fullName: string;
  bloodGroup: BloodGroup;
  onboardingComplete: boolean;
}

export interface DriveLog {
  id: string;
  date: string;
  distance: number;
  score: number;
  alerts: string[];
  harshBraking: number;
  duration: number; // minutes
  overspeedCount: number;
  drowsinessCount: number;
  routePath: Array<{ lat: number; lng: number }>;
}

export interface AnalyticsData {
  totalSafeKm: number;
  totalDrives: number;
  avgScore: number;
  weeklyScores: { day: string; score: number; alerts: number; braking: number }[];
  monthlyKm: { week: string; km: number }[];
}

export interface AppSettings {
  voiceAlerts: boolean;
  autoSOS: boolean;
  nightMode: boolean;
  crashSensitivity: number;
  language: Language;
}

export interface AppState {
  currentScreen: Screen;
  previousScreen: Screen;
  settings: AppSettings;
  emergencyContacts: EmergencyContact[];
  userProfile: UserProfile;
  drivingScore: number;
  currentSpeed: number;
  safeKm: number;
  alerts: string[];
  /** Current GPS location for SOS / route tracking */
  currentLocation: { lat: number; lng: number; address: string } | null;
  driveSession: {
    active: boolean;
    distance: number;
    harshBraking: number;
    alertsTriggered: number;
    overspeedCount: number;
    drowsinessCount: number;
    startTime: number | null;
    /** GPS breadcrumb path recorded during this drive */
    routePath: Array<{ lat: number; lng: number }>;
  };
  driveLogs: DriveLog[];
  analyticsData: AnalyticsData;
}

const defaultSettings: AppSettings = {
  voiceAlerts: true,
  autoSOS: false,
  nightMode: false,
  crashSensitivity: 50,
  language: 'English',
};

const defaultContacts: EmergencyContact[] = [
  { id: '1', name: 'Emergency Contact 1', phone: '+91 98765 43210' },
];

const defaultWeeklyScores = [
  { day: 'Mon', score: 82, alerts: 2, braking: 1 },
  { day: 'Tue', score: 88, alerts: 1, braking: 0 },
  { day: 'Wed', score: 85, alerts: 2, braking: 1 },
  { day: 'Thu', score: 91, alerts: 0, braking: 0 },
  { day: 'Fri', score: 87, alerts: 1, braking: 2 },
  { day: 'Sat', score: 93, alerts: 0, braking: 0 },
  { day: 'Sun', score: 89, alerts: 1, braking: 1 },
];

const defaultAnalytics: AnalyticsData = {
  totalSafeKm: 142,
  totalDrives: 12,
  avgScore: 88,
  weeklyScores: defaultWeeklyScores,
  monthlyKm: [
    { week: 'W1', km: 120 },
    { week: 'W2', km: 145 },
    { week: 'W3', km: 98 },
    { week: 'W4', km: 142 },
  ],
};

const defaultDriveLogs: DriveLog[] = [
  {
    id: 'log1',
    date: new Date(Date.now() - 86400000).toISOString(),
    distance: 14.2,
    score: 91,
    alerts: ['Overspeed'],
    harshBraking: 1,
    duration: 28,
    overspeedCount: 1,
    drowsinessCount: 0,
    routePath: [],
  },
  {
    id: 'log2',
    date: new Date(Date.now() - 2 * 86400000).toISOString(),
    distance: 9.8,
    score: 85,
    alerts: [],
    harshBraking: 0,
    duration: 19,
    overspeedCount: 0,
    drowsinessCount: 0,
    routePath: [],
  },
];

const defaultProfile: UserProfile = {
  fullName: '',
  bloodGroup: '',
  onboardingComplete: false,
};

const initialState: AppState = {
  currentScreen: 'splash',
  previousScreen: 'splash',
  settings: defaultSettings,
  emergencyContacts: defaultContacts,
  userProfile: defaultProfile,
  drivingScore: 87,
  currentSpeed: 0,
  safeKm: 142,
  alerts: [],
  currentLocation: null,
  driveSession: {
    active: false,
    distance: 0,
    harshBraking: 0,
    alertsTriggered: 0,
    overspeedCount: 0,
    drowsinessCount: 0,
    startTime: null,
    routePath: [],
  },
  driveLogs: defaultDriveLogs,
  analyticsData: defaultAnalytics,
};

interface AppContextType {
  state: AppState;
  navigate: (screen: Screen) => void;
  goBack: () => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  addContact: (contact: EmergencyContact) => void;
  removeContact: (id: string) => void;
  updateDrivingScore: (score: number) => void;
  updateSpeed: (speed: number) => void;
  updateLocation: (lat: number, lng: number, address?: string) => void;
  addRoutePoint: (lat: number, lng: number) => void;
  startDrive: () => void;
  endDrive: () => void;
  addAlert: (alert: string) => void;
  clearAlerts: () => void;
  completeOnboarding: (profile: UserProfile, contacts: EmergencyContact[]) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Persisted slices
  const [savedSettings, setSavedSettings] = useLocalStorage<AppSettings>('sd_settings', defaultSettings);
  const [savedContacts, setSavedContacts] = useLocalStorage<EmergencyContact[]>('sd_contacts', defaultContacts);
  const [savedLogs, setSavedLogs] = useLocalStorage<DriveLog[]>('sd_drive_logs', defaultDriveLogs);
  const [savedAnalytics, setSavedAnalytics] = useLocalStorage<AnalyticsData>('sd_analytics', defaultAnalytics);
  const [savedScore, setSavedScore] = useLocalStorage<number>('sd_score', 87);
  const [savedSafeKm, setSavedSafeKm] = useLocalStorage<number>('sd_safe_km', 142);
  const [savedProfile, setSavedProfile] = useLocalStorage<UserProfile>('sd_profile', defaultProfile);

  const [state, setState] = useState<AppState>({
    ...initialState,
    settings: savedSettings,
    emergencyContacts: savedContacts,
    userProfile: savedProfile,
    driveLogs: savedLogs,
    analyticsData: savedAnalytics,
    drivingScore: savedScore,
    safeKm: savedSafeKm,
    currentLocation: null,
  });

  // Sync persisted slices back whenever state changes
  useEffect(() => {
    setSavedSettings(state.settings);
  }, [state.settings, setSavedSettings]);

  useEffect(() => {
    setSavedContacts(state.emergencyContacts);
  }, [state.emergencyContacts, setSavedContacts]);

  useEffect(() => {
    setSavedProfile(state.userProfile);
  }, [state.userProfile, setSavedProfile]);

  useEffect(() => {
    setSavedLogs(state.driveLogs);
  }, [state.driveLogs, setSavedLogs]);

  useEffect(() => {
    setSavedAnalytics(state.analyticsData);
  }, [state.analyticsData, setSavedAnalytics]);

  useEffect(() => {
    setSavedScore(state.drivingScore);
  }, [state.drivingScore, setSavedScore]);

  useEffect(() => {
    setSavedSafeKm(state.safeKm);
  }, [state.safeKm, setSavedSafeKm]);

  const navigate = useCallback((screen: Screen) => {
    setState((prev) => ({
      ...prev,
      previousScreen: prev.currentScreen,
      currentScreen: screen,
    }));
  }, []);

  const goBack = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentScreen: prev.previousScreen,
      previousScreen: 'home',
    }));
  }, []);

  const updateSettings = useCallback((settings: Partial<AppSettings>) => {
    setState((prev) => ({
      ...prev,
      settings: { ...prev.settings, ...settings },
    }));
  }, []);

  const addContact = useCallback((contact: EmergencyContact) => {
    setState((prev) => {
      if (prev.emergencyContacts.length >= 3) return prev;
      return { ...prev, emergencyContacts: [...prev.emergencyContacts, contact] };
    });
  }, []);

  const removeContact = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      emergencyContacts: prev.emergencyContacts.filter((c) => c.id !== id),
    }));
  }, []);

  const updateDrivingScore = useCallback((score: number) => {
    setState((prev) => ({ ...prev, drivingScore: score }));
  }, []);

  const updateSpeed = useCallback((speed: number) => {
    setState((prev) => ({ ...prev, currentSpeed: speed }));
  }, []);

  const updateLocation = useCallback((lat: number, lng: number, address = '') => {
    setState((prev) => ({
      ...prev,
      currentLocation: { lat, lng, address: address || prev.currentLocation?.address || '' },
    }));
  }, []);

  const lastRoutePoint = useRef<{ lat: number; lng: number } | null>(null);

  // Min distance (metres) between consecutive stored route points
  const addRoutePoint = useCallback((lat: number, lng: number) => {
    const ROUTE_MIN_DIST = 30;
    // Haversine to avoid storing redundant points
    if (lastRoutePoint.current) {
      const R = 6_371_000;
      const d = (x: number) => (x * Math.PI) / 180;
      const dLat = d(lat - lastRoutePoint.current.lat);
      const dLon = d(lng - lastRoutePoint.current.lng);
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(d(lastRoutePoint.current.lat)) *
        Math.cos(d(lat)) *
        Math.sin(dLon / 2) ** 2;
      const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      if (dist < ROUTE_MIN_DIST) return;
    }
    lastRoutePoint.current = { lat, lng };
    setState((prev) => ({
      ...prev,
      driveSession: {
        ...prev.driveSession,
        routePath: [...prev.driveSession.routePath, { lat, lng }],
      },
    }));
  }, []);

  const startDrive = useCallback(() => {
    lastRoutePoint.current = null;
    setState((prev) => ({
      ...prev,
      driveSession: {
        active: true,
        distance: 0,
        harshBraking: 0,
        alertsTriggered: 0,
        overspeedCount: 0,
        drowsinessCount: 0,
        startTime: Date.now(),
        routePath: [],
      },
      alerts: [],
    }));
  }, []);

  const endDrive = useCallback(() => {
    setState((prev) => {
      const durationMs = prev.driveSession.startTime ? Date.now() - prev.driveSession.startTime : 30000;
      const durationMin = Math.max(1, Math.round(durationMs / 60000));
      const distance = Math.round(((durationMin / 60) * 35) * 10) / 10;
      const sessionScore = Math.max(60, Math.min(100, prev.drivingScore + (Math.random() - 0.5) * 8));
      const roundedScore = Math.round(sessionScore);
      const overspeedCount = prev.alerts.filter((a) => a.toLowerCase().includes('speed')).length;
      const drowsinessCount = prev.alerts.filter((a) => a.toLowerCase().includes('drowsy') || a.toLowerCase().includes('fatigue')).length;

      const newLog: DriveLog = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        distance,
        score: roundedScore,
        alerts: [...prev.alerts],
        harshBraking: prev.driveSession.harshBraking,
        duration: durationMin,
        overspeedCount,
        drowsinessCount,
        routePath: [...prev.driveSession.routePath],
      };

      const updatedLogs = [newLog, ...prev.driveLogs].slice(0, 20);

      const totalDrives = updatedLogs.length;
      const totalSafeKm = Math.round(updatedLogs.reduce((sum, l) => sum + l.distance, 0) * 10) / 10;
      const avgScore = totalDrives > 0
        ? Math.round(updatedLogs.reduce((sum, l) => sum + l.score, 0) / totalDrives * 10) / 10
        : 0;

      const todayIndex = new Date().getDay();
      const updatedWeekly = prev.analyticsData.weeklyScores.map((s, i) => {
        const dayForSlot = (i + 1) % 7;
        return dayForSlot === todayIndex
          ? { ...s, score: roundedScore, alerts: overspeedCount, braking: prev.driveSession.harshBraking }
          : s;
      });

      const updatedMonthly = prev.analyticsData.monthlyKm.map((m, i) =>
        i === prev.analyticsData.monthlyKm.length - 1
          ? { ...m, km: Math.round((m.km + distance) * 10) / 10 }
          : m
      );

      return {
        ...prev,
        driveSession: { ...prev.driveSession, active: false, distance },
        drivingScore: roundedScore,
        safeKm: totalSafeKm,
        driveLogs: updatedLogs,
        analyticsData: {
          totalSafeKm,
          totalDrives,
          avgScore,
          weeklyScores: updatedWeekly,
          monthlyKm: updatedMonthly,
        },
      };
    });
  }, []);

  const addAlert = useCallback((alert: string) => {
    setState((prev) => {
      if (prev.alerts.includes(alert)) return prev;
      const isHarshBrake = alert === 'Harsh Braking';
      const isOverspeed = alert.toLowerCase().includes('speed');
      return {
        ...prev,
        alerts: [...prev.alerts, alert],
        driveSession: {
          ...prev.driveSession,
          alertsTriggered: prev.driveSession.alertsTriggered + 1,
          harshBraking: isHarshBrake ? prev.driveSession.harshBraking + 1 : prev.driveSession.harshBraking,
          overspeedCount: isOverspeed ? prev.driveSession.overspeedCount + 1 : prev.driveSession.overspeedCount,
        },
      };
    });
  }, []);

  const clearAlerts = useCallback(() => {
    setState((prev) => ({ ...prev, alerts: [] }));
  }, []);

  const completeOnboarding = useCallback((profile: UserProfile, contacts: EmergencyContact[]) => {
    setState((prev) => ({
      ...prev,
      userProfile: { ...profile, onboardingComplete: true },
      // Merge onboarding contacts (replacing defaults) up to max 3
      emergencyContacts: contacts.slice(0, 3),
      currentScreen: 'home',
    }));
  }, []);

  return (
    <AppContext.Provider
      value={{
        state,
        navigate,
        goBack,
        updateSettings,
        addContact,
        removeContact,
        updateDrivingScore,
        updateSpeed,
        updateLocation,
        addRoutePoint,
        startDrive,
        endDrive,
        addAlert,
        clearAlerts,
        completeOnboarding,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
