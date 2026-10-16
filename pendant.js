'use strict';

(() => {
  const stage = document.querySelector('.pendant-stage');
  if (!stage || !window.PendantPhysics || !window.PendantGeometry) return;
  const canvas = stage.querySelector('.pendant-canvas');
  const fallback = stage.querySelector('.pendant-fallback');
  const irisImage = new Image();
  irisImage.decoding = 'async';
  irisImage.src = 'assets/eye-iris-blue-v1.webp';
  const hitArea = stage.querySelector('.pendant-hit-area');
  const chainHits = [...stage.querySelectorAll('.pendant-hit:not(.pendant-hit-body)')];
  const bodyHit = stage.querySelector('.pendant-hit-body');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const { Necklace } = window.PendantPhysics;
  const physics = new Necklace();
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const normalize = v => { const d = Math.hypot(...v) || 1; return v.map(n => n / d); };
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const identity = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
  let gl, program, locations, linkMesh, pendantMesh, stoneMesh, texture;
  let ready = false, visible = false, contextLost = false, frame = 0, lastTime = 0, quietTime = 0;
  let width = 1, height = 1, worldHeight = 3.2, worldWidth = 2.3;
  let pointer = null, previousHover = null;
  let alphaPixels = null, textureWidth = 0, textureHeight = 0;
  let amuletDimensions;
  let amuletSilhouette;
  let cueVisible = false, entryCueAvailable = true;
  let lastCueTime = -Infinity, lastInteractionTime = -Infinity;
  const model = new Float32Array(16);
  const projection = new Float32Array(16);
  const eye = { left: -.80, right: .83, top: .09, bottom: -1.14 };

  function shader(type, source) {
    const result = gl.createShader(type);
    gl.shaderSource(result, source);
    gl.compileShader(result);
    if (!gl.getShaderParameter(result, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(result));
    return result;
  }

  function createProgram() {
    const result = gl.createProgram();
    const vertex = shader(gl.VERTEX_SHADER, `
      attribute vec3 aPosition;
      attribute vec3 aNormal;
      attribute vec2 aUV;
      uniform mat4 uModel;
      uniform mat4 uProjection;
      varying vec3 vNormal;
      varying vec3 vPosition;
      varying vec2 vUV;
      void main() {
        vec4 world = uModel * vec4(aPosition, 1.0);
        vPosition = world.xyz;
        vNormal = mat3(uModel) * aNormal;
        vUV = aUV;
        gl_Position = uProjection * world;
      }
    `);
    const fragment = shader(gl.FRAGMENT_SHADER, `
      precision highp float;
      uniform sampler2D uTexture;
      uniform float uMaterial;
      varying vec3 vNormal;
      varying vec3 vPosition;
      varying vec2 vUV;
      vec3 fresnelSchlick(float cosine, vec3 f0) {
        return f0 + (1.0 - f0) * pow(1.0 - cosine, 5.0);
      }
      vec3 studio(vec3 r, float roughness) {
        // A subdued room and smaller softboxes leave room for the gold's midtones.
        vec3 environment = mix(vec3(0.13, 0.12, 0.105), vec3(0.45, 0.44, 0.42), smoothstep(-0.7, 0.9, r.y));
        float front = mix(0.45, 1.0, smoothstep(-0.2, 0.25, r.z));
        float blur = roughness * 0.20;
        float keyCard = exp(-pow(abs((r.x + 0.35) / (0.33 + blur)), 4.0) - pow(abs((r.y - 0.34) / (0.75 + blur)), 4.0)) * front;
        float fillCard = exp(-pow(abs((r.x - 0.72) / (0.18 + blur)), 4.0) - pow(abs((r.y - 0.10) / (0.90 + blur)), 4.0)) * front;
        float overhead = exp(-pow((r.y - 0.87) / (0.045 + blur), 2.0)) * 0.10 / (0.045 + blur);
        float strip = exp(-pow((r.y - 0.32) / (0.055 + blur), 2.0) - pow(abs(r.x / 0.75), 4.0)) * front;
        float darkFlag = exp(-pow((r.x - 0.22) / 0.18, 2.0)) * 0.64;
        environment *= 1.0 - darkFlag;
        environment += vec3(1.50, 1.46, 1.38) * keyCard;
        environment += vec3(0.65, 0.67, 0.70) * fillCard;
        environment += vec3(3.0, 2.85, 2.60) * overhead;
        environment += vec3(3.4, 3.35, 3.20) * strip;
        float blackCard = exp(-pow((r.y + 0.10) / 0.08, 2.0));
        environment *= 1.0 - 0.60 * blackCard;
        return environment;
      }
      vec3 displayColor(vec3 linearColor) {
        // Compress luminance together, preserving gold's colour in bright reflections.
        vec3 x = max(vec3(0.0), linearColor);
        float luminance = dot(x, vec3(0.2126, 0.7152, 0.0722));
        vec3 mapped = x / (1.0 + luminance);
        mapped /= max(1.0, max(mapped.r, max(mapped.g, mapped.b)));
        return mix(mapped * 12.92, 1.055 * pow(mapped, vec3(1.0 / 2.4)) - 0.055, step(vec3(0.0031308), mapped));
      }
      void main() {
        vec4 photo = vec4(1.0);
        if (uMaterial > 0.5 && uMaterial < 1.5) {
          vec2 irisPosition = (vUV - vec2(333.0 / 820.0, 383.0 / 618.0)) / vec2(82.0 / 820.0, 80.0 / 618.0);
          photo = texture2D(uTexture, vec2(0.5) + irisPosition * 0.48);
        }
        vec3 n = normalize(vNormal);
        vec3 view = normalize(vec3(0.0, 0.0, 7.0) - vPosition);
        if (dot(n, view) < 0.0) n = -n;
        vec3 key = normalize(vec3(-3.0, 4.0, 5.0));
        vec3 fill = normalize(vec3(3.0, 0.5, 2.0));
        float diffuse = max(dot(n, key), 0.0);
        float soft = pow(max(dot(n, normalize(fill + view)), 0.0), 26.0);
        vec3 reflection = reflect(-view, n);
        float fresnel = pow(1.0 - max(dot(n, view), 0.0), 3.0);
        vec3 f0 = vec3(1.0, 0.64, 0.22);
        // The reflected softboxes already supply the light; adding them again overexposes it.
        vec3 gold = studio(reflection, 0.13) * fresnelSchlick(max(dot(n, view), 0.0), f0);
        vec3 color = displayColor(gold);
        if (uMaterial > 0.5 && uMaterial < 1.5) {
          // Natural iris fibres sit beneath one clear corneal highlight, including the pupil.
          float cornealShine = pow(max(dot(n, normalize(key + view)), 0.0), 160.0);
          color = photo.rgb * (0.82 + 0.18 * diffuse);
          color += vec3(0.92, 0.96, 1.0) * (fresnel * 0.075 + cornealShine * 0.70 + soft * 0.04);
        }
        gl_FragColor = vec4(color, 1.0);
      }
    `);
    gl.attachShader(result, vertex);
    gl.attachShader(result, fragment);
    gl.linkProgram(result);
    gl.deleteShader(vertex);
    gl.deleteShader(fragment);
    if (!gl.getProgramParameter(result, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(result));
    return result;
  }

  function mesh(data) {
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
    return { buffer, count: data.length / 8 };
  }

  function makeLink() {
    const data = [];
    const rings = 48, sides = 16;
    const rx = .023, ry = physics.constraints[0].rest * .58, tube = .009;
    function vertex(i, j) {
      const a = i / rings * Math.PI * 2;
      const b = j / sides * Math.PI * 2;
      const radial = normalize([Math.cos(a) / rx, Math.sin(a) / ry, 0]);
      const n = [radial[0] * Math.cos(b), radial[1] * Math.cos(b), Math.sin(b)];
      return [rx * Math.cos(a) + tube * n[0], ry * Math.sin(a) + tube * n[1], tube * n[2], ...n, 0, 0];
    }
    for (let i = 0; i < rings; i++) for (let j = 0; j < sides; j++) {
      const a = vertex(i, j), b = vertex(i + 1, j), c = vertex(i + 1, j + 1), d = vertex(i, j + 1);
      data.push(...a, ...b, ...c, ...a, ...c, ...d);
    }
    return mesh(data);
  }

  function makePendant() {
    // Keep the approved gold silhouette. Its photographic chain is clipped away at the brow.
    const source = document.createElement('canvas');
    source.width = 512;
    source.height = 386;
    const ctx = source.getContext('2d', { willReadFrequently: true });
    ctx.save();
    ctx.scale(source.width / 820, source.height / 618);
    ctx.beginPath();
    ctx.moveTo(0, 126);
    ctx.bezierCurveTo(96, 125, 189, 36, 300, 10);
    ctx.bezierCurveTo(435, -24, 529, 46, 648, 109);
    ctx.bezierCurveTo(715, 145, 766, 143, 820, 123);
    ctx.lineTo(820, 618); ctx.lineTo(0, 618); ctx.closePath();
    ctx.clip();
    ctx.drawImage(fallback, 125, 478, 820, 618, 0, 0, 820, 618);
    ctx.restore();
    const pixels = ctx.getImageData(0, 0, source.width, source.height);
    // The supplied cutout contains low-opacity background remnants; discard them at render time.
    alphaPixels = pixels.data;
    textureWidth = source.width; textureHeight = source.height;
    texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, irisImage);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const geometry = window.PendantGeometry.buildAmulet(alphaPixels, textureWidth, textureHeight, eye);
    amuletDimensions = geometry.dimensions;
    amuletSilhouette = geometry.silhouette;
    pendantMesh = mesh(geometry.gold);
    stoneMesh = mesh(geometry.stone);
  }

  function initialize() {
    gl = canvas.getContext('webgl', { alpha: true, antialias: true, premultipliedAlpha: false, powerPreference: 'low-power' });
    if (!gl) return false;
    program = createProgram();
    locations = {};
    for (const name of ['aPosition', 'aNormal', 'aUV']) locations[name] = gl.getAttribLocation(program, name);
    for (const name of ['uModel', 'uProjection', 'uTexture', 'uMaterial']) locations[name] = gl.getUniformLocation(program, name);
    linkMesh = makeLink();
    makePendant();
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.clearColor(0, 0, 0, 0);
    return true;
  }

  function basis(x, y, z, origin) {
    model.set([x[0], x[1], x[2], 0, y[0], y[1], y[2], 0, z[0], z[1], z[2], 0, origin.x, origin.y, origin.z, 1]);
  }

  function draw(object, material) {
    gl.bindBuffer(gl.ARRAY_BUFFER, object.buffer);
    for (const [name, size, offset] of [['aPosition', 3, 0], ['aNormal', 3, 12], ['aUV', 2, 24]]) {
      gl.enableVertexAttribArray(locations[name]);
      gl.vertexAttribPointer(locations[name], size, gl.FLOAT, false, 32, offset);
    }
    gl.uniformMatrix4fv(locations.uModel, false, model);
    gl.uniform1f(locations.uMaterial, material);
    gl.drawArrays(gl.TRIANGLES, 0, object.count);
  }

  function project(p) {
    const scale = 7 / (7 - p.z);
    return { x: (p.x * scale / worldWidth + .5) * width, y: (.5 - p.y * scale / worldHeight) * height };
  }

  function bodyPoint(x, y, z = 0, f = physics.frame()) {
    return { x: f.origin.x + f.x[0] * x + f.y[0] * y + f.z[0] * z, y: f.origin.y + f.x[1] * x + f.y[1] * y + f.z[1] * z, z: f.origin.z + f.x[2] * x + f.y[2] * y + f.z[2] * z };
  }

  function updateHits() {
    for (let side = 0; side < 2; side++) {
      chainHits[side].setAttribute('d', physics.chains[side].map((p, i) => { const q = project(p); return `${i ? 'L' : 'M'}${q.x.toFixed(2)},${q.y.toFixed(2)}`; }).join(''));
    }
    // Follow the eye's silhouette instead of blocking scrolling over its transparent rectangle.
    const outline = [[-.80, -.16], [-.46, -.05], [-.16, .09], [.14, .05], [.50, -.12], [.83, -.17], [.80, -.47], [.67, -.55], [.80, -.78], [.74, -1.03], [.39, -1.10], [-.15, -.68], [-.255, -1.145], [-.45, -.72], [-.35, -.55], [-.80, -.51]];
    const f = physics.frame();
    bodyHit.setAttribute('d', outline.map(([x, y], i) => { const p = project(bodyPoint(x, y, 0, f)); return `${i ? 'L' : 'M'}${p.x.toFixed(2)},${p.y.toFixed(2)}`; }).join('') + 'Z');
  }

  function render() {
    if (!ready || contextLost) return;
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.useProgram(program);
    gl.uniformMatrix4fv(locations.uProjection, false, projection);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(locations.uTexture, 0);
    const body = physics.frame();
    const twist = Math.atan2(body.x[2], body.x[0]);
    for (const chain of physics.chains) for (let i = 0; i < chain.length - 1; i++) {
      const a = chain[i], b = chain[i + 1];
      const y = normalize([a.x - b.x, a.y - b.y, a.z - b.z]);
      const x0 = normalize(cross(y, [0, 0, 1]));
      const z0 = normalize(cross(x0, y));
      const turn = Math.PI * .25 + i * Math.PI / 2 + twist * (i / (chain.length - 1));
      const x = x0.map((n, k) => n * Math.cos(turn) + z0[k] * Math.sin(turn));
      const z = cross(x, y);
      basis(x, y, z, { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, z: (a.z + b.z) / 2 });
      draw(linkMesh, 0);
    }
    for (const side of [-1, 1]) {
      basis(body.x, body.y, body.z, bodyPoint(side * .33, -.035, 0, body));
      draw(linkMesh, 0);
    }
    basis(body.x, body.y, body.z, body.origin);
    draw(pendantMesh, 2);
    draw(stoneMesh, 1);
    updateHits();
  }

  function resize() {
    const sectionElement = stage.closest('#about');
    const section = sectionElement.getBoundingClientRect();
    const bounds = stage.getBoundingClientRect();
    const stacked = matchMedia('(max-width: 760px)').matches;
    const centerX = bounds.left + bounds.width / 2;
    sectionElement.style.setProperty('--story-art-center-x', `${centerX - section.left}px`);
    sectionElement.style.setProperty('--story-art-width', `${bounds.width}px`);
    sectionElement.style.setProperty('--story-art-center-y', `${stacked ? bounds.top + bounds.height / 2 - section.top : section.height / 2}px`);
    width = Math.max(1, bounds.width); height = Math.max(1, bounds.height);
    worldHeight = stacked ? 2.4 * height / width : 3.2;
    worldWidth = worldHeight * width / height;
    // Small tablet columns still need room for the pendant's silhouette.
    if (worldWidth < 2.08) { worldWidth = 2.08; worldHeight = worldWidth * height / width; }
    // Overscan follows the whole section: a swinging pendant can leave its grid column.
    let anchorY = (.5 + (stacked ? 0 : (bounds.top - section.top) / height)) * worldHeight + .025;
    // Mobile only: extend the chains to the section edge over the heading.
    if (stacked) anchorY += (bounds.top - section.top) / height * worldHeight;
    if (physics.setLayout(anchorY, .525) && ready) {
      if (pointer) release();
      gl.deleteBuffer(linkMesh.buffer);
      linkMesh = makeLink();
    }
    const overscanX = Math.max(width, section.width - width);
    const overscanY = Math.max(220, height * .5, bounds.top - section.top + 40);
    const renderWidth = width + overscanX * 2;
    const renderHeight = height + overscanY * 2;
    for (const surface of [canvas, hitArea]) {
      surface.style.left = `${-overscanX}px`;
      surface.style.top = `${-overscanY}px`;
      surface.style.width = `${renderWidth}px`;
      surface.style.height = `${renderHeight}px`;
    }
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(renderWidth * dpr); canvas.height = Math.round(renderHeight * dpr);
    hitArea.setAttribute('viewBox', `${-overscanX} ${-overscanY} ${renderWidth} ${renderHeight}`);
    // Perspective camera at z=7, with its image plane at the origin.
    projection.set(identity);
    projection[0] = 14 / (worldWidth * renderWidth / width);
    projection[5] = 14 / (worldHeight * renderHeight / height);
    projection[10] = -1;
    projection[11] = -1;
    projection[14] = 0;
    projection[15] = 7;
    render();
  }

  function wake() {
    quietTime = 0;
    if (!frame && ready && visible && !document.hidden && !reduced.matches && !contextLost) frame = requestAnimationFrame(tick);
  }

  function playEntryCue() {
    const now = performance.now();
    if (!ready || !visible || !cueVisible || !entryCueAvailable || document.hidden || reduced.matches || pointer || contextLost) return;
    if (now - lastCueTime < 12000 || now - lastInteractionTime < 4000) return;
    entryCueAvailable = false;
    lastCueTime = now;
    // One physical nudge: the chain and raised stone sway together, then naturally settle.
    physics.impulse(physics.body[2], 1.6, .05, .32);
    wake();
  }

  function noteInteraction() {
    entryCueAvailable = false;
    lastInteractionTime = performance.now();
  }

  function tick(time) {
    frame = 0;
    if (!visible || document.hidden || reduced.matches || contextLost) { lastTime = 0; return; }
    const dt = lastTime ? Math.min((time - lastTime) / 1000, 1 / 15) : 1 / 60;
    lastTime = time;
    physics.advance(dt);
    render();
    if (!pointer && physics.energy() < .0007) quietTime += dt;
    else quietTime = 0;
    if (pointer || quietTime < .7) frame = requestAnimationFrame(tick);
    else lastTime = 0;
  }

  function local(event) {
    const box = stage.getBoundingClientRect();
    return { x: event.clientX - box.left, y: event.clientY - box.top };
  }

  function unproject(p, depth = 0) {
    const scale = (7 - depth) / 7;
    return { x: (p.x / width - .5) * worldWidth * scale, y: (.5 - p.y / height) * worldHeight * scale, z: depth };
  }

  function pick(p, generous = false) {
    let closest = null, distance = generous ? 30 : 17;
    for (const chain of physics.chains) for (let i = 2; i < chain.length; i++) {
      const q = project(chain[i]);
      const d = Math.hypot(q.x - p.x, q.y - p.y);
      if (d < distance) { closest = chain[i]; distance = d; }
    }
    if (closest) return closest;
    // Pick the actual solid silhouette, including the bridge and open spaces.
    const f = physics.frame(), o = project(f.origin);
    const x = project(bodyPoint(1, 0, 0, f)), y = project(bodyPoint(0, 1, 0, f));
    const a = x.x - o.x, b = y.x - o.x, c = x.y - o.y, d = y.y - o.y;
    const det = a * d - b * c;
    if (Math.abs(det) < 1) return null;
    const lx = ((p.x - o.x) * d - (p.y - o.y) * b) / det;
    const ly = ((p.y - o.y) * a - (p.x - o.x) * c) / det;
    const u = (lx - eye.left) / (eye.right - eye.left), v = (eye.top - ly) / (eye.top - eye.bottom);
    if (u < 0 || u > 1 || v < 0 || v > 1) return null;
    const { field, cols, rows } = amuletSilhouette;
    const sx = u * (cols - 1), sy = v * (rows - 1), ix = Math.floor(sx), iy = Math.floor(sy);
    const sample = (x, y) => field[Math.min(rows - 1, y) * cols + Math.min(cols - 1, x)];
    const top = sample(ix, iy) * (1 - sx + ix) + sample(ix + 1, iy) * (sx - ix);
    const bottom = sample(ix, iy + 1) * (1 - sx + ix) + sample(ix + 1, iy + 1) * (sx - ix);
    const surfaceDistance = top * (1 - sy + iy) + bottom * (sy - iy);
    const stone = amuletDimensions.stone;
    const onStone = Math.hypot((lx - stone.x) / stone.rx, (ly - stone.y) / stone.ry) <= 1.025;
    if (!onStone && surfaceDistance < (generous ? -.015 : -.004)) return null;
    return physics.body.reduce((best, n) => {
      const q = project(n), r = project(best);
      return Math.hypot(q.x - p.x, q.y - p.y) < Math.hypot(r.x - p.x, r.y - p.y) ? n : best;
    });
  }

  function release() {
    const id = pointer?.id;
    pointer = null;
    physics.endDrag();
    stage.classList.remove('is-dragging');
    if (id !== undefined && stage.hasPointerCapture(id)) stage.releasePointerCapture(id);
    wake();
  }

  stage.addEventListener('pointerdown', event => {
    if (!ready || reduced.matches || pointer || !event.isPrimary || event.button !== 0) return;
    const p = local(event), point = pick(p, event.pointerType !== 'mouse');
    if (!point) return;
    event.preventDefault();
    noteInteraction();
    const world = unproject(p, point.z);
    pointer = { id: event.pointerId, depth: point.z, start: p, offset: { x: point.x - world.x, y: point.y - world.y } };
    physics.beginDrag(point, point);
    stage.setPointerCapture(event.pointerId);
    stage.classList.add('is-dragging');
    previousHover = null;
    wake();
  });

  stage.addEventListener('pointermove', event => {
    if (!ready || reduced.matches) return;
    const p = local(event);
    if (pointer) {
      if (event.pointerId !== pointer.id) return;
      event.preventDefault();
      const target = unproject(p, pointer.depth);
      target.x += pointer.offset.x; target.y += pointer.offset.y;
      // Pulling also introduces a small depth impulse, so a flick visibly turns the links.
      target.z += clamp((p.x - pointer.start.x) / width * .25, -.15, .15);
      physics.moveDrag(target);
      wake();
    } else if (event.pointerType === 'mouse') {
      const now = performance.now();
      const touched = pick(p);
      if (touched && previousHover && now - previousHover.time < 100) {
        const dx = p.x - previousHover.x, dy = p.y - previousHover.y;
        if (Math.hypot(dx, dy) > 1.5) {
          noteInteraction();
          physics.impulse(touched, clamp(dx / width * 11, -.8, .8), clamp(-dy / height * 7, -.4, .4), clamp(dx / width * 3, -.2, .2));
          wake();
        }
      }
      previousHover = { ...p, time: now };
    }
  });
  stage.addEventListener('pointerleave', () => { previousHover = null; });
  stage.addEventListener('pointerup', event => { if (pointer?.id === event.pointerId) release(); });
  stage.addEventListener('pointercancel', event => { if (pointer?.id === event.pointerId) release(); });
  stage.addEventListener('lostpointercapture', () => { if (pointer) release(); });
  stage.addEventListener('dragstart', event => event.preventDefault());
  stage.addEventListener('keydown', event => {
    if (event.target !== stage || !ready || reduced.matches) return;
    if (event.key === 'Escape') { release(); return; }
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
    event.preventDefault();
    noteInteraction();
    const x = event.key === 'ArrowLeft' ? -1.2 : event.key === 'ArrowRight' ? 1.2 : 0;
    const y = event.key === 'ArrowUp' ? .8 : event.key === 'ArrowDown' ? -.8 : 0;
    physics.impulse(physics.body[2], x, y, x * .2);
    wake();
  });

  function suspend() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0; lastTime = 0; physics.accumulator = 0;
    previousHover = null;
    if (pointer) release();
  }

  new IntersectionObserver(entries => {
    const entry = entries[0];
    visible = entry.isIntersecting;
    cueVisible = entry.intersectionRatio >= .55;
    if (visible) { playEntryCue(); wake(); }
    else { entryCueAvailable = true; suspend(); }
  }, { threshold: [0, .02, .55] }).observe(stage);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) suspend();
    else { playEntryCue(); wake(); }
  });
  window.addEventListener('blur', () => { if (pointer) release(); });
  reduced.addEventListener('change', () => {
    suspend(); physics.reset(); render();
    if (!reduced.matches) wake();
  });
  canvas.addEventListener('webglcontextlost', event => {
    event.preventDefault(); contextLost = true; suspend();
    stage.classList.remove('is-ready'); stage.classList.add('is-unavailable');
  });
  canvas.addEventListener('webglcontextrestored', () => {
    contextLost = false;
    start();
  });
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(stage);
  resizeObserver.observe(stage.closest('#about'));

  async function start() {
    try {
      await Promise.all([fallback.decode(), irisImage.decode(), document.fonts.ready]);
      if (!initialize()) throw new Error('WebGL is unavailable');
      ready = true;
      resize();
      stage.classList.remove('is-unavailable'); stage.classList.add('is-ready');
      playEntryCue();
      wake();
    } catch (error) {
      ready = false;
      stage.classList.remove('is-ready'); stage.classList.add('is-unavailable');
      console.warn('Pendant: using the static artwork.', error.message);
    }
  }
  start();
})();
