import { t, useLocale } from '../core/i18n';
import { AdaptiveDpr, ContactShadows, GizmoHelper, GizmoViewport, Line, OrbitControls, PerspectiveCamera, Stars } from '@react-three/drei';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { memo, Suspense, useEffect, useMemo, useRef } from 'react';
import type { ElementRef } from 'react';
import * as THREE from 'three';
import { engine2uz } from '../engines/2uz-fe';
import { useEngineStore } from '../core/store';
import type { CameraPreset } from '../core/types';
import { PartMesh } from './parts/PartMesh';
import { removedPartIds } from '../core/removal';
import { SceneHud } from './SceneHud';
import { EngineAnimationController } from '../data/engine/kinematics';
import { FlowPaths } from './FlowPaths';

const cameras: Record<CameraPreset, [number,number,number]> = { iso:[11,8,13],front:[0,1.5,16],back:[0,1.5,-16],left:[-16,1.5,0],right:[16,1.5,0],top:[0,17,.1],bottom:[0,-15,.1],bank1:[14,7,3],bank2:[-14,7,3] };

function CameraRig() {
 useLocale();
  const controls = useRef<ElementRef<typeof OrbitControls>>(null);
  const { camera, gl } = useThree();
  const preset = useEngineStore(s=>s.cameraPreset);
  const request = useEngineStore(s=>s.cameraRequest);
  const moving = useRef(false);
  const target = useMemo(()=>new THREE.Vector3(0,.8,0),[]);
  const goal = useMemo(()=>new THREE.Vector3(...cameras.iso),[]);
  useEffect(()=>{
    const cancel = () => { moving.current=false; useEngineStore.getState().set({cameraPreset:null,navigation:'manual'}); };
    gl.domElement.addEventListener('pointerdown',cancel,{capture:true});
    gl.domElement.addEventListener('wheel',cancel,{capture:true,passive:true});
    return ()=>{gl.domElement.removeEventListener('pointerdown',cancel,true);gl.domElement.removeEventListener('wheel',cancel,true);};
  },[gl]);
  useEffect(()=>{
    const state=useEngineStore.getState();
    if(state.navigation==='manual')return;
    const part=!preset && state.selected ? engine2uz.parts.find(p=>p.id===state.selected):null;
    if(part){target.set(...part.position);goal.set(part.position[0]+4.2,part.position[1]+2.5,part.position[2]+4.2);}
    else if(preset){target.set(0,.8,0);goal.set(...cameras[preset]);}
    else return;
    moving.current=true;
  },[preset,request,target,goal]);
  useFrame((_,delta)=>{
    if(useEngineStore.getState().navigation==='manual')moving.current=false;
    if(!moving.current||!controls.current)return;
    // No OrbitControls damping during navigation: one owner of camera transforms.
    const alpha=1-Math.exp(-7*delta);
    camera.position.lerp(goal,alpha);controls.current.target.lerp(target,alpha);
    camera.lookAt(controls.current.target);
    if(camera.position.distanceTo(goal)<.003 && controls.current.target.distanceTo(target)<.003){
      camera.position.copy(goal);controls.current.target.copy(target);camera.lookAt(target);
      moving.current=false;useEngineStore.getState().set({navigation:useEngineStore.getState().cameraPreset?'preset':'manual'});
    }
  });
  return <OrbitControls ref={controls} makeDefault enableDamping={false} minDistance={4} maxDistance={24} maxPolarAngle={Math.PI} onStart={()=>{moving.current=false;useEngineStore.getState().set({cameraPreset:null,navigation:'manual'});}} />;
}

function Diagnostics(){
 const {camera,gl}=useThree();const elapsed=useRef(0),frames=useRef(0);
 useFrame((_,delta)=>{elapsed.current+=delta;frames.current++;
 if(useEngineStore.getState().debug)gl.domElement.dataset.cameraPosition=camera.position.toArray().join(',');
 // gl.info.render.calls здесь бесполезен: он сбрасывается на каждый render(),
 // а последним в кадре рисуется gizmo, поэтому счётчик показывает его вызовы.
 // Точное число вызовов деталей публикует PartScene как data-part-draws.
 if(elapsed.current>=1){gl.domElement.dataset.fps=String(Math.round(frames.current/elapsed.current));elapsed.current=0;frames.current=0;}
 });return null;
}

/** Снимок экрана внутри кадра рендера.
 *  Без preserveDrawingBuffer буфер очищается после композитинга, поэтому перед
 *  чтением пикселей кадр рендерится повторно — тогда копия буфера на каждый кадр
 *  (её цена заметна на больших сценах) не нужна. */
function ScreenshotCapture(){
 const {gl,scene,camera}=useThree();
 const lastRequest=useRef(useEngineStore.getState().screenshotRequest);
 useFrame(()=>{
  const request=useEngineStore.getState().screenshotRequest;
  if(request===lastRequest.current)return;
  lastRequest.current=request;
  gl.render(scene,camera);
  const link=document.createElement('a');
  link.download='2uz-fe-atlas.png';
  link.href=gl.domElement.toDataURL('image/png');
  link.click();
 });
 return null;
}

function Scene() {
 useLocale();
  const controller = useRef(new EngineAnimationController());
  const detail = useEngineStore(s=>s.detailLevel);
  const quality = useEngineStore(s=>s.renderQuality);
  const disassemblyStep = useEngineStore((s) => s.disassemblyStep);
  const running = useEngineStore((s) => s.running);
  const rpm = useEngineStore((s) => s.rpm);
  const slowMotion = useEngineStore((s) => s.slowMotion);
  const set = useEngineStore((s) => s.set);
  const select = useEngineStore((s) => s.select);
  const selected = useEngineStore((s) => s.selected);
  const related = useEngineStore((s) => s.related);
  const gl = useThree((state) => state.gl);
  const selectedPart = engine2uz.parts.find((p) => p.id === selected);
  const mounted = useMemo(() => engine2uz.parts.filter((p) => p.minimumDetailLevel <= detail), [detail]);
  const removedSet = useMemo(
    () => removedPartIds(mounted, disassemblyStep, engine2uz.disassembly),
    [mounted, disassemblyStep],
  );
  // Сколько деталей реально в сцене: без этого HUD и инструменты замера не могут
  // отделить стоимость геометрии от стоимости интерфейса.
  useEffect(() => {
    gl.domElement.dataset.partsRendered = String(mounted.length);
  }, [gl, mounted]);
  useFrame((_, delta) => {
    if (!running) return;
    controller.current.angle=useEngineStore.getState().crankAngle;
    set({ crankAngle: controller.current.advance(delta,rpm,slowMotion?.05:1) });
  });
  return <>
    <PerspectiveCamera makeDefault position={cameras.iso} fov={36} near={.1} far={100} />
    <color attach="background" args={['#0b0d10']} />
    <fog attach="fog" args={['#0b0d10',14,30]} />
    <ambientLight intensity={.8} />
    <directionalLight position={[6,10,8]} intensity={3.4} color="#eef4ff" />
    <directionalLight position={[-8,4,-6]} intensity={2.1} color="#8ea9d8" />
    <pointLight position={[0,5,1]} intensity={35} color="#e45a46" distance={12} />
    <mesh position={[0,-1.65,0]}><cylinderGeometry args={[2.9,3.25,.18,48]} /><meshStandardMaterial color="#1e2329" metalness={.7} roughness={.35} /></mesh>
    <group onPointerMissed={() => select(null)}>
      {mounted.map((part) => <PartMesh key={part.id} part={part} removed={removedSet.has(part.id)} />)}
      {related && selectedPart && selectedPart.relatedParts.map((id) => {
        const target = engine2uz.parts.find((p) => p.id === id);
        return target ? <Line key={id} points={[selectedPart.position,target.position]} color="#ef7b6c" lineWidth={1.2} transparent opacity={.7} dashed dashSize={.09} gapSize={.07} /> : null;
      })}
      <FlowPaths />
    </group>
    {quality==='high' && <ContactShadows key={`${detail}-${disassemblyStep}`} frames={1} resolution={256} position={[0,-2.2,0]} opacity={.45} scale={14} blur={2.8} far={7} />}
    <Stars radius={40} depth={12} count={420} factor={1.2} saturation={0} fade speed={.25} />
    <CameraRig /><Diagnostics/><ScreenshotCapture/>
    <GizmoHelper alignment="bottom-right" margin={[74,88]}><GizmoViewport axisColors={['#d05246','#6b967c','#6689ac']} labelColor="white" /></GizmoHelper>
    <AdaptiveDpr pixelated />
  </>;
}

export const EngineViewer = memo(function EngineViewer() {
 useLocale();
  const quality=useEngineStore(s=>s.renderQuality);
  const navigation=useEngineStore(s=>s.navigation);
  const preset=useEngineStore(s=>s.cameraPreset);
  return <div data-navigation={navigation} data-preset={preset??''} className="viewer" aria-label={t("Интерактивная трёхмерная модель двигателя")}>
    <Canvas dpr={quality==='high'?[1,1.75]:1} gl={{ antialias: true, powerPreference: 'high-performance' }} performance={{min:.55}}>
      <Suspense fallback={null}><Scene /></Suspense>
    </Canvas>
<div className="viewport-vignette" />
    <SceneHud />
  </div>
});
