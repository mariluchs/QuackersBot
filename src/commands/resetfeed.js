import { PermissionFlagsBits } from 'discord.js';
import { saveAll } from '../state.js';
import { now } from '../utils/time.js';

export const data = {
  name: 'resetfeed',
  description: '[TEST ONLY] Reset the server pet feed timer.',
  default_member_permissions: PermissionFlagsBits.ManageGuild.toString()
};

export async function execute(interaction, { state, g }) {
  g.lastFedAt = now() - g.cooldownMs; // make it look overdue
  await saveAll(state);

  return interaction.reply({
    content: `🧪 [TEST] Feed cooldown has been reset. You can use /feed again immediately.`
  });
}
