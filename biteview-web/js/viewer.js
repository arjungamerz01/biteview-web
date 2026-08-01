/* ==========================================================
   BiteView
   Premium Apple Style 3D Viewer
   Part 1
==========================================================*/

import * as THREE from "three";

import { OrbitControls } from "three/addons/controls/OrbitControls.js";

import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";



/* ==========================================================
   CANVAS
==========================================================*/

const canvas = document.querySelector("#model-viewer");
const viewerCard = canvas?.closest(".viewer-card");

function showViewerState(message) {

    if (!viewerCard) return;

    let loading = viewerCard.querySelector(".loading");

    if (!loading) {

        loading = document.createElement("div");

        loading.className = "loading";

        loading.textContent = message;

        viewerCard.appendChild(loading);

    } else {

        loading.textContent = message;

    }

}

function hideViewerState() {

    viewerCard?.querySelector(".loading")?.remove();

}

showViewerState("Loading Experience");



if (!canvas) {

    throw new Error("Model Viewer canvas not found.");

}



/* ==========================================================
   SCENE
==========================================================*/

const scene = new THREE.Scene();

scene.background = null;



/* ==========================================================
   CAMERA
==========================================================*/

const camera = new THREE.PerspectiveCamera(

35,

canvas.clientWidth / canvas.clientHeight,

0.1,

100

);

camera.position.set(0, 1.15, 3.6);



/* ==========================================================
   RENDERER
==========================================================*/

const renderer = new THREE.WebGLRenderer({

canvas,

alpha: true,

antialias: true,

powerPreference: "high-performance"

});

renderer.setPixelRatio(

Math.min(window.devicePixelRatio, 2)

);

renderer.setSize(

canvas.clientWidth,

canvas.clientHeight,

false

);

renderer.outputColorSpace = THREE.SRGBColorSpace;

renderer.toneMapping = THREE.ACESFilmicToneMapping;

renderer.toneMappingExposure = 1.2;

renderer.shadowMap.enabled = true;

renderer.shadowMap.type = THREE.PCFSoftShadowMap;



/* ==========================================================
   LIGHTING
==========================================================*/

const ambientLight = new THREE.HemisphereLight(

0xffffff,

0x221100,

2.3

);

scene.add(ambientLight);



const keyLight = new THREE.DirectionalLight(

0xffffff,

2.8

);

keyLight.position.set(4,6,5);

keyLight.castShadow = true;

keyLight.shadow.mapSize.width = 2048;

keyLight.shadow.mapSize.height = 2048;

scene.add(keyLight);



const fillLight = new THREE.DirectionalLight(

0xffb36b,

1.2

);

fillLight.position.set(-5,3,-3);

scene.add(fillLight);



const rimLight = new THREE.DirectionalLight(

0xffffff,

1

);

rimLight.position.set(0,4,-6);

scene.add(rimLight);



/* ==========================================================
   SHADOW FLOOR
==========================================================*/

const floor = new THREE.Mesh(

new THREE.CircleGeometry(2.3,64),

new THREE.ShadowMaterial({

opacity:.22

})

);

floor.rotation.x = -Math.PI/2;

floor.position.y = -1.15;

floor.receiveShadow = true;

scene.add(floor);



/* ==========================================================
   CONTROLS
==========================================================*/

const controls = new OrbitControls(

camera,

renderer.domElement

);

controls.enablePan = false;

controls.enableZoom = false;

controls.enableDamping = true;

controls.dampingFactor = .06;

controls.autoRotate = true;

controls.autoRotateSpeed = .75;

controls.minPolarAngle = Math.PI/2.4;

controls.maxPolarAngle = Math.PI/1.8;



/* ==========================================================
   MODEL
==========================================================*/

const loader = new GLTFLoader();

let foodModel = null;

loader.load(

    "assets/models/coffee.glb",

    (gltf)=>{

        hideViewerState();

        foodModel = gltf.scene;

        scene.add(foodModel);

        const box = new THREE.Box3().setFromObject(foodModel);

        const size = box.getSize(new THREE.Vector3());

        const center = box.getCenter(new THREE.Vector3());

        foodModel.position.sub(center);

        const maxAxis = Math.max(size.x,size.y,size.z);

        const scale = 2/maxAxis;

        foodModel.scale.setScalar(scale);

        foodModel.position.y=-0.15;

        foodModel.rotation.y=Math.PI/5;

        foodModel.traverse((child)=>{

            if(child.isMesh){

                child.castShadow=true;

                child.receiveShadow=true;

            }

        });

    },

    undefined,

    (err)=>{

        console.error(err);

        showViewerState("Preview Unavailable");

    }

);



const clock=new THREE.Clock();



function animateModel(){

    if(!foodModel) return;

    const t=clock.getElapsedTime();

    foodModel.position.y=-0.15+Math.sin(t*1.2)*0.04;

}



/* ==========================================================
   APPLE STYLE RENDER LOOP
==========================================================*/

const mouse = new THREE.Vector2();

let targetRotationX = 0;
let targetRotationY = 0;



/* ==========================================================
   MOUSE PARALLAX
==========================================================*/

window.addEventListener("mousemove", (event) => {

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;

    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    targetRotationY = mouse.x * 0.18;

    targetRotationX = mouse.y * 0.08;

});



/* ==========================================================
   ANIMATION LOOP
==========================================================*/

function animate() {

    requestAnimationFrame(animate);

    animateModel();

    controls.update();

    if (foodModel) {

        foodModel.rotation.x +=
            (targetRotationX - foodModel.rotation.x) * 0.04;

        foodModel.rotation.y +=
            ((Math.PI / 5 + targetRotationY) - foodModel.rotation.y) * 0.04;

    }

    renderer.render(scene, camera);

}

animate();

window.addEventListener("resize", () => {

    camera.aspect = canvas.clientWidth / canvas.clientHeight;

    camera.updateProjectionMatrix();

    renderer.setSize(

        canvas.clientWidth,

        canvas.clientHeight,

        false

    );

});

/* ==========================================================
   OPTIONAL MODEL SWITCHER
==========================================================*/

window.changeFoodModel = function(path){

    if(foodModel){

        scene.remove(foodModel);

        foodModel = null;

    }

    loader.load(

        path,

        (gltf)=>{

            foodModel = gltf.scene;

            scene.add(foodModel);

            const box = new THREE.Box3().setFromObject(foodModel);

            const size = box.getSize(new THREE.Vector3());

            const center = box.getCenter(new THREE.Vector3());

            foodModel.position.sub(center);

            const scale = 2 / Math.max(size.x,size.y,size.z);

            foodModel.scale.setScalar(scale);

            foodModel.position.y = -0.15;

            foodModel.rotation.y = Math.PI/5;

            foodModel.traverse((child)=>{

                if(child.isMesh){

                    child.castShadow = true;

                    child.receiveShadow = true;

                }

            });

        }

    );

};



/* ==========================================================
   PERFORMANCE
==========================================================*/

renderer.setAnimationLoop(null);

window.addEventListener("visibilitychange",()=>{

    if(document.hidden){

        renderer.setAnimationLoop(null);

    }else{

        animate();

    }

});



/* ==========================================================
   END OF VIEWER
==========================================================*/

console.log("✅ BiteView Premium Viewer Loaded");

