# vite-plugin-vitepress-bar

为 `vitepress` 自动生成 `nav` 和 `sidebar`

## 特性

- [X] 支持生成 `nav` 和 `sidebar`
- [X] 支持自定义生成范围
- [X] 支持自定义排序
- [X] 支持自定义标题
- [X] 支持 `dev` 模式自动更新

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

### included

- 说明
  - 设置当前文件或目录是否在 `nav` 和 `sidebar` 中显示
  - 继承自 `srcDir` 配置项，既只有能被 `vitepress` 读取到才会被读取
  - 如果是个空文件夹，将不会显示
  - 优先级高于 `excluded`
- 类型
  - `string`
  - `string[]`
  - `RegExp`
  - `RegExp[]`
  - `(fileInfo: FileInfoSlim) => MaybePromise<boolean>`

### excluded

- 说明
  - 设置当前文件或目录是否在 `nav` 和 `sidebar` 中显示(这意味着只有知道该链接存在的人才能访问，恶意穷举除外)
  - 继承自 `srcExclude` 配置项，既 `vitepress` 排除的目录也会被排除
  - 优先级低于 `included`
- 类型
  - `string`
  - `string[]`
  - `RegExp`
  - `RegExp[]`
  - `(fileInfo: FileInfoSlim) => MaybePromise<boolean>`

### complete

- 说明
  - `bar` 生成后的回调
  - 如果传入该配置项，则会将该函数的返回值作为 `nav` 和 `sidebar` 覆盖原有的配置
  - 如果不传入该配置项，则会将生成的 `bar` 覆盖原有的 `nav` 和 `sidebar`
- 类型
  - `(bar: Bar) => { sidebar: DefaultTheme.Sidebar, nav: DefaultTheme.NavItem[] }`

## 类型说明

### FileInfoSlim

```typescript
export interface FileInfoSlim {
  path: string
  name: string
  stat: fs.Stats
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
