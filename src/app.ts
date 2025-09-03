import { Client, GatewayIntentBits, Partials } from 'discord.js'

import { RypiBot } from './Bot'

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
