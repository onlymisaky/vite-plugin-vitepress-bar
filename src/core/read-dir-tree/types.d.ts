import type { MaybePromise } from '../../types/shared'
import { FileInfo, Tree } from '../../types/shared'

export { FileInfo, Tree }

export type TraversalType = 'recursive' | 'iterative'

export interface Options<
  T extends Record<string, any> = FileInfo,
  ChildKey extends string | symbol = 'children',
> {
  childrenKey?: ChildKey
  shouldSkip?: (fileInfo: FileInfo, parentNode: Tree<T, ChildKey> | null) => MaybePromise<boolean>
  transform?: (fileInfo: FileInfo, parentNode: Tree<T, ChildKey> | null) => MaybePromise<T | null>
}

/**
 * 迭代遍历时的队列项
 */
export interface QueueItem<
  T extends Record<string, any>,
  ChildKey extends string | symbol = 'children',
> {
  path: string
  parentNode: Tree<T, ChildKey> | null
  parentFileInfo: FileInfo | null
}
