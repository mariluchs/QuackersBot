// src/commands/forcehungry.js
import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { saveAll, HOUR } from '../state.js';
import { now } from '../utils/time.js';

export const data = new SlashCommandBuilder()
  .setName('forcehungry')
  .setDescription('[TEST] Force Quackers into hungry state (admin only).')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

export async function execute(interaction, g, state) {
  if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
    return interaction.reply({ content: '❌ Admins only.', ephemeral: true });
  }

  g.lastFedAt = now() - (3 * HOUR); // make Quackers appear hungry
  await saveAll(state);

  return interaction.reply({
    content: '🧪 Quackers has been set to **hungry** state for testing.',
    ephemeral: true,
  });
}
