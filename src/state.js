// src/state.js
import { MongoClient } from 'mongodb';

export const MIN = 60 * 1000;
export const HOUR = 60 * MIN;

let _client;
let _db;
let _col;
let _colGuildInfo;

// ---- Mongo connection (singleton) ----
async function connect() {
  if (_col) return { db: _db, col: _col };

  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error('[state] MONGO_URI not set');

  const dbName = process.env.MONGO_DB || 'quackers';
  const colName = process.env.MONGO_COL || 'guild_state';

  _client = new MongoClient(uri, { maxPoolSize: 5 });
  await _client.connect();

  _db = _client.db(dbName);
  _col = _db.collection(colName);

  await _col.createIndex({ guildId: 1 }, { unique: true });
  return { db: _db, col: _col };
}

// ---- default per-guild state ----
export function defaultGuildState() {
  return {
    petName: 'Quackers',

    // feeding
    lastFedAt: 0, // "never fed"
    cooldownMs: 2 * HOUR,
    feedCount: 0,
    feeders: {},

    // petting
    petCooldownMs: 1 * HOUR,
    petStats: {},

    // daily counter
    petsToday: 0,
    petDayUTC: utcDateKey(),
    dailyPetGoal: Math.floor(Math.random() * 16) + 5, // 5–20, randomized each day

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
  if (!g || typeof g !== 'object') return; // defensive
  const today = utcDateKey();

  if (!('petDayUTC' in g)) g.petDayUTC = today;
  if (!('petsToday' in g)) g.petsToday = 0;
  if (!('dailyPetGoal' in g)) g.dailyPetGoal = Math.floor(Math.random() * 16) + 5;

  if (g.petDayUTC !== today) {
    g.petDayUTC = today;
    g.petsToday = 0;
    g.dailyPetGoal = Math.floor(Math.random() * 16) + 5; // new secret goal each day
  }
}

// ---- DB API ----
export async function loadAll() {
  const { col } = await connect();
  const docs = await col.find({}).toArray();
  const map = {};
  for (const doc of docs) {
    map[doc.guildId] = sanitizeGuildState(doc.data);
  }
  return map;
}

export async function saveAll(stateMap) {
  const { col } = await connect();
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

function sanitizeGuildState(g) {
  const base = defaultGuildState();
  const merged = { ...base, ...(g || {}) };

  merged.petStats ??= {};
  merged.feeders ??= {};
  merged.reminderEveryMs ??= 30 * MIN;
  merged.petDayUTC ??= utcDateKey();
  merged.petsToday ??= 0;
  merged.dailyPetGoal ??= Math.floor(Math.random() * 16) + 5;

  return merged;
}

export async function getGuildState(guildId) {
  const { col } = await connect();
  let doc = await col.findOne({ guildId });

  if (!doc) {
    const data = defaultGuildState();
    await col.insertOne({ guildId, data });
    doc = { guildId, data };
  }

  const upgraded = sanitizeGuildState(doc.data);
  if (JSON.stringify(upgraded) !== JSON.stringify(doc.data)) {
    await col.updateOne({ guildId }, { $set: { data: upgraded } });
  }

  const map = { [guildId]: upgraded };
  return { state: map, g: map[guildId] };
}

export async function hasGuildState(guildId) {
  const { col } = await connect();
  const doc = await col.findOne({ guildId });
  return !!doc;
}

export async function deleteGuildState(guildId) {
  const { col } = await connect();
  await col.deleteOne({ guildId });
}

// ---- Guild Info Collection ----
async function connectGuildInfo() {
  if (_colGuildInfo) return _colGuildInfo;
  const { db } = await connect();
  _colGuildInfo = db.collection('guild_info');
  await _colGuildInfo.createIndex({ guildId: 1 }, { unique: true });
  return _colGuildInfo;
}

export async function upsertGuildInfo(guild) {
  const col = await connectGuildInfo();
  await col.updateOne(
    { guildId: guild.id },
    {
      $set: {
        guildId: guild.id,
        name: guild.name,
        memberCount: guild.memberCount ?? 0,
        joinedAt: new Date(),
      },
    },
    { upsert: true }
  );
}

export async function deleteGuildInfo(guildId) {
  const col = await connectGuildInfo();
  await col.deleteOne({ guildId });
}
