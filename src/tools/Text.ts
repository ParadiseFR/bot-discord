const bold = (...messages: string[]): string => `**${messages.join(' ')}**`
const italic = (...messages: string[]): string => `_${messages.join(' ')}_`
const underline = (...messages: string[]): string => `__${messages.join(' ')}__`
const link = (url: string, ...messages: string[]): string => `[${messages.join(' ')}](${url})`
const code = (lang: string, multiline: boolean = false, ...messages: string[]): string => {
  const content = multiline ? messages.join('\n') : messages.join(' ')
  return `\`\`\`${lang}\n${content}\n\`\`\``
}

const channel = (id: string): string => `<#${id}>`
const mention = (id: string): string => `<@${id}>`

export const Text = { bold, italic, underline, code, link, channel, mention }
