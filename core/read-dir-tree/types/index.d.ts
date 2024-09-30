import { Stats } from 'fs'
import { Tree } from './../../../types/shared.d'

export interface FileInfo {
  filename: string
  fullpath: string
  stat: Stats
  parents: FileInfo[]
  files?: string[]
}

export type ProcessError = 'record' | 'ignore' | 'throw'

export interface ReadDirTreeOptions<
  K extends string,
  T extends object = FileInfo,
  R extends object = T
> {
  /**
   * 当 `fs.stat` 出错时，如何处理错误
   * 默认为 `ignore`
   * `record`: 记录错误，并继续执行
   * `ignore`: 忽略错误，并继续执行
   * `throw`: 抛出错误，并终止执行
   */
  handleStatErrorType: ProcessError
  /**
   * 当 `fs.readdir` 出错时，如何处理错误
   * 默认为 `ignore`
   * `record`: 记录错误，并继续执行
   * `ignore`: 忽略错误，并继续执行
   * `throw`: 抛出错误，并终止执行
   */
  handleReadDirErrorType: ProcessError
  /**
  * 子节点 key
  * 默认为 children
  */
  childKey: K
  /**
   * 根据路径、 `stat` 、 `parents` 判断是否跳过 当前文件夹及其子孙文件夹
   * 如果跳过，当前文件夹及其子孙文件夹不会出现在最终的结果中
   * 默认不跳过
   * @param fullpath 当前文件路径
   * @param filename 当前文件名
   * @param stat 当前文件 stat 信息
   * @param parents 当前文件的所有父级，类型为 `onReadDir` 的返回值
   * @returns 
   */
  isSkip: (
    fullpath: string,
    filename: string,
    stat: Stats,
    parents: Tree<K, R>[],
  ) => boolean
  /**
   * `fs.stat` 或 `fs.readdir` 回调
   * 如果当前路径是文件，将会作为 `fs.stat` 的回调
   * 如果当前路径是文件夹，将会作为 `fs.readdir` 的回调
   * 如果没有传入该函数，或传入的函数返回值为 `undefined` ，将会默认返回类型为 `FileInfo` 的对象
   * 如果传入的函数返回值为类型不是 `Object` 将会包装为 { value: R } 返回
   * @param fullpath 当前文件路径
   * @param filename 当前文件名
   * @param stat 当前文件 stat 信息
   * @param parents 当前文件的所有父级，类型为 `onRead` 的返回值
   * @param files 当前文件夹读取到的子文件列表
   */
  onRead: (
    fullpath: string,
    filename: string,
    stat: Stats,
    parents: Tree<K, R>[],
    files?: string[]
  ) => R | void
  /**
   * 子节点生成完毕时的回调
   * 返回结果将会作为新的子节点数组
   * 可以在该函数中对 `children` 做一些额外处理
   * 如果没有传入该函数，或该函数的返回值不是一个数组，则会将参数中的 `children` 直接返回
   * @param fullpath 当前文件夹路径
   * @param filename 当前文件夹名
   * @param readResult 当前文件夹 onRead 的返回值
   * @param parents 当前文件夹的所有父级，类型为 `onReadDir` 的返回值
   * @param files 当前文件夹读取到的子文件列表
   * @param children 当前文件夹处理完成的子节点数组
   * @returns 
   */
  onChildren: (
    fullpath: string,
    filename: string,
    stat: Stats,
    readResult: Tree<K, R>,
    parents: Tree<K, R>[],
    files: string[],
    children: Tree<K, R>[]
  ) => Tree<K, T | R>[] | void
  /**
   * 目录树全部生成完毕时的回调
   */
  onComplete?: (
    tree: Tree<K, T | R>,
    errors: ErrorItem[]
  ) => void
}

export type NormalizeOnRead<
  K extends string,
  T extends object = FileInfo,
  R extends object = T
> = (...args: Parameters<ReadDirTreeOptions<K, T, R>['onRead']>) => Tree<K, R>

export type NormalizeOnChildren<
  K extends string,
  T extends object = FileInfo,
  R extends object = T
> = (...args: Parameters<ReadDirTreeOptions<K, T, R>['onChildren']>) => Tree<K, T | R>[]

export type WalkDone<
  K extends string,
  T extends object = FileInfo,
  R extends object = T
> = (tree: Tree<K, T | R>) => void

export type WalkOptions<
  K extends string,
  T extends object = FileInfo,
  R extends object = T
> = Omit<ReadDirTreeOptions<K, T, R>, 'onRead' | 'onChildren' | 'onComplete'> & {
  onRead: NormalizeOnRead<K, T, R>,
  onChildren: NormalizeOnChildren<K, T, R>,
  done: WalkDone<K, T, R>,
}

export interface ErrorItem {
  path: string
  type: 'readdir' | 'stat'
  error: Error
}
