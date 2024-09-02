import fg from 'fast-glob'
import { Plugin } from 'vite'
import { Options, UserConfig } from './types/index'
import { createBar } from './utils'
import { debounceCheckRestart } from './utils/check-restart'
import { normalizeOptions } from './utils/normalize'

export default (options?: Partial<Options>) => {

  const userConfig = normalizeOptions((options || {}) as Options)

  const plugin: Plugin = {
    name: 'vite-plugin-vitepress-bar',
    async config(config, event) {
      const viteConfig = config as UserConfig
      const vitepress = viteConfig.vitepress
      const { srcDir, userConfig: _userConfig, rewrites } = vitepress
      const { srcExclude } = _userConfig
      const excludedFn = userConfig.excluded
      userConfig.excluded = (fullPath: string) => {
        if (fullPath === srcDir) {
          return false
        }
        let excluded = excludedFn(fullPath)
        if (excluded) {
          return excluded
        }
        if (srcExclude) {
          const matchedFiles = fg.sync(srcExclude)
          excluded = matchedFiles.some((item) => fullPath.endsWith(item))
        }
        return excluded
      }
      const bar = await createBar(srcDir, userConfig)
      const { themeConfig } = viteConfig.vitepress.site
      const { nav, sidebar } = userConfig.genType({
        sidebar: themeConfig.sidebar,
        nav: themeConfig.nav,
      }, bar)
      themeConfig.sidebar = sidebar
      themeConfig.nav = nav
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
