import { Stats } from 'fs'
import * as path from 'path'
import { Tree } from './../../types/shared.d'
import {
  ErrorItem,
  FileInfo,
  NormalizeOnChildren,
  NormalizeOnRead,
  ProcessError,
  ReadDirTreeOptions,
  WalkDone,
  WalkOptions
} from './types'

export function handleError(
  errors: ErrorItem[],
  error: Error, type: 'readdir' | 'stat',
  path: string,
  mode: ProcessError = 'ignore'
) {
  switch (mode) {
    case 'ignore': break
    case 'throw': throw error
    case 'record': errors.push({ error, path, type }); break
    default: break
  }
}

function normalizeIsSkip<
  K extends string,
  T extends object = FileInfo,
  R extends object = T
>(param?: ReadDirTreeOptions<K, T, R>['isSkip']): ReadDirTreeOptions<K, T, R>['isSkip'] {
  return function isSkip(fullpath, filename, stat, parents) {
    let skip = false
    if (typeof param === 'function') {
      skip = param(fullpath, filename, stat, parents)
    }
    return !!skip
  }
}

function normalizeOnRead<
  K extends string,
  T extends object = FileInfo,
  R extends object = T
>(childKey: K, param?: ReadDirTreeOptions<K, T, R>['onRead']): NormalizeOnRead<K, T, R> {
  return function onRead(fullpath, filename, stat, parents, files) {
    let result: ReturnType<ReadDirTreeOptions<K, T, R>['onRead']> | undefined
    if (typeof param === 'function') {
      result = param(fullpath, filename, stat, parents, files)
    }
    if (typeof result === 'undefined') {
      let _parents = parents as unknown as FileInfo[]
      let fileInfo: FileInfo = { fullpath, filename, stat, parents: _parents }
      if (stat.isDirectory()) {
        fileInfo.files = files
      }
      result = fileInfo as R
    }
    if (Object.prototype.toString.call(result) !== '[object Object]') {
      result = { value: result } as R
    }
    if (stat.isDirectory()) {
      // 当 childDir 全部读取完成时，会将结果 push 到 children 中
      const children: Tree<K, R>[] = []
      let res: Tree<K, R> = { [childKey]: children, ...result, }
      return res
    }

    return result as Tree<K, R>
  }
}

function normalizeOnChildren<
  K extends string,
  T extends object = FileInfo,
  R extends object = T
>(param?: ReadDirTreeOptions<K, T, R>['onChildren']): NormalizeOnChildren<K, T, R> {
  return function onChildren(fullpath, filename, stat, readResult, parents, files, children) {
    let result: ReturnType<ReadDirTreeOptions<K, T, R>['onChildren']> | undefined
    if (typeof param === 'function') {
      result = param(fullpath, filename, stat, readResult, parents, files, children)
    }
    if (!Array.isArray(result)) {
      result = children
    }
    return result as Tree<K, T | R>[]
  }
}

export function normalizeWalkOptions<
  K extends string,
  T extends object = FileInfo,
  R extends object = T
>(options: Partial<ReadDirTreeOptions<K, T, R>> & { done: WalkDone<K, T, R> }): WalkOptions<K, T, R> {

  let handleReadDirErrorType = options.handleReadDirErrorType as ProcessError
  if (!['throw', 'ignore', 'record'].includes(handleReadDirErrorType as string)) {
    handleReadDirErrorType = 'ignore'
  }
  let handleStatErrorType = options.handleStatErrorType as ProcessError
  if (!['throw', 'ignore', 'record'].includes(handleStatErrorType as string)) {
    handleStatErrorType = 'ignore'
  }
  let childKey = options.childKey
  if (typeof childKey !== 'string' || childKey.trim() === '') {
    childKey = 'children' as K
  }

  return {
    handleReadDirErrorType,
    handleStatErrorType,
    childKey,
    isSkip: normalizeIsSkip(options.isSkip),
    onRead: normalizeOnRead(childKey, options.onRead),
    onChildren: normalizeOnChildren<K, T, R>(options.onChildren),
    done: options.done,
  }
}

export function handleDone<
  K extends string,
  T extends object = FileInfo,
  R extends object = T
>(options: {
  onChildren: WalkOptions<K, T, R>['onChildren'],
  dir: string,
  stat: Stats,
  parents: Tree<K, R>[],
  files: string[],
  readResult: Tree<K, R>,
  childKey: K,
  done: WalkOptions<K, T, R>['done'],
}) {
  const { onChildren, dir, stat, parents, files, readResult, childKey, done } = options
  const children = readResult[childKey] as Tree<K, R>[]
  const userChildren = onChildren(dir, path.basename(dir), stat, readResult, parents, files, children)
  Reflect.set(readResult, childKey, userChildren)
  done(readResult)
}
