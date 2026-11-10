# Pixel Companion

DeepSeek Harness 的像素宠物插件。一个插件内置原创橘猫和蓝眼暹罗猫，角色会在页面浮层中游走、沿文字行跳跃、休息和睡觉，也支持鼠标按住拖动。任意时刻只显示一个角色。

## 安装

在 DeepSeek Harness 中使用插件管理工具安装本项目的单一 bundle：

```text
plugin_manager(action="install_bundle", target="<项目绝对路径>/packages/pixel-companion")
```

以上是 Harness 工具调用参数，不是终端命令。也可以在插件管理界面选择同一个绝对包目录。安装结果如要求刷新或重启，按提示操作。本插件依赖 Harness Client 运行环境，不能作为独立网页运行。

### 从旧的三个插件迁移

**先停用或移除旧插件，再启用新插件。** 在「设置 → 插件 → 插件列表」逐项检查以下旧包，确保它们不再同时启用：

- `@local/pixel-cat-companion`
- `@local/pixel-cat-assets`
- `@local/pixel-siamese-assets`

停用旧包后即可保留其安装记录；也可以在该界面移除。随后安装并启用 `@local/pixel-companion`。旧引擎会造成重复浮层，旧素材包会与新包内置角色重复注册，因此不能只安装新包而保留旧包运行。

修改本仓库源码**不会**自动停用或删除宿主中已经安装的旧插件；上述操作必须在目标 Harness profile 的插件管理界面或插件管理工具中完成。角色 ID 和 `localStorage` key 均未改变，已有选择会保留。

## 切换角色

默认只显示宠物，没有常驻切换按钮。**右键宠物**，在靠近点击处的紧凑像素菜单中选择「切换角色」，再在角色窗格中点击名称或缩略图即可切换并关闭。当前角色有选中标记；角色较多时窗格内部滚动，菜单和窗格都会限制在视口内。点击外部或按 Escape 关闭，菜单打开期间宠物暂停自主移动，关闭后恢复。

宠物也可通过 Tab 聚焦，按 Shift+F10 或 ContextMenu 键打开菜单。左键按住拖动行为不变，右键不会触发拖动；浮层其余区域不会拦截宿主操作。文案跟随宿主 locale，颜色、边框和悬浮状态使用宿主主题变量。

也可以在浏览器开发者控制台中使用保留的公共 API：

```js
PixelCompanion.list()
PixelCompanion.selected()
PixelCompanion.select('pixel-cat')    // 橘猫
PixelCompanion.select('siamese-cat')  // 暹罗猫
```

选择保存在当前浏览器的 `localStorage['pixel-companion.selected-character']` 中。注册角色不会抢占当前选择；若持久化角色尚未注册，引擎先回退到橘猫，在该角色晚注册后自动恢复选择。橘猫不可用时回退到第一个已注册角色。

## 项目结构与开发

| 路径 | 功能 |
| --- | --- |
| [packages/pixel-companion](packages/pixel-companion/) | 唯一可安装的 Cordis bundle |
| `packages/pixel-companion/client.js` | 行为引擎、公共注册表、切换 UI 和独立的内部角色工厂 |
| [CHARACTERS.md](packages/pixel-companion/CHARACTERS.md) | 内置角色及外部多角色包开发说明 |
| [character-api.d.ts](packages/pixel-companion/character-api.d.ts) | TypeScript 公共接口 |
| `tests/pixel-companion.test.js` | 注册、切换、持久化、晚注册和生命周期检查 |

内部角色模块为 `createOrangeCharacter(React)` 和 `createSiameseCharacter(React)`，由 `characterModules` 统一注册。新增内置角色只需增加同类工厂并加入该数组，不需要新增 Cordis 插件。一个外部包也可以注册多个角色。

宿主提供 React 和 `__ModuleLoader__`，本包无需构建或单独打包它们。当前模块协议不支持同步的任意相对 `require`，因此内部模块使用同一 Client bundle 中边界清晰的工厂函数，而不假设相对 import 可用。

当前行为引擎按约 96 像素宽的行走角色规划路径，睡眠宽度为 116 像素；新角色建议沿用现有尺寸。

### 独立 Web 预览

首次创建专用 profile 前，先确认 profile 不存在且端口空闲，然后运行：

```sh
/Applications/DeepSeek\ Harness.app/Contents/Resources/runtime/cli/bin/dsh \
  --profile pixel-preview-zippy --from-default-profile web --port 61801
```

以后启动同一个 profile 必须去掉 `--from-default-profile`，避免覆盖配置：

```sh
/Applications/DeepSeek\ Harness.app/Contents/Resources/runtime/cli/bin/dsh \
  --profile pixel-preview-zippy --port 61801
```

不要对 desktop 或已有 profile 使用重建参数。通过目标实例的 `plugin_manager(action="install_bundle", target="<绝对包目录>")` 安装后，应检查返回的 application/warnings，并在实际页面验证角色、切换和拖动；语法检查或 mock 测试不代表视觉验证通过。

## 检查

本地安装 Node.js 后运行：

```sh
npm run check
```

此命令检查运行时 JavaScript 语法，并测试双角色注册、注册不抢占选择、显式切换、持久化恢复、外部包多角色注册、晚注册回退、菜单视口位置约束及资源 disposer。右键菜单、焦点、滚动、主题、缩略图和实际拖动仍需在 Harness 页面中验证。
