export type Vec3 = [number, number, number];
export type SystemId = 'cranktrain' | 'heads' | 'engine' | 'valvetrain' | 'timing' | 'intake' | 'fuel' | 'ignition' | 'lubrication' | 'cooling' | 'exhaust' | 'sensors' | 'accessories' | 'fasteners';
export type PartKind = 'ring' | 'rodCap' | 'mainCap' | 'retainer' | 'guide' | 'seat' | 'shim' | 'hydraulicTensioner' | 'block' | 'head' | 'cover' | 'plenum' | 'runner' | 'exhaust' | 'throttle' | 'piston' | 'pin' | 'rod' | 'crank' | 'bearing' | 'cam' | 'valve' | 'spring' | 'bucket' | 'pulley' | 'belt' | 'timingCover' | 'pan' | 'pump' | 'pickup' | 'filter' | 'rail' | 'injector' | 'plug' | 'coil' | 'sensor' | 'alternator' | 'starter' | 'gasket' | 'bolt' | 'pipe' | 'gear';
export interface EnginePart {
  id: string; slug: string; name: string; nameRu: string; system: SystemId; kind: PartKind;
  parent: string | null; modelNode: string; description: string; function: string; material: string;
  failures: string[]; failureSymptoms: string[]; technicalNotes: string[]; relatedParts: string[];
  tags: string[]; position: Vec3; rotation: Vec3; explodedVector: Vec3; scale?: Vec3;
  cylinder?: number; bank?: number; valveType?: 'intake' | 'exhaust'; housing?: boolean; visibility: boolean;
  localOffset?: number;
  minimumDetailLevel: number; category: string; assembly: string; pivot: Vec3; rotationAxis: Vec3 | null; confidence: 'verified'|'high'|'medium'|'approximate'; documentationSource: {id:string;section:string}[]; partNumber?: string;
  sourceIds: string[]; accuracy: 'educational';
}
export interface EngineSystem { id: SystemId; name: string; nameRu: string; color: string; description: string }
export interface DisassemblyStep { title: string; description: string; parts: string[]; sourceIds: string[] }
export type ViewMode = 'normal' | 'transparent' | 'xray' | 'cutaway';
export type FlowMode = 'none' | 'oil' | 'coolant' | 'air' | 'fuel';
export type CameraPreset = 'iso' | 'front' | 'back' | 'left' | 'right' | 'top' | 'bottom' | 'bank1' | 'bank2';
export type Workspace = 'explore' | 'disassembly' | 'learn' | 'quiz';
export interface Lesson { id: string; title: string; subtitle: string; text: string; part: string; systems: SystemId[]; running?: boolean; flow?: FlowMode; related?: boolean }
export interface EnginePackage {
  id: string; name: string; variant: string; modelYear: string; market: string; vvti: boolean;
  parts: EnginePart[]; systems: EngineSystem[]; disassembly: DisassemblyStep[]; lessons: Lesson[];
  firingOrder: readonly number[]; boreMm: number; strokeMm: number;
  specifications: {label: string; value: string; sourceId: string}[];
  model: {type: 'procedural'; license: string; units: string; note: string};
}
