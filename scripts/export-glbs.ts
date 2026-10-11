import { Group, Scene, Mesh, MeshStandardMaterial, Color } from 'three';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { parts as engineParts } from '../src/engines/2uz-fe/parts';
import { buildPartGeometry, releaseBuiltGeometry } from '../src/viewer/geometry/buildPart';
import { geometryCache } from '../src/viewer/geometry/cache';
import type { BuiltGeometry } from '../src/viewer/geometry/buildPart';
import type { GeometryTier } from '../src/viewer/geometry/lod';
import type { EnginePart } from '../src/core/types';

const TIERS: GeometryTier[] = [0, 1, 2, 3, 4, 5, 6, 7, 8];
const TIER_LEVELS: Record<number, string> = { 0: '10%', 1: '25%', 2: '50%', 3: '100%', 4: '150%', 5: '200%', 6: '300%', 7: '400%', 8: '500%' };

const METAL = '#a8afb7';
const COLORS: Record<string, string> = {
  cranktrain: METAL, heads: METAL, engine: METAL, valvetrain: '#a88ac3', timing: '#d89b54',
  intake: '#57a4b5', fuel: '#74a96f', ignition: '#e0b451', lubrication: '#c79249',
  cooling: '#4a91cf', exhaust: '#b96d5f', sensors: '#69a18c', accessories: '#77869c', fasteners: '#70757e',
};

/** GLTFExporter для бинарного GLB использует FileReader, которого нет в Node.
 * Минимальная замена: читаем Blob через arrayBuffer() и вызываем onloadend. */
function polyfillFileReader(): void {
  if ((globalThis as { FileReader?: unknown }).FileReader) return;
  class NodeFileReader {
    result: ArrayBuffer | null = null;
    error: unknown = null;
    onloadend: ((ev: Event) => void) | null = null;
    readAsArrayBuffer(blob: Blob): void {
      blob.arrayBuffer().then((buf) => {
        this.result = buf;
        this.onloadend?.(new Event('loadend'));
      }, (err) => {
        this.error = err;
        this.onloadend?.(new Event('loadend'));
      });
    }
  }
  Object.defineProperty(globalThis, 'FileReader', { value: NodeFileReader, configurable: true });
}

function materialFor(system: string, materials: Map<string, MeshStandardMaterial>): MeshStandardMaterial {
  let mat = materials.get(system);
  if (!mat) {
    mat = new MeshStandardMaterial({ color: new Color(COLORS[system] ?? METAL), roughness: 0.44, metalness: system === 'intake' ? 0.3 : 0.68 });
    materials.set(system, mat);
  }
  return mat;
}

function buildPartNode(p: EnginePart, tier: GeometryTier, materials: Map<string, MeshStandardMaterial>): { group: Group; built: BuiltGeometry } {
  const built = buildPartGeometry(p, tier);
  const mat = materialFor(p.system, materials);
  built.group.traverse((o) => {
    if (!(o instanceof Mesh)) return;
    if (!Object.prototype.hasOwnProperty.call(o.userData, 'debug')) o.material = mat;
  });

  const node = new Group();
  node.name = p.id;
  node.position.set(p.position[0], p.position[1], p.position[2]);
  node.rotation.set(p.rotation[0], p.rotation[1], p.rotation[2]);
  const s = p.scale ?? [1, 1, 1];
  node.scale.set(s[0], s[1], s[2]);
  node.userData.partId = p.id;
  node.add(built.group);
  return { group: node, built };
}

async function exportScene(scene: Scene): Promise<ArrayBuffer> {
  const { GLTFExporter } = await import('three/examples/jsm/exporters/GLTFExporter.js');
  polyfillFileReader();
  const exporter = new GLTFExporter();
  return (await exporter.parseAsync(scene, { binary: true, onlyVisible: true })) as ArrayBuffer;
}

/** Сжимаем буфер GLB: gltfpack-эквивалент (reorder + quantize + EXT_meshopt_compression).
 * Декодер регистрируется только для чтения/повторной валидации. */
async function compressGlb(buf: ArrayBuffer): Promise<Uint8Array> {
  const { NodeIO } = await import('@gltf-transform/core');
  const { EXTMeshoptCompression, KHRMeshQuantization } = await import('@gltf-transform/extensions');
  const { meshopt } = await import('@gltf-transform/functions');
  const { MeshoptEncoder, MeshoptDecoder } = await import('meshoptimizer');
  await Promise.all([MeshoptEncoder.ready, MeshoptDecoder.ready]);

  const io = new NodeIO()
    .registerExtensions([EXTMeshoptCompression, KHRMeshQuantization])
    .registerDependencies({ 'meshopt.decoder': MeshoptDecoder, 'meshopt.encoder': MeshoptEncoder });
  const doc = await io.readBinary(new Uint8Array(buf));
  await doc.transform(meshopt({ encoder: MeshoptEncoder, level: 'high' }));
  return io.writeBinary(doc);
}

async function exportTier(tier: GeometryTier, outDir: string, noCompress: boolean): Promise<number> {
  const scene = new Scene();
  const materials = new Map<string, MeshStandardMaterial>();
  const builtAll: BuiltGeometry[] = [];

  for (const p of engineParts) {
    if (p.kind === 'ring') continue;
    const { group, built } = buildPartNode(p, tier, materials);
    builtAll.push(built);
    scene.add(group);
  }

  const raw = await exportScene(scene);
  const out = noCompress ? new Uint8Array(raw) : await compressGlb(raw);
  const file = join(outDir, `engine.t${tier}.glb`);
  writeFileSync(file, out);
  console.log(`tier ${tier}: ${raw.byteLength.toLocaleString('ru')} B -> ${out.byteLength.toLocaleString('ru')} B (${file})`);

  for (const built of builtAll) releaseBuiltGeometry(built);
  for (const m of materials.values()) m.dispose();
  geometryCache.flush();
  return out.byteLength;
}

async function exportSplit(tier: GeometryTier, outDir: string, noCompress: boolean): Promise<{ part: string; file: string; bytes: number }[]> {
  const dir = join(outDir, 'split', `t${tier}`);
  mkdirSync(dir, { recursive: true });
  const materials = new Map<string, MeshStandardMaterial>();
  const entries: { part: string; file: string; bytes: number }[] = [];

  for (const p of engineParts) {
    if (p.kind === 'ring') continue;
    const { group, built } = buildPartNode(p, tier, materials);
    const scene = new Scene();
    scene.add(group);

    const raw = await exportScene(scene);
    const out = noCompress ? new Uint8Array(raw) : await compressGlb(raw);
    const file = `${p.id}.glb`;
    writeFileSync(join(dir, file), out);
    entries.push({ part: p.id, file: join(`split`, `t${tier}`, file), bytes: out.byteLength });

    releaseBuiltGeometry(built);
    geometryCache.flush();
  }
  materials.forEach((m) => m.dispose());
  return entries;
}

interface Manifest {
  engine: string;
  tierLevels: Record<string, string>;
  combined: Record<string, { file: string; bytes: number }>;
  split: Record<string, { part: string; file: string; bytes: number }[]>;
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const filter = args.includes('--tier') ? Number(args[args.indexOf('--tier') + 1]) : undefined;
  const split = args.includes('--split');
  const noCompress = args.includes('--no-compress');
  const outDir = join(process.cwd(), 'public', 'glb');
  mkdirSync(outDir, { recursive: true });
  if (split) rmSync(join(outDir, 'split'), { recursive: true, force: true });

  const manifest: Manifest = { engine: '2uz-fe', tierLevels: TIER_LEVELS, combined: {}, split: {} };

  for (const tier of TIERS) {
    if (filter !== undefined && tier !== filter) continue;
    manifest.combined[String(tier)] = { file: `engine.t${tier}.glb`, bytes: await exportTier(tier, outDir, noCompress) };
    if (split) manifest.split[String(tier)] = await exportSplit(tier, outDir, noCompress);
  }

  writeFileSync(join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
  console.log(`manifest: ${join(outDir, 'manifest.json')}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});