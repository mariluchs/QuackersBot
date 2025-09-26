// src/commands/index.js
import * as check from './check.js';
import * as feed from './feed.js';
import * as pet from './pet.js';
import * as leaderboard from './leaderboard.js';
import * as setreminder from './setreminder.js';
import * as reminderoff from './reminderoff.js';
import * as help from './help.js';
import * as reset from './reset.js';

// --- test commands (guild-only) ---
import * as resetfeed from './resetfeed.js';
import * as resetpet from './resetpet.js';
import * as forcehungry from './forcehungry.js';
import * as forceremind from './forceremind.js';




// ✅ Global commands → for all servers
export const globalCommands = [
  check,
  feed,
  pet,
  leaderboard,
  setreminder,
  reminderoff,
  help,
  reset, // <— reset is global
];

// ✅ Guild-only commands → only in test server
export const guildOnlyCommands = [
  resetfeed,
  resetpet,
  forcehungry,
  forceremind,
];

// For interaction handling we still need all
export const allCommands = [...globalCommands, ...guildOnlyCommands];

export const commandMap = new Map(
  allCommands.map(c => [c.data.name, c])
);
