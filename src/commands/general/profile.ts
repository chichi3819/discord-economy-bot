import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { Command } from '../../types/index.js';
import { User } from '../../models/User.js';
import { createErrorEmbed, formatCurrency } from '../../utils/helpers.js';

const command: Command = {
  category: 'general',
  requiresRegistration: true,
  data: new SlashCommandBuilder()
    .setName('profile')
    .setDescription('View your profile or another user\'s profile')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user whose profile you want to view')
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

      const isOwnProfile = targetUser.id === interaction.user.id;
      const totalWealth = userProfile.balance + userProfile.bank;
      const xpRequired = userProfile.getXpRequired();
      const xpProgress = `${userProfile.xp.toLocaleString()}/${xpRequired.toLocaleString()}`;
      const progressBar = createProgressBar(userProfile.xp, xpRequired);

      // Calculate account age
      const accountAge = Math.floor((Date.now() - userProfile.registeredAt.getTime()) / (1000 * 60 * 60 * 24));

      // Calculate "grind hours" (approximate based on commands used)
      const avgTimePerCommand = 30; // seconds
      const grindHours = Math.floor((userProfile.commandsUsed * avgTimePerCommand) / 3600);

      const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle(`${isOwnProfile ? 'Your Profile' : `${targetUser.username}'s Profile`}`)
        .setThumbnail(targetUser.displayAvatarURL({ size: 256 }))
        .addFields(
          {
            name: '💰 Economy Stats',
            value: `
              **Wallet:** ${formatCurrency(userProfile.balance)}
              **Bank:** ${formatCurrency(userProfile.bank)}
              **Total Wealth:** ${formatCurrency(totalWealth)}
            `,
            inline: true
          },
          {
            name: '⭐ Level & Experience',
            value: `
              **Level:** ${userProfile.level}
              **XP:** ${xpProgress}
              **Total XP:** ${userProfile.totalXp.toLocaleString()}
              ${progressBar}
            `,
            inline: true
          },
          {
            name: '📊 Activity Stats',
            value: `
              **Commands Used:** ${userProfile.commandsUsed.toLocaleString()}
              **Grind Hours:** ${grindHours.toLocaleString()}h
              **Account Age:** ${accountAge} days
            `,
            inline: true
          }
        )
        .setTimestamp()
        .setFooter({
          text: isOwnProfile ?
            `Registered on ${userProfile.registeredAt.toDateString()}` :
            `Requested by ${interaction.user.username}`
        });

      // Add inventory preview if user has items
      if (userProfile.inventory.length > 0) {
        const topItems = userProfile.inventory
          .sort((a, b) => b.value - a.value)
          .slice(0, 3)
          .map(item => `**${item.name}** ×${item.quantity} *(${item.rarity})*`)
          .join('\n');

        embed.addFields({
          name: '🎒 Inventory Preview',
          value: `${topItems}\n${userProfile.inventory.length > 3 ? `*+${userProfile.inventory.length - 3} more items*` : ''}`,
          inline: false
        });
      }

      // Add cooldown info for own profile
      if (isOwnProfile) {
        const now = Date.now();
        const dailyCooldown = parseInt(process.env.DAILY_COOLDOWN || '86400000');
        const workCooldown = parseInt(process.env.WORK_COOLDOWN || '300000');

        let cooldownText = '';

        if (userProfile.lastDaily) {
          const dailyRemaining = Math.max(0, dailyCooldown - (now - userProfile.lastDaily.getTime()));
          cooldownText += `**Daily:** ${dailyRemaining > 0 ? formatDuration(dailyRemaining) : '✅ Available'}\n`;
        } else {
          cooldownText += '**Daily:** ✅ Available\n';
        }

        if (userProfile.lastWork) {
          const workRemaining = Math.max(0, workCooldown - (now - userProfile.lastWork.getTime()));
          cooldownText += `**Work:** ${workRemaining > 0 ? formatDuration(workRemaining) : '✅ Available'}`;
        } else {
          cooldownText += '**Work:** ✅ Available';
        }

        embed.addFields({
          name: '⏰ Command Cooldowns',
          value: cooldownText,
          inline: false
        });
      }

      await interaction.reply({ embeds: [embed] });

    } catch (error) {
      console.error('Error fetching profile:', error);

      const embed = createErrorEmbed(
        'Database Error',
        'There was an error fetching the profile. Please try again later.'
      );
      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },
};

function createProgressBar(current: number, max: number, length: number = 10): string {
  const percentage = Math.min(current / max, 1);
  const filled = Math.floor(percentage * length);
  const empty = length - filled;

  return `[${'█'.repeat(filled)}${'░'.repeat(empty)}] ${Math.floor(percentage * 100)}%`;
}

function formatDuration(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m`;
  return `${seconds}s`;
}

export default command;