import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } from 'discord.js';
import { Command } from '../../types/index.js';

const command: Command = {
  category: 'general',
  cooldown: 3,
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Get help with bot commands')
    .addStringOption(option =>
      option.setName('category')
        .setDescription('Get help for a specific category')
        .setRequired(false)
        .addChoices(
          { name: '💰 Economy Commands', value: 'economy' },
          { name: '📊 General Commands', value: 'general' },
          { name: '⚙️ Admin Commands', value: 'admin' }
        )
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const category = interaction.options.getString('category');

    if (category) {
      await sendCategoryHelp(interaction, category);
    } else {
      await sendMainHelp(interaction);
    }
  },
};

async function sendMainHelp(interaction: ChatInputCommandInteraction) {
  const embed = new EmbedBuilder()
    .setColor('#0099ff')
    .setTitle('🤖 Discord Economy Bot - Help')
    .setDescription(`
      Welcome to the **Discord Economy Bot**! This bot features a comprehensive economy system with leveling, items, and competitive leaderboards.

      **🚀 Getting Started:**
      If you haven't already, use \`/register\` to create your account and start your journey!

      **📚 Command Categories:**
      Use the dropdown below or the category commands to explore:
    `)
    .addFields(
      {
        name: '💰 Economy Commands',
        value: `
          Essential commands for earning, spending, and managing your virtual currency.
          Use \`/help category:economy\` for details.
        `,
        inline: false
      },
      {
        name: '📊 General Commands',
        value: `
          Profile management, leaderboards, and informational commands.
          Use \`/help category:general\` for details.
        `,
        inline: false
      },
      {
        name: '⚙️ Admin Commands',
        value: `
          Bot management and announcement tools (Owner only).
          Use \`/help category:admin\` for details.
        `,
        inline: false
      },
      {
        name: '💡 Pro Tips',
        value: `
          • Commands give you XP to level up and unlock better rewards
          • Higher levels mean better daily rewards and work payouts
          • Check leaderboards to see how you rank against others
          • Look out for announcement messages with bot updates!
        `,
        inline: false
      }
    )
    .setThumbnail(interaction.client.user?.displayAvatarURL())
    .setTimestamp()
    .setFooter({ text: 'Use the dropdown menu or category commands for detailed help' });

  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId('help_category_select')
    .setPlaceholder('Choose a category for detailed help')
    .addOptions([
      {
        label: '💰 Economy Commands',
        description: 'Commands for earning and managing currency',
        value: 'economy'
      },
      {
        label: '📊 General Commands',
        description: 'Profile, leaderboards, and information',
        value: 'general'
      },
      {
        label: '⚙️ Admin Commands',
        description: 'Bot management tools (Owner only)',
        value: 'admin'
      }
    ]);

  const actionRow = new ActionRowBuilder<StringSelectMenuBuilder>()
    .addComponents(selectMenu);

  await interaction.reply({
    embeds: [embed],
    components: [actionRow]
  });
}

async function sendCategoryHelp(interaction: ChatInputCommandInteraction, category: string) {
  let embed: EmbedBuilder;

  switch (category) {
    case 'economy':
      embed = new EmbedBuilder()
        .setColor('#00ff00')
        .setTitle('💰 Economy Commands')
        .setDescription('Commands for earning, managing, and spending your virtual currency.')
        .addFields(
          {
            name: '💰 /balance [user]',
            value: 'Check your current balance and wealth stats. Optionally view another user\'s balance.',
            inline: false
          },
          {
            name: '🎁 /daily',
            value: 'Claim your daily reward! Higher levels get bigger bonuses. (24 hour cooldown)',
            inline: false
          },
          {
            name: '⚡ /work',
            value: 'Work various jobs to earn money. Better jobs unlock as you level up! (5 minute cooldown)',
            inline: false
          },
          {
            name: '🎒 /inventory [user]',
            value: 'View your collected items and their values. Some items can be found while working!',
            inline: false
          },
          {
            name: '🏦 /shop',
            value: 'Browse and purchase items from the shop using your earned currency.',
            inline: false
          },
          {
            name: '💳 /transfer <user> <amount>',
            value: 'Transfer coins to another user. Spread the wealth!',
            inline: false
          }
        )
        .setFooter({ text: 'Economy commands require registration with /register' });
      break;

    case 'general':
      embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('📊 General Commands')
        .setDescription('Profile management, leaderboards, and informational commands.')
        .addFields(
          {
            name: '📝 /register',
            value: 'Create your economy account to start earning and leveling up!',
            inline: false
          },
          {
            name: '👤 /profile [user]',
            value: 'View detailed profile information including level, XP, wealth, and activity stats.',
            inline: false
          },
          {
            name: '🏆 /leaderboard <type> [page]',
            value: 'View server rankings:\n• **balance** - Richest users\n• **level** - Highest levels\n• **commands** - Most active (grind hours)',
            inline: false
          },
          {
            name: '❓ /help [category]',
            value: 'Display this help information. Use category option for specific command details.',
            inline: false
          },
          {
            name: '📊 /stats',
            value: 'View bot statistics and server economy information.',
            inline: false
          }
        )
        .setFooter({ text: 'Most commands require registration first' });
      break;

    case 'admin':
      embed = new EmbedBuilder()
        .setColor('#ff6600')
        .setTitle('⚙️ Admin Commands')
        .setDescription('Bot management and announcement tools (Bot Owner Only).')
        .addFields(
          {
            name: '📢 /announce <message> [preview]',
            value: 'Create bot announcements that are delivered to users when they use commands.',
            inline: false
          },
          {
            name: '⚙️ /manage-announcements',
            value: 'Manage announcements:\n• **list** - View all announcements\n• **disable/enable** - Toggle announcement status\n• **stats** - View delivery statistics',
            inline: false
          },
          {
            name: '💰 /economy-admin',
            value: 'Economy management:\n• **add-money** - Give currency to users\n• **reset-user** - Reset user data\n• **server-stats** - View economy statistics',
            inline: false
          },
          {
            name: '🔧 /bot-admin',
            value: 'Bot maintenance:\n• **restart** - Restart the bot\n• **backup** - Create database backup\n• **status** - View bot health',
            inline: false
          }
        )
        .setFooter({ text: 'Admin commands are restricted to the bot owner only' });
      break;

    default:
      embed = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle('❌ Unknown Category')
        .setDescription('The specified category was not found.');
      break;
  }

  await interaction.reply({ embeds: [embed], ephemeral: true });
}

export default command;