import * as fs from 'fs'
import * as path from 'path'
import { DefaultTheme } from 'vitepress'
import { NormalizeOptions } from '../types'
import { FileInfo } from '../core/read-dir-tree/types'
import { readDirTree } from '../core/read-dir-tree'
import { genSilderbarAndNav } from './bar'
import { sort } from './sort'
import { readContent } from './read-content'

function isNeedProcess(absolutePath: string, options: NormalizeOptions) {
  const included = options.included(absolutePath)
  const excluded = options.excluded(absolutePath)
  const exists = fs.existsSync(absolutePath)

  if (!exists) return false
  if (!included) return false
  if (excluded) return false

  return true
}

export function createBar(filepath, options: NormalizeOptions): Promise<{
  sidebar: DefaultTheme.Sidebar,
  nav: DefaultTheme.NavItem[]
}> {
  const absolutePath = path.resolve(process.cwd(), filepath)
  const promises: Promise<string>[] = []
  return new Promise((resolve) => {
    readDirTree<FileInfo>(absolutePath, {
      processStatsError: 'record',
      processReadDirError: 'record',
      isSkip: (dir, filename, stats, parents) => !isNeedProcess(dir, options),
      childKey: 'items',
      onStats: (dir, filename, stats, parents) => {
        const postStats = {} as FileInfo;
        if (options.useContent) {
          readContent(stats, postStats, dir, promises)
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
          console.log(errors);
        }
        Promise.all(promises).then(() => {
          resolve(genSilderbarAndNav(result, options))
        })
      }
    })
  })
}
