import * as fs from 'fs'
import { NormalizeOptions, SortItem } from '../types'
import { FileInfo, WithFileInfo } from '../core/read-dir-tree/types'

const normalDate = new Date(2000, 0, 1)
const normalStats: Partial<fs.Stats> = {
  ctime: normalDate,
  mtime: normalDate,
  size: 0,
}
const normalFileInfo: Partial<FileInfo> = {
  children: [],
  parents: [],
  content: '',
}

export function sort<T extends WithFileInfo>(children: T[], options: NormalizeOptions) {
  return children.sort((a, b) => {
    try {
      Object.assign(a.__fileInfo__.stats, normalStats)
      Object.assign(b.__fileInfo__.stats, normalStats)
      const itemA: FileInfo = { ...a.__fileInfo__, ...normalFileInfo }
      const itemB: FileInfo = { ...b.__fileInfo__, ...normalFileInfo }
      const sortA: SortItem = {
        name: itemA.filename,
        create: itemA.stats.ctime.getTime() + '',
        modify: itemA.stats.mtime.getTime() + '',
        size: itemA.stats.size + '',
        content: itemA.content || '',
      }
      const sortB: SortItem = {
        name: itemB.filename,
        create: itemB.stats.ctime.getTime() + '',
        modify: itemB.stats.mtime.getTime() + '',
        size: itemB.stats.size + '',
        content: itemB.content || '',
      }
      return options.sort(sortA, sortB)
    } catch (error) {
      return 0
    }
  })
}
