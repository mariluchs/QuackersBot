// src/commands/feed.js
import { SlashCommandBuilder } from 'discord.js';
import { defaultGuildState, ensureTodayCounters, HOUR } from '../state.js';
import { EMOJIS } from '../utils/emojis.js';

export const data = new SlashCommandBuilder()
  .setName('feed')
  .setDescription('Feed Quackers (server-wide cooldown).');

export async function execute(interaction, g, state) {
  if (!g) {
    g = defaultGuildState();
    state[interaction.guildId] = g;
  }
  ensureTodayCounters(g);

  const now = Date.now();
  const diff = now - g.lastFedAt;

  if (diff < g.cooldownMs) {
    const wait = Math.ceil((g.cooldownMs - diff) / (60 * 1000));
    return interaction.reply({
      content: `⏳ Quackers isn’t hungry yet. Try again in ${wait}m.`,
      flags: 64,
    });
  }

  g.lastFedAt = now;
  g.feedCount++;
  g.feeders[interaction.user.id] = (g.feeders[interaction.user.id] || 0) + 1;

  return interaction.reply(
    `${interaction.user} fed Quackers! ${EMOJIS.feed} ${EMOJIS.fullness.full}`
  );
}
