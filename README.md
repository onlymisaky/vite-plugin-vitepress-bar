<!--
https://cn.vitejs.dev/guide/api-plugin#universal-hooks
https://cn.rollupjs.org/plugin-development/#resolveid

https://github.dev/QC2168/vite-plugin-vitepress-auto-sidebar/tree/main
https://github.dev/Xaviw/vite-plugin-vitepress-auto-nav/blob/953858804d5d6da605b50227bfcaa5b190794256/README-CN.md

https://notes.fe-mm.com/fe/html/
https://github.com/maomao1996/mm-notes/blob/master/scripts/daily-notes.js
 -->

# vite-plugin-vitepress-bar

为 `vitepress` 自动生成 `nav` 和 `sidebar`

## 特性

- [X] 自动生成 `nav` 和 `sidebar`
- [X] 支持路径过滤
- [X] 支持 `dev` 模式自动更新
- [ ] 支持自定义排序 (enableMdContent)
- [ ] 支持自定义标题 (enableMdContent)
- [ ] 自动排除空文件夹
- [ ] nav 优化 (层级问题, 没有 index.md 问题)

## 使用

```bash
npm i vite-plugin-vitepress-bar -D
```

```js
import vitepressBar from 'vite-plugin-vitepress-sidebar'
import { defineConfig } from 'vitepress'

export default defineConfig({
  plugins: [
    vitepressBar(),
  ],
})
```

## API

### filter

- 说明
  - 文件过滤器，用于精确控制文件在 `nav` 和 `sidebar` 中显示
  - 继承自 `srcDir` 配置项，既只有能被 `vitepress` 读取到才会被读取
  - 如果是个空文件夹，将不会显示
  - 支持相对路径路径(相对 srcDir)、正则、fast-glob、自定义函数
- 类型
  - `string`
  - `string[]`
  - `RegExp`
  - `RegExp[]`
  - `(fileInfo: FileInfo) => MaybePromise<boolean>`

### complete

- 说明
  - `bar` 生成后的回调
  - 如果传入该配置项，则会将该函数的返回值作为 `nav` 和 `sidebar` 覆盖原有的配置
  - 如果不传入该配置项，则会将生成的 `bar` 覆盖原有的 `nav` 和 `sidebar`
- 类型
  - `(bar: Bar) => { sidebar: DefaultTheme.Sidebar, nav: DefaultTheme.NavItem[] }`

## 类型说明

### FileInfo

```typescript
interface FileInfoSlim {
  path: string
  name: string
}

interface FileInfoSlimWithStats extends FileInfoSlim {
  stats: fs.Stats
}

interface FileInfo extends FileInfoSlimWithStats {
  files: string[]
  parent: FileInfo | null | undefined
}
```

### MaybePromise

```typescript
type MaybePromise<T> = T | Promise<T>
```

### Bar

```typescript
import type { DefaultTheme } from 'vitepress'

type NavItem = DefaultTheme.NavItemChildren | DefaultTheme.NavItemWithLink

interface SidebarMulti {
  [key: string]: DefaultTheme.SidebarItem[]
}

interface Bar {
  sidebar: SidebarMulti
  nav: NavItem[]
}
```
