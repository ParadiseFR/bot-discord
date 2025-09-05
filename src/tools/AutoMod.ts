import { EmbedBuilder, type Message, type OmitPartialGroupDMChannel, Guild, TextChannel } from 'discord.js'

import { GuildSettings } from './Guild'
import { Text } from './Text'
import { Logger } from './Logger'

export class AutoMod {
  private static readonly _autoModDeletedMessageIds = new Set<string>()

  public static async delete(message: OmitPartialGroupDMChannel<Message<boolean>>, reason: string): Promise<void> {
    this._autoModDeletedMessageIds.add(message.id)

    await this._sendLogs(message, reason)
    await message.delete()

    setTimeout(() => {
      this._autoModDeletedMessageIds.delete(message.id)
    }, 30000)
  }

  public static isDeleted(messageId: string): boolean {
    return this._autoModDeletedMessageIds.has(messageId)
  }

  private static async _sendLogs(message: OmitPartialGroupDMChannel<Message<boolean>>, reason: string): Promise<void> {
    const guild = message.guild as Guild
    const embed = new EmbedBuilder()
      .setColor('#e17055')
      .setAuthor({
        name: `${reason} - ${message.author.displayName} (@${message.author.tag})`,
        iconURL: message.author.avatarURL() as string
      })
      .setDescription(
        `${Text.mention.user(message.author.id)} a commis une infraction dans le salon ${Text.channel(
          message.channelId
        )}`
      )
      .setFooter({ text: guild.name, iconURL: guild.iconURL() as string })
      .setTimestamp()

    try {
      const { LOGS } = GuildSettings.get(guild)
      const channel = guild.channels.cache.get(LOGS.LOG_CHANNEL_ID)

      if (channel != null && channel instanceof TextChannel) {
        await channel.send({ embeds: [embed] })
      }
    } catch (error) {
      Logger.error('Error sending channel update log message:', error)
    }
  }
}
