import { Stats } from 'fs'

export interface FileInfo {
  [key: string]: any;
  __stats__?: Stats,
  __fullpath__?: string,
  __filename__?: string,
  __children__?: string[],
  __parents__?: any[]
}

export interface Options<T extends FileInfo = FileInfo> {
  /**
   * 当 fs.stat 出错时，如何处理错误
   * 默认为 ignore
   * record：记录错误，并继续执行
   * ignore：忽略错误，并继续执行
   * throw：抛出错误，并终止执行
   */
  processStatsError?: 'record' | 'ignore' | 'throw';
  /**
   * 当 fs.readdir 出错时，如何处理错误
   * 默认为 ignore
   * record：记录错误，并继续执行
   * ignore：忽略错误，并继续执行
   * throw：抛出错误，并终止执行
   */
  processReadDirError?: 'record' | 'ignore' | 'throw';
  /**
   * fs.stat 回调
   * 返回结果将会作为 onReadDir 的参数 postStats 的值
   * 默认为返回 { __stats__: stats }
   */
  onStats?: (absolutePath: string, filename: string, stats: Stats, parents: T[]) => T;
  /**
   * 根据路径和 stat 信息 判断是否跳过 fs.readdir
   * 如果跳过 readDir，则不会执行 onReadDir 回调
   * 默认不跳过
   */
  isSkip?: (absolutePath: string, filename: string, stats: Stats, parents: T[]) => boolean;
  /**
   * fs.readdir 回调
   * 返回结果将会作为 tree-item
   * 默认为返回 { file: string, name: string, stats: stats }
   */
  onReadDir?: (absolutePath: string, filename: string, postStats: T, parents: T[], childFiles: string[]) => T;
  /**
  * 子节点 key
  * 默认为 children
  */
  childKey?: string;
  /**
   * 子节点生成完毕时的回调
   * 返回结果将会作为新的子节点数组
   */
  onChildren?: (absolutePath: string, filename: string, postStats: T, parents: T[], childFiles: string[], children: T[]) => T[];
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
