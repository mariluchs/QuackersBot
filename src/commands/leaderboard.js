// src/commands/leaderboard.js
import { SlashCommandBuilder } from 'discord.js';
import { defaultGuildState } from '../state.js';
import { EMOJIS } from '../utils/emojis.js';

export const data = new SlashCommandBuilder()
  .setName('leaderboard')
  .setDescription('Top feeders & petters (paged).')
  .addIntegerOption(opt =>
    opt.setName('page').setDescription('Page number').setMinValue(1)
  );

function formatBoard(entries, type) {
  if (entries.length === 0) return 'No data yet.';
  return entries
    .map(
      ([id, count], i) =>
        `**${i + 1}.** <@${id}> — ${count} ${type}`
    )
    .join('\n');
}

export async function execute(interaction, g, state) {
  if (!g) {
    g = defaultGuildState();
    state[interaction.guildId] = g;
  }

  const page = interaction.options.getInteger('page') || 1;
  const perPage = 10;

  const feeders = Object.entries(g.feeders || {})
    .sort((a, b) => b[1] - a[1])
    .slice((page - 1) * perPage, page * perPage);

  const petters = Object.entries(g.petStats || {})
    .map(([id, d]) => [id, d.count || 0])
    .sort((a, b) => b[1] - a[1])
    .slice((page - 1) * perPage, page * perPage);

  const embed = {
    color: 0xffd54f,
    title: '🏆 Quackers’ Leaderboard',
    fields: [
      { name: `${EMOJIS.feed} Top Feeders`, value: formatBoard(feeders, 'feeds') },
      { name: `${EMOJIS.pet} Top Petters`, value: formatBoard(petters, 'pets') },
    ],
    footer: { text: `Page ${page}` },
  };

  await interaction.reply({ embeds: [embed] });
}
