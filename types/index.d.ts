import { Stats } from 'fs'
import { Plugin, UserConfig as ViteUserConfig } from 'vite'
import { UserConfig as VitepressUserConfig, DefaultTheme, SiteConfig } from 'vitepress'


export interface UserConfig extends ViteUserConfig {
  vitepress: VitepressUserConfig<DefaultTheme.Config> & SiteConfig
}

export interface VitePluginOptions extends Plugin { }

export interface FileInfo {
  content?: string;
  name: string;
  create?: string;
  modify?: string;
  size?: string;
}

export interface SortOptions {
  order: 'asc' | 'desc';
  by: 'name' | 'create' | 'modify' | 'size' | 'content'
}

export interface Options {
  /**
   * 指定生成的 `bar` 替换原有的 `themeConfig.nav `和 `themeConfig.sidebar` ，或与原有的配置合并
   */
  type: 'merge' | 'replace';
  /**
   * 指定需要生成 `nav` 和 `sidebar` 的目录，默认值为 `srcDir` ，并排除该目录 `.vitepress`、`.git`、`node_modules`、`dist` 目录。优先级高于 `excluded`
   */
  included: string | string[] | RegExp | RegExp[] | ((absolutePath: string) => boolean);
  /**
   * 指定需要排除的目录，默认值为 `srcExclude` +  `.vitepress`、`.git`、`node_modules`、`dist` 目录。优先级低于 `included`
   */
  excluded: string | string[] | RegExp | RegExp[] | ((absolutePath: string) => boolean);
  /**
   * 在自定义排序或自定义标题时，如果需要依赖文件内容，可以设置为 `true` ，但这可能会极大的延长启动和更新时间，默认值为 `false`
   */
  useContent: boolean;
  /**
   * 对同级的 `bar` 进行排序，根据文件信息(文件名、创建时间、修改时间、文件大小、文件内容)排序，默认使用 node 读取到的文件顺序
   */
  sort: SortOptions | ((a: FileInfo, b: FileInfo) => number);
  /**
   * 根据文件名、创建时间、修改时间、文件大小、文件内容生成标题，默认以文件名为标题
   */
  text: (absolutePath: string, lastPathname: string) => string;
  /**
   * 同 `SidebarItem.collapsed`
   */
  collapsed: boolean | ((absolutePath: string) => boolean | void);
  /**
   * 配置当前的 `bar` 用于 `nav` 还是 `sidebar` 。默认一级目录(不包含文件)为 `nav` ，二级目录为 `sidebar` ，也可以通过函数配置
   */
  usedFor: { nav?: boolean; sidebar?: boolean } | ((absolutePath: string) => { nav?: boolean; sidebar?: boolean });
}


export interface NormalizeOptions extends Options {
  included: ((absolutePath: string) => boolean);
  excluded: ((absolutePath: string) => boolean);
  sort: (a: FileInfo, b: FileInfo) => number;
  text: (absolutePath: string, lastPathname: string) => string;
  collapsed: (absolutePath: string) => boolean | void;
  usedFor: (absolutePath: string) => { nav?: boolean; sidebar?: boolean };
}

export interface Item {
  [key: string]: any;
  __stats__: Stats
}

export interface DirTreeOptions<T extends Item = Item> {
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
