import { createReadStream } from 'node:fs'

import { Logger } from './Logger'
import { BOT_INSTANCE } from '../app'

export class HttpUtils {
  public static async uploadFile(path: string, description: string): Promise<string | undefined> {
    try {
      const fileName = path.split('/').pop() as string

      const response = await BOT_INSTANCE.drive.files.create({
        requestBody: {
          name: fileName,
          description,
          parents: [process.env.GOOGLE_DRIVE_FOLDER_ID as string]
        },
        media: {
          mimeType: 'text/plain',
          body: createReadStream(path)
        },
        fields: 'id'
      })

      const fileId = response.data.id
      const fileLink = `https://drive.google.com/file/d/${fileId}/view`

      Logger.log(`File ${fileName} uploaded successfully. Link: ${fileLink}`)

      return fileLink
    } catch (error) {
      Logger.error(`Failed to upload file to Google Drive: ${path}`, error)
      throw error
    }
  }
}
