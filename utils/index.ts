import * as fs from 'fs'
import * as path from 'path'
import { DefaultTheme } from 'vitepress'
import { FileInfo, NormalizeOptions, } from '../types'
import { dirTree, defineStats } from './dirTree'



type BarItem = {
  // text: string,
  // links: string,
  // items?: BarItem[],
  // collapsed?: boolean,
  // docFooterText?: string,
  // base?: string,
  // rel?: string,
  // target?: string,
  __stats__: fs.Stats
} & DefaultTheme.SidebarItem

function genSilderbarAndNav(result: BarItem) {
  // TODO
  const sidebar: DefaultTheme.Sidebar = result.items as DefaultTheme.Sidebar
  const nav: DefaultTheme.NavItem[] = []
  return { sidebar, nav }
}

function isNeedProcess(absolutePath: string, options: NormalizeOptions) {
  const included = options.included(absolutePath)
  const excluded = options.excluded(absolutePath)
  const exists = fs.existsSync(absolutePath)

  if (!exists) return false
  if (!included) return false
  if (excluded) return false

  return true
}

function createSidebarItem(dir: string, filename: string, stats: fs.Stats, parents: BarItem[], options: NormalizeOptions): BarItem {
  const [first, ...rest] = parents
  const text = options.text(dir, filename)

  const sidebarItem = defineStats({ text }, stats) as BarItem
  if (stats.isFile() && filename.toLowerCase().endsWith('.md')) {
    const link = rest.map((item) => item.text).join('/') + '/' + path.basename(filename, '.md')
    sidebarItem.link = link
  }
  if (stats.isDirectory()) {
    const collapsed = options.collapsed(dir)
    if (typeof collapsed === 'boolean') {
      sidebarItem.collapsed = collapsed
    }
  }
  return sidebarItem
}

export function getStatTree(filepath, options: NormalizeOptions): Promise<{
  sidebar: DefaultTheme.Sidebar,
  nav: DefaultTheme.NavItem[]
}> {
  const absolutePath = path.resolve(process.cwd(), filepath)
  return new Promise((resolve, reject) => {
    dirTree<BarItem>(absolutePath, {
      processStatsError: 'record',
      processReadDirError: 'record',
      onStats: (dir, filename, stats, parents) => {
        return createSidebarItem(dir, filename, stats, parents, options)
      },
      onReadDir: (dir, filename, postStats, parnets, childFiles) => {
        return postStats
      },
      isSkip: (dir, filename, stats, parents) => !isNeedProcess(dir, options),
      childKey: 'items',
      onChildren: (dir, filename, postStats, parents, childFiles, children) => {
        return children.sort((a, b) => {
          try {
            const aStats = a.__stats__
            const bStats = b.__stats__
            const _a: FileInfo = {
              name: a.text as string,
              create: aStats.ctime.getTime() + '',
              modify: aStats.mtime.getTime() + '',
              size: aStats.size + ''
            }
            const _b: FileInfo = {
              name: b.text as string,
              create: bStats.ctime.getTime() + '',
              modify: bStats.mtime.getTime() + '',
              size: bStats.size + '',
            }
            return options.sort(_a, _b)
          } catch (error) {
            return 0
          }
        })
      },
      onComplete(result, errors) {
        resolve(genSilderbarAndNav(result))
      }
    })
  })
}
