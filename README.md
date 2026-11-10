# Pixel Companion

DeepSeek Harness 的像素宠物插件。角色在页面浮层中游走、沿文字行跳跃、休息和睡觉，也支持鼠标按住拖动。

## 项目结构

| 包 | 功能 |
| --- | --- |
| [pixel-cat-companion](packages/pixel-cat-companion/) | 行为引擎、文字台阶、拖动和角色注册表 |
| [pixel-cat-assets](packages/pixel-cat-assets/) | 原创橘猫素材与动画 |
| [pixel-siamese-assets](packages/pixel-siamese-assets/) | 原创蓝眼暹罗猫素材与动画 |

三个包均为可独立安装的 Cordis bundle。Client 使用 Harness 提供的 React 和模块加载器，无需单独打包。

## 安装

在 DeepSeek Harness 中使用插件管理工具安装本地目录，先安装引擎，再安装所需角色包：

```text
plugin_manager(action="install_bundle", target="<项目绝对路径>/packages/pixel-cat-companion")
plugin_manager(action="install_bundle", target="<项目绝对路径>/packages/pixel-cat-assets")
plugin_manager(action="install_bundle", target="<项目绝对路径>/packages/pixel-siamese-assets")
```

以上是 Harness 工具调用参数，不是终端命令。安装结果如要求刷新或重启，按返回的提示操作。本项目依赖 Harness 的 Client 运行环境，不能作为独立网页直接运行。

## 切换角色

在 Harness 页面的开发者控制台中执行：

```js
PixelCompanion.list()
PixelCompanion.select('pixel-cat')    // 橘猫
PixelCompanion.select('siamese-cat')  // 暹罗猫
```

选择保存在当前浏览器的 localStorage 中。暹罗猫角色包首次加载时会选中暹罗猫，后续手动选择不会被它覆盖。选中角色未注册时，引擎回退到已注册的橘猫。

## 开发角色包

参见 [外部角色接入文档](packages/pixel-cat-companion/CHARACTERS.md) 和 [TypeScript 接口](packages/pixel-cat-companion/character-api.d.ts)。素材包实现 `render`、尺寸和可选 CSS，并通过注册函数返回的 disposer 完成卸载清理。

当前行为引擎按约 96 像素宽的行走角色规划路径，睡眠宽度为 116 像素；设计新角色时建议沿用现有尺寸。

## 检查

本地安装 Node.js 后运行：

```sh
npm run check
```

此命令检查所有运行时 JavaScript 的语法；动作、拖动和视觉效果需要在 Harness 中验证。
