import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const canvas = document.querySelector('#model-viewer');
if (!canvas) throw new Error('BiteView model canvas was not found.');

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(34, 1, 0.01, 100);
camera.position.set(0, .25, 4.3);

const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.22;

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.enablePan = false;
controls.enableZoom = false;
controls.autoRotate = true;
controls.autoRotateSpeed = 1.25;
controls.target.set(0, 0, 0);

scene.add(new THREE.HemisphereLight(0xffead9, 0x182038, 2.1));
const keyLight = new THREE.DirectionalLight(0xffc29d, 4.2); keyLight.position.set(3, 4, 4); scene.add(keyLight);
const rimLight = new THREE.DirectionalLight(0x8ca7ff, 3); rimLight.position.set(-4, 1, -3); scene.add(rimLight);
const fillLight = new THREE.PointLight(0xff5c16, 16, 8); fillLight.position.set(0, -1.8, 2); scene.add(fillLight);

const loadingManager = new THREE.LoadingManager();
loadingManager.onError = () => { canvas.setAttribute('aria-label', '3D preview unavailable.'); };
const loader = new GLTFLoader(loadingManager);
let model;
loader.load('assets/models/handgripper.glb', (gltf) => {
  model = gltf.scene;
  const bounds = new THREE.Box3().setFromObject(model);
  const size = bounds.getSize(new THREE.Vector3());
  const center = bounds.getCenter(new THREE.Vector3());
  const scale = 2.65 / Math.max(size.x, size.y, size.z);
  model.scale.setScalar(scale);
  model.position.sub(center.multiplyScalar(scale));
  model.position.y -= .08;
  model.traverse((child) => {
    if (child.isMesh) { child.castShadow = false; child.receiveShadow = false; }
  });
  scene.add(model);
}, undefined, () => { canvas.setAttribute('aria-label', '3D preview could not be loaded.'); });

function resize() {
  const { width, height } = canvas.getBoundingClientRect();
  if (!width || !height) return;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height, false);
}
new ResizeObserver(resize).observe(canvas);
resize();

function render() { controls.update(); renderer.render(scene, camera); requestAnimationFrame(render); }
render();
