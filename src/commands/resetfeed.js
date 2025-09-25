// src/commands/resetfeed.js
import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { saveAll } from '../state.js';
import { now } from '../utils/time.js';

export const data = new SlashCommandBuilder()
  .setName('resetfeed')
  .setDescription('[TEST] Reset the server pet feed timer (admin only).')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

export async function execute(interaction, g, state) {
  if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
    return interaction.reply({ content: '❌ Admins only.', ephemeral: true });
  }

  g.lastFedAt = now() - g.cooldownMs; // make it feedable immediately
  await saveAll(state);

  return interaction.reply({
    content: '🧪 Feed cooldown has been reset. You can use /feed again immediately.',
    ephemeral: true,
  });
}
