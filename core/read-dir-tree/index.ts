import * as fs from 'fs'
import * as path from 'path'
import { Options, ErrorItem, FileInfo } from './types'
import { handleError, createDefaultOptions, handleDone } from './utils'

function walk<T extends FileInfo = FileInfo>(
  dir: string,
  postStats: T,
  parents: T[],
  errors: ErrorItem[],
  options: Required<Omit<Options<T>, 'onComplete'>> & { done: (result: T) => void },
) {
  const { isSkip, processStatsError, processReadDirError, onReadDir, onStats, onChildren, childKey, done } = options

  fs.readdir(dir, (readDirError, files) => {
    if (readDirError) {
      handleError(errors, readDirError, 'readdir', dir, processReadDirError)
      return
    }
    let count = files.length
    const readDirResult = onReadDir(dir, path.basename(dir), postStats, parents, files)
    let result = { ...readDirResult, [childKey]: [] } as T

    if (count === 0) {
      handleDone({ dir, postStats, parents: [...parents], files, result, childKey, onChildren, done })
      // const children = onChildren(dir, path.basename(dir), postStats, parents, files, result[childKey])
      // done({ ...result, [childKey]: children })
      return
    }

    files.forEach((file) => {
      const childDir = path.join(dir, file)
      fs.stat(childDir, async (statError, stats) => {
        if (statError) {
          count--
          handleError(errors, statError, 'stat', childDir, processStatsError)
          if (count === 0) {
            handleDone({ dir, postStats, parents: [...parents, result], files, result, childKey, onChildren, done })
            // const children = onChildren(dir, path.basename(dir), postStats, [...parents, result], files, result[childKey])
            // done({ ...result, [childKey]: children })
          }
          return;
        }

        const childPostStats = onStats(childDir, file, stats, [...parents, result])

        if (isSkip(childDir, file, stats, [...parents, result])) {
          count--
          if (count === 0) {
            handleDone({ dir, postStats, parents: [...parents, result], files, result, childKey, onChildren, done })
            // const children = onChildren(dir, path.basename(dir), postStats, [...parents, result], files, result[childKey])
            // done({ ...result, [childKey]: children })
          }
          return
        }

        if (stats.isFile()) {
          result[childKey].push(childPostStats)
          count--
          if (count === 0) {
            handleDone({ dir, postStats, parents: [...parents, result], files, result, childKey, onChildren, done })
            // const children = onChildren(dir, path.basename(dir), postStats, [...parents, result], files, result[childKey])
            // done({ ...result, [childKey]: children })
          }
          return
        }

        if (stats.isDirectory()) {
          walk(childDir, childPostStats, [...parents, result], errors, {
            ...options, done: (childResult) => {
              result[childKey].push(childResult)
              count--
              if (count === 0) {
                handleDone({ dir, postStats, parents: [...parents, result], files, result, childKey, onChildren, done })
                // const children = onChildren(dir, path.basename(dir), postStats, [...parents, result], files, result[childKey])
                // done({ ...result, [childKey]: children })
              }
            }
          })
          return
        }
      })
    })
  })
}

export function readDirTree<T extends FileInfo = FileInfo>(dir: string, options?: Options<T>) {
  const { onComplete, ...walkOptions } = createDefaultOptions(options)
  const { onReadDir, onStats, } = walkOptions

  const errors: ErrorItem[] = []

  try {
    if (!fs.existsSync(dir)) {
      return new Error(dir + ' not exists')
    }
    const stats = fs.statSync(dir)
    const postStats = onStats(dir, path.basename(dir), stats, [])
    if (!stats.isDirectory()) {
      const readDirResult = onReadDir(dir, path.basename(dir), postStats, [], [dir])
      return readDirResult
    }

    walk(dir, postStats, [], errors, {
      ...walkOptions, done: (result) => {
        onComplete(result, errors)
      }
    })

  } catch (error) {
    handleError(errors, error, 'stat', dir, 'throw')
  }
}
