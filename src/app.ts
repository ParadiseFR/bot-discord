import { Client, GatewayIntentBits, Partials } from 'discord.js'

import { RypiBot } from './Bot'
import { Logger } from './tools'

export const BOT_INSTANCE = new RypiBot(
  new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildVoiceStates,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.GuildMessageReactions,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.DirectMessages
    ],
    partials: [Partials.GuildMember]
  })
)

Logger.setPrefix('init', { bg: '#3742fa', text: '#FFF', icon: '📥' })
