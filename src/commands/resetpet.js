// src/commands/resetpet.js
import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { saveAll } from '../state.js';

export const data = new SlashCommandBuilder()
  .setName('resetpet')
  .setDescription('[TEST] Reset pet cooldowns (admin only, keeps total counts).')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

export async function execute(interaction, g, state) {
  if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
    return interaction.reply({ content: '❌ Admins only.', ephemeral: true });
  }

  g.petStats ??= {};

  // Reset only cooldowns, NOT the counts
  for (const uid of Object.keys(g.petStats)) {
    const rec = g.petStats[uid] ?? {};
    rec.lastPetAt = 0;
    g.petStats[uid] = rec;
  }

  // Note: daily counter (g.petsToday) is left untouched intentionally

  await saveAll(state);

  return interaction.reply({
    content: '🧪 Pet cooldowns have been reset. All-time pet counts were kept.',
    ephemeral: true,
  });
}
