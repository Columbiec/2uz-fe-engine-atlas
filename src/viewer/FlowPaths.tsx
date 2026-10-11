import { Line } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';
import { useEngineStore } from '../core/store';

const paths = {
  oil: { color: '#e6ad39', points: [[0,-1.1,0],[0,-.65,.6],[0,0,2.2],[1.2,-.25,1.8],[0,0,0],[1.3,1.65,0],[1.8,2.5,0],[0,-1.1,0]] },
  coolant: { color: '#43a7e8', points: [[0,.9,2.8],[0,.9,2.2],[0,.35,0],[1.5,1.5,0],[1.9,2.2,0],[0,1.2,0],[-1.9,2.2,0],[-1.5,1.5,0],[0,.9,2.8]] },
  air: { color: '#58c7e6', points: [[0,2.65,4],[0,2.65,2.3],[0,2.7,0],[1,1.9,-1.2],[1.7,1.3,-1.2],[2.7,.4,-1.2],[3.4,.2,-1.2]] },
  fuel: { color: '#75cf78', points: [[1,2.1,2.5],[1,2.1,1.65],[.65,1.75,1.65],[.95,1.5,1.65]] },
};

function FlowParticle({ points, color, offset }: { points: number[][]; color: string; offset: number }) {
  const ref = useRef<THREE.Mesh>(null);
  const curve = useRef(new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(p[0],p[1],p[2])), true));
  useFrame(({clock}) => ref.current?.position.copy(curve.current.getPoint((clock.elapsedTime * .12 + offset) % 1)));
  return <mesh ref={ref}><sphereGeometry args={[.07,10,8]} /><meshBasicMaterial color={color} toneMapped={false} /></mesh>;
}

export function FlowPaths() {
  const mode = useEngineStore((s) => s.flow);
  if (mode === 'none') return null;
  const path = paths[mode];
  return <group>
    <Line points={path.points as [number,number,number][]} color={path.color} lineWidth={2} transparent opacity={.68} />
    {[0,.2,.4,.6,.8].map((offset)=><FlowParticle key={offset} points={path.points} color={path.color} offset={offset} />)}
  </group>;
}

