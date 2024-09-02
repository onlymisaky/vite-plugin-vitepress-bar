import * as fs from 'fs'
import * as path from 'path'
import { Tree } from '../../types/shared'
import { ErrorItem, FileInfo, ReadDirTreeOptions, WalkOptions } from './types'
import { handleDone, handleError, normalizeWalkOptions } from './utils'

function walk<
  K extends string,
  T extends object = FileInfo,
  R extends object = T
>(
  dir: string,
  stat: fs.Stats,
  parents: Tree<K, R>[],
  errors: ErrorItem[],
  options: WalkOptions<K, T, R>,
) {
  const {
    processStatError,
    processReadDirError,
    isSkip,
    onRead,
    onChildren,
    childKey,
    done
  } = options

  fs.readdir(dir, (readDirError, files) => {
    if (readDirError) {
      handleError(errors, readDirError, 'readdir', dir, processReadDirError)
      return
    }
    let count = files.length
    const readResult = onRead(dir, path.basename(dir), stat, parents, files)

    const handleDoneParams: Parameters<typeof handleDone<K, T, R>>[0] = {
      dir,
      stat,
      readResult,
      parents: [],
      files,
      childKey,
      onChildren,
      done: done,
    }

    if (count === 0) {
      handleDoneParams.parents = [...parents]
      handleDone(handleDoneParams)
      return
    }

    files.forEach((file) => {
      const childDir = path.join(dir, file)
      fs.stat(childDir, (statError, stat) => {
        if (statError) {
          count--
          handleError(errors, statError, 'stat', childDir, processStatError)
          if (count === 0) {
            handleDoneParams.parents = [...parents, readResult]
            handleDone(handleDoneParams)
          }
          return
        }

        if (isSkip(childDir, file, stat, [...parents, readResult])) {
          count--
          if (count === 0) {
            handleDoneParams.parents = [...parents, readResult]
            handleDone(handleDoneParams)
          }
          return
        }

        if (stat.isFile()) {
          const readRes = onRead(childDir, file, stat, [...parents, readResult])
          readResult[childKey]?.push(readRes)
          count--
          if (count === 0) {
            handleDoneParams.parents = [...parents, readResult]
            handleDone(handleDoneParams)
          }
          return
        }

        if (stat.isDirectory()) {
          walk(childDir, stat, [...parents, readResult], errors, {
            ...options,
            done: (childResult) => {
              readResult[childKey]?.push(childResult as Tree<K, R>)
              count--
              if (count === 0) {
                handleDoneParams.parents = [...parents, readResult]
                handleDone(handleDoneParams)
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
  K extends string,
  T extends object = FileInfo,
  R extends object = T
>(dir: string, options?: ReadDirTreeOptions<K, T, R>) {
  let { onComplete, ...other } = {
    onComplete: (result) => { },
    ...options,
  }

  function done(result: Tree<K, T | R>) {
    onComplete(result, errors)
  }

  const walkOptions = normalizeWalkOptions({ ...other, done })
  const { onRead, isSkip } = walkOptions

  const errors: ErrorItem[] = []

  try {
    if (!fs.existsSync(dir)) {
      return new Error(dir + ' not exists')
    }

    fs.stat(dir, (error, stat) => {
      if (error) {
        handleError(errors, error, 'stat', dir, 'throw')
        onComplete({} as Tree<K, T | R>, errors)
        return
      }

      if (isSkip(dir, path.basename(dir), stat, [])) {
        onComplete({} as Tree<K, T | R>, errors)
        return
      }

      if (stat.isFile()) {
        const tree = onRead(dir, path.basename(dir), stat, []) as Tree<K, T | R>
        onComplete(tree, errors)
        return
      }

      if (stat.isDirectory()) {
        walk(dir, stat, [], errors, walkOptions)
      }
    })
  } catch (error) {
    handleError(errors, error, 'stat', dir, 'throw')
  }
}
