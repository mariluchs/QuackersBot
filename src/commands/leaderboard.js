import { EMOJIS } from '../utils/emojis.js';

export const data = {
  name: 'leaderboard',
  description: 'Show the top feeders and petters.',
  options: [
    {
      type: 4, // INTEGER
      name: 'page',
      description: 'Page number (10 per page)',
      required: false,
      min_value: 1
    }
  ]
};

export async function execute(interaction, { g }) {
  const page = interaction.options.getInteger('page') ?? 1;
  const perPage = 10;
  const start = (page - 1) * perPage;
  const end = start + perPage;

  const feedersArray = Object.entries(g.feeders || {}).sort((a, b) => b[1] - a[1]);
  const pettersArray = Object.entries(g.petStats || {})
    .map(([uid, rec]) => [uid, rec?.count || 0])
    .sort((a, b) => b[1] - a[1]);

  const feedersSlice = feedersArray.slice(start, end)
    .map(([uid, count], i) => `\`${start + i + 1}.\` <@${uid}> — **${count}** feeds`);
  const pettersSlice = pettersArray.slice(start, end)
    .map(([uid, count], i) => `\`${start + i + 1}.\` <@${uid}> — **${count}** pets`);

  const totalPages = Math.max(1, Math.ceil(Math.max(feedersArray.length, pettersArray.length) / perPage));

  return interaction.reply({
    embeds: [{
      color: 0xf1c40f,
      title: `${EMOJIS.misc.trophy} Quackers' Leaderboard`,
      fields: [
        { name: `${EMOJIS.misc.feed} Top Feeders`, value: feedersSlice.length ? feedersSlice.join('\n') : '_No feeds yet._', inline: true },
        { name: `${EMOJIS.misc.pet} Top Petters`, value: pettersSlice.length ? pettersSlice.join('\n') : '_No pets yet._', inline: true }
      ],
      footer: { text: `Page ${page}/${totalPages}` }
    }]
  });
}
