import * as fs from 'fs'
import { readFile } from '../core/read-file'
import { FileInfo } from '../core/read-dir-tree/types'
import { defineFileInfo } from '../core/read-dir-tree/utils'

export function useContent<T extends FileInfo>(stats: fs.Stats, postStats: T, dir: string, promises: Promise<string>[]) {
  if (stats.isFile()) {
    const ps = readFile(dir).then((content) => {
      defineFileInfo(postStats, { __content__: content })
      return content
    }).catch((err) => {
      defineFileInfo(postStats, { __content__: '' })
      return ''
    })
    promises.push(ps)
  } else {
    defineFileInfo(postStats, { __content__: '' })
  }
}
