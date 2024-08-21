import * as fs from 'fs'
import { NormalizeOptions, SortItem } from '../types'
import { FileInfo } from '../core/read-dir-tree/types'

const normalDate = new Date(2000, 0, 1)
const normalStats: Partial<fs.Stats> = {
  mtime: normalDate,
  ctime: normalDate,
  size: 0
}

export function sort<T extends FileInfo>(children: T[], options: NormalizeOptions) {
  return children.sort((a, b) => {
    try {
      const aStats = { ...normalStats, ...a.__stats__ } as FileInfo
      const bStats = { ...normalStats, ...b.__stats__ } as FileInfo
      const _a: SortItem = {
        name: a.text as string,
        create: aStats.ctime.getTime() + '',
        modify: aStats.mtime.getTime() + '',
        size: aStats.size + '',
        content: aStats.__content__ || '',
      }
      const _b: SortItem = {
        name: b.text as string,
        create: bStats.ctime.getTime() + '',
        modify: bStats.mtime.getTime() + '',
        size: bStats.size + '',
        content: bStats.__content__ || '',
      }
      return options.sort(_a, _b)
    } catch (error) {
      return 0
    }
  })
}
