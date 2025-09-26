// src/commands/forcehungry.js
import { PermissionFlagsBits } from 'discord.js';
import { saveAll, HOUR } from '../state.js';
import { now } from '../utils/time.js';

export const data = {
  name: 'forcehungry',
  description: '[TEST] Force Quackers into hungry state (admin only).',
  default_member_permissions: PermissionFlagsBits.ManageGuild.toString()
};

export async function execute(interaction, g, state) {
  if (!g) {
    return interaction.reply({
      content: '⚠️ No guild state found. Try feeding Quackers first.',
      flags: 64,
    });
  }

  g.lastFedAt = now() - (3 * HOUR);
  await saveAll(state);

  return interaction.reply({
    content: '🧪 Quackers has been set to **hungry** state for testing.',
    flags: 64,
  });
}
