import { Plugin } from 'vite'
import { Options, UserConfig } from './types/index'
import { createBar } from './utils'
import { debounceCheckRestart } from './utils/check-restart'
import { normalizePluginOptions, postProcessOptions } from './utils/normalize'

export default (pluginOptions?: Partial<Options>) => {

  const pluginConfig = normalizePluginOptions((pluginOptions || {}) as Options)

  const plugin: Plugin = {
    name: 'vite-plugin-vitepress-bar',
    async config(config, env) {
      const viteConfig = config as UserConfig
      const vitepress = viteConfig.vitepress
      const { srcDir, userConfig } = vitepress
      const { srcExclude } = userConfig
      postProcessOptions(pluginConfig, { srcDir, srcExclude })
      const bar = await createBar(srcDir, pluginConfig)
      const { themeConfig } = viteConfig.vitepress.site
      const { nav, sidebar } = pluginConfig.genType({
        sidebar: themeConfig.sidebar,
        nav: themeConfig.nav,
      }, bar)
      themeConfig.sidebar = sidebar
      themeConfig.nav = nav
      return config
    },
    configureServer(server) {
      server.watcher.on('all', (eventName, filepath) => {
        debounceCheckRestart(eventName, filepath, server.restart, pluginConfig)
      })
    },
  }

  return plugin
}
