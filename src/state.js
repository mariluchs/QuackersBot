// src/state.js
import { MongoClient } from 'mongodb';

export const MIN = 60 * 1000;
export const HOUR = 60 * MIN;

// ---- Mongo connection (singleton) ----
let _client;
let _db;
let _col;

/**
 * Connect to Mongo once and reuse the collection.
 * Uses env:
 *  - MONGO_URI (required)
 *  - MONGO_DB  (default: "quackers")
 *  - MONGO_COL (default: "guild_state")
 */
async function connect() {
  if (_col) return _col;

  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error('[state] MONGO_URI not set');

  const dbName = process.env.MONGO_DB || 'quackers';
  const colName = process.env.MONGO_COL || 'guild_state';

  _client = new MongoClient(uri, { maxPoolSize: 5 });
  await _client.connect();

  _db = _client.db(dbName);
  _col = _db.collection(colName);

  // Ensure we can look up by guildId quickly
  await _col.createIndex({ guildId: 1 }, { unique: true });

  return _col;
}

// ---- default per-guild state ----
export function defaultGuildState() {
  return {
    // Quackers is the fixed name
    petName: 'Quackers',

    // feeding
    lastFedAt: Date.now() - 3 * HOUR,
    cooldownMs: 2 * HOUR,          // server-wide FEED cooldown
    feedCount: 0,
    feeders: {},                   // { userId: count }

    // /pet per-user cooldown & counters
    petCooldownMs: 1 * HOUR,
    petStats: {},                  // { userId: { lastPetAt:number, count:number } }

    // daily pet counter (UTC)
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

// ---- legacy-compatible API ----
// loadAll() returns a map { [guildId]: state }
// saveAll(map) upserts every guild in the map
// getGuildState(guildId) returns { state: map, g: map[guildId] }

export async function loadAll() {
  const col = await connect();
  const docs = await col.find({}).toArray();
  const map = {};
  for (const doc of docs) {
    map[doc.guildId] = sanitizeGuildState(doc.data);
  }
  return map;
}

export async function saveAll(stateMap) {
  const col = await connect();
  const ops = [];
  for (const [guildId, data] of Object.entries(stateMap || {})) {
    ops.push({
      updateOne: {
        filter: { guildId },
        update: { $set: { guildId, data: sanitizeGuildState(data) } },
        upsert: true,
      },
    });
  }
  if (ops.length) await col.bulkWrite(ops, { ordered: false });
}

// Helper: ensure any missing fields are added (forward-compat)
function sanitizeGuildState(g) {
  const base = defaultGuildState();
  const merged = { ...base, ...(g || {}) };

  // forward-compat for newly added fields
  merged.petStats ??= {};
  merged.feeders ??= {};
  merged.reminderEveryMs ??= 30 * MIN;
  merged.petDayUTC ??= utcDateKey();
  merged.petsToday ??= 0;

  return merged;
}

export async function getGuildState(guildId) {
  const col = await connect();

  // Try to get existing
  let doc = await col.findOne({ guildId });

  if (!doc) {
    const data = defaultGuildState();
    await col.insertOne({ guildId, data });
    doc = { guildId, data };
  }

  // Sanitize/upgrade in case new fields were added in code
  const upgraded = sanitizeGuildState(doc.data);

  // If upgrades happened, write back
  if (JSON.stringify(upgraded) !== JSON.stringify(doc.data)) {
    await col.updateOne({ guildId }, { $set: { data: upgraded } });
  }

  // Return in the same shape your code expects
  const map = { [guildId]: upgraded };
  return { state: map, g: map[guildId] };
}
