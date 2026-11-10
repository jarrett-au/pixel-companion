window.__ModuleLoader__.load({
  id: '@local/pixel-cat-companion',
  factory(require) {
    const React = require('react');
    const h = React.createElement;

    const TICK_MS = 50;
    const WALK_WIDTH = 96;
    const MAX_JUMP_HEIGHT = 148;
    const MAX_DROP_HEIGHT = 210;
    const MAX_JUMP_DISTANCE = 280;
    const SLEEP_CLEARANCE = 54;
    const CHARACTER_STORAGE_KEY = 'pixel-companion.selected-character';
    const textNodeIds = new WeakMap();
    let nextTextNodeId = 1;

    function randomBetween(min, max) {
      return Math.round(min + Math.random() * (max - min));
    }

    function clamp(value, min, max) {
      return Math.max(min, Math.min(max, value));
    }

    function validateCharacter(character) {
      if (!character || character.version !== 1) throw new Error('Pixel character must declare version: 1.');
      if (!/^[a-z0-9][a-z0-9._-]*$/.test(character.id || '')) throw new Error('Pixel character id must be a lowercase slug.');
      if (typeof character.name !== 'string' || !character.name.trim()) throw new Error('Pixel character needs a display name.');
      if (typeof character.render !== 'function') throw new Error('Pixel character needs render(props).');
      if (character.styles !== undefined && typeof character.styles !== 'string') throw new Error('Pixel character styles must be a string.');
      if (!character.sizes?.default) throw new Error('Pixel character needs sizes.default.');
      for (const size of Object.values(character.sizes)) {
        if (![size.width, size.height, size.footOffset].every(Number.isFinite)
          || size.width <= 0 || size.height <= 0 || size.footOffset < 0) {
          throw new Error(`Invalid size for pixel character "${character.id}".`);
        }
      }
    }

    function createCharacterRegistry() {
      if (window.PixelCompanion?.version === 1) return window.PixelCompanion;
      if (window.PixelCompanion) throw new Error('Unsupported PixelCompanion registry version.');
      const characters = new Map();
      const listeners = new Set();
      let selectedId = 'pixel-cat';
      try {
        selectedId = window.localStorage.getItem(CHARACTER_STORAGE_KEY) || selectedId;
      } catch { /* Storage can be unavailable in hardened browser contexts. */ }
      const emit = () => {
        for (const listener of [...listeners]) {
          try { listener(); } catch (error) { console.error('Pixel companion character listener failed.', error); }
        }
      };
      const registry = {
        version: 1,
        register(character) {
          validateCharacter(character);
          if (characters.has(character.id)) throw new Error(`Pixel character "${character.id}" is already registered.`);
          characters.set(character.id, character);
          emit();
          return () => {
            if (characters.get(character.id) !== character) return;
            characters.delete(character.id);
            emit();
          };
        },
        get(id) { return characters.get(id) ?? null; },
        list() { return [...characters.values()].map(({ id, name }) => ({ id, name })); },
        selected() { return selectedId; },
        select(id) {
          if (!/^[a-z0-9][a-z0-9._-]*$/.test(id || '')) throw new Error('Pixel character id must be a lowercase slug.');
          selectedId = id;
          try { window.localStorage.setItem(CHARACTER_STORAGE_KEY, id); } catch { /* Keep the in-memory selection. */ }
          emit();
        },
        subscribe(listener) {
          listeners.add(listener);
          return () => listeners.delete(listener);
        },
      };
      window.PixelCompanion = registry;
      return registry;
    }

    function conversationBounds() {
      const center = Array.from(document.querySelectorAll('div[class$="_centerCol"]')).find((element) => {
        const rect = element.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      });
      const fallbackLeft = clamp(window.innerWidth * 0.2, 200, 280);
      return { left: center ? center.getBoundingClientRect().left : fallbackLeft, right: window.innerWidth - 12 };
    }

    function floorPlatform() {
      const area = conversationBounds();
      return { key: 'floor', left: area.left + 8, right: area.right, top: window.innerHeight - 12, bottom: window.innerHeight, canSleep: true };
    }

    function platformBounds(platform, width = WALK_WIDTH) {
      const area = conversationBounds();
      return {
        min: Math.max(area.left + 8, platform.left - 4),
        max: Math.min(window.innerWidth - width - 8, platform.right - width + 4),
      };
    }

    function makeState(mode, cat, platform) {
      const durations = { walk: [2600, 4800], sit: [1800, 3200], stretch: [1300, 1900], squeeze: [650, 850], sleep: [7600, 11800] };
      const [min, max] = durations[mode];
      return {
        mode, x: cat.x, y: cat.y,
        platformKey: platform?.key ?? cat.platformKey ?? 'floor',
        direction: mode === 'walk' ? (Math.random() < 0.5 ? -1 : 1) : cat.direction,
        remaining: randomBetween(min, max),
      };
    }

    function collectPlatforms() {
      const platforms = [floorPlatform()];
      const area = conversationBounds();
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      let node;
      while ((node = walker.nextNode())) {
        if (!node.nodeValue?.trim()) continue;
        const element = node.parentElement;
        if (!element || element.closest('.dsh-pixel-companion,.dsh-pixel-cat,script,style,button,input,textarea,select,[contenteditable="true"],[role="dialog"],[aria-hidden="true"]')) continue;
        const range = document.createRange();
        let nodeId = textNodeIds.get(node);
        if (!nodeId) {
          nodeId = nextTextNodeId++;
          textNodeIds.set(node, nodeId);
        }
        range.selectNodeContents(node);
        let rects;
        try { rects = Array.from(range.getClientRects()); } catch { continue; } finally { range.detach(); }
        rects.forEach((rect, lineIndex) => {
          if (rect.width < WALK_WIDTH + 8 || rect.height < 8) return;
          if (rect.right < area.left + 8 || rect.left > area.right || rect.bottom < 56 || rect.top > window.innerHeight - 20) return;
          const style = window.getComputedStyle(element);
          if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return;
          platforms.push({
            key: `text:${nodeId}:${lineIndex}`,
            left: Math.max(rect.left, area.left + 8), right: rect.right, top: Math.round(rect.top) + 2, bottom: rect.bottom, canSleep: false,
          });
        });
      }
      for (const platform of platforms) {
        if (platform.key === 'floor') continue;
        let nearestBottom = 0;
        for (const other of platforms) {
          if (other === platform || other.key === 'floor') continue;
          const overlaps = platform.left < other.right && platform.right > other.left;
          if (overlaps && other.bottom <= platform.top && other.bottom > nearestBottom) nearestBottom = other.bottom;
        }
        platform.canSleep = platform.right - platform.left >= 124
          && (nearestBottom === 0 || platform.top - nearestBottom >= SLEEP_CLEARANCE);
      }
      return platforms;
    }

    function jumpCandidates(cat, platforms) {
      return platforms.filter((platform) => {
        if (platform.key === cat.platformKey) return false;
        const rise = cat.y - platform.top;
        if (rise > MAX_JUMP_HEIGHT || -rise > MAX_DROP_HEIGHT || Math.abs(rise) < 12) return false;
        const bounds = platformBounds(platform);
        if (bounds.max < bounds.min) return false;
        return Math.abs(clamp(cat.x, bounds.min, bounds.max) - cat.x) <= MAX_JUMP_DISTANCE;
      });
    }

    function makeJump(cat, platform) {
      const bounds = platformBounds(platform);
      const targetX = clamp(cat.x + randomBetween(-48, 48), bounds.min, bounds.max);
      const distance = Math.abs(platform.top - cat.y);
      return { ...cat, mode: 'jump', remaining: 0, jump: {
        elapsed: 0, duration: clamp(340 + distance * 1.4, 420, 780),
        startX: cat.x, startY: cat.y, targetX, targetY: platform.top, targetKey: platform.key,
      } };
    }

    function advanceJump(cat) {
      const jump = cat.jump;
      const elapsed = jump.elapsed + TICK_MS;
      const progress = clamp(elapsed / jump.duration, 0, 1);
      const lift = Math.min(64, 28 + Math.abs(jump.targetY - jump.startY) * 0.22);
      const next = { ...cat,
        x: jump.startX + (jump.targetX - jump.startX) * progress,
        y: jump.startY + (jump.targetY - jump.startY) * progress - Math.sin(progress * Math.PI) * lift,
        direction: jump.targetX >= jump.startX ? 1 : -1,
        jump: { ...jump, elapsed },
      };
      if (progress < 1) return next;
      return makeState('walk', { ...next, x: jump.targetX, y: jump.targetY, platformKey: jump.targetKey }, { key: jump.targetKey });
    }

    function makeSqueeze(cat, platform) {
      const bounds = platformBounds(platform, 116);
      return makeState('squeeze', { ...cat, x: clamp(cat.x, bounds.min, bounds.max) }, platform);
    }

    function chooseNextState(cat, platforms, reducedMotion) {
      const current = platforms.find((platform) => platform.key === cat.platformKey) ?? platforms[0];
      const roll = Math.random();
      if (cat.mode === 'squeeze') return makeState('sleep', cat, current);
      if (cat.mode === 'sleep') return makeState('walk', cat, current);
      if (reducedMotion) return current.canSleep && roll < 0.35 ? makeSqueeze(cat, current) : makeState('sit', cat, current);
      if (current.canSleep && roll < 0.24) return makeSqueeze(cat, current);
      const candidates = jumpCandidates(cat, platforms);
      if (candidates.length && roll < 0.66) {
        candidates.sort((a, b) => {
          const score = (p) => Math.abs(cat.y - p.top) + Math.abs(cat.x - p.left) * 0.18 + Math.random() * 90;
          return score(a) - score(b);
        });
        return makeJump(cat, candidates[0]);
      }
      return makeState(roll < 0.82 ? 'sit' : 'stretch', cat, current);
    }

    function advanceCat(cat, platforms, reducedMotion) {
      if (cat.mode === 'jump') {
        const target = platforms.find((platform) => platform.key === cat.jump.targetKey);
        if (!target) return makeJump(cat, platforms[0]);
        return advanceJump(target.top === cat.jump.targetY ? cat : {
          ...cat,
          jump: { ...cat.jump, targetY: target.top },
        });
      }
      if (reducedMotion && cat.mode === 'walk') return makeState('sit', cat);
      const current = platforms.find((platform) => platform.key === cat.platformKey) ?? platforms[0];
      let { x, y, direction } = cat;
      y = current.top;
      const bounds = platformBounds(current);
      x = clamp(x, bounds.min, bounds.max);
      if (cat.mode === 'walk') {
        x += direction * 3.1;
        if (x <= bounds.min || x >= bounds.max) { x = clamp(x, bounds.min, bounds.max); direction *= -1; }
      }
      const remaining = cat.remaining - TICK_MS;
      const next = { ...cat, x, y, direction, remaining, platformKey: current.key };
      return remaining > 0 ? next : chooseNextState(next, platforms, reducedMotion);
    }

    function findDropPlatform(cat, platforms) {
      const centerX = cat.x + WALK_WIDTH / 2;
      return platforms
        .filter((platform) => centerX >= platform.left - 20 && centerX <= platform.right + 20
          && Math.abs(platform.top - cat.y) <= 120)
        .sort((a, b) => Math.abs(a.top - cat.y) - Math.abs(b.top - cat.y))[0] ?? platforms[0];
    }

    function PixelCat(props) {
      const { registry } = props;
      const conversationVisible = props.usePanelInfo((info) => info.activePanelId === null);
      const readSelection = () => {
        const selectedId = registry.selected();
        const character = registry.get(selectedId) || registry.get('pixel-cat');
        return { selectedId, character };
      };
      const [selection, setSelection] = React.useState(readSelection);
      const [cat, setCat] = React.useState(() => {
        const floor = floorPlatform();
        return makeState('walk', { x: floor.left + (floor.right - floor.left) * 0.58, y: floor.top, direction: -1 }, floor);
      });
      const platformsRef = React.useRef([floorPlatform()]);
      const dragRef = React.useRef(null);

      React.useEffect(() => registry.subscribe(() => setSelection(readSelection())), [registry]);
      React.useEffect(() => {
        if (!conversationVisible) return undefined;
        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const refreshPlatforms = () => { platformsRef.current = collectPlatforms(); };
        refreshPlatforms();
        const behaviorTimer = window.setInterval(() => {
          if (!document.hidden && !dragRef.current) setCat((current) => advanceCat(current, platformsRef.current, reducedMotion));
        }, TICK_MS);
        const geometryTimer = window.setInterval(refreshPlatforms, 700);
        window.addEventListener('resize', refreshPlatforms);
        document.addEventListener('scroll', refreshPlatforms, true);
        return () => {
          window.clearInterval(behaviorTimer);
          window.clearInterval(geometryTimer);
          window.removeEventListener('resize', refreshPlatforms);
          document.removeEventListener('scroll', refreshPlatforms, true);
        };
      }, [conversationVisible]);

      function startDrag(event) {
        if (event.button !== 0) return;
        event.preventDefault();
        event.stopPropagation();
        event.currentTarget.setPointerCapture(event.pointerId);
        dragRef.current = { pointerId: event.pointerId, offsetX: event.clientX - cat.x, offsetY: event.clientY - cat.y };
        setCat((current) => ({ ...current, mode: 'drag', jump: undefined }));
      }

      function moveDrag(event) {
        const drag = dragRef.current;
        if (!drag || drag.pointerId !== event.pointerId) return;
        event.preventDefault();
        const bounds = platformBounds(platformsRef.current[0]);
        const x = clamp(event.clientX - drag.offsetX, bounds.min, bounds.max);
        const y = clamp(event.clientY - drag.offsetY, 84, platformsRef.current[0].top);
        setCat((current) => ({
          ...current, mode: 'drag', x, y,
          direction: x === current.x ? current.direction : (x > current.x ? 1 : -1),
        }));
      }

      function endDrag(event) {
        const drag = dragRef.current;
        if (!drag || drag.pointerId !== event.pointerId) return;
        event.preventDefault();
        dragRef.current = null;
        if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
        setCat((current) => {
          const platform = findDropPlatform(current, platformsRef.current);
          const bounds = platformBounds(platform);
          const x = clamp(current.x, bounds.min, bounds.max);
          return makeState('walk', { ...current, x, y: platform.top }, platform);
        });
      }

      if (!conversationVisible || !selection.character) return null;
      const character = selection.character;
      const size = character.sizes[cat.mode] || character.sizes.default;
      return h('div', {
        className: 'dsh-pixel-companion dsh-pixel-cat',
        'data-mode': cat.mode,
        'data-platform': cat.platformKey,
        'data-character': character.id,
        'aria-hidden': true,
      },
      h('style', null, CSS),
      character.styles ? h('style', null, character.styles) : null,
      h('div', {
        className: `pixel-companion__actor pixel-cat__actor pixel-companion__actor--${cat.mode} pixel-cat__actor--${cat.mode}`,
        style: {
          left: `${cat.x}px`, top: `${cat.y - size.footOffset}px`,
          width: `${size.width}px`, height: `${size.height}px`,
        },
        onPointerDown: startDrag,
        onPointerMove: moveDrag,
        onPointerUp: endDrag,
        onPointerCancel: endDrag,
        onLostPointerCapture: endDrag,
      }, character.render({ mode: cat.mode, direction: cat.direction, React })));
    }

    const CSS = `
      .dsh-pixel-companion {
        position: fixed;
        inset: 0;
        pointer-events: none;
        user-select: none;
        z-index: 20;
      }
      .pixel-companion__actor {
        position: absolute;
        transition: left 50ms linear, top 50ms linear, width 240ms ease, height 240ms ease;
        will-change: left, top;
        pointer-events: auto;
        cursor: grab;
        touch-action: none;
      }
      .pixel-companion__actor--drag {
        transition: none;
        cursor: grabbing;
      }
      @media (prefers-reduced-motion: reduce) {
        .pixel-companion__actor { transition: none; }
      }
    `;

    return {
      inject: ['slots'],
      apply(ctx) {
        // Character packs can stay loaded while the engine reloads, so the shared
        // registry outlives this slot registration and retains their artwork.
        const registry = createCharacterRegistry();
        ctx.slots.inject('shell.overlay', () => ctx.slots.register({
          name: 'shell.overlay',
          id: 'pixel-cat-companion',
          order: 20,
        }, (props) => h(PixelCat, { ...props, registry })));
      },
    };
  },
});
