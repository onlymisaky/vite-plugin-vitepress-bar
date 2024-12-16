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
  - 设置当前文件或目录是否在 `nav` 和 `sidebar` 中显示
  - 继承自 `srcDir` 配置项，既只有能被 `vitepress` 读取到才会被读取
  - 如果是个空文件夹，将不会显示
  - 优先级高于 `excluded`
- 类型
  - `string`
  - `string[]`
  - `RegExp`
  - `RegExp[]`
  - `(fileInfo: FileInfoWithoutParent) => MaybePromise<boolean>`

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
  - `(fileInfo: FileInfoWithoutParent) => MaybePromise<boolean>`

## 类型说明

### FileInfoWithoutParent

```typescript
export interface FileInfoWithoutParent {
  path: string
  name: string
  stat: fs.Stats
}
```

### MaybePromise

```typescript
type MaybePromise<T> = T | Promise<T>
```
