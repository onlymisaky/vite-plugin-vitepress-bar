import type { Plugin } from 'vitepress'
import type { PluginOptions, UserConfig } from './types/index'
import { toPosixPath } from './core/read-dir-tree/utils'
import { debounceCheckRestart } from './utils/check-restart'
import { createBar } from './utils/create-bar'
import { normalizePluginOptions } from './utils/normalize'

export default function vitepressBar(pluginOptions?: Partial<PluginOptions>): Plugin {
  const normalizePluginConfig = normalizePluginOptions((pluginOptions || {}) as PluginOptions)
  let srcDir = ''
  let srcExclude: string[] | undefined

  const plugin: Plugin = {
    name: 'vite-plugin-vitepress-bar',
    async config(config) {
      const viteConfig = config as UserConfig
      const vitepress = viteConfig.vitepress
      const { userConfig } = vitepress
      srcDir = toPosixPath(vitepress.srcDir)
      srcExclude = userConfig.srcExclude
      const bar = await createBar(srcDir, normalizePluginConfig, srcExclude)
      const { sidebar, nav } = normalizePluginConfig.complete(bar)
      const { themeConfig } = viteConfig.vitepress.site
      themeConfig.sidebar = sidebar
      themeConfig.nav = nav
      return config
    },
    configureServer(server) {
      server.watcher.on('all', (eventName, filepath) => {
        debounceCheckRestart(eventName, filepath, server.restart, normalizePluginConfig, { srcDir, srcExclude })
      })
    },
  }

  return plugin
}
