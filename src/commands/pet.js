// src/commands/pet.js
import { SlashCommandBuilder } from 'discord.js';
import { ensureTodayCounters, HOUR, hasGuildState } from '../state.js';
import { EMOJIS } from '../utils/emojis.js';

export const data = new SlashCommandBuilder()
  .setName('pet')
  .setDescription('Pet Quackers (per-user 1h cooldown).');

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

  g.petStats ??= {};
  g.petCooldownMs ??= 1 * HOUR;
  ensureTodayCounters(g);

  const userId = interaction.user.id;
  const now = Date.now();
  const petData = g.petStats[userId] || { lastPetAt: 0, count: 0 };

  const since = now - (petData.lastPetAt || 0);
  if (since < g.petCooldownMs) {
    const waitMs = g.petCooldownMs - since;
    const minutes = Math.ceil(waitMs / 60000);
    return interaction.reply({
      content: `⏳ You already pet Quackers recently. Try again in ${minutes}m!`,
      flags: 64,
    });
  }

  petData.lastPetAt = now;
  petData.count = (petData.count || 0) + 1;
  g.petStats[userId] = petData;
  g.petsToday = (g.petsToday || 0) + 1;

  const isHappy = g.petsToday >= (g.dailyPetGoal ?? 10);

  return interaction.reply(
    `${EMOJIS.pet} Quackers has been pet! Thanks ${interaction.user}! ${isHappy ? EMOJIS.mood.happy : EMOJIS.mood.sad}`
  );
}
