import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  TextChannel,
  ThreadChannel,
  type Message,
  type Collection,
  MessageFlags
} from 'discord.js'

import { Logger, command } from '../../tools'

const meta = new SlashCommandBuilder()
  .setName('purge')
  .setDescription('Supprime en quantité les messages dans le salon actuel')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)

meta
  .addNumberOption((option) =>
    option
      .setName('amount')
      .setDescription('Nombre de messages à supprimer')
      .setMinValue(1)
      .setMaxValue(100)
      .setRequired(true)
  )
  .addStringOption((option) =>
    option.setName('startid').setDescription('ID du message de départ (optionnel)').setRequired(false)
  )

export default command({
  meta,
  cooldown: 3,
  execute: async ({ interaction }) => {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral })

    const amount = interaction.options.getNumber('amount', true)
    const startId = interaction.options.getString('startid')

    try {
      let messages: Collection<string, Message> | undefined

      if (startId != null) {
        const startMessage = await interaction.channel?.messages.fetch(startId)

        if (startMessage == null) {
          return await interaction.editReply('Message de départ introuvable.')
        }

        messages = await interaction.channel?.messages.fetch({
          limit: amount - 1,
          before: startId
        })

        messages?.set(startId, startMessage)
      } else {
        messages = await interaction.channel?.messages.fetch({ limit: amount })
      }

      if (messages == null || messages.size === 0) {
        return await interaction.editReply('Aucun message à supprimer.')
      }

      // Filter messages younger than 14 days (Discord API restriction)
      const messagesToDelete = messages.filter(
        (msg): boolean => Date.now() - msg.createdTimestamp < 14 * 24 * 60 * 60 * 1000
      )

      if (messagesToDelete.size === 0) {
        return await interaction.editReply('Aucun message récent (moins de 14 jours) à supprimer.')
      }

      if (interaction.channel instanceof TextChannel || interaction.channel instanceof ThreadChannel) {
        const deletedMessages = await interaction.channel.bulkDelete(messagesToDelete, true)
        await interaction.editReply(`${deletedMessages.size} message(s) supprimé(s) avec succès.`)
      } else {
        await interaction.editReply("La suppression en masse n'est pas prise en charge dans ce type de salon.")
      }
    } catch (error) {
      Logger.error('Error in purge command:', error)
      await interaction.editReply("Une erreur s'est produite lors de la suppression des messages.")
    }
  }
})
