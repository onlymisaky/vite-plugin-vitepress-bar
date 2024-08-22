import * as fs from 'fs'
import * as path from 'path'
import { DirTreeOptions, ErrorItem, FileInfo, ProcessError, WithFileInfo, DirTreeItem } from './types'

export function handleError(errors: ErrorItem[], error: Error, type: 'readdir' | 'stat', path: string, mode: ProcessError = 'ignore',) {
  switch (mode) {
    case 'ignore': break
    case 'throw': throw error
    case 'record': errors.push({ error, path, type }); break
    default: break
  }
}

export function defineFileInfo<T extends WithFileInfo>(o: T, fileInfo: Partial<FileInfo>): T {
  const __fileInfo__: Partial<FileInfo> = { ...o.__fileInfo__ }

  Object.keys(fileInfo).forEach((key) => {
    Object.defineProperty(__fileInfo__, key, {
      value: fileInfo[key],
      enumerable: true,
      configurable: true,
      writable: false,
    })
  })
  return Object.defineProperty(o, '__fileInfo__', {
    value: __fileInfo__,
    enumerable: true,
    configurable: true,
    writable: false,
  })
}

export function createDefaultOptions<
  ChildKey extends string,
  T extends DirTreeItem<ChildKey>
>(options?: DirTreeOptions<ChildKey, T>): Required<DirTreeOptions<ChildKey, T>> {

  const childKey = options?.childKey || 'children'

  function onStats(fullPath: string, filename: string, stats: fs.Stats, parents: T[]) {
    let postStats = {} as T
    if (options && typeof options.onStats === 'function') {
      postStats = options.onStats(fullPath, filename, stats, parents) || postStats
    }
    return defineFileInfo(postStats, {
      stats: stats,
      fullpath: fullPath,
      filename: filename,
      children: [],
      parents: parents.map((item) => item.__fileInfo__),
    })
  }

  function onReadDir(fullPath: string, filename: string, postStats: T, parents: T[], childFiles: string[]) {
    let result = Object.assign({}, postStats)
    if (options && typeof options.onReadDir === 'function') {
      result = options.onReadDir(fullPath, filename, postStats, parents, childFiles) || result
    }
    result = { ...result, [childKey]: [] }
    return defineFileInfo(result, {
      stats: postStats.__fileInfo__.stats,
      fullpath: fullPath,
      filename: filename,
      children: childFiles,
      parents: parents.map((item) => item.__fileInfo__),
    })
  }

  const defaultOptions: DirTreeOptions<ChildKey, T> = {
    isSkip: (fullPath: string, filename: string, stats: fs.Stats, parents: T[]) => false,
    processStatsError: 'ignore',
    processReadDirError: 'ignore',
    onStats,
    onReadDir,
    onChildren: (
      fullPath: string,
      filename: string,
      postStats: T,
      parents: T[],
      childFiles: string[],
      children: T[]
    ) => children,
    onComplete: (result: T, errors: ErrorItem[]) => { },
    childKey: 'children' as ChildKey
  }

  return (options ? { ...defaultOptions, ...options, onStats, onReadDir } : defaultOptions) as Required<DirTreeOptions<ChildKey, T>>
}

export function handleDone<
  ChildKey extends string,
  T extends DirTreeItem<ChildKey>
>(options: {
  onChildren: Required<DirTreeOptions<ChildKey, T>>['onChildren'],
  dir: string,
  postStats: T,
  parents: T[],
  files: string[],
  done: (result: T) => void,
  result: T,
  childKey: ChildKey,
}) {
  const { onChildren, dir, postStats, parents, files, result, childKey, done } = options
  const children = onChildren(dir, path.basename(dir), postStats, parents, files, result[childKey])
  done({ ...result, [childKey]: children })
}
