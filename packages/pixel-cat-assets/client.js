window.__ModuleLoader__.load({
  id: '@local/pixel-cat-assets',
  factory(require) {
    const React = require('react');
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
      name: '像素小猫',
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

    return {
      apply() {
        if (!window.PixelCompanion) throw new Error('Pixel cat assets require @local/pixel-cat-companion.');
        return window.PixelCompanion.register(character);
      },
    };
  },
});
