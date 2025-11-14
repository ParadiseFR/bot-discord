import { ChannelType, Guild, MessageFlags, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js'

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
    .addSubcommand((subcommand) =>
      subcommand
        .setName('welcome')
        .setDescription('Configurer le salon de bienvenue')
        .addChannelOption((option) =>
          option
            .setName('channel')
            .setDescription('Le canal où les messages de bienvenue seront envoyés')
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('channels')
        .setDescription('Configurer les salons à ignorer')
        .addChannelOption((option) => option.setName('channel').setDescription('Le salon à ignorer').setRequired(true))
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('roles')
        .setDescription('Configurer les rôles à ignorer')
        .addRoleOption((option) => option.setName('role').setDescription('Le rôles à ignorer').setRequired(true))
    )
)

export default command({
  meta,
  cooldown: 2,
  execute: async ({ interaction }) => {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral })

    const subcommandGroup = interaction.options.getSubcommandGroup()
    const subcommand = interaction.options.getSubcommand(true)
    const channel = interaction.options.getChannel('channel', true)

    switch (subcommandGroup) {
      case 'logger':
        switch (subcommand) {
          case 'message':
            if (channel.type === ChannelType.GuildText) {
              const { LOGS } = GuildSettings.get(interaction.guild as Guild)

              if (channel.id !== LOGS.LOG_CHANNEL_ID) {
                GuildSettings.update(interaction.guild as Guild, { LOGS: { LOG_CHANNEL_ID: channel.id } })

                await interaction.editReply({
                  content: `✅ Salon de logs défini sur ${Text.channel(channel.id)} pour ce serveur.`
                })
              } else
                await interaction.editReply({
                  content: `Salon de logs déjà défini ici.`
                })
            } else {
              await interaction.editReply({
                content: 'Erreur : Veuillez sélectionner un canal textuel valide.'
              })
            }

            break
          case 'welcome':
            if (channel.type === ChannelType.GuildText) {
              const { LOGS } = GuildSettings.get(interaction.guild as Guild)

              if (channel.id !== LOGS.WELCOME_CHANNEL_ID) {
                GuildSettings.update(interaction.guild as Guild, { LOGS: { WELCOME_CHANNEL_ID: channel.id } })

                await interaction.editReply({
                  content: `✅ Salon de bienvenue défini sur ${Text.channel(channel.id)} pour ce serveur.`
                })
              } else
                await interaction.editReply({
                  content: `Salon de bienvenue déjà défini ici.`
                })
            } else {
              await interaction.editReply({
                content: 'Erreur : Veuillez sélectionner un canal textuel valide.'
              })
            }
            break
        }

        break
      case 'channels':
        if (channel.type === ChannelType.GuildText) {
          const { AUTOMOD } = GuildSettings.get(interaction.guild as Guild)

          if (!Boolean(AUTOMOD.IGNORED_CHANNEL_IDS.includes(channel.id))) {
            GuildSettings.update(interaction.guild as Guild, {
              AUTOMOD: { IGNORED_CHANNEL_IDS: [...AUTOMOD.IGNORED_CHANNEL_IDS, channel.id] }
            })

            await interaction.editReply({
              content: `✅ Salon de logs ignoré sur ${Text.channel(channel.id)} pour ce serveur.`
            })
          }
        }

        break

      case 'roles':
        const roles = Boolean(interaction.options.get('roles')?.value)
          ? [interaction.options.getRole('roles', true).id]
          : interaction.options.data.filter((opt) => opt.name === 'roles').map((opt) => opt.role?.id)

        GuildSettings.update(interaction.guild as Guild, {
          AUTOMOD: {
            IGNORED_ROLE_IDS: [...GuildSettings.get(interaction.guild as Guild).AUTOMOD.IGNORED_ROLE_IDS, ...roles]
          }
        })

        await interaction.editReply({
          content: `✅ Rôles ignoré sur ${roles
            .map((id) => Text.mention.role(id as string))
            .join(', ')} pour ce serveur.`
        })

        break
    }
  }
})
