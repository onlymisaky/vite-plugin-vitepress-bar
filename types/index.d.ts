import { Plugin, UserConfig as ViteUserConfig } from 'vite'
import { UserConfig as VitepressUserConfig, DefaultTheme, SiteConfig } from 'vitepress'
import { FileInfo } from '../core/read-dir-tree/types'

export interface UserConfig extends ViteUserConfig {
  vitepress: VitepressUserConfig<DefaultTheme.Config> & SiteConfig
}

export interface VitePluginOptions extends Plugin { }

export interface SortItem {
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

interface Bar {
  sidebar: DefaultTheme.Sidebar;
  nav: DefaultTheme.NavItem[];
}

export interface Options {
  /**
   * 生成的 `bar` 与原有的 `themeConfig.nav `和 `themeConfig.sidebar` 生成新的 `bar` ，默认替换原有的 `bar`
   */
  genType: (source: Bar, target: Bar) => Bar;
  /**
   * 指定需要生成 `nav` 和 `sidebar` 的目录，默认值为 `srcDir` ，并排除该目录 `.vitepress`、`.git`、`node_modules`、`dist` 目录。优先级高于 `excluded`
   */
  included: string | string[] | RegExp | RegExp[] | ((fullPath: string) => boolean);
  /**
   * 指定需要排除的目录，默认值为 `srcExclude` +  `.vitepress`、`.git`、`node_modules`、`dist` 目录。优先级低于 `included`
   */
  excluded: string | string[] | RegExp | RegExp[] | ((fullPath: string) => boolean);
  /**
   * 在自定义排序或自定义标题时，如果需要依赖文件内容，可以设置为 `true` ，但这可能会极大的延长启动和更新时间，默认值为 `false`
   */
  useContent: boolean;
  /**
   * 对同级的 `bar` 进行排序，根据文件信息(文件名、创建时间、修改时间、文件大小、文件内容)排序，默认使用 node 读取到的文件顺序
   */
  sort: SortOptions | ((a: SortItem, b: SortItem) => number);
  /**
   * 根据文件名、创建时间、修改时间、文件大小、文件内容生成标题，默认以文件名为标题
   */
  text: (fileInfo: FileInfo) => string;
  /**
   * 同 `SidebarItem.collapsed`
   */
  collapsed: boolean | ((fileInfo: FileInfo) => boolean | void);
  /**
   * 配置当前的 `bar` 用于 `nav` 还是 `sidebar` 
   * 默认一级目录(不包含文件)为 `nav` ，二级目录为 `sidebar`
   * 
   */
  genFor: { nav?: boolean; sidebar?: boolean } | ((fileInfo: FileInfo) => { nav?: boolean; sidebar?: boolean });
}

export interface NormalizeOptions extends Options {
  included: ((fullPath: string) => boolean);
  excluded: ((fullPath: string) => boolean);
  sort: (a: SortItem, b: SortItem) => number;
  text: (fileInfo: FileInfo) => string;
  collapsed: (fileInfo: FileInfo) => boolean | void;
  genFor: (fileInfo: FileInfo) => { nav?: boolean; sidebar?: boolean };
}
