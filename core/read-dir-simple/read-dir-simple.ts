/**
 * 读取目录
 * 妥协了，在前几个版本中，总是想在读取过程中做一些事情
 * 比如：生成自定义子节点、排序、过滤等操作，这些操作会极大程度的增加函数实现的复杂度
 * 虽然一遍读取，一边做上述这些操作可以减少后续的迭代操作，但是收益并不大
 * 所以，简简单单的实现就好了
 */

import { readDirTreeRecursive } from './read-dir-recursive'
import { readDirTreeIterative } from './read-dir-iterative'

import { BaseNodeData, Options, TraversalType } from './types'
import { normalizeOptions } from './utils'

/**
 * 读取目录树
 * @template T - 节点数据类型
 * @template ChildKey - 子节点键名类型
 * @param dir - 目录路径
 * @param options - 配置选项
 * @returns 目录树结构
 */
export async function readDirTree<
  T extends Record<string, any> = BaseNodeData,
  ChildKey extends string | symbol = 'children'
>(dir: string, options: Options<T, ChildKey> & { type?: TraversalType }) {
  const { type = 'iterative', ...rest } = options
  return type === 'recursive'
    ? await readDirTreeRecursive(dir, normalizeOptions(rest))
    : await readDirTreeIterative(dir, normalizeOptions(rest))
}
