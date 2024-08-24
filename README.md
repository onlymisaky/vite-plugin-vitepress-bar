# vite-plugin-vitepress-bar

为 `vitepress` 自动生成 `nav` 和 `sidebar`

## 特性

- [x] 支持生成 `nav` 和 `sidebar`
- [x] 支持自定义范围
- [x] 支持自定义排序
- [x] 支持自定义标题
- [x] 支持 `dev` 模式自动更新
- [ ] 支持 `rewrites`

## 使用

```bash
npm i vite-plugin-vitepress-bar -D
```

```js
import { defineConfig } from 'vitepress'
import vitepressBar from 'vite-plugin-vitepress-sidebar'

export default defineConfig({
  plugins: [
    vitepressBar(),
  ],
})
```

## API

### included

- 说明
  - 指定可以在 `nav` 和 `sidebar` 中显示的文件或目录
  - 继承自 `srcDir` 配置项，既只有能被 `vitepress` 读取到才会被读取
  - 如果是个空文件夹，将不会显示
  - 优先级高于 `excluded`
- 类型
  - `string`
  - `string[]`
  - `RegExp`
  - `RegExp[]`
  - `(fullPath: string) => boolean`

### excluded

- 说明
  - 指定不在 `nav` 和 `sidebar` 中显示的文件或目录(这意味着只有知道该链接存在的人才能访问，恶意穷举除外)
  - 继承自 `srcExclude` 配置项，既 `vitepress` 排除的目录也会被排除
  - 优先级低于 `included`
- 类型
  - `string`
  - `string[]`
  - `RegExp`
  - `RegExp[]`
  - `(fullPath: string) => boolean`

### useContent

- 说明
  - 在自定义排序和自定义标题时，如果需要依赖文件内容，可以设置为 `true` 
  - 这将会延长启动、更新和构建时间
- 类型
  - `boolean`

### sort

- 说明
  - 对同级的 `bar` 进行排序
  - 根据文件信息(文件名、创建时间、修改时间、文件大小、文件内容)排序
  - 默认使用 node 读取到的文件顺序
- 类型
  - `SortOptions`
  - `(a: SortItem, b: SortItem) => number`

### text

- 说明
  - 根据文件名、创建时间、修改时间、文件大小、文件内容生成标题
  - 默认以文件名为标题
- 类型
  - `(fileInfo: FileInfo) => string`

### collapsed

- 说明
  - 同 `SidebarItem.collapsed`
- 类型
  - `boolean`
  - `(fullPath: string) => boolean`

### genFor

- 说明
  - 配置当前文件或目录显示在 `nav` 还是 `sidebar` 中
  - 默认 `srcDir` 下一级文件和目录在 `nav` 中显示，二级目录在 `sidebar` 中显示
- 类型
  - `{ nav?: boolean; sidebar?: boolean }`
  - `(fileInfo: FileInfo) => { nav?: boolean; sidebar?: boolean }`

### genType

- 说明
  - 配置本插件生成的 `bar` 与原有的 `themeConfig.nav `和 `themeConfig.sidebar` 合并方式
  - 默认替换原有的 `themeConfig.nav `和 `themeConfig.sidebar`
  - 如果该函数了返回的 `nav` 和 `sidebar` 格式错误，则保持原有的 `themeConfig.nav `和 `themeConfig.sidebar`
- 类型
  - `(source: Bar, target: Bar) => Bar`

## 类型说明

### SortItem

```ts
export interface SortItem {
  /**
   * 完整路径
   */
  fullpath: string;
  /**
   * 文件内容
   */
  content: string;
  /**
   * 创建时间
   */
  create: string;
  /**
   * 修改时间
   */
  modify: string;
  /**
   * 文件大小
   */
  size: string;
}
```

### SortOptions

```ts
export interface SortOptions {
  order: 'asc' | 'desc';
  by: keyof SortItem;
}
```

### Bar

```ts
interface Bar {
  sidebar: DefaultTheme.Sidebar;
  nav: DefaultTheme.NavItem[];
}
```

### FileInfo

```ts
export interface FileInfo {
  stats: fs.Stats,
  fullpath: string,
  filename: string,
  children: string[],
  parents: FileInfo[]
  content: string
}
```
