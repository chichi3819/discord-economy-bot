import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { Command } from '../../types/index.js';
import { getOrCreateUser, isUserRegistered, createErrorEmbed, createSuccessEmbed } from '../../utils/helpers.js';

const command: Command = {
  category: 'general',
  data: new SlashCommandBuilder()
    .setName('register')
    .setDescription('Register your account to start using the economy system'),

  async execute(interaction: ChatInputCommandInteraction) {
    const userId = interaction.user.id;
    const guildId = interaction.guild?.id || '';
    const username = interaction.user.username;

    // Check if user is already registered
    const alreadyRegistered = await isUserRegistered(userId, guildId);

    if (alreadyRegistered) {
      const embed = createErrorEmbed(
        'Already Registered',
        'You already have an account! Use `/profile` to view your information.'
      );
      await interaction.reply({ embeds: [embed], ephemeral: true });
      return;
    }

    try {
      // Create new user account
      await getOrCreateUser(userId, guildId, username);

      const embed = new EmbedBuilder()
        .setColor('#00ff00')
        .setTitle('🎉 Welcome to the Economy!')
        .setDescription(`
          **Congratulations, ${username}!** Your account has been successfully created.

          **Starting Package:**
          💰 1,000 coins
          ⭐ Level 1

          **Get Started:**
          • Use \`/daily\` to claim your daily reward
          • Use \`/work\` to earn money
          • Use \`/profile\` to view your stats
          • Use \`/help\` to see all available commands

          **Tips:**
          • Commands give you XP to level up
          • Higher levels unlock better rewards
          • Check leaderboards to compete with others!
        `)
        .setThumbnail(interaction.user.displayAvatarURL())
        .setTimestamp()
        .setFooter({ text: 'Welcome to the community!' });

      await interaction.reply({ embeds: [embed] });

    } catch (error) {
      console.error('Error creating user account:', error);

      const embed = createErrorEmbed(
        'Registration Failed',
        'There was an error creating your account. Please try again later.'
      );
      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },
};

export default command;