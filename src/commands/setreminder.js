// src/commands/setreminder.js
import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { defaultGuildState } from '../state.js';
import { EMOJIS } from '../utils/emojis.js';

export const data = new SlashCommandBuilder()
  .setName('setreminder')
  .setDescription('Ping a role when Quackers is hungry (admin only).')
  .addRoleOption(opt =>
    opt.setName('role').setDescription('Role to ping').setRequired(true)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

export async function execute(interaction, g, state) {
  if (!g) {
    g = defaultGuildState();
    state[interaction.guildId] = g;
  }

  if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
    return interaction.reply({ content: '❌ Admins only.', flags: 64 });
  }

  const role = interaction.options.getRole('role');
  if (!interaction.channel?.isTextBased()) {
    return interaction.reply({ content: '❌ Use this in a text channel.', flags: 64 });
  }

  g.reminderRoleId = role.id;
  g.reminderChannelId = interaction.channelId;
  g.lastReminderAt ??= 0;
  g.reminderEveryMs ??= 30 * 60 * 1000;

  await interaction.reply({
    content: `🔔 I will ping ${role} when Quackers is hungry ${EMOJIS.feed}`,
    allowedMentions: { roles: [role.id] },
  });
}
