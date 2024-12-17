import type { UserConfig as ViteUserConfig } from 'vite'
import type { DefaultTheme, SiteConfig, UserConfig as VitepressUserConfig } from 'vitepress'
import type { FileInfoSlim, MaybePromise } from './shared'

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

export interface PluginOptions {
  /**
   * 设置当前文件或目录是否在 `nav` 和 `sidebar` 中显示
   * 继承自 `srcDir` 配置项，既只有能被 `vitepress` 读取到才会被读取
   * 如果是个空文件夹，将不会显示
   * 优先级高于 `excluded`
   * 支持绝对路径、正则、fast-glob、自定义函数
   */
  included: string | string[] | RegExp | RegExp[] | ((fileInfo: FileInfoSlim) => MaybePromise<boolean>)
  /**
   * 设置当前文件或目录是否在 `nav` 和 `sidebar` 中显示(这意味着只有知道该链接存在的人才能访问，恶意穷举除外)
   * 继承自 `srcExclude` 配置项，既 `vitepress` 排除的目录也会被排除
   * 优先级低于 `included`
   * 支持绝对路径、正则、fast-glob、自定义函数
   */
  excluded: string | string[] | RegExp | RegExp[] | ((fileInfo: FileInfoSlim) => MaybePromise<boolean>)

  /**
   * `bar` 生成后的回调
   * 如果传入该配置项，则会将该函数的返回值作为 `nav` 和 `sidebar` 覆盖原有的配置
   * 如果不传入该配置项，则会将生成的 `bar` 覆盖原有的 `nav` 和 `sidebar`
   */
  complete: (bar: Bar) => { sidebar: DefaultTheme.Sidebar, nav: DefaultTheme.NavItem[] }
}

export interface NormalizePluginOptions extends PluginOptions {
  included: (fileInfo: FileInfoSlim) => MaybePromise<boolean>
  excluded: (fileInfo: FileInfoSlim) => MaybePromise<boolean>
}
