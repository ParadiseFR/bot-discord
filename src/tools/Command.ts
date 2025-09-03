import { Client, Collection, REST, Routes } from 'discord.js'

import type { Command, CommandCategory, CommandCategoryHandler, CommandHanler, CommandMeta } from '../types'
import { BOT_INSTANCE } from '../app'

export const command: CommandHanler = (props) => {
  return { ...props, meta: props.meta, execute: props.execute }
}

export const category: CommandCategoryHandler = (props) => {
  return { ...props, name: props.name, commands: props.commands }
}

export const registerCommands = async (client: Client<true>, commands: CommandCategory[]): Promise<void> => {
  const rest = new REST({ version: '10' }).setToken(String(process.env.TOKEN))

  const categoryCommands = commands.map((category): Command[] => category.commands).flat()
  const endpoint =
    process.env.NODE_ENV === 'production'
      ? Routes.applicationCommands(String(client.user.id))
      : Routes.applicationGuildCommands(String(client.user.id), String(process.env.TEST_GUILD_ID))

  categoryCommands.map(
    (command): Collection<string, Command> => BOT_INSTANCE.slashCommands.set(command.meta.name, command)
  )

  await rest.put(endpoint, {
    body: categoryCommands.map((command): CommandMeta => command.meta)
  })
}
