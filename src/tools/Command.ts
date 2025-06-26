import type { CommandCategoryHandler, CommandHanler } from '../types/Command'

export const command: CommandHanler = (props) => {
  return { ...props, meta: props.meta, execute: props.execute }
}

export const category: CommandCategoryHandler = (props) => {
  return { ...props, name: props.name, commands: props.commands }
}
