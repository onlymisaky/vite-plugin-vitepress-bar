import { MaybePromise, FileInfo, Tree } from '../../types/shared'

export { FileInfo, Tree }

export type TraversalType = 'recursive' | 'iterative'

/**
 * 目录读取配置选项
 * @template T - 节点数据类型
 * @template ChildKey - 子节点键名类型
 */
export interface Options<
  T extends Record<string, any> = FileInfo,
  ChildKey extends string | symbol = 'children'
> {
  /**
   * 子节点在树结构中的键名
   * @default 'children'
   */
  childrenKey?: ChildKey
  /**
   * 节点过滤函数
   * @param path - 文件/目录的完整路径
   * @param name - 文件/目录名称
   * @param stats - 文件/目录的详细信息
   * @returns 如果返回 true 则跳过该节点
   */
  shouldSkip?: (fileInfo: FileInfo, parentNode: Tree<T, ChildKey> | null) => MaybePromise<boolean>
  /**
   * 节点数据转换函数
   * @param path - 文件/目录的完整路径
   * @param name - 文件/目录名称
   * @param stats - 文件/目录的详细信息
   * @returns 转换后的节点数据
   */
  transform?: (fileInfo: FileInfo, parentNode: Tree<T, ChildKey> | null) => MaybePromise<T>
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
  parentNode: Tree<T, ChildKey> | null,
  parentFileInfo: FileInfo | null
}
