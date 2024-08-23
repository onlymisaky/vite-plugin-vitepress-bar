import path from 'path'
import { DefaultTheme } from 'vitepress'
import { Bar, NormalizeOptions } from '../types'
import { DirTreeItem, FileInfo } from '../core/read-dir-tree/types'
import { repeatTree } from '../core/repeat-tree'
import { sort } from './sort'

interface BarItem {
  text: string
  link?: string
  activeMatch?: string
  collapsed?: boolean
  items?: DefaultTheme.NavItem[]
  $paths: string[]
}

function getTextAndLink(fileInfo: FileInfo, options: NormalizeOptions) {
  const { filename, fullpath, parents: fileInfoParents } = fileInfo
  const [first, ...rest] = fileInfoParents
  const text = options.text(fileInfo)
  let link = rest.map((parent) => parent.filename).join('/') + '/' + path.basename(filename, path.extname(filename))

  if (!link.startsWith('/')) { link = '/' + link }
  if (link.endsWith('/index')) { link = link.slice(0, -6) }

  return { text, link, $paths: [...fileInfoParents.map((item) => item.fullpath), fullpath] }
}

function createBarItem<T extends DirTreeItem<'items'>>(
  item: T,
  index: number,
  parents: T[],
  options: NormalizeOptions
) {
  const fileInfo = item.__fileInfo__
  const { link, text, $paths } = getTextAndLink(fileInfo, options)
  const activeMatch = link
  const { stats, filename, children } = fileInfo

  const barItem: BarItem = {
    text,
    link,
    activeMatch,
    collapsed: undefined,
    items: [],
    $paths
  }

  if (stats.isFile() && /\.[mM][dD]$/.test(filename)) {
    delete barItem.collapsed
    delete barItem.items
    return barItem
  }

  if (stats.isDirectory()) {
    if (children.length === 0) {
      return void 0
    } else if (children.length === 1 && children[0].toLowerCase() === 'index.md') {
      delete barItem.collapsed
      return barItem
    } else {
      const collapsed = options.collapsed(fileInfo)
      if (typeof collapsed === 'boolean') {
        barItem.collapsed = collapsed
      } else {
        delete barItem.collapsed
      }

      const indexMd = children.find((child) => child.toLowerCase() === 'index.md')
      if (indexMd) {
        barItem.link = link
      }

      return barItem
    }
  }

  return void 0
}

export function genSilderbarAndNav<T extends DirTreeItem<'items'>>(result: T, options: NormalizeOptions) {
  let nav: Omit<BarItem, '$paths'>[] = []
  const sidebar: Omit<BarItem, '$paths'>[] = []
  repeatTree<'items', T>(result.items as T[], {
    childKey: 'items',
    parents: [],
    onItem: (item, index, parents) => {
      const genFor = options.genFor(item.__fileInfo__)
      if (!genFor || (!genFor.nav && !genFor.sidebar)) { return }
      const barItem = createBarItem(item, index, parents, options)
      if (!barItem) { return }
      const { $paths, ...data } = barItem
      if (genFor.nav) {
        if (!nav.find((item) => item.link === data.link)) {
          nav.push(data)
        }
      }
      if (genFor.sidebar) {
        if (!sidebar.find((item) => item.link === data.link)) {
          sidebar.push(data)
        }
      }
    },
    onBeforeChildren: (children, parents) => {
      if (options.useContent) {
        sort(children, options)
      }
    },
  })

  /**
   * TODO 
   *  1. 将 nav 转换成 tree 结构
   *  2. 将 sidebar 转换成 map 结构
   */

  return { nav, sidebar } as Bar
}
