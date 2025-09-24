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

// 1) The list of command modules (each has { data, execute })
const modules = [
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

// 2) JSON payloads used for registration
export const commandsJSON = modules.map((m) =>
  typeof m.data?.toJSON === 'function' ? m.data.toJSON() : m.data
);

// 3) Name -> module map used at runtime
export const commandMap = new Map(modules.map((m) => [m.data.name, m]));

// (optional) default export, in case any code imports the list directly
export default modules;
