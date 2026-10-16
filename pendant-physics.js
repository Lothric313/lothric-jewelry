'use strict';

// Shared by the browser and numerical tests. Units are metres and seconds.
((root, factory) => {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.PendantPhysics = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, () => {
  const STEP = 1 / 120;
  const LINKS = 26;
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const length = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
  const node = (x, y, z, weight) => ({ x, y, z, px: x, py: y, pz: z, weight });

  class Necklace {
    constructor() {
      this.points = [];
      this.chains = [];
      this.constraints = [];
      this.tethers = [];
      this.drag = null;
      this.accumulator = 0;
      this.anchorY = 1.42;
      this.bodyY = -.08;
      this.reset();
    }

    reset() {
      this.points.length = this.chains.length = this.constraints.length = this.tethers.length = 0;
      this.drag = null;
      this.accumulator = 0;
      this.linkCount = Math.max(LINKS, Math.ceil(Math.hypot(.46, this.anchorY - this.bodyY) / .061));
      const links = this.linkCount;
      // The triangle carries the pendant's mass and allows all three rotation axes.
      this.body = [node(-.33, this.bodyY, 0, .25), node(.33, this.bodyY, 0, .25), node(0, this.bodyY - .95, 0, .16)];
      this.points.push(...this.body);
      for (let side = 0; side < 2; side++) {
        const end = this.body[side];
        const pin = node(side ? .79 : -.79, this.anchorY, 0, 0);
        const chain = [pin];
        const rest = length(pin, end) / links;
        this.points.push(pin);
        for (let i = 1; i < links; i++) {
          const t = i / links;
          const p = node(pin.x + (end.x - pin.x) * t, pin.y + (end.y - pin.y) * t, 0, 8);
          chain.push(p);
          this.points.push(p);
        }
        chain.push(end);
        this.chains.push(chain);
        for (let i = 0; i < links; i++) this.constraints.push({ a: chain[i], b: chain[i + 1], rest });
        for (let i = 2; i <= links; i++) this.tethers.push({ a: pin, b: chain[i], rest: rest * i, maximum: true });
        for (const span of [4, 8, 16]) for (let i = 1; i + span <= links; i += 2) {
          this.tethers.push({ a: chain[i], b: chain[i + span], rest: rest * span, maximum: true });
        }
      }
      this.rigid = [
        { a: this.body[0], b: this.body[1], rest: .66 },
        { a: this.body[0], b: this.body[2], rest: Math.hypot(.33, .95) },
        { a: this.body[1], b: this.body[2], rest: Math.hypot(.33, .95) }
      ];
    }

    setAnchorHeight(y) {
      return this.setLayout(y, this.bodyY);
    }

    setLayout(anchorY, bodyY) {
      if (Math.abs(this.anchorY - anchorY) < .001 && Math.abs(this.bodyY - bodyY) < .001) return false;
      this.anchorY = anchorY;
      this.bodyY = bodyY;
      this.reset();
      return true;
    }

    beginDrag(point, target) {
      this.drag = { point, target: { ...target }, smooth: { x: point.x, y: point.y, z: point.z } };
    }

    moveDrag(target) {
      if (this.drag) this.drag.target = { x: target.x, y: target.y, z: clamp(target.z, -.5, .5) };
    }

    endDrag() { this.drag = null; }

    impulse(point, x, y = 0, z = 0) {
      if (!point.weight) return;
      point.px -= clamp(x, -3.5, 3.5) * STEP;
      point.py -= clamp(y, -3.5, 3.5) * STEP;
      point.pz -= clamp(z, -2, 2) * STEP;
    }

    solve({ a, b, rest, maximum = false }) {
      const dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z;
      const distance = Math.hypot(dx, dy, dz);
      if (distance < 1e-8 || (maximum && distance <= rest)) return;
      const correction = (distance - rest) / (distance * (a.weight + b.weight));
      a.x += dx * correction * a.weight;
      a.y += dy * correction * a.weight;
      a.z += dz * correction * a.weight;
      b.x -= dx * correction * b.weight;
      b.y -= dy * correction * b.weight;
      b.z -= dz * correction * b.weight;
    }

    collide() {
      // Non-neighbouring links cannot pass through each other when the chain folds.
      const diameter = .034;
      for (let i = 3; i < this.points.length; i++) {
        const a = this.points[i];
        for (let j = i + 3; j < this.points.length; j++) {
          const b = this.points[j];
          const dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z;
          if (Math.abs(dx) > diameter || Math.abs(dy) > diameter || Math.abs(dz) > diameter) continue;
          const distance = Math.hypot(dx, dy, dz);
          if (distance < 1e-7 || distance >= diameter || !(a.weight + b.weight)) continue;
          const push = (diameter - distance) / (distance * (a.weight + b.weight));
          a.x -= dx * push * a.weight; a.y -= dy * push * a.weight; a.z -= dz * push * a.weight;
          b.x += dx * push * b.weight; b.y += dy * push * b.weight; b.z += dz * push * b.weight;
        }
      }
    }

    substep() {
      const drag = this.drag;
      const damping = Math.exp(-1.05 * STEP);
      for (const p of this.points) {
        if (!p.weight) continue;
        const vx = clamp((p.x - p.px) * damping, -.045, .045);
        const vy = clamp((p.y - p.py) * damping, -.045, .045);
        const vz = clamp((p.z - p.pz) * damping, -.035, .035);
        p.px = p.x; p.py = p.y; p.pz = p.z;
        p.x += vx; p.y += vy - 7.5 * STEP * STEP; p.z += vz;
      }
      if (drag) {
        // Filtering the handle preserves velocity on release instead of teleporting it.
        const response = 1 - Math.exp(-40 * STEP);
        for (const axis of ['x', 'y', 'z']) drag.smooth[axis] += (drag.target[axis] - drag.smooth[axis]) * response;
        for (const axis of ['x', 'y', 'z']) drag.point[axis] += (drag.smooth[axis] - drag.point[axis]) * .85;
      }
      for (let iteration = 0; iteration < 32; iteration++) {
        for (const tether of this.tethers) this.solve(tether);
        // Alternating the sweep avoids directional bias between the two arms.
        if (iteration % 2) for (let i = this.constraints.length - 1; i >= 0; i--) this.solve(this.constraints[i]);
        else for (const constraint of this.constraints) this.solve(constraint);
        for (let repeat = 0; repeat < 3; repeat++) for (const constraint of this.rigid) this.solve(constraint);
        if (iteration % 8 === 0) this.collide();
      }
      for (const p of this.points) {
        if (!p.weight) continue;
        p.z = clamp(p.z, -.75, .75);
      }
    }

    advance(seconds) {
      // Fixed steps work at 30/60/120 Hz and never integrate a hidden-tab gap.
      this.accumulator = Math.min(this.accumulator + Math.max(0, seconds), STEP * 8);
      let steps = 0;
      while (this.accumulator + 1e-10 >= STEP) {
        this.substep();
        this.accumulator -= STEP;
        steps++;
      }
      return steps;
    }

    energy() {
      let value = 0;
      for (const p of this.points) if (p.weight) value += ((p.x - p.px) ** 2 + (p.y - p.py) ** 2 + (p.z - p.pz) ** 2) / p.weight;
      return value / (STEP * STEP);
    }

    frame() {
      const [a, b, c] = this.body;
      const origin = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, z: (a.z + b.z) / 2 };
      const norm = v => { const d = Math.hypot(...v) || 1; return v.map(n => n / d); };
      const x = norm([b.x - a.x, b.y - a.y, b.z - a.z]);
      let y = [origin.x - c.x, origin.y - c.y, origin.z - c.z];
      const dot = y.reduce((sum, value, i) => sum + value * x[i], 0);
      y = norm(y.map((value, i) => value - dot * x[i]));
      const z = [x[1] * y[2] - x[2] * y[1], x[2] * y[0] - x[0] * y[2], x[0] * y[1] - x[1] * y[0]];
      return { origin, x, y, z };
    }
  }

  return { Necklace, STEP, LINKS };
});
