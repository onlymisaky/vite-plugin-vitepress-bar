import type { RepeatTreeOptions, StackItem, Tree } from './types'
import { checkIsLeaf, resolveTreeNodeByPath } from './utils'

export function repeatTreeBF<
  T extends Record<string, any>,
  ChildKey extends string | symbol = 'children',
>(
  tree: Tree<T, ChildKey>,
  childrenKey: ChildKey,
  callbacks: Pick<Required<RepeatTreeOptions<T, ChildKey>>, 'onItem' | 'onBeforeRepeatChildren' | 'onAfterRepeatChildren'>,
): void {
  if (!tree)
    return void 0

  const { onItem, onBeforeRepeatChildren, onAfterRepeatChildren } = callbacks

  onItem(tree, 0, 0, null, [], checkIsLeaf(tree, childrenKey))

  if (checkIsLeaf(tree, childrenKey)) {
    return void 0
  }

  onBeforeRepeatChildren(tree, 0, 0, [])

  const stack: StackItem[] = []

  tree[childrenKey].forEach((item: Tree<T, ChildKey>, index: number) => {
    stack.push([index])
  })

  while (stack.length > 0) {
    const indexSegments = stack.shift()!
    const { index, level, node, parent, isLeaf } = resolveTreeNodeByPath(tree, childrenKey, indexSegments)

    if (index === parent![childrenKey].length - 1) {
      onAfterRepeatChildren(parent!, index, level, indexSegments)
    }

    onItem(node, index, level, parent, indexSegments, isLeaf)

    if (!isLeaf) {
      onBeforeRepeatChildren(node, index, level, indexSegments)
      node[childrenKey].forEach((item: Tree<T, ChildKey>, index: number) => {
        stack.push([...indexSegments, index])
      })
    }
  }
}
