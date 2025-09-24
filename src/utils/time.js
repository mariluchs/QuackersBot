import { HOUR } from '../state.js';
import { EMOJIS } from './emojis.js';

export const now = () => Date.now();

export function msToHuman(ms) {
  if (ms <= 0) return 'now';
  const sec = Math.ceil(ms / 1000);
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const parts = [];
  if (h) parts.push(`${h}h`);
  if (m) parts.push(`${m}m`);
  if (!h && s) parts.push(`${s}s`);
  return parts.join(' ');
}

export function fullnessFromDelta(deltaMs) {
  const hours = deltaMs / HOUR;
  if (hours <= 2) return { fullness: 'full',     emoji: EMOJIS.fullness.full };
  if (hours <= 4) return { fullness: 'hungry',   emoji: EMOJIS.fullness.hungry };
  return {        fullness: 'starving', emoji: EMOJIS.fullness.starving };
}

export function happinessFromPets(petsToday) {
  if ((petsToday ?? 0) >= 10) return { happiness: 'happy', emoji: EMOJIS.happiness.happy };
  return { happiness: 'sad', emoji: EMOJIS.happiness.sad };
}
