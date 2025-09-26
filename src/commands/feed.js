// src/commands/feed.js
import { SlashCommandBuilder } from 'discord.js';
import { ensureTodayCounters, hasGuildState } from '../state.js';
import { EMOJIS } from '../utils/emojis.js';

export const data = new SlashCommandBuilder()
  .setName('feed')
  .setDescription('Feed Quackers (server-wide cooldown).');

export async function execute(interaction, g, state) {
  const guildId = interaction.guildId;

  // ✅ Block if not started
  const exists = await hasGuildState(guildId);
  if (!exists) {
    return interaction.reply({
      content: '⚠️ Quackers has not been started yet in this server. An admin must run `/start` first!',
      flags: 64,
    });
  }

  g.feeders ??= {};
  ensureTodayCounters(g);

  const now = Date.now();
  const since = now - g.lastFedAt;

  if (since < g.cooldownMs) {
    const waitMs = g.cooldownMs - since;
    const minutes = Math.ceil(waitMs / 60000);
    return interaction.reply({
      content: `⏳ Quackers isn’t hungry yet. Try again in ${minutes}m.`,
      flags: 64,
    });
  }

  g.lastFedAt = now;
  g.feedCount = (g.feedCount ?? 0) + 1;
  g.feeders[interaction.user.id] = (g.feeders[interaction.user.id] || 0) + 1;

  return interaction.reply(
    `${EMOJIS.feed} Quackers has been fed! Thanks, ${interaction.user}! ${EMOJIS.mood.happy}`
  );
}
