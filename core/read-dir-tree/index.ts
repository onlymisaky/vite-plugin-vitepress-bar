import * as fs from 'fs'
import * as path from 'path'
import { DirTreeOptions, ErrorItem, DirTreeItem } from './types'
import { handleError, createDefaultOptions, handleDone } from './utils'

function walk<
  ChildKey extends string,
  T extends DirTreeItem<ChildKey>
>(
  dir: string,
  postStats: T,
  parents: T[],
  errors: ErrorItem[],
  options: Required<Omit<DirTreeOptions<ChildKey, T>, 'onComplete'>> & { done: (result: T) => void },
) {
  const { isSkip, processStatsError, processReadDirError, onReadDir, onStats, onChildren, childKey, done } = options

  fs.readdir(dir, (readDirError, files) => {
    if (readDirError) {
      handleError(errors, readDirError, 'readdir', dir, processReadDirError)
      return
    }
    let count = files.length
    const readDirResult = onReadDir(dir, path.basename(dir), postStats, parents, files)

    const handleDoneParam: Parameters<typeof handleDone>[0] = {
      dir,
      postStats,
      parents: [],
      files,
      result: readDirResult,
      childKey,
      onChildren: onChildren as unknown as Parameters<typeof handleDone>[0]['onChildren'],
      done: done as unknown as Parameters<typeof handleDone>[0]['done'],
    }

    if (count === 0) {
      handleDoneParam.parents = [...parents]
      handleDone(handleDoneParam)
      return
    }

    files.forEach((file) => {
      const childDir = path.join(dir, file)
      fs.stat(childDir, async (statError, stats) => {
        if (statError) {
          count--
          handleError(errors, statError, 'stat', childDir, processStatsError)
          if (count === 0) {
            handleDoneParam.parents = [...parents, readDirResult]
            handleDone(handleDoneParam)
          }
          return
        }

        const childPostStats = onStats(childDir, file, stats, [...parents, readDirResult])

        if (isSkip(childDir, file, stats, [...parents, readDirResult])) {
          count--
          if (count === 0) {
            handleDoneParam.parents = [...parents, readDirResult]
            handleDone(handleDoneParam)
          }
          return
        }

        if (stats.isFile()) {
          readDirResult[childKey].push(childPostStats)
          count--
          if (count === 0) {
            handleDoneParam.parents = [...parents, readDirResult]
            handleDone(handleDoneParam)
          }
          return
        }

        if (stats.isDirectory()) {
          walk(childDir, childPostStats, [...parents, readDirResult], errors, {
            ...options,
            done: (childResult) => {
              readDirResult[childKey].push(childResult)
              count--
              if (count === 0) {
                handleDoneParam.parents = [...parents, readDirResult]
                handleDone(handleDoneParam)
              }
            }
          })
          return
        }
      })
    })
  })
}

export function readDirTree<
  ChildKey extends string,
  T extends DirTreeItem<ChildKey>
>(dir: string, options?: DirTreeOptions<ChildKey, T>) {
  const { onComplete, ...walkOptions } = createDefaultOptions(options)
  const { onReadDir, onStats, childKey } = walkOptions

  const errors: ErrorItem[] = []

  try {
    if (!fs.existsSync(dir)) {
      return new Error(dir + ' not exists')
    }

    fs.stat(dir, (error, stats) => {
      if (error) {
        handleError(errors, error, 'stat', dir, 'throw')
        onComplete({} as T, errors)
        return
      }
      const postStats = onStats(dir, path.basename(dir), stats, [])
      if (stats.isFile()) {
        const readDirResult = onReadDir(dir, path.basename(dir), postStats, [], [dir])
        delete readDirResult[childKey]
        onComplete(readDirResult, errors)
        return
      }
      if (stats.isDirectory()) {
        walk(dir, postStats, [], errors, {
          ...walkOptions, done: (result) => {
            onComplete(result, errors)
          }
        })
      }
    })
  } catch (error) {
    handleError(errors, error, 'stat', dir, 'throw')
  }
}
