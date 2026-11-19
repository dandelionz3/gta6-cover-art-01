/* Vice Cover Studio — offline multi-panel cover maker.
   Canvas 2D only, no network at runtime: photos come from the user's own
   files or the bundled samples, fonts are vendored woff2 files. */
(function () {
  'use strict';

  var canvas = document.getElementById('stage');
  var ctx = canvas.getContext('2d');

  var LAYOUTS = {
    'hero-grid': [
      { x: 0, y: 0, w: 0.62, h: 1 },
      { x: 0.62, y: 0, w: 0.38, h: 1 / 3 },
      { x: 0.62, y: 1 / 3, w: 0.38, h: 1 / 3 },
      { x: 0.62, y: 2 / 3, w: 0.38, h: 1 / 3 }
    ],
    'hero-three': [
      { x: 0, y: 0, w: 1, h: 0.62 },
      { x: 0, y: 0.62, w: 1 / 3, h: 0.38 },
      { x: 1 / 3, y: 0.62, w: 1 / 3, h: 0.38 },
      { x: 2 / 3, y: 0.62, w: 1 / 3, h: 0.38 }
    ],
    'full': [{ x: 0, y: 0, w: 1, h: 1 }],
    'strip3': [
      { x: 0, y: 0, w: 1 / 3, h: 1 },
      { x: 1 / 3, y: 0, w: 1 / 3, h: 1 },
      { x: 2 / 3, y: 0, w: 1 / 3, h: 1 }
    ],
    'grid2x2': [
      { x: 0, y: 0, w: 0.5, h: 0.5 },
      { x: 0.5, y: 0, w: 0.5, h: 0.5 },
      { x: 0, y: 0.5, w: 0.5, h: 0.5 },
      { x: 0.5, y: 0.5, w: 0.5, h: 0.5 }
    ]
  };

  var GRADES = {
    sunset: { filter: 'sepia(0.32) saturate(1.7) hue-rotate(-12deg) contrast(1.06)', stops: ['rgba(255,122,26,0.20)', 'rgba(255,46,136,0.22)'], mode: 'soft-light' },
    neon: { filter: 'saturate(1.6) contrast(1.14) brightness(0.96)', stops: ['rgba(25,211,197,0.20)', 'rgba(255,46,136,0.22)'], mode: 'overlay' },
    golden: { filter: 'sepia(0.5) saturate(1.45) brightness(1.06) contrast(1.02)', stops: ['rgba(255,196,66,0.20)', 'rgba(255,140,40,0.14)'], mode: 'soft-light' },
    noir: { filter: 'grayscale(1) contrast(1.22) brightness(1.02)', stops: ['rgba(255,255,255,0.06)', 'rgba(0,0,0,0.10)'], mode: 'overlay' }
  };

  var state = {
    layout: 'hero-grid',
    grade: 'sunset',
    grain: true,
    vignette: true,
    title: 'NEON SHORE',
    subtitle: 'one last ride down the coast',
    badge: 'VICE CITY NIGHTS',
    photos: [],          // { name, img }
    panels: [0, 1, 2, 3].map(function () { return { photo: -1, zoom: 1, ox: 0, oy: 0 }; }),
    selected: 0
  };

  var grainTile = null;
  function makeGrain() {
    var t = document.createElement('canvas');
    t.width = 160; t.height = 160;
    var c = t.getContext('2d');
    var d = c.createImageData(160, 160);
    for (var i = 0; i < d.data.length; i += 4) {
      var v = 110 + Math.floor(Math.random() * 90);
      d.data[i] = v; d.data[i + 1] = v; d.data[i + 2] = v; d.data[i + 3] = 255;
    }
    c.putImageData(d, 0, 0);
    grainTile = t;
  }
  makeGrain();

  function rectOf(panel, W, H) {
    return { x: panel.x * W, y: panel.y * H, w: panel.w * W, h: panel.h * H };
  }

  function drawPhotoInto(c, img, r, pan) {
    var iw = img.naturalWidth, ih = img.naturalHeight;
    var base = Math.max(r.w / iw, r.h / ih) * pan.zoom;
    var dw = iw * base, dh = ih * base;
    var dx = r.x + (r.w - dw) / 2 + pan.ox * r.w;
    var dy = r.y + (r.h - dh) / 2 + pan.oy * r.h;
    c.drawImage(img, dx, dy, dw, dh);
  }

  function drawCover(c, W, H) {
    var grade = GRADES[state.grade] || GRADES.sunset;
    var panels = LAYOUTS[state.layout];
    c.save();
    c.fillStyle = '#160a24';
    c.fillRect(0, 0, W, H);

    panels.forEach(function (p, i) {
      var r = rectOf(p, W, H);
      var pan = state.panels[i];
      var photo = state.photos[pan.photo];
      c.save();
      c.beginPath();
      c.rect(r.x + 1, r.y + 1, r.w - 2, r.h - 2);
      c.clip();
      if (photo) {
        c.filter = grade.filter;
        drawPhotoInto(c, photo.img, r, pan);
        c.filter = 'none';
      } else {
        var g = c.createLinearGradient(r.x, r.y, r.x + r.w, r.y + r.h);
        g.addColorStop(0, '#3a1c5e');
        g.addColorStop(1, '#160a24');
        c.fillStyle = g;
        c.fillRect(r.x, r.y, r.w, r.h);
        c.fillStyle = 'rgba(245,239,230,0.55)';
        c.font = '600 ' + Math.round(H * 0.028) + 'px system-ui, sans-serif';
        c.textAlign = 'center';
        c.fillText('Drop a photo here', r.x + r.w / 2, r.y + r.h / 2);
      }
      // grade colour wash
      var wash = c.createLinearGradient(r.x, r.y, r.x + r.w, r.y + r.h);
      wash.addColorStop(0, grade.stops[0]);
      wash.addColorStop(1, grade.stops[1]);
      c.globalCompositeOperation = grade.mode;
      c.fillStyle = wash;
      c.fillRect(r.x, r.y, r.w, r.h);
      c.globalCompositeOperation = 'source-over';
      c.restore();
      // panel divider
      c.strokeStyle = 'rgba(245,239,230,0.9)';
      c.lineWidth = Math.max(2, W / 640);
      c.strokeRect(r.x + 1, r.y + 1, r.w - 2, r.h - 2);
    });

    // bottom scrim so the lettering reads on any photo
    var scrim = c.createLinearGradient(0, H * 0.55, 0, H);
    scrim.addColorStop(0, 'rgba(10,4,18,0)');
    scrim.addColorStop(1, 'rgba(10,4,18,0.82)');
    c.fillStyle = scrim;
    c.fillRect(0, H * 0.55, W, H * 0.45);

    // badge pill, top-left
    if (state.badge.trim()) {
      var pad = Math.round(W * 0.016);
      c.font = '700 ' + Math.round(H * 0.026) + 'px system-ui, sans-serif';
      var bw = c.measureText(state.badge.trim().toUpperCase()).width + pad * 2.4;
      var bh = H * 0.058;
      var bx = W * 0.028, by = H * 0.045;
      c.fillStyle = 'rgba(255,46,136,0.92)';
      roundRect(c, bx, by, bw, bh, bh / 2);
      c.fill();
      c.fillStyle = '#fff';
      c.textAlign = 'left';
      c.textBaseline = 'middle';
      c.fillText(state.badge.trim().toUpperCase(), bx + pad * 1.2, by + bh / 2 + 1);
    }

    // title + script line, bottom-left
    var tx = W * 0.03, ty = H * 0.86;
    c.textAlign = 'left';
    c.textBaseline = 'alphabetic';
    if (state.title.trim()) {
      var titleSize = Math.min(W * 0.11, H * 0.16);
      c.font = Math.round(titleSize) + 'px Anton, sans-serif';
      c.lineJoin = 'round';
      c.strokeStyle = 'rgba(10,4,18,0.9)';
      c.lineWidth = Math.round(titleSize * 0.09);
      c.strokeText(state.title.trim().toUpperCase(), tx, ty);
      var tg = c.createLinearGradient(0, ty - titleSize, 0, ty);
      tg.addColorStop(0, '#fff7e8');
      tg.addColorStop(0.55, '#ffd166');
      tg.addColorStop(1, '#ff7a3d');
      c.fillStyle = tg;
      c.fillText(state.title.trim().toUpperCase(), tx, ty);
    }
    if (state.subtitle.trim()) {
      c.font = Math.round(H * 0.045) + 'px Pacifico, cursive';
      c.fillStyle = '#19d3c5';
      c.shadowColor = 'rgba(0,0,0,0.8)';
      c.shadowBlur = 6;
      c.fillText(state.subtitle.trim(), tx + 2, ty + H * 0.075);
      c.shadowBlur = 0;
    }

    if (state.vignette) {
      var v = c.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.42, W / 2, H / 2, Math.max(W, H) * 0.75);
      v.addColorStop(0, 'rgba(0,0,0,0)');
      v.addColorStop(1, 'rgba(0,0,0,0.42)');
      c.fillStyle = v;
      c.fillRect(0, 0, W, H);
    }
    if (state.grain && grainTile) {
      c.save();
      c.globalAlpha = 0.10;
      c.globalCompositeOperation = 'overlay';
      var pat = c.createPattern(grainTile, 'repeat');
      c.fillStyle = pat;
      c.fillRect(0, 0, W, H);
      c.restore();
    }
    c.restore();
  }

  function roundRect(c, x, y, w, h, r) {
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
  }

  function render() {
    drawCover(ctx, canvas.width, canvas.height);
    document.getElementById('hint').style.display =
      state.photos.length ? 'none' : 'block';
    syncPanelControls();
  }

  function syncPanelControls() {
    var sel = document.getElementById('panelPhoto');
    var cur = sel.value;
    sel.innerHTML = '';
    state.photos.forEach(function (p, i) {
      var o = document.createElement('option');
      o.value = String(i);
      o.textContent = (i + 1) + ' — ' + p.name;
      sel.appendChild(o);
    });
    var none = document.createElement('option');
    none.value = '-1';
    none.textContent = '(no photo)';
    sel.appendChild(none);
    var want = String(state.panels[state.selected].photo);
    sel.value = state.photos.length && sel.querySelector('option[value="' + want + '"]') ? want : '-1';
    var z = Math.round(state.panels[state.selected].zoom * 100);
    document.getElementById('zoomRange').value = String(z);
    document.getElementById('zoomVal').textContent = z + '%';
    document.getElementById('photoCount').textContent =
      state.photos.length + (state.photos.length === 1 ? ' photo loaded' : ' photos loaded');
  }

  function addPhoto(name, src, done) {
    var img = new Image();
    img.onload = function () {
      var idx = state.photos.length;
      state.photos.push({ name: name, img: img });
      // auto-fill empty panels with the new photo; if every panel already
      // has a photo, give the new one to the first panel that duplicates
      // another panel's photo, so each new photo shows up somewhere.
      var seen = {};
      var placed = false;
      state.panels.forEach(function (pan) {
        if (pan.photo === -1) { pan.photo = idx; placed = true; }
        else if (!placed && seen[pan.photo]) { pan.photo = idx; placed = true; }
        seen[pan.photo] = true;
      });
      if (state.photos.length === 1) {
        state.panels.forEach(function (pan) { pan.photo = 0; });
      }
      render();
      if (done) done(idx);
    };
    img.onerror = function () { if (done) done(-1); };
    img.src = src;
  }

  function loadSample(url, name) {
    fetch(url).then(function (r) { return r.blob(); }).then(function (b) {
      var reader = new FileReader();
      reader.onload = function () { addPhoto(name, reader.result); };
      reader.readAsDataURL(b);
    });
  }

  // ---- wiring ----
  document.getElementById('fileInput').addEventListener('change', function (e) {
    Array.prototype.forEach.call(e.target.files, function (f) {
      var reader = new FileReader();
      reader.onload = function () { addPhoto(f.name, reader.result); };
      reader.readAsDataURL(f);
    });
    e.target.value = '';
  });
  document.getElementById('sampleBoulevard').addEventListener('click', function () {
    loadSample('samples/boulevard.jpg', 'Boulevard');
  });
  document.getElementById('samplePier').addEventListener('click', function () {
    loadSample('samples/pier.jpg', 'Pier');
  });

  document.getElementById('layoutBtns').addEventListener('click', function (e) {
    var b = e.target.closest('[data-layout]');
    if (!b) return;
    state.layout = b.getAttribute('data-layout');
    document.querySelectorAll('#layoutBtns button').forEach(function (x) { x.classList.toggle('active', x === b); });
    render();
  });
  document.getElementById('gradeBtns').addEventListener('click', function (e) {
    var b = e.target.closest('[data-grade]');
    if (!b) return;
    state.grade = b.getAttribute('data-grade');
    document.querySelectorAll('#gradeBtns button').forEach(function (x) { x.classList.toggle('active', x === b); });
    render();
  });
  document.getElementById('grainToggle').addEventListener('change', function (e) { state.grain = e.target.checked; render(); });
  document.getElementById('vignetteToggle').addEventListener('change', function (e) { state.vignette = e.target.checked; render(); });
  document.getElementById('titleInput').addEventListener('input', function (e) { state.title = e.target.value; render(); });
  document.getElementById('subtitleInput').addEventListener('input', function (e) { state.subtitle = e.target.value; render(); });
  document.getElementById('badgeInput').addEventListener('input', function (e) { state.badge = e.target.value; render(); });
  document.getElementById('panelPhoto').addEventListener('change', function (e) {
    state.panels[state.selected].photo = Number(e.target.value);
    render();
  });
  document.getElementById('zoomRange').addEventListener('input', function (e) {
    state.panels[state.selected].zoom = Number(e.target.value) / 100;
    render();
  });
  document.getElementById('resetPan').addEventListener('click', function () {
    var pan = state.panels[state.selected];
    pan.zoom = 1; pan.ox = 0; pan.oy = 0;
    render();
  });

  // ---- canvas picking + panning ----
  function panelAt(mx, my) {
    var panels = LAYOUTS[state.layout];
    for (var i = 0; i < panels.length; i++) {
      var r = rectOf(panels[i], canvas.width, canvas.height);
      if (mx >= r.x && mx < r.x + r.w && my >= r.y && my < r.y + r.h) return i;
    }
    return 0;
  }
  var drag = null;
  canvas.addEventListener('pointerdown', function (e) {
    var box = canvas.getBoundingClientRect();
    var mx = (e.clientX - box.left) * canvas.width / box.width;
    var my = (e.clientY - box.top) * canvas.height / box.height;
    state.selected = panelAt(mx, my);
    drag = { x: mx, y: my };
    canvas.setPointerCapture(e.pointerId);
    render();
  });
  canvas.addEventListener('pointermove', function (e) {
    if (!drag) return;
    var box = canvas.getBoundingClientRect();
    var mx = (e.clientX - box.left) * canvas.width / box.width;
    var my = (e.clientY - box.top) * canvas.height / box.height;
    var r = rectOf(LAYOUTS[state.layout][state.selected], canvas.width, canvas.height);
    var pan = state.panels[state.selected];
    pan.ox += (mx - drag.x) / r.w;
    pan.oy += (my - drag.y) / r.h;
    pan.ox = Math.max(-0.6, Math.min(0.6, pan.ox));
    pan.oy = Math.max(-0.6, Math.min(0.6, pan.oy));
    drag = { x: mx, y: my };
    render();
  });
  canvas.addEventListener('pointerup', function () { drag = null; });

  // ---- export ----
  function exportCover(w, h, name) {
    var off = document.createElement('canvas');
    off.width = w; off.height = h;
    var c = off.getContext('2d');
    drawCover(c, w, h);
    off.toBlob(function (blob) {
      if (!blob) return;
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = name;
      document.body.appendChild(a);
      a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
    }, 'image/png');
  }
  document.getElementById('exportSquare').addEventListener('click', function () { exportCover(1080, 1080, 'vice-cover-1080x1080.png'); });
  document.getElementById('exportPortrait').addEventListener('click', function () { exportCover(1080, 1350, 'vice-cover-1080x1350.png'); });
  document.getElementById('exportWide').addEventListener('click', function () { exportCover(1920, 1080, 'vice-cover-1920x1080.png'); });

  // ---- ?shot= demo hooks (screenshots use the app's own drawing code) ----
  var params = new URLSearchParams(location.search);
  var shot = params.get('shot');
  var shotSizes = {
    'cover': [1280, 720, 'hero-three'],
    'cover-portrait': [1024, 1280, 'hero-grid'],
    'cover-square': [1024, 1024, 'grid2x2']
  };
  function applyShot() {
    if (!shot || !shotSizes[shot]) return false;
    var spec = shotSizes[shot];
    state.layout = spec[2];
    state.title = 'NEON SHORE';
    state.subtitle = 'one last ride down the coast';
    state.badge = 'VICE CITY NIGHTS';
    canvas.width = spec[0];
    canvas.height = spec[1];
    document.querySelector('.shell').style.display = 'block';
    document.querySelector('.controls').style.display = 'none';
    document.querySelector('.photo-row').style.display = 'none';
    document.querySelector('.tip').style.display = 'none';
    return true;
  }
  var isShot = applyShot();

  function loadShotSamples() {
    var urls = [['samples/boulevard.jpg', 'Boulevard'], ['samples/pier.jpg', 'Pier']];
    var loaded = 0;
    urls.forEach(function (u, i) {
      fetch(u[0]).then(function (r) { return r.blob(); }).then(function (b) {
        var reader = new FileReader();
        reader.onload = function () {
          var img = new Image();
          img.onload = function () {
            state.photos[i] = { name: u[1], img: img };
            state.panels.forEach(function (pan, pi) { pan.photo = pi % 2 === 0 ? 0 : 1; });
            if (++loaded === urls.length) render();
          };
          img.src = reader.result;
        };
        reader.readAsDataURL(b);
      });
    });
  }

  // fonts first, then first paint
  if (document.fonts && document.fonts.ready) {
    document.fonts.load('40px Anton').catch(function () {});
    document.fonts.load('20px Pacifico').catch(function () {});
    document.fonts.ready.then(function () { render(); });
  }
  if (shot === 'editor') {
    loadSample('samples/boulevard.jpg', 'Boulevard');
  } else if (isShot) {
    loadShotSamples();
  }
  render();
})();
