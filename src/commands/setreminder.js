// src/commands/setreminder.js
import { SlashCommandBuilder } from 'discord.js';
import { defaultGuildState } from '../state.js';

export const data = new SlashCommandBuilder()
  .setName('setreminder')
  .setDescription('Ping a role when Quackers is overdue.')
  .addRoleOption(opt =>
    opt.setName('role').setDescription('Role to ping').setRequired(true)
  );

export async function execute(interaction, g, state) {
  if (!g) {
    g = defaultGuildState();
    state[interaction.guildId] = g;
  }

  const role = interaction.options.getRole('role');
  g.reminderRoleId = role.id;
  g.reminderChannelId = interaction.channelId;

  await interaction.reply({
    content: `🔔 Reminders enabled. I will ping ${role} when Quackers needs food.`,
    allowedMentions: { roles: [role.id] },
  });
}
