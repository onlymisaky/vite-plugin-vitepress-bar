import * as fs from 'fs'
import { NormalizeOptions } from '../types'
import { mdReg } from './normalize'

export function checkRestart(eventName: 'add' | 'addDir' | 'change' | 'unlink' | 'unlinkDir', filePath: string, restart: (forceOptimize?: boolean) => Promise<void>, options: NormalizeOptions) {
  if (eventName === 'change') {
    return
  }
  const included = options.included(filePath)
  if (included) {
    if (['unlink', 'unlinkDir'].includes(eventName)) {
      restart()
      return
    }
    fs.stat(filePath, (err, stats) => {
      if (err) {
        return
      }
      if (stats.isDirectory()) {
        restart()
      }
      else if (stats.isFile() && mdReg.test(filePath)) {
        restart()
      }
    })
  }
}

function debounce(fn: Function, delay: number) {
  let timer: NodeJS.Timeout | null = null
  return function (...args: any[]) {
    if (timer) {
      clearTimeout(timer)
    }
    timer = setTimeout(() => {
      fn(...args)
    }, delay)
  }
}

export const debounceCheckRestart = debounce(checkRestart, 1000)
