import { Plugin, UserConfig as ViteUserConfig } from 'vite'
import { UserConfig as VitepressUserConfig, DefaultTheme, SiteConfig } from 'vitepress'
import { FileInfo } from '../core/read-dir-tree/types'

export interface UserConfig extends ViteUserConfig {
  vitepress: VitepressUserConfig<DefaultTheme.Config> & SiteConfig
}

export interface VitePluginOptions extends Plugin { }

export interface SortItem {
  /**
   * 完整路径
   */
  fullpath: string;
  /**
   * 文件内容
   */
  content: string;
  /**
   * 创建时间
   */
  create: string;
  /**
   * 修改时间
   */
  modify: string;
  /**
   * 文件大小
   */
  size: string;
}

export interface SortOptions {
  order: 'asc' | 'desc';
  by: keyof SortItem;
}

interface Bar {
  sidebar: DefaultTheme.Sidebar;
  nav: DefaultTheme.NavItem[];
}

export interface Options {
  /**
   * 指定可以在 `nav` 和 `sidebar` 中显示的文件或目录
   * 继承自 `srcDir` 配置项，既只有能被 `vitepress` 读取到才会被读取
   * 如果是个空文件夹，将不会显示
   * 优先级高于 `excluded`
   * 支持绝对路径、正则、fast-glob、自定义函数
   */
  included: string | string[] | RegExp | RegExp[] | ((fullPath: string) => boolean);
  /**
   * 指定不在 `nav` 和 `sidebar` 中显示的文件或目录(这意味着只有知道该链接存在的人才能访问，恶意穷举除外)
   * 继承自 `srcExclude` 配置项，既 `vitepress` 排除的目录也会被排除
   * 优先级低于 `included`
   * 支持绝对路径、正则、fast-glob、自定义函数
   */
  excluded: string | string[] | RegExp | RegExp[] | ((fullPath: string) => boolean);
  /**
   * 在自定义排序和自定义标题时，如果需要依赖文件内容，可以设置为 `true`
   * 这将会延长启动、更新和构建时间
   * 默认值为 `false`
   */
  useContent: boolean;
  /**
   * 对同级的 `bar` 进行排序
   * 根据文件信息(文件名、创建时间、修改时间、文件大小、文件内容)排序
   * 默认使用 node 读取到的文件顺序
   */
  sort: SortOptions | ((a: SortItem, b: SortItem) => number);
  /**
   * 根据文件名、创建时间、修改时间、文件大小、文件内容生成标题
   * 默认以文件名为标题
   */
  text: (fileInfo: FileInfo) => string;
  /**
   * 同 `SidebarItem.collapsed`
   */
  collapsed: boolean | ((fileInfo: FileInfo) => boolean | void);
  /**
   * 配置当前文件或目录显示在 `nav` 还是 `sidebar` 中
   * 默认 `srcDir` 下一级文件和目录在 `nav` 中显示，二级目录在 `sidebar` 中显示
   */
  genFor: { nav?: boolean; sidebar?: boolean } | ((fileInfo: FileInfo) => { nav?: boolean; sidebar?: boolean });
  /**
   * 配置本插件生成的 `bar` 与原有的 `themeConfig.nav `和 `themeConfig.sidebar` 合并方式
   * 默认替换原有的 `themeConfig.nav `和 `themeConfig.sidebar`
   * 如果该函数了返回的 `nav` 和 `sidebar` 格式错误，则保持原有的 `themeConfig.nav `和 `themeConfig.sidebar`
   */
  genType: (source: Bar, target: Bar) => Bar;
}

export interface NormalizeOptions extends Options {
  included: ((fullPath: string) => boolean);
  excluded: ((fullPath: string) => boolean);
  sort: (a: SortItem, b: SortItem) => number;
  text: (fileInfo: FileInfo) => string;
  collapsed: (fileInfo: FileInfo) => boolean | void;
  genFor: (fileInfo: FileInfo) => { nav?: boolean; sidebar?: boolean };
}
