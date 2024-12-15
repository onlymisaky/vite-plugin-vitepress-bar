import * as fs from 'node:fs'
import * as path from 'node:path'
import { Options, QueueItem, Tree } from './types'
import { readDirPromisefy, statPromisefy } from './utils'

export async function readDirTreeIterative<
  T extends Record<string, any>,
  ChildKey extends string | symbol = 'children'
>(dir: string, options: Required<Options<T, ChildKey>>): Promise<Tree<T, ChildKey> | null> {
  if (!fs.existsSync(dir)) {
    return null
  }

  // 初始化队列
  const queue: QueueItem<T, ChildKey>[] = [{ path: dir, parent: null }]
  let root: Tree<T, ChildKey> | null = null

  while (queue.length > 0) {
    const current = queue.shift()!
    const [statError, stat] = await statPromisefy(current.path)

    if (statError) {
      continue
    }

    const type = stat.isFile() ? 'file' : stat.isDirectory() ? 'directory' : 'other'
    if (!['file', 'directory'].includes(type)) {
      continue
    }

    const fullpath = path.resolve(current.path)
    const filename = path.basename(fullpath)

    const shouldSkip = await options.shouldSkip(fullpath, filename, stat)
    if (shouldSkip) {
      continue
    }

    const nodeData = await options.transform(fullpath, filename, stat)
    const node = {
      ...nodeData,
      [options.childrenKey]: []
    } as Tree<T, ChildKey>

    // 如果是根节点
    if (!current.parent) {
      root = node
    } else {
      (current.parent[options.childrenKey] as Tree<T, ChildKey>[]).push(node)
    }

    // 如果是目录，将其子项添加到队列
    if (type === 'directory') {
      const [readError, files] = await readDirPromisefy(fullpath)
      if (!readError && files.length > 0) {
        queue.push(...files.map(file => ({
          path: path.join(fullpath, file),
          parent: node
        })))
      }
    }
  }

  return root
}
