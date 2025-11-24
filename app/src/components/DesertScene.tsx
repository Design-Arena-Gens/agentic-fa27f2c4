"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

type Keyframe = {
  time: number;
  position: THREE.Vector3;
  target: THREE.Vector3;
};

const sequenceDuration = 15;

const keyframes: Keyframe[] = [
  { time: 0, position: new THREE.Vector3(-12, 4, 18), target: new THREE.Vector3(0, 1.2, 0) },
  { time: 1.2, position: new THREE.Vector3(-6, 3.4, 8), target: new THREE.Vector3(0, 1.2, 0) },
  { time: 2.4, position: new THREE.Vector3(-1.2, 2.4, 2.2), target: new THREE.Vector3(0, 1.1, 0) },
  { time: 3, position: new THREE.Vector3(4.5, 2.1, 2), target: new THREE.Vector3(0, 1.1, 0) },
  { time: 3.8, position: new THREE.Vector3(2.1, 1.2, -6), target: new THREE.Vector3(-8, 1.2, -20) },
  { time: 5.2, position: new THREE.Vector3(-6.2, 0.9, -16), target: new THREE.Vector3(-8, 1.2, -20) },
  { time: 6, position: new THREE.Vector3(-12, 1.1, -18), target: new THREE.Vector3(-8, 1.2, -20) },
  { time: 7.2, position: new THREE.Vector3(-6, 0.55, -30), target: new THREE.Vector3(6, 1.4, -40) },
  { time: 8.5, position: new THREE.Vector3(0.5, 0.35, -38), target: new THREE.Vector3(6, 1.4, -40) },
  { time: 9, position: new THREE.Vector3(6, 0.7, -42), target: new THREE.Vector3(6, 1.4, -40) },
  { time: 9.6, position: new THREE.Vector3(2.4, 4.8, -38), target: new THREE.Vector3(0, 4, -26) },
  { time: 10.4, position: new THREE.Vector3(1.2, 15, -36), target: new THREE.Vector3(0, 3, -24) },
  { time: 11, position: new THREE.Vector3(0, 24, -34), target: new THREE.Vector3(0, 2, -24) },
  { time: 12, position: new THREE.Vector3(0, 35, -30), target: new THREE.Vector3(0, 1.5, -24) },
  { time: 13, position: new THREE.Vector3(0, 40, -28), target: new THREE.Vector3(0, 1.2, -24) },
  { time: 14, position: new THREE.Vector3(10, 40, -28), target: new THREE.Vector3(6, 1.4, -26) },
  { time: 15, position: new THREE.Vector3(23, 35, -28), target: new THREE.Vector3(12, 2, -28) },
];

type InterpolatedPose = {
  position: THREE.Vector3;
  target: THREE.Vector3;
};

function interpolateCamera(time: number, temp: { pos: THREE.Vector3; look: THREE.Vector3 }): InterpolatedPose {
  const clamped = THREE.MathUtils.euclideanModulo(time, sequenceDuration);
  for (let i = 0; i < keyframes.length - 1; i += 1) {
    const current = keyframes[i];
    const next = keyframes[i + 1];
    if (clamped >= current.time && clamped <= next.time) {
      const t = (clamped - current.time) / (next.time - current.time);
      temp.pos.copy(current.position).lerp(next.position, t);
      temp.look.copy(current.target).lerp(next.target, t);
      return { position: temp.pos, target: temp.look };
    }
  }
  const last = keyframes[keyframes.length - 1];
  const first = keyframes[0];
  temp.pos.copy(last.position).lerp(first.position, 1);
  temp.look.copy(last.target).lerp(first.target, 1);
  return { position: temp.pos, target: temp.look };
}

function createOffroadCar(color: number) {
  const group = new THREE.Group();
  const bodyMaterial = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.6,
    metalness: 0.1,
  });
  const cabinMaterial = new THREE.MeshStandardMaterial({
    color,
    emissive: 0x2a2a2a,
    roughness: 0.35,
  });
  const accentMaterial = new THREE.MeshStandardMaterial({
    color: 0x5c5c5c,
    roughness: 0.2,
  });
  const wheelMaterial = new THREE.MeshStandardMaterial({
    color: 0x222222,
    roughness: 0.4,
  });

  const chassis = new THREE.Mesh(new THREE.BoxGeometry(3.6, 1.4, 6), bodyMaterial);
  chassis.position.y = 1.2;
  group.add(chassis);

  const cabin = new THREE.Mesh(new THREE.BoxGeometry(3.4, 1.2, 3.4), cabinMaterial);
  cabin.position.set(0, 2.1, -0.6);
  group.add(cabin);

  const spoiler = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.4, 2.2), accentMaterial);
  spoiler.position.set(0, 2.35, 1.2);
  group.add(spoiler);

  const wheelGeometry = new THREE.CylinderGeometry(0.9, 0.9, 0.8, 20);
  wheelGeometry.rotateZ(Math.PI / 2);
  const wheelPositions: [number, number, number][] = [
    [-1.5, 0.8, 2.2],
    [1.5, 0.8, 2.2],
    [-1.5, 0.8, -2.2],
    [1.5, 0.8, -2.2],
  ];

  for (const pos of wheelPositions) {
    const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    wheel.position.set(...pos);
    group.add(wheel);
  }

  return group;
}

function createDustTrail(origin: THREE.Vector3, color = 0xe6cf9a) {
  const points: THREE.Vector3[] = [];
  for (let i = 0; i < 20; i += 1) {
    const t = i / 20;
    points.push(
      new THREE.Vector3(
        origin.x - t * 4 + Math.sin(i) * 0.3,
        origin.y + Math.sin(i * 0.3) * 0.3 + 0.4,
        origin.z - t * 2 + Math.cos(i * 0.2) * 0.6,
      ),
    );
  }

  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity: 0.55,
  });

  return new THREE.Line(geometry, material);
}

type DesertSceneState = {
  scene: THREE.Scene;
  renderer: THREE.WebGLRenderer;
  camera: THREE.PerspectiveCamera;
  frameId?: number;
};

function createDesertDunes() {
  const dunes = new THREE.Group();
  const cone = new THREE.ConeGeometry(1, 1, 16, 1);
  const material = new THREE.MeshStandardMaterial({
    color: 0xd2a15d,
    roughness: 0.9,
  });

  const pseudoRandom = (() => {
    let seed = 1234567;
    return () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };
  })();

  for (let i = 0; i < 160; i += 1) {
    const angle = pseudoRandom() * Math.PI * 2;
    const radius = 40 + pseudoRandom() * 120;
    const heightScale = 1 + pseudoRandom() * 4;
    const dune = new THREE.Mesh(cone.clone(), material);
    dune.scale.set(heightScale * 3.6, heightScale * 2.4, heightScale * 3.6);
    dune.rotation.x = -Math.PI / 2;
    dune.position.set(
      Math.cos(angle) * radius,
      heightScale * 0.4,
      Math.sin(angle) * radius - 25,
    );
    dunes.add(dune);
  }

  return dunes;
}

function initializeScene(canvas: HTMLCanvasElement, container: HTMLDivElement): DesertSceneState {
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    canvas,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  if ("outputColorSpace" in renderer) {
    (renderer as any).outputColorSpace = THREE.SRGBColorSpace;
  }
  renderer.shadowMap.enabled = true;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x050505);
  scene.fog = new THREE.Fog(0xf8d9a5, 40, 300);

  const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 2000);
  camera.position.copy(keyframes[0].position);

  const ambient = new THREE.AmbientLight(0xffffff, 0.4);
  scene.add(ambient);

  const sun = new THREE.DirectionalLight(0xfff3d6, 1.8);
  sun.position.set(120, 180, -90);
  sun.castShadow = true;
  scene.add(sun);

  const hemisphere = new THREE.HemisphereLight(0xfff4d6, 0x977347, 0.35);
  scene.add(hemisphere);

  const groundMaterial = new THREE.MeshStandardMaterial({
    color: 0xc89b5b,
    roughness: 0.95,
  });
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(600, 600, 1, 1), groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);

  scene.add(createDesertDunes());

  const convoy = [
    { offset: new THREE.Vector3(0, 0, 0), color: 0xa7352c, rotation: Math.PI / 18 },
    { offset: new THREE.Vector3(-8, 0, -20), color: 0x2a5f7a, rotation: -Math.PI / 28 },
    { offset: new THREE.Vector3(6, 0, -40), color: 0xd67f1b, rotation: Math.PI / 36 },
  ];

  convoy.forEach((entry) => {
    const car = createOffroadCar(entry.color);
    car.position.copy(entry.offset);
    car.rotation.y = entry.rotation;
    scene.add(car);

    const dust = createDustTrail(entry.offset.clone().add(new THREE.Vector3(-0.3, 0.1, 1.4)));
    scene.add(dust);
  });

  const resize = () => {
    const width = container.clientWidth;
    const height = container.clientHeight;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };

  resize();

  const temp = { pos: new THREE.Vector3(), look: new THREE.Vector3() };
  const clock = new THREE.Clock();
  let elapsed = 0;

  const animate = () => {
    const delta = clock.getDelta();
    elapsed = (elapsed + delta) % sequenceDuration;
    const pose = interpolateCamera(elapsed, temp);
    camera.position.copy(pose.position);
    camera.lookAt(pose.target);
    renderer.render(scene, camera);
    state.frameId = requestAnimationFrame(animate);
  };

  const state: DesertSceneState = { scene, renderer, camera };
  state.frameId = requestAnimationFrame(animate);

  return { ...state, frameId: state.frameId };
}

export function DesertScene() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef<DesertSceneState | null>(null);
  const [ready, setReady] = useState(false);

  const resizeHandler = useMemo(() => {
    return () => {
      if (!stateRef.current || !containerRef.current) return;
      const { renderer, camera } = stateRef.current;
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      renderer.setSize(width, height, false);
      camera.aspect = width / height || 1;
      camera.updateProjectionMatrix();
    };
  }, []);

  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return undefined;
    stateRef.current = initializeScene(canvasRef.current, containerRef.current);
    setReady(true);
    const handleResize = resizeHandler;
    window.addEventListener("resize", handleResize);
    handleResize();

    return () => {
      window.removeEventListener("resize", handleResize);
      const state = stateRef.current;
      if (!state) return;
      if (state.frameId) cancelAnimationFrame(state.frameId);
      state.renderer.dispose();
      state.scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          if (Array.isArray(object.material)) {
            object.material.forEach((mat) => mat.dispose());
          } else {
            object.material.dispose();
          }
        }
      });
      stateRef.current = null;
    };
  }, [resizeHandler]);

  return (
    <div ref={containerRef} className="relative h-full w-full">
      <canvas ref={canvasRef} className="size-full" />
      {ready ? (
        <>
          <div className="pointer-events-none absolute inset-x-0 top-6 flex flex-col items-center gap-2 text-center text-xs uppercase tracking-[0.5em] text-[rgba(255,255,255,0.72)] md:top-12 md:text-sm">
            <span>Desert Rally Odyssey</span>
            <span className="text-[10px] tracking-[0.6em] md:text-xs">
              15s • Dynamic Drone Narrative
            </span>
          </div>
          <div className="pointer-events-none absolute bottom-10 right-12 hidden flex-col text-right text-[11px] uppercase tracking-[0.4em] text-[rgba(255,255,255,0.56)] md:flex">
            <span>Camera Path Alpha-01</span>
            <span className="text-[9px] tracking-[0.5em]">
              Autonomous Flight Suite
            </span>
          </div>
        </>
      ) : null}
    </div>
  );
}
