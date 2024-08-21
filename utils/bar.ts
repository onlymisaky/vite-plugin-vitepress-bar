import * as fs from 'fs'
import * as path from 'path'
import { DefaultTheme } from 'vitepress'
import { NormalizeOptions } from '../types'
import { FileInfo } from '../core/read-dir-tree/types'
import { repeatTree } from '../core/repeat-tree'
import { sort } from './sort'

export function createNavItem(item: Required<FileInfo>, index: number, parents: Required<FileInfo>[], options: NormalizeOptions): DefaultTheme.NavItem {
  const text = options.text(item.__fullpath__, item.__filename__)
  const [first, ...rest] = parents
  const link = rest.map((item) => item.text).join('/') + '/' + path.basename(item.__filename__, '.md')
  return { text, link, activeMatch: link }
}

export function createSidebarItem(dir: string, filename: string, stats: fs.Stats, parents: Required<FileInfo>[], options: NormalizeOptions): DefaultTheme.SidebarItem {
  const [first, ...rest] = parents
  const text = options.text(dir, filename)

  const sidebarItem: DefaultTheme.SidebarItem = { text }
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

export function genSilderbarAndNav(result: FileInfo, options: NormalizeOptions) {
  const nav: DefaultTheme.NavItem[] = []
  let sidebar: DefaultTheme.Sidebar = []
  repeatTree<'items', FileInfo>(result.items as FileInfo[], {
    childKey: 'items',
    parents: [],
    onItem: (item, index, parents) => {
      // @ts-ignore
      const usedFor = options.usedFor(item.__fullpath__, item.__parents__, item.__children__)
      if (usedFor.nav) {
        // @ts-ignore
        const navItem = createNavItem(item, index, parents, options)
        nav.push(navItem)
      }
      if (usedFor.sidebar) {
        // @ts-ignore
        const sidebarItem = createSidebarItem(item.__fullpath__, item.__filename__, item.__stats__, parents, options)
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
