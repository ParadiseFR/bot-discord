import {
  Client,
  Guild,
  Snowflake,
  VoiceBasedChannel,
  ChannelType,
  Collection,
  Events,
  PermissionFlagsBits,
  GuildMember,
  PartialGuildMember
} from 'discord.js'
import { GlobalFonts } from '@napi-rs/canvas'
import { google } from 'googleapis'

import type { Command } from './types'
import { ASSETS_DIR, Config, Logger, MusicQueue, ROOT_DIR, registerEvents } from './tools'
import { GuildSettings } from './tools/Guild'
import events from './events'

export class Bot {
  public readonly prefix = Config.PREFIX
  public slashCommands = new Collection<string, Command>()
  public cooldowns = new Collection<string, Collection<Snowflake, number>>()
  public queues = new Collection<Snowflake, MusicQueue>()

  public drive: ReturnType<typeof google.drive>

  public constructor(public readonly client: Client<true>) {
    Logger.custom('env', `Running on ${process.env.NODE_ENV?.toUpperCase()} mode`)

    GlobalFonts.registerFromPath(ASSETS_DIR('Alro.ttf'))

    const auth = new google.auth.GoogleAuth({
      keyFile: ROOT_DIR('credentials.json'),
      scopes: ['https://www.googleapis.com/auth/drive']
    })

    this.drive = google.drive({ version: 'v3', auth })

    Logger.log('Bot initiated successfully')

    this.client
      .login(process.env.DISCORD_TOKEN)
      .then((): void => Logger.log('Connection established successfully'))
      .catch((error): void => {
        Logger.error(error)
        return process.exit(1)
      })
      // TODO: execute finally only if no error has been catched
      .finally((): void => {
        this.client.on(Events.Warn, (warning): void => Logger.warn(warning))
        this.client.on(Events.Error, (error): void => Logger.error(error as any))

        registerEvents(client, events)
      })
  }

  public async findOrCreateMemberCounterChannel(guild: Guild, count: number): Promise<VoiceBasedChannel | undefined> {
    try {
      const { MEMBER_COUNTER_CHANNEL_ID: channelId } = GuildSettings.get(guild)

      if (channelId.length > 0) {
        const existingChannel = guild.channels.cache.get(channelId)
        if (existingChannel != null && existingChannel.type === ChannelType.GuildVoice) {
          return existingChannel as VoiceBasedChannel
        }
      }

      const channelName = `Members: ${count}`
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

      GuildSettings.update(guild, { MEMBER_COUNTER_CHANNEL_ID: channel.id })

      return channel
    } catch (error) {
      Logger.error('Error finding or creating member counter channel:', error)
    }
  }

  public async membersCount(guild: Guild): Promise<number> {
    const members = await guild.members.fetch()
    return members.filter((member): boolean => !member.user.bot).size
  }

  public async refinePartialMember(member: GuildMember | PartialGuildMember): Promise<GuildMember> {
    if (member.partial) {
      Logger.log(`Member ${member.user.tag} is partial, not catched yet, fetching full data...`)

      try {
        member = await member.fetch()
      } catch (error) {
        Logger.error(`Failed to fetch full member data for ${member.user.tag}:`, error)
      }
    }

    return member as GuildMember
  }

  public async updateMemberCount(guild: Guild): Promise<boolean> {
    try {
      const count = await this.membersCount(guild)
      const voiceChannel = (await this.findOrCreateMemberCounterChannel(guild, count)) as VoiceBasedChannel
      const newChannelName = `Members: ${count}`
      const match = voiceChannel.name.match(/(\d+)/)

      if (match != null) {
        const updatedName = voiceChannel.name.replace(/\d+/, count.toString())
        if (updatedName !== voiceChannel.name) {
          await voiceChannel.setName(updatedName)
          Logger.guildEvent(guild, `Updated members count channel name to: ${updatedName}`)
          return true
        }
      } else {
        await voiceChannel.setName(newChannelName)
        Logger.guildEvent(guild, `Updated members count channel name to: ${newChannelName}`)
        return true
      }

      return false
    } catch (error) {
      Logger.error('Error updating member count:', error)
      return false
    }
  }
}
