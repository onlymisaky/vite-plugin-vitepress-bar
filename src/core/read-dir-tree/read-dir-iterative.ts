import type { FileInfo, Options, QueueItem, Tree } from './types'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { readDirPromisefy, statPromisefy } from './utils'

export async function readDirTreeIterative<
  T extends Record<string, any>,
  ChildKey extends string | symbol = 'children',
>(dir: string, options: Required<Options<T, ChildKey>>): Promise<Tree<T, ChildKey> | null> {
  if (!fs.existsSync(dir)) {
    return null
  }

  // 初始化队列
  const queue: QueueItem<T, ChildKey>[] = [{ path: dir, parentNode: null, parentFileInfo: null }]
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

    let files: string[] = []
    if (type === 'directory') {
      const [readError, _files] = await readDirPromisefy(fullpath)
      if (readError)
        return null
      files = _files
    }

    const fileInfo: FileInfo = {
      path: fullpath,
      name: filename,
      stat,
      files,
      parent: current.parentFileInfo,
    }

    const shouldSkip = await options.shouldSkip(fileInfo, current.parentNode)
    if (shouldSkip) {
      continue
    }

    const nodeData = await options.transform(fileInfo, current.parentNode)

    if (nodeData === null) {
      continue
    }

    const node = type === 'file'
      ? nodeData as Tree<T, ChildKey>
      : {
          ...nodeData,
          [options.childrenKey]: [],
        } as Tree<T, ChildKey>

    // 如果是根节点
    if (!current.parentNode) {
      root = node
    }
    else {
      (current.parentNode[options.childrenKey] as Tree<T, ChildKey>[]).push(node)
    }

    // 如果是目录，将其子项添加到队列
    if (type === 'directory') {
      if (files.length > 0) {
        queue.push(...files.map(file => ({
          path: path.join(fullpath, file),
          parentNode: node,
          parentFileInfo: fileInfo,
        })))
      }
    }
  }

  return root
}
