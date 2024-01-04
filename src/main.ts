import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { renderIframeInWebGL } from "./renderIframe";
import "./style.css";

// const fragmentShade;

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
 * ShaderMaterials
 */
// const laptopShaderMaterial = new THREE.ShaderMaterial({
//   vertexShader: `

//     varying vec2 vUv;

//     void main() {
//         vec4 modelPosition = modelMatrix * vec4(position, 1.0);

//         vec4 viewPosition = viewMatrix * modelPosition;
//         vec4 projectedPosition = projectionMatrix * viewPosition;

//         gl_Position = projectedPosition;

//         vUv = uv;
//     }
//   `,
//   fragmentShader: `
//     varying vec2 vUv;

//     uniform sampler2D uTexture;

//     void main() {
//         vec4 textureColor = texture2D(uTexture, vUv);

//         gl_FragColor = textureColor;
//     }
//   `,
//   uniforms: {
//     uTexture: { value: laptopScreenTexture },
//   },
// });

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

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

// Renderer
const renderer = new THREE.WebGLRenderer({
  antialias: true,
});
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById("app")?.appendChild(renderer.domElement);

// Orbit Controls
const controls = new OrbitControls(camera, renderer.domElement);
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
    // if (child.name == "Cube011" || child.name == "Cube014") {
    //   child.material = poleLightMaterial;
    // } else if (child.name == "Circle") {
    //   child.material = portalLightMaterial;
    // } else {
    // }
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
});

// Mouse
gltfLoader.load("/mouse.glb", (gltf) => {
  gltf.scene.position.y = -0.5;

  scene.add(gltf.scene);
});

// Geometry
const group = new THREE.Group();
const geometry = new THREE.PlaneGeometry(1, 1, 1);
const material = new THREE.ShaderMaterial({
  vertexShader: /* glsl */ `
          /*
            This shader is from the THREE's SpriteMaterial.
            We need to turn the backing plane into a Sprite
            (make it always face the camera) if "transfrom" 
            is false. 
          */
          #include <common>

          void main() {
            vec2 center = vec2(0., 1.);
            float rotation = 0.0;
            
            // This is somewhat arbitrary, but it seems to work well
            // Need to figure out how to derive this dynamically if it even matters
            float size = 0.03;

            vec4 mvPosition = modelViewMatrix * vec4( 0.0, 0.0, 0.0, 1.0 );
            vec2 scale;
            scale.x = length( vec3( modelMatrix[ 0 ].x, modelMatrix[ 0 ].y, modelMatrix[ 0 ].z ) );
            scale.y = length( vec3( modelMatrix[ 1 ].x, modelMatrix[ 1 ].y, modelMatrix[ 1 ].z ) );

            bool isPerspective = isPerspectiveMatrix( projectionMatrix );
            if ( isPerspective ) scale *= - mvPosition.z;

            vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale * size;
            vec2 rotatedPosition;
            rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
            rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
            mvPosition.xy += rotatedPosition;

            gl_Position = projectionMatrix * mvPosition;
          }
      `,
  fragmentShader: /* glsl */ `
        void main() {
          gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
        }
      `,
});
const plane = new THREE.Mesh(geometry, material);
group.add(plane);
scene.add(group);

camera.position.x = 3;
camera.position.z = 3;
camera.position.y = 2;

camera.lookAt(new THREE.Vector3(0, 6, 0));

const updateIframe = renderIframeInWebGL(
  document.querySelector(".htmlContainer"),
  group,
  plane,
  camera,
  sizes,
  scene
);

console.log(updateIframe);

/**
 * Animate
 */

function animate() {
  controls.update();

  renderer.render(scene, camera);

  updateIframe();

  requestAnimationFrame(animate);
}
animate();
