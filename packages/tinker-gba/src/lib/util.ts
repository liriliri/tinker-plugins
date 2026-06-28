import escapeJsStr from 'licia/escapeJsStr'

export function buildIframeHtml(
  gameUrl: string,
  gameName: string,
  baseUrl: string,
  loadingText: string,
) {
  const escapedGameUrl = escapeJsStr(gameUrl)
  const escapedGameName = escapeJsStr(gameName)
  const escapedCoreUrl = escapeJsStr(`${baseUrl}vba_next_libretro.js`)
  const escapedLoadingText = escapeJsStr(loadingText)

  return `<!DOCTYPE html>
<html>
<head>
<style>
html,body{margin:0;padding:0;overflow:hidden;background:#000;}
.container{position:fixed;inset:0;display:flex;justify-content:center;align-items:center;background:#000;}
#loading{position:absolute;inset:0;background:#000;color:#fff;display:flex;align-items:center;justify-content:center;font:18px Menlo,monospace;z-index:10;}
#canvas{aspect-ratio:3/2;height:100%!important;max-width:100%;max-height:100%;outline:none;}
</style>
</head>
<body>
<script>
navigator.getGamepads = () => [];
window.addEventListener('gamepadconnected', e => e.stopImmediatePropagation(), true);
window.addEventListener('gamepaddisconnected', e => e.stopImmediatePropagation(), true);
</script>
<div class="container">
  <div id="loading">${escapedLoadingText}</div>
  <canvas id="canvas"></canvas>
</div>
<script>window.gameUrl='${escapedGameUrl}';window.gameName='${escapedGameName}';window.coreUrl='${escapedCoreUrl}';</script>
<script type="module" src="${baseUrl}bootstrap.js"></script>
</body>
</html>`
}
