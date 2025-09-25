// src/commands/index.js
import * as check from './check.js';
import * as feed from './feed.js';
import * as pet from './pet.js';
import * as leaderboard from './leaderboard.js';
import * as setreminder from './setreminder.js';
import * as reminderoff from './reminderoff.js';
import * as resetfeed from './resetfeed.js';
import * as forceremind from './forceremind.js';
import * as forcehungry from './forcehungry.js';
import * as resetpet from './resetpet.js';
import * as help from './help.js';

export const allCommands = [
  check,
  feed,
  pet,
  leaderboard,
  setreminder,
  reminderoff,
  help,
  resetfeed,
  resetpet,
  forceremind,
  forcehungry,
];

export const commandMap = new Map(allCommands.map(c => [c.data.name, c]));
