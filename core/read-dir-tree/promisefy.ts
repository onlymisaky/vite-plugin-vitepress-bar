import * as fs from 'fs'

export function readDirPromisefy(dir: string) {
  return new Promise<[Error | null, string[]]>((resolve) => {
    fs.readdir(dir, (err, files) => {
      resolve([err, files])
    })
  })
}

export function statPromisefy(dir: string) {
  return new Promise<[Error | null, fs.Stats]>((resolve) => {
    fs.stat(dir, (err, stat) => {
      resolve([err, stat])
    })
  })
}
