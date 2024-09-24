import { Plugin } from 'vite'
import { PluginOptions, UserConfig } from './types/index'
import { createBar } from './utils'
import { debounceCheckRestart } from './utils/check-restart'
import { normalizePluginOptions, postProcessOptions } from './utils/normalize'

export default (pluginOptions?: Partial<PluginOptions>) => {

  const normalizePluginConfig = normalizePluginOptions((pluginOptions || {}) as PluginOptions)

  const plugin: Plugin = {
    name: 'vite-plugin-vitepress-bar',
    async config(config, env) {
      const viteConfig = config as UserConfig
      const vitepress = viteConfig.vitepress
      const { srcDir, userConfig } = vitepress
      const { srcExclude } = userConfig
      postProcessOptions(normalizePluginConfig, { srcDir, srcExclude })
      const bar = await createBar(srcDir, normalizePluginConfig)
      const { themeConfig } = viteConfig.vitepress.site
      const { nav, sidebar } = normalizePluginConfig.genType({
        sidebar: themeConfig.sidebar,
        nav: themeConfig.nav,
      }, bar)
      themeConfig.sidebar = sidebar
      themeConfig.nav = nav
      return config
    },
    configureServer(server) {
      server.watcher.on('all', (eventName, filepath) => {
        debounceCheckRestart(eventName, filepath, server.restart, normalizePluginConfig)
      })
    },
  }

  return plugin
}
