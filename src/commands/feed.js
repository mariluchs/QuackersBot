// src/commands/feed.js
import { SlashCommandBuilder } from 'discord.js';
import { defaultGuildState, ensureTodayCounters } from '../state.js';
import { EMOJIS } from '../utils/emojis.js';

export const data = new SlashCommandBuilder()
  .setName('feed')
  .setDescription('Feed Quackers (server-wide cooldown).');

export async function execute(interaction, g, state) {
  if (!g) {
    g = defaultGuildState();
    state[interaction.guildId] = g;
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
      flags: 64, // ✅ was ephemeral
    });
  }

  g.lastFedAt = now;
  g.feedCount = (g.feedCount ?? 0) + 1;
  g.feeders[interaction.user.id] = (g.feeders[interaction.user.id] || 0) + 1;

  const msg = await interaction.reply({
    content: `${EMOJIS.feed} Quackers has been fed! Thanks, ${interaction.user}! ${EMOJIS.mood.happy}`,
    fetchReply: true,
  });

  // Optionally: react with ⏰ to show reminder is armed
  await msg.react('⏰').catch(() => null);
}
