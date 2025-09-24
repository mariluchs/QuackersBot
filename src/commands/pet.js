// src/commands/pet.js
import { now, msToHuman } from '../utils/time.js';
import { ensureTodayCounters, saveAll } from '../state.js';
import { EMOJIS } from '../utils/emojis.js';

export const data = {
  name: 'pet',
  description: 'Pet Quackers (per-user 1h cooldown).'
};

export async function execute(interaction, { state, g }) {
  ensureTodayCounters(g);

  const uid = interaction.user.id;
  const u = g.petStats[uid] ?? { lastPetAt: 0, count: 0 };

  const nextAllowed = u.lastPetAt + g.petCooldownMs;
  const wait = nextAllowed - now();
  if (wait > 0) {
    return interaction.reply({
      content: `⏳ You already petted Quackers! Try again in **${msToHuman(wait)}**.`,
      ephemeral: true
    });
  }

  u.lastPetAt = now();
  u.count = (u.count || 0) + 1;
  g.petStats[uid] = u;
  g.petsToday = (g.petsToday || 0) + 1;
  await saveAll(state);

  // Use the happy Quackers emoji you configured
  return interaction.reply(
    `${EMOJIS.misc.pet} Quackers has been pet! Thanks <@${uid}>! ${EMOJIS.happiness.happy}`
    // or: ${EMOJIS.fullness.full} if you prefer
  );
}
