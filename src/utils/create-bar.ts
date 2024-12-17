import type { DefaultTheme } from 'vitepress'
import type { Bar, NavItem, NormalizePluginOptions, SidebarMulti } from '../types'
import type { FileInfo } from '../types/shared'
import { readDirTree } from '../core/read-dir-tree/index'
import { isNeedProcess } from './is-need-process'
import { mdReg } from './normalize'

function setSidebarMulti(
  sidebarMulti: SidebarMulti,
  key: string,
  value: DefaultTheme.SidebarItem,
): void {
  if (key in sidebarMulti) {
    sidebarMulti[key].push(value)
  }
  else {
    sidebarMulti[key] = [value]
  }
}

function getLinkPrefixByParent(parent: FileInfo | null | undefined, root: string): string {
  if (!parent) {
    return '/'
  }
  let link = '/'
  let _parent: FileInfo | null | undefined = parent
  while (_parent && _parent.path !== root) {
    link = `/${_parent.name}/${link}`
    _parent = _parent.parent
  }
  return link
}

interface NodeData {
  text: string
  link?: string
  items?: NodeData[]
  activeMatch: string
  collapsed?: boolean
}

export function createBar(
  srcDir: string,
  options: NormalizePluginOptions,
  srcExclude: string[] | undefined,
): Promise<Bar> {
  const root = srcDir

  return readDirTree<NodeData, 'items'>(root, {
    childrenKey: 'items',
    type: 'iterative',
    async shouldSkip(fileInfo) {
      // 不是 md 文件
      if (fileInfo.stat.isFile() && !mdReg.test(fileInfo.name)) {
        return true
      }
      // 空文件夹
      if (fileInfo.stat.isDirectory() && fileInfo.files?.length === 0) {
        return true
      }

      const skip = !(await isNeedProcess(fileInfo, options, { srcDir, srcExclude }))
      return skip
    },
    transform: (fileInfo) => {
      // 根节点
      if (fileInfo.path === root) {
        return {
          text: fileInfo.name,
          link: '/',
          activeMatch: '/',
        }
      }

      const text = fileInfo.name.replace(mdReg, '')
      const link = getLinkPrefixByParent(fileInfo.parent, root) + text

      const nodeData: NodeData = {
        text,
        link,
        activeMatch: link,
      }

      if (fileInfo.stat.isDirectory()) {
        const hasIndex = fileInfo.files.some(item => item.toLowerCase() === 'index.md')
        // 没有 index.md 的文件夹, 需要删除 link
        if (!hasIndex) {
          delete nodeData.link
        }
      }

      if (fileInfo.stat.isFile()) {
        const isIndex = fileInfo.name.toLowerCase() === 'index.md'
        // 除了根目录下的 index.md 文件，不在结果中展示
        // 因为已经为父级节点设置了 link
        if (isIndex && fileInfo.path !== root) {
          return null
        }
      }

      return nodeData
    },
  }).then((res) => {
    if (!res) {
      const nav: NavItem[] = []
      const sidebar: SidebarMulti = {}
      const bar: Bar = { nav, sidebar }
      return bar
    }

    const nav = res.items.filter(item => !item.link?.toLowerCase().endsWith('/index')).map(({ link, items, ...item }) => {
      if (link) {
        return {
          link,
          ...item,
        } as DefaultTheme.NavItemWithLink
      }
      return {
        items,
        ...item,
      } as DefaultTheme.NavItemChildren
    })

    // 将 nav 作为 sidebar 的 key
    const sidebar = res.items.reduce((sidebarMulti, cur) => {
      const { text, activeMatch, link, items } = cur

      // 你是来捣乱的吧 (空文件夹，正常情况不会出现，因为 shouldSkip 已经排除掉了)
      if (!link && !items) {
        return sidebarMulti
      }

      // 首页
      if (text.toLowerCase() === 'index' || text === '') {
        return sidebarMulti
      }

      // 根目录下的 md 文件，属于未分类的情况
      if (!items) {
        setSidebarMulti(sidebarMulti, `/`, cur as unknown as DefaultTheme.SidebarItem)
        return sidebarMulti
      }

      setSidebarMulti(sidebarMulti, activeMatch, cur as unknown as DefaultTheme.SidebarItem)

      return sidebarMulti
    }, { '/': [] } as SidebarMulti)

    const bar: Bar = { nav, sidebar }

    return bar
  })
}
