import { Stats } from 'fs'

export interface FileInfo {
  stats: Stats,
  fullpath: string,
  filename: string,
  children: string[],
  parents: FileInfo[]
  content: string
}

export interface WithFileInfo {
  __fileInfo__: FileInfo
  [key: string]: any
}

type DirTreeItem<ChildKey extends string = 'children'> = {
  [key in ChildKey]?: DirTreeItem<ChildKey>[]
} & WithFileInfo

export type ProcessError = 'record' | 'ignore' | 'throw';

export interface DirTreeOptions<ChildKey extends string, T extends DirTreeItem<ChildKey>> {
  /**
   * 当 fs.stat 出错时，如何处理错误
   * 默认为 ignore
   * record：记录错误，并继续执行
   * ignore：忽略错误，并继续执行
   * throw：抛出错误，并终止执行
   */
  processStatsError?: ProcessError;
  /**
   * 当 fs.readdir 出错时，如何处理错误
   * 默认为 ignore
   * record：记录错误，并继续执行
   * ignore：忽略错误，并继续执行
   * throw：抛出错误，并终止执行
   */
  processReadDirError?: ProcessError;
  /**
   * `fs.stat` 回调
   * 返回结果将会作为 `onReadDir` 的参数 `postStats` 的值
   * 无论是否传入该函数，无论传入的函数是否有返回值，都会返回一个含有只读属性 `__fileInfo__` 的对象
   * @param fullPath 当前文件路径
   * @param filename 文件名
   * @param stats 文件 stats 信息
   * @param parents 所有父级，处理后的文件信息
   */
  onStats?: (fullPath: string, filename: string, stats: Stats, parents: T[]) => T;
  /**
   * 根据路径和 stat 信息 判断是否跳过 fs.readdir
   * 如果跳过 readDir，则不会执行 onReadDir 回调
   * 默认不跳过
   */
  isSkip?: (fullPath: string, filename: string, stats: Stats, parents: T[]) => boolean;
  /**
   * `fs.readdir` 回调
   * 返回结果将会作为 tree-item
   * 无论是否传入该函数，无论传入的函数是否有返回值，都会返回一个含有只读属性 `__fileInfo__` 和 `[childKey]` 属性的对象
   * @param fullPath 当前文件路径
   * @param filename 文件名
   * @param postStats onStats 的返回值
   * @param parents 所有父级，处理后的文件信息
   * @param childFiles 子文件列表
   */
  onReadDir?: (fullPath: string, filename: string, postStats: T, parents: T[], childFiles: string[]) => T;
  /**
  * 子节点 key
  * 默认为 children
  */
  childKey?: ChildKey;
  /**
   * 子节点生成完毕时的回调
   * 返回结果将会作为新的子节点数组
   */
  onChildren?: (fullPath: string, filename: string, postStats: T, parents: T[], childFiles: string[], children: T[]) => T[];
  /**
   * 目录树全部生成完毕时的回调
   */
  onComplete?: (tree: T, errors: ErrorItem[]) => void;
}

export interface ErrorItem {
  path: string;
  type: 'readdir' | 'stat';
  error: Error;
}
