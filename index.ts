import { Plugin, UserConfig as ViteUserConfig } from 'vite'
import { VitePluginOptions, UserConfig, Options } from './types/index'
import { getStatTree } from './utils/index'
import { normalizeOptions } from './utils/normalize'
import fg from 'fast-glob'

export default (options?: Partial<Options>) => {
  let resolve, reject
  const promise = new Promise<Plugin>((res, rej) => {
    resolve = res
    reject = rej
  })

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
      const { sidebar, nav } = await getStatTree(srcDir, userConfig)
      viteConfig.vitepress.site.themeConfig.sidebar = sidebar
      viteConfig.vitepress.site.themeConfig.nav = nav
      return config
    },
    configureServer(server) {
      server.watcher.on('all', (eventName, path, stats) => {
        const events = ['add', 'addDir', 'unlink', 'unlinkDir']
        if (!events.includes(eventName)) {
          return
        }
      })
      // const { watcher, restart } = server
      // watcher.add()
    },
  }
  resolve(plugin)
  return plugin
}
