"use client";
import { useEffect, useRef } from "react";
import { FISH_BODY } from "../ui/Logo";

// The landing planet in three.js: a sphere that turns on a tilted axis with a
// painterly surface from 3D noise (so it has no seams), and 8 coral fish
// coins, real lit discs with thickness, orbiting it on a tilted ring. three is
// loaded on demand after the page is up. Until it draws, or when WebGL is
// missing, the CSS planet underneath shows instead. Reduced motion draws one
// still frame; nothing animates while the scene is off screen.

const PLANET_VERT = `
varying vec3 vPos;
varying vec3 vNormal;
void main() {
  vPos = position;
  vNormal = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const PLANET_FRAG = `
varying vec3 vPos;
varying vec3 vNormal;
uniform vec3 uLight;

float hash(vec3 p) {
  p = fract(p * 0.3183099 + 0.1);
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}
float noise(vec3 x) {
  vec3 i = floor(x);
  vec3 f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(mix(hash(i), hash(i + vec3(1, 0, 0)), f.x), mix(hash(i + vec3(0, 1, 0)), hash(i + vec3(1, 1, 0)), f.x), f.y),
    mix(mix(hash(i + vec3(0, 0, 1)), hash(i + vec3(1, 0, 1)), f.x), mix(hash(i + vec3(0, 1, 1)), hash(i + vec3(1, 1, 1)), f.x), f.y),
    f.z);
}
float fbm(vec3 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p = p * 2.03 + vec3(1.7, 9.2, 3.1);
    a *= 0.5;
  }
  return v;
}

void main() {
  vec3 q = vPos * 1.5;
  float w = fbm(q);
  float s = fbm(vec3(q.x * 1.2, q.y * 4.0, q.z * 1.2) + w * 2.2);
  float grain = noise(vPos * 42.0);

  vec3 deep = vec3(0.07, 0.24, 0.62);
  vec3 azure = vec3(0.16, 0.50, 0.88);
  vec3 teal = vec3(0.00, 0.78, 0.74);
  vec3 green = vec3(0.32, 0.70, 0.36);
  vec3 lilac = vec3(0.74, 0.54, 0.80);
  vec3 foam = vec3(0.88, 0.95, 0.93);
  vec3 col = mix(deep, azure, smoothstep(0.32, 0.47, s));
  col = mix(col, teal, smoothstep(0.47, 0.57, s));
  col = mix(col, green, smoothstep(0.56, 0.66, w + s * 0.35 - 0.12));
  col = mix(col, lilac, smoothstep(0.60, 0.68, fbm(q * 2.3 + 5.0)) * 0.6);
  col = mix(col, foam, smoothstep(0.64, 0.72, s) * 0.75);
  col *= 0.9 + 0.2 * grain;

  vec3 n = normalize(vNormal);
  float diff = max(dot(n, uLight), 0.0);
  col *= 0.26 + 0.88 * diff;
  float spec = pow(max(dot(reflect(-uLight, n), vec3(0.0, 0.0, 1.0)), 0.0), 28.0);
  col += vec3(0.9, 1.0, 1.0) * spec * 0.25;
  float rim = pow(1.0 - max(n.z, 0.0), 2.5);
  col = mix(col, vec3(0.55, 0.92, 1.0), rim * 0.4 * (0.35 + diff));
  gl_FragColor = vec4(col, 1.0);
}
`;

const COINS = 8;
const ORBIT = 1.7; // orbit radius, planet radius is 1
const COIN_R = 0.27;
const COIN_T = 0.06;
const LAP = 24; // seconds per orbit
const TURN = 40; // seconds per planet turn

/** Coin face art: coral disc, raised rim and the pixel fish. `bump` draws the height map. */
function coinCanvas(bump: boolean): HTMLCanvasElement {
  const size = 512;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d")!;
  const mid = size / 2;
  if (bump) {
    g.fillStyle = "#777";
    g.fillRect(0, 0, size, size);
  } else {
    const grad = g.createRadialGradient(mid * 0.7, mid * 0.6, 10, mid, mid, mid);
    grad.addColorStop(0, "#FFC9B2");
    grad.addColorStop(0.45, "#FF9474");
    grad.addColorStop(1, "#E0623F");
    g.fillStyle = grad;
    g.fillRect(0, 0, size, size);
  }
  // raised rim ring
  g.lineWidth = 26;
  g.strokeStyle = bump ? "#eee" : "#F48464";
  g.beginPath();
  g.arc(mid, mid, mid - 22, 0, Math.PI * 2);
  g.stroke();
  g.lineWidth = 6;
  g.strokeStyle = bump ? "#555" : "#C9563A";
  g.beginPath();
  g.arc(mid, mid, mid - 40, 0, Math.PI * 2);
  g.stroke();
  // the fish, 15 x 10 cells
  const cell = 17;
  const ox = mid - (15 * cell) / 2;
  const oy = mid - (10 * cell) / 2;
  g.fillStyle = bump ? "#fff" : "#C9563A";
  for (const m of FISH_BODY.matchAll(/M(\d+) (\d+)h(\d+)v1/g)) {
    g.fillRect(ox + Number(m[1]) * cell, oy + Number(m[2]) * cell, Number(m[3]) * cell, cell);
  }
  return c;
}

export function PlanetScene() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = ref.current;
    if (!host) return;
    let cleanup = () => {};
    let cancelled = false;

    Promise.all([import("three"), import("three/examples/jsm/environments/RoomEnvironment.js")]).then(([THREE, { RoomEnvironment }]) => {
      if (cancelled) return;
      let renderer: InstanceType<typeof THREE.WebGLRenderer>;
      try {
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
      } catch {
        return; // no WebGL: the CSS planet stays
      }
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      host.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      // soft studio reflections so the coins read as polished metal, not flat paint
      const pmrem = new THREE.PMREMGenerator(renderer);
      const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
      pmrem.dispose();
      scene.environment = env;
      scene.environmentIntensity = 0.55;
      const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);

      // light from the top left, matching the planet shader's sun
      const sun = new THREE.Vector3(-0.55, 0.6, 0.75).normalize();
      const key = new THREE.DirectionalLight(0xffffff, 2.6);
      key.position.copy(sun).multiplyScalar(10);
      scene.add(key, new THREE.HemisphereLight(0xdff7ff, 0x3a2a22, 1.1));

      // planet
      const planet = new THREE.Mesh(
        new THREE.SphereGeometry(1, 128, 96),
        new THREE.ShaderMaterial({
          vertexShader: PLANET_VERT,
          fragmentShader: PLANET_FRAG,
          uniforms: { uLight: { value: sun } },
        }),
      );
      const axis = new THREE.Group();
      axis.rotation.z = 0.2;
      axis.rotation.x = 0.38;
      axis.add(planet);
      scene.add(axis);

      // coins: side, top face, bottom face
      const face = new THREE.CanvasTexture(coinCanvas(false));
      face.colorSpace = THREE.SRGBColorSpace;
      face.anisotropy = 4;
      const bump = new THREE.CanvasTexture(coinCanvas(true));
      const faceMat = new THREE.MeshStandardMaterial({
        map: face,
        bumpMap: bump,
        bumpScale: 2.2,
        metalness: 0.15,
        roughness: 0.42,
      });
      const sideMat = new THREE.MeshStandardMaterial({ color: 0xe56f4c, metalness: 0.15, roughness: 0.5 });
      const coinGeo = new THREE.CylinderGeometry(COIN_R, COIN_R, COIN_T, 64);
      const ring = new THREE.Group();
      ring.rotation.z = 0.46;
      ring.rotation.x = 0.3;
      const spin = new THREE.Group();
      ring.add(spin);
      scene.add(ring);
      for (let i = 0; i < COINS; i++) {
        const pivot = new THREE.Group();
        pivot.rotation.y = (i / COINS) * Math.PI * 2;
        const holder = new THREE.Group();
        holder.position.z = ORBIT;
        holder.rotation.y = 0.35; // never quite edge-on
        const coin = new THREE.Mesh(coinGeo, [sideMat, faceMat, faceMat]);
        coin.rotation.z = Math.PI / 2; // faces point along the orbit
        holder.add(coin);
        pivot.add(holder);
        spin.add(pivot);
      }

      const fit = () => {
        const w = host.clientWidth;
        const h = host.clientHeight;
        if (!w || !h) return;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        // keep the planet large while the whole ring stays in frame
        const halfH = Math.max(1.42, 1.95 / camera.aspect);
        camera.position.set(0, 0, halfH / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)));
        camera.updateProjectionMatrix();
      };

      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
      let last = performance.now();
      let t = 6; // start a few seconds in, so the still frame has coins on both sides
      let raf = 0;
      let visible = true;
      const draw = () => {
        planet.rotation.y = (t / TURN) * Math.PI * 2;
        spin.rotation.y = (t / LAP) * Math.PI * 2;
        renderer.render(scene, camera);
      };
      const loop = (now: number) => {
        t += Math.min((now - last) / 1000, 0.1);
        last = now;
        draw();
        raf = visible && !reduce.matches ? requestAnimationFrame(loop) : 0;
      };
      const kick = () => {
        if (raf) return;
        last = performance.now();
        if (reduce.matches) draw();
        else raf = requestAnimationFrame(loop);
      };

      fit();
      draw();
      host.setAttribute("data-ready", "");
      kick();

      const ro = new ResizeObserver(() => {
        fit();
        draw();
      });
      ro.observe(host);
      const io = new IntersectionObserver(([e]) => {
        visible = e.isIntersecting;
        if (visible) kick();
      });
      io.observe(host);
      reduce.addEventListener("change", kick);

      cleanup = () => {
        cancelAnimationFrame(raf);
        ro.disconnect();
        io.disconnect();
        reduce.removeEventListener("change", kick);
        host.removeAttribute("data-ready");
        coinGeo.dispose();
        planet.geometry.dispose();
        (planet.material as InstanceType<typeof THREE.ShaderMaterial>).dispose();
        faceMat.dispose();
        sideMat.dispose();
        face.dispose();
        bump.dispose();
        env.dispose();
        renderer.dispose();
        renderer.domElement.remove();
      };
    });

    return () => {
      cancelled = true;
      cleanup();
    };
  }, []);

  return <div ref={ref} className="lp-planet-3d" />;
}
