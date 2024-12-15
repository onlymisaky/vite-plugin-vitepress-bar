import * as fs from 'node:fs'

import { BaseNodeData, Options } from './types.d'

/**
 * Promise 化的目录读取
 * @param dir - 目录路径
 * @returns [错误信息, 文件列表]
 */
export function readDirPromisefy(dir: string) {
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
export function statPromisefy(dir: string) {
  return new Promise<[NodeJS.ErrnoException | null, fs.Stats]>((resolve) => {
    fs.stat(dir, (err, stat) => {
      resolve([err, stat])
    })
  })
}

export function normalizeOptions<
  T extends Record<string, any> = BaseNodeData,
  ChildKey extends string | symbol = 'children'
>(options: Options<T, ChildKey>): Required<Options<T, ChildKey>> {
  const { childrenKey = 'children', transform, shouldSkip } = options

  async function defaultTransform(...args: Parameters<Required<Options<T, ChildKey>>['transform']>) {
    if (typeof transform === 'function') {
      try {
        const nodeData = await transform(...args)
        if (typeof nodeData === 'object') {
          return nodeData
        }
        return { value: nodeData, parent: args[3] }
      } catch (error) {
        return {
          fullpath: args[0],
          filename: args[1],
          stat: args[2],
          parent: args[3],
          error: error,
        }
      }
    }
    return {
      fullpath: args[0],
      filename: args[1],
      stat: args[2],
      parent: args[3],
    }
  }

  async function defaultShouldSkip(...args: Parameters<Required<Options<T, ChildKey>>['shouldSkip']>) {
    if (typeof shouldSkip === 'function') {
      try {
        return !!(await shouldSkip(...args))
      } catch (error) {
        return false
      }
    }
    return false
  }

  return {
    childrenKey,
    transform: defaultTransform,
    shouldSkip: defaultShouldSkip,
  } as Required<Options<T, ChildKey>>
}
