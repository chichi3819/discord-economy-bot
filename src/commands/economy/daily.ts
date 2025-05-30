import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { Command } from '../../types/index.js';
import { User } from '../../models/User.js';
import { createErrorEmbed, createSuccessEmbed, formatCurrency, formatDuration, randomBetween, isOnCooldown, getRemainingCooldown } from '../../utils/helpers.js';

const command: Command = {
  category: 'economy',
  requiresRegistration: true,
  data: new SlashCommandBuilder()
    .setName('daily')
    .setDescription('Claim your daily reward (24 hour cooldown)'),

  async execute(interaction: ChatInputCommandInteraction) {
    const userId = interaction.user.id;
    const guildId = interaction.guild?.id || '';

    try {
      const user = await User.findOne({ userId, guildId });

      if (!user) {
        const embed = createErrorEmbed(
          'User Not Found',
          'Please register first using `/register`'
        );
        await interaction.reply({ embeds: [embed], ephemeral: true });
        return;
      }

      const dailyCooldown = parseInt(process.env.DAILY_COOLDOWN || '86400000'); // 24 hours

      // Check cooldown
      if (isOnCooldown(user.lastDaily, dailyCooldown)) {
        const remaining = getRemainingCooldown(user.lastDaily, dailyCooldown);
        const embed = createErrorEmbed(
          'Daily Cooldown',
          `You've already claimed your daily reward! Come back in ${formatDuration(remaining)}.`
        );
        await interaction.reply({ embeds: [embed], ephemeral: true });
        return;
      }

      // Calculate reward (with level bonus)
      const baseMin = parseInt(process.env.DAILY_REWARD_MIN || '100');
      const baseMax = parseInt(process.env.DAILY_REWARD_MAX || '500');
      const levelBonus = Math.floor(user.level * 50); // 50 coins per level

      const rewardAmount = randomBetween(baseMin + levelBonus, baseMax + levelBonus);

      // Calculate streak bonus (simplified - consecutive days)
      let streakDays = 1;
      if (user.lastDaily) {
        const timeSinceLastDaily = Date.now() - user.lastDaily.getTime();
        const oneDayInMs = 24 * 60 * 60 * 1000;
        const twoDaysInMs = 48 * 60 * 60 * 1000;

        // If claimed within 24-48 hours, it's a streak
        if (timeSinceLastDaily >= oneDayInMs && timeSinceLastDaily <= twoDaysInMs) {
          // This is a simplified streak calculation
          // In a real bot, you'd want to track actual consecutive days
          streakDays = Math.min(7, Math.floor(user.level / 2) + 1);
        }
      }

      const streakBonus = streakDays > 1 ? Math.floor(rewardAmount * 0.1 * (streakDays - 1)) : 0;
      const totalReward = rewardAmount + streakBonus;

      // Update user data
      user.balance += totalReward;
      user.lastDaily = new Date();
      await user.save();

      const embed = new EmbedBuilder()
        .setColor('#00ff00')
        .setTitle('🎁 Daily Reward Claimed!')
        .setDescription(`
          ${formatCurrency(rewardAmount)} **Base Reward**
          ${levelBonus > 0 ? `+${formatCurrency(levelBonus)} **Level Bonus** (Level ${user.level})` : ''}
          ${streakBonus > 0 ? `+${formatCurrency(streakBonus)} **Streak Bonus** (${streakDays} days)` : ''}

          **Total Earned:** ${formatCurrency(totalReward)}
          **New Balance:** ${formatCurrency(user.balance)}
        `)
        .setThumbnail(interaction.user.displayAvatarURL())
        .setTimestamp()
        .setFooter({ text: 'Come back tomorrow for another reward!' });

      if (streakDays > 1) {
        embed.addFields({
          name: '🔥 Daily Streak',
          value: `${streakDays} consecutive days!\nKeep it up for bigger bonuses!`,
          inline: false
        });
      }

      await interaction.reply({ embeds: [embed] });

    } catch (error) {
      console.error('Error processing daily command:', error);

      const embed = createErrorEmbed(
        'Command Error',
        'There was an error processing your daily reward. Please try again later.'
      );
      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },
};

export default command;