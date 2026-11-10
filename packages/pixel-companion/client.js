window.__ModuleLoader__.load({
  id: '@local/pixel-companion',
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

    function createOrangeCharacter(React) {
      const h = React.createElement;

      const INK = '#5b392c';
      const FUR = '#e99a55';
      const FUR_DARK = '#c87543';
      const CREAM = '#fff4df';
      const PINK = '#f7b8ad';

      function StandingCat({ mode }) {
        const sitting = mode === 'sit';
        const stretching = mode === 'stretch';
        return h('svg', {
          viewBox: '0 0 84 84', width: '84', height: '84', 'aria-hidden': true, focusable: 'false',
          style: { display: 'block', shapeRendering: 'crispEdges' },
        },
        h('ellipse', { cx: 43, cy: 76, rx: 29, ry: 4, fill: 'rgba(62, 42, 31, 0.16)' }),
        h('g', { className: 'pixel-cat__tail' },
          h('path', { d: 'M28 48H18V40H10V28H4V18H12V32H18V40H32Z', fill: INK }),
          h('path', { d: 'M24 46H22V36H14V24H10V20H8V28H14V40H24Z', fill: FUR }),
          h('rect', { x: 8, y: 20, width: 4, height: 8, fill: FUR_DARK }),
        ),
        h('g', { className: 'pixel-cat__body' },
          h('path', { d: sitting ? 'M24 40H60V48H68V72H20V52H24Z' : 'M26 38H60V44H66V66H22V46H26Z', fill: INK }),
          h('path', { d: sitting ? 'M28 44H56V52H62V66H26V52H28Z' : 'M30 42H56V48H60V60H28V46H30Z', fill: FUR }),
          h('path', { d: 'M40 48H54V62H40Z', fill: CREAM }),
          h('rect', { x: 30, y: 42, width: 6, height: 8, fill: FUR_DARK }),
          h('rect', { x: 54, y: 46, width: 6, height: 8, fill: FUR_DARK }),
        ),
        stretching
          ? h('g', { className: 'pixel-cat__legs pixel-cat__legs--stretch' },
              h('path', { d: 'M50 58H62V62H76V70H70V74H50Z', fill: INK }),
              h('path', { d: 'M54 62H60V66H72V70H54Z', fill: CREAM }),
              h('path', { d: 'M22 58H36V74H18V66H22Z', fill: INK }),
              h('path', { d: 'M26 62H32V68H24V64H26Z', fill: FUR }),
            )
          : h('g', { className: 'pixel-cat__legs' },
              h('g', { className: 'pixel-cat__leg pixel-cat__leg--back' },
                h('path', { d: 'M22 58H36V74H18V66H22Z', fill: INK }),
                h('path', { d: 'M26 60H32V68H22V66H26Z', fill: FUR }),
                h('rect', { x: 22, y: 68, width: 10, height: 4, fill: CREAM }),
              ),
              h('g', { className: 'pixel-cat__leg pixel-cat__leg--front' },
                h('path', { d: 'M50 56H64V74H48V64H50Z', fill: INK }),
                h('path', { d: 'M54 58H60V68H52V64H54Z', fill: FUR }),
                h('rect', { x: 52, y: 68, width: 10, height: 4, fill: CREAM }),
              ),
            ),
        h('g', { className: sitting ? 'pixel-cat__head pixel-cat__head--sit' : 'pixel-cat__head' },
          h('path', { d: 'M20 6H30V12H54V6H64V14H70V20H74V40H70V46H62V50H22V46H14V40H10V20H14V14H20Z', fill: INK }),
          h('path', { d: 'M24 12H28V18H56V12H60V18H66V24H70V38H66V42H58V46H26V42H18V38H14V24H18V18H24Z', fill: FUR }),
          h('rect', { x: 22, y: 13, width: 6, height: 8, fill: PINK }),
          h('rect', { x: 56, y: 13, width: 6, height: 8, fill: PINK }),
          h('rect', { x: 40, y: 14, width: 4, height: 6, fill: FUR_DARK }),
          h('rect', { x: 30, y: 18, width: 4, height: 4, fill: FUR_DARK, opacity: 0.65 }),
          h('rect', { x: 50, y: 18, width: 4, height: 4, fill: FUR_DARK, opacity: 0.65 }),
          h('g', { className: 'pixel-cat__eyes pixel-cat__eyes--blink' },
            h('path', { d: 'M25 23H32V25H34V31H32V33H25V31H23V25H25ZM52 23H59V25H61V31H59V33H52V31H50V25H52Z', fill: INK }),
            h('rect', { x: 26, y: 24, width: 3, height: 3, fill: CREAM }),
            h('rect', { x: 53, y: 24, width: 3, height: 3, fill: CREAM }),
            h('rect', { x: 30, y: 29, width: 2, height: 2, fill: CREAM, opacity: 0.7 }),
            h('rect', { x: 57, y: 29, width: 2, height: 2, fill: CREAM, opacity: 0.7 }),
          ),
          h('rect', { x: 39, y: 31, width: 6, height: 4, fill: PINK }),
          stretching
            ? h('g', null,
                h('rect', { x: 39, y: 36, width: 6, height: 7, fill: INK }),
                h('rect', { x: 40, y: 40, width: 4, height: 2, fill: PINK }),
              )
            : h('path', { d: 'M41 35H43V38H47V40H44V39H40V40H37V38H41Z', fill: INK }),
          h('path', { d: 'M6 30H16V32H6ZM6 36H16V38H6ZM68 30H78V32H68ZM68 36H78V38H68Z', fill: INK }),
          h('rect', { x: 20, y: 35, width: 6, height: 3, fill: PINK, opacity: 0.55 }),
          h('rect', { x: 58, y: 35, width: 6, height: 3, fill: PINK, opacity: 0.55 }),
        ));
      }

      function WalkingCat({ mode }) {
        const stretching = mode === 'stretch';
        return h('svg', {
          viewBox: '0 0 96 84', width: '96', height: '84', 'aria-hidden': true, focusable: 'false',
          style: { display: 'block', shapeRendering: 'crispEdges' },
        },
        h('ellipse', { cx: 49, cy: 77, rx: 38, ry: 4, fill: 'rgba(62, 42, 31, 0.16)' }),
        h('g', { className: 'pixel-cat__tail' },
          h('path', { d: 'M30 42H20V34H14V22H10V8H2V2H12V18H18V30H26V34H34Z', fill: INK }),
          h('path', { d: 'M26 38H24V30H16V18H10V8H6V6H8V20H14V34H26Z', fill: FUR }),
          h('rect', { x: 6, y: 8, width: 5, height: 9, fill: FUR_DARK }),
        ),
        h('g', { className: 'pixel-cat__body' },
          h('path', { d: 'M24 30H62V34H72V56H66V62H22V58H16V40H24Z', fill: INK }),
          h('path', { d: 'M28 34H58V38H66V52H60V56H26V52H22V42H28Z', fill: FUR }),
          h('path', { d: 'M44 40H62V54H42V48H36V42H44Z', fill: CREAM }),
          h('path', { d: 'M30 34H36V42H30ZM42 34H48V40H42ZM54 36H60V42H54Z', fill: FUR_DARK }),
        ),
        h('g', { className: 'pixel-cat__legs pixel-cat__legs--far' },
          h('g', { className: 'pixel-cat__leg pixel-cat__leg--back pixel-cat__leg--far', opacity: 0.72 },
            h('path', { d: 'M30 50H37V63H41V70H29V65H30Z', fill: INK }),
            h('path', { d: 'M32 54H35V63H32Z', fill: FUR_DARK }),
            h('path', { d: 'M32 64H37V67H39V68H31V66H32Z', fill: CREAM }),
          ),
          h('g', { className: 'pixel-cat__leg pixel-cat__leg--front pixel-cat__leg--far', opacity: 0.72 },
            h('path', { d: 'M55 50H62V63H66V69H54V65H55Z', fill: INK }),
            h('path', { d: 'M57 54H60V62H57Z', fill: FUR_DARK }),
            h('path', { d: 'M57 63H61V66H64V67H56V65H57Z', fill: CREAM }),
          ),
        ),
        stretching
          ? h('g', { className: 'pixel-cat__legs pixel-cat__legs--stretch' },
              h('path', { d: 'M58 50H68V56H82V60H90V68H82V66H58Z', fill: INK }),
              h('path', { d: 'M62 54H66V59H80V63H86V65H62Z', fill: CREAM }),
              h('path', { d: 'M22 52H32V65H36V71H20V66H22Z', fill: INK }),
              h('path', { d: 'M25 56H29V64H25V67H23V60H25Z', fill: FUR }),
              h('path', { d: 'M24 65H30V68H33V69H23V67H24Z', fill: CREAM }),
            )
          : h('g', { className: 'pixel-cat__legs' },
              h('g', { className: 'pixel-cat__leg pixel-cat__leg--back' },
                h('path', { d: 'M21 50H32V64H36V72H19V66H21Z', fill: INK }),
                h('path', { d: 'M24 54H29V63H25V66H23V58H24Z', fill: FUR }),
                h('path', { d: 'M23 64H30V68H33V69H22V66H23Z', fill: CREAM }),
              ),
              h('g', { className: 'pixel-cat__leg pixel-cat__leg--front' },
                h('path', { d: 'M59 48H69V62H74V70H58V65H59Z', fill: INK }),
                h('path', { d: 'M62 52H66V61H62Z', fill: FUR }),
                h('path', { d: 'M61 62H67V66H71V67H61V64H61Z', fill: CREAM }),
              ),
            ),
        h('g', { className: stretching ? 'pixel-cat__head pixel-cat__head--stretch' : 'pixel-cat__head' },
          h('path', { d: 'M58 12H62V4H70V12H78V8H85V15H89V22H92V35H88V41H81V46H64V43H56V20H58Z', fill: INK }),
          h('path', { d: 'M61 16H65V10H67V17H78V13H82V19H86V25H89V33H85V38H78V42H65V39H60V21H61Z', fill: FUR }),
          h('path', { d: 'M62 11H66V17H62ZM79 14H82V19H79Z', fill: PINK }),
          h('path', { d: 'M70 16H75V21H70ZM81 20H86V24H81Z', fill: FUR_DARK }),
          h('g', { className: 'pixel-cat__eyes pixel-cat__eyes--blink' },
            h('rect', { x: 75, y: 23, width: 5, height: 6, fill: INK }),
            h('rect', { x: 76, y: 23, width: 2, height: 2, fill: CREAM }),
          ),
          h('path', { d: 'M83 27H90V34H86V38H80V34H82V30H83Z', fill: CREAM }),
          h('rect', { x: 87, y: 27, width: 4, height: 3, fill: PINK }),
          h('path', { d: 'M85 32H88V35H85V38H81V36H84V34H85Z', fill: INK }),
          h('path', { d: 'M90 29H96V31H90ZM89 34H95V36H89Z', fill: INK }),
          h('rect', { x: 70, y: 34, width: 5, height: 3, fill: PINK, opacity: 0.7 }),
        ));
      }

      function SleepingCat() {
        return h('svg', {
          viewBox: '0 0 116 70', width: '116', height: '70', 'aria-hidden': true, focusable: 'false',
          style: { display: 'block', shapeRendering: 'crispEdges' },
        },
        h('ellipse', { cx: 58, cy: 62, rx: 49, ry: 5, fill: 'rgba(62, 42, 31, 0.17)' }),
        h('g', { className: 'pixel-cat__sleep-body' },
          h('path', { d: 'M36 24H82V18H94V24H102V34H110V50H102V58H36V52H28V32H36Z', fill: INK }),
          h('path', { d: 'M40 28H80V24H90V28H98V38H104V48H96V52H40V46H34V34H40Z', fill: FUR }),
          h('path', { d: 'M62 30H76V36H84V48H62V42H54V34H62Z', fill: CREAM }),
          h('path', { d: 'M82 24H90V30H82ZM94 34H100V42H94ZM50 28H58V34H50Z', fill: FUR_DARK }),
          h('path', { d: 'M100 44H110V36H114V50H108V56H88V50H100Z', fill: INK }),
          h('path', { d: 'M104 46H108V42H110V48H104V52H94V50H104Z', fill: FUR }),
        ),
        h('g', { className: 'pixel-cat__sleep-head' },
          h('path', { d: 'M8 16H20V22H38V16H50V24H56V54H4V24H8Z', fill: INK }),
          h('path', { d: 'M12 22H16V28H42V22H46V28H52V48H8V28H12Z', fill: FUR }),
          h('rect', { x: 12, y: 24, width: 6, height: 7, fill: PINK }),
          h('rect', { x: 42, y: 24, width: 6, height: 7, fill: PINK }),
          h('rect', { x: 24, y: 24, width: 8, height: 5, fill: FUR_DARK }),
          h('path', { d: 'M14 36H26V39H14ZM36 36H48V39H36Z', fill: INK }),
          h('rect', { x: 27, y: 39, width: 7, height: 5, fill: PINK }),
          h('path', { d: 'M24 46H28V48H34V46H38V50H34V52H28V50H24Z', fill: INK }),
          h('rect', { x: 12, y: 43, width: 8, height: 3, fill: PINK, opacity: 0.65 }),
          h('rect', { x: 42, y: 43, width: 8, height: 3, fill: PINK, opacity: 0.65 }),
          h('path', { d: 'M12 50H36V58H8V54H12ZM34 50H56V58H32V54H34Z', fill: INK }),
          h('path', { d: 'M16 52H30V55H14V53H16ZM38 52H50V55H36V53H38Z', fill: CREAM }),
        ));
      }

      function SleepLetters() {
        return h('span', { className: 'pixel-cat__sleep-letters', 'aria-hidden': true },
          h('span', { className: 'pixel-cat__z pixel-cat__z--one' }, 'z'),
          h('span', { className: 'pixel-cat__z pixel-cat__z--two' }, 'z'),
          h('span', { className: 'pixel-cat__z pixel-cat__z--three' }, 'z'),
        );
      }

      const character = {
        version: 1,
        id: 'pixel-cat',
        name: 'Orange Cat',
        sizes: {
          default: { width: 96, height: 84, footOffset: 76 },
          sit: { width: 84, height: 84, footOffset: 76 },
          squeeze: { width: 116, height: 70, footOffset: 62 },
          sleep: { width: 116, height: 70, footOffset: 62 },
        },
        render({ mode, direction }) {
          const sleeping = mode === 'sleep' || mode === 'squeeze';
          return h(React.Fragment, null,
            h('div', {
              className: 'pixel-cat__sprite',
              style: { transform: `scaleX(${direction})` },
            }, sleeping ? h(SleepingCat) : mode === 'sit' ? h(StandingCat, { mode }) : h(WalkingCat, { mode })),
            mode === 'sleep' ? h(SleepLetters) : null,
          );
        },
        styles: `
          .pixel-cat__actor--squeeze svg {
            transform-origin: 50% 100%;
            animation: pixel-cat-squeeze 720ms steps(5, end) both;
          }
          .pixel-cat__actor--jump .pixel-cat__leg { transform: translateY(-5px); }
          .pixel-cat__sprite {
            width: 100%;
            height: 100%;
            transform-origin: 50% 100%;
          }
          .pixel-cat__tail,
          .pixel-cat__leg,
          .pixel-cat__sleep-body { transform-box: fill-box; }
          .pixel-cat__tail {
            transform-origin: 100% 80%;
            animation: pixel-cat-tail 1.8s steps(3, end) infinite;
          }
          .pixel-cat__actor--walk .pixel-cat__leg--front {
            transform-origin: 50% 0%;
            animation: pixel-cat-step-front 480ms steps(2, end) infinite;
          }
          .pixel-cat__actor--walk .pixel-cat__leg--back {
            transform-origin: 50% 0%;
            animation: pixel-cat-step-back 480ms steps(2, end) infinite;
          }
          .pixel-cat__actor--walk .pixel-cat__leg--far.pixel-cat__leg--front { animation-name: pixel-cat-step-back; }
          .pixel-cat__actor--walk .pixel-cat__leg--far.pixel-cat__leg--back { animation-name: pixel-cat-step-front; }
          .pixel-cat__actor--stretch .pixel-cat__body,
          .pixel-cat__actor--stretch .pixel-cat__head {
            transform-box: fill-box;
            transform-origin: 50% 100%;
            animation: pixel-cat-stretch 1.4s steps(2, end) infinite;
          }
          .pixel-cat__head--sit { transform: translateY(3px); }
          .pixel-cat__eyes--blink { animation: pixel-cat-blink 5.2s steps(1, end) infinite; }
          .pixel-cat__sleep-body {
            transform-origin: 50% 100%;
            animation: pixel-cat-breathe 2.8s steps(4, end) infinite;
          }
          .pixel-cat__sleep-letters {
            position: absolute;
            right: -2px;
            top: -22px;
            width: 38px;
            height: 38px;
            color: ${INK};
            font-family: ui-monospace, monospace;
            font-weight: 900;
            line-height: 1;
          }
          .pixel-cat__z {
            position: absolute;
            opacity: 0;
            animation: pixel-cat-z 2.4s steps(5, end) infinite;
          }
          .pixel-cat__z--one { left: 0; bottom: 0; font-size: 15px; }
          .pixel-cat__z--two { left: 13px; bottom: 10px; font-size: 19px; animation-delay: 650ms; }
          .pixel-cat__z--three { left: 25px; bottom: 22px; font-size: 23px; animation-delay: 1300ms; }
          @keyframes pixel-cat-tail {
            0%, 100% { transform: rotate(0deg); }
            50% { transform: rotate(-8deg); }
          }
          @keyframes pixel-cat-step-front {
            0%, 100% { transform: translate(0, 0); }
            50% { transform: translate(4px, -5px); }
          }
          @keyframes pixel-cat-step-back {
            0%, 100% { transform: translate(0, -5px); }
            50% { transform: translate(-4px, 0); }
          }
          @keyframes pixel-cat-stretch {
            0%, 100% { transform: scaleY(1); }
            50% { transform: scaleY(1.045); }
          }
          @keyframes pixel-cat-blink {
            0%, 45%, 49%, 100% { opacity: 1; }
            46%, 48% { opacity: 0; }
          }
          @keyframes pixel-cat-breathe {
            0%, 100% { transform: scaleY(1); }
            50% { transform: scaleY(1.055); }
          }
          @keyframes pixel-cat-squeeze {
            0% { transform: scale(1, 1); }
            45% { transform: scale(0.72, 1.12); }
            75% { transform: scale(0.86, 0.96); }
            100% { transform: scale(1, 1); }
          }
          @keyframes pixel-cat-z {
            0% { opacity: 0; transform: translateY(5px); }
            25%, 72% { opacity: 1; }
            100% { opacity: 0; transform: translateY(-7px); }
          }
          @media (prefers-reduced-motion: reduce) {
            .pixel-cat__tail,
            .pixel-cat__leg,
            .pixel-cat__body,
            .pixel-cat__head,
            .pixel-cat__eyes,
            .pixel-cat__sleep-body,
            .pixel-cat__actor--squeeze svg,
            .pixel-cat__z { animation: none !important; }
            .pixel-cat__z--one { opacity: 1; }
          }
        `,
      };

        return character;
    }

    function createSiameseCharacter(React) {
      const h = React.createElement;
      const C = { ink:'#352e37', point:'#53434a', lightPoint:'#79616a', fur:'#e8daca', light:'#fff1dc', shade:'#c9b6a7', ear:'#b7878d', blue:'#69bff1', ice:'#c7efff' };
      const path = (d, fill, props = {}) => h('path', { d, fill, ...props });
      const rect = (x,y,width,height,fill) => h('rect',{x,y,width,height,fill});
      const group = (className,...children) => h('g',{className},...children);
      const shadow = (cx,cy,rx) => h('ellipse',{cx,cy,rx,ry:3,fill:'#352e371c'});
      function eye(x,y) {
        return group('siamese-eye', rect(x,y,8,7,C.blue),rect(x+2,y,3,6,C.ink),rect(x,y,2,2,C.ice),rect(x+6,y+4,2,2,C.ice));
      }
      function front() {
        return [
          shadow(43,77,27),
          group('siamese-tail',path('M58 66H70V60H76V42H80V38H84V44H82V64H76V72H58Z',C.ink),path('M64 66H72V60H78V44H80V62H74V68H64Z',C.point)),
          path('M30 37H55V45H60V56H64V72H22V58H26V45H30Z',C.ink),
          path('M32 41H53V47H56V58H60V69H26V59H30V47H32Z',C.fur),
          path('M35 43H50V50H53V64H32V52H35Z',C.light),
          path('M29 57H35V67H39V74H25V68H29ZM49 57H55V67H60V74H46V68H49Z',C.point),
          rect(28,69,6,2,C.lightPoint),rect(49,69,6,2,C.lightPoint),
          path('M17 5H22V9H28V15H56V9H62V5H67V21H71V36H67V42H60V47H26V43H19V38H15V21H17Z',C.ink),
          path('M20 11H23V15H29V19H55V16H61V11H64V24H68V34H64V40H58V44H28V40H22V35H18V24H20Z',C.fur),
          path('M20 12H23V18H27V23H20ZM61 13H64V24H57V20H61Z',C.point),
          rect(21,16,2,5,C.ear),rect(61,17,2,5,C.ear),
          path('M27 24H33V21H52V24H59V28H63V36H59V41H53V44H32V41H26V37H22V29H27Z',C.point),
          path('M33 24H51V27H55V30H30V27H33Z',C.lightPoint),
          eye(27,29),eye(50,29),
          path('M36 37H48V41H44V43H39V41H36Z',C.lightPoint),
          rect(39,36,6,3,C.ink),rect(40,36,2,1,C.ear),
          path('M41 39H43V42H46V43H43V42H40V43H37V42H41Z',C.ink),
          path('M13 34H22V35H13ZM12 39H22V40H12ZM63 34H73V35H63ZM63 39H74V40H63Z',C.shade),
        ];
      }
      function side(mode) {
        const stretch = mode === 'stretch';
        const airborne = mode === 'jump' || mode === 'drag';
        return [
          shadow(49,77,35),
          group('siamese-tail',path('M26 42H19V36H13V27H9V13H12V7H18V10H15V24H18V32H23V36H30Z',C.ink),path('M25 39H21V34H16V26H12V14H14V25H17V33H23V37H28Z',C.point)),
          group('siamese-far',path('M33 49H39V64H44V71H33V66H31ZM58 47H64V63H69V70H58Z',C.point)),
          group(stretch ? 'siamese-stretch' : '',
            path('M24 33H52V30H64V36H72V49H65V57H27V54H20V42H24Z',C.ink),
            path('M27 36H53V34H62V39H68V47H61V53H28V50H24V43H27Z',C.fur),
            path('M29 36H51V39H58V42H33V45H26V41H29Z',C.light),
            path('M27 48H34V51H59V48H65V51H61V54H28Z',C.shade)),
          group(airborne ? 'siamese-tucked' : 'siamese-legs',
            group('siamese-back',path('M25 48H33V62H30V68H35V74H21V68H24Z',C.ink),path('M27 51H31V60H28V66H26Z',C.fur),rect(24,68,8,4,C.point),rect(24,69,3,1,C.lightPoint)),
            stretch ? group('',path('M59 48H66V58H79V62H88V70H76V67H59Z',C.ink),path('M61 51H64V61H78V65H63Z',C.fur),rect(78,65,8,3,C.point)) : group('siamese-front',path('M60 47H67V66H73V73H59Z',C.ink),rect(62,50,3,14,C.light),rect(61,66,9,5,C.point),rect(62,67,3,1,C.lightPoint))),
          group(stretch ? 'siamese-bow' : 'siamese-head',
            path('M58 15H62V4H67V8H72V16H77V9H82V13H86V23H89V29H94V36H88V41H82V46H66V43H60V38H56V23H58Z',C.ink),
            path('M61 19H65V11H67V18H74V21H79V16H82V25H85V31H90V34H85V39H79V43H67V40H63V35H60V25H61Z',C.fur),
            path('M64 11H67V19H70V23H63ZM79 16H82V25H76V22H79Z',C.point),rect(65,15,2,5,C.ear),
            path('M71 24H81V27H85V31H90V35H85V40H78V43H69V39H65V32H68V27H71Z',C.point),
            path('M71 26H79V28H82V31H69V29H71Z',C.lightPoint),
            eye(73,29),rect(88,31,5,3,C.ink),
            path('M82 36H87V38H84V40H79V38H82Z',C.lightPoint),
            rect(85,35,2,3,C.ink),rect(82,38,4,1,C.ink),
            path('M88 37H96V38H88ZM87 40H94V41H87Z',C.shade)),
        ];
      }
      function sleep() {
        return [shadow(58,63,47),
          group('siamese-breathe',
            path('M36 29H43V23H75V25H86V30H96V39H102V53H96V60H34V55H28V38H36Z',C.ink),
            path('M39 32H46V27H73V29H83V33H92V41H98V51H92V56H38V52H32V40H39Z',C.fur),
            path('M46 28H71V31H80V34H83V39H75V36H49V39H38V35H46Z',C.light),
            path('M65 45H84V49H93V54H64V51H57V47H65Z',C.shade)),
          path('M12 24V12H17V16H23V23H40L47 16H51V30H57V49H51V55H16V52H10V45H8V31Z',C.ink),
          path('M15 24V19H18V24H24V27H40V25H47V22H48V32H53V46H48V51H18V48H14V43H12V33Z',C.fur),
          path('M14 20H18V26H22V31H14ZM45 25H49V32H41V29H45Z',C.point),
          path('M21 31H42V34H49V44H44V49H21V46H15V36H21Z',C.point),
          path('M20 38H23V40H28V38H30V42H23V41H20ZM35 38H37V40H42V38H45V41H42V42H35Z',C.ice),
          rect(29,43,6,3,C.ink),rect(31,46,2,2,C.lightPoint),
          path('M17 50H39V58H13V54H17Z',C.ink),rect(18,52,18,4,C.point),rect(20,53,5,1,C.lightPoint),
          path('M91 44H100V49H105V56H100V62H53V59H46V54H51V51H58V55H93V53H96V50H91Z',C.ink),
          path('M94 47H98V51H102V55H98V59H55V57H50V54H55V57H95V54H98V51H94Z',C.point),
          rect(59,57,25,2,C.lightPoint)];
      }
      const character = {
        version:1,id:'siamese-cat',name:'Siamese Cat',
        sizes:{default:{width:96,height:84,footOffset:76},sit:{width:84,height:84,footOffset:76},sleep:{width:116,height:70,footOffset:62},squeeze:{width:116,height:70,footOffset:62}},
        render({mode,direction}) {
          const asleep = mode === 'sleep' || mode === 'squeeze';
          const width = asleep ? 116 : mode === 'sit' ? 84 : 96;
          const height = asleep ? 70 : 84;
          return h('div',{className:`siamese-art siamese-${mode}`},
            h('svg',{viewBox:`0 0 ${width} ${height}`,width,height,'aria-hidden':true,focusable:false,style:{display:'block',shapeRendering:'crispEdges',transform:`scaleX(${mode==='sit'?1:direction})`}},...(asleep?sleep():mode==='sit'?front():side(mode))),
            mode==='sleep'?h('span',{className:'siamese-zzz','aria-hidden':true},'z',h('sup',null,'z')):null);
        },
        styles:`
          .siamese-art { position:relative; width:100%; height:100%; }
          .siamese-art svg { overflow:visible; }
          .siamese-tail { transform-box:fill-box; transform-origin:80% 90%; animation:siamese-tail 2.6s steps(4,end) infinite; }
          .siamese-eye { animation:siamese-blink 6.4s steps(1,end) infinite; }
          .siamese-walk .siamese-front { animation:siamese-step .56s steps(2,end) infinite; }
          .siamese-walk .siamese-back { animation:siamese-step .56s steps(2,end) -.28s infinite; }
          .siamese-walk .siamese-far { animation:siamese-step .56s steps(2,end) -.14s infinite; opacity:.78; }
          .siamese-tucked { transform:translateY(-5px); }
          .siamese-breathe { transform-box:fill-box; transform-origin:50% 100%; animation:siamese-breathe 3.2s steps(4,end) infinite; }
          .siamese-stretch { transform-origin:48px 54px; animation:siamese-stretch 2s steps(4,end) infinite; }
          .siamese-bow { transform:translateY(5px) rotate(5deg); transform-origin:68px 42px; }
          .siamese-squeeze svg { transform-origin:50% 90%; animation:siamese-squeeze .72s steps(4,end); }
          .siamese-zzz { position:absolute; right:10px; top:0; color:#79616a; font:700 15px ui-monospace,monospace; animation:siamese-dream 3s steps(5,end) infinite; }
          .siamese-zzz sup { margin-left:5px; font-size:11px; }
          @keyframes siamese-tail { 50% { transform:rotate(-7deg); } }
          @keyframes siamese-blink { 0%,46%,50%,100% { opacity:1; } 47%,49% { opacity:0; } }
          @keyframes siamese-step { 50% { transform:translate(3px,-4px); } }
          @keyframes siamese-breathe { 50% { transform:scaleY(1.045); } }
          @keyframes siamese-stretch { 50% { transform:scaleY(.88); } }
          @keyframes siamese-squeeze { 50% { scale:.82 1.06; } }
          @keyframes siamese-dream { 0%,100% { opacity:0; translate:0 0; } 30%,70% { opacity:.8; } 90% { translate:0 -8px; } }
          @media(prefers-reduced-motion:reduce) { .siamese-art * { animation:none!important; } }
        `,
      };
        return character;
    }

    const NS = 'pixel-companion';
    const MENU_ID = 'pixel-companion-context-menu';
    const MENU_MARGIN = 8;
    const zh = {
      'pet.menu': '{name}，像素伙伴。右键或按 Shift+F10 打开菜单。',
      'menu.label': '像素伙伴菜单',
      'menu.characters': '切换角色',
      'picker.label': '选择角色',
      'picker.select': '选择{name}',
      'character.pixel-cat': '橘猫',
      'character.siamese-cat': '暹罗猫',
    };
    const en = {
      'pet.menu': '{name}, pixel companion. Right-click or press Shift+F10 to open the menu.',
      'menu.label': 'Pixel companion menu',
      'menu.characters': 'Switch character',
      'picker.label': 'Choose a character',
      'picker.select': 'Choose {name}',
      'character.pixel-cat': 'Orange Cat',
      'character.siamese-cat': 'Siamese Cat',
    };

    function resolveSelection(registry) {
      const selectedId = registry.selected();
      const characters = registry.list().map(({ id }) => registry.get(id)).filter(Boolean);
      const character = registry.get(selectedId) || registry.get('pixel-cat') || characters[0] || null;
      return { selectedId, characters, character };
    }

    function constrainMenuPosition(x, y, width, height, viewportWidth, viewportHeight) {
      return {
        left: clamp(Math.round(x), MENU_MARGIN, Math.max(MENU_MARGIN, viewportWidth - width - MENU_MARGIN)),
        top: clamp(Math.round(y), MENU_MARGIN, Math.max(MENU_MARGIN, viewportHeight - height - MENU_MARGIN)),
      };
    }

    function characterName(character, t) {
      const key = `character.${character.id}`;
      return character.id === 'pixel-cat' || character.id === 'siamese-cat' ? t(key) : character.name;
    }

    function CharacterPreview({ character }) {
      const size = character.sizes.sit || character.sizes.default;
      return h('span', { className: 'pixel-companion__preview', 'aria-hidden': true },
        h('span', {
          className: 'pixel-companion__preview-sprite pixel-companion__actor--sit pixel-cat__actor--sit',
          style: { width: `${size.width}px`, height: `${size.height}px` },
        }, character.render({ mode: 'sit', direction: 1, React })));
    }

    function CharacterMenu({ menu, selection, t, menuRef, onShowCharacters, onSelect, onKeyDown }) {
      const charactersView = menu.view === 'characters';
      return h('div', {
        id: MENU_ID,
        ref: menuRef,
        className: `pixel-companion__menu${charactersView ? ' pixel-companion__menu--characters' : ''}`,
        role: 'menu',
        'aria-label': t(charactersView ? 'picker.label' : 'menu.label'),
        'data-pixel-companion-menu': menu.view,
        style: { left: `${menu.left}px`, top: `${menu.top}px` },
        onKeyDown,
      },
      charactersView ? [
        h('div', { key: 'title', className: 'pixel-companion__menu-title', role: 'presentation' }, t('menu.characters')),
        h('div', { key: 'characters', className: 'pixel-companion__character-list', 'data-character-list': true },
          selection.characters.map((character) => {
            const name = characterName(character, t);
            const active = selection.character?.id === character.id;
            return h('button', {
              key: character.id,
              type: 'button',
              className: `pixel-companion__choice${active ? ' pixel-companion__choice--active' : ''}`,
              'data-character-option': character.id,
              role: 'menuitemradio',
              'aria-checked': active,
              'aria-label': t('picker.select', { name }),
              onClick: () => onSelect(character.id),
            },
            h(CharacterPreview, { character }),
            h('span', { className: 'pixel-companion__choice-name' }, name),
            h('span', { className: 'pixel-companion__choice-check', 'aria-hidden': true }, active ? '✓' : ''));
          })),
      ] : h('button', {
        type: 'button',
        className: 'pixel-companion__menu-action',
        'data-menu-action': 'characters',
        role: 'menuitem',
        onClick: onShowCharacters,
      }, t('menu.characters')));
    }

    function PixelCompanionOverlay(props) {
      const { registry, t } = props;
      const conversationVisible = props.usePanelInfo((info) => info.activePanelId === null);
      const [selection, setSelection] = React.useState(() => resolveSelection(registry));
      const [cat, setCat] = React.useState(() => {
        const floor = floorPlatform();
        return makeState('walk', { x: floor.left + (floor.right - floor.left) * 0.58, y: floor.top, direction: -1 }, floor);
      });
      const [menu, setMenu] = React.useState(null);
      const platformsRef = React.useRef([floorPlatform()]);
      const dragRef = React.useRef(null);
      const actorRef = React.useRef(null);
      const menuRef = React.useRef(null);
      const menuOpenRef = React.useRef(false);
      const menuView = menu?.view;
      menuOpenRef.current = Boolean(menu);

      React.useEffect(() => registry.subscribe(() => setSelection(resolveSelection(registry))), [registry]);
      React.useEffect(() => {
        if (!conversationVisible) setMenu(null);
      }, [conversationVisible]);
      React.useEffect(() => {
        if (!conversationVisible) return undefined;
        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const refreshPlatforms = () => { platformsRef.current = collectPlatforms(); };
        refreshPlatforms();
        const behaviorTimer = window.setInterval(() => {
          if (!document.hidden && !dragRef.current && !menuOpenRef.current) {
            setCat((current) => advanceCat(current, platformsRef.current, reducedMotion));
          }
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

      React.useLayoutEffect(() => {
        if (!menu || !menuRef.current) return;
        const rect = menuRef.current.getBoundingClientRect();
        const position = constrainMenuPosition(menu.left, menu.top, rect.width, rect.height, window.innerWidth, window.innerHeight);
        if (position.left !== menu.left || position.top !== menu.top) {
          setMenu((current) => current ? { ...current, ...position } : null);
        }
      }, [menuView, selection.characters.length]);
      React.useLayoutEffect(() => {
        if (!menuView || !menuRef.current) return;
        if (!menuRef.current.contains(document.activeElement)) {
          menuRef.current.querySelector('button')?.focus({ preventScroll: true });
        }
      }, [menuView]);

      React.useEffect(() => {
        if (!menuView) return undefined;
        const closeOnOutsidePointer = (event) => {
          if (menuRef.current && !menuRef.current.contains(event.target)) setMenu(null);
        };
        const closeOnEscape = (event) => {
          if (event.key !== 'Escape') return;
          event.preventDefault();
          event.stopPropagation();
          setMenu(null);
          actorRef.current?.focus({ preventScroll: true });
        };
        const keepInViewport = () => setMenu((current) => {
          if (!current || !menuRef.current) return current;
          const rect = menuRef.current.getBoundingClientRect();
          const position = constrainMenuPosition(current.left, current.top, rect.width, rect.height, window.innerWidth, window.innerHeight);
          return position.left === current.left && position.top === current.top ? current : { ...current, ...position };
        });
        document.addEventListener('pointerdown', closeOnOutsidePointer, true);
        document.addEventListener('keydown', closeOnEscape, true);
        window.addEventListener('resize', keepInViewport);
        return () => {
          document.removeEventListener('pointerdown', closeOnOutsidePointer, true);
          document.removeEventListener('keydown', closeOnEscape, true);
          window.removeEventListener('resize', keepInViewport);
        };
      }, [menuView]);

      function closeMenu(restoreFocus = false) {
        setMenu(null);
        if (restoreFocus) actorRef.current?.focus({ preventScroll: true });
      }

      function openMenu(x, y) {
        const position = constrainMenuPosition(x, y, 160, 42, window.innerWidth, window.innerHeight);
        setMenu({ view: 'menu', ...position });
      }

      function openMenuFromActor() {
        const rect = actorRef.current?.getBoundingClientRect();
        if (rect) openMenu(rect.left + rect.width / 2, rect.top + rect.height / 2);
      }

      function handleContextMenu(event) {
        event.preventDefault();
        event.stopPropagation();
        if (event.clientX === 0 && event.clientY === 0) openMenuFromActor();
        else openMenu(event.clientX, event.clientY);
      }

      function handleActorKeyDown(event) {
        if (event.key !== 'ContextMenu' && !(event.key === 'F10' && event.shiftKey)) return;
        event.preventDefault();
        event.stopPropagation();
        openMenuFromActor();
      }

      function handleMenuKeyDown(event) {
        const items = Array.from(menuRef.current?.querySelectorAll('button') || []);
        if (!items.length) return;
        const currentIndex = items.indexOf(document.activeElement);
        let nextIndex;
        if (event.key === 'ArrowDown') nextIndex = (currentIndex + 1 + items.length) % items.length;
        else if (event.key === 'ArrowUp') nextIndex = (currentIndex - 1 + items.length) % items.length;
        else if (event.key === 'Home') nextIndex = 0;
        else if (event.key === 'End') nextIndex = items.length - 1;
        else return;
        event.preventDefault();
        items[nextIndex].focus({ preventScroll: true });
      }

      function startDrag(event) {
        if (event.button !== 0) return;
        event.preventDefault();
        event.stopPropagation();
        setMenu(null);
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

      if (!conversationVisible) return null;
      const character = selection.character;
      const size = character ? character.sizes[cat.mode] || character.sizes.default : null;
      return h('div', { className: 'dsh-pixel-companion dsh-pixel-cat' },
        selection.characters.map((item) => item.styles
          ? h('style', { key: `character-style:${item.id}`, 'data-character-style': item.id }, item.styles)
          : null),
        h('style', null, CSS),
        character ? h('div', {
          ref: actorRef,
          className: `pixel-companion__actor pixel-cat__actor pixel-companion__actor--${cat.mode} pixel-cat__actor--${cat.mode}`,
          'data-mode': cat.mode,
          'data-platform': cat.platformKey,
          'data-character': character.id,
          role: 'button',
          tabIndex: 0,
          'aria-label': t('pet.menu', { name: characterName(character, t) }),
          'aria-haspopup': 'menu',
          'aria-expanded': Boolean(menu),
          'aria-controls': menu ? MENU_ID : undefined,
          'aria-keyshortcuts': 'Shift+F10 ContextMenu',
          style: {
            left: `${cat.x}px`, top: `${cat.y - size.footOffset}px`,
            width: `${size.width}px`, height: `${size.height}px`,
          },
          onPointerDown: startDrag,
          onPointerMove: moveDrag,
          onPointerUp: endDrag,
          onPointerCancel: endDrag,
          onLostPointerCapture: endDrag,
          onContextMenu: handleContextMenu,
          onKeyDown: handleActorKeyDown,
        }, character.render({ mode: cat.mode, direction: cat.direction, React })) : null,
        menu ? h(CharacterMenu, {
          menu,
          selection,
          t,
          menuRef,
          onShowCharacters: () => setMenu((current) => current ? { ...current, view: 'characters' } : null),
          onSelect: (id) => { registry.select(id); closeMenu(true); },
          onKeyDown: handleMenuKeyDown,
        }) : null);
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
      .pixel-companion__actor:focus-visible {
        outline: 2px solid var(--dsw-alias-label-primary, CanvasText);
        outline-offset: 2px;
      }
      .pixel-companion__actor--drag {
        transition: none;
        cursor: grabbing;
      }
      .pixel-companion__menu {
        position: absolute;
        box-sizing: border-box;
        min-width: 144px;
        max-width: calc(100vw - 16px);
        max-height: calc(100vh - 16px);
        padding: 4px;
        overflow: hidden;
        pointer-events: auto;
        color: var(--dsw-alias-label-primary, CanvasText);
        background: var(--dsw-alias-bg-module-platform, Canvas);
        border: 1px solid var(--dsw-alias-border-l2, CanvasText);
        border-radius: 2px;
        box-shadow: 2px 2px 0 var(--dsw-alias-border-l2, CanvasText), 0 6px 16px rgba(0, 0, 0, 0.14);
        font: inherit;
      }
      .pixel-companion__menu--characters {
        display: flex;
        flex-direction: column;
        width: 216px;
      }
      .pixel-companion__menu-title {
        flex: none;
        padding: 5px 8px 7px;
        color: var(--dsw-alias-label-tertiary, CanvasText);
        border-bottom: 1px solid var(--dsw-alias-border-l2, CanvasText);
        font-size: 12px;
        line-height: 18px;
      }
      .pixel-companion__character-list {
        min-height: 0;
        max-height: min(340px, calc(100vh - 52px));
        overflow-y: auto;
        overscroll-behavior: contain;
      }
      .pixel-companion__menu-action {
        display: block;
        width: 100%;
        padding: 8px 10px;
        border: 0;
        border-radius: 0;
        color: inherit;
        background: transparent;
        font: inherit;
        line-height: 20px;
        text-align: left;
        white-space: nowrap;
        cursor: pointer;
      }
      .pixel-companion__menu-action:hover,
      .pixel-companion__choice:hover { background: var(--dsw-alias-interactive-bg-hover, rgba(127, 127, 127, 0.12)); }
      .pixel-companion__menu-action:focus-visible,
      .pixel-companion__choice:focus-visible { outline: 2px solid currentColor; outline-offset: -2px; }
      .pixel-companion__choice {
        display: grid;
        grid-template-columns: 44px minmax(0, 1fr) 16px;
        align-items: center;
        gap: 6px;
        width: 100%;
        min-height: 56px;
        padding: 4px 6px;
        border: 0;
        border-radius: 0;
        color: inherit;
        background: transparent;
        font: inherit;
        text-align: left;
        cursor: pointer;
      }
      .pixel-companion__choice--active {
        background: var(--dsw-alias-interactive-bg-hover, rgba(127, 127, 127, 0.12));
        box-shadow: inset 0 0 0 1px currentColor;
      }
      .pixel-companion__choice-name {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: 12px;
        line-height: 16px;
      }
      .pixel-companion__choice-check { text-align: center; }
      .pixel-companion__preview {
        display: flex;
        align-items: flex-end;
        justify-content: center;
        width: 42px;
        height: 40px;
        overflow: hidden;
        pointer-events: none;
      }
      .pixel-companion__preview-sprite {
        flex: none;
        transform: scale(0.44);
        transform-origin: 50% 100%;
      }
      .pixel-companion__preview *, .pixel-companion__preview-sprite {
        animation: none !important;
        transition: none !important;
      }
      @media (prefers-reduced-motion: reduce) {
        .pixel-companion__actor { transition: none; }
      }
    `;

    // Internal character modules stay independent from behavior and registration.
    // A new built-in only needs a factory and one entry here, not another plugin.
    const characterModules = [createOrangeCharacter, createSiameseCharacter];

    return {
      inject: ['slots', 'locale'],
      apply(ctx) {
        // Keep the public registry alive across engine reloads for external packs.
        const registry = createCharacterRegistry();
        ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'pixel-companion: dictionaries');
        ctx.effect(() => {
          const unregister = characterModules.map((createCharacter) => registry.register(createCharacter(React)));
          return () => {
            for (const dispose of unregister.reverse()) dispose();
          };
        }, 'pixel-companion: built-in characters');
        ctx.slots.inject('shell.overlay', () => ctx.slots.register({
          name: 'shell.overlay',
          id: 'pixel-companion',
          order: 20,
          locale: NS,
        }, (props) => h(PixelCompanionOverlay, { ...props, registry })));
      },
    };
  },
});
