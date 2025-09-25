// src/commands/check.js
import { SlashCommandBuilder } from 'discord.js';
import { ensureTodayCounters, defaultGuildState, HOUR } from '../state.js';
import { EMOJIS } from '../utils/emojis.js';
import { msToHuman } from '../utils/time.js';

export const data = new SlashCommandBuilder()
  .setName('check')
  .setDescription("Show Quackers' feeding & happiness.");

export async function execute(interaction, g, state) {
  // Safety: ensure guild state
  if (!g) {
    g = defaultGuildState();
    state[interaction.guildId] = g;
  }
  ensureTodayCounters(g);

  const delta = Date.now() - g.lastFedAt;
  let fullness;
  if (delta < g.cooldownMs) fullness = `${EMOJIS.fullness.full} Full`;
  else if (delta < 3 * HOUR) fullness = `${EMOJIS.fullness.hungry} Hungry`;
  else fullness = `${EMOJIS.fullness.starving} Starving`;

  const happiness = g.petsToday > 0
    ? `${EMOJIS.happiness.happy} Happy`
    : `${EMOJIS.happiness.sad} Sad`;

  const embed = {
    color: 0xfbc02d,
    title: `${EMOJIS.fullness.full} Quackers' Status`,
    fields: [
      {
        name: '🍽 Feeding',
        value: `Currently **${fullness}**.\nLast fed ${msToHuman(delta)} ago.`,
      },
      {
        name: '💛 Happiness',
        value: `Quackers is feeling **${happiness}** today.`,
      },
      {
        name: '📊 Stats',
        value: `Total feeds: **${g.feedCount}**`,
      },
    ],
    footer: { text: 'Remember: Quackers needs care every day 🦆' },
  };

  await interaction.reply({ embeds: [embed] });
}
