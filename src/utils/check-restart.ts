import type { NormalizePluginOptions } from '../types'
import * as path from 'node:path'
import { statPromisefy } from '../core/read-dir-tree/utils'
import { isNeedProcess } from './is-need-process'

export async function checkRestart(
  eventName: 'add' | 'addDir' | 'change' | 'unlink' | 'unlinkDir',
  filePath: string,
  restart: (forceOptimize?: boolean) => Promise<void>,
  options: NormalizePluginOptions,
  { srcDir, srcExclude }: { srcDir: string, srcExclude: string[] | undefined },
): Promise<void | undefined> {
  if (eventName === 'change') {
    return
  }
  const [statError, stat] = await statPromisefy(filePath)
  if (statError)
    return
  if (await isNeedProcess({
    path: filePath,
    name: path.basename(filePath),
    stat,
  }, options, { srcDir, srcExclude })) {
    restart()
  }
}

function debounce(fn: (...args: any[]) => any, delay: number) {
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
