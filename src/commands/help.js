// src/commands/help.js
import { SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('help')
  .setDescription('Show all commands and what they do.');

export async function execute(interaction, g) {
  const embed = {
    color: 0x4fc3f7,
    title: '🦆 Quackers — Help',
    fields: [
      { name: '/check', value: 'Show Quackers’ feeding & happiness.' },
      { name: '/feed', value: 'Feed Quackers (server-wide cooldown).' },
      { name: '/pet', value: 'Pet Quackers (per-user cooldown).' },
      { name: '/leaderboard', value: 'Top feeders & petters.' },
      { name: '/setreminder', value: 'Ping a role when Quackers is overdue. *(Admin)*' },
      { name: '/reminderoff', value: 'Disable reminders. *(Admin)*' },
      // ❌ no /start here — stays hidden from regular players
    ],
    footer: { text: 'Tip: Click a command above to insert it.' },
  };

  await interaction.reply({ embeds: [embed], flags: 64 }); // ✅ was ephemeral
}
