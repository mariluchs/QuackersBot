// src/commands/index.js
import * as check from './check.js';
import * as feed from './feed.js';
import * as pet from './pet.js';
import * as leaderboard from './leaderboard.js';
import * as setreminder from './setreminder.js';
import * as reminderoff from './reminderoff.js';
import * as help from './help.js';
import * as start from './start.js';
import * as reset from './reset.js';

// test/admin commands
import * as resetfeed from './resetfeed.js';
import * as resetpet from './resetpet.js';
import * as forceremind from './forceremind.js';
import * as forcehungry from './forcehungry.js';

export const allCommands = [
  check,
  feed,
  pet,
  leaderboard,
  setreminder,
  reminderoff,
  help,
  start,
  reset,        // ✅ new reset command
  resetfeed,
  resetpet,
  forceremind,
  forcehungry,
];

export const commandMap = new Map(allCommands.map(c => [c.data.name, c]));
