// src/commands/pet.js
import { SlashCommandBuilder } from 'discord.js';
import { defaultGuildState, ensureTodayCounters } from '../state.js';
import { EMOJIS } from '../utils/emojis.js';

export const data = new SlashCommandBuilder()
  .setName('pet')
  .setDescription('Pet Quackers (per-user 1h cooldown).');

export async function execute(interaction, g, state) {
  if (!g) {
    g = defaultGuildState();
    state[interaction.guildId] = g;
  }
  ensureTodayCounters(g);

  const userId = interaction.user.id;
  const now = Date.now();
  const petData = g.petStats[userId] || { lastPetAt: 0, count: 0 };

  if (now - petData.lastPetAt < g.petCooldownMs) {
    return interaction.reply({
      content: `⏳ You already pet Quackers recently. Try again later!`,
      flags: 64,
    });
  }

  // Update stats
  petData.lastPetAt = now;
  petData.count++;
  g.petStats[userId] = petData;

  // Daily counter
  g.petsToday++;

  return interaction.reply(
    `${EMOJIS.pet} Quackers has been pet! Thanks ${interaction.user}! ${EMOJIS.fullness.full}`
  );
}
