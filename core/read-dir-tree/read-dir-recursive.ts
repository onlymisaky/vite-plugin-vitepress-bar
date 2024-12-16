import * as fs from 'node:fs'
import * as path from 'node:path'
import { FileInfo, Options, Tree } from './types'
import { readDirPromisefy, statPromisefy } from './utils'

export async function readDirTreeRecursive<
  T extends Record<string, any>,
  ChildKey extends string | symbol = 'children'
>(
  dir: string,
  options: Required<Options<T, ChildKey>>,
  parentNode: Tree<T, ChildKey> | null = null,
  parentFileInfo: FileInfo | null = null
): Promise<Tree<T, ChildKey> | null> {
  if (!fs.existsSync(dir)) {
    return null
  }

  const [statError, stat] = await statPromisefy(dir)
  if (statError) {
    return null
  }

  const type = stat.isFile() ? 'file' : stat.isDirectory() ? 'directory' : 'other'

  if (!['file', 'directory'].includes(type)) {
    return null
  }

  const fullpath = path.resolve(dir)
  const filename = path.basename(fullpath)
  const fileInfo: FileInfo = { path: fullpath, name: filename, stat, parent: parentFileInfo }

  const shouldSkip = await options.shouldSkip(fileInfo, parentNode)
  if (shouldSkip) {
    return null
  }

  const nodeData = await options.transform(fileInfo, parentNode)

  if (type === 'file') {
    return nodeData as Tree<T, ChildKey>
  }

  const [readError, files] = await readDirPromisefy(fullpath)

  if (readError) {
    return null
  }

  // TODO 当子文件过多时，需要控制最大并发数
  const childrenPromises = files.map((file) => {
    const childDir = path.join(fullpath, file)
    return readDirTreeRecursive(childDir, options, nodeData as Tree<T, ChildKey>, fileInfo)
  })

  let children = await Promise.all(childrenPromises)

  children = children.filter((child) => child !== null)

  return {
    ...nodeData,
    [options.childrenKey]: children
  } as any as Tree<T, ChildKey>
}
