"use client";
import { useEffect, useRef } from "react";

// The landing planet in three.js: a sphere that turns on a tilted axis with a
// painterly surface from 3D noise (so it has no seams), and a tilted ring of
// orbiters: glossy puffy 3D emojis (smileys, hearts, stars, a bolt, a sparkle)
// with a camera and a clapperboard whose clapstick snaps shut. three is
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

/** What sits in each of the 8 places on the ring, in orbit order. */
const ORBITERS = [
  "smiley", "camera", "heart", "star", "clapper", "bolt", "smiley", "camera", "sparkle", "clapper",
] as const;
type ShapeKind = "heart" | "star" | "bolt" | "sparkle";

const ORBIT = 1.7; // orbit radius, planet radius is 1
const SIZE = 0.5; // longest side of an orbiter
const LAP = 24; // seconds per orbit
const TURN = 40; // seconds per planet turn

/** Colour of each puffy emoji, saturated a little past the target to survive ACES tone mapping. */
const TINT: Record<ShapeKind, number> = {
  heart: 0xff2a5c,
  star: 0xffa800,
  bolt: 0x8f5bff,
  sparkle: 0x1fa8ff,
};

export function PlanetScene() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = ref.current;
    if (!host) return;
    let cleanup = () => {};
    let cancelled = false;

    Promise.all([
      import("three"),
      import("three/examples/jsm/environments/RoomEnvironment.js"),
      import("three/examples/jsm/geometries/RoundedBoxGeometry.js"),
    ]).then(([THREE, { RoomEnvironment }, { RoundedBoxGeometry }]) => {
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
      // soft studio reflections give the emojis their glossy highlights
      const pmrem = new THREE.PMREMGenerator(renderer);
      const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
      pmrem.dispose();
      scene.environment = env;
      scene.environmentIntensity = 0.5;
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

      const ring = new THREE.Group();
      ring.rotation.z = 0.46;
      ring.rotation.x = 0.3;
      const spin = new THREE.Group();
      ring.add(spin);
      scene.add(ring);

      // puffy 3D emojis: flat shapes extruded with a deep, round bevel, under a
      // clear coat, so they read like glossy toys
      const disposables: { dispose: () => void }[] = [];
      const gloss = (color: number) => {
        const m = new THREE.MeshPhysicalMaterial({
          color,
          emissive: color,
          emissiveIntensity: 0.08,
          roughness: 0.3,
          metalness: 0,
          clearcoat: 1,
          clearcoatRoughness: 0.12,
        });
        disposables.push(m);
        return m;
      };
      const puff = (shape: InstanceType<typeof THREE.Shape>, bevel: number) => {
        const geo = new THREE.ExtrudeGeometry(shape, {
          depth: bevel * 0.6,
          bevelEnabled: true,
          bevelThickness: bevel * 1.4,
          bevelSize: bevel,
          bevelSegments: 10,
          curveSegments: 28,
        });
        geo.center();
        geo.computeBoundingBox();
        const box = geo.boundingBox!;
        const k = SIZE / Math.max(box.max.x - box.min.x, box.max.y - box.min.y);
        geo.scale(k, k, k);
        disposables.push(geo);
        return geo;
      };

      const heart = new THREE.Shape();
      heart.moveTo(5, 5);
      heart.bezierCurveTo(5, 5, 4, 0, 0, 0);
      heart.bezierCurveTo(-6, 0, -6, 7, -6, 7);
      heart.bezierCurveTo(-6, 11, -3, 15.4, 5, 19);
      heart.bezierCurveTo(12, 15.4, 16, 11, 16, 7);
      heart.bezierCurveTo(16, 7, 16, 0, 10, 0);
      heart.bezierCurveTo(7, 0, 5, 5, 5, 5);
      const heartGeo = puff(heart, 2.2);
      heartGeo.rotateZ(Math.PI); // the curve above draws it point up

      const star = new THREE.Shape();
      for (let i = 0; i < 10; i++) {
        const r = i % 2 ? 4.4 : 10;
        const a = Math.PI / 2 + (i * Math.PI) / 5;
        if (i) star.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        else star.moveTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      const starGeo = puff(star, 1.9);

      const bolt = new THREE.Shape();
      const pts = [[-1, 11], [6, 11], [2, 3], [7, 3], [-3, -11], [-0.5, -1], [-5.5, -1]];
      pts.forEach(([x, y], i) => (i ? bolt.lineTo(x, y) : bolt.moveTo(x, y)));
      const boltGeo = puff(bolt, 1.3);

      const sparkle = new THREE.Shape();
      sparkle.moveTo(0, 10);
      sparkle.quadraticCurveTo(1.6, 1.6, 10, 0);
      sparkle.quadraticCurveTo(1.6, -1.6, 0, -10);
      sparkle.quadraticCurveTo(-1.6, -1.6, -10, 0);
      sparkle.quadraticCurveTo(-1.6, 1.6, 0, 10);
      const sparkleGeo = puff(sparkle, 1.4);

      const shapes = { heart: heartGeo, star: starGeo, bolt: boltGeo, sparkle: sparkleGeo };
      const mats = {
        heart: gloss(TINT.heart),
        star: gloss(TINT.star),
        bolt: gloss(TINT.bolt),
        sparkle: gloss(TINT.sparkle),
      };

      // the smiley: a glossy yellow ball with a face on its outward side
      const R = SIZE / 2;
      const faceGeo = new THREE.SphereGeometry(R, 48, 32);
      const eyeGeo = new THREE.SphereGeometry(R * 0.14, 16, 12);
      const smileGeo = new THREE.TorusGeometry(R * 0.42, R * 0.07, 12, 40, Math.PI);
      const cheekGeo = new THREE.CircleGeometry(R * 0.13, 24);
      disposables.push(faceGeo, eyeGeo, smileGeo, cheekGeo);
      const yellow = gloss(0xffb800);
      const ink = new THREE.MeshPhysicalMaterial({ color: 0x3a2412, roughness: 0.35, clearcoat: 1 });
      const blush = new THREE.MeshBasicMaterial({ color: 0xff7a7a, transparent: true, opacity: 0.55 });
      disposables.push(ink, blush);
      const smiley = () => {
        const g = new THREE.Group();
        g.add(new THREE.Mesh(faceGeo, yellow));
        for (const side of [-1, 1]) {
          const eye = new THREE.Mesh(eyeGeo, ink);
          eye.scale.set(1, 1.5, 0.6);
          eye.position.set(side * R * 0.33, R * 0.22, R * 0.9);
          const cheek = new THREE.Mesh(cheekGeo, blush);
          cheek.position.set(side * R * 0.58, -R * 0.12, R * 0.8);
          cheek.lookAt(cheek.position.clone().multiplyScalar(2));
          g.add(eye, cheek);
        }
        const smile = new THREE.Mesh(smileGeo, ink);
        smile.rotation.z = Math.PI; // the arc hangs down
        smile.rotation.x = -0.25;
        smile.position.set(0, -R * 0.05, R * 0.86);
        g.add(smile);
        return g;
      };

      const rbox = (w: number, h: number, d: number, r: number) => {
        const geo = new RoundedBoxGeometry(w, h, d, 5, r);
        disposables.push(geo);
        return geo;
      };
      const plain = (color: number, roughness = 0.3) => {
        const m = new THREE.MeshPhysicalMaterial({ color, roughness, clearcoat: 1, clearcoatRoughness: 0.15 });
        disposables.push(m);
        return m;
      };

      // the camera: a chunky body with a big glass lens, a viewfinder bump and a red button
      const camBody = rbox(SIZE, SIZE * 0.7, SIZE * 0.4, SIZE * 0.13);
      const camTop = rbox(SIZE * 0.34, SIZE * 0.16, SIZE * 0.3, SIZE * 0.06);
      const lensRing = new THREE.CylinderGeometry(SIZE * 0.25, SIZE * 0.27, SIZE * 0.14, 40);
      const lensGlass = new THREE.SphereGeometry(SIZE * 0.19, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
      const camButton = new THREE.CylinderGeometry(SIZE * 0.06, SIZE * 0.06, SIZE * 0.06, 20);
      disposables.push(lensRing, lensGlass, camButton);
      const camShell = gloss(0xf3f5f9);
      const camDark = plain(0x26324a, 0.4);
      const camLens = new THREE.MeshPhysicalMaterial({
        color: 0x3f8cf0, roughness: 0.05, metalness: 0.2, clearcoat: 1, clearcoatRoughness: 0.02,
      });
      const camRed = gloss(0xff4d5e);
      disposables.push(camLens);
      const filmCamera = () => {
        const g = new THREE.Group();
        g.add(new THREE.Mesh(camBody, camShell));
        const top = new THREE.Mesh(camTop, camDark);
        top.position.set(-SIZE * 0.1, SIZE * 0.38, 0);
        const ring = new THREE.Mesh(lensRing, camDark);
        ring.rotation.x = Math.PI / 2;
        ring.position.z = SIZE * 0.24;
        const glass = new THREE.Mesh(lensGlass, camLens);
        glass.rotation.x = Math.PI / 2;
        glass.scale.set(1, 0.45, 1);
        glass.position.z = SIZE * 0.3;
        const button = new THREE.Mesh(camButton, camRed);
        button.position.set(SIZE * 0.3, SIZE * 0.37, 0);
        g.add(top, ring, glass, button);
        return g;
      };

      // the clapperboard: a dark slate with chalk lines, and a striped clapstick
      // hinged at the left that snaps shut now and then
      const stripes = document.createElement("canvas");
      stripes.width = 256;
      stripes.height = 64;
      const sx = stripes.getContext("2d")!;
      sx.fillStyle = "#1f2533";
      sx.fillRect(0, 0, 256, 64);
      sx.fillStyle = "#ffffff";
      for (let x = -64; x < 320; x += 64) {
        sx.beginPath();
        sx.moveTo(x, 64);
        sx.lineTo(x + 32, 64);
        sx.lineTo(x + 64, 0);
        sx.lineTo(x + 32, 0);
        sx.fill();
      }
      const stripeTex = new THREE.CanvasTexture(stripes);
      stripeTex.colorSpace = THREE.SRGBColorSpace;
      const stripeMat = new THREE.MeshPhysicalMaterial({ map: stripeTex, roughness: 0.35, clearcoat: 1 });
      disposables.push(stripeTex, stripeMat);
      const W = SIZE;
      const slateGeo = rbox(W, W * 0.66, W * 0.12, W * 0.06);
      const stickGeo = rbox(W, W * 0.17, W * 0.12, W * 0.05);
      const chalkGeo = rbox(W * 0.7, W * 0.035, W * 0.02, W * 0.012);
      const slateMat = plain(0x262c3a, 0.45);
      const chalkMat = plain(0xf3f5f9, 0.6);
      const clapsticks: { obj: InstanceType<typeof THREE.Group>; phase: number }[] = [];
      const clapper = () => {
        const g = new THREE.Group();
        const slate = new THREE.Mesh(slateGeo, slateMat);
        slate.position.y = -W * 0.12;
        const band = new THREE.Mesh(stickGeo, stripeMat);
        band.position.y = W * 0.12;
        g.add(slate, band);
        for (let k = 0; k < 3; k++) {
          const line = new THREE.Mesh(chalkGeo, chalkMat);
          line.position.set(k === 2 ? -W * 0.12 : 0, -W * (0.04 + k * 0.13), W * 0.065);
          if (k === 2) line.scale.x = 0.6;
          g.add(line);
        }
        const hinge = new THREE.Group();
        hinge.position.set(-W / 2, W * 0.2, 0);
        const stick = new THREE.Mesh(stickGeo, stripeMat);
        stick.position.set(W / 2, W * 0.09, 0);
        hinge.add(stick);
        g.add(hinge);
        clapsticks.push({ obj: hinge, phase: clapsticks.length * 2.1 });
        return g;
      };

      const build = (kind: (typeof ORBITERS)[number]) => {
        if (kind === "smiley") return smiley();
        if (kind === "camera") return filmCamera();
        if (kind === "clapper") return clapper();
        return new THREE.Mesh(shapes[kind], mats[kind]);
      };

      // each orbiter rocks gently on its own axis so its depth shows, while its
      // face keeps pointing out of the ring
      const flippers: { obj: InstanceType<typeof THREE.Group>; rate: number; phase: number }[] = [];
      ORBITERS.forEach((kind, i) => {
        const pivot = new THREE.Group();
        pivot.rotation.y = (i / ORBITERS.length) * Math.PI * 2;
        const holder = new THREE.Group();
        holder.position.z = ORBIT;
        holder.rotation.z = (i % 2 ? 1 : -1) * 0.18; // a little tilt, like stickers
        const flip = new THREE.Group();
        flip.add(build(kind));
        holder.add(flip);
        pivot.add(holder);
        spin.add(pivot);
        flippers.push({ obj: flip, rate: 0.55 + (i % 3) * 0.15, phase: i * 1.3 });
      });

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
      let t = 6; // start a few seconds in, so the still frame has emojis on both sides
      let raf = 0;
      let visible = true;
      const draw = () => {
        planet.rotation.y = (t / TURN) * Math.PI * 2;
        spin.rotation.y = (t / LAP) * Math.PI * 2;
        for (const f of flippers) f.obj.rotation.y = Math.sin(t * f.rate + f.phase) * 0.6;
        // the clapstick snaps shut, then eases open again
        for (const c of clapsticks) {
          const u = Math.min(1, ((t + c.phase) % 3.2) / 0.6);
          c.obj.rotation.z = 0.5 * (1 - (1 - u) ** 3);
        }
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
        disposables.forEach((d) => d.dispose());
        planet.geometry.dispose();
        (planet.material as InstanceType<typeof THREE.ShaderMaterial>).dispose();
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
