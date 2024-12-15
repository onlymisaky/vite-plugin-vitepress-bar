import * as fs from 'node:fs'
import * as path from 'node:path'

type MaybePromise<T> = T | Promise<T>

export type TraversalType = 'recursive' | 'iterative'

// type TreeNode<T, K extends string = 'children'> = {
//   value: T;
// } & Record<K, TreeNode<T, K>[]>;

// type Tree<T, K extends string = 'children'> = TreeNode<T, K>;

// type Tree<
//   NodeData extends Record<string, any>,
//   ChildKey extends string = 'children',
//   ChildData extends Record<string, any> = NodeData,
// > = NodeData & Record<ChildKey, Tree<NodeData, ChildKey, ChildData>[]>;

export interface BaseNodeData {
  path: string
  name: string
  stats: fs.Stats
  parent: BaseNodeData | null
}

/**
 * 树形结构节点类型
 * @template T - 节点数据类型
 * @template ChildKey - 子节点键名类型
 */
export type Tree<
  T extends Record<string, any> = BaseNodeData,
  ChildKey extends string | symbol = 'children'
> = T & Record<ChildKey, Tree<T, ChildKey>[]>;

/**
 * 目录读取配置选项
 * @template T - 节点数据类型
 * @template ChildKey - 子节点键名类型
 */
export interface Options<
  T extends Record<string, any> = BaseNodeData,
  ChildKey extends string | symbol = 'children'
> {
  /**
   * 子节点在树结构中的键名
   * @default 'children'
   */
  childrenKey?: ChildKey
  /**
   * 节点数据转换函数
   * @param path - 文件/目录的完整路径
   * @param name - 文件/目录名称
   * @param stats - 文件/目录的详细信息
   * @returns 转换后的节点数据
   */
  transform?: (fullpath: string, filename: string, stat: fs.Stats, parent?: Tree<T, ChildKey> | null) => MaybePromise<T>
  /**
   * 节点过滤函数
   * @param path - 文件/目录的完整路径
   * @param name - 文件/目录名称
   * @param stats - 文件/目录的详细信息
   * @returns 如果返回 true 则跳过该节点
   */
  shouldSkip?: (fullpath: string, filename: string, stat: fs.Stats) => MaybePromise<boolean>
}

/**
 * 迭代遍历时的队列项
 * @template T - 节点数据类型
 * @template ChildKey - 子节点键名类型
 */
export interface QueueItem<
  T extends Record<string, any>,
  ChildKey extends string | symbol = 'children'
> {
  /** 当前节点路径 */
  path: string
  /** 父节点引用 */
  parent: Tree<T, ChildKey> | null
}
