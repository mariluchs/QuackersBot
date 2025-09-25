// src/commands/pet.js
import { SlashCommandBuilder } from 'discord.js';
import { defaultGuildState, ensureTodayCounters, HOUR } from '../state.js';
import { EMOJIS } from '../utils/emojis.js';

export const data = new SlashCommandBuilder()
  .setName('pet')
  .setDescription('Pet Quackers (per-user 1h cooldown).');

export async function execute(interaction, g, state) {
  // ensure guild state exists
  if (!g) {
    g = defaultGuildState();
    state[interaction.guildId] = g;
  }

  // ensure required fields exist (older records may miss these)
  g.petStats ??= {};
  g.petCooldownMs ??= 1 * HOUR;

  ensureTodayCounters(g);

  const userId = interaction.user.id;
  const now = Date.now();
  const petData = g.petStats[userId] || { lastPetAt: 0, count: 0 };

  // cooldown check
  const since = now - (petData.lastPetAt || 0);
  if (since < g.petCooldownMs) {
    const waitMs = g.petCooldownMs - since;
    const minutes = Math.ceil(waitMs / 60000);
    return interaction.reply({
      content: `⏳ You already pet Quackers recently. Try again in ${minutes}m!`,
      flags: 64, // ephemeral
    });
  }

  // apply pet
  petData.lastPetAt = now;
  petData.count = (petData.count || 0) + 1;
  g.petStats[userId] = petData;
  g.petsToday = (g.petsToday || 0) + 1;

  // message style you requested
  return interaction.reply(
    `${EMOJIS.pet} Quackers has been pet! Thanks ${interaction.user}! ${EMOJIS.mood.happy}`
  );
}
