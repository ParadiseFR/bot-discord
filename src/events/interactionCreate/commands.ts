import { Collection, Events, Guild, MessageFlags } from 'discord.js'

import { Logger, MissingPermissionsExceptionError, checkPermissions, event } from '../../tools'
import { BOT_INSTANCE } from '../../app'

export default event(Events.InteractionCreate, async (_, interaction) => {
  if (interaction.isChatInputCommand()) {
    const command = BOT_INSTANCE.slashCommands.get(interaction.commandName)

    if (command != null) {
      if (!BOT_INSTANCE.cooldowns.has(interaction.commandName)) {
        BOT_INSTANCE.cooldowns.set(interaction.commandName, new Collection())
      }

      const now = Date.now()
      const timestamps = BOT_INSTANCE.cooldowns.get(interaction.commandName)
      const cooldownAmount = (command.cooldown ?? 1) * 1000

      if (Boolean(timestamps?.has(interaction.user.id))) {
        const expirationTime = (timestamps?.get(interaction.user.id) as number) + cooldownAmount

        if (now < expirationTime) {
          const timeLeft = (expirationTime - now) / 1000
          // TODO: change content message
          await interaction.reply({
            content: `cooldown bitch, time: ${timeLeft.toFixed(1)}, name: ${interaction.commandName}`,
            flags: MessageFlags.Ephemeral
          })

          return interaction.guild as Guild
        }
      }

      timestamps?.set(interaction.user.id, now)
      setTimeout(() => timestamps?.delete(interaction.user.id), cooldownAmount)

      try {
        const permissionsCheck = await checkPermissions(command, interaction)

        if (permissionsCheck.result) {
          command.execute({ interaction })

          Logger.guildCommand(
            interaction.guild as Guild,
            `Command ${interaction.commandName} executed by ${interaction.user.tag}`
          )
        } else {
          throw new MissingPermissionsExceptionError(permissionsCheck.missing)
        }
      } catch (error: any) {
        Logger.error(error)

        if (Boolean(error.message.includes('permissions'))) {
          interaction.reply({ content: error.toString(), flags: MessageFlags.Ephemeral }).catch(Logger.error)
        } else {
          interaction
            .reply({
              content: "Une erreur s'est produite lors de l'exécution de cette commande.",
              flags: MessageFlags.Ephemeral
            })
            .catch(Logger.error)
        }
      }
    }
  }
})
