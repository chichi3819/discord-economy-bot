import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { Command } from '../../types/index.js';
import { User } from '../../models/User.js';
import { createErrorEmbed, formatCurrency, formatDuration, randomBetween, isOnCooldown, getRemainingCooldown } from '../../utils/helpers.js';

const command: Command = {
  category: 'economy',
  requiresRegistration: true,
  cooldown: 5, // 5 second cooldown for the command itself
  data: new SlashCommandBuilder()
    .setName('work')
    .setDescription('Work to earn coins (5 minute cooldown)'),

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

      const workCooldown = parseInt(process.env.WORK_COOLDOWN || '300000'); // 5 minutes

      // Check cooldown
      if (isOnCooldown(user.lastWork, workCooldown)) {
        const remaining = getRemainingCooldown(user.lastWork, workCooldown);
        const embed = createErrorEmbed(
          'Work Cooldown',
          `You're too tired to work right now! Rest for ${formatDuration(remaining)}.`
        );
        await interaction.reply({ embeds: [embed], ephemeral: true });
        return;
      }

      // Work job selection based on level
      const jobs = [
        { name: 'Street Sweeper', minLevel: 1, baseMin: 50, baseMax: 150, emoji: '🧹' },
        { name: 'Food Delivery', minLevel: 3, baseMin: 75, baseMax: 200, emoji: '🍕' },
        { name: 'Construction Worker', minLevel: 5, baseMin: 100, baseMax: 250, emoji: '🔨' },
        { name: 'Office Worker', minLevel: 8, baseMin: 150, baseMax: 300, emoji: '💼' },
        { name: 'Software Developer', minLevel: 12, baseMin: 200, baseMax: 400, emoji: '💻' },
        { name: 'Business Owner', minLevel: 20, baseMin: 300, baseMax: 600, emoji: '👔' },
        { name: 'Investment Banker', minLevel: 30, baseMin: 500, baseMax: 1000, emoji: '💰' }
      ];

      // Find available jobs for user's level
      const availableJobs = jobs.filter(job => user.level >= job.minLevel);
      const selectedJob = availableJobs[Math.floor(Math.random() * availableJobs.length)];

      // Calculate earnings
      const levelMultiplier = 1 + (user.level * 0.05); // 5% increase per level
      const baseEarnings = randomBetween(selectedJob.baseMin, selectedJob.baseMax);
      const finalEarnings = Math.floor(baseEarnings * levelMultiplier);

      // Random work outcomes
      const outcomes = [
        { text: 'You worked hard and earned', multiplier: 1 },
        { text: 'You impressed your boss and earned', multiplier: 1.2 },
        { text: 'You had a productive day and earned', multiplier: 1.1 },
        { text: 'You completed all tasks and earned', multiplier: 1 },
        { text: 'You went above and beyond and earned', multiplier: 1.3 },
        { text: 'You had a regular workday and earned', multiplier: 1 }
      ];

      const outcome = outcomes[Math.floor(Math.random() * outcomes.length)];
      const totalEarnings = Math.floor(finalEarnings * outcome.multiplier);

      // Small chance for bonus items/loot
      let bonusItem = null;
      if (Math.random() < 0.15) { // 15% chance
        const bonusItems = [
          { name: 'Energy Drink', value: 25, rarity: 'common' as const },
          { name: 'Lucky Coin', value: 100, rarity: 'uncommon' as const },
          { name: 'Golden Wrench', value: 250, rarity: 'rare' as const }
        ];
        bonusItem = bonusItems[Math.floor(Math.random() * bonusItems.length)];
      }

      // Update user data
      user.balance += totalEarnings;
      user.lastWork = new Date();

      if (bonusItem) {
        user.addItem({
          itemId: bonusItem.name.toLowerCase().replace(' ', '_'),
          name: bonusItem.name,
          rarity: bonusItem.rarity,
          value: bonusItem.value
        });
      }

      await user.save();

      const embed = new EmbedBuilder()
        .setColor('#00ff00')
        .setTitle(`${selectedJob.emoji} Work Complete!`)
        .setDescription(`
          **Job:** ${selectedJob.name}
          ${outcome.text} ${formatCurrency(totalEarnings)}!
          ${outcome.multiplier > 1 ? `*(${Math.floor((outcome.multiplier - 1) * 100)}% bonus)*` : ''}

          **New Balance:** ${formatCurrency(user.balance)}
        `)
        .setThumbnail(interaction.user.displayAvatarURL())
        .addFields({
          name: '📊 Work Stats',
          value: `**Level:** ${user.level}\n**Level Bonus:** +${Math.floor((levelMultiplier - 1) * 100)}%`,
          inline: true
        })
        .setTimestamp()
        .setFooter({ text: 'Keep working to level up and unlock better jobs!' });

      if (bonusItem) {
        embed.addFields({
          name: '🎁 Bonus Item Found!',
          value: `You found a **${bonusItem.name}** *(${bonusItem.rarity})*\nValue: ${formatCurrency(bonusItem.value)}`,
          inline: false
        });
      }

      // Show next job unlock if applicable
      const nextJob = jobs.find(job => job.minLevel > user.level);
      if (nextJob) {
        embed.addFields({
          name: '🔓 Next Job Unlock',
          value: `**${nextJob.name}** ${nextJob.emoji}\nRequires Level ${nextJob.minLevel}`,
          inline: true
        });
      }

      await interaction.reply({ embeds: [embed] });

    } catch (error) {
      console.error('Error processing work command:', error);

      const embed = createErrorEmbed(
        'Work Error',
        'There was an error processing your work. Please try again later.'
      );
      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },
};

export default command;