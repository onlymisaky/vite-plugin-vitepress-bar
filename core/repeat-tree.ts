type TreeItem<K extends string = 'children'> = {
  [P in K]?: TreeItem<K>[]
} & Record<string, any>

export interface Options<T> {
  idKey: keyof T,
  pIdKey: keyof T,
  childKey: keyof T,
  parents: T[],
  onItem: (item: T, index: number, parents: T[]) => void,
  onChildren: (children: T[], parents: T[]) => void,
  onFinish: () => void,
}

export function repeatTree<K extends string, T extends TreeItem<K>>(tree: T[], options: Partial<Options<T>>) {
  const {
    idKey = 'id',
    pIdKey = 'pId',
    childKey = 'children',
    parents = [],
    onItem = (item, index, parents) => { },
    onChildren = (children, parents) => { },
    onFinish = () => { },
  } = options
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
