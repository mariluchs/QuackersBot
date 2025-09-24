// src/state.js
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '..', 'data');
const STATE_FILE = path.join(DATA_DIR, 'state.json');

export const MIN = 60 * 1000;
export const HOUR = 60 * MIN;

export async function ensureStore() {
  await fs.ensureDir(DATA_DIR);
  if (!(await fs.pathExists(STATE_FILE))) {
    await fs.writeJson(STATE_FILE, {}, { spaces: 2 });
  }
}

export async function loadAll() {
  await ensureStore();
  return fs.readJson(STATE_FILE);
}

export async function saveAll(state) {
  await ensureStore();
  await fs.writeJson(STATE_FILE, state, { spaces: 2 });
}

export function defaultGuildState() {
  return {
    // Quackers is the fixed name
    petName: 'Quackers',
    lastFedAt: Date.now() - 3 * HOUR,
    cooldownMs: 2 * HOUR,          // server-wide FEED cooldown
    feedCount: 0,
    feeders: {},                   // { userId: count }

    // /pet per-user cooldown & counters
    petCooldownMs: 1 * HOUR,
    petStats: {},                  // { userId: { lastPetAt:number, count:number } }

    // NEW: daily pet counter (UTC)
    petsToday: 0,
    petDayUTC: utcDateKey(),       // 'YYYY-MM-DD'

    // reminders
    reminderRoleId: null,
    reminderChannelId: null,
    lastReminderAt: 0,
    reminderEveryMs: 30 * MIN,
  };
}

// --- helpers for daily reset (UTC) ---
export function utcDateKey(d = new Date()) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function ensureTodayCounters(g) {
  const today = utcDateKey();
  if (g.petDayUTC !== today) {
    g.petDayUTC = today;
    g.petsToday = 0;
  }
}

export async function getGuildState(guildId) {
  const state = await loadAll();
  if (!state[guildId]) {
    state[guildId] = defaultGuildState();
    await saveAll(state);
  }
  // ensure new fields if you update code later
  state[guildId].petStats ??= {};
  state[guildId].feeders ??= {};
  state[guildId].reminderEveryMs ??= 30 * MIN;
  state[guildId].petDayUTC ??= utcDateKey();
  state[guildId].petsToday ??= 0;
  return { state, g: state[guildId] };
}
