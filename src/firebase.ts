import { initializeApp, type FirebaseApp } from 'firebase/app';
import { sanitizeName } from './utils/nameFilter';
import {
  getFirestore,
  collection,
  addDoc,
  query,
  orderBy,
  where,
  limit,
  getDocs,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  writeBatch,
  serverTimestamp,
  type Firestore,
} from 'firebase/firestore';

// Firebase API keys are safe to expose client-side.
// Security is enforced by Firestore rules, not the API key.
const firebaseConfig = {
  apiKey: 'AIzaSyCVRBggYX2J6JDGiCJgFfLyMFiwymbNq6I',
  authDomain: 'flagconquest-72beb.firebaseapp.com',
  projectId: 'flagconquest-72beb',
  storageBucket: 'flagconquest-72beb.firebasestorage.app',
  messagingSenderId: '248718051147',
  appId: '1:248718051147:web:4874bd24e31aeadbe0cace',
};

// Lazy initialization — zero overhead until first leaderboard interaction
let app: FirebaseApp | null = null;
let db: Firestore | null = null;

function getDb(): Firestore {
  if (!db) {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
  }
  return db;
}

export interface LeaderboardRow {
  id: string;
  playerName: string;
  flagsCaptured: number;
  rank: number;
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('Timeout')), ms)),
  ]);
}

function getTodayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export async function submitScore(playerName: string, flagsCaptured: number): Promise<boolean> {
  try {
    const firestore = getDb();
    const safeName = sanitizeName(playerName) || 'Anonymous';

    // All-time leaderboard
    const docRef = doc(firestore, 'leaderboard', safeName);
    const existing = await withTimeout(getDoc(docRef), 5000);
    if (existing.exists()) {
      const prev = existing.data().flagsCaptured || 0;
      if (flagsCaptured <= prev) {
        // Still update daily even if all-time hasn't changed
        submitDailyScore(firestore, safeName, flagsCaptured).catch(() => {});
        return true;
      }
    }
    await withTimeout(setDoc(docRef, {
      playerName: safeName,
      flagsCaptured,
      timestamp: serverTimestamp(),
    }), 5000);

    // Daily leaderboard (fire-and-forget)
    submitDailyScore(firestore, safeName, flagsCaptured).catch(() => {});

    return true;
  } catch (err) {
    console.warn('[Leaderboard] Submit failed:', err);
    return false;
  }
}

async function submitDailyScore(firestore: Firestore, safeName: string, flagsCaptured: number): Promise<void> {
  const today = getTodayStr();
  const dailyRef = doc(firestore, 'leaderboard_daily', safeName);
  const existing = await withTimeout(getDoc(dailyRef), 5000);
  if (existing.exists()) {
    const data = existing.data();
    if (data.date === today && flagsCaptured <= (data.flagsCaptured || 0)) return;
  }
  await withTimeout(setDoc(dailyRef, {
    playerName: safeName,
    flagsCaptured,
    date: today,
    timestamp: serverTimestamp(),
  }), 5000);
}

export async function fetchLeaderboard(): Promise<LeaderboardRow[]> {
  try {
    const firestore = getDb();
    const q = query(
      collection(firestore, 'leaderboard'),
      orderBy('flagsCaptured', 'desc'),
      limit(50),
    );
    const snapshot = await getDocs(q);
    const rows: LeaderboardRow[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      rows.push({
        id: doc.id,
        playerName: data.playerName || 'Anonymous',
        flagsCaptured: data.flagsCaptured || 0,
        rank: rows.length + 1,
      });
    });
    return rows;
  } catch (err) {
    console.warn('[Leaderboard] Fetch failed:', err);
    return [];
  }
}

export async function fetchDailyLeaderboard(): Promise<LeaderboardRow[]> {
  try {
    const firestore = getDb();
    const today = getTodayStr();
    const q = query(
      collection(firestore, 'leaderboard_daily'),
      where('date', '==', today),
      limit(50),
    );
    const snapshot = await getDocs(q);
    const rows: LeaderboardRow[] = [];
    snapshot.forEach((d) => {
      const data = d.data();
      rows.push({
        id: d.id,
        playerName: data.playerName || 'Anonymous',
        flagsCaptured: data.flagsCaptured || 0,
        rank: 0,
      });
    });
    // Sort client-side (avoids composite index requirement)
    rows.sort((a, b) => b.flagsCaptured - a.flagsCaptured);
    rows.forEach((r, i) => { r.rank = i + 1; });
    return rows;
  } catch (err) {
    console.warn('[Leaderboard] Daily fetch failed:', err);
    return [];
  }
}

// ── Cloud Save with PIN ──────────────────────────────────────────────

const SAFE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 32 chars, no ambiguous 0/O/1/I/l

function generatePin(): string {
  let pin = '';
  const arr = crypto.getRandomValues(new Uint8Array(6));
  for (let i = 0; i < 6; i++) {
    pin += SAFE_CHARS[arr[i] % SAFE_CHARS.length];
  }
  return pin;
}

export async function uploadCloudSave(
  saveData: string,
  playerName: string,
  version: string,
): Promise<{ success: true; pin: string } | { success: false; error: string }> {
  try {
    const firestore = getDb();
    for (let attempt = 0; attempt < 5; attempt++) {
      const pin = generatePin();
      const docRef = doc(firestore, 'cloudSaves', pin);
      const existing = await getDoc(docRef);
      if (!existing.exists()) {
        await setDoc(docRef, {
          saveData,
          playerName: playerName || 'Anonymous',
          createdAt: serverTimestamp(),
          version,
        });
        return { success: true, pin };
      }
    }
    return { success: false, error: 'Failed to generate unique PIN. Please try again.' };
  } catch (err) {
    console.warn('[CloudSave] Upload failed:', err);
    return { success: false, error: 'Upload failed. Check your connection and try again.' };
  }
}

export async function downloadCloudSave(
  pin: string,
): Promise<{ success: true; saveData: string; playerName: string } | { success: false; error: string }> {
  try {
    const firestore = getDb();
    const docRef = doc(firestore, 'cloudSaves', pin.toUpperCase().trim());
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) {
      return { success: false, error: 'PIN not found. Check your code and try again.' };
    }
    const data = snapshot.data();
    // Delete after read — single-use PIN
    await deleteDoc(docRef);
    return {
      success: true,
      saveData: data.saveData,
      playerName: data.playerName || 'Anonymous',
    };
  } catch (err) {
    console.warn('[CloudSave] Download failed:', err);
    return { success: false, error: 'Download failed. Check your connection and try again.' };
  }
}

// ── One-time leaderboard cleanup (localhost only) ────────────────
// Deduplicates entries: keeps highest flagsCaptured per player,
// migrates to new format (playerName as doc ID), deletes old random-ID docs.
export async function purgeLeaderboardDuplicates(): Promise<{ kept: number; deleted: number }> {
  if (typeof window !== 'undefined' && !['localhost', '127.0.0.1'].includes(window.location.hostname)) {
    console.warn('[Leaderboard] Purge blocked — localhost only');
    return { kept: 0, deleted: 0 };
  }

  const firestore = getDb();
  const snapshot = await getDocs(collection(firestore, 'leaderboard'));

  // Group all docs by playerName, track best score per player
  const best = new Map<string, { flagsCaptured: number; distance: number; docId: string }>();
  const allDocIds: string[] = [];

  snapshot.forEach((d) => {
    const data = d.data();
    const name = data.playerName || 'Anonymous';
    const flags = data.flagsCaptured || 0;
    const dist = data.distance || 0;
    allDocIds.push(d.id);

    const prev = best.get(name);
    // Prefer highest flagsCaptured; tie-break on distance
    if (!prev || flags > prev.flagsCaptured || (flags === prev.flagsCaptured && dist > prev.distance)) {
      best.set(name, { flagsCaptured: flags, distance: dist, docId: d.id });
    }
  });

  // Write deduplicated entries with playerName as doc ID, delete all old docs
  const toDelete = new Set(allDocIds);

  // Write best entries in batches of 500 (Firestore limit)
  const entries = Array.from(best.entries());
  for (let i = 0; i < entries.length; i += 250) {
    const batch = writeBatch(firestore);
    for (const [name, info] of entries.slice(i, i + 250)) {
      const ref = doc(firestore, 'leaderboard', name);
      batch.set(ref, {
        playerName: name,
        flagsCaptured: info.flagsCaptured,
        timestamp: serverTimestamp(),
      });
      // Don't delete the doc we just wrote if it happened to already have this ID
      toDelete.delete(name);
    }
    await batch.commit();
  }

  // Delete old random-ID docs in batches
  const deleteIds = Array.from(toDelete);
  for (let i = 0; i < deleteIds.length; i += 500) {
    const batch = writeBatch(firestore);
    for (const id of deleteIds.slice(i, i + 500)) {
      batch.delete(doc(firestore, 'leaderboard', id));
    }
    await batch.commit();
  }

  console.log(`[Leaderboard] Purge complete: kept ${best.size}, deleted ${deleteIds.length} duplicates`);
  return { kept: best.size, deleted: deleteIds.length };
}

// ── Daily leaderboard cleanup (localhost only) ────────────────────
// Deletes all leaderboard_daily entries with a date older than today.
export async function purgeStaleDailyEntries(): Promise<{ deleted: number }> {
  if (typeof window !== 'undefined' && !['localhost', '127.0.0.1'].includes(window.location.hostname)) {
    console.warn('[Leaderboard] Daily purge blocked — localhost only');
    return { deleted: 0 };
  }

  const firestore = getDb();
  const today = getTodayStr();
  const snapshot = await getDocs(collection(firestore, 'leaderboard_daily'));

  const stale: string[] = [];
  snapshot.forEach((d) => {
    const data = d.data();
    if (data.date !== today) stale.push(d.id);
  });

  for (let i = 0; i < stale.length; i += 500) {
    const batch = writeBatch(firestore);
    for (const id of stale.slice(i, i + 500)) {
      batch.delete(doc(firestore, 'leaderboard_daily', id));
    }
    await batch.commit();
  }

  console.log(`[Leaderboard] Daily purge: deleted ${stale.length} stale entries`);
  return { deleted: stale.length };
}

// Expose purge utilities on window for dev console access
if (typeof window !== 'undefined' && ['localhost', '127.0.0.1'].includes(window.location.hostname)) {
  (window as any).purgeLeaderboard = purgeLeaderboardDuplicates;
  (window as any).purgeDailyLeaderboard = purgeStaleDailyEntries;
}
