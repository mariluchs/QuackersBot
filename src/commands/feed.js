// src/commands/feed.js
import { SlashCommandBuilder } from 'discord.js';
import { ensureTodayCounters, hasGuildState } from '../state.js';
import { EMOJIS } from '../utils/emojis.js';

export const data = new SlashCommandBuilder()
  .setName('feed')
  .setDescription('Feed Quackers (server-wide cooldown).');

export async function execute(interaction, g, state) {
  const guildId = interaction.guildId;

  // ✅ Block if bot hasn’t been initialized for this guild
  const exists = await hasGuildState(guildId);
  if (!exists) {
    return interaction.reply({
      content: '⚠️ Quackers has not been set up yet in this server.',
      flags: 64, // ephemeral
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
      flags: 64, // ephemeral
    });
  }

  // ✅ Update state
  g.lastFedAt = now;
  g.feedCount = (g.feedCount ?? 0) + 1;
  g.feeders[interaction.user.id] = (g.feeders[interaction.user.id] || 0) + 1;

  // ✅ Reset reminder flags
  g.hungryReminded = false;
  g.starvingReminded = false;

  // ✅ Send confirmation first
  await interaction.reply({
    content: `${EMOJIS.feed} Quackers has been fed! Thanks, ${interaction.user}! ${EMOJIS.mood.happy}`,
  });

  // ✅ Then fetch the sent message and react with clock
  try {
    const msg = await interaction.fetchReply();
    await msg.react('⏰'); // clock emoji to show reminders are armed
  } catch (err) {
    console.error('[feed reaction]', err);
  }
}
