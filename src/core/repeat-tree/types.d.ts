import { Tree } from '../../types/shared'

export { Tree }

export type RepeatType = 'bf' | 'df-pre' | 'df-post' | 'df-in'

/**
 * 广度优先迭代遍历时的栈项
 */
// export interface StackItem<
//   T extends Record<string, any>,
//   ChildKey extends string | symbol = 'children',
// > {
//   index: number
//   level: number
//   node: Tree<T, ChildKey>
//   parent: Tree<T, ChildKey>
// }

export type StackItem = Array<number>

export interface RepeatTreeOptions<
  T extends Record<string, any>,
  ChildKey extends string | symbol = 'children',
> {
  childrenKey?: ChildKey
  onItem?: (
    item: Tree<T, ChildKey>,
    index: number,
    level: number,
    parent: Tree<T, ChildKey> | null,
    indexSegments: number[],
    isLeaf: boolean
  ) => void
  onBeforeRepeatChildren?: (
    parent: Tree<T, ChildKey>,
    index: number,
    level: number,
    indexSegments: number[]
  ) => void
  onAfterRepeatChildren?: (
    parent: Tree<T, ChildKey>,
    index: number,
    level: number,
    indexSegments: number[]
  ) => void
}
