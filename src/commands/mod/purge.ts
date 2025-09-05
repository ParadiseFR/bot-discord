import { SlashCommandBuilder, PermissionFlagsBits, TextChannel, ThreadChannel } from 'discord.js'

import { Logger, command } from '../../tools'

const meta = new SlashCommandBuilder()
  .setName('purge')
  .setDescription('Supprime en quantité les messages dans le salon actuel')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)

meta.addNumberOption((option) =>
  option
    .setName('amount')
    .setDescription('Nombre de messages à supprimer')
    .setMinValue(1)
    .setMaxValue(100)
    .setRequired(true)
)

export default command({
  meta,
  cooldown: 3,
  execute: async ({ interaction }) => {
    await interaction.deferReply({ ephemeral: true })

    const amount = interaction.options.getNumber('amount', true)

    try {
      const messages = await interaction.channel?.messages.fetch({ limit: amount })

      if (messages == null || messages.size === 0) {
        return await interaction.editReply('Aucun message à supprimer.')
      }

      //  14=< days (Discord API restriction)
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
      Logger.error('Error in clear command:', error)
      await interaction.editReply("Une erreur s'est produite lors de la suppression des messages.")
    }
  }
})
