import { PermissionFlagsBits } from 'discord.js';
import { EMOJIS } from '../utils/emojis.js';

export const data = {
  name: 'forceremind',
  description: '[TEST] Force send a reminder now (admin only).',
  default_member_permissions: PermissionFlagsBits.ManageGuild.toString()
};

export async function execute(interaction, { g }) {
  if (!g.reminderRoleId || !g.reminderChannelId) {
    return interaction.reply({ content: '⚠️ No reminder role/channel set. Use `/setreminder` first.', ephemeral: true });
  }

  try {
    const channel = await interaction.guild.channels.fetch(g.reminderChannelId);
    await channel.send({
      content: `<@&${g.reminderRoleId}> Quackers needs to be fed! ${EMOJIS.misc.feed}`,
      allowedMentions: { roles: [g.reminderRoleId] }
    });
    return interaction.reply({ content: '✅ Reminder sent!', ephemeral: true });
  } catch (e) {
    console.error('[forceremind]', e);
    return interaction.reply({ content: '❌ Failed to send reminder. Check my channel permissions.', ephemeral: true });
  }
}
