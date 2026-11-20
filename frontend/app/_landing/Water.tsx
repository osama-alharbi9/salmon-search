"use client";
import { useEffect, useRef } from "react";

// A water surface over the whole landing page. Moving the pointer drags a
// finger through it: a wave simulation (a height field on the GPU, at a quarter
// of the screen's size) spreads the ripples, and each frame tints their slopes
// sky blue. The canvas is multiplied over the page, so calm water is white and
// changes nothing, the text stays readable, and clicks pass straight through.
// A faint caustic net moves under it all the time. Every tint stays under 10%.
// three is loaded on demand. Under reduced motion, or without WebGL, nothing is drawn.

const VERT = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}`;

// one step of the wave equation: r = height now, g = height a step ago
const SIM = `
uniform sampler2D tState;
uniform vec2 texel;
uniform vec2 from;
uniform vec2 to;
uniform float radius;
uniform float strength;
uniform float aspect;
varying vec2 vUv;
float segment(vec2 p, vec2 a, vec2 b) {
  vec2 pa = p - a, ba = b - a;
  float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-6), 0.0, 1.0);
  return length(pa - ba * h);
}
void main() {
  vec4 s = texture2D(tState, vUv);
  float n = texture2D(tState, vUv + vec2(texel.x, 0.0)).r
          + texture2D(tState, vUv - vec2(texel.x, 0.0)).r
          + texture2D(tState, vUv + vec2(0.0, texel.y)).r
          + texture2D(tState, vUv - vec2(0.0, texel.y)).r;
  float h = (n * 0.5 - s.g) * 0.993;
  vec2 k = vec2(aspect, 1.0);
  float d = segment(vUv * k, from * k, to * k);
  h += strength * smoothstep(radius, 0.0, d);
  gl_FragColor = vec4(h, s.r, 0.0, 1.0);
}`;

// light the ripples from the top left: slopes facing away from it take the
// pool blue. Under them, a slow caustic net (light through moving water) is
// always there, faintly. Nothing ever goes past a 10% tint.
const VIEW = `
uniform sampler2D tState;
uniform vec2 texel;
uniform float time;
uniform float aspect;
varying vec2 vUv;
// a warped grid whose zero lines read as the bright net on a pool floor
float caustic(vec2 p, float t) {
  vec2 q = p;
  for (int n = 0; n < 3; n++) {
    float f = float(n);
    q += vec2(sin(q.y * 1.3 + t * 1.1 + f), cos(q.x * 1.1 - t * 0.9 + f * 1.7)) * 0.6;
  }
  float w = sin(q.x * 1.5) * sin(q.y * 1.5);
  return pow(1.0 - abs(w), 14.0);
}
void main() {
  vec2 o = texel;
  float l = texture2D(tState, vUv - vec2(o.x, 0.0)).r;
  float r = texture2D(tState, vUv + vec2(o.x, 0.0)).r;
  float d = texture2D(tState, vUv - vec2(0.0, o.y)).r;
  float u = texture2D(tState, vUv + vec2(0.0, o.y)).r;
  vec2 g = vec2(r - l, u - d);
  float shade = max(dot(g, normalize(vec2(1.0, -1.0))), 0.0);
  float ripple = shade * 2.0 + length(g) * 0.6;
  vec2 p = vUv * vec2(aspect, 1.0) * 6.0 + g * 40.0; // ripples bend the net
  float net = caustic(p, time * 0.25);
  float k = clamp(net * 0.10 + ripple, 0.0, 0.10);
  vec3 pool = vec3(0.302, 0.592, 0.949);
  gl_FragColor = vec4(mix(vec3(1.0), pool, k), 1.0);
}`;

const SCALE = 4; // simulation cells per screen pixel, inverted

export function Water() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = ref.current;
    if (!host) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let cleanup = () => {};
    let cancelled = false;

    import("three").then((THREE) => {
      if (cancelled) return;
      let renderer: InstanceType<typeof THREE.WebGLRenderer>;
      try {
        renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false, powerPreference: "low-power" });
      } catch {
        return;
      }
      renderer.setPixelRatio(1);
      renderer.setClearColor(0xffffff, 1);
      renderer.autoClear = false;
      host.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
      const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2));
      scene.add(quad);

      const target = () =>
        new THREE.WebGLRenderTarget(1, 1, {
          type: THREE.HalfFloatType,
          minFilter: THREE.LinearFilter,
          magFilter: THREE.LinearFilter,
          depthBuffer: false,
        });
      let a = target();
      let b = target();

      const sim = new THREE.ShaderMaterial({
        vertexShader: VERT,
        fragmentShader: SIM,
        uniforms: {
          tState: { value: null },
          texel: { value: new THREE.Vector2() },
          from: { value: new THREE.Vector2(-1, -1) },
          to: { value: new THREE.Vector2(-1, -1) },
          radius: { value: 0.012 },
          strength: { value: 0 },
          aspect: { value: 1 },
        },
      });
      const view = new THREE.ShaderMaterial({
        vertexShader: VERT,
        fragmentShader: VIEW,
        uniforms: {
          tState: { value: null },
          texel: { value: new THREE.Vector2() },
          time: { value: 0 },
          aspect: { value: 1 },
        },
      });

      const wipe = () => {
        for (const rt of [a, b]) {
          renderer.setRenderTarget(rt);
          renderer.clear();
        }
        renderer.setRenderTarget(null);
      };

      const fit = () => {
        const w = window.innerWidth;
        const h = window.innerHeight;
        renderer.setSize(Math.ceil(w / 1.5), Math.ceil(h / 1.5), false);
        const sw = Math.max(2, Math.ceil(w / SCALE));
        const sh = Math.max(2, Math.ceil(h / SCALE));
        a.setSize(sw, sh);
        b.setSize(sw, sh);
        sim.uniforms.texel.value.set(1 / sw, 1 / sh);
        view.uniforms.texel.value.set(1 / sw, 1 / sh);
        sim.uniforms.aspect.value = w / h;
        view.uniforms.aspect.value = w / h;
        renderer.setClearColor(0x000000, 1);
        wipe();
        renderer.setClearColor(0xffffff, 1);
        renderer.clear();
      };

      // the pointer's path since the last frame, pressed into the water once
      let last: { x: number; y: number } | null = null;
      let pending: { fx: number; fy: number; tx: number; ty: number; s: number } | null = null;
      let raf = 0;

      const step = () => {
        quad.material = sim;
        for (let i = 0; i < 2; i++) {
          sim.uniforms.tState.value = a.texture;
          if (pending && i === 0) {
            sim.uniforms.from.value.set(pending.fx, pending.fy);
            sim.uniforms.to.value.set(pending.tx, pending.ty);
            sim.uniforms.strength.value = pending.s;
          } else {
            sim.uniforms.strength.value = 0;
          }
          renderer.setRenderTarget(b);
          renderer.render(scene, cam);
          [a, b] = [b, a];
        }
        pending = null;
        renderer.setRenderTarget(null);
        quad.material = view;
        view.uniforms.tState.value = a.texture;
        renderer.render(scene, cam);
      };

      // 30 fps is plenty for slow water; the browser pauses it in hidden tabs
      let odd = false;
      const loop = (now: number) => {
        odd = !odd;
        if (odd) {
          view.uniforms.time.value = now / 1000;
          step();
        }
        raf = requestAnimationFrame(loop);
      };

      const onPointer = (e: PointerEvent) => {
        const x = e.clientX / window.innerWidth;
        const y = 1 - e.clientY / window.innerHeight;
        if (last) {
          const dist = Math.hypot(x - last.x, y - last.y);
          const s = Math.min(0.012, 0.003 + dist * 0.2);
          if (pending) {
            pending.tx = x;
            pending.ty = y;
            pending.s = Math.max(pending.s, s);
          } else {
            pending = { fx: last.x, fy: last.y, tx: x, ty: y, s };
          }
        }
        last = { x, y };
      };
      const onLeave = () => {
        last = null;
      };

      fit();
      raf = requestAnimationFrame(loop);
      host.setAttribute("data-ready", "");
      window.addEventListener("pointermove", onPointer, { passive: true });
      document.documentElement.addEventListener("pointerleave", onLeave);
      window.addEventListener("resize", fit);

      cleanup = () => {
        cancelAnimationFrame(raf);
        window.removeEventListener("pointermove", onPointer);
        document.documentElement.removeEventListener("pointerleave", onLeave);
        window.removeEventListener("resize", fit);
        a.dispose();
        b.dispose();
        sim.dispose();
        view.dispose();
        quad.geometry.dispose();
        renderer.dispose();
        renderer.domElement.remove();
        host.removeAttribute("data-ready");
      };
    });

    return () => {
      cancelled = true;
      cleanup();
    };
  }, []);

  return <div ref={ref} className="lp-water" aria-hidden="true" />;
}
