import * as fs from 'fs'
import * as path from 'path'
import { DirTreeOptions, ErrorItem, Item } from '../types'

function handleError(
  errors: ErrorItem[],
  error: Error,
  type: 'readdir' | 'stat',
  path: string,
  mode: DirTreeOptions['processReadDirError'] | DirTreeOptions['processStatsError'] = 'ignore',
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

export function defineStats<T extends Record<string, any>>(o: T, stats: fs.Stats) {
  return Object.defineProperties(o, {
    __stats__: {
      value: stats,
      writable: false,
      enumerable: false,
      configurable: false
    },
  }) as unknown as Item
}

function walk<T extends Item = Item>(
  dir: string,
  postStats: T,
  parents: T[],
  errors: ErrorItem[],
  options: Required<Omit<DirTreeOptions<T>, 'onComplete'>>,
  done: (result: T) => void
) {
  const { isSkip, processStatsError, processReadDirError, onReadDir, onStats, onChildren, childKey } = options

  fs.readdir(dir, (readDirError, files) => {
    if (readDirError) {
      handleError(errors, readDirError, 'readdir', dir, processReadDirError)
      return
    }
    let count = files.length
    const readDirResult = onReadDir(dir, path.basename(dir), postStats, parents, files)
    let result = { ...readDirResult, [childKey]: [] } as T

    if (count === 0) {
      const children = onChildren(dir, path.basename(dir), postStats, parents, files, result[childKey])
      done({ ...result, [childKey]: children })
      return
    }

    files.forEach((file) => {
      const childDir = path.join(dir, file)
      fs.stat(childDir, async (statError, stats) => {
        if (statError) {
          count--
          handleError(errors, statError, 'stat', childDir, processStatsError)
          if (count === 0) {
            const children = onChildren(dir, path.basename(dir), postStats, [...parents, result], files, result[childKey])
            done({ ...result, [childKey]: children })
          }
        }

        const _stats = onStats(childDir, file, stats, [...parents, result])
        const childStatsResult = defineStats(_stats, stats) as T

        if (isSkip(childDir, file, stats, [...parents, result])) {
          count--
          if (count === 0) {
            const children = onChildren(dir, path.basename(dir), postStats, [...parents, result], files, result[childKey])
            done({ ...result, [childKey]: children })
          }
          return
        }

        if (stats.isFile()) {
          result[childKey].push(childStatsResult)
          count--
          if (count === 0) {
            const children = onChildren(dir, path.basename(dir), postStats, [...parents, result], files, result[childKey])
            done({ ...result, [childKey]: children })
          }
          return
        }

        if (stats.isDirectory()) {
          walk(childDir, childStatsResult, [...parents, result], errors, {
            isSkip,
            onStats,
            onReadDir,
            onChildren,
            childKey,
            processStatsError,
            processReadDirError
          }, (childResult) => {
            result[childKey].push(childResult)
            count--
            if (count === 0) {
              const children = onChildren(dir, path.basename(dir), postStats, [...parents, result], files, result[childKey])
              done({ ...result, [childKey]: children })
            }
          })
          return
        }
      })
    })
  })
}

export function dirTree<T extends Item = Item>(dir: string, options?: DirTreeOptions<T>) {
  const {
    isSkip = (absolutePath: string, filename: string, stats: fs.Stats, parents: T[]) => false,
    processStatsError = 'ignore',
    processReadDirError = 'ignore',
    onStats = (absolutePath: string, filename: string, stats: fs.Stats, parents: T[]) => defineStats({}, stats) as T,
    onReadDir = (absolutePath: string, filename: string, postStats: T, parents: T[], childFiles: string[]) => ({ path: absolutePath, name: filename, stats: postStats.__stats__ }) as unknown as T,
    onChildren = (absolutePath: string, filename: string, postStats: T, parents: T[], childFiles: string[], children: T[]) => children,
    onComplete = (result: T, errors: ErrorItem[]) => { console.log(result, errors) },
    childKey = 'children'
  } = (options || {}) as Required<DirTreeOptions<T>>

  const errors: ErrorItem[] = []

  try {
    if (!fs.existsSync(dir)) {
      return new Error(dir + ' not exists')
    }
    const stats = fs.statSync(dir)
    const _stats = onStats(dir, path.basename(dir), stats, [])
    const postStats = defineStats(_stats, stats) as T

    if (!stats.isDirectory()) {
      const readDirResult = onReadDir(dir, path.basename(dir), postStats, [], [dir])
      return readDirResult
    }

    walk(dir, postStats, [], errors, {
      isSkip,
      processStatsError,
      processReadDirError,
      onReadDir,
      onStats,
      onChildren,
      childKey,
    }, (result) => {
      onComplete(result, errors)
    })

  } catch (error) {
    handleError(errors, error, 'stat', dir, 'throw')
  }
}
