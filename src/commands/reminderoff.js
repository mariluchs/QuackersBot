// src/commands/reminderoff.js
import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { defaultGuildState } from '../state.js';

export const data = new SlashCommandBuilder()
  .setName('reminderoff')
  .setDescription('Disable overdue feed reminders (admin only).')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

export async function execute(interaction, g, state) {
  if (!g) {
    g = defaultGuildState();
    state[interaction.guildId] = g;
  }

  if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
    return interaction.reply({ content: '❌ Admins only.', ephemeral: true });
  }

  g.reminderRoleId = null;
  g.reminderChannelId = null;
  g.lastReminderAt = 0;

  return interaction.reply({
    content: '🔕 Reminders disabled.',
    ephemeral: true,
  });
}
