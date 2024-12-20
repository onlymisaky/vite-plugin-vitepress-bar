import type { FileInfo, ReadDirTreeOptions } from './types'
import * as fs from 'node:fs'
import * as path from 'node:path'

/**
 * Promise 化的目录读取
 * @param dir - 目录路径
 * @returns [错误信息, 文件列表]
 */
export function readDirPromisefy(dir: string): Promise<[NodeJS.ErrnoException | null, string[]]> {
  return new Promise<[NodeJS.ErrnoException | null, string[]]>((resolve) => {
    fs.readdir(dir, (err, files) => {
      resolve([err, err ? [] : files])
    })
  })
}

/**
 * Promise 化的文件状态获取
 * @param dir - 文件路径
 * @returns [错误信息, 文件状态]
 */
export function statPromisefy(dir: string): Promise<[NodeJS.ErrnoException | null, fs.Stats]> {
  return new Promise<[NodeJS.ErrnoException | null, fs.Stats]>((resolve) => {
    fs.stat(dir, (err, stats) => {
      resolve([err, stats])
    })
  })
}

export function normalizeOptions<
  T extends Record<string, any> = FileInfo,
  ChildKey extends string | symbol = 'children',
>(options: ReadDirTreeOptions<T, ChildKey>): Required<ReadDirTreeOptions<T, ChildKey>> {
  const { childrenKey = 'children', transform, shouldSkip } = options

  async function defaultTransform(...args: Parameters<Required<ReadDirTreeOptions<T, ChildKey>>['transform']>): Promise<T> {
    const [fileInfo, parentNode] = args
    if (typeof transform === 'function') {
      try {
        const nodeData = await transform(...args)
        if (typeof nodeData === 'object') {
          return nodeData as T
        }
        return { value: nodeData, parent: parentNode } as unknown as T
      }
      catch (error) {
        return {
          ...fileInfo,
          error,
        } as unknown as T
      }
    }
    return fileInfo as unknown as T
  }

  async function defaultShouldSkip(...args: Parameters<Required<ReadDirTreeOptions<T, ChildKey>>['shouldSkip']>): Promise<boolean> {
    if (typeof shouldSkip === 'function') {
      try {
        return !!(await shouldSkip(...args))
      }
      catch {
        return false
      }
    }
    return false
  }

  return {
    childrenKey,
    transform: defaultTransform,
    shouldSkip: defaultShouldSkip,
  } as Required<ReadDirTreeOptions<T, ChildKey>>
}

export function toPosixPath(filePath: string): string {
  return path.normalize(filePath).replace(/[\\/]+/g, '/')
}
