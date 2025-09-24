import { PermissionFlagsBits } from 'discord.js';
import { saveAll } from '../state.js';

export const data = {
  name: 'resetpet',
  description: '[TEST] Reset pet cooldowns (admin only, keeps total counts).',
  default_member_permissions: PermissionFlagsBits.ManageGuild.toString()
};

export async function execute(interaction, { state, g }) {
  // Ensure object exists
  g.petStats ??= {};

  // Reset only cooldowns, NOT the counts
  for (const uid of Object.keys(g.petStats)) {
    const rec = g.petStats[uid] ?? {};
    rec.lastPetAt = 0;
    g.petStats[uid] = rec;
  }

  // Optional: do NOT touch g.petsToday if you want daily mood to stay
  // If you *also* want to reset today's counter, uncomment the next line:
  // g.petsToday = 0;

  await saveAll(state);

  return interaction.reply({
    content: '🧪 Pet cooldowns have been reset. All-time pet counts were kept.',
    ephemeral: true
  });
}
