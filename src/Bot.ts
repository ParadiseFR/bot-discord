import type { Client, ClientUser, Guild, Snowflake, TextChannel, VoiceBasedChannel } from 'discord.js'
import {
  ActivityType,
  ChannelType,
  Collection,
  EmbedBuilder,
  Events,
  PermissionFlagsBits,
  REST,
  Routes
} from 'discord.js'

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
      this.updateAllGuildsMemberCount().catch((error): void => Logger.error(error))
    })

    this.client.on(Events.Warn, (warning): void => Logger.warn(warning))
    this.client.on(Events.Error, (error): void => Logger.error(error))

    this.onInteractionCreate().catch((error): void => Logger.error(error))

    this.client.on(Events.GuildMemberAdd, async (member): Promise<void> => {
      try {
        await this.updateMemberCount(member.guild)
      } catch (error) {
        Logger.error('Error updating member count:', error)
      }
    })

    // Member leave event
    this.client.on(Events.GuildMemberRemove, async (member): Promise<void> => {
      try {
        await this.updateMemberCount(member.guild)
      } catch (error) {
        Logger.error('Error updating member count:', error)
      }
    })

    this.client.on(Events.GuildMemberUpdate, async (oldMember, newMember): Promise<void> => {
      for (const roleId of Config.LISTEN_ROLE_IDS) {
        const hadRole = oldMember.roles.cache.has(roleId)
        const hasRole = newMember.roles.cache.has(roleId)

        const role = newMember.guild.roles.cache.get(roleId)
        if (role == null) continue

        const channel = newMember.guild.channels.cache.get(Config.ADMIN_ANNOUNCE_CHANNEL_ID) as TextChannel
        if (channel == null) return

        const roleIcon =
          role.iconURL?.() ??
          'https://message.style/cdn/images/76818f017e8ed0e17d882ec7f0bf16b0f787dc2736c9bd9d3063c5780f79d3c2.png'

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

  private async findOrCreateMemberCounterChannel(guild: Guild): Promise<VoiceBasedChannel | undefined> {
    try {
      const voiceChannels = guild.channels.cache.filter(
        (channel): boolean => channel.type === ChannelType.GuildVoice
      ) as Collection<Snowflake, VoiceBasedChannel>

      const pattern = new RegExp(`^${Config.MEMBER_COUNTER_PATTERN.replace(/{count}/g, '\\d+')}$`)
      const existingChannel = voiceChannels.find((channel): boolean => pattern.test(channel.name))

      if (existingChannel == null) {
        const count = await this.membersCount(guild)
        const channelName = Config.MEMBER_COUNTER_PATTERN.replace(/{count}/, count.toString())

        const channel = await guild.channels.create({
          name: channelName,
          type: ChannelType.GuildVoice,
          reason: 'Member counter channel',
          permissionOverwrites: [
            {
              id: guild.roles.everyone.id,
              deny: [PermissionFlagsBits.Connect]
            }
          ]
        })

        return channel
      } else return existingChannel
    } catch (error) {
      Logger.error('Error finding or creating member counter channel:', error)
    }
  }

  private async membersCount(guild: Guild): Promise<number> {
    const members = await guild.members.fetch()
    return members.filter((member): boolean => !member.user.bot).size
  }

  private async updateMemberCount(guild: Guild): Promise<void> {
    try {
      const count = await this.membersCount(guild)
      const voiceChannel = (await this.findOrCreateMemberCounterChannel(guild)) as VoiceBasedChannel
      const newChannelName = Config.MEMBER_COUNTER_PATTERN.replace(/{count}/, count.toString())

      if (voiceChannel.name !== newChannelName) {
        await voiceChannel.setName(newChannelName)
        Logger.debug(`Updated voice channel name to: ${newChannelName}`)
      }
    } catch (error) {
      Logger.error('Error updating member count:', error)
    }
  }

  // Method to update member count for all guilds the bot is in
  private async updateAllGuildsMemberCount(): Promise<void> {
    for (const guild of this.client.guilds.cache.values()) {
      try {
        await this.updateMemberCount(guild)
      } catch (error) {
        Logger.error(`Error updating member count for guild ${guild.name}:`, error)
      }
    }
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
        Logger.error(error)

        if (error.message.includes('permissions')) {
          interaction.reply({ content: error.toString(), ephemeral: true }).catch(Logger.error)
        } else {
          interaction.reply({ content: i18n.__('common.errorCommand'), ephemeral: true }).catch(Logger.error)
        }
      } */
    })
  }
}
