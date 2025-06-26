import type {
  SlashCommandBuilder,
  SlashCommandSubcommandsOnlyBuilder,
  Awaitable,
  Client,
  ChatInputCommandInteraction,
  PermissionFlagsBits
} from 'discord.js'

type CommandMeta =
  | SlashCommandBuilder
  | Omit<SlashCommandBuilder, 'addSubcommand' | 'addSubcommandGroup'>
  | SlashCommandSubcommandsOnlyBuilder

type LoggerFunction = (...args: unknown[]) => void

interface CommandProps {
  interaction: ChatInputCommandInteraction
  client?: Client
  log?: LoggerFunction
}

interface CommandCategoryExtra {
  description: string
  emoji: string
}

interface CommandCategory extends Partial<CommandCategoryExtra> {
  name: string
  commands: Command[]
}

interface Command {
  meta: CommandMeta
  cooldown?: number
  permissions?: Array<keyof typeof PermissionFlagsBits>
  execute: (props: CommandProps) => Awaitable<unknown>
}

type CommandHanler = (props: Command) => Command
type CommandCategoryHandler = (props: CommandCategory) => CommandCategory

export { Command, CommandCategory, CommandHanler, CommandCategoryHandler }
