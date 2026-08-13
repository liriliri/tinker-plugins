import escapeJsStr from 'licia/escapeJsStr'
import browserfsUrl from 'browserfs/dist/browserfs.min.js?url'

/**
 * Build the iframe HTML that boots dosbox-sync.js without the emularity loader.
 *
 * Replaces public/loader.js (~1900 lines) with a dosbox-only boot path:
 *   - DosBoxLoader argument construction (single hdd mount)
 *   - EmscriptenRunner Module setup + BrowserFS mounting
 *   - OverlayFS(InMemory writable, Mountable readable) + ZipFS at /c
 *   - moveConfigToRoot (dosbox.conf search)
 *   - locateFile for dosbox-sync.mem
 *
 * Dropped: MAME/VICE/SAE/PCE/PC98 loaders, archive.org metadata fetch,
 * splash UI, waitAfterDownloading, IndexedDB persistence (InMemory only).
 */
export function buildDosboxIframeHtml(
  zipUrl: string,
  startExe: string,
  baseUrl: string,
) {
  const zipUrlJs = escapeJsStr(zipUrl)
  const startExeJs = escapeJsStr(startExe)
  const baseUrlJs = escapeJsStr(baseUrl)
  const browserFsJs = escapeJsStr(
    new URL(browserfsUrl, window.location.href).href,
  )

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<style>
html,body{margin:0;padding:0;width:100%;height:100%;overflow:hidden;background:#000;}
#screen{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:#000;}
canvas.emscripten{border:0;outline:none;background:#000;image-rendering:pixelated;width:var(--fit-w,100%)!important;height:var(--fit-h,100%)!important;}
</style>
</head>
<body>
<div id="screen">
  <canvas class="emscripten" id="canvas" width="640" height="480" tabindex="0" oncontextmenu="event.preventDefault()"></canvas>
</div>
<script src="${browserFsJs}"><\/script>
<script>
(function () {
  var BASE_URL = '${baseUrlJs}';
  var ZIP_URL = '${zipUrlJs}';
  var START_EXE = '${startExeJs}';
  var canvas = document.getElementById('canvas');
  var screen = document.getElementById('screen');

  function fitCanvas() {
    var pw = screen.clientWidth;
    var ph = screen.clientHeight;
    var iw = canvas.width;
    var ih = canvas.height;
    if (!pw || !ph || !iw || !ih) return;
    var scale = Math.min(pw / iw, ph / ih);
    screen.style.setProperty('--fit-w', iw * scale + 'px');
    screen.style.setProperty('--fit-h', ih * scale + 'px');
  }
  window.addEventListener('resize', fitCanvas);
  new ResizeObserver(fitCanvas).observe(screen);
  new MutationObserver(fitCanvas).observe(canvas, {
    attributes: true,
    attributeFilter: ['width', 'height'],
  });
  fitCanvas();

  // Forward app shortcuts to parent. Only meta combos — ctrl is game input in DOS.
  window.addEventListener('keydown', function (e) {
    if (!e.metaKey || e.altKey) return;
    var key = String(e.key).toLowerCase();
    if (['o', 'r', 'f', 'b'].indexOf(key) === -1) return;
    e.preventDefault();
    parent.postMessage({ type: 'tinker-dos:shortcut', key: key }, '*');
  });

  function locateFile(filename) {
    if (filename === 'dosbox.html.mem' || /\\.mem$/.test(filename)) {
      return BASE_URL + 'dosbox/dosbox-sync.mem';
    }
    return BASE_URL + 'dosbox/' + filename;
  }

  // BFS flags — emularity synthesizes these because it doesn't use BFS "correctly"
  var FLAG_R = { isReadable: function(){return true;}, isWriteable: function(){return false;},
                 isTruncating: function(){return false;}, isAppendable: function(){return false;},
                 isSynchronous: function(){return false;}, isExclusive: function(){return false;},
                 pathExistsAction: function(){return 0;}, pathNotExistsAction: function(){return 1;} };
  var FLAG_W = { isReadable: function(){return false;}, isWriteable: function(){return true;},
                 isTruncating: function(){return false;}, isAppendable: function(){return false;},
                 isSynchronous: function(){return false;}, isExclusive: function(){return false;},
                 pathExistsAction: function(){return 0;}, pathNotExistsAction: function(){return 3;} };

  function moveConfigToRoot(fs) {
    var confPath = null;
    function search(dir) {
      fs.readdirSync(dir).forEach(function (item) {
        if (confPath) return;
        if (item === '.' || item === '..') return;
        var p = dir + (dir[dir.length - 1] !== '/' ? '/' : '') + item;
        var st = fs.statSync(p);
        if (st.isDirectory(st.mode)) search(p);
        else if (item === 'dosbox.conf') confPath = p;
      });
    }
    search('/');
    if (confPath !== null) {
      fs.writeFileSync('/dosbox.conf', fs.readFileSync(confPath, null, FLAG_R), null, FLAG_W, 0x1a4);
    }
  }

  // Mirror emularity build_dosbox_arguments for the single hdd mount case.
  function buildArgs(start) {
    var args = ['-conf', '/emulator/dosbox.conf', '-c', 'mount c /emulator/c'];
    var parts = start.split(/\\\\|\\//);
    args.push('-c', /^[a-zA-Z]:$/.test(parts[0]) ? parts.shift() : 'c:');
    var prog = parts.pop();
    if (parts.length) args.push('-c', 'cd ' + parts.join('/'));
    if (prog) args.push('-c', prog);
    return args;
  }

  function attachScript(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.type = 'text/javascript';
      s.addEventListener('load', function () { resolve(); });
      s.addEventListener('error', function () { reject(new Error('failed to load ' + src)); });
      s.src = src;
      document.getElementsByTagName('head')[0].appendChild(s);
    });
  }

  // InMemory writable + Mountable readable. IndexedDB persistence skipped for now
  // (AsyncMirror init is unreliable in this iframe context).
  function setupFs() {
    return new Promise(function (resolve, reject) {
      var inMemoryFS = new BrowserFS.FileSystem.InMemory();
      var fs = new BrowserFS.FileSystem.OverlayFS(
        inMemoryFS,
        new BrowserFS.FileSystem.MountableFileSystem()
      );
      fs.initialize(function (e) {
        if (e) { reject(e); return; }
        var Buffer = BrowserFS.BFSRequire('buffer').Buffer;
        fetch(ZIP_URL)
          .then(function (r) { return r.arrayBuffer(); })
          .then(function (buf) {
            fs.getOverlayedFileSystems().readable.mount(
              '/c',
              new BrowserFS.FileSystem.ZipFS(new Buffer(buf))
            );
            moveConfigToRoot(fs);
            resolve(fs);
          })
          .catch(reject);
      });
    });
  }

  setupFs().then(function (fs) {
    // Assign global Module like emularity's EmscriptenRunner (before attaching script).
    // A local var + window.Module assignment is not enough — dosbox-sync.js expects
    // the bare global binding that classic scripts share.
    Module = {
      arguments: buildArgs(START_EXE),
      screenIsReadOnly: true,
      print: function (text) { console.log(text); },
      printErr: function (text) { console.log(text); },
      canvas: canvas,
      noInitialRun: false,
      locateFile: locateFile,
      preInit: function () {
        BrowserFS.initialize(fs);
        var BFS = new BrowserFS.EmscriptenFS();
        FS.mkdir('/emulator');
        FS.mount(BFS, { root: '/' }, '/emulator');
      },
    };

    return attachScript(BASE_URL + 'dosbox/dosbox-sync.js');
  }).then(function () {
    fitCanvas();
    canvas.focus();
    parent.postMessage({ type: 'tinker-dos:ready' }, '*');
  }).catch(function (e) {
    console.error('dosbox boot failed:', e);
    parent.postMessage({ type: 'tinker-dos:error', message: String(e && e.message || e) }, '*');
  });
})();
<\/script>
</body>
</html>`
}
