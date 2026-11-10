window.__ModuleLoader__.load({
  id: '@local/pixel-siamese-assets',
  factory(require) {
    const React = require('react');
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
      version:1,id:'siamese-cat',name:'暹罗猫 · 蓝眸',
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
    return { apply() {
      const api = window.PixelCompanion;
      if (!api) throw new Error('Siamese character requires Pixel Companion.');
      const unregister = api.register(character);
      // Select this newly requested character once; later manual selections survive reloads.
      const key = 'pixel-companion.siamese-introduced';
      try { if (!window.localStorage.getItem(key)) { api.select(character.id); window.localStorage.setItem(key,'1'); } }
      catch { api.select(character.id); }
      return unregister;
    }};
  },
});
