import * as fs from 'fs'
import { readFile } from '../core/read-file'
import { defineFileInfo } from '../core/read-dir-tree/utils'

export function readContent<T>(stats: fs.Stats, postStats: T, dir: string, promises: Promise<string>[]) {
  if (stats.isFile()) {
    const ps = readFile(dir).then((content) => {
      defineFileInfo(postStats, { content: content })
      return content
    }).catch((err) => {
      defineFileInfo(postStats, { content: '' })
      return ''
    })
    promises.push(ps)
  } else {
    defineFileInfo(postStats, { content: '' })
  }
}
