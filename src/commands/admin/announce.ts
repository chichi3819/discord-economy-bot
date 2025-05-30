import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { Command } from '../../types/index.js';
import { AnnouncementModel } from '../../models/Announcement.js';
import { createErrorEmbed, createSuccessEmbed } from '../../utils/helpers.js';
import { randomUUID } from 'node:crypto';

const command: Command = {
  category: 'admin',
  data: new SlashCommandBuilder()
    .setName('announce')
    .setDescription('Create a bot announcement (Bot Owner Only)')
    .addStringOption(option =>
      option.setName('message')
        .setDescription('The announcement message')
        .setRequired(true)
    )
    .addBooleanOption(option =>
      option.setName('preview')
        .setDescription('Preview the announcement without sending it')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction: ChatInputCommandInteraction) {
    const botOwnerId = process.env.BOT_OWNER_ID;

    // Check if user is bot owner
    if (interaction.user.id !== botOwnerId) {
      const embed = createErrorEmbed(
        'Access Denied',
        'Only the bot owner can create announcements.'
      );
      await interaction.reply({ embeds: [embed], ephemeral: true });
      return;
    }

    const message = interaction.options.getString('message', true);
    const isPreview = interaction.options.getBoolean('preview') || false;

    try {
      if (isPreview) {
        // Show preview of the announcement
        const previewEmbed = new EmbedBuilder()
          .setColor('#ffaa00')
          .setTitle('📢 Bot Announcement (PREVIEW)')
          .setDescription(message)
          .setTimestamp()
          .setFooter({ text: 'This is a preview - use announce without preview:true to send it' });

        await interaction.reply({ embeds: [previewEmbed], ephemeral: true });
        return;
      }

      // Create and save the announcement
      const announcement = new AnnouncementModel({
        id: randomUUID(),
        content: message,
        authorId: interaction.user.id,
        createdAt: new Date(),
        isActive: true,
        deliveredTo: []
      });

      await announcement.save();

      const embed = createSuccessEmbed(
        'Announcement Created',
        `Your announcement has been created successfully!\n\n**Preview:**\n${message}\n\nIt will be automatically delivered to users when they use commands.`
      );

      embed.addFields({
        name: '📊 Delivery Info',
        value: 'The announcement will be shown to users as a follow-up message when they use any economy command.',
        inline: false
      });

      await interaction.reply({ embeds: [embed], ephemeral: true });

      console.log(`📢 New announcement created by ${interaction.user.username}: "${message}"`);

    } catch (error) {
      console.error('Error creating announcement:', error);

      const embed = createErrorEmbed(
        'Announcement Error',
        'There was an error creating the announcement. Please try again later.'
      );
      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },
};

export default command;