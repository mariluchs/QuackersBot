// src/utils/time.js
import { HOUR } from '../state.js';

export const now = () => Date.now();

/**
 * Convert milliseconds into human-readable text.
 * Example: 3725000 → "1h 2m"
 */
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

/**
 * Determine feeding status from time since last fed.
 * Returns: "full", "hungry", or "starving".
 */
export function fullnessFromDelta(deltaMs) {
  const hours = deltaMs / HOUR;
  if (hours <= 2) return 'full';
  if (hours <= 4) return 'hungry';
  return 'starving';
}
