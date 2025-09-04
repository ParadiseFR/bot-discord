import { PermissionFlagsBits, SlashCommandBuilder } from 'discord.js'

import { command, GuildSettings, Text } from '../../tools'

const meta = new SlashCommandBuilder()
  .setName('salon')
  .setDescription('Manage or retrieve information about a specific channel.')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)

meta.addChannelOption(
  (option) => option.setName('salon').setDescription('The channel to interact with.').setRequired(true) // Make the channel option required
)

export default command({
  meta,
  cooldown: 3,
  execute: async ({ interaction }) => {
    await interaction.deferReply({ ephemeral: true })

    const channel = interaction.options.getChannel('salon', true)
    GuildSettings.setLogChannel(interaction.guildId as string, channel.id)

    await interaction.editReply(`✅ Salon de logs défini sur ${Text.channel(channel.id)} pour ce serveur.`)
  }
})
