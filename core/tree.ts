import { Tree } from './../types/shared.d'

interface RepeatTreeDFOptions<K extends string, T extends object> {
  childKey: K,
  parents: Tree<K, T>[],
  onBeforeChildren: (children: Tree<K, T>[], current: Tree<K, T>, parents: Tree<K, T>[]) => void,
  onItem: (item: Tree<K, T>, index: number, siblings: Tree<K, T>[], parent: Tree<K, T>, parents: Tree<K, T>[]) => void,
  onFinishChildren: (children: Tree<K, T>[], current: Tree<K, T>, parents: Tree<K, T>[]) => void,
  onFinish: () => void,
}

type RepeatTreeBFOptions<K extends string, T extends object> = Omit<RepeatTreeDFOptions<K, T>, 'parents'>

interface StackItem<K extends string, T extends object> {
  index: number,
  node: Tree<K, T>,
  parentNodes: Tree<K, T>[]
}

export function repeatTreeBF<
  K extends string,
  T extends object
>(tree: Tree<K, T>, options: Partial<RepeatTreeBFOptions<K, T>>) {
  const {
    childKey,
    onBeforeChildren = (children, current, parents) => { },
    onItem = (item, index, siblings, parent, parents) => { },
    onFinishChildren = (children, current, parents) => { },
    onFinish = () => { },
  } = options as Required<RepeatTreeBFOptions<K, T>>

  if (!tree) {
    onFinish()
    return
  }

  if (!Array.isArray(tree[childKey])) {
    onFinish()
    return
  }

  if (tree[childKey].length === 0) {
    onBeforeChildren(tree[childKey] as Tree<K, T>[], tree, [tree])
    onFinishChildren(tree[childKey] as Tree<K, T>[], tree, [tree])
    onFinish()
    return
  }

  const stack: StackItem<K, T>[] = []
  tree[childKey].forEach((node, index) => {
    stack.push({ index, node, parentNodes: [tree] })
  })

  while (stack.length) {
    const { index, node, parentNodes } = stack.shift() as StackItem<K, T>
    const parentNode = parentNodes[parentNodes.length - 1] as Tree<K, T>
    if (index === 0) {
      onBeforeChildren(parentNode[childKey] as Tree<K, T>[], parentNode, parentNodes)
    }
    onItem(node, index, parentNode[childKey] as Tree<K, T>[], parentNode, parentNodes)
    if (Array.isArray(node[childKey])) {
      node[childKey].forEach((item, index) => {
        stack.push({ index, node: item, parentNodes: [...parentNodes, node] })
      })
    }
    if (stack.length === 0 || stack[0].index === 0) {
      onFinishChildren(parentNode[childKey] as Tree<K, T>[], parentNode, parentNodes)
    }
  }

  onFinish()
}

export function repeatTreeDF<
  K extends string,
  T extends object
>(tree: Tree<K, T>, options: Partial<RepeatTreeDFOptions<K, T>>) {
  const {
    childKey,
    parents = [],
    onBeforeChildren = (children, current, parents) => { },
    onItem = (item, index, siblings, parent, parents) => { },
    onFinishChildren = (children, current, parents) => { },
    onFinish = () => { },
  } = options as Required<RepeatTreeDFOptions<K, T>>
  if (!tree) {
    onFinish()
    return
  }

  if (!Array.isArray(tree[childKey])) {
    onFinish()
    return
  }

  onBeforeChildren(tree[childKey], tree, parents)

  tree[childKey].forEach((item, index) => {
    let _parents = [...parents, tree]
    onItem(item, index, tree[childKey] as Tree<K, T>[], tree, _parents)
    if (Array.isArray(item[childKey])) {
      repeatTreeDF(item, { ...options, parents: _parents })
    }
  })

  onFinishChildren(tree[childKey], tree, parents)
  if (parents.length === 0) {
    onFinish()
  }
}
