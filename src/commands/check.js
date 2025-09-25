// src/commands/check.js
import { SlashCommandBuilder } from 'discord.js';
import { ensureTodayCounters, defaultGuildState, HOUR } from '../state.js';
import { EMOJIS } from '../utils/emojis.js';
import { msToHuman } from '../utils/time.js';

export const data = new SlashCommandBuilder()
  .setName('check')
  .setDescription("Show Quackers' feeding & happiness.");

export async function execute(interaction, g, state) {
  // Safety: ensure guild state & maps
  if (!g) {
    g = defaultGuildState();
    state[interaction.guildId] = g;
  }
  g.feeders ??= {};
  g.petStats ??= {};
  ensureTodayCounters(g);

  const delta = Date.now() - g.lastFedAt;

  let fullnessText;
  if (delta < g.cooldownMs) fullnessText = 'full';
  else if (delta < 3 * HOUR) fullnessText = 'hungry';
  else fullnessText = 'starving';

  const happinessText = (g.petsToday > 0) ? 'happy' : 'sad';

  const embed = {
    color: 0xfbc02d,
    title: `🦆 Quackers' Status`,
    fields: [
      {
        name: '🍽 Feeding',
        value: `Currently **${fullnessText}**.\nLast fed **${msToHuman(delta)}** ago.`,
      },
      {
        name: '💛 Happiness',
        value: `Quackers is feeling **${happinessText}** today.`,
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
