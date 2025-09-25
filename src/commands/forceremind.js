// src/commands/forceremind.js
import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('forceremind')
  .setDescription('Force-send the overdue reminder now (admin only).')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

export async function execute(interaction, g) {
  if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
    return interaction.reply({ content: '❌ Admins only.', flags: 64 }); // ✅ updated
  }

  if (!g?.reminderRoleId || !g?.reminderChannelId) {
    return interaction.reply({
      content: '⚠️ No reminder role/channel set. Use /setreminder first.',
      flags: 64, // ✅ updated
    });
  }

  g.lastReminderAt = 0; // so the loop will send immediately

  await interaction.reply({
    content: '⏱️ Reminder will be sent by the loop shortly.',
    flags: 64, // ✅ updated
  });
}
