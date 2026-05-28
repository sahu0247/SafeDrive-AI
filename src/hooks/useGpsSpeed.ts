import { useState, useEffect, useRef, useCallback } from 'react';

export type GpsPermission = 'prompt' | 'granted' | 'denied' | 'unsupported';

export interface GpsSpeedState {
  /** Real-time speed in km/h (0 when stationary or not yet acquired) */
  speed: number;
  /** Current latitude; null until first fix */
  lat: number | null;
  /** Current longitude; null until first fix */
  lng: number | null;
  /** GPS horizontal accuracy in metres; null until first fix */
  accuracy: number | null;
  /** Whether geolocation is supported and permission granted */
  gpsAvailable: boolean;
  /** Current permission state */
  permissionState: GpsPermission;
  /** Human-readable error, if any */
  error: string | null;
  /** True while waiting for the very first position fix */
  acquiring: boolean;
}

// ─── Haversine distance (metres) between two lat/lng pairs ────────────────────
function haversineMetres(
  lat1: number, lon1: number,
  lat2: number, lon2: number,
): number {
  const R = 6_371_000; // Earth radius in metres
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Clamp a value and round to 1 decimal ────────────────────────────────────
function clamp1dp(val: number, min: number, max: number): number {
  return Math.round(Math.min(max, Math.max(min, val)) * 10) / 10;
}

const OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  maximumAge: 0,        // always fresh
  timeout: 6000,
};

/**
 * useGpsSpeed
 *
 * Subscribes to navigator.geolocation.watchPosition and returns real-time
 * speed in km/h.  Priority order:
 *   1. position.coords.speed (provided by the browser/device directly)
 *   2. Haversine-calculated speed between consecutive position fixes
 *
 * Returns 0 while stationary, acquiring, or when GPS is unavailable.
 */
export function useGpsSpeed(): GpsSpeedState {
  const [state, setState] = useState<GpsSpeedState>({
    speed: 0,
    lat: null,
    lng: null,
    accuracy: null,
    gpsAvailable: false,
    permissionState: 'prompt',
    error: null,
    acquiring: true,
  });

  // Keep last position for Haversine fallback
  const prevPos = useRef<{ lat: number; lng: number; ts: number } | null>(null);
  const watchIdRef = useRef<number | null>(null);

  const onPosition = useCallback((pos: GeolocationPosition) => {
    const { latitude, longitude, accuracy, speed: nativeSpeed } = pos.coords;
    const ts = pos.timestamp;

    let kmh = 0;

    if (nativeSpeed !== null && nativeSpeed >= 0) {
      // Native speed is in m/s — convert to km/h
      kmh = clamp1dp(nativeSpeed * 3.6, 0, 250);
    } else if (prevPos.current) {
      // Haversine fallback: distance / time
      const distM = haversineMetres(
        prevPos.current.lat, prevPos.current.lng,
        latitude, longitude,
      );
      const dtSec = (ts - prevPos.current.ts) / 1000;
      if (dtSec > 0 && dtSec < 30) {
        // Ignore stale gaps > 30 s to avoid spurious spikes
        kmh = clamp1dp((distM / dtSec) * 3.6, 0, 250);
      }
    }

    prevPos.current = { lat: latitude, lng: longitude, ts };

    setState({
      speed: kmh,
      lat: latitude,
      lng: longitude,
      accuracy: Math.round(accuracy),
      gpsAvailable: true,
      permissionState: 'granted',
      error: null,
      acquiring: false,
    });
  }, []);

  const onError = useCallback((err: GeolocationPositionError) => {
    const isDenied = err.code === err.PERMISSION_DENIED;
    setState((prev) => ({
      ...prev,
      speed: 0,
      gpsAvailable: false,
      permissionState: isDenied ? 'denied' : 'prompt',
      error: isDenied
        ? 'Location access denied. Enable GPS in browser settings.'
        : err.code === err.TIMEOUT
        ? 'GPS signal timeout. Move to an open area.'
        : 'Unable to get GPS signal.',
      acquiring: false,
    }));
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) {
      setState((prev) => ({
        ...prev,
        gpsAvailable: false,
        permissionState: 'unsupported',
        error: 'Geolocation is not supported by this browser.',
        acquiring: false,
      }));
      return;
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      onPosition,
      onError,
      OPTIONS,
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [onPosition, onError]);

  return state;
}
