// src/commands/resetfeed.js
import { PermissionFlagsBits } from 'discord.js';
import { saveAll } from '../state.js';
import { now } from '../utils/time.js';

export const data = {
  name: 'resetfeed',
  description: '[TEST ONLY] Reset the server pet feed timer.',
  default_member_permissions: PermissionFlagsBits.ManageGuild.toString()
};

export async function execute(interaction, g, state) {
  // Ensure guild state exists
  if (!g) {
    return interaction.reply({
      content: '⚠️ No guild state found. Try feeding Quackers first.',
      flags: 64,
    });
  }

  // ✅ Make feed look overdue
  g.lastFedAt = now() - g.cooldownMs;

  await saveAll(state);

  return interaction.reply({
    content: `🧪 [TEST] Feed cooldown has been reset. You can use /feed again immediately.`,
    flags: 64, // ephemeral
  });
}
