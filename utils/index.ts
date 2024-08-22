import * as fs from 'fs'
import * as path from 'path'
import { DefaultTheme } from 'vitepress'
import { NormalizeOptions } from '../types'
import { DirTreeItem } from '../core/read-dir-tree/types'
import { readDirTree } from '../core/read-dir-tree'
import { genSilderbarAndNav } from './bar'
import { sort } from './sort'
import { readContent } from './read-content'

function isNeedProcess(fullPath: string, options: NormalizeOptions) {
  const included = options.included(fullPath)
  const excluded = options.excluded(fullPath)
  const exists = fs.existsSync(fullPath)

  if (!exists) return false
  if (!included) return false
  if (excluded) return false

  return true
}

export function createBar(filepath, options: NormalizeOptions): Promise<{
  sidebar: DefaultTheme.Sidebar,
  nav: DefaultTheme.NavItem[]
}> {
  const fullPath = path.resolve(process.cwd(), filepath)
  const readContentPromises: Promise<string>[] = []
  return new Promise((resolve) => {
    readDirTree(fullPath, {
      processStatsError: 'record',
      processReadDirError: 'record',
      isSkip: (dir, filename, stats, parents) => !isNeedProcess(dir, options),
      childKey: 'items',
      onStats: (dir, filename, stats, parents) => {
        const postStats = {} as DirTreeItem
        if (options.useContent) {
          readContent(stats, postStats, dir, readContentPromises)
        }
        return postStats
      },
      onChildren: (dir, filename, postStats, parents, childFiles, children) => {
        if (options.useContent) {
          return children
        }
        return sort(children, options)
      },
      onComplete(result, errors) {
        if (errors.length) {
          console.log(errors)
        }
        Promise.all(readContentPromises).then(() => {
          resolve(genSilderbarAndNav(result, options))
        })
      }
    })
  })
}
