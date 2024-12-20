import type { FileInfo, ReadDirTreeOptions, Tree } from './types'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { readDirPromisefy, statPromisefy, toPosixPath } from './utils'

export async function readDirTreeRecursive<
  T extends Record<string, any>,
  ChildKey extends string | symbol = 'children',
>(
  dir: string,
  options: Required<ReadDirTreeOptions<T, ChildKey>>,
  parentNode: Tree<T, ChildKey> | null = null,
  parentFileInfo: FileInfo | null = null,
): Promise<Tree<T, ChildKey> | null> {
  if (!fs.existsSync(dir)) {
    return null
  }

  const [statError, stats] = await statPromisefy(dir)
  if (statError) {
    return null
  }

  const type = stats.isFile() ? 'file' : stats.isDirectory() ? 'directory' : 'other'

  if (!['file', 'directory'].includes(type))
    return null

  const fullpath = toPosixPath(path.resolve(dir))
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
    stats,
    files,
    parent: parentFileInfo,
  }

  const shouldSkip = await options.shouldSkip(fileInfo, parentNode)
  if (shouldSkip)
    return null

  const nodeData = await options.transform(fileInfo, parentNode)

  if (type === 'file')
    return nodeData as Tree<T, ChildKey>

  // TODO 当子文件过多时，需要控制最大并发数
  const childrenPromises = files.map((file) => {
    const childDir = toPosixPath(path.join(fullpath, file))
    return readDirTreeRecursive(childDir, options, nodeData as Tree<T, ChildKey>, fileInfo)
  })

  let children = await Promise.all(childrenPromises)

  children = children.filter(child => child !== null)

  return {
    ...nodeData,
    [options.childrenKey]: children,
  } as any as Tree<T, ChildKey>
}
