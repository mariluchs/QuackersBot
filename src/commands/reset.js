// src/commands/reset.js
import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { deleteGuildState } from '../state.js';

export const data = new SlashCommandBuilder()
  .setName('reset')
  .setDescription('⚠️ Reset Quackers completely for this server (Admin only).')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

export async function execute(interaction, g, state) {
  if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
    return interaction.reply({ content: '❌ Admins only.', flags: 64 });
  }

  const guildId = interaction.guildId;
  try {
    // 1. Remove from DB
    await deleteGuildState(guildId);

    // 2. Remove from memory cache
    if (state && state[guildId]) {
      delete state[guildId];
    }

    await interaction.reply({
      content: '🧹 Quackers has been fully reset for this server. Run `/start` again to set him up!',
    });
  } catch (err) {
    console.error('[reset command]', err);
    await interaction.reply({ content: '❌ Failed to reset Quackers. Try again later.', flags: 64 });
  }
}
