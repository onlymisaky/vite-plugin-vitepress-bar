import type { UserConfig as ViteUserConfig } from 'vite'
import type { DefaultTheme, SiteConfig, UserConfig as VitepressUserConfig } from 'vitepress'
import type { FileInfo, MaybePromise } from './shared'

export interface UserConfig extends ViteUserConfig {
  vitepress: VitepressUserConfig<DefaultTheme.Config> & SiteConfig
}

export type NavItem = DefaultTheme.NavItemChildren | DefaultTheme.NavItemWithLink

export interface SidebarMulti {
  [key: string]: DefaultTheme.SidebarItem[]
}

export interface Bar {
  sidebar: SidebarMulti
  nav: NavItem[]
}

type FilterCondition =
  | string // 精确路径匹配
  | string[] // 多个路径匹配
  | RegExp // 正则匹配
  | RegExp[] // 多个正则匹配
  | ((fileInfo: FileInfo) => MaybePromise<boolean>) // 自定义函数匹配

export interface PluginOptions {
  /**
   * 文件过滤器，用于精确控制文件在 `nav` 和 `sidebar` 中显示
   * 继承自 `srcDir` 配置项，既只有能被 `vitepress` 读取到才会被读取
   * 如果是个空文件夹，将不会显示
   */
  filter: (fileInfo: FileInfo) => MaybePromise<boolean>
  /**
   * `bar` 生成后的回调
   * 如果传入该配置项，则会将该函数的返回值作为 `nav` 和 `sidebar` 覆盖原有的配置
   * 如果不传入该配置项，则会将生成的 `bar` 覆盖原有的 `nav` 和 `sidebar`
   */
  complete: (bar: Bar) => { sidebar: DefaultTheme.Sidebar, nav: DefaultTheme.NavItem[] }
}

export interface NormalizePluginOptions extends PluginOptions {
  filter: (fileInfo: FileInfo) => MaybePromise<boolean>
}
