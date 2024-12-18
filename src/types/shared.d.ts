import type * as fs from 'node:fs'

export type MaybePromise<T> = T | Promise<T>

export interface FileInfoSlim {
  path: string
  name: string
}

export interface FileInfoSlimWithStats extends FileInfoSlim {
  stats: fs.Stats
}

export interface FileInfo extends FileInfoSlimWithStats {
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

export type Tree<
  T extends Record<string, any>,
  ChildKey extends string | symbol = 'children',
> = T & Partial<Record<ChildKey, Tree<T, ChildKey>[]>>
