/**
 * route-worker.js
 *
 * Background Web Worker for GPS route accumulation.
 * The main thread posts GPS points here; this worker buffers them and
 * persists to IndexedDB so data survives tab minimisation.
 *
 * Messages IN  (from main thread):
 *   { type: 'ADD_POINT',  lat, lng, ts }
 *   { type: 'START_DRIVE' }
 *   { type: 'END_DRIVE' }        → responds with { type: 'ROUTE_DATA', points: [...] }
 *   { type: 'REQUEST_ROUTE' }    → responds with { type: 'ROUTE_DATA', points: [...] }
 *
 * Messages OUT (to main thread):
 *   { type: 'ROUTE_DATA', points: Array<{lat, lng, ts}> }
 *   { type: 'READY' }
 */

const DB_NAME = 'safedrive_gps';
const STORE   = 'route_points';
const DB_VER  = 1;

let db = null;
let buffer = [];

// ── IndexedDB helpers ──────────────────────────────────────────────────────
function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VER);
    req.onupgradeneeded = (e) => {
      const d = e.target.result;
      if (!d.objectStoreNames.contains(STORE)) {
        d.createObjectStore(STORE, { autoIncrement: true });
      }
    };
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror   = (e) => reject(e.target.error);
  });
}

function idbPut(point) {
  if (!db) return;
  const tx = db.transaction(STORE, 'readwrite');
  tx.objectStore(STORE).add(point);
}

function idbGetAll() {
  return new Promise((resolve) => {
    if (!db) return resolve([]);
    const tx  = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = (e) => resolve(e.target.result || []);
    req.onerror   = () => resolve([]);
  });
}

function idbClear() {
  if (!db) return;
  const tx = db.transaction(STORE, 'readwrite');
  tx.objectStore(STORE).clear();
}

// ── Initialise ─────────────────────────────────────────────────────────────
openDb().then((d) => {
  db = d;
  self.postMessage({ type: 'READY' });
});

// ── Message handler ─────────────────────────────────────────────────────────
self.onmessage = async (e) => {
  const msg = e.data;

  switch (msg.type) {
    case 'START_DRIVE':
      buffer = [];
      idbClear();
      break;

    case 'ADD_POINT': {
      const point = { lat: msg.lat, lng: msg.lng, ts: msg.ts || Date.now() };
      buffer.push(point);
      idbPut(point);
      break;
    }

    case 'END_DRIVE':
    case 'REQUEST_ROUTE': {
      // Merge in-memory buffer with any IDB records (handles page reload mid-drive)
      const idbPoints = await idbGetAll();
      // Merge by timestamp, deduplicate
      const merged = [...buffer];
      for (const p of idbPoints) {
        if (!merged.find((x) => x.ts === p.ts)) merged.push(p);
      }
      merged.sort((a, b) => a.ts - b.ts);
      self.postMessage({ type: 'ROUTE_DATA', points: merged });
      if (msg.type === 'END_DRIVE') {
        buffer = [];
        idbClear();
      }
      break;
    }

    default:
      break;
  }
};
