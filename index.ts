import { Plugin } from 'vite'
import { PluginOptions, UserConfig } from './types/index'
import { createBar } from './utils'
import { debounceCheckRestart } from './utils/check-restart'
import { normalizePluginOptions } from './utils/normalize'

export default (pluginOptions?: Partial<PluginOptions>) => {

  const normalizePluginConfig = normalizePluginOptions((pluginOptions || {}) as PluginOptions)
  let srcDir = ''
  let srcExclude: string[] | undefined

  const plugin: Plugin = {
    name: 'vite-plugin-vitepress-bar',
    async config(config, env) {
      const viteConfig = config as UserConfig
      const vitepress = viteConfig.vitepress
      const { userConfig } = vitepress
      srcDir = vitepress.srcDir
      srcExclude = userConfig.srcExclude
      const { sidebar, nav } = await createBar(srcDir, normalizePluginConfig, srcExclude)
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
