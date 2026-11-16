// The beach at Clawd's left, and the sand it shares with Clawd's stage.

import { EDGE, path } from './pixels'

/** The sand Clawd and its beach stand on: the same strip in both drawings, so
 * it runs on from one into the other. */
export const SAND = { color: '#E8C46A', opacity: 0.6, depth: 2 }

/** Where the sand starts in Clawd's own pixels: its feet stand in it. */
export const GROUND = 9 - SAND.depth

/** The beach at Clawd's left, in pixels of Clawd's size: 18 tall like its
 * stage, the sand along the bottom two. From the left: the sea fading in, a
 * sailboat, the shore, then things on the sand up to Clawd's stage. */
export const BEACH = { w: 279, h: 18, height: 31 }
export const BEACH_WIDTH = Math.round((BEACH.w * BEACH.height) / BEACH.h)

const BEACH_CSS = `
  .wave,.foam,.boat,.cloud,.gull,.ball,.palm,.pal{transform-box:fill-box}
  .wave{animation:lap 1.8s steps(2) infinite alternate}
  .w2{animation-delay:-.9s}
  @keyframes lap{to{transform:translateX(2px)}}
  .foam{animation:wash 3.6s ease-in-out infinite alternate}
  @keyframes wash{from{transform:translateX(-2px);opacity:.35}to{transform:translateX(1px);opacity:1}}
  .boat{animation:bob 2.4s steps(2) infinite alternate}
  @keyframes bob{to{transform:translateY(1px)}}
  .cloud{animation:drift 50s linear infinite alternate}
  .c2{animation-duration:70s}
  @keyframes drift{to{transform:translateX(40px)}}
  .gull{animation:fly 36s linear infinite}
  @keyframes fly{from{transform:translateX(-80px)}to{transform:translateX(230px)}}
  .fa,.fb{animation:flap .8s steps(1) infinite}
  .fb{animation-delay:-.4s}
  @keyframes flap{0%{opacity:1}50%{opacity:0}}
  .ball{animation:bounce .7s ease-out infinite alternate}
  @keyframes bounce{to{transform:translateY(-3px)}}
  .palm{animation:sway 3s steps(2) infinite alternate}
  @keyframes sway{to{transform:translateX(1px)}}
  .pal{animation:scuttle 6s ease-in-out infinite alternate}
  @keyframes scuttle{to{transform:translateX(22px)}}
`

export const BEACH_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${BEACH.w} ${BEACH.h}" width="${BEACH_WIDTH}" height="${BEACH.height}" shape-rendering="crispEdges">
<style>${BEACH_CSS}</style>
<g fill="#6FA8E8">${[0.12, 0.24, 0.36].map((o, i) => `<rect x="${i * 8}" y="13" width="8" height="5" opacity="${o}"/>`).join('')}<rect x="24" y="13" width="28" height="5" opacity=".48"/></g>
<g fill="#4F8FD8" opacity=".3"><rect x="16" y="16" width="32" height="2"/></g>
<g class="wave" fill="#BFD9F5">${path('#BFD9F5', 'M10 12h3v1h-3zM30 12h4v1h-4zM42 12h3v1h-3z')}</g>
<g class="wave w2">${path('#BFD9F5', 'M14 14h3v1h-3zM34 14h4v1h-4z')}</g>
<g class="foam">${path('#EAF3FC', 'M51 13h2v1h-2zM52 14h2v1h-2zM52 15h3v1h-3z')}</g>
<rect x="52" y="16" width="${BEACH.w - 52}" height="${SAND.depth}" fill="${SAND.color}" opacity="${SAND.opacity}"/>
${path('#D9A441', 'M60 17h1v1h-1zM79 17h1v1h-1zM101 17h1v1h-1zM141 17h1v1h-1zM176 17h1v1h-1zM209 17h1v1h-1zM247 17h1v1h-1zM266 17h1v1h-1z')}
${path('#F2C14E', 'M41 1h3v3h-3zM39 2h1v1h-1zM45 2h1v1h-1zM42 -1h1v1h-1zM42 5h1v1h-1z')}
<g class="boat">${path('#8B5A2B', 'M22 4h1v7h-1z')}${path('#D77757', 'M23 5h1v1h-1zM23 6h2v1h-2zM23 7h3v1h-3zM23 8h4v2h-4z')}${path('#F7F7F7', 'M18 11h9v1h-9zM19 12h7v1h-7z', EDGE)}</g>
<g class="cloud" opacity=".75">${path('#C9D3E0', 'M92 1h6v1h-6zM90 2h10v1h-10zM91 3h8v1h-8z')}</g>
<g class="cloud c2" opacity=".75">${path('#C9D3E0', 'M172 2h5v1h-5zM171 3h8v1h-8z')}</g>
<g class="gull" fill="#9AA0A6"><path class="fa" d="M60 5h2v1h-2zM62 6h1v1h-1zM63 5h2v1h-2z"/><path class="fb" d="M60 7h2v1h-2zM62 6h1v1h-1zM63 7h2v1h-2z"/></g>
${path('#F58FB0', 'M67 13h3v1h-3zM66 14h5v2h-5z')}${path('#D9608A', 'M67 14h1v2h-1zM69 14h1v2h-1z')}
${path('#F2C14E', 'M88 12h1v1h-1zM86 13h5v1h-5zM87 14h3v1h-3zM87 15h1v1h-1zM89 15h1v1h-1z')}
${path('#D9A441', 'M108 9h1v1h-1zM110 9h1v1h-1zM116 9h1v1h-1zM118 9h1v1h-1zM108 10h3v6h-3zM116 10h3v6h-3zM112 12h1v1h-1zM114 12h1v1h-1zM111 13h5v3h-5z')}
${path('#8B5A2B', 'M113 14h1v2h-1zM109 5h1v4h-1z')}
<g fill="#E24B4A"><path class="fa" d="M110 5h3v1h-3zM110 6h2v1h-2z"/><path class="fb" d="M110 5h2v1h-2zM110 6h3v1h-3z"/></g>
<g class="ball">${path('#E24B4A', 'M131 12h1v1h-1zM130 13h2v2h-2zM131 15h1v1h-1z')}${path('#FFE9A8', 'M132 12h1v1h-1zM132 13h2v2h-2zM132 15h1v1h-1z')}</g>
${path('#9AA0A6', 'M155 7h1v9h-1z')}
${path('#E24B4A', 'M153 4h5v1h-5zM151 5h9v1h-9zM150 6h11v1h-11z')}${path('#FFE9A8', 'M155 4h1v1h-1zM153 5h2v2h-2zM157 5h2v2h-2z')}
${path('#5FC7A0', 'M159 15h10v1h-10z')}${path('#FFE9A8', 'M161 15h1v1h-1zM164 15h1v1h-1zM167 15h1v1h-1z')}
${path('#8B5A2B', 'M197 6h1v4h-1zM196 10h1v3h-1zM195 13h1v3h-1z')}
<g class="palm">${path('#4FB58E', 'M194 2h2v1h-2zM199 2h2v1h-2zM193 3h4v1h-4zM198 3h4v1h-4zM192 4h2v1h-2zM195 4h5v1h-5zM201 4h2v1h-2zM191 5h1v1h-1zM196 5h3v1h-3zM203 5h1v1h-1z')}</g>
${path('#6B4423', 'M196 6h1v1h-1zM198 6h1v1h-1z')}
${path('#9AA0A6', 'M217 14h1v1h-1zM216 15h3v1h-3z')}
<g class="pal">${path('#EE8FB0', 'M242 12h1v1h-1zM248 12h1v1h-1zM243 13h5v2h-5zM243 15h1v1h-1zM245 15h1v1h-1zM247 15h1v1h-1z')}${path('#000', 'M244 13h1v1h-1zM246 13h1v1h-1z')}</g>
</svg>`
