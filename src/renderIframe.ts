import {
  Camera,
  Matrix4,
  Object3D,
  OrthographicCamera,
  PerspectiveCamera,
  Scene,
  Vector3,
} from "three";

const zIndexRange = [16777271, 0];
const distanceFactor = 0.16;

const v1 = /* @__PURE__ */ new Vector3();
const v2 = /* @__PURE__ */ new Vector3();
const v3 = /* @__PURE__ */ new Vector3();

function isObjectBehindCamera(el: Object3D, camera: Camera) {
  const objectPos = v1.setFromMatrixPosition(el.matrixWorld);
  const cameraPos = v2.setFromMatrixPosition(camera.matrixWorld);
  const deltaCamObj = objectPos.sub(cameraPos);
  const camDir = camera.getWorldDirection(v3);
  return deltaCamObj.angleTo(camDir) > Math.PI / 2;
}

const epsilon = (value: number) => (Math.abs(value) < 1e-10 ? 0 : value);

function getCSSMatrix(matrix: Matrix4, multipliers: number[], prepend = "") {
  let matrix3d = "matrix3d(";
  for (let i = 0; i !== 16; i++) {
    matrix3d +=
      epsilon(multipliers[i] * matrix.elements[i]) + (i !== 15 ? "," : ")");
  }
  return prepend + matrix3d;
}

const getCameraCSSMatrix = ((multipliers: number[]) => {
  return (matrix: Matrix4) => getCSSMatrix(matrix, multipliers);
})([1, -1, 1, 1, 1, -1, 1, 1, 1, -1, 1, 1, 1, -1, 1, 1]);

const getObjectCSSMatrix = ((scaleMultipliers: (n: number) => number[]) => {
  return (matrix: Matrix4, factor: number) =>
    getCSSMatrix(matrix, scaleMultipliers(factor), "translate(-50%,-50%)");
})((f: number) => [
  1 / f,
  1 / f,
  1 / f,
  1,
  -1 / f,
  -1 / f,
  -1 / f,
  -1,
  1 / f,
  1 / f,
  1 / f,
  1,
  1,
  1,
  1,
  1,
]);

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
  glDomElement: any,
  group: Object3D,
  mesh: Object3D,
  camera: Camera,
  size: { width: number; height: number },
  scene: Scene,
  transformOuter: any,
  transformInner: any
) {
  let isMeshSizeSet = false;

  // occlude
  glDomElement.style.zIndex = `${Math.floor(zIndexRange[0] / 2)}`;
  glDomElement.style.position = "absolute";
  // glDomElement.style.pointerEvents = "none";

  scene.updateMatrixWorld();

  // Styles for inner and outer divs
  transformOuter.style.position = "absolute";
  transformOuter.style.top = 0;
  transformOuter.style.left = 0;
  transformOuter.style.width = size.width + "px";
  transformOuter.style.height = size.height + "px";
  transformOuter.style.transformStyle = "preserve-3d";
  transformOuter.style.pointerEvents = "none";

  transformInner.style.position = "absolute";
  transformInner.style.pointerEvents = "auto";

  let visible = true;

  //   for transform
  el.style.cssText = `position:absolute;top:0;left:0;pointer-events:none;overflow:hidden;`;

  return () => {
    camera.updateMatrixWorld();
    group.updateWorldMatrix(true, false);

    const isBehindCamera = isObjectBehindCamera(group, camera);

    const previouslyVisible = visible;
    visible = !isBehindCamera;

    if (previouslyVisible !== visible)
      el.style.display = visible ? "block" : "none";

    const halfRange = Math.floor(zIndexRange[0] / 2);
    const zRange = [halfRange - 1, 0];

    el.style.zIndex = `${objectZIndex(group, camera, zRange)}`;

    const [widthHalf, heightHalf] = [size.width / 2, size.height / 2];
    const fov = camera.projectionMatrix.elements[5] * heightHalf;

    const cameraMatrix = getCameraCSSMatrix(camera.matrixWorldInverse);
    const cameraTransform = `translateZ(${fov}px)`;

    const matrix = group.matrixWorld;

    el.style.width = size.width + "px";
    el.style.height = size.height + "px";
    el.style.perspective = `${fov}px`;

    transformOuter.style.transform = `${cameraTransform}${cameraMatrix}translate(${widthHalf}px,${heightHalf}px)`;
    transformInner.style.transform = getObjectCSSMatrix(
      matrix,
      1 / ((distanceFactor || 10) / 400)
    );

    if (!isMeshSizeSet) {
      const elNew = transformOuter.children[0];

      if (elNew?.clientWidth && elNew?.clientHeight) {
        const ratio = (distanceFactor || 10) / 400;
        const w = elNew.clientWidth * ratio;
        const h = elNew.clientHeight * ratio;

        mesh.scale.set(w, h, 1);
      }
    }
  };
}
