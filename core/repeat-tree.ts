type TreeItem<K extends string = 'children'> = {
  [P in K]?: TreeItem<K>[]
} & Record<string, any>

interface RepeatTreeOptions<K extends string, T> {
  idKey: keyof T,
  pIdKey: keyof T,
  childKey: K,
  parents: T[],
  onItem: (item: T, index: number, parents: T[]) => void,
  onBeforeChildren: (children: T[], parents: T[]) => void,
  onChildren: (children: T[], parents: T[]) => void,
  onFinish: () => void,
}

export function repeatTree<
  K extends string,
  T extends TreeItem<K> = TreeItem<K>
>(tree: T[], options: Partial<RepeatTreeOptions<K, T>>) {
  const {
    idKey = 'id',
    pIdKey = 'pId',
    childKey = 'children',
    parents = [],
    onItem = (item, index, parents) => { },
    onBeforeChildren = (children, parents) => { },
    onChildren = (children, parents) => { },
    onFinish = () => { },
  } = options
  onBeforeChildren(tree, parents)
  for (let index = 0; index < tree.length; index++) {
    const item = tree[index]
    const { [childKey]: children, } = item
    onItem(item, index, [...parents])
    if (children && children.length) {
      repeatTree(children, { ...options, parents: [...parents, item] })
    }
  }
  onChildren(tree, parents)
  if (parents.length === 0) {
    onFinish()
  }
}
