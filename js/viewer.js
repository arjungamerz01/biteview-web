// =========================================================
//  BiteView — Premium 3D Preview
//  viewer.js  (module)
//  Canvas: #model-viewer   |   Transparent background
// =========================================================

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

/* ---------------------------------------------------------
   CONFIG — edit these paths if your model lives elsewhere.
   The first file that loads successfully is used.
   If none load, a premium procedural stand-in is shown.
--------------------------------------------------------- */
const MODEL_CANDIDATES = [
   'assets/models/coffee.glb'
];

const AUTO_ROTATE_SPEED = 0.22;   // radians / second — slow + elegant
const RESUME_DELAY = 1600;        // ms after interaction before auto-rotate resumes
const FLOAT_AMPLITUDE = 0.035;    // vertical drift
const FLOAT_SPEED = 0.85;         // drift frequency

/* --------------------------------------------------------- */

const canvas = document.getElementById('model-viewer');

if (canvas) {
  initViewer(canvas);
}

function initViewer(canvas) {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------- RENDERER ---------------- */
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance'
  });

  renderer.setClearAlpha(0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  /* ---------------- SCENE ---------------- */
  const scene = new THREE.Scene();
  scene.background = null;

  /* ---------------- CAMERA ---------------- */
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  camera.position.set(2.05, 1.42, 2.75);

  /* ---------------- ENVIRONMENT (soft studio IBL) ---------------- */
  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();
  const envRT = pmrem.fromScene(new RoomEnvironment(), 0.04);
  scene.environment = envRT.texture;
  scene.environmentIntensity = 0.55;
  pmrem.dispose();

  /* ---------------- LIGHTING (warm restaurant) ---------------- */
  const ambient = new THREE.AmbientLight(0xfff3e6, 0.42);
  scene.add(ambient);

  const hemi = new THREE.HemisphereLight(0xfff1e0, 0x14161c, 0.35);
  scene.add(hemi);

  // Key light — warm, soft shadows
  const keyLight = new THREE.DirectionalLight(0xffd9b0, 2.15);
  keyLight.position.set(2.8, 4.2, 2.6);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(1024, 1024);
  keyLight.shadow.radius = 4;
  keyLight.shadow.bias = -0.0008;
  keyLight.shadow.camera.near = 0.5;
  keyLight.shadow.camera.far = 14;
  keyLight.shadow.camera.left = -3;
  keyLight.shadow.camera.right = 3;
  keyLight.shadow.camera.top = 3;
  keyLight.shadow.camera.bottom = -3;
  scene.add(keyLight);

  // Fill — cool, low intensity, no shadow
  const fillLight = new THREE.DirectionalLight(0xbfd4ff, 0.55);
  fillLight.position.set(-3.2, 1.4, 2.2);
  scene.add(fillLight);

  // Rim / back light — signature edge highlight
  const rimLight = new THREE.DirectionalLight(0xff9b5c, 1.35);
  rimLight.position.set(-1.6, 2.4, -3.4);
  scene.add(rimLight);

  // Gentle top bounce
  const topLight = new THREE.PointLight(0xffffff, 6, 8, 2);
  topLight.position.set(0, 2.6, 0.4);
  scene.add(topLight);

  /* ---------------- CONTACT SHADOW (no visible floor) ---------------- */
  const shadowCatcher = new THREE.Mesh(
    new THREE.PlaneGeometry(9, 9),
    new THREE.ShadowMaterial({ opacity: 0.28, transparent: true })
  );
  shadowCatcher.rotation.x = -Math.PI / 2;
  shadowCatcher.position.y = -0.62;
  shadowCatcher.receiveShadow = true;
  scene.add(shadowCatcher);

  /* ---------------- CONTROLS ---------------- */
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 0.02, 0);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.enablePan = false;
  controls.screenSpacePanning = false;
  controls.rotateSpeed = 0.6;
  controls.zoomSpeed = 0.55;
  controls.minDistance = 2.1;
  controls.maxDistance = 5.2;
  controls.minPolarAngle = 0.55;
  controls.maxPolarAngle = Math.PI / 2 - 0.02;
  controls.update();

  /* ---------------- AUTO-ROTATE STATE ---------------- */
  const pivot = new THREE.Group();     // holds the model — rotation + float applied here
  scene.add(pivot);

  let autoRotate = !prefersReducedMotion;
  let resumeTimer = null;

  const pauseAutoRotate = () => {
    autoRotate = false;
    if (resumeTimer) clearTimeout(resumeTimer);
  };

  const scheduleResume = () => {
    if (prefersReducedMotion) return;
    if (resumeTimer) clearTimeout(resumeTimer);
    resumeTimer = setTimeout(() => { autoRotate = true; }, RESUME_DELAY);
  };

  controls.addEventListener('start', pauseAutoRotate);
  controls.addEventListener('end', scheduleResume);
  canvas.addEventListener('wheel', () => { pauseAutoRotate(); scheduleResume(); }, { passive: true });

  /* ---------------- MODEL LOADING ---------------- */
  const draco = new DRACOLoader();
  draco.setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.166.1/examples/jsm/libs/draco/');

  const loader = new GLTFLoader();
  loader.setDRACOLoader(draco);

  loadFirstAvailable(loader, MODEL_CANDIDATES)
    .then((gltf) => addModel(gltf.scene))
    .catch(() => addModel(buildFallback()));

  function loadFirstAvailable(loader, urls, index = 0) {
    if (index >= urls.length) return Promise.reject(new Error('no model found'));
    return new Promise((resolve, reject) => {
      loader.load(urls[index], resolve, undefined, reject);
    }).catch(() => loadFirstAvailable(loader, urls, index + 1));
  }

  function addModel(object) {
    object.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = false;
        if (child.material) {
          child.material.envMapIntensity = 0.9;
          child.material.needsUpdate = true;
        }
      }
    });

    // Normalize: center + uniform scale (slightly larger for presence)
    const box = new THREE.Box3().setFromObject(object);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxAxis = Math.max(size.x, size.y, size.z) || 1;
    const scale = 1.55 / maxAxis;

    object.position.sub(center);
    object.scale.setScalar(scale);
    object.position.multiplyScalar(scale);

    // Rest just above the shadow plane
    const scaledBox = new THREE.Box3().setFromObject(object);
    object.position.y -= scaledBox.min.y + 0.42;

    pivot.add(object);
    pivot.rotation.y = -0.35;

    // Subtle entrance
    if (!prefersReducedMotion) {
      pivot.scale.setScalar(0.94);
      entranceStart = performance.now();
    }
  }

  // Premium procedural stand-in (plate + dome) if no GLB is present
  function buildFallback() {
    const group = new THREE.Group();

    const plate = new THREE.Mesh(
      new THREE.CylinderGeometry(1.02, 0.86, 0.09, 96),
      new THREE.MeshPhysicalMaterial({
        color: 0xf2f1ef, roughness: 0.28, metalness: 0.04, clearcoat: 0.6, clearcoatRoughness: 0.25
      })
    );
    plate.position.y = -0.34;
    group.add(plate);

    const dome = new THREE.Mesh(
      new THREE.SphereGeometry(0.6, 72, 48),
      new THREE.MeshPhysicalMaterial({
        color: 0xc9711f, roughness: 0.42, metalness: 0.02, clearcoat: 0.35, sheen: 0.4, sheenColor: 0xffb27f
      })
    );
    dome.position.y = -0.02;
    dome.scale.set(1, 0.72, 1);
    group.add(dome);

    const garnish = new THREE.Mesh(
      new THREE.TorusKnotGeometry(0.2, 0.055, 128, 24),
      new THREE.MeshPhysicalMaterial({ color: 0x7fb98d, roughness: 0.35, metalness: 0.05, clearcoat: 0.4 })
    );
    garnish.position.set(0.06, 0.4, 0.02);
    group.add(garnish);

    return group;
  }

  /* ---------------- RESIZE (observer, not per-frame) ---------------- */
  function resize() {
    const w = canvas.clientWidth || 1;
    const h = canvas.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  resize();

  if ('ResizeObserver' in window) {
    new ResizeObserver(resize).observe(canvas);
  } else {
    window.addEventListener('resize', resize);
  }

  /* ---------------- RENDER LOOP (paused when offscreen/hidden) ---------------- */
  const clock = new THREE.Clock();
  let entranceStart = 0;
  let visible = true;
  let running = false;

  function tick() {
    if (!running) return;

    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;

    if (autoRotate) pivot.rotation.y += AUTO_ROTATE_SPEED * dt;

    if (!prefersReducedMotion) {
      pivot.position.y = Math.sin(t * FLOAT_SPEED) * FLOAT_AMPLITUDE;
      pivot.rotation.x = Math.sin(t * 0.42) * 0.018;
      pivot.rotation.z = Math.cos(t * 0.33) * 0.012;

      if (entranceStart) {
        const p = Math.min((performance.now() - entranceStart) / 900, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        pivot.scale.setScalar(0.94 + 0.06 * eased);
        if (p === 1) entranceStart = 0;
      }
    }

    controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  }

  function start() {
    if (running) return;
    running = true;
    clock.getDelta();
    requestAnimationFrame(tick);
  }

  function stop() {
    running = false;
  }

  if ('IntersectionObserver' in window) {
    new IntersectionObserver((entries) => {
      visible = entries[0].isIntersecting;
      if (visible && !document.hidden) start(); else stop();
    }, { threshold: 0.05 }).observe(canvas);
  } else {
    start();
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
    else if (visible) start();
  });

  start();

  /* ---------------- CLEANUP ---------------- */
  window.addEventListener('pagehide', () => {
    stop();
    controls.dispose();
    envRT.dispose();
    renderer.dispose();
  });
}