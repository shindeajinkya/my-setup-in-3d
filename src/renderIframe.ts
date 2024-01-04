import {
  Camera,
  Object3D,
  OrthographicCamera,
  PerspectiveCamera,
  Scene,
  Vector3,
} from "three";

const zIndexRange = [16777271, 0];
const distanceFactor = 0.3;

const v1 = /* @__PURE__ */ new Vector3();
const v2 = /* @__PURE__ */ new Vector3();
const v3 = /* @__PURE__ */ new Vector3();

const position = new Vector3();
const defaultTarget = new Vector3();
const tempTarget = new Vector3();

/**
 * function taken from @react-three-fiber/drei
 * @param el
 * @param camera
 * @param size
 * @returns
 */
export function defaultCalculatePosition(
  el: Object3D,
  camera: Camera,
  size: { width: number; height: number }
) {
  const objectPos = v1.setFromMatrixPosition(el.matrixWorld);
  objectPos.project(camera);
  const widthHalf = size.width / 2;
  const heightHalf = size.height / 2;
  return [
    objectPos.x * widthHalf + widthHalf,
    -(objectPos.y * heightHalf) + heightHalf,
  ];
}

function objectScale(el: Object3D, camera: Camera) {
  if (camera instanceof OrthographicCamera) {
    return camera.zoom;
  } else if (camera instanceof PerspectiveCamera) {
    const objectPos = v1.setFromMatrixPosition(el.matrixWorld);
    const cameraPos = v2.setFromMatrixPosition(camera.matrixWorld);
    const vFOV = (camera.fov * Math.PI) / 180;
    const dist = objectPos.distanceTo(cameraPos);
    const scaleFOV = 2 * Math.tan(vFOV / 2) * dist;
    return 1 / scaleFOV;
  } else {
    return 1;
  }
}

function objectZIndex(
  el: Object3D,
  camera: Camera,
  zIndexRange: Array<number>
) {
  if (
    camera instanceof PerspectiveCamera ||
    camera instanceof OrthographicCamera
  ) {
    const objectPos = v1.setFromMatrixPosition(el.matrixWorld);
    const cameraPos = v2.setFromMatrixPosition(camera.matrixWorld);
    const dist = objectPos.distanceTo(cameraPos);
    const A = (zIndexRange[1] - zIndexRange[0]) / (camera.far - camera.near);
    const B = zIndexRange[1] - A * camera.far;
    return Math.round(A * dist + B);
  }
  return undefined;
}

export function renderIframeInWebGL(
  el: any,
  group: Object3D,
  mesh: Object3D,
  camera: Camera,
  size: { width: number; height: number },
  scene: Scene
) {
  // occlude
  el.style.zIndex = `${Math.floor(zIndexRange[0] / 2)}`;
  el.style.position = "absolute";
  el.style.pointerEvents = "none";

  //   for transform
  //   el.style.cssText = `position:absolute;top:0;left:0;pointer-events:none;overflow:hidden;`;
  const vec = defaultCalculatePosition(group, camera, size);
  el.style.cssText = `position:absolute;top:0;left:0;transform:translate3d(${vec[0]}px,${vec[1]}px,0);transform-origin:0 0;`;

  return () => {
    const vec = defaultCalculatePosition(group, camera, size);
    el.style.zIndex = `${objectZIndex(group, camera, zIndexRange)}`;

    const scale =
      distanceFactor === undefined
        ? 1
        : objectScale(group, camera) * distanceFactor;
    el.style.transform = `translate3d(${vec[0]}px,${vec[1]}px,0) scale(${scale})`;

    const ele = el.children[0];

    if (ele?.clientWidth && ele?.clientHeight) {
      const ratio = 1 / getFactor(camera as PerspectiveCamera, size);
      const w = ele.clientWidth * ratio;
      const h = ele.clientHeight * ratio;

      mesh.scale.set(w, h, 1);

      //   isMeshSizeSet.current = true;
    }

    mesh.lookAt(camera.position);
  };
}

function getFactor(
  camera: PerspectiveCamera,
  size: { width: number; height: number }
) {
  //   const { width, height } =
  //     document.getElementById("app")?.getBoundingClientRect() ?? {};
  //   if (!width || !height) return;
  const tempV = new Vector3();
  const distance = camera.getWorldPosition(position).distanceTo(tempV);
  const fov = (camera.fov * Math.PI) / 180; // convert vertical fov to radians
  const h = 2 * Math.tan(fov / 2) * distance; // visible height
  const w = h * (size.width / size.height);

  return size.width / w;
}
