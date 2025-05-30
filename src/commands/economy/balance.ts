import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { Command } from '../../types/index.js';
import { User } from '../../models/User.js';
import { createErrorEmbed, formatCurrency } from '../../utils/helpers.js';

const command: Command = {
  category: 'economy',
  requiresRegistration: true,
  data: new SlashCommandBuilder()
    .setName('balance')
    .setDescription('Check your current balance')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('Check another user\'s balance')
        .setRequired(false)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const targetUser = interaction.options.getUser('user') || interaction.user;
    const guildId = interaction.guild?.id || '';

    try {
      const userProfile = await User.findOne({
        userId: targetUser.id,
        guildId
      });

      if (!userProfile) {
        const embed = createErrorEmbed(
          'User Not Found',
          `${targetUser.username} doesn't have a registered account.`
        );
        await interaction.reply({ embeds: [embed], ephemeral: true });
        return;
      }

      const totalWealth = userProfile.balance + userProfile.bank;
      const isOwnBalance = targetUser.id === interaction.user.id;

      const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle(`${isOwnBalance ? 'Your Balance' : `${targetUser.username}'s Balance`}`)
        .setThumbnail(targetUser.displayAvatarURL())
        .addFields(
          {
            name: '💰 Wallet',
            value: formatCurrency(userProfile.balance),
            inline: true
          },
          {
            name: '🏦 Bank',
            value: formatCurrency(userProfile.bank),
            inline: true
          },
          {
            name: '💎 Total Wealth',
            value: formatCurrency(totalWealth),
            inline: true
          },
          {
            name: '📊 Economy Stats',
            value: `**Level:** ${userProfile.level}\n**Commands Used:** ${userProfile.commandsUsed.toLocaleString()}`,
            inline: false
          }
        )
        .setTimestamp()
        .setFooter({
          text: isOwnBalance ?
            'Use /work or /daily to earn more coins!' :
            `Requested by ${interaction.user.username}`
        });

      await interaction.reply({ embeds: [embed] });

    } catch (error) {
      console.error('Error fetching balance:', error);

      const embed = createErrorEmbed(
        'Database Error',
        'There was an error fetching the balance. Please try again later.'
      );
      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },
};

export default command;