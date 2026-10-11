import { BeltMarkers } from '../BeltMarkers';
import { tierForDetail } from '../geometry/lod';
import { buildPartGeometry, releaseBuiltGeometry } from '../geometry/buildPart';
import { PISTON_GEOMETRY } from '../../data/engine/pistonGeometry';
import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { memo, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { EnginePart } from '../../core/types';
import { useEngineStore } from '../../core/store';
import { t, useLocale } from '../../core/i18n';
import { applyPartPose, createPartPose, isPartAnimated } from './partPose';
import {
  GROOVE_COLOR, HOVERED_COLOR, METAL_COLOR, partOpacity, partVisible,
  RING_COLOR, SELECTED_COLOR, SYSTEM_COLORS, type PartFlags,
} from './materials';

function PistonDebug({ cylinder }: { cylinder: number }) {
  return <group userData={{ debug: true, cylinder }}>
    {/* Обе оси построены в одном local frame. Разный диаметр позволяет видеть совпадение. */}
    <mesh userData={{ debug: true, role: 'cylinder-axis' }}>
      <cylinderGeometry args={[0.008, 0.008, 1.8, 8]} />
      <meshBasicMaterial color="#43e47b" transparent opacity={0.8} depthTest={false} />
    </mesh>
    <mesh userData={{ debug: true, role: 'piston-axis' }}>
      <cylinderGeometry args={[0.014, 0.014, 0.82, 8]} />
      <meshBasicMaterial color="#42d8ff" transparent opacity={0.85} depthTest={false} />
    </mesh>
    <mesh userData={{ debug: true, role: 'piston-center' }}>
      <sphereGeometry args={[0.025, 10, 8]} />
      <meshBasicMaterial color="#ff5b4d" depthTest={false} />
    </mesh>
    {PISTON_GEOMETRY.rings.map((ring, i) => <group key={ring.kind} position={[0, ring.centerY, 0]}>
      <mesh userData={{ debug: true, role: 'ring-plane', ringIndex: i }} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[PISTON_GEOMETRY.grooveRootRadius, PISTON_GEOMETRY.cylinderBoreRadius, 48]} />
        <meshBasicMaterial color="#ffc83d" side={THREE.DoubleSide} transparent opacity={0.22} depthTest={false} />
      </mesh>
      <mesh userData={{ debug: true, role: 'ring-normal', ringIndex: i }}>
        <cylinderGeometry args={[0.007, 0.007, 0.2, 7]} />
        <meshBasicMaterial color="#ffc83d" depthTest={false} />
      </mesh>
      <mesh userData={{ debug: true, role: 'ring-center', ringIndex: i }}>
        <sphereGeometry args={[0.018, 8, 6]} />
        <meshBasicMaterial color="#fff2a8" depthTest={false} />
      </mesh>
    </group>)}
  </group>;
}

export const PartMesh = memo(function PartMesh({ part, removed }: { part: EnginePart; removed: boolean }) {
  useLocale();
  const ref = useRef<THREE.Group>(null);
  const selected = useEngineStore((s) => s.selected === part.id);
  const hovered = useEngineStore((s) => s.hovered === part.id);
  const isHidden = useEngineStore((s) => s.hidden.has(part.id));
  const isolated = useEngineStore((s) => s.isolated);
  const systemVisible = useEngineStore((s) => s.systems[part.system]);
  const isTransparent = useEngineStore((s) => s.transparent.has(part.id));
  const viewMode = useEngineStore((s) => s.viewMode);
  const debug = useEngineStore(s=>s.debug);
  const detail = useEngineStore((s) => s.detailLevel);
  const set = useEngineStore((s) => s.set);
  const select = useEngineStore((s) => s.select);

  const tier = useMemo(() => tierForDetail(detail), [detail]);
  const built = useMemo(() => buildPartGeometry(part, tier), [part, tier]);
  useEffect(() => () => releaseBuiltGeometry(built), [built]);

  // Деталь может уйти из сцены прямо под курсором (смена тира, скрытие, изоляция):
  // тогда onPointerOut не сработает, и hovered останется висеть на несуществующей детали.
  useEffect(() => () => {
    const state = useEngineStore.getState();
    if (state.hovered === part.id) state.set({ hovered: null });
  }, [part.id]);

  const flags = useMemo<PartFlags>(() => ({
    viewMode, isolated, hidden: isHidden, transparent: isTransparent, systemEnabled: systemVisible,
  }), [viewMode, isolated, isHidden, isTransparent, systemVisible]);

  const color = selected ? SELECTED_COLOR : hovered ? HOVERED_COLOR : (SYSTEM_COLORS[part.system] ?? METAL_COLOR);
  const opacity = partOpacity(part, flags);
  const visible = partVisible(part, flags);
  const isRing = part.kind === 'ring';

  useLayoutEffect(() => {
    const group = ref.current;
    const material = new THREE.MeshStandardMaterial({ color, transparent: opacity < 1, opacity, depthWrite: opacity > .35, wireframe: viewMode === 'xray', side: THREE.DoubleSide, roughness: .44, metalness: part.system === 'intake' ? .3 : .68 });
    const ringMaterial = new THREE.MeshStandardMaterial({ color: RING_COLOR, transparent: opacity < 1, opacity, depthWrite: opacity > .35, wireframe: viewMode === 'xray', roughness: .28, metalness: .92 });
    const grooveMaterial = new THREE.MeshStandardMaterial({ color: GROOVE_COLOR, transparent: opacity < 1, opacity, depthWrite: opacity > .35, wireframe: viewMode === 'xray', roughness: .62, metalness: .55 });
    group?.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      if (object instanceof THREE.InstancedMesh || object.userData.debug) return;
      object.material = object.userData.pistonRing ? ringMaterial : object.userData.pistonGroove ? grooveMaterial : material;
    });
    return () => { material.dispose(); ringMaterial.dispose(); grooveMaterial.dispose(); };
  }, [color, opacity, part.system, viewMode, visible, debug]);

  useEffect(() => {
    if (!ref.current) return;
    ref.current.userData.partStats = built.group.userData.geometryStats;
    ref.current.userData.partTier = built.tier;
  }, [built, ref]);

  // Поза задаётся только императивно: если передать position/rotation пропсами, то
  // любой повторный рендер (например, наведение) сбросит деталь в каталожную позицию,
  // а гейт ниже не станет её исправлять до следующего изменения угла.
  const animated = useMemo(() => isPartAnimated(part), [part]);
  const pose = useMemo(createPartPose, []);
  const last = useRef<{ theta: number | null; explode: number | null; removed: boolean | null }>({ theta: null, explode: null, removed: null });

  useFrame(() => {
    const group = ref.current;
    if (!group) return;
    const state = useEngineStore.getState();
    const previous = last.current;
    const explodeChanged = previous.explode !== state.explode || previous.removed !== removed;
    const thetaMoved = animated && previous.theta !== state.crankAngle;
    if (!explodeChanged && !thetaMoved) return;
    previous.theta = state.crankAngle;
    previous.explode = state.explode;
    previous.removed = removed;
    applyPartPose(part, { theta: state.crankAngle, explode: state.explode, removed }, pose);
    group.position.copy(pose.position);
    group.rotation.copy(pose.rotation);
    group.scale.copy(pose.scale);
  });

  if (!visible || isRing) return null;
  return <group ref={ref} userData={{ partId: part.id }}
    onPointerOver={(e) => { e.stopPropagation(); set({ hovered: part.id }); }}
    onPointerOut={() => { set({ hovered: null }); }}
    onPointerDown={(e) => { (ref.current!.userData as Record<string, unknown>)._ptrDown = [e.nativeEvent.clientX, e.nativeEvent.clientY]; }}
    onPointerUp={(e) => {
      const down = (ref.current!.userData._ptrDown ?? []) as number[];
      if (down.length && Math.hypot(e.nativeEvent.clientX - down[0], e.nativeEvent.clientY - down[1]) < 5) {
        e.stopPropagation(); select(part.id);
      }
      (ref.current!.userData as Record<string, unknown>)._ptrDown = undefined;
    }}>
    <primitive object={built.group} />
    {part.id==='timing-belt' && <BeltMarkers />}
    {debug && part.kind === 'piston' && part.cylinder != null && <PistonDebug cylinder={part.cylinder} />}
    {debug && part.rotationAxis && <group><mesh userData={{debug:true}} rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[.012,.012,1.1,6]}/><meshBasicMaterial color="#4ce3ec"/></mesh><mesh userData={{debug:true}}><sphereGeometry args={[.05,8,6]}/><meshBasicMaterial color="#ff6655"/></mesh></group>}
    {(hovered || (debug && part.rotationAxis)) && <Html center position={[0,.55,0]} style={{pointerEvents:'none'}}><div className="model-tooltip"><span>{t(part.nameRu)}</span><small>{part.name}</small></div></Html>}
  </group>;
});
