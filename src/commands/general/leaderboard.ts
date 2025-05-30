import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { Command } from '../../types/index.js';
import { getLeaderboard, createErrorEmbed, formatCurrency } from '../../utils/helpers.js';

const command: Command = {
  category: 'general',
  requiresRegistration: true,
  cooldown: 3,
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('View server leaderboards')
    .addStringOption(option =>
      option.setName('type')
        .setDescription('The type of leaderboard to display')
        .setRequired(true)
        .addChoices(
          { name: '💰 Richest Users (Balance)', value: 'balance' },
          { name: '⭐ Highest Levels', value: 'level' },
          { name: '⚡ Most Active (Commands Used)', value: 'commands' }
        )
    )
    .addIntegerOption(option =>
      option.setName('page')
        .setDescription('Page number to view (10 users per page)')
        .setMinValue(1)
        .setMaxValue(100)
        .setRequired(false)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const leaderboardType = interaction.options.getString('type', true) as 'balance' | 'level' | 'commands';
    const page = interaction.options.getInteger('page') || 1;
    const guildId = interaction.guild?.id || '';

    try {
      await interaction.deferReply();

      const usersPerPage = 10;
      const offset = (page - 1) * usersPerPage;

      // Get leaderboard data
      const leaderboardData = await getLeaderboard(leaderboardType, guildId, offset + usersPerPage);

      if (leaderboardData.length === 0) {
        const embed = createErrorEmbed(
          'No Data',
          'No users found for this leaderboard.'
        );
        await interaction.editReply({ embeds: [embed] });
        return;
      }

      // Get the page slice
      const pageData = leaderboardData.slice(offset, offset + usersPerPage);

      // Create leaderboard embed
      let title: string;
      let emoji: string;
      let valueFormatter: (value: number) => string;

      switch (leaderboardType) {
        case 'balance':
          title = '💰 Richest Users';
          emoji = '💰';
          valueFormatter = formatCurrency;
          break;
        case 'level':
          title = '⭐ Highest Levels';
          emoji = '⭐';
          valueFormatter = (value: number) => `Level ${value}`;
          break;
        case 'commands':
          title = '⚡ Most Active Users';
          emoji = '⚡';
          valueFormatter = (value: number) => {
            const grindHours = Math.floor((value * 30) / 3600); // Approximate hours
            return `${value.toLocaleString()} commands (${grindHours}h grind)`;
          };
          break;
      }

      const embed = new EmbedBuilder()
        .setColor('#ffd700')
        .setTitle(`${title} - Page ${page}`)
        .setTimestamp()
        .setFooter({ text: `Showing ranks ${offset + 1}-${offset + pageData.length} | Use /leaderboard type:${leaderboardType} page:${page + 1} for next page` });

      // Create leaderboard description
      let description = '';

      for (let i = 0; i < pageData.length; i++) {
        const user = pageData[i];
        const rank = offset + i + 1;

        let medal = '';
        if (rank === 1) medal = '🥇';
        else if (rank === 2) medal = '🥈';
        else if (rank === 3) medal = '🥉';
        else medal = `**${rank}.**`;

        const userMention = `<@${user.userId}>`;
        description += `${medal} ${userMention}\n${emoji} ${valueFormatter(user.value)}\n\n`;
      }

      embed.setDescription(description);

      // Add user's own ranking if they're not on this page
      const userRank = leaderboardData.findIndex(u => u.userId === interaction.user.id);
      if (userRank !== -1 && (userRank < offset || userRank >= offset + usersPerPage)) {
        const userData = leaderboardData[userRank];
        embed.addFields({
          name: '📍 Your Ranking',
          value: `**Rank ${userRank + 1}:** ${valueFormatter(userData.value)}`,
          inline: false
        });
      }

      // Add statistics
      const totalUsers = leaderboardData.length;
      const topUser = leaderboardData[0];

      embed.addFields({
        name: '📊 Server Stats',
        value: `
          **Total Registered Users:** ${totalUsers.toLocaleString()}
          **Server Leader:** <@${topUser.userId}> with ${valueFormatter(topUser.value)}
        `,
        inline: false
      });

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      console.error('Error fetching leaderboard:', error);

      const embed = createErrorEmbed(
        'Leaderboard Error',
        'There was an error fetching the leaderboard. Please try again later.'
      );

      if (interaction.deferred) {
        await interaction.editReply({ embeds: [embed] });
      } else {
        await interaction.reply({ embeds: [embed], ephemeral: true });
      }
    }
  },
};

export default command;