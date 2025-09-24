import { PermissionFlagsBits } from 'discord.js';
import { saveAll } from '../state.js';
import { EMOJIS } from '../utils/emojis.js';

export const data = {
  name: 'setreminder',
  description: 'Set up role pings when the pet is overdue (admin only).',
  default_member_permissions: PermissionFlagsBits.ManageGuild.toString(),
  options: [
    {
      type: 8, // ROLE
      name: 'role',
      description: 'Role to ping when Quackers needs food',
      required: true
    }
  ]
};

export async function execute(interaction, { state, g }) {
  const role = interaction.options.getRole('role', true);
  g.reminderRoleId = role.id;
  g.reminderChannelId = interaction.channelId;
  await saveAll(state);

  return interaction.reply({
    content: `🔔 Reminders enabled. I will ping <@&${role.id}> in this channel when **Quackers** is overdue ${EMOJIS.misc.feed}`,
    allowedMentions: { roles: [role.id] }
  });
}
