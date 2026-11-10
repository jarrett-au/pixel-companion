# 角色开发

`@local/pixel-companion` 是唯一需要安装的 Pixel Companion 插件，行为引擎与角色素材在同一 bundle 内保持模块边界：

- 行为引擎负责文字台阶、跳跃、睡眠、拖动、边界、选择恢复和切换 UI。
- `createOrangeCharacter(React)` 与 `createSiameseCharacter(React)` 分别拥有橘猫和暹罗猫的 SVG、尺寸及 CSS 动画。
- `characterModules` 数组统一注册内置角色。新增内置角色只需添加一个返回角色对象的工厂并加入数组，**不需要新增 Cordis 插件**。

这些内部工厂位于同一个 `client.js`，是因为宿主当前只保证平台模块及声明过的动态包依赖，不支持同步的任意相对 `require`。工厂在加载时不产生副作用，角色只在 `apply` 中通过 `ctx.effect` 注册并由 disposer 清理。

## 查看和切换角色

普通用户右键宠物，在像素菜单中选择「切换角色」，再点击角色名称或缩略图。窗格支持当前选中态、视口约束和滚动；外部点击或 Escape 关闭。聚焦宠物后也可按 Shift+F10 或 ContextMenu 键打开。开发者控制台仍可使用：

```js
PixelCompanion.list()
PixelCompanion.selected()
PixelCompanion.select('pixel-cat')
PixelCompanion.select('siamese-cat')
PixelCompanion.select('your-character-id')
```

稳定 ID 为 `pixel-cat` 和 `siamese-cat`，选择写入 `localStorage['pixel-companion.selected-character']`。注册本身不修改选择。所选角色尚未注册时，渲染引擎回退到 `pixel-cat`；晚注册后会自动恢复。重复注册同一个 ID 会报错，避免两个包互相覆盖。

## 角色接口

完整的 TypeScript 定义见 `character-api.d.ts`。一个角色只需要：

- `version: 1`：接口版本。
- `id`：稳定且唯一的小写 slug。
- `name`：公共注册表使用的显示名称。
- `sizes`：各状态的渲染尺寸；`default` 必填，其余状态可省略。
- `render(props)`：根据状态和方向返回 React 内容。
- `styles`：可选的角色 CSS；动画名必须全局唯一。

`mode` 可能是 `walk`、`sit`、`stretch`、`jump`、`squeeze`、`sleep` 或 `drag`。`direction` 为 `1`（向右）或 `-1`（向左）。`footOffset` 是角色容器顶部到脚底台阶的距离。

引擎提供的角色容器带有 `pixel-companion__actor--<mode>` 状态类。角色无需实现自己的移动、拖动或指针事件。切换 UI 会以 `sit` 状态调用同一个 `render` 生成静态缩略图，因此该状态应有可识别且不依赖外部资源的预览。内置角色的选择器名称由宿主 locale 翻译；外部角色使用其 `name`。

## 一个外部包注册多个角色

外部包不需要复制行为引擎，也不需要为每个角色创建 bundle。`package.json` 声明依赖统一引擎：

```json
{
  "name": "@acme/pixel-robots",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": "./index.js",
    "./client": "./client.js"
  },
  "dsh": {
    "bundle": { "patch": "./cordis.patch.yml" },
    "client": {
      "platform": "web",
      "immediately": true,
      "inject": ["@local/pixel-companion"]
    }
  }
}
```

`client.js` 可以注册任意多个角色，并一次性清理：

```js
window.__ModuleLoader__.load({
  id: '@acme/pixel-robots',
  factory(require) {
    const React = require('react');
    const h = React.createElement;
    const makeRobot = (id, name, color) => ({
      version: 1,
      id,
      name,
      sizes: {
        default: { width: 96, height: 84, footOffset: 76 },
        sleep: { width: 116, height: 70, footOffset: 62 },
        squeeze: { width: 116, height: 70, footOffset: 62 },
      },
      render({ mode, direction }) {
        return h('div', {
          style: { transform: `scaleX(${direction})` },
          'data-mode': mode,
        }, h('svg', {
          viewBox: '0 0 96 84', width: 96, height: 84,
          style: { display: 'block', shapeRendering: 'crispEdges' },
        }, h('rect', { x: 20, y: 12, width: 56, height: 60, fill: color })));
      },
    });
    const characters = [
      makeRobot('pixel-robot-blue', 'Blue Robot', '#8aa0ff'),
      makeRobot('pixel-robot-green', 'Green Robot', '#73c991'),
    ];
    return {
      apply(ctx) {
        ctx.effect(() => {
          const unregister = characters.map((character) => window.PixelCompanion.register(character));
          return () => unregister.reverse().forEach((dispose) => dispose());
        }, 'pixel-robots: characters');
      },
    };
  },
});
```

`register` 返回的 disposer 必须属于插件生命周期。不要在工厂顶层注册，也不要在注册后调用 `select` 抢占用户选择。

## 旧素材包迁移

新包已经内置橘猫和暹罗猫。安装新包前，必须在目标 Harness profile 的「设置 → 插件 → 插件列表」停用或移除旧包 `@local/pixel-cat-companion`、`@local/pixel-cat-assets` 和 `@local/pixel-siamese-assets`，避免重复引擎或重复角色注册。

本仓库中的源码变更不会自动修改宿主已有安装，也不会自动删除旧插件。若还需保留旧素材源码供参考，应从 Git 历史读取，而不是继续启用旧 bundle。
