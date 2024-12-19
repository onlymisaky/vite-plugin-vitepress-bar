import type { NormalizePluginOptions } from '../types'
import { isNeedProcess } from './is-need-process'

export async function checkRestart(
  eventName: 'add' | 'addDir' | 'change' | 'unlink' | 'unlinkDir',
  filePath: string,
  restart: (forceOptimize?: boolean) => Promise<void>,
  options: NormalizePluginOptions,
  { srcDir, srcExclude }: { srcDir: string, srcExclude: string[] | undefined },
): Promise<void | undefined> {
  // 新增文件夹不会影响 bar
  // 因为空文件夹应该排除掉
  if (eventName === 'addDir')
    return

  // 文件内容更改也不会影响 bar
  // 因为 title 和 link 是根据文件名生成(后续版本可能会根据文件内容生成)
  if (eventName === 'change')
    return

  if (!isNeedProcess(filePath, { srcDir, srcExclude })) {
    return
  }

  // TODO options.filter

  restart()
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
