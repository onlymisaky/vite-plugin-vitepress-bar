import * as fs from 'fs'
import * as path from 'path'
import { Options, ErrorItem, FileInfo } from './types'

export function handleError(
  errors: ErrorItem[],
  error: Error,
  type: 'readdir' | 'stat',
  path: string,
  mode: Options['processReadDirError'] | Options['processStatsError'] = 'ignore',
) {
  switch (mode) {
    case 'ignore':
      break
    case 'throw':
      throw error
    case 'record':
      errors.push({ error, path, type })
      break
  }
}

export function defineFileInfo<T extends Record<string, any>>(o: T, fileInfo: Partial<FileInfo>) {
  const map = Object.keys(fileInfo).reduce((acc, key) => {
    acc[key] = {
      value: fileInfo[key],
      writable: false,
      enumerable: true,
      configurable: false
    }
    return acc
  }, {})
  return Object.defineProperties(o, map) as unknown as FileInfo
}

export function createDefaultOptions<T extends FileInfo>(options?: Options<T>): Required<Options<T>> {

  function onStats(absolutePath: string, filename: string, stats: fs.Stats, parents: T[]) {
    let postStats = {}
    if (options && typeof options.onStats === 'function') {
      postStats = options.onStats(absolutePath, filename, stats, parents)
    }
    return defineFileInfo(postStats, {
      __stats__: stats,
      __fullpath__: absolutePath,
      __filename__: filename,
      __children__: [],
      __parents__: parents
    }) as T
  }

  function onReadDir(absolutePath: string, filename: string, postStats: T, parents: T[], childFiles: string[]) {
    let result = Object.assign({}, postStats)
    if (options && typeof options.onReadDir === 'function') {
      result = options.onReadDir(absolutePath, filename, postStats, parents, childFiles)
    }
    return defineFileInfo(result, {
      __stats__: postStats.__stats__,
      __fullpath__: absolutePath,
      __filename__: filename,
      __children__: childFiles,
      __parents__: parents
    }) as T
  }

  const defaultOptions: Options<T> = {
    isSkip: (absolutePath: string, filename: string, stats: fs.Stats, parents: T[]) => false,
    processStatsError: 'ignore',
    processReadDirError: 'ignore',
    onStats,
    onReadDir,
    onChildren: (absolutePath: string, filename: string, postStats: T, parents: T[], childFiles: string[], children: T[]) => children,
    onComplete: (result: T, errors: ErrorItem[]) => { },
    childKey: 'children'
  }

  return (options ? { ...defaultOptions, ...options, onStats, onReadDir } : defaultOptions) as Required<Options<T>>
}

export function handleDone<T extends FileInfo>(options: Required<Pick<Options<T>, 'onChildren'>> & {
  dir: string,
  done: (result: T) => void,
  result: T,
  childKey: string,
  parents: T[],
  files: string[],
  postStats: T
}) {
  const { onChildren, dir, postStats, parents, files, result, childKey, done } = options
  const children = onChildren(dir, path.basename(dir), postStats, parents, files, result[childKey])
  done({ ...result, [childKey]: children })
}
