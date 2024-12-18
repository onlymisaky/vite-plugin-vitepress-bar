import type { RepeatTreeOptions, Tree } from './types'

export function checkIsLeaf<
  T extends Record<string, any>,
  ChildKey extends string | symbol = 'children',
>(node: Tree<T, ChildKey>, childrenKey: ChildKey): boolean {
  return !Array.isArray(node[childrenKey]) || node[childrenKey].length === 0
}

export function resolveTreeNodeByPath<
  T extends Record<string, any>,
  ChildKey extends string | symbol = 'children',
>(tree: Tree<T, ChildKey>, childrenKey: ChildKey, indexSegments: number[]): {
  index: number
  level: number
  node: Tree<T, ChildKey>
  parent: Tree<T, ChildKey> | null
  isRoot: boolean
  isLeaf: boolean
} {
  if (indexSegments.length === 0) {
    return {
      index: 0,
      level: 0,
      node: tree,
      parent: null,
      isRoot: true,
      isLeaf: checkIsLeaf(tree, childrenKey),
    }
  }

  if (indexSegments.length === 1) {
    return {
      index: indexSegments[0],
      level: 1,
      node: tree[childrenKey][indexSegments[0]],
      parent: tree,
      isRoot: false,
      isLeaf: checkIsLeaf(tree[childrenKey][indexSegments[0]], childrenKey),
    }
  }

  const level = indexSegments.length
  const index = indexSegments[level - 1]

  const parentIndexSegments = indexSegments.slice(0, -1)
  const parent = parentIndexSegments.reduce((prev: Tree<T, ChildKey>, index: number) => {
    return prev[childrenKey][index]
  }, tree)

  const node = parent[childrenKey][index]

  return {
    index,
    level,
    node,
    parent,
    isLeaf: checkIsLeaf(node, childrenKey),
    isRoot: false,
  }
}

export function normalizeOptions<
  T extends Record<string, any>,
  ChildKey extends string | symbol = 'children',
>(options: RepeatTreeOptions<T, ChildKey>): Required<RepeatTreeOptions<T, ChildKey>> {
  const { childrenKey, onItem, onBeforeRepeatChildren, onAfterRepeatChildren } = options

  function defaultOnItem(...args: Parameters<Required<RepeatTreeOptions<T, ChildKey>>['onItem']>): void {
    if (typeof onItem === 'function') {
      onItem(...args)
    }
  }

  function defaultOnBeforeRepeatChildren(...args: Parameters<Required<RepeatTreeOptions<T, ChildKey>>['onBeforeRepeatChildren']>): void {
    if (typeof onBeforeRepeatChildren === 'function') {
      onBeforeRepeatChildren(...args)
    }
  }

  function defaultOnAfterRepeatChildren(...args: Parameters<Required<RepeatTreeOptions<T, ChildKey>>['onAfterRepeatChildren']>): void {
    if (typeof onAfterRepeatChildren === 'function') {
      onAfterRepeatChildren(...args)
    }
  }

  return {
    childrenKey: childrenKey || 'children',
    onItem: defaultOnItem,
    onBeforeRepeatChildren: defaultOnBeforeRepeatChildren,
    onAfterRepeatChildren: defaultOnAfterRepeatChildren,
  } as Required<RepeatTreeOptions<T, ChildKey>>
}
