// src/commands/forceremind.js
import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('forceremind')
  .setDescription('[TEST] Force-send the overdue reminder now (admin only).')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

export async function execute(interaction, g, state) {
  if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
    return interaction.reply({ content: '❌ Admins only.', ephemeral: true });
  }

  if (!g?.reminderRoleId || !g?.reminderChannelId) {
    return interaction.reply({
      content: '⚠️ No reminder role/channel set. Use /setreminder first.',
      ephemeral: true,
    });
  }

  g.lastReminderAt = 0; // let the reminder loop trigger immediately

  return interaction.reply({
    content: '⏱️ Reminder will be sent by the loop shortly.',
    ephemeral: true,
  });
}
