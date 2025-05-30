import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { Command } from '../../types/index.js';
import { User } from '../../models/User.js';
import { createErrorEmbed, formatCurrency } from '../../utils/helpers.js';

const command: Command = {
  category: 'economy',
  requiresRegistration: true,
  cooldown: 3,
  data: new SlashCommandBuilder()
    .setName('inventory')
    .setDescription('View your inventory or another user\'s inventory')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user whose inventory you want to view')
        .setRequired(false)
    )
    .addIntegerOption(option =>
      option.setName('page')
        .setDescription('Page number to view (10 items per page)')
        .setMinValue(1)
        .setMaxValue(100)
        .setRequired(false)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const targetUser = interaction.options.getUser('user') || interaction.user;
    const page = interaction.options.getInteger('page') || 1;
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

      const isOwnInventory = targetUser.id === interaction.user.id;
      const inventory = userProfile.inventory;

      if (inventory.length === 0) {
        const embed = new EmbedBuilder()
          .setColor('#999999')
          .setTitle(`${isOwnInventory ? 'Your Inventory' : `${targetUser.username}'s Inventory`}`)
          .setDescription('🎒 This inventory is empty!\n\nItems can be found while working or purchased from the shop.')
          .setThumbnail(targetUser.displayAvatarURL())
          .setTimestamp();

        await interaction.reply({ embeds: [embed] });
        return;
      }

      // Sort inventory by rarity and value
      const rarityOrder = { legendary: 5, epic: 4, rare: 3, uncommon: 2, common: 1 };
      const sortedInventory = inventory.sort((a, b) => {
        const rarityDiff = rarityOrder[b.rarity] - rarityOrder[a.rarity];
        if (rarityDiff !== 0) return rarityDiff;
        return b.value - a.value;
      });

      const itemsPerPage = 10;
      const totalPages = Math.ceil(sortedInventory.length / itemsPerPage);
      const startIndex = (page - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const pageItems = sortedInventory.slice(startIndex, endIndex);

      // Calculate total inventory value
      const totalValue = inventory.reduce((sum, item) => sum + (item.value * item.quantity), 0);

      const embed = new EmbedBuilder()
        .setColor('#9B59B6')
        .setTitle(`🎒 ${isOwnInventory ? 'Your Inventory' : `${targetUser.username}'s Inventory`}`)
        .setThumbnail(targetUser.displayAvatarURL())
        .setTimestamp()
        .setFooter({
          text: `Page ${page}/${totalPages} | ${inventory.length} unique items | Total value: ${formatCurrency(totalValue)}`
        });

      // Create rarity emojis
      const rarityEmojis = {
        common: '⚪',
        uncommon: '🟢',
        rare: '🔵',
        epic: '🟣',
        legendary: '🟡'
      };

      let description = '';

      if (pageItems.length === 0) {
        description = `No items on page ${page}.`;
      } else {
        for (const item of pageItems) {
          const rarityEmoji = rarityEmojis[item.rarity];
          const itemValue = formatCurrency(item.value * item.quantity);

          description += `${rarityEmoji} **${item.name}** ×${item.quantity}\n`;
          description += `*${item.rarity}* • ${itemValue}\n\n`;
        }
      }

      embed.setDescription(description);

      // Add summary statistics
      const rarityStats = inventory.reduce((stats, item) => {
        stats[item.rarity] = (stats[item.rarity] || 0) + item.quantity;
        return stats;
      }, {} as Record<string, number>);

      let statsText = '';
      for (const [rarity, count] of Object.entries(rarityStats)) {
        const emoji = rarityEmojis[rarity as keyof typeof rarityEmojis];
        statsText += `${emoji} ${count} ${rarity}\n`;
      }

      if (statsText) {
        embed.addFields({
          name: '📊 Rarity Breakdown',
          value: statsText,
          inline: true
        });
      }

      // Add navigation info
      if (totalPages > 1) {
        embed.addFields({
          name: '📖 Navigation',
          value: `Use \`/inventory${targetUser.id !== interaction.user.id ? ` user:${targetUser.username}` : ''} page:${page + 1}\` for next page`,
          inline: false
        });
      }

      await interaction.reply({ embeds: [embed] });

    } catch (error) {
      console.error('Error fetching inventory:', error);

      const embed = createErrorEmbed(
        'Inventory Error',
        'There was an error fetching the inventory. Please try again later.'
      );
      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },
};

export default command;