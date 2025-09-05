import { ChannelType, Guild, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js'

import { GuildSettings, Text, command } from '../../tools'

const meta = new SlashCommandBuilder()
  .setName('mod_settings')
  .setDescription('Configure les paramètres de modération')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)

meta.addSubcommandGroup((group) =>
  group
    .setName('logger')
    .setDescription('Configurer le logger')
    .addSubcommand((subcommand) =>
      subcommand
        .setName('message')
        .setDescription('Configurer le canal pour les messages du logger')
        .addChannelOption((option) =>
          option
            .setName('channel')
            .setDescription('Le canal où les messages du logger seront envoyés')
            .setRequired(true)
        )
    )
)
export default command({
  meta,
  cooldown: 2,
  execute: async ({ interaction }) => {
    await interaction.deferReply({ ephemeral: true })

    const subcommandGroup = interaction.options.getSubcommandGroup()
    const subcommand = interaction.options.getSubcommand(true)

    switch (subcommandGroup) {
      case 'logger':
        switch (subcommand) {
          case 'message':
            const channel = interaction.options.getChannel('channel', true)

            if (channel.type === ChannelType.GuildText) {
              const { LOGS } = GuildSettings.get(interaction.guild as Guild)

              if (channel.id !== LOGS.LOG_CHANNEL_ID) {
                GuildSettings.update(interaction.guild as Guild, { LOGS: { LOG_CHANNEL_ID: channel.id } })

                await interaction.editReply({
                  content: `✅ Salon de logs défini sur ${Text.channel(channel.id)} pour ce serveur.`
                })
              }
            } else {
              await interaction.editReply({
                content: 'Erreur : Veuillez sélectionner un canal textuel valide.'
              })
            }

            break
        }

        break
    }
  }
})
