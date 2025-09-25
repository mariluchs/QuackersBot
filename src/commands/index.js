// src/commands/index.js

// --- Core commands ---
import * as check from './check.js';
import * as feed from './feed.js';
import * as pet from './pet.js';
import * as leaderboard from './leaderboard.js';
import * as setreminder from './setreminder.js';
import * as reminderoff from './reminderoff.js';
import * as help from './help.js';

// --- Test/Admin commands ---
import * as resetfeed from './resetfeed.js';
import * as resetpet from './resetpet.js';
import * as forceremind from './forceremind.js';
import * as forcehungry from './forcehungry.js';

export const allCommands = [
  // Core
  check,
  feed,
  pet,
  leaderboard,
  setreminder,
  reminderoff,
  help,

  // Test/Admin
  resetfeed,
  resetpet,
  forceremind,
  forcehungry,
];

export const commandMap = new Map(
  allCommands.map(c => [c.data.name, c])
);
