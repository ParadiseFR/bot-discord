import { ChatInputCommandInteraction } from 'discord.js'
import i18next from 'i18next'

import { GuildSettings } from './Guild'

export const getLocale = (interaction: ChatInputCommandInteraction): string => {
  // First, try guild locale from DB
  if (interaction.guild != null) {
    const guildSettings = GuildSettings.get(interaction.guild)
    if (guildSettings.locale != null) {
      return guildSettings.locale
    }
  }

  // Fallback to interaction locale
  return interaction.locale ?? 'en-US'
}

export const t = (key: string, options?: any, lng?: string): any => {
  return i18next.t(key, { ...options, lng })
}

export const tWithLocale = (interaction: ChatInputCommandInteraction, key: string, options?: any): string => {
  const locale = getLocale(interaction)
  return t(key, options, locale)
}
