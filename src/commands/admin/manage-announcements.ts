import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { Command } from '../../types/index.js';
import { AnnouncementModel } from '../../models/Announcement.js';
import { createErrorEmbed, createSuccessEmbed } from '../../utils/helpers.js';

const command: Command = {
  category: 'admin',
  data: new SlashCommandBuilder()
    .setName('manage-announcements')
    .setDescription('Manage bot announcements (Bot Owner Only)')
    .addSubcommand(subcommand =>
      subcommand
        .setName('list')
        .setDescription('List all active announcements')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('disable')
        .setDescription('Disable an announcement')
        .addStringOption(option =>
          option.setName('id')
            .setDescription('The ID of the announcement to disable')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('enable')
        .setDescription('Enable an announcement')
        .addStringOption(option =>
          option.setName('id')
            .setDescription('The ID of the announcement to enable')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('stats')
        .setDescription('View announcement delivery statistics')
        .addStringOption(option =>
          option.setName('id')
            .setDescription('The ID of the announcement to view stats for')
            .setRequired(true)
        )
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction: ChatInputCommandInteraction) {
    const botOwnerId = process.env.BOT_OWNER_ID;

    // Check if user is bot owner
    if (interaction.user.id !== botOwnerId) {
      const embed = createErrorEmbed(
        'Access Denied',
        'Only the bot owner can manage announcements.'
      );
      await interaction.reply({ embeds: [embed], ephemeral: true });
      return;
    }

    const subcommand = interaction.options.getSubcommand();

    try {
      switch (subcommand) {
        case 'list':
          await handleListAnnouncements(interaction);
          break;
        case 'disable':
          await handleDisableAnnouncement(interaction);
          break;
        case 'enable':
          await handleEnableAnnouncement(interaction);
          break;
        case 'stats':
          await handleAnnouncementStats(interaction);
          break;
      }
    } catch (error) {
      console.error('Error managing announcements:', error);

      const embed = createErrorEmbed(
        'Management Error',
        'There was an error managing the announcements. Please try again later.'
      );
      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },
};

async function handleListAnnouncements(interaction: ChatInputCommandInteraction) {
  const announcements = await AnnouncementModel.find({}).sort({ createdAt: -1 }).limit(10);

  if (announcements.length === 0) {
    const embed = createErrorEmbed(
      'No Announcements',
      'There are no announcements in the database.'
    );
    await interaction.reply({ embeds: [embed], ephemeral: true });
    return;
  }

  const embed = new EmbedBuilder()
    .setColor('#0099ff')
    .setTitle('📢 Announcement Management')
    .setTimestamp()
    .setFooter({ text: 'Showing up to 10 most recent announcements' });

  let description = '';

  for (const announcement of announcements) {
    const status = announcement.isActive ? '🟢 Active' : '🔴 Disabled';
    const deliveredCount = announcement.deliveredTo.length;
    const preview = announcement.content.length > 50
      ? announcement.content.substring(0, 50) + '...'
      : announcement.content;

    description += `**ID:** \`${announcement.id.substring(0, 8)}\`\n`;
    description += `**Status:** ${status}\n`;
    description += `**Created:** ${announcement.createdAt.toDateString()}\n`;
    description += `**Delivered to:** ${deliveredCount} users\n`;
    description += `**Preview:** ${preview}\n\n`;
  }

  embed.setDescription(description);
  await interaction.reply({ embeds: [embed], ephemeral: true });
}

async function handleDisableAnnouncement(interaction: ChatInputCommandInteraction) {
  const id = interaction.options.getString('id', true);

  // Find announcement by partial ID
  const announcement = await AnnouncementModel.findOne({
    id: { $regex: `^${id}`, $options: 'i' }
  });

  if (!announcement) {
    const embed = createErrorEmbed(
      'Announcement Not Found',
      `No announcement found with ID starting with "${id}"`
    );
    await interaction.reply({ embeds: [embed], ephemeral: true });
    return;
  }

  if (!announcement.isActive) {
    const embed = createErrorEmbed(
      'Already Disabled',
      'This announcement is already disabled.'
    );
    await interaction.reply({ embeds: [embed], ephemeral: true });
    return;
  }

  announcement.isActive = false;
  await announcement.save();

  const embed = createSuccessEmbed(
    'Announcement Disabled',
    `Announcement \`${announcement.id.substring(0, 8)}\` has been disabled and will no longer be delivered to users.`
  );

  await interaction.reply({ embeds: [embed], ephemeral: true });
}

async function handleEnableAnnouncement(interaction: ChatInputCommandInteraction) {
  const id = interaction.options.getString('id', true);

  // Find announcement by partial ID
  const announcement = await AnnouncementModel.findOne({
    id: { $regex: `^${id}`, $options: 'i' }
  });

  if (!announcement) {
    const embed = createErrorEmbed(
      'Announcement Not Found',
      `No announcement found with ID starting with "${id}"`
    );
    await interaction.reply({ embeds: [embed], ephemeral: true });
    return;
  }

  if (announcement.isActive) {
    const embed = createErrorEmbed(
      'Already Active',
      'This announcement is already active.'
    );
    await interaction.reply({ embeds: [embed], ephemeral: true });
    return;
  }

  announcement.isActive = true;
  await announcement.save();

  const embed = createSuccessEmbed(
    'Announcement Enabled',
    `Announcement \`${announcement.id.substring(0, 8)}\` has been enabled and will be delivered to users who haven't seen it.`
  );

  await interaction.reply({ embeds: [embed], ephemeral: true });
}

async function handleAnnouncementStats(interaction: ChatInputCommandInteraction) {
  const id = interaction.options.getString('id', true);

  // Find announcement by partial ID
  const announcement = await AnnouncementModel.findOne({
    id: { $regex: `^${id}`, $options: 'i' }
  });

  if (!announcement) {
    const embed = createErrorEmbed(
      'Announcement Not Found',
      `No announcement found with ID starting with "${id}"`
    );
    await interaction.reply({ embeds: [embed], ephemeral: true });
    return;
  }

  const embed = new EmbedBuilder()
    .setColor('#0099ff')
    .setTitle('📊 Announcement Statistics')
    .setDescription(`**Full ID:** \`${announcement.id}\``)
    .addFields(
      {
        name: '📢 Content',
        value: announcement.content,
        inline: false
      },
      {
        name: '📊 Delivery Stats',
        value: `
          **Status:** ${announcement.isActive ? '🟢 Active' : '🔴 Disabled'}
          **Created:** ${announcement.createdAt.toDateString()}
          **Delivered to:** ${announcement.deliveredTo.length} users
        `,
        inline: false
      }
    )
    .setTimestamp();

  await interaction.reply({ embeds: [embed], ephemeral: true });
}

export default command;