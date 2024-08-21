# vite-plugin-vitepress-bar

为 `vitepress` 自动生成 `nav` 和 `sidebar`

## 特性

- 支持生成 `nav` 和 `sidebar`
- 支持自定义范围
- 支持自定义排序
- 支持自定义标题
- 支持 `dev` 模式自动更新
- 支持 `rewrites`

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

### genType

- 说明: 生成的 `bar` 与原有的 `themeConfig.nav `和 `themeConfig.sidebar` 生成新的 `bar` ，默认替换原有的 `bar`
- 类型: (source: { sidebar, nav }, target: { sidebar, nav }) => { sidebar, nav }

### included

- 说明: 指定需要生成 `nav` 和 `sidebar` 的目录，默认值为 `srcDir` ，并排除该目录 `.vitepress`、`.git`、`node_modules`、`dist` 目录。优先级高于 `excluded`
- 类型: `string` | `string[]` | `RegExp` | `RegExp[]` | `(absolutePath: string) => boolean`

### excluded

- 说明: 指定需要排除的目录，默认值为 `srcExclude` +  `.vitepress`、`.git`、`node_modules`、`dist` 目录。优先级低于 `included`
- 类型: `string` | `string[]` | `RegExp` | `RegExp[]` | `(absolutePath: string) => boolean`

### useContent

- 说明: 在自定义排序或自定义标题时，如果需要依赖文件内容，可以设置为 `true` ，但这可能会极大的延长启动和更新时间，默认值为 `false`
- 类型: `boolean`

### sort

- 说明: 对同级的 `bar` 进行排序，根据文件信息(文件名、创建时间、修改时间、文件大小、文件内容)排序，默认使用 node 读取到的文件顺序
- 类型: `{ order: 'asc' | 'desc', by: 'name' | 'create' | 'modify' | 'size' | 'content' }` | `(a: File, b: File) => number`

### text

- 说明: 根据文件名、创建时间、修改时间、文件大小、文件内容生成标题，默认以文件名为标题
- 类型: `(absolutePath: string, lastPathname: string) => string`

### collapsed

- 说明: 同 `SidebarItem.collapsed`
- 类型: `boolean` | `(absolutePath: string) => boolean`

### usedFor

- 说明: 配置当前的 `bar` 用于 `nav` 还是 `sidebar` 。默认一级目录(不包含文件)为 `nav` ，二级目录为 `sidebar` ，也可以通过函数配置
- 类型: `{ nav: boolean, sidebar: boolean }` | `(data: {  }) => { nav: boolean, sidebar: boolean }`
