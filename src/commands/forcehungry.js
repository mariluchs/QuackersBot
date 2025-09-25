// src/commands/forcehungry.js
import { PermissionFlagsBits } from 'discord.js';
import { saveAll } from '../state.js';
import { now } from '../utils/time.js';
import { HOUR } from '../state.js';

export const data = {
  name: 'forcehungry',
  description: '[TEST] Force Quackers into hungry state (admin only).',
  default_member_permissions: PermissionFlagsBits.ManageGuild.toString()
};

export async function execute(interaction, { state, g }) {
  g.lastFedAt = now() - (3 * HOUR); // force hungry state
  await saveAll(state);

  return interaction.reply({
    content: '🧪 Quackers has been set to **hungry** state for testing.',
    flags: 64, // ✅ was ephemeral
  });
}
