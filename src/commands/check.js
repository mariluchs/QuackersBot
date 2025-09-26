// src/commands/check.js
import { SlashCommandBuilder, AttachmentBuilder } from 'discord.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { ensureTodayCounters, HOUR, hasGuildState } from '../state.js';
import { msToHuman } from '../utils/time.js';
import { EMOJIS } from '../utils/emojis.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getQuackersImage() {
  const filename = 'Quackers.png';
  const disk = path.join(__dirname, '..', 'assets', filename);
  return { att: new AttachmentBuilder(disk, { name: filename }), filename };
}

export const data = new SlashCommandBuilder()
  .setName('check')
  .setDescription("Show Quackers' feeding & happiness.");

export async function execute(interaction, g, state) {
  const guildId = interaction.guildId;

  // ✅ Block if somehow state missing in DB (very rare)
  const exists = await hasGuildState(guildId);
  if (!exists) {
    return interaction.reply({
      content:
        '⚠️ Something went wrong — Quackers is not initialized. Try again or run `/reset` as admin.',
      flags: 64,
    });
  }

  g.feeders ??= {};
  g.petStats ??= {};
  ensureTodayCounters(g);

  const now = Date.now();
  const delta = g.lastFedAt === 0 ? null : now - g.lastFedAt;

  // --- Fullness logic ---
  let fullness = 'full';
  if (g.lastFedAt === 0) fullness = 'starving'; // brand new
  else if (delta >= g.cooldownMs && delta < 4 * HOUR) fullness = 'hungry';
  else if (delta >= 4 * HOUR) fullness = 'starving';

  // --- Next feed text ---
  const nextFeedMs =
    g.lastFedAt === 0 ? 0 : Math.max(0, g.lastFedAt + g.cooldownMs - now);
  const nextFeedText =
    g.lastFedAt === 0
      ? 'now.'
      : nextFeedMs === 0
      ? 'now.'
      : `in ${msToHuman(nextFeedMs)}.`;

  // --- Happiness logic ---
  const isHappy = g.petsToday >= (g.dailyPetGoal ?? 10);
  const moodDuck = isHappy ? EMOJIS.mood.happy : EMOJIS.mood.sad;

  const { att, filename } = getQuackersImage();

  // --- Special first-time message ---
  const firstTime = g.feedCount === 0 && g.lastFedAt === 0;

  const embed = {
    color: 0x2b6cb0,
    title: `Quackers' Status`,
    description: firstTime
      ? `🦆 Quackers has just appeared in this server!\nHe is **starving** ${EMOJIS.duck} — better feed him soon ${EMOJIS.feed}`
      : undefined,
    fields: [
      {
        name: `${EMOJIS.feed} Feeding`,
        value:
          `Currently **${fullness}** ${EMOJIS.duck}.\n` +
          `Last fed **${delta === null ? 'never' : msToHuman(delta)}** ago.\n` +
          `Next feed **${nextFeedText}**`,
      },
      {
        name: `${EMOJIS.pet} Happiness`,
        value:
          `Quackers is feeling **${isHappy ? 'happy' : 'sad'}** today ${moodDuck}.\n` +
          `Pets so far: **${g.petsToday ?? 0}**`,
      },
      {
        name: '📊 Stats',
        value: `Total feeds: **${g.feedCount ?? 0}**`,
      },
    ],
    image: { url: `attachment://${filename}` },
    footer: { text: 'Remember: Quackers needs care every day 🦆' },
  };

  await interaction.reply({ embeds: [embed], files: [att] });
}
