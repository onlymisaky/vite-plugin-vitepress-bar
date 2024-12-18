import type { RepeatTreeOptions, RepeatType, Tree } from './types'
import { repeatTreeBF } from './repeat-tree-bf'
import { repeatTreeDF } from './repeat-tree-df'
import { normalizeOptions } from './utils'

export function repeatTree<
  T extends Record<string, any>,
  ChildKey extends string | symbol = 'children',
>(tree: Tree<T, ChildKey>, options?: RepeatTreeOptions<T, ChildKey> & { repeatType?: RepeatType }): void {
  const { repeatType = 'bf', ...rest } = { ...options }
  const { childrenKey = 'children', ...callbacks } = normalizeOptions(rest)
  if (repeatType.startsWith('df-')) {
    let order = repeatType.replaceAll('df-', '') as 'per' | 'post' | 'in'
    if (!['per', 'post', 'in'].includes(order))
      order = 'per'
    return repeatTreeDF(tree, childrenKey as ChildKey, callbacks, order)
  }

  return repeatTreeBF(tree, childrenKey as ChildKey, callbacks)
}
