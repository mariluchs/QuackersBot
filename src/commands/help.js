import { EmbedBuilder } from 'discord.js';

// Anything listed here will be hidden from /help
const TEST_COMMANDS = new Set([
  'resetfeed', 'resetpet', 'resetmypet', 'forceremind', 'forcehungry'
]);

export const data = {
  name: 'help',
  description: 'Show Quackers commands.'
};

export async function execute(interaction) {
  // Fetch currently-registered guild commands to build </name:id> mentions
  const fetched = await interaction.guild.commands.fetch().catch(() => null);
  const byName = new Map();
  if (fetched) for (const cmd of fetched.values()) byName.set(cmd.name, cmd);

  // Define commands (short & clear)
  const everyone = [
    { name: 'check',       desc: 'Check on Quackers to see if he needs to be pet or fed.' },
    { name: 'feed',        desc: 'Feed Quackers every two hours (Server cooldown).' },
    { name: 'pet',         desc: 'Pet Quackers hourly (User cooldown).' },
    { name: 'leaderboard', desc: 'Top feeders & petters.' },
  ];

  const admins = [
    { name: 'setreminder', desc: 'Ping a role when Quackers is hungry.' },
    { name: 'reminderoff', desc: 'Turn off reminders.' },
  ];

  // Remove anything marked as test
  const filterVisible = list => list.filter(c => !TEST_COMMANDS.has(c.name));

  const mention = name => {
    const cmd = byName.get(name);
    return cmd ? `</${cmd.name}:${cmd.id}>` : `/${name}`;
  };

  const lines = list => list.map(c => `${mention(c.name)} — ${c.desc}`).join('\n');

  const embed = new EmbedBuilder()
    .setColor(0x00b2ff)
    .setTitle('Quackers — Help')
    .addFields(
      { name: 'Everyone', value: lines(filterVisible(everyone)) || '—', inline: false },
      { name: 'Admins',   value: lines(filterVisible(admins))   || '—', inline: false },
    )
    .setFooter({ text: 'Tip: Click a command to insert it.' });

  return interaction.reply({ embeds: [embed], ephemeral: true });
}
