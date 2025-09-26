// src/commands/reset.js
import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js';
import { deleteGuildState, defaultGuildState, saveAll } from '../state.js';

export const data = new SlashCommandBuilder()
  .setName('reset')
  .setDescription('⚠️ Reset Quackers completely for this server (Admin only).')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

export async function execute(interaction, g, state) {
  if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
    return interaction.reply({ content: '❌ Admins only.', flags: 64 });
  }

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('reset-confirm')
      .setLabel('Yes, reset Quackers')
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId('reset-cancel')
      .setLabel('Cancel')
      .setStyle(ButtonStyle.Secondary),
  );

  await interaction.reply({
    content: '⚠️ This will reset Quackers for this server. Are you sure you want to do this?',
    components: [row],
    ephemeral: true,
  });

  const msg = await interaction.fetchReply();

  const collector = msg.createMessageComponentCollector({
    filter: i => i.user.id === interaction.user.id,
    time: 30_000, // 30s window
  });

  collector.on('collect', async i => {
    if (i.customId === 'reset-cancel') {
      await i.reply({ content: '❌ Reset cancelled.', ephemeral: true });
      collector.stop();
      return;
    }

    if (i.customId === 'reset-confirm') {
      const guildId = interaction.guildId;
      try {
        // 1. Remove from DB
        await deleteGuildState(guildId);

        // 2. Remove from memory
        if (state && state[guildId]) {
          delete state[guildId];
        }

        // 3. Create starving state
        const fresh = defaultGuildState();
        fresh.lastFedAt = 0;
        state[guildId] = fresh;
        await saveAll(state);

        await i.reply({
          content: '🧹 Quackers has been fully reset for this server. He is starving right now! Run `/feed` to help him 🍞',
        });
      } catch (err) {
        console.error('[reset command]', err);
        await i.reply({ content: '❌ Failed to reset Quackers. Try again later.', ephemeral: true });
      }
      collector.stop();
    }
  });

  collector.on('end', async collected => {
    if (collected.size === 0) {
      await interaction.editReply({
        content: '⌛ Reset request timed out.',
        components: [],
      });
    } else {
      await interaction.editReply({ components: [] }).catch(() => {});
    }
  });
}
