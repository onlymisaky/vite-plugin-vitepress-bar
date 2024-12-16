import * as fs from 'node:fs'

type MaybePromise<T> = T | Promise<T>

export interface FileInfo {
  path: string
  name: string
  stat: fs.Stats
  parent: FileInfo | null | undefined
}

export type FileInfoWithoutParent = Omit<FileInfo, 'parent'>

// type TreeNode<T, K extends string = 'children'> = {
//   value: T;
// } & Record<K, TreeNode<T, K>[]>;

// type Tree<T, K extends string = 'children'> = TreeNode<T, K>;

// type Tree<
//   NodeData extends Record<string, any>,
//   ChildKey extends string = 'children',
//   ChildData extends Record<string, any> = NodeData,
// > = NodeData & Record<ChildKey, Tree<NodeData, ChildKey, ChildData>[]>;

/**
 * 树形结构节点类型
 * @template T - 节点数据类型
 * @template ChildKey - 子节点键名类型
 */
export type Tree<
  T extends Record<string, any> = FileInfo,
  ChildKey extends string | symbol = 'children'
> = T & Record<ChildKey, Tree<T, ChildKey>[]>;


