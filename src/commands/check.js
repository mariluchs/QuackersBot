import path from 'path';
import fs from 'fs';
import { AttachmentBuilder } from 'discord.js';
import { msToHuman, fullnessFromDelta, happinessFromPets, now } from '../utils/time.js';
import { ensureTodayCounters } from '../state.js';
import { EMOJIS } from '../utils/emojis.js';

const ASSETS_DIR = path.resolve(process.cwd(), 'src', 'assets');

function getImageForState(fullness) {
  let filename = 'Quackers.png';
  if (fullness === 'starving') filename = 'SadQuackers.png';
  const filePath = path.join(ASSETS_DIR, filename);
  return fs.existsSync(filePath) ? new AttachmentBuilder(filePath, { name: filename }) : null;
}

export const data = {
  name: 'check',
  description: 'Show Quackers’ feeding and happiness.'
};

export async function execute(interaction, { g }) {
  ensureTodayCounters(g);

  const delta = now() - g.lastFedAt;
  const { fullness, emoji: fullnessEmoji } = fullnessFromDelta(delta);
  const { happiness, emoji: happinessEmoji } = happinessFromPets(g.petsToday);
  const nextIn = Math.max(0, g.lastFedAt + g.cooldownMs - now());

  const embed = {
    color: 0x00b2ff,
    title: `Quackers' Status`,
    fields: [
      {
        name: `${EMOJIS.misc.feed} Feeding`,
        value: `Currently **${fullness}** ${fullnessEmoji}.\nLast fed **${msToHuman(delta)}** ago.\nNext feed in **${msToHuman(nextIn)}**.`
      },
      {
        name: `${EMOJIS.misc.pet} Happiness`,
        value: `Quackers is feeling **${happiness}** today ${happinessEmoji}.\nPets so far: **${g.petsToday}**`
      },
      {
        name: '📊 Stats',
        value: `Total feeds: **${g.feedCount}**`
      }
    ],
    footer: { text: 'Remember: Quackers needs care every day 🦆' }
  };

  const file = getImageForState(fullness);
  const payload = { embeds: [embed] };
  if (file) {
    embed.image = { url: `attachment://${file.name}` };
    payload.files = [file];
  }

  return interaction.reply(payload);
}
