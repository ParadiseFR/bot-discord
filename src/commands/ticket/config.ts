import { Guild, MessageFlags, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js'

import { GuildSettings, command } from '../../tools'

const meta = new SlashCommandBuilder()
  .setName('ticket_settings')
  .setDescription('Configurer le système de tickets')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)

meta
  .addSubcommandGroup((group) =>
    group
      .setName('categories')
      .setDescription('Configurer les catégories des tickets')
      .addSubcommand((subcommand) =>
        subcommand
          .setName('add')
          .setDescription('Ajouter une catégorie de tickets')
          .addStringOption((option) => option.setName('name').setDescription('Nom de la catégorie').setRequired(true))
          .addRoleOption((option) =>
            option.setName('roles').setDescription('Rôles de la catégorie (sélection multiple)').setRequired(true)
          )
      )
      .addSubcommand((subcommand) =>
        subcommand
          .setName('remove')
          .setDescription('Supprimer une catégorie de tickets')
          .addStringOption((option) => option.setName('name').setDescription('Nom de la catégorie').setRequired(true))
      )
      .addSubcommand((subcommand) => subcommand.setName('list').setDescription('Lister les catégories de tickets'))
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName('limit')
      .setDescription('Définir la limite de tickets par utilisateur')
      .addNumberOption((option) =>
        option.setName('limit').setDescription('Limite de tickets par utilisateur').setRequired(true)
      )
  )

export default command({
  meta,
  cooldown: 2,
  execute: async ({ interaction }) => {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral })

    const subcommandGroup = interaction.options.getSubcommandGroup(false)
    const subcommand = interaction.options.getSubcommand(true)

    const { TICKET } = GuildSettings.get(interaction.guild as Guild)

    if (subcommandGroup === 'categories') {
      switch (subcommand) {
        case 'add':
          const category = interaction.options.getString('name', true)

          if (Boolean(TICKET.CATEGORIES.find((c) => c.name === category))) {
            return await interaction.editReply({
              content: 'Erreur : Cette catégorie de tickets existe déjà.'
            })
          }

          const roles = Boolean(interaction.options.get('roles')?.value)
            ? [interaction.options.getRole('roles', true).id]
            : interaction.options.data.filter((opt) => opt.name === 'roles').map((opt) => opt.role?.id)

          GuildSettings.update(interaction.guild as Guild, {
            TICKET: {
              CATEGORIES: [...TICKET.CATEGORIES, { name: category, roles }]
            }
          })

          await interaction.editReply({
            content: `Catégorie "${category}" ajoutée avec ${roles.length} rôle(s).`
          })
          break

        case 'remove':
          const categoryToRemove = interaction.options.getString('name', true)

          if (Boolean(TICKET.CATEGORIES.find((c) => c.name === categoryToRemove))) {
            GuildSettings.update(interaction.guild as Guild, {
              TICKET: {
                CATEGORIES: TICKET.CATEGORIES.filter((c) => c.name !== categoryToRemove)
              }
            })

            await interaction.editReply({
              content: `Catégorie "${categoryToRemove}" supprimée.`
            })
          } else {
            await interaction.editReply({
              content: "Erreur : Cette catégorie de tickets n'existe pas."
            })
          }
          break
        case 'list':
          await interaction.editReply({
            content: `Catégories de tickets : ${TICKET.CATEGORIES.map((c) => `\`${c.name}\``).join(', ')}`
          })
          break
      }
    } else if (subcommand === 'limit') {
      const limit = interaction.options.getNumber('limit', true)

      GuildSettings.update(interaction.guild as Guild, { TICKET: { LIMIT: limit } })

      await interaction.editReply(`✅ Limite de tickets par utilisateur définie sur ${limit}.`)
    }
  }
})
