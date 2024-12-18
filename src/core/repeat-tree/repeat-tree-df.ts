import type { RepeatTreeOptions, StackItem, Tree } from './types'
import { resolveTreeNodeByPath } from './utils'

export function repeatTreeDF<
  T extends Record<string, any>,
  ChildKey extends string | symbol = 'children',
>(
  tree: Tree<T, ChildKey>,
  childrenKey: ChildKey,
  callbacks: Pick<Required<RepeatTreeOptions<T, ChildKey>>, 'onItem' | 'onBeforeRepeatChildren' | 'onAfterRepeatChildren'>,
  order: 'per' | 'post' | 'in',
  indexSegments: StackItem = [],
  root: Tree<T, ChildKey> = tree,
): void {
  if (!tree)
    return void 0

  // onBeforeRepeatChildren 和 onAfterRepeatChildren 调用时机与 order 无关
  const { onItem, onBeforeRepeatChildren, onAfterRepeatChildren } = callbacks

  const { index, level, parent, isLeaf, isRoot } = resolveTreeNodeByPath(root, childrenKey, indexSegments)

  if (isLeaf && isRoot) {
    onItem(tree, index, level, parent, indexSegments, isLeaf)
    return void 0
  }

  // 中序遍历(左 -> 根 -> 右)
  if (order === 'in') {
    if (isLeaf) {
      onItem(tree, index, level, parent, indexSegments, isLeaf)
      return void 0
    }

    const count = tree[childrenKey].length
    const center = Math.ceil(count / 2)

    onBeforeRepeatChildren(tree, index, level, indexSegments)

    for (let i = 0; i < center; i++) {
      repeatTreeDF(tree[childrenKey][i], childrenKey, callbacks, order, [...indexSegments, i], root)
    }

    onItem(tree, index, level, parent, indexSegments, isLeaf)

    for (let i = center; i < count; i++) {
      repeatTreeDF(tree[childrenKey][i], childrenKey, callbacks, order, [...indexSegments, i], root)
    }

    onAfterRepeatChildren(tree, index, level, indexSegments)
    return void 0
  }

  // 前序遍历(根 -> 左 -> 右), 先处理根节点
  if (order === 'per') {
    onItem(tree, index, level, parent, indexSegments, isLeaf)
  }

  if (!isLeaf) {
    onBeforeRepeatChildren(tree, index, level, indexSegments)
    tree[childrenKey].forEach((node: Tree<T, ChildKey>, index: number) => {
      repeatTreeDF(node, childrenKey, callbacks, order, [...indexSegments, index], root)
    })
    onAfterRepeatChildren(tree, index, level, indexSegments)
  }

  // 后序遍历(左 -> 右 -> 根), 最后处理根节点
  if (order === 'post') {
    onItem(tree, index, level, parent, indexSegments, isLeaf)
  }
}
