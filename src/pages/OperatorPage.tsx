import { Canvas, useLoader, useThree, useFrame } from "@react-three/fiber";
import Header from "../components/Header";
import connectLogo from "../assets/connect_flexeserve.svg";
import "./OperatorPage.css";
import {
  Suspense,
  useEffect,
  useMemo,
  useState,
  useRef,
  useCallback,
  type RefObject,
} from "react";
import AnimatedContent from "../components/AnimatedContent";
import operatorScene from "../assets/operator_scene.glb?url";
//import hdrTextureUrl from "../assets/wooden_studio_07_1k.hdr?url";
//import { HDRLoader } from "../lib/HDRLoader";
import {
  Color,
  PCFSoftShadowMap,
  Mesh,
  MeshPhysicalMaterial,
  Object3D,
  PerspectiveCamera,
  Quaternion,
  RectAreaLight,
  DoubleSide,
  Group,
  Vector3,
  Euler,
  PlaneGeometry,
  BufferAttribute,
  MeshBasicMaterial,
  AdditiveBlending,
  CanvasTexture,
  ClampToEdgeWrapping,
  MathUtils,
  //Texture,
  //EquirectangularReflectionMapping,
  type Material,
} from "three";
import {
  GLTFLoader,
  type GLTF,
} from "three/examples/jsm/loaders/GLTFLoader.js";
import { RectAreaLightUniformsLib } from "three/examples/jsm/lights/RectAreaLightUniformsLib.js";
import { TransformControls } from "three/examples/jsm/controls/TransformControls.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

RectAreaLightUniformsLib.init();

const tempOptions = ["Off", "Lights Only", "170F", "175F", "180F"];
const defaultLightTarget: [number, number, number] = [0, 1, 0];
const defaultLightRotation: [number, number, number] = [-Math.PI / 2, 0, 0];
const zoneDisplayMeta = [
  { unit: "Flexeserve Left", zone: 1 },
  { unit: "Flexeserve Left", zone: 2 },
  { unit: "Flexeserve Right", zone: 1 },
  { unit: "Flexeserve Right", zone: 2 },
];

const arraysEqual = (
  a?: readonly number[] | null,
  b?: readonly number[] | null,
) => {
  if (!a && !b) return true;
  if (!a || !b) return false;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return false;
  }
  return true;
};

type LightAnchor = {
  position: [number, number, number];
  quaternion?: [number, number, number, number];
  size?: [number, number];
};

type LightAnchors = {
  light1?: LightAnchor;
  light2?: LightAnchor;
  light3?: LightAnchor;
  light4?: LightAnchor;
};

const lightAnchorEqual = (a?: LightAnchor, b?: LightAnchor) => {
  if (!a && !b) return true;
  if (!a || !b) return false;
  return (
    arraysEqual(a.position, b.position) &&
    arraysEqual(a.quaternion ?? null, b.quaternion ?? null) &&
    arraysEqual(a.size ?? null, b.size ?? null)
  );
};

type FanEmitter = {
  position: [number, number, number];
  quaternion?: [number, number, number, number];
  rotation?: [number, number, number];
};

type FanEmitters = Record<string, FanEmitter | undefined>;

type FanControllerEntry = {
  position: [number, number, number];
  rotation?: [number, number, number];
  target?: [number, number, number];
} | null;

type StatusBubble = {
  key: number;
  message: string;
};

type FanFlowFieldProps = {
  emitter?: FanEmitter;
  active: boolean;
  color: string;
  width?: number;
  height?: number;
  offset?: [number, number, number];
};

type ZoneFlowLayout = {
  zoneIndex: number;
  emitterKey: string;
  fallbackKey?: string;
  offset?: [number, number, number];
};

const zoneFlowLayout: ZoneFlowLayout[] = [
  { emitterKey: "fanemitterzone1", fallbackKey: "fan1", zoneIndex: 0 },
  { emitterKey: "fanemitterzone2", fallbackKey: "fan2", zoneIndex: 1 },
  { emitterKey: "fanemitterzone3", fallbackKey: "fan3", zoneIndex: 2 },
  { emitterKey: "fanemitterzone4", fallbackKey: "fan4", zoneIndex: 3 },
];

// const getOperatorEnvironment = (() => {
//   let cache: Promise<Texture> | null = null;
//   return () => {
//     if (!cache) {
//       const loader = new HDRLoader();
//       cache = loader.loadAsync(hdrTextureUrl).then((texture) => {
//         texture.mapping = EquirectangularReflectionMapping;
//         return texture;
//       });
//     }
//     return cache;
//   };
// })();

type OperatorPageProps = {
  onBack?: () => void;
};

function useAdoptedCamera(gltf?: GLTF | null) {
  const { camera } = useThree();

  useEffect(() => {
    if (!gltf) return;

    const exportedCamera =
      (gltf.cameras?.[0] as PerspectiveCamera | undefined) ||
      (gltf.scene.getObjectByProperty("type", "PerspectiveCamera") as
        | PerspectiveCamera
        | undefined);

    if (!exportedCamera) return;

    exportedCamera.updateWorldMatrix(true, true);

    const position = new Vector3();
    const quaternion = new Quaternion();
    exportedCamera.matrixWorld.decompose(position, quaternion, new Vector3());

    camera.position.copy(position);
    camera.quaternion.copy(quaternion);

    if ("fov" in exportedCamera) {
      (camera as PerspectiveCamera).fov = exportedCamera.fov;
      (camera as PerspectiveCamera).focus = exportedCamera.focus;
    }

    camera.near = exportedCamera.near;
    camera.far = exportedCamera.far;
    camera.updateProjectionMatrix();
  }, [camera, gltf]);
}

type ImportedOperatorSceneProps = {
  onAnchors?: (anchors: LightAnchors) => void;
  onFanEmitters?: (emitters: FanEmitters) => void;
  onSceneReady?: () => void;
};

function ImportedOperatorScene({
  onAnchors,
  onFanEmitters,
  onSceneReady,
}: ImportedOperatorSceneProps) {
  const gltf = useLoader(GLTFLoader, operatorScene) as GLTF;
  useAdoptedCamera(gltf);
  const readyRef = useRef(false);

  // useEffect(() => {
  //   let disposed = false;
  //   let cleanup: (() => void) | null = null;
  //   getOperatorEnvironment()
  //     .then((texture) => {
  //       if (disposed) return;
  //       const previousEnvironment = rootScene.environment;
  //       const previousBackground = rootScene.background;
  //       rootScene.environment = texture;
  //       cleanup = () => {
  //         rootScene.environment = previousEnvironment;
  //         rootScene.background = previousBackground;
  //       };
  //     })
  //     .catch((error) => {
  //       console.warn("HDR environment failed to load", error);
  //     });
  //   return () => {
  //     disposed = true;
  //     if (cleanup) cleanup();
  //   };
  // }, [rootScene]);

  const { preparedScene, anchors, fanEmitters } = useMemo(() => {
    const clone = gltf.scene.clone(true);
    const glassMaterial = new MeshPhysicalMaterial({
      color: new Color("#dff3ff"),
      transmission: 0.92,
      thickness: 0.4,
      roughness: 0.08,
      metalness: 0.05,
      clearcoat: 0.6,
      opacity: 1,
      transparent: true,
    });

    const isGlass = (child: Object3D, material?: Material) => {
      const normalizedChildName = child.name.trim().toLowerCase();
      if (
        normalizedChildName === "glasspanelcasing" ||
        normalizedChildName === "glasspanelcasing2"
      ) {
        return false;
      }
      if (
        normalizedChildName.startsWith("glasspanel") ||
        normalizedChildName.startsWith("riser")
      ) {
        return true;
      }
      if (!material?.name) return false;
      const normalized = material.name.toLowerCase();
      return (
        normalized.includes("glasspanel") ||
        normalized.includes("glass") ||
        normalized.includes("panel") ||
        normalized.includes("riser")
      );
    };

    clone.traverse((child: Object3D) => {
      child.castShadow = true;
      child.receiveShadow = true;

      const mesh = child as Mesh;
      if (mesh.material) {
        if (Array.isArray(mesh.material)) {
          mesh.material = mesh.material.map((mat) =>
            isGlass(child, mat as Material) ? glassMaterial.clone() : mat,
          );
        } else if (isGlass(child, mesh.material as Material)) {
          mesh.material = glassMaterial.clone();
        }
      }
    });

    const computeHelperSize = (
      node: Object3D,
    ): [number, number] | undefined => {
      const mesh = node as Mesh;
      if (!(mesh as Mesh).isMesh || !mesh.geometry) return undefined;
      if (!mesh.geometry.boundingBox) {
        mesh.geometry.computeBoundingBox();
      }
      const bbox = mesh.geometry.boundingBox;
      if (!bbox) return undefined;
      const size = new Vector3();
      bbox.getSize(size);
      const worldScale = new Vector3();
      node.getWorldScale(worldScale);
      size.multiply(worldScale);
      const dims = [Math.abs(size.x), Math.abs(size.y), Math.abs(size.z)].sort(
        (a, b) => b - a,
      );
      const width = dims[0];
      const height = dims[1] ?? dims[0];
      if (!width || !height) return undefined;
      return [width, height];
    };

    clone.updateMatrixWorld(true);
    const getAnchor = (name: string): LightAnchor | undefined => {
      const node = clone.getObjectByName(name);
      if (!node) return undefined;
      node.visible = false;
      const pos = new Vector3();
      const quat = new Quaternion();
      node.getWorldPosition(pos);
      node.getWorldQuaternion(quat);
      return {
        position: [pos.x, pos.y, pos.z],
        quaternion: [quat.x, quat.y, quat.z, quat.w],
        size: computeHelperSize(node),
      };
    };

    const fanEmitterMap: FanEmitters = {};

    const registerFanEmitterNode = (node: Object3D, key: string) => {
      const normalizedKey = key.trim().toLowerCase();
      if (!normalizedKey || fanEmitterMap[normalizedKey]) return;
      node.visible = false;
      const pos = new Vector3();
      const quat = new Quaternion();
      const euler = new Euler();
      node.getWorldPosition(pos);
      node.getWorldQuaternion(quat);
      euler.setFromQuaternion(quat);
      fanEmitterMap[normalizedKey] = {
        position: [pos.x, pos.y, pos.z],
        quaternion: [quat.x, quat.y, quat.z, quat.w],
        rotation: [euler.x, euler.y, euler.z],
      };
    };

    clone.traverse((child: Object3D) => {
      const name = child.name?.trim();
      if (!name) return;
      const lower = name.toLowerCase();
      const compact = lower.replace(/\s+/g, "");
      if (!compact.startsWith("fanemitter")) return;
      registerFanEmitterNode(child, compact);
      if (compact === "fanemitter1") registerFanEmitterNode(child, "fan1");
      if (compact === "fanemitter2") registerFanEmitterNode(child, "fan2");
      if (compact === "fanemitter3") registerFanEmitterNode(child, "fan3");
      if (compact === "fanemitter4") registerFanEmitterNode(child, "fan4");
      const zoneMatch =
        compact.match(/fanemitter.*?zone(\d+)/) || lower.match(/zone\s*(\d+)/i);
      if (zoneMatch) {
        const zoneId = zoneMatch[1]?.replace(/\D/g, "");
        if (zoneId) {
          let zoneNumber = parseInt(zoneId, 10);
          if (Number.isNaN(zoneNumber)) return;
          const isRight = lower.includes("right");
          if (isRight && zoneNumber <= 2) {
            zoneNumber += 2;
          }
          registerFanEmitterNode(child, `fanemitterzone${zoneNumber}`);
        }
      }
    });

    return {
      preparedScene: clone,
      anchors: {
        light1: getAnchor("Light1"),
        light2: getAnchor("Light2"),
        light3: getAnchor("Light3"),
        light4: getAnchor("Light4"),
      },
      fanEmitters: fanEmitterMap,
    };
  }, [gltf]);

  useEffect(() => {
    if (onAnchors) onAnchors(anchors);
  }, [anchors, onAnchors]);

  useEffect(() => {
    if (onFanEmitters) onFanEmitters(fanEmitters);
  }, [fanEmitters, onFanEmitters]);

  useEffect(() => {
    if (readyRef.current) return;
    readyRef.current = true;
    if (onSceneReady) onSceneReady();
  }, [onSceneReady]);

  return <primitive object={preparedScene} />;
}

type AnchoredRectLightProps = {
  anchor?: LightAnchor;
  active: boolean;
  color: string;
  intensity: number;
  width?: number;
  height?: number;
  target?: [number, number, number];
  debug?: boolean;
  lockToAnchor?: boolean;
  label: string;
  rotationOffset?: [number, number, number];
};

function AnchoredRectLight({
  anchor,
  active,
  color,
  intensity,
  width = 3.2,
  height = 2,
  target = defaultLightTarget,
  debug = false,
  lockToAnchor = true,
  label,
  rotationOffset = [0, 0, 0],
}: AnchoredRectLightProps) {
  const groupRef = useRef<Group | null>(null);
  const lightRef = useRef<RectAreaLight | null>(null);
  const resolvedWidth = anchor?.size?.[0] ?? width;
  const resolvedHeight = anchor?.size?.[1] ?? height;
  const rotationQuaternion = useMemo(() => {
    if (!rotationOffset) return null;
    const [rx, ry, rz] = rotationOffset;
    if (rx === 0 && ry === 0 && rz === 0) return null;
    const euler = new Euler(rx, ry, rz);
    return new Quaternion().setFromEuler(euler);
  }, [rotationOffset]);

  useEffect(() => {
    if (!groupRef.current || !anchor || !lockToAnchor) return;
    groupRef.current.position.set(
      anchor.position[0],
      anchor.position[1],
      anchor.position[2],
    );
    if (anchor.quaternion) {
      groupRef.current.quaternion.set(
        anchor.quaternion[0],
        anchor.quaternion[1],
        anchor.quaternion[2],
        anchor.quaternion[3],
      );
    } else {
      groupRef.current.lookAt(target[0], target[1], target[2]);
    }
    if (rotationQuaternion) {
      groupRef.current.quaternion.multiply(rotationQuaternion);
    }
  }, [anchor, lockToAnchor, target, rotationQuaternion]);

  useEffect(() => {
    if (!lightRef.current) return;
    lightRef.current.width = resolvedWidth;
    lightRef.current.height = resolvedHeight;
    lightRef.current.intensity = active ? intensity : 0;
    lightRef.current.color.set(color);
  }, [resolvedWidth, resolvedHeight, active, intensity, color]);

  if (!anchor) return null;

  return (
    <>
      <group ref={groupRef}>
        <rectAreaLight
          ref={lightRef}
          args={[color, intensity, resolvedWidth, resolvedHeight]}
          color={color}
          intensity={active ? intensity : 0}
          width={resolvedWidth}
          height={resolvedHeight}
        />
        {debug && (
          <mesh>
            <planeGeometry args={[resolvedWidth, resolvedHeight]} />
            <meshBasicMaterial
              color={color}
              opacity={0.25}
              transparent
              side={DoubleSide}
            />
          </mesh>
        )}
      </group>
      {debug && <LightDebugControls objectRef={groupRef} label={label} />}
    </>
  );
}

function FanFlowField({
  emitter,
  active,
  color,
  width = 1.8,
  height = 1.7,
  offset = [0, -2, -0.1],
}: FanFlowFieldProps) {
  const groupRef = useRef<Group | null>(null);
  const lineCount = 10;

  const gradientTexture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 16;
    canvas.height = 128;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, "rgba(255,255,255,0)");
      gradient.addColorStop(0.2, "rgba(255,255,255,0.9)");
      gradient.addColorStop(0.8, "rgba(255,255,255,0.9)");
      gradient.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    const texture = new CanvasTexture(canvas);
    texture.wrapS = ClampToEdgeWrapping;
    texture.wrapT = ClampToEdgeWrapping;
    texture.needsUpdate = true;
    return texture;
  }, []);

  const lineConfigs = useMemo(() => {
    const configs: {
      geometry: PlaneGeometry;
      basePositions: Float32Array;
      waveSeed: number;
      lateralSeed: number;
      verticalSeed: number;
    }[] = [];
    const lineWidth = width / (lineCount * 0.8);
    const spacing = lineWidth * 0.25;
    for (let i = 0; i < lineCount; i += 1) {
      const offsetAmount = (i - (lineCount - 1) / 2) * (lineWidth + spacing);
      const geometry = new PlaneGeometry(lineWidth, height, 8, 60);
      geometry.translate(offsetAmount, height * 0.42, 0.12);
      configs.push({
        geometry,
        basePositions: Float32Array.from(
          (geometry.getAttribute("position") as BufferAttribute)
            .array as ArrayLike<number>,
        ),
        waveSeed: Math.random() * Math.PI * 2,
        lateralSeed: Math.random() * Math.PI * 2,
        verticalSeed: Math.random() * Math.PI * 2,
      });
    }
    return configs;
  }, [height, width]);

  const materialsRef = useRef<MeshBasicMaterial[]>([]);
  const intensityRef = useRef(0);

  useEffect(
    () => () => {
      lineConfigs.forEach((config) => config.geometry.dispose());
    },
    [lineConfigs],
  );

  useEffect(() => {
    materialsRef.current = [];
  }, [lineConfigs]);

  useEffect(() => {
    materialsRef.current.forEach((material) => {
      if (material) material.color.set(color);
    });
  }, [color]);

  useEffect(() => {
    if (!groupRef.current || !emitter) return;
    const position = new Vector3(...(emitter?.position ?? [0, 0, 0]));
    const forwardOffset = new Vector3(0, 0, 0.05);
    const zoneOffset = new Vector3(...offset);
    if (emitter?.quaternion) {
      const quat = new Quaternion(...emitter.quaternion);
      forwardOffset.applyQuaternion(quat);
      zoneOffset.applyQuaternion(quat);
      groupRef.current.quaternion.copy(quat);
    } else if (emitter?.rotation) {
      groupRef.current.rotation.set(...emitter.rotation);
    } else {
      groupRef.current.rotation.set(0, 0, 0);
    }
    position.add(forwardOffset).add(zoneOffset);
    groupRef.current.position.copy(position);
  }, [emitter, offset]);

  useFrame(({ clock }) => {
    const target = active && emitter ? 1 : 0;
    intensityRef.current = MathUtils.lerp(intensityRef.current, target, 0.08);
    const visible = Boolean(emitter) && intensityRef.current > 0.02;
    if (groupRef.current) {
      groupRef.current.visible = visible;
    }
    if (!emitter) {
      materialsRef.current.forEach((material) => {
        if (material) material.opacity = 0;
      });
      return;
    }
    if (!visible) {
      materialsRef.current.forEach((material) => {
        if (material) material.opacity = 0;
      });
      return;
    }

    materialsRef.current.forEach((material) => {
      if (material) material.opacity = 0.65 * intensityRef.current;
    });

    const time = clock.getElapsedTime();
    lineConfigs.forEach((config, index) => {
      const positions = config.geometry.getAttribute(
        "position",
      ) as BufferAttribute;
      for (let i = 0; i < positions.count; i += 1) {
        const idx = i * 3;
        const baseX = config.basePositions[idx];
        const baseY = config.basePositions[idx + 1];
        const baseZ = config.basePositions[idx + 2];
        const progress = (baseY + height / 2) / height;
        const wave =
          Math.sin(progress * Math.PI * 3 + time * 2.1 + config.waveSeed) *
          0.04;
        const zigzag =
          Math.cos(progress * Math.PI * 4 + time * 1.2 + config.lateralSeed) *
          0.02;
        const verticalNoise =
          Math.sin(progress * Math.PI * 5 + time * 1.05 + config.verticalSeed) *
          0.008;
        positions.setX(i, baseX + zigzag * (1 + index * 0.15));
        positions.setY(i, baseY + verticalNoise);
        positions.setZ(i, baseZ + wave);
      }
      positions.needsUpdate = true;
    });
  });

  if (!emitter) return null;

  return (
    <group ref={groupRef}>
      {lineConfigs.map((config, idx) => (
        <mesh key={`fan-line-${idx}`} geometry={config.geometry}>
          <meshBasicMaterial
            ref={(material) => {
              if (material) materialsRef.current[idx] = material;
            }}
            transparent
            opacity={0}
            color={color}
            depthWrite={false}
            blending={AdditiveBlending}
            map={gradientTexture ?? undefined}
          />
        </mesh>
      ))}
    </group>
  );
}

export default function OperatorPage({ onBack }: OperatorPageProps) {
  const [temps, setTemps] = useState(["170F", "170F", "170F", "170F"]);
  const [lightAnchors, setLightAnchors] = useState<LightAnchors>({});
  const [fanEmitters, setFanEmitters] = useState<FanEmitters>({});
  const [sceneReady, setSceneReady] = useState(false);
  const [showLoader, setShowLoader] = useState(true);
  const handleSceneReady = useCallback(() => {
    setSceneReady(true);
  }, []);

  useEffect(() => {
    if (!sceneReady) return;
    const timeout = setTimeout(() => setShowLoader(false), 600);
    return () => clearTimeout(timeout);
  }, [sceneReady]);
  const computeFanTarget = useCallback(
    (emitter: FanEmitter): [number, number, number] => {
      const origin = new Vector3(...emitter.position);
      const forward = new Vector3(0, 0, 1);
      if (emitter.quaternion) {
        forward.applyQuaternion(new Quaternion(...emitter.quaternion));
      } else if (emitter.rotation) {
        forward.applyEuler(new Euler(...emitter.rotation));
      }
      const target = origin.clone().add(forward);
      return [target.x, target.y, target.z];
    },
    [],
  );

  const buildFanControllerEntry = useCallback(
    (emitter?: FanEmitter): FanControllerEntry => {
      if (!emitter) return null;
      return {
        position: emitter.position,
        rotation: emitter.rotation,
        target: computeFanTarget(emitter),
      };
    },
    [computeFanTarget],
  );

  const fanController = useMemo(
    () => ({
      fan1: buildFanControllerEntry(fanEmitters.fan1),
      fan2: buildFanControllerEntry(fanEmitters.fan2),
      fan3: buildFanControllerEntry(fanEmitters.fan3),
      fan4: buildFanControllerEntry(fanEmitters.fan4),
    }),
    [buildFanControllerEntry, fanEmitters],
  );
  const [debugLights, setDebugLights] = useState(false);
  const [cameraControlsEnabled, setCameraControlsEnabled] = useState(false);
  const [statusBubble, setStatusBubble] = useState<StatusBubble | null>(null);
  const bubbleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debugAvailable = import.meta.env.DEV;
  const debugActive = debugAvailable && debugLights;
  const cameraControlsActive = debugAvailable && cameraControlsEnabled;

  const showStatusBubble = (index: number, value: string) => {
    const meta = zoneDisplayMeta[index];
    const zoneLabel = meta
      ? `${meta.unit} Zone ${meta.zone}`
      : `Zone ${index + 1}`;
    const message = `${zoneLabel} set to ${value}`;
    if (bubbleTimeoutRef.current) {
      clearTimeout(bubbleTimeoutRef.current);
    }
    const key = Date.now();
    setStatusBubble({ key, message });
    bubbleTimeoutRef.current = setTimeout(() => {
      setStatusBubble((current) => (current?.key === key ? null : current));
    }, 2600);
  };

  const updateTemp = (index: number, value: string) => {
    let changed = false;
    setTemps((prev) => {
      if (prev[index] === value) return prev;
      changed = true;
      const next = [...prev];
      next[index] = value;
      return next;
    });
    if (changed) {
      showStatusBubble(index, value);
    }
  };

  const isZoneActive = (value: string) => {
    const lower = value.toLowerCase();
    return lower !== "off" && lower !== "lights only";
  };

  const getFanColor = (value: string) => {
    const lower = value.toLowerCase();
    if (lower === "lights only") return "#f7f0d1";
    if (lower === "off") return "#8d8d8d";
    const numeric = parseInt(lower, 10);
    if (!Number.isNaN(numeric)) {
      if (numeric >= 180) return "#ff5b2e";
      if (numeric >= 175) return "#ff7a45";
      if (numeric >= 170) return "#ff934f";
    }
    return "#ffd8b2";
  };

  const zoneStates = useMemo(
    () =>
      temps.map((value) => ({
        active: isZoneActive(value),
        color: getFanColor(value),
      })),
    [temps],
  );

  const light1Active = temps[0].toLowerCase() !== "off";
  const light2Active = temps[1].toLowerCase() !== "off";
  const light3Active = temps[2].toLowerCase() !== "off";
  const light4Active = temps[3].toLowerCase() !== "off";
  const fan1LightPosition = fanController.fan1?.position ?? [-5, 3, -3];
  const fan1LightTarget = fanController.fan1?.target ?? [0, 1, 0];

  useEffect(() => {
    if (!debugAvailable) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (key === "d" && event.shiftKey) {
        setDebugLights((prev) => !prev);
        return;
      }
      if (key === "c" && event.shiftKey) {
        setCameraControlsEnabled((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [debugAvailable]);

  useEffect(() => {
    if (debugActive) {
      console.info(
        "Light debugging enabled. Use Shift+D to exit. Adjust gizmos and copy logged position/quaternion.",
      );
    }
  }, [debugActive]);

  useEffect(() => {
    if (!debugActive) return;
    if (!fanController.fan1 && !fanController.fan2) return;
    console.info("[FanController]", fanController);
  }, [debugActive, fanController]);

  useEffect(() => {
    if (cameraControlsActive) {
      console.info(
        "Camera controls enabled (Shift+C to exit). Use mouse to orbit and scroll to zoom.",
      );
    }
  }, [cameraControlsActive]);

  return (
    <div className="operator-page">
      <div className="operator-header">
        <Header onBack={onBack} title="Operator View" />
      </div>

      <div className="operator-content">
        <div className="operator-left">
          <div className="operator-grid">
            {[0, 1].map((col) => (
              <AnimatedContent
                key={`card-${col}`}
                distance={100}
                direction="vertical"
                reverse={false}
                duration={0.8}
                ease="power3.out"
                initialOpacity={0}
                animateOpacity
                scale={1}
                threshold={0.1}
                delay={col * 0.1}
              >
                <div className="operator-card">
                  <div className="operator-card-header">
                    {col === 0 ? "Flexeserve - LEFT" : "Flexeserve - RIGHT*"}
                  </div>
                  <div className="operator-card-body">
                    {[0, 1].map((row) => {
                      const idx = col * 2 + row;
                      return (
                        <div className="temp-row" key={`temp-${idx}`}>
                          <span className="status-dot" aria-hidden />
                          <select
                            className="temp-select"
                            value={temps[idx]}
                            onChange={(event) =>
                              updateTemp(idx, event.target.value)
                            }
                          >
                            {tempOptions.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </AnimatedContent>
            ))}
          </div>
        </div>

        <div className="operator-right">
          <div className="operator-cube">
            <div
              className={`operator-canvas-wrapper ${sceneReady ? "is-ready" : ""}`}
            >
              <Canvas
                camera={{ position: [0, 1.4, 6], fov: 120 }}
                shadows
                dpr={[1, 1.5]}
                onCreated={({ gl, camera }) => {
                  gl.shadowMap.enabled = true;
                  gl.shadowMap.type = PCFSoftShadowMap;
                  camera.lookAt(0, 1, 0);
                }}
              >
                <CameraOrbitControls enabled={cameraControlsActive} />
                <Suspense fallback={null}>
                  <directionalLight
                    color="#fff"
                    intensity={2}
                    position={[
                      fan1LightPosition[0],
                      fan1LightPosition[1] + 1.5,
                      fan1LightPosition[2],
                    ]}
                    target-position={fan1LightTarget}
                  />
                  <ImportedOperatorScene
                    onSceneReady={handleSceneReady}
                    onAnchors={(anchors) =>
                      setLightAnchors((prev) => {
                        const sameLight1 = lightAnchorEqual(
                          prev.light1,
                          anchors.light1,
                        );
                        const sameLight2 = lightAnchorEqual(
                          prev.light2,
                          anchors.light2,
                        );
                        const sameLight3 = lightAnchorEqual(
                          prev.light3,
                          anchors.light3,
                        );
                        const sameLight4 = lightAnchorEqual(
                          prev.light4,
                          anchors.light4,
                        );
                        if (
                          sameLight1 &&
                          sameLight2 &&
                          sameLight3 &&
                          sameLight4
                        )
                          return prev;
                        return anchors;
                      })
                    }
                    onFanEmitters={(emitters) =>
                      setFanEmitters((prev) => {
                        const sameFan1 =
                          (!prev.fan1 && !emitters.fan1) ||
                          (prev.fan1 &&
                            emitters.fan1 &&
                            arraysEqual(
                              prev.fan1.position,
                              emitters.fan1.position,
                            ) &&
                            arraysEqual(
                              prev.fan1.quaternion,
                              emitters.fan1.quaternion,
                            ) &&
                            arraysEqual(
                              prev.fan1.rotation,
                              emitters.fan1.rotation,
                            ));
                        const sameFan2 =
                          (!prev.fan2 && !emitters.fan2) ||
                          (prev.fan2 &&
                            emitters.fan2 &&
                            arraysEqual(
                              prev.fan2.position,
                              emitters.fan2.position,
                            ) &&
                            arraysEqual(
                              prev.fan2.quaternion,
                              emitters.fan2.quaternion,
                            ) &&
                            arraysEqual(
                              prev.fan2.rotation,
                              emitters.fan2.rotation,
                            ));
                        const sameFan3 =
                          (!prev.fan3 && !emitters.fan3) ||
                          (prev.fan3 &&
                            emitters.fan3 &&
                            arraysEqual(
                              prev.fan3.position,
                              emitters.fan3.position,
                            ) &&
                            arraysEqual(
                              prev.fan3.quaternion,
                              emitters.fan3.quaternion,
                            ) &&
                            arraysEqual(
                              prev.fan3.rotation,
                              emitters.fan3.rotation,
                            ));
                        const sameFan4 =
                          (!prev.fan4 && !emitters.fan4) ||
                          (prev.fan4 &&
                            emitters.fan4 &&
                            arraysEqual(
                              prev.fan4.position,
                              emitters.fan4.position,
                            ) &&
                            arraysEqual(
                              prev.fan4.quaternion,
                              emitters.fan4.quaternion,
                            ) &&
                            arraysEqual(
                              prev.fan4.rotation,
                              emitters.fan4.rotation,
                            ));
                        if (sameFan1 && sameFan2 && sameFan3 && sameFan4)
                          return prev;
                        return emitters;
                      })
                    }
                  />
                  <AnchoredRectLight
                    anchor={lightAnchors.light1}
                    active={light1Active}
                    color="#FFF"
                    intensity={10}
                    width={3.4}
                    height={1.4}
                    target={[0, 1, 0]}
                    debug={debugActive}
                    lockToAnchor={!debugActive}
                    label="Light1"
                    rotationOffset={defaultLightRotation}
                  />
                  <AnchoredRectLight
                    anchor={lightAnchors.light2}
                    active={light2Active}
                    color="#FFF"
                    intensity={10}
                    width={3.2}
                    height={1.4}
                    target={[0, 1, 0]}
                    debug={debugActive}
                    lockToAnchor={!debugActive}
                    label="Light2"
                    rotationOffset={defaultLightRotation}
                  />
                  <AnchoredRectLight
                    anchor={lightAnchors.light3}
                    active={light3Active}
                    color="#FFF"
                    intensity={10}
                    width={3.4}
                    height={1.4}
                    target={[0, 1, 0]}
                    debug={debugActive}
                    lockToAnchor={!debugActive}
                    label="Light3"
                    rotationOffset={defaultLightRotation}
                  />
                  <AnchoredRectLight
                    anchor={lightAnchors.light4}
                    active={light4Active}
                    color="#FFF"
                    intensity={10}
                    width={3.2}
                    height={1.4}
                    target={[0, 1, 0]}
                    debug={debugActive}
                    lockToAnchor={!debugActive}
                    label="Light4"
                    rotationOffset={defaultLightRotation}
                  />
                  {zoneFlowLayout.map(
                    ({ emitterKey, fallbackKey, zoneIndex, offset }) => {
                      const resolvedEmitter =
                        fanEmitters[emitterKey] ??
                        (fallbackKey ? fanEmitters[fallbackKey] : undefined);
                      return (
                        <FanFlowField
                          key={`fan-flow-${emitterKey}-${zoneIndex}`}
                          emitter={resolvedEmitter}
                          active={zoneStates[zoneIndex]?.active ?? false}
                          color={zoneStates[zoneIndex]?.color ?? "#8d8d8d"}
                          offset={offset}
                        />
                      );
                    },
                  )}
                </Suspense>
              </Canvas>
            </div>
            {showLoader && (
              <div
                className={`operator-loader-overlay ${sceneReady ? "fade-out" : ""}`}
                aria-live="polite"
              >
                <div className="operator-loader-spinner" />
                <span>Preparing Operator Scene</span>
              </div>
            )}
            {statusBubble && (
              <div className="operator-status-bubble" key={statusBubble.key}>
                {statusBubble.message}
              </div>
            )}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              marginTop: "0.75rem",
            }}
          >
            <button
              type="button"
              style={{
                border: "1px solid #333",
                background: cameraControlsActive ? "#333" : "#fff",
                color: cameraControlsActive ? "#fff" : "#333",
                borderRadius: "999px",
                padding: "0.35rem 0.9rem",
                fontSize: "0.85rem",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onClick={() => setCameraControlsEnabled((prev) => !prev)}
            >
              {cameraControlsActive ? "Disable" : "Enable"} Camera Controls
            </button>
            <span style={{ fontSize: "0.8rem", color: "#555" }}>(Shift+C)</span>
          </div>
          {debugActive && (
            <div
              style={{
                marginTop: "0.75rem",
                fontSize: "0.85rem",
                color: "#4f4f4f",
                fontStyle: "italic",
              }}
            >
              Light gizmos active (Shift+D to exit). Watch the console for
              updated position + quaternion.
            </div>
          )}
        </div>
      </div>

      <img src={connectLogo} alt="connect" className="operator-footer-logo" />
    </div>
  );
}

type LightDebugControlsProps = {
  objectRef: RefObject<Group | null>;
  label: string;
};

type CameraOrbitControlsProps = {
  enabled: boolean;
};

function CameraOrbitControls({ enabled }: CameraOrbitControlsProps) {
  const { camera, gl } = useThree();
  const controlsRef = useRef<OrbitControls | null>(null);

  useEffect(() => {
    const controls = new OrbitControls(camera, gl.domElement);
    controls.enableDamping = true;
    controls.enablePan = true;
    controls.enableZoom = true;
    controlsRef.current = controls;
    return () => {
      controls.dispose();
      controlsRef.current = null;
    };
  }, [camera, gl]);

  useEffect(() => {
    if (!controlsRef.current) return;
    controlsRef.current.enabled = enabled;
    controlsRef.current.update();
  }, [enabled]);

  useFrame(() => {
    if (controlsRef.current?.enabled) {
      controlsRef.current.update();
    }
  });

  return null;
}

function LightDebugControls({ objectRef, label }: LightDebugControlsProps) {
  const { camera, gl } = useThree();
  const controls = useMemo(
    () => new TransformControls(camera, gl.domElement),
    [camera, gl],
  );

  useEffect(() => () => controls.dispose(), [controls]);

  useEffect(() => {
    const target = objectRef.current;
    if (!target) return;
    controls.attach(target);
    controls.setMode("translate");
    const handleChange = () => {
      const position = target.position.toArray() as [number, number, number];
      const quaternion = target.quaternion.toArray() as [
        number,
        number,
        number,
        number,
      ];
      console.info(
        `[LightDebug] ${label} position:`,
        position,
        "quaternion:",
        quaternion,
      );
    };
    controls.addEventListener("objectChange", handleChange);
    return () => {
      controls.removeEventListener("objectChange", handleChange);
      controls.detach();
    };
  }, [controls, objectRef, label]);

  return <primitive object={controls} />;
}
