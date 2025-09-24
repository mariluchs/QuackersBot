import { msToHuman, fullnessFromDelta, now } from '../utils/time.js';
import { saveAll } from '../state.js';
import { EMOJIS } from '../utils/emojis.js';

export const data = {
  name: 'feed',
  description: 'Feed Quackers (server-wide cooldown).'
};

export async function execute(interaction, { state, g }) {
  const nextAllowed = g.lastFedAt + g.cooldownMs;
  const wait = nextAllowed - now();
  if (wait > 0) {
    return interaction.reply({
      content: `⏳ Quackers is still full! Try again in **${msToHuman(wait)}**.`,
      ephemeral: true
    });
  }

  g.lastFedAt = now();
  g.feedCount += 1;
  const uid = interaction.user.id;
  g.feeders[uid] = (g.feeders[uid] || 0) + 1;
  await saveAll(state);

  const { emoji } = fullnessFromDelta(0);
  return interaction.reply(
    `${EMOJIS.misc.feed} Quackers has been fed! Thanks, <@${uid}>! ${emoji}`
  );
}
