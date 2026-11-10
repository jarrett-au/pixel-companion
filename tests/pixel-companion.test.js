const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const clientPath = path.join(root, 'packages/pixel-companion/client.js');
const clientSource = fs.readFileSync(clientPath, 'utf8')
  .replace(
    '    const characterModules = [createOrangeCharacter, createSiameseCharacter];',
    '    globalThis.__pixelCompanionTest = { resolveSelection, constrainMenuPosition };\n'
      + '    const characterModules = [createOrangeCharacter, createSiameseCharacter];',
  );

function minimalCharacter(id) {
  return {
    version: 1,
    id,
    name: id,
    sizes: { default: { width: 96, height: 84, footOffset: 76 } },
    render: () => null,
  };
}

function createRuntime(storage = new Map()) {
  let definition;
  const window = {
    localStorage: {
      getItem: (key) => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, String(value)),
    },
    __ModuleLoader__: { load: (value) => { definition = value; } },
  };
  const context = vm.createContext({ window, console });
  vm.runInContext(clientSource, context, { filename: clientPath });
  assert.equal(definition.id, '@local/pixel-companion');
  const React = { createElement: () => null, Fragment: Symbol('Fragment') };
  const plugin = definition.factory((request) => {
    assert.equal(request, 'react');
    return React;
  });

  function createCordisContext() {
    const effects = [];
    const dictionaries = new Map();
    let slot;
    let disposeSlot;
    const ctx = {
      effect(callback, label) {
        assert.equal(typeof label, 'string');
        const dispose = callback();
        assert.equal(typeof dispose, 'function');
        effects.push(dispose);
      },
      locale: {
        register(namespace, values) {
          dictionaries.set(namespace, values);
          return () => dictionaries.delete(namespace);
        },
      },
      slots: {
        inject(name, callback) {
          assert.equal(name, 'shell.overlay');
          disposeSlot = callback();
          return disposeSlot;
        },
        register(options, component) {
          slot = { options, component, disposed: false };
          return () => { slot.disposed = true; };
        },
      },
    };
    return {
      ctx,
      dictionaries,
      getSlot: () => slot,
      dispose() {
        for (const dispose of effects.reverse()) dispose();
        disposeSlot?.();
      },
    };
  }

  return { context, window, plugin, createCordisContext, storage };
}

test('one installable bundle contains both internal character modules', () => {
  const packages = fs.readdirSync(path.join(root, 'packages'), { withFileTypes: true })
    .filter((entry) => entry.isDirectory());
  assert.deepEqual(packages.map((entry) => entry.name), ['pixel-companion']);
  const manifest = require('../packages/pixel-companion/package.json');
  assert.equal(manifest.name, '@local/pixel-companion');
  assert.equal(manifest.dsh.bundle.patch, './cordis.patch.yml');
  assert.equal(manifest.dsh.client.platform, 'web');
  assert.deepEqual([...pluginIds()], ['pixel-cat', 'siamese-cat']);

  function pluginIds() {
    const runtime = createRuntime();
    const cordis = runtime.createCordisContext();
    runtime.plugin.apply(cordis.ctx);
    return runtime.window.PixelCompanion.list().map(({ id }) => id);
  }
});

test('registration never steals selection and subscriptions observe explicit switches', () => {
  const runtime = createRuntime();
  const cordis = runtime.createCordisContext();
  runtime.plugin.apply(cordis.ctx);
  const registry = runtime.window.PixelCompanion;
  assert.equal(registry.selected(), 'pixel-cat');
  assert.equal(runtime.storage.has('pixel-companion.siamese-introduced'), false);
  assert.equal(runtime.storage.has('pixel-companion.selected-character'), false);

  let notifications = 0;
  const unsubscribe = registry.subscribe(() => { notifications += 1; });
  registry.select('siamese-cat');
  assert.equal(registry.selected(), 'siamese-cat');
  assert.equal(runtime.storage.get('pixel-companion.selected-character'), 'siamese-cat');
  assert.equal(notifications, 1);
  unsubscribe();
  registry.select('pixel-cat');
  assert.equal(notifications, 1);
});

test('selection survives recreation and a late external registration restores the pending choice', () => {
  const storage = new Map([['pixel-companion.selected-character', 'external-late-cat']]);
  const runtime = createRuntime(storage);
  const cordis = runtime.createCordisContext();
  runtime.plugin.apply(cordis.ctx);
  const registry = runtime.window.PixelCompanion;
  const { resolveSelection } = runtime.context.__pixelCompanionTest;
  assert.equal(registry.selected(), 'external-late-cat');
  assert.equal(resolveSelection(registry).character.id, 'pixel-cat');

  const unregister = registry.register(minimalCharacter('external-late-cat'));
  assert.equal(resolveSelection(registry).character.id, 'external-late-cat');
  unregister();
  assert.equal(resolveSelection(registry).character.id, 'pixel-cat');

  registry.select('siamese-cat');
  const reloaded = createRuntime(storage);
  const reloadedCordis = reloaded.createCordisContext();
  reloaded.plugin.apply(reloadedCordis.ctx);
  assert.equal(reloaded.window.PixelCompanion.selected(), 'siamese-cat');
  assert.equal(reloaded.context.__pixelCompanionTest.resolveSelection(reloaded.window.PixelCompanion).character.id, 'siamese-cat');
});

test('one external package can register and dispose multiple characters', () => {
  const runtime = createRuntime();
  const cordis = runtime.createCordisContext();
  runtime.plugin.apply(cordis.ctx);
  const registry = runtime.window.PixelCompanion;
  const dispose = [minimalCharacter('external-one'), minimalCharacter('external-two')]
    .map((character) => registry.register(character));
  assert.deepEqual([...registry.list()].map(({ id }) => id), [
    'pixel-cat', 'siamese-cat', 'external-one', 'external-two',
  ]);
  assert.throws(() => registry.register(minimalCharacter('external-one')), /already registered/);
  dispose.reverse().forEach((unregister) => unregister());
  assert.deepEqual([...registry.list()].map(({ id }) => id), ['pixel-cat', 'siamese-cat']);
});

test('locale, character, and slot resources have working disposers', () => {
  const runtime = createRuntime();
  const cordis = runtime.createCordisContext();
  runtime.plugin.apply(cordis.ctx);
  assert.equal(cordis.dictionaries.has('pixel-companion'), true);
  assert.equal(cordis.getSlot().options.locale, 'pixel-companion');
  assert.equal(cordis.getSlot().options.id, 'pixel-companion');

  cordis.dispose();
  assert.equal(cordis.dictionaries.has('pixel-companion'), false);
  assert.equal(cordis.getSlot().disposed, true);
  assert.deepEqual([...runtime.window.PixelCompanion.list()], []);

  // The shared registry intentionally survives engine reloads; reapply must not duplicate IDs.
  const reapplied = runtime.createCordisContext();
  runtime.plugin.apply(reapplied.ctx);
  assert.deepEqual([...runtime.window.PixelCompanion.list()].map(({ id }) => id), ['pixel-cat', 'siamese-cat']);
  assert.equal(reapplied.getSlot().disposed, false);
});

test('context menu and character pane positions stay inside the viewport', () => {
  const runtime = createRuntime();
  const { constrainMenuPosition } = runtime.context.__pixelCompanionTest;
  assert.deepEqual(
    { ...constrainMenuPosition(700, 400, 216, 340, 800, 600) },
    { left: 576, top: 252 },
  );
  assert.deepEqual(
    { ...constrainMenuPosition(-20, -10, 144, 42, 800, 600) },
    { left: 8, top: 8 },
  );
  assert.deepEqual(
    { ...constrainMenuPosition(790, 590, 144, 42, 800, 600) },
    { left: 648, top: 550 },
  );
  assert.deepEqual(
    { ...constrainMenuPosition(20, 20, 400, 500, 200, 150) },
    { left: 8, top: 8 },
  );
});
