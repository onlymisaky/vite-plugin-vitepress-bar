import fg from 'fast-glob'
import { Plugin } from 'vite'
import { UserConfig, Options } from './types/index'
import { createBar } from './utils'
import { normalizeOptions } from './utils/normalize'
import { debounceCheckRestart } from './utils/check-restart'

export default (options?: Partial<Options>) => {

  const userConfig = normalizeOptions((options || {}) as Options)

  const plugin: Plugin = {
    name: 'vite-plugin-vitepress-bar',
    async config(config, event) {
      const viteConfig = config as UserConfig
      const vitepress = viteConfig.vitepress
      const { srcDir, userConfig: _userConfig, rewrites } = vitepress
      const { srcExclude } = _userConfig
      const _excluded = userConfig.excluded
      userConfig.excluded = (absolutePath: string) => {
        let excluded = _excluded(absolutePath)
        if (excluded) {
          return excluded
        }
        if (srcExclude) {
          const arr = fg.globSync(srcExclude)
          excluded = arr.some((item) => absolutePath.includes(item))
        }
        return excluded
      }
      const bar = await createBar(srcDir, userConfig)
      const { themeConfig } = viteConfig.vitepress.site;
      const { nav, sidebar } = userConfig.genType({ sidebar: themeConfig.sidebar, nav: themeConfig.nav, }, bar)
      viteConfig.vitepress.site.themeConfig.sidebar = sidebar
      viteConfig.vitepress.site.themeConfig.nav = nav
      return config
    },
    configureServer(server) {
      server.watcher.on('all', (eventName, filepath) => {
        debounceCheckRestart(eventName, filepath, server.restart, userConfig)
      })
    },
  }

  return plugin
}
