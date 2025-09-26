import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  AttachmentBuilder,
} from 'discord.js';
import { defaultGuildState, saveAll, ensureTodayCounters, HOUR, hasGuildState } from '../state.js';
import { msToHuman } from '../utils/time.js';
import { EMOJIS } from '../utils/emojis.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getQuackersImage() {
  const filename = 'Quackers.png';
  const disk = path.join(__dirname, '..', 'assets', filename);
  return { att: new AttachmentBuilder(disk, { name: filename }), filename };
}

export const data = new SlashCommandBuilder()
  .setName('start')
  .setDescription('Set up Quackers for the first time in this server. (Admin only)')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

export async function execute(interaction, g, state) {
  if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
    return interaction.reply({ content: '❌ Admins only.', flags: 64 });
  }

  const guildId = interaction.guildId;

  // ✅ Check directly in DB whether guild already exists
  const exists = await hasGuildState(guildId);
  if (exists) {
    return interaction.reply({
      content: '⚠️ Quackers is already set up in this server!',
      flags: 64,
    });
  }

  // Fresh setup
  const newState = defaultGuildState();
  newState.feedCount = 0;
  newState.petsToday = 0;
  newState.lastFedAt = 0;

  state[guildId] = newState;
  await saveAll(state);

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('start-check')
      .setLabel('Check Quackers')
      .setStyle(ButtonStyle.Primary)
  );

  await interaction.reply({
    content: `🦆 Quackers has arrived!! ${EMOJIS.mood.happy}`,
    components: [row],
  });

  const sentMsg = await interaction.fetchReply();

  const collector = sentMsg.createMessageComponentCollector({
    filter: i => i.customId === 'start-check',
    time: 60_000,
  });

  collector.on('collect', async i => {
    ensureTodayCounters(newState);

    const now = Date.now();
    const delta = now - newState.lastFedAt;

    let fullness = 'full';
    if (delta >= newState.cooldownMs && delta < 4 * HOUR) fullness = 'hungry';
    else if (delta >= 4 * HOUR || newState.lastFedAt === 0) fullness = 'starving';

    const nextFeedMs = Math.max(0, newState.lastFedAt + newState.cooldownMs - now);
    const nextFeedText = nextFeedMs === 0 ? 'now.' : `in ${msToHuman(nextFeedMs)}.`;

    const isHappy = newState.petsToday >= (newState.dailyPetGoal ?? 10);
    const moodDuck = isHappy ? EMOJIS.mood.happy : EMOJIS.mood.sad;

    const { att, filename } = getQuackersImage();

    const embed = {
      color: 0x2b6cb0,
      title: `Quackers' Status`,
      fields: [
        {
          name: `${EMOJIS.feed} Feeding`,
          value:
            `Currently **${fullness}** ${EMOJIS.duck}.\n` +
            `Last fed **${msToHuman(delta)}** ago.\n` +
            `Next feed **${nextFeedText}`,
        },
        {
          name: `${EMOJIS.pet} Happiness`,
          value:
            `Quackers is feeling **${isHappy ? 'happy' : 'sad'}** today ${moodDuck}.\n` +
            `Pets so far: **${newState.petsToday ?? 0}**`,
        },
        {
          name: '📊 Stats',
          value: `Total feeds: **${newState.feedCount ?? 0}**`,
        },
      ],
      image: { url: `attachment://${filename}` },
      footer: { text: 'Remember: Quackers needs care every day 🦆' },
    };

    await i.reply({ embeds: [embed], files: [att], ephemeral: true });
  });
}
