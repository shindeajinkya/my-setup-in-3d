import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { renderIframeInWebGL } from "./renderIframe";
import GUI from "lil-gui";
import "./style.css";
import gsap from "gsap";
interface ExtendedWindow extends Window {
  camera: THREE.PerspectiveCamera;
  getCameraDirection: () => void;
}

declare let window: ExtendedWindow;

let isMonitorView = false;

// Debug
const gui = new GUI();
gui.hide();

const transformOuter1 = document.getElementById("transform-outer-1");
const transformInner1 = document.getElementById("transform-inner-1");

const transformOuter2 = document.getElementById("transform-outer-2");
const transformInner2 = document.getElementById("transform-inner-2");

const iframesToResize = [
  {
    inner: transformInner1,
    outer: transformOuter1,
  },
  {
    inner: transformInner2,
    outer: transformOuter2,
  },
];

// Loaders
const gltfLoader = new GLTFLoader();
const textureLoader = new THREE.TextureLoader();

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  25,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

/**
 * Textures
 */

// baked texture
const bakedTexture = textureLoader.load("baked-room.jpg");
bakedTexture.flipY = false;
bakedTexture.colorSpace = THREE.SRGBColorSpace;

// laptop screen texture
const laptopScreenTexture = textureLoader.load("laptopScreen.jpg");
laptopScreenTexture.flipY = false;
laptopScreenTexture.colorSpace = THREE.SRGBColorSpace;

// laptop screen texture
const monitorScreenTexture = textureLoader.load("monitorScreen.jpg");
monitorScreenTexture.flipY = false;
monitorScreenTexture.colorSpace = THREE.SRGBColorSpace;

/**
 * Materials
 */
const bakedMaterials = new THREE.MeshBasicMaterial({ map: bakedTexture });
const laptopScreenMaterial = new THREE.MeshBasicMaterial({
  map: laptopScreenTexture,
});
const monitorScreenMaterial = new THREE.MeshBasicMaterial({
  map: monitorScreenTexture,
});

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

window.addEventListener("resize", () => {
  // Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // update transform Inner and outer
  for (let i = 0; i < iframesToResize.length; i++) {
    const cur = iframesToResize[i];

    if (cur.inner && cur.outer) {
      cur.outer.style.position = "absolute";
      cur.outer.style.top = "0";
      cur.outer.style.left = "0";
      cur.outer.style.width = sizes.width + "px";
      cur.outer.style.height = sizes.height + "px";
      cur.outer.style.transformStyle = "preserve-3d";

      cur.inner.style.position = "absolute";
      cur.inner.style.pointerEvents = "auto";
    }
  }

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

// Renderer
const renderer = new THREE.WebGLRenderer({
  antialias: true,
});
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById("app")?.prepend(renderer.domElement);

// Orbit Controls
const controls = new OrbitControls(camera, renderer.domElement);
// controls.target = new THREE.Vector3(0.1, 0.5, 0);

controls.enableDamping = true;
controls.dampingFactor = 0.05;

// min and max distance
controls.minDistance = 1;
controls.maxDistance = 7;

// horizontal control limit
controls.maxAzimuthAngle = Math.PI * 0.5;
controls.minAzimuthAngle = -Math.PI * 0.05;

// vertical control limit
controls.minPolarAngle = 0;
controls.maxPolarAngle = Math.PI * 0.5;

// zoom
controls.zoomSpeed = 0.4;

// rotation
controls.rotateSpeed = 0.4;

// pan
// controls.keyPanSpeed = 2.0; // pixels moved per arrow key push

controls.update();

// Lights
const light = new THREE.AmbientLight(0x404040, 5);
scene.add(light);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
scene.add(directionalLight);

directionalLight.position.set(0, 4, 4);

// loading a model
gltfLoader.load("/my-room-in-3d.glb", (gltf) => {
  gltf.scene.traverse((child) => {
    (child as THREE.Mesh).material = bakedMaterials;
  });

  gltf.scene.position.y = -0.5;

  const setup = gltf.scene.children.find((mesh) => mesh.name === "Setup");
  const laptopScreen = gltf.scene.children.find(
    (mesh) => mesh.name === "laptopScreen"
  );

  const monitorScreen = gltf.scene.children.find(
    (mesh) => mesh.name === "monitorScreen"
  );

  if (setup) {
    (setup as THREE.Mesh).material = bakedMaterials;
  }

  if (laptopScreen) {
    (laptopScreen as THREE.Mesh).material = laptopScreenMaterial;
  }

  if (monitorScreen) {
    (monitorScreen as THREE.Mesh).material = monitorScreenMaterial;
  }

  const chairSupport = gltf.scene.children.find(
    (mesh) => mesh.name === "chairSupport"
  );
  const lampBall = gltf.scene.children.find((mesh) => mesh.name === "lampBall");

  if (chairSupport) {
    ((chairSupport as THREE.Mesh).material as THREE.Material).side =
      THREE.DoubleSide;
  }

  if (lampBall) {
    (lampBall as THREE.Mesh).material = new THREE.MeshBasicMaterial({
      color: "#ffffff",
    });
  }

  scene.add(gltf.scene);
  scene.updateMatrixWorld();
});

// Mouse
gltfLoader.load("/mouse.glb", (gltf) => {
  gltf.scene.position.y = -0.5;

  scene.add(gltf.scene);
  scene.updateMatrixWorld();
});

// Geometry
const group1 = new THREE.Group();
const group2 = new THREE.Group();
const geometry = new THREE.PlaneGeometry(1, 1, 1);
const material = new THREE.ShaderMaterial({
  fragmentShader: /* glsl */ `
        void main() {
          gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
        }
      `,
  side: THREE.DoubleSide,
});

const plane1 = new THREE.Mesh(geometry, material);
const plane2 = new THREE.Mesh(geometry, material);
// geometry.scale(0.4, 0.25, 0);

// Group 1
group1.position.x = -0.465;
group1.position.y = 0.31;
group1.position.z = -0.8;

group1.rotation.y = Math.PI * 0.056;
group1.rotation.x = -Math.PI * 0.064;
group1.rotation.z = Math.PI * 0.01;

// group.updateMatrix();
group1.add(plane1);
scene.add(group1);

// Group 2
group2.position.x = 0.213;
group2.position.y = 0.485;
group2.position.z = -0.663;

gui.add(group2.position, "x").step(0.001).min(0.001).max(0.7);
gui.add(group2.position, "y").step(0.001).min(0.001).max(0.7);
gui.add(group2.position, "z").step(0.001).min(-0.7).max(0.7);
gui.add(group2.rotation, "y").step(0.001).min(-Math.PI).max(Math.PI);

group2.rotation.y = -0.352;
// group1.rotation.x = -Math.PI * 0.064;
// group2.rotation.z = Math.PI * 0.01;

group2.add(plane2);
scene.add(group2);

const updateIframe1 = renderIframeInWebGL(
  document.getElementById("html-container-1"),
  document.querySelector("canvas"),
  group1,
  plane1,
  camera,
  sizes,
  scene,
  transformOuter1,
  transformInner1
);

const udpateIframe2 = renderIframeInWebGL(
  document.getElementById("html-container-2"),
  document.querySelector("canvas"),
  group2,
  plane2,
  camera,
  sizes,
  scene,
  transformOuter2,
  transformInner2
);

camera.position.x = 3;
camera.position.z = 3;
camera.position.y = 2;

console.log(controls.target);

// camera.lookAt(new THREE.Vector3(0, 6, 0));

window.camera = camera;
window.getCameraDirection = () => {
  console.log(camera.getWorldDirection(new THREE.Vector3()));
};

// camera.position.x = 0.324387217940839;
// camera.position.y = 0.7221798606898963;
// camera.position.z = 1.4337901574019956;

camera.updateProjectionMatrix();

/**
 * Animate
 */

function animate() {
  controls.update();

  updateIframe1();
  udpateIframe2();

  renderer.render(scene, camera);

  requestAnimationFrame(animate);
}
animate();

/**
 * go to monitor view
 */

const toggleButton = document.getElementById("toggle-btn") as HTMLButtonElement;

toggleButton?.addEventListener("click", () => {
  toggleMonitorView();
});

function toggleMonitorView() {
  if (!isMonitorView) {
    isMonitorView = true;
    renderer.domElement.style.pointerEvents = "none";
    toggleButton.disabled = true;
    toggleButton.innerText = "Close";
    gsap.to(camera.position, {
      duration: 2,
      x: 0.324387217940839,
      y: 0.7221798606898963,
      z: 1.4337901574019956,
    });
    // camera.position.set(
    //   0.324387217940839,
    //   0.7221798606898963,
    //   1.4337901574019956
    // );
    gsap.to(controls.target, {
      duration: 2,
      x: 0.1,
      y: 0.5,
      onComplete: () => {
        toggleButton.disabled = false;
      },
    });
    // controls.target.set(0.1, 0.5, 0);
  } else {
    isMonitorView = false;
    gsap.to(camera.position, {
      duration: 2,
      x: 3,
      y: 3,
      z: 2,
    });
    gsap.to(controls.target, {
      duration: 2,
      x: 0,
      y: 0,
      onComplete: () => {
        renderer.domElement.style.pointerEvents = "auto";
      },
    });
    // camera.position.set(3, 3, 2);
    // controls.target.set(0, 0, 0);
  }
}
