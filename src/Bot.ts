import type { Client, ClientUser, Snowflake, TextChannel } from 'discord.js'
import { ActivityType, Collection, EmbedBuilder, Events, REST, Routes } from 'discord.js'

import type { Command } from './types'
import { Config, Logger, MusicQueue } from './tools'
import commands from './commands'

export class RypiBot {
  public readonly prefix = Config.PREFIX
  public slashCommands = new Collection<string, Command>()
  public cooldowns = new Collection<string, Collection<Snowflake, number>>()
  public queues = new Collection<Snowflake, MusicQueue>()

  public constructor(public readonly client: Client) {
    this.client.login(process.env.TOKEN).catch((error): void => Logger.error(error))

    this.client.on(Events.ClientReady, (): void => {
      Logger.init(this.client.user as ClientUser)

      this.client.user?.setActivity({ name: 'Rypî', type: ActivityType.Watching })
      this.registerSlashCommands().catch((error): void => Logger.error(error))
    })

    this.client.on(Events.Warn, (warning): void => Logger.warn(warning))
    this.client.on(Events.Error, (error): void => Logger.error(error))

    this.onInteractionCreate().catch((error): void => Logger.error(error))

    this.client.on(Events.GuildMemberUpdate, async (oldMember, newMember): Promise<void> => {
      for (const roleId of Config.LISTEN_ROLE_IDS) {
        const hadRole = oldMember.roles.cache.has(roleId)
        const hasRole = newMember.roles.cache.has(roleId)

        const role = newMember.guild.roles.cache.get(roleId)
        if (!role) continue

        const channel = newMember.guild.channels.cache.get(Config.ADMIN_ANNOUNCE_CHANNEL_ID) as TextChannel
        if (!channel) return

        const roleIcon = role.iconURL?.() ?? 'https://message.style/cdn/images/76818f017e8ed0e17d882ec7f0bf16b0f787dc2736c9bd9d3063c5780f79d3c2.png'

        if (!hadRole && hasRole) {
          const embed = new EmbedBuilder()
            .setTitle('Pôle ')
            .setDescription(`**${newMember.user.username}** rejoint l'équipe en tant que **${role.name}** !`)
            .setImage(roleIcon)
            .setColor('Green')
          channel.send({ embeds: [embed] }).catch(Logger.error)
        } else if (hadRole && !hasRole) {
          const embed = new EmbedBuilder()
            .setTitle('Pôle ')
            .setDescription(`**${newMember.user.username}** est démis de ses fonctions de **${role.name}** !`)
            .setImage(roleIcon)
            .setColor('Red')
          channel.send({ embeds: [embed] }).catch(Logger.error)
        }
      }
    })
  }

  private async registerSlashCommands(): Promise<void> {
    const rest = new REST({ version: '10' }).setToken(String(process.env.TOKEN))

    const categoryCommands = commands.map((category) => category.commands).flat()
    categoryCommands.map((command) => this.slashCommands.set(command.meta.name, command))

    await rest.put(Routes.applicationCommands(String(this.client.user?.id)), {
      body: categoryCommands.map((command) => command.meta)
    })
  }

  private async onInteractionCreate(): Promise<void> {
    this.client.on(Events.InteractionCreate, async (interaction): Promise<any> => {
      if (!interaction.isChatInputCommand()) return

      const command = this.slashCommands.get(interaction.commandName)

      if (command == null) return

      if (!this.cooldowns.has(interaction.commandName)) {
        this.cooldowns.set(interaction.commandName, new Collection())
      }

      const now = Date.now()
      const timestamps = this.cooldowns.get(interaction.commandName)
      const cooldownAmount = (command.cooldown ?? 1) * 1000

      if (Boolean(timestamps?.has(interaction.user.id))) {
        const expirationTime = (timestamps?.get(interaction.user.id) as number) + cooldownAmount

        if (now < expirationTime) {
          const timeLeft = (expirationTime - now) / 1000
          return await interaction.reply({
            content: `cooldown bitch, time: ${timeLeft.toFixed(1)}, name: ${interaction.commandName}`,
            ephemeral: true
          })
        }
      }

      timestamps?.set(interaction.user.id, now)
      setTimeout(() => timestamps?.delete(interaction.user.id), cooldownAmount)

      command.execute({ interaction })

      /* try {
        const permissionsCheck: PermissionResult = await checkPermissions(command, interaction)

        if (permissionsCheck.result) {
          command.execute(interaction as ChatInputCommandInteraction)
        } else {
          throw new MissingPermissionsException(permissionsCheck.missing)
        }
      } catch (error: any) {
        console.error(error)

        if (error.message.includes('permissions')) {
          interaction.reply({ content: error.toString(), ephemeral: true }).catch(console.error)
        } else {
          interaction.reply({ content: i18n.__('common.errorCommand'), ephemeral: true }).catch(console.error)
        }
      } */
    })
  }
}
