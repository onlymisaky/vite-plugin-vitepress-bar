import * as path from 'path'
import { DefaultTheme } from 'vitepress'
import { NormalizeOptions } from '../types'
import { DirTreeItem } from '../core/read-dir-tree/types'
import { repeatTree } from '../core/repeat-tree'
import { sort } from './sort'

export function createNavItem<T extends DirTreeItem<"items">>(
  item: T,
  index: number,
  parents: T[],
  options: NormalizeOptions
): DefaultTheme.NavItem {
  const fileInfo = item.__fileInfo__
  const { filename, parents: fileInfoParents } = fileInfo
  const text = options.text(fileInfo)
  const [first, ...rest] = fileInfoParents
  const link = rest.map((parent) => parent.filename).join('/') + '/' + path.basename(filename, '.md')
  return { text, link, activeMatch: link }
}

export function createSidebarItem<T extends DirTreeItem<"items">>(
  item: T,
  index: number,
  parents: T[],
  options: NormalizeOptions
): DefaultTheme.SidebarItem {
  const fileInfo = item.__fileInfo__
  const { stats, filename, parents: fileInfoParents } = fileInfo
  const [first, ...rest] = fileInfoParents
  const text = options.text(fileInfo)

  const sidebarItem: DefaultTheme.SidebarItem = { text }
  if (stats.isFile() && filename.toLowerCase().endsWith('.md')) {
    const link = rest.map((parent) => parent.filename).join('/') + '/' + path.basename(filename, '.md')
    sidebarItem.link = link
  }
  if (stats.isDirectory()) {
    const collapsed = options.collapsed(fileInfo)
    if (typeof collapsed === 'boolean') {
      sidebarItem.collapsed = collapsed
    }
  }
  return sidebarItem
}

export function genSilderbarAndNav<T extends DirTreeItem<'items'>>(result: T, options: NormalizeOptions) {
  const nav: DefaultTheme.NavItem[] = []
  let sidebar: DefaultTheme.Sidebar = []
  repeatTree<'items', T>(result.items as T[], {
    childKey: 'items',
    parents: [],
    onItem: (item, index, parents) => {
      const usedFor = options.usedFor(item.__fileInfo__)
      if (usedFor.nav) {
        const navItem = createNavItem(item, index, parents, options)
        nav.push(navItem)
      }
      if (usedFor.sidebar) {
        const sidebarItem = createSidebarItem(item, index, parents, options)
        sidebar.push(sidebarItem)
      }
    },
    onBeforeChildren: (children, parents) => {
      if (options.useContent) {
        sort(children, options)
      }
    },
  })
  return { nav, sidebar }
}
