import { Canvas as RCanvas, Image, SKRSContext2D, createCanvas, loadImage } from '@napi-rs/canvas'
import { GuildMember } from 'discord.js'

import { Logger } from './Logger'
import { ASSETS_DIR } from './Config'

const create = async (
  member: GuildMember,
  callback: (ctx: SKRSContext2D) => void,
  grayscale: boolean = false
): Promise<Buffer> => {
  const canvas = createCanvas(700, 250)
  const context = canvas.getContext('2d')
  const backgroundPath = ASSETS_DIR('JOINLEAVE.png')

  let background: Image | null

  try {
    background = await loadImage(backgroundPath)
  } catch (error) {
    Logger.error(`Failed to load background image: ${backgroundPath}`, error)
    context.fillStyle = '#2f3136'
    context.fillRect(0, 0, canvas.width, canvas.height)
    background = null
  }

  if (background != null && grayscale) {
    context.drawImage(background, 0, 0, canvas.width, canvas.height)
    grayScale(context, canvas)
  } else if (background != null) {
    context.drawImage(background, 0, 0, canvas.width, canvas.height)
  }

  // save context state for shadow/border
  context.save()

  // avatar shadow
  context.shadowColor = '#000000'
  context.shadowBlur = 18
  context.shadowOffsetY = 5

  // draw border (before clipping to make it visible somehow)
  context.beginPath()
  context.arc(125, 125, 100, 0, Math.PI * 2, true)
  context.lineWidth = 8
  context.strokeStyle = '#ffffff'
  context.stroke()
  context.closePath()

  // clip for avatar
  context.beginPath()
  context.arc(125, 125, 100, 0, Math.PI * 2, true)
  context.clip()

  // load & draw user avatar - restore to remove clip/shadow
  const avatarUrl = member.user.displayAvatarURL({ extension: 'png', size: 128 })
  const avatar = await loadImage(avatarUrl)
  context.drawImage(avatar, 25, 25, 200, 200)
  context.restore()

  // text styles
  context.font = '56px Alro'
  context.fillStyle = '#ffffff'

  callback(context)

  return await canvas.encode('png')
}

const grayScale = (ctx: SKRSContext2D, canvas: RCanvas): void => {
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const data = img.data

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    const gray = Math.round((r + g + b) / 3)
    data[i] = gray
    data[i + 1] = gray
    data[i + 2] = gray
  }

  ctx.putImageData(img, 0, 0)
}

export const Canvas = { create }
