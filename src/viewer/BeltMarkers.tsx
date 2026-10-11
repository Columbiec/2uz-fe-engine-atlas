import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { beltPoint, beltLength, beltTravel } from '../data/engine/timing';
import { useEngineStore } from '../core/store';

const MARKER_COUNT = 48;

/** Светящиеся контрольные метки на ремне ГРМ. Это не зубья и не заявление о числе
 * зубьев реального ремня — только визуализация движения ленты. */
export function BeltMarkers() {
  const ref = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  useFrame(() => {
    if (!ref.current) return;
    const travel = beltTravel(useEngineStore.getState().crankAngle);
    for (let i = 0; i < MARKER_COUNT; i++) {
      const [x, y] = beltPoint((i * beltLength) / MARKER_COUNT + travel);
      dummy.position.set(x, y, 0.045);
      dummy.updateMatrix();
      ref.current.setMatrixAt(i, dummy.matrix);
    }
    ref.current.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, MARKER_COUNT]} frustumCulled={false}>
      <boxGeometry args={[0.035, 0.035, 0.065]} />
      <meshStandardMaterial color="#eedbaa" />
    </instancedMesh>
  );
}