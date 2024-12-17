import type * as fs from 'node:fs'

export type MaybePromise<T> = T | Promise<T>

export interface FileInfoSlim {
  path: string
  name: string
  stat: fs.Stats
}

export interface FileInfo extends FileInfoSlim {
  files: string[]
  parent: FileInfo | null | undefined
}

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
  ChildKey extends string | symbol = 'children',
> = T & Record<ChildKey, Tree<T, ChildKey>[]>
