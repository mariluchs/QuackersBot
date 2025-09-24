// src/index.js
import 'dotenv/config';
import { Client, GatewayIntentBits, REST, Routes } from 'discord.js';
import { allCommands, commandMap } from './commands/index.js';
import { getGuildState, loadAll, saveAll, MIN } from './state.js';
import { now } from './utils/time.js';

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('ready', () => {
  console.log(`🤖 Logged in as ${client.user.tag}`);
});

/* ---------- Slash command registration ---------- */
const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

async function registerCommands() {
  const body = allCommands.map(c => c.data);

  if (process.env.GUILD_ID) {
    console.log(`🔧 Registering GUILD commands for ${process.env.GUILD_ID}...`);
    // Overwrite guild commands (instant updates)
    await rest.put(
      Routes.applicationGuildCommands(process.env.APP_ID, process.env.GUILD_ID),
      { body }
    );
    // Clear global commands to prevent duplicates in the picker
    await rest.put(
      Routes.applicationCommands(process.env.APP_ID),
      { body: [] }
    );
  } else {
    console.log('🌍 Registering GLOBAL commands...');
    await rest.put(
      Routes.applicationCommands(process.env.APP_ID),
      { body }
    );
  }
  console.log('✅ Slash commands registered.');
}
await registerCommands();

/* ---------- Interaction routing ---------- */
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const guildId = interaction.guildId;
  if (!guildId) {
    return interaction.reply({ content: 'This bot only works in servers.', ephemeral: true });
  }

  const cmd = commandMap.get(interaction.commandName);
  if (!cmd) return;

  const { state, g } = await getGuildState(guildId);

  try {
    await cmd.execute(interaction, { state, g }); // command handler updates state object
    await saveAll(state);                          // persist after each command
  } catch (err) {
    console.error(`[${interaction.commandName}]`, err);
    if (interaction.deferred || interaction.replied) {
      await interaction.followUp({ content: 'Oops—something went wrong.' });
    } else {
      await interaction.reply({ content: 'Oops—something went wrong.', ephemeral: true });
    }
  }
});

/* ---------- Reminder loop ----------
   Every 60s, for each guild with reminders enabled:
   If the pet is overdue and we haven't pinged recently, ping the role. */
setInterval(async () => {
  const state = await loadAll();

  for (const [gid, g] of Object.entries(state)) {
    if (!g?.reminderRoleId || !g?.reminderChannelId) continue;

    const overdue = now() > (g.lastFedAt + g.cooldownMs);
    const cooledDownSinceLastPing =
      now() - (g.lastReminderAt || 0) > (g.reminderEveryMs || 30 * MIN);

    if (!overdue || !cooledDownSinceLastPing) continue;

    try {
      const channel = await client.channels.fetch(g.reminderChannelId);
      if (!channel) continue;

      await channel.send({
        content: `<@&${g.reminderRoleId}> Quackers needs to be fed! ${EMOJIS.misc.feed}`,
        allowedMentions: { roles: [g.reminderRoleId] }
      });


      g.lastReminderAt = now();
    } catch (e) {
      console.error(`Reminder send failed for guild ${gid}:`, e.message);
    }
  }

  await saveAll(state);
}, 60 * 1000);

/* ---------- Login ---------- */
client.login(process.env.DISCORD_TOKEN);
