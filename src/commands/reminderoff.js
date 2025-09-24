import { PermissionFlagsBits } from 'discord.js';
import { saveAll } from '../state.js';

export const data = {
  name: 'reminderoff',
  description: 'Disable overdue feed reminders (admin only).',
  default_member_permissions: PermissionFlagsBits.ManageGuild.toString()
};

export async function execute(interaction, { state, g }) {
  g.reminderRoleId = null;
  g.reminderChannelId = null;
  await saveAll(state);
  return interaction.reply({ content: '🔕 Reminders disabled for this server.' });
}
