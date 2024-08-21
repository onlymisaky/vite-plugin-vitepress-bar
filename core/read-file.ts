import * as fs from 'fs'

export function readFile(filePath: string) {
  let resolve, reject;
  const promise = new Promise<string>((res, rej) => {
    resolve = res;
    reject = rej;
  })
  fs.readFile(filePath, 'utf-8', (err, data) => {
    if (err) {
      reject(err)
    } else {
      resolve(data)
    }
  })

  return promise
}
