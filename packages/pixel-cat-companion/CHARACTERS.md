# 外部角色包

像素小猫插件现在分为两层：

- `@local/pixel-cat-companion`：行为引擎，负责文字台阶、跳跃、睡眠状态、拖动、边界和角色切换。
- `@local/pixel-cat-assets`：默认角色包，只包含猫咪的 SVG、尺寸和动画。

外部角色包不需要复制行为引擎。它通过 `window.PixelCompanion` 注册一个角色，并在卸载时调用注册返回的清理函数。

## 查看和切换角色

浏览器控制台中：

```js
PixelCompanion.list()
PixelCompanion.selected()
PixelCompanion.select('pixel-cat')
PixelCompanion.select('your-character-id')
```

选择会保存到 `localStorage`，刷新后仍然有效。选择的角色尚未注册时会回退到 `pixel-cat`；该角色注册后会自动恢复选择。重复注册同一个 ID 会报错，避免两个包互相覆盖。

## 角色接口

完整的 TypeScript 定义见 `character-api.d.ts`。一个角色只需要：

- `version: 1`：接口版本。
- `id`：稳定且唯一的小写 slug。
- `name`：显示名称。
- `sizes`：各状态的渲染尺寸；`default` 必填，其余状态可省略。
- `render(props)`：根据状态和方向返回 React 内容。
- `styles`：可选的角色私有 CSS。

`mode` 可能是 `walk`、`sit`、`stretch`、`jump`、`squeeze`、`sleep` 或 `drag`。`direction` 为 `1`（向右）或 `-1`（向左）。`footOffset` 是角色容器顶部到脚底台阶的距离。

引擎提供的角色容器带有 `pixel-companion__actor--<mode>` 状态类，可用于 CSS 动画。角色包不需要实现自己的拖动或指针事件。

## 最小外部包

`package.json` 中的 Client 声明依赖行为引擎，以保证注册表已经存在：

```json
{
  "name": "@acme/pixel-robot",
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
      "inject": ["@local/pixel-cat-companion"]
    }
  }
}
```

`client.js`：

```js
window.__ModuleLoader__.load({
  id: '@acme/pixel-robot',
  factory(require) {
    const React = require('react');
    const h = React.createElement;
    const character = {
      version: 1,
      id: 'pixel-robot',
      name: 'Pixel Robot',
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
          viewBox: '0 0 96 84',
          width: 96,
          height: 84,
          style: { display: 'block', shapeRendering: 'crispEdges' },
        }, h('rect', { x: 20, y: 12, width: 56, height: 60, fill: '#8aa0ff' })));
      },
    };
    return {
      apply() {
        return window.PixelCompanion.register(character);
      },
    };
  },
});
```

安装并启用角色包后，用 `PixelCompanion.select('pixel-robot')` 切换。要完全替换默认猫，可以停用 `@local/pixel-cat-assets`；若还要保留默认猫作为回退，则保持它启用。
