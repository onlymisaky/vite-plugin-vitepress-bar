export type Tree<K extends string, T extends object> = T & { [P in K]?: Tree<K, T>[] }
export type TreeLeafNodeDifferentFromParent<K extends string, T extends object, Leaf = T> = T & { [P in K]?: TreeLeafNodeDifferentFromParent<K, T, Leaf>[] } | Leaf

export type Without<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>
export type With<T, K extends keyof any> = Pick<T, Extract<keyof T, K>>

export type UnionToIntersection<U> =
  (U extends any ? (x: U) => void : never) extends (x: infer I) => void
  ? I
  : never

export type MergeTwo<T, U> = {
  [K in keyof T | keyof U]: K extends keyof U ? U[K] : K extends keyof T ? T[K] : never
}

export type Merge<M extends object[]> =
  M extends [infer First, ...infer Rest]
  ? (Rest extends object[] ? MergeTwo<First & {}, Merge<Rest>> : First)
  : {}

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

export type MaybePromise<T> = T | Promise<T>

export type UnWrapPromise<T> = T extends Promise<infer U> ? U : T
