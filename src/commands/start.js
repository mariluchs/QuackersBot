// src/commands/start.js
import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { defaultGuildState, saveAll } from '../state.js';

export const data = new SlashCommandBuilder()
  .setName('start')
  .setDescription('Set up Quackers for the first time in this server. (Admin only)')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

export async function execute(interaction, g, state) {
  if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
    return interaction.reply({ content: '❌ Admins only.', ephemeral: true });
  }

  if (g && g.feedCount !== undefined) {
    return interaction.reply({
      content: '⚠️ Quackers is already set up in this server!',
      ephemeral: true,
    });
  }

  // Fresh setup
  const newState = defaultGuildState();
  // ✅ Start hungry
  newState.lastFedAt = Date.now() - (3 * 60 * 60 * 1000);

  state[interaction.guildId] = newState;
  await saveAll(state);

  return interaction.reply({
    content: '🦆 Quackers has arrived! He looks hungry... better feed him soon 🍞',
  });
}
