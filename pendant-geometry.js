'use strict';

// A solid gold casting with a continuously rounded front and back.
((root, factory) => {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.PendantGeometry = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, () => {
  const normalize = v => { const d = Math.hypot(...v) || 1; return v.map(n => n / d); };

  function buildAmulet(pixels, width, height, bounds) {
    const { left, right, top, bottom } = bounds;
    const spanX = right - left, spanY = top - bottom;
    const uv = (x, y) => [(x - left) / spanX, (y - bottom) / spanY];
    // The pupil stays in the artwork; the whole eye shares one continuous curved surface.
    const stone = {
      x: left + (458 - 125) / 820 * spanX,
      y: top - (713 - 478) / 618 * spanY,
      rx: 82 / 820 * spanX,
      ry: 80 / 618 * spanY,
      base: .045,
      dome: .155
    };
    // A solid gold bridge overlaps the brow and upper eyelid, joining the two cast parts.
    const bridge = { x: stone.x, top: top - 57 / 618 * spanY, bottom: top - 145 / 618 * spanY, radius: .023 };
    const cols = Math.ceil(width / 2) + 1, rows = Math.ceil(height / 2) + 1;
    const dx = spanX / (cols - 1), dy = spanY / (rows - 1);
    const field = new Float32Array(cols * rows);
    const distance = new Float32Array(field.length);
    const outsideDistance = new Float32Array(field.length);
    const front = new Float32Array(field.length);
    const alpha = (x, y) => pixels[(Math.max(0, Math.min(height - 1, y)) * width + Math.max(0, Math.min(width - 1, x))) * 4 + 3] / 255;
    const kernel = [1, 4, 6, 4, 1];
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      const x = left + i * dx, y = top - j * dy;
      const px = Math.round(i / (cols - 1) * (width - 1)), py = Math.round(j / (rows - 1) * (height - 1));
      // Filter the cutout before tracing so isolated pixels cannot dent the polished contour.
      let coverage = 0;
      for (let sy = -2; sy <= 2; sy++) for (let sx = -2; sx <= 2; sx++) {
        coverage += alpha(px + sx, py + sy) * kernel[sx + 2] * kernel[sy + 2] / 256;
      }
      const radius = Math.hypot((x - stone.x) / stone.rx, (y - stone.y) / stone.ry);
      const bridgeDistance = Math.hypot(x - bridge.x, y - Math.max(bridge.bottom, Math.min(bridge.top, y)));
      const k = j * cols + i;
      const silhouette = (coverage - .45) * Math.min(dx, dy) * 2;
      // The stone occupies a real opening in the gold instead of sitting on a picture plane.
      field[k] = Math.min(Math.max(silhouette, bridge.radius - bridgeDistance), (radius - 1.005) * Math.min(stone.rx, stone.ry));
      if (i === 0 || j === 0 || i === cols - 1 || j === rows - 1) field[k] = -.45;
      distance[k] = field[k] > 0 ? 1e4 : 0;
      outsideDistance[k] = field[k] > 0 ? 0 : 1e4;
    }
    const diagonal = Math.hypot(dx, dy);
    // Subpixel boundary distances avoid height ripples at raster/grid intersections.
    for (let j = 1; j < rows - 1; j++) for (let i = 1; i < cols - 1; i++) {
      const k = j * cols + i, target = field[k] > 0 ? distance : outsideDistance;
      for (const [offset, step] of [[-1, dx], [1, dx], [-cols, dy], [cols, dy]]) {
        if ((field[k] > 0) !== (field[k + offset] > 0)) {
          target[k] = Math.min(target[k], Math.abs(field[k] / (field[k] - field[k + offset])) * step);
        }
      }
    }
    for (const values of [distance, outsideDistance]) {
      for (let j = 1; j < rows; j++) for (let i = 1; i < cols - 1; i++) {
        const k = j * cols + i;
        values[k] = Math.min(values[k], values[k - 1] + dx, values[k - cols] + dy, values[k - cols - 1] + diagonal, values[k - cols + 1] + diagonal);
      }
      for (let j = rows - 2; j >= 0; j--) for (let i = cols - 2; i > 0; i--) {
        const k = j * cols + i;
        values[k] = Math.min(values[k], values[k + 1] + dx, values[k + cols] + dy, values[k + cols + 1] + diagonal, values[k + cols - 1] + diagonal);
      }
    }
    function smooth(values, passes) {
      for (let pass = 0; pass < passes; pass++) {
        const smoothed = new Float32Array(values);
        for (let j = 1; j < rows - 1; j++) for (let i = 1; i < cols - 1; i++) {
          const k = j * cols + i;
          smoothed[k] = (values[k] * 4 + (values[k - 1] + values[k + 1] + values[k - cols] + values[k + cols]) * 2 + values[k - cols - 1] + values[k - cols + 1] + values[k + cols - 1] + values[k + cols + 1]) / 16;
        }
        values = smoothed;
      }
      return values;
    }
    // Keep the original outline and openings clean.
    for (let k = 0; k < field.length; k++) distance[k] = field[k] > 0 ? distance[k] : -outsideDistance[k];
    field.set(smooth(distance, 4));

    // Solve a smooth cross section over the whole casting. A clipped distance-to-edge
    // bevel leaves a flat cap; this potential stays curved through broad faces and joins.
    const potential = new Float64Array(field.length);
    const west = new Float64Array(field.length), east = new Float64Array(field.length);
    const north = new Float64Array(field.length), south = new Float64Array(field.length);
    const inverse = new Float64Array(field.length);
    const interior = [[], []];
    for (let j = 1; j < rows - 1; j++) for (let i = 1; i < cols - 1; i++) {
      const k = j * cols + i;
      if (field[k] <= 0) continue;
      const fraction = offset => field[k + offset] > 0 ? 1 : Math.max(.03, field[k] / (field[k] - field[k + offset]));
      const l = fraction(-1), r = fraction(1), t = fraction(-cols), b = fraction(cols);
      west[k] = 2 / (dx * dx * l * (l + r));
      east[k] = 2 / (dx * dx * r * (l + r));
      north[k] = 2 / (dy * dy * t * (t + b));
      south[k] = 2 / (dy * dy * b * (t + b));
      inverse[k] = 1 / (west[k] + east[k] + north[k] + south[k]);
      interior[(i + j) % 2].push(k);
    }
    for (let iteration = 0; iteration < 200; iteration++) {
      let change = 0;
      for (const cells of interior) for (const k of cells) {
        const target = (1 + west[k] * potential[k - 1] + east[k] * potential[k + 1] + north[k] * potential[k - cols] + south[k] * potential[k + cols]) * inverse[k];
        const delta = target - potential[k];
        potential[k] = Math.max(0, potential[k] + 1.7 * delta);
        change = Math.max(change, Math.abs(delta));
      }
      if (change < 1e-8) break;
    }
    const crown = 1.10;
    for (let k = 0; k < field.length; k++) {
      front[k] = .012 + crown * Math.sqrt(2 * potential[k]);
    }
    const gold = [], gem = [];
    function gridVertex(i, j) {
      const k = j * cols + i;
      const gx = (potential[j * cols + Math.min(cols - 1, i + 1)] - potential[j * cols + Math.max(0, i - 1)]) / (2 * dx);
      const gy = (potential[Math.max(0, j - 1) * cols + i] - potential[Math.min(rows - 1, j + 1) * cols + i]) / (2 * dy);
      const slope = crown / Math.sqrt(Math.max(2 * potential[k], 1e-10));
      return { x: left + i * dx, y: top - j * dy, z: front[k], field: field[k], n: normalize([-gx * slope, -gy * slope, 1]) };
    }
    function interpolate(a, b) {
      const t = a.field / (a.field - b.field);
      return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, z: .012, field: 0, n: normalize([a.n[0] + (b.n[0] - a.n[0]) * t, a.n[1] + (b.n[1] - a.n[1]) * t, 0]) };
    }
    function vertex(p, rear = false) {
      const n = rear ? normalize([p.n[0] * .72, p.n[1] * .72, -p.n[2]]) : p.n;
      return [p.x, p.y, rear ? -p.z * .72 : p.z, ...n, ...(rear ? [-1, -1] : uv(p.x, p.y))];
    }
    function triangle(a, b, c) {
      const input = [a, b, c], polygon = [], crossings = [];
      for (let i = 0; i < 3; i++) {
        const current = input[i], previous = input[(i + 2) % 3];
        if ((current.field > 0) !== (previous.field > 0)) {
          const edge = interpolate(previous, current);
          polygon.push(edge); crossings.push(edge);
        }
        if (current.field > 0) polygon.push(current);
      }
      for (let i = 1; i < polygon.length - 1; i++) {
        gold.push(...vertex(polygon[0]), ...vertex(polygon[i]), ...vertex(polygon[i + 1]));
        gold.push(...vertex(polygon[0], true), ...vertex(polygon[i + 1], true), ...vertex(polygon[i], true));
      }
      if (crossings.length !== 2) return;
      const [p, q] = crossings;
      // A curved lip joins the convex front and back around every contour and opening.
      function edgeVertex(point, t) {
        const angle = t * Math.PI;
        const outward = normalize([point.n[0], point.n[1], 0]);
        const bulge = .003 * Math.sin(angle) ** 2;
        const x = point.x + outward[0] * bulge, y = point.y + outward[1] * bulge;
        const z = point.z * (1 - 1.72 * t);
        const n = normalize([outward[0] * point.z * 1.72, outward[1] * point.z * 1.72, .003 * Math.PI * Math.sin(2 * angle)]);
        return [x, y, z, ...n, ...uv(point.x, point.y)];
      }
      for (let i = 0; i < 8; i++) {
        const a = edgeVertex(p, i / 8), b = edgeVertex(q, i / 8), c = edgeVertex(q, (i + 1) / 8), d = edgeVertex(p, (i + 1) / 8);
        gold.push(...a, ...b, ...c, ...a, ...c, ...d);
      }
    }
    for (let j = 0; j < rows - 1; j++) for (let i = 0; i < cols - 1; i++) {
      const a = gridVertex(i, j), b = gridVertex(i + 1, j), c = gridVertex(i + 1, j + 1), d = gridVertex(i, j + 1);
      if (a.field <= 0 && b.field <= 0 && c.field <= 0 && d.field <= 0) continue;
      triangle(a, b, c); triangle(a, c, d);
    }

    function dome(target, shape, rear = false) {
      const rings = 32, segments = 96;
      function v(i, j) {
        const phi = i / rings * Math.PI / 2, theta = j / segments * Math.PI * 2;
        const sx = Math.sin(phi) * Math.cos(theta), sy = Math.sin(phi) * Math.sin(theta), sz = Math.cos(phi);
        const x = shape.x + sx * shape.rx, y = shape.y + sy * shape.ry;
        const z = shape.base + sz * shape.dome;
        const n = normalize([sx / shape.rx, sy / shape.ry, (rear ? -1 : 1) * sz / Math.abs(shape.dome)]);
        return [x, y, z, ...n, ...(rear ? [-1, -1] : uv(x, y))];
      }
      for (let i = 0; i < rings; i++) for (let j = 0; j < segments; j++) {
        const a = v(i, j), b = v(i + 1, j), c = v(i + 1, j + 1), d = v(i, j + 1);
        target.push(...a, ...b, ...c, ...a, ...c, ...d);
      }
    }
    // One continuous cabochon, including its pupil, with a closed gold back.
    dome(gem, stone);
    dome(gold, { ...stone, base: -.015, dome: -.052 }, true);
    const bezel = [];
    function ringVertex(i, j) {
      const a = i / 96 * Math.PI * 2, b = j / 20 * Math.PI * 2;
      const rx = stone.rx + .009, ry = stone.ry + .009, tube = .015;
      const n = normalize([Math.cos(a) * Math.cos(b), Math.sin(a) * Math.cos(b), Math.sin(b)]);
      const x = stone.x + (rx + tube * Math.cos(b)) * Math.cos(a), y = stone.y + (ry + tube * Math.cos(b)) * Math.sin(a);
      return [x, y, .033 + tube * Math.sin(b), ...n, ...uv(x, y)];
    }
    for (let i = 0; i < 96; i++) for (let j = 0; j < 20; j++) {
      const a = ringVertex(i, j), b = ringVertex(i + 1, j), c = ringVertex(i + 1, j + 1), d = ringVertex(i, j + 1);
      bezel.push(...a, ...b, ...c, ...a, ...c, ...d);
    }
    gold.push(...bezel);
    return { gold: new Float32Array(gold), stone: new Float32Array(gem), dimensions: { stone, bridge }, silhouette: { field, cols, rows } };
  }

  return { buildAmulet };
});
