// src/commands/leaderboard.js
import { SlashCommandBuilder } from 'discord.js';
import { defaultGuildState } from '../state.js';
import { EMOJIS } from '../utils/emojis.js';

export const data = new SlashCommandBuilder()
  .setName('leaderboard')
  .setDescription('Show the top feeders and petters.')
  .addIntegerOption(opt =>
    opt.setName('page').setDescription('Page number').setMinValue(1)
  );

function formatBoard(entries, unit) {
  if (entries.length === 0) return `No ${unit} yet.`;
  return entries
    .map(([id, n], i) => `**${i + 1}.** <@${id}> — ${n} ${unit}`)
    .join('\n');
}

export async function execute(interaction, g, state) {
  if (!g) {
    g = defaultGuildState();
    state[interaction.guildId] = g;
  }

  const page = interaction.options.getInteger('page') || 1;
  const perPage = 10;

  const feedersAll = Object.entries(g.feeders || {}).sort((a, b) => b[1] - a[1]);
  const pettersAll = Object.entries(g.petStats || {})
    .map(([id, d]) => [id, d?.count || 0])
    .sort((a, b) => b[1] - a[1]);

  const totalPages = Math.max(1, Math.ceil(Math.max(feedersAll.length, pettersAll.length) / perPage));
  const start = (page - 1) * perPage;
  const feeders = feedersAll.slice(start, start + perPage);
  const petters = pettersAll.slice(start, start + perPage);

  const embed = {
    color: 0xf59e0b,
    title: `🏆 Quackers' Leaderboard`,
    fields: [
      { name: `Top Feeders ${EMOJIS.feed}`, value: formatBoard(feeders, 'feeds') },
      { name: `Top Petters ${EMOJIS.pet}`,  value: formatBoard(petters, 'pets') },
    ],
    footer: { text: `Page ${Math.min(page, totalPages)}/${totalPages}` },
  };

  await interaction.reply({ embeds: [embed] });
}
