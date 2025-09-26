// src/commands/resetpet.js
import { PermissionFlagsBits } from 'discord.js';
import { saveAll } from '../state.js';

export const data = {
  name: 'resetpet',
  description: '[TEST] Reset pet cooldowns (admin only, keeps total counts).',
  default_member_permissions: PermissionFlagsBits.ManageGuild.toString()
};

export async function execute(interaction, g, state) {
  if (!g) {
    return interaction.reply({
      content: '⚠️ No guild state found. Try petting Quackers first.',
      flags: 64,
    });
  }

  g.petStats ??= {};
  for (const uid of Object.keys(g.petStats)) {
    g.petStats[uid].lastPetAt = 0;
  }

  await saveAll(state);

  return interaction.reply({
    content: '🧪 Pet cooldowns have been reset. All-time pet counts were kept.',
    flags: 64,
  });
}
