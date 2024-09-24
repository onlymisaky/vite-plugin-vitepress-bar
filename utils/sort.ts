import { BarItem, NormalizePluginOptions, SortItem } from '../types'

const normalTime = new Date(2000, 0, 1).getTime() + ''

export function createSortInfo(item: BarItem): SortItem {
  const { fileInfo, content = '' } = item
  const { stat, fullpath } = fileInfo
  const { size, mtime, ctime } = stat
  const create = ctime ? ctime.getTime() + '' : normalTime
  const modify = mtime ? mtime.getTime() + '' : normalTime

  return { fullpath, create, modify, content, size: size ? size + '' : '0' }
}

export function sort(children: BarItem[], options: NormalizePluginOptions) {
  return children.sort((a, b) => {
    try {
      const sortA = createSortInfo(a)
      const sortB = createSortInfo(b)
      return options.sort(sortA, sortB)
    } catch (error) {
      return 0
    }
  })
}
