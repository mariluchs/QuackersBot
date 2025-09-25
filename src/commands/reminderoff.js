// src/commands/reminderoff.js
import { SlashCommandBuilder } from 'discord.js';
import { defaultGuildState } from '../state.js';

export const data = new SlashCommandBuilder()
  .setName('reminderoff')
  .setDescription('Disable the overdue reminders.');

export async function execute(interaction, g, state) {
  if (!g) {
    g = defaultGuildState();
    state[interaction.guildId] = g;
  }

  g.reminderRoleId = null;
  g.reminderChannelId = null;

  await interaction.reply('🔕 Reminders disabled.');
}
