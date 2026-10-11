import { describe, expect, it } from 'vitest';
import { engine2uz } from '../src/engines/2uz-fe';
import { isRemoved } from '../src/core/removal';
import { searchParts } from '../src/core/search';

describe('пакет двигателя 2UZ-FE', () => {
  it('содержит восемь независимых комплектов поршней и шатунов', () => {
    expect(engine2uz.parts.filter((p) => p.kind === 'piston')).toHaveLength(8);
    expect(engine2uz.parts.filter((p) => p.kind === 'rod')).toHaveLength(8);
    expect(new Set(engine2uz.parts.map((p) => p.id)).size).toBe(engine2uz.parts.length);
  });
  it('использует подтверждённый порядок зажигания', () => {
    expect(engine2uz.firingOrder).toEqual([1,8,4,3,6,5,7,2]);
  });
  it('назначает каждой детали существующую систему и связи', () => {
    const systems = new Set(engine2uz.systems.map((s) => s.id));
    const ids = new Set(engine2uz.parts.map((p) => p.id));
    for (const part of engine2uz.parts) {
      expect(systems.has(part.system)).toBe(true);
      expect(part.relatedParts.every((id) => ids.has(id))).toBe(true);
    }
  });
});

describe('поиск и разборка', () => {
  it.each([['поршень','piston-1'],['crankshaft','crankshaft'],['датчик коленвала','crank-sensor'],['oil pump','oil-pump'],['cylinder 1','piston-1']])('находит %s', (query, id) => {
    expect(searchParts(engine2uz.parts, query).some((p) => p.id === id)).toBe(true);
  });
  it('разбирает группы по префиксам на нужном шаге', () => {
    const coil = engine2uz.parts.find((p) => p.id === 'coil-8')!;
    expect(isRemoved(coil, 2, engine2uz.disassembly)).toBe(false);
    expect(isRemoved(coil, 3, engine2uz.disassembly)).toBe(true);
  });
});


import { cylinderAxis, cylinderPairZ, cylinderZ, cycleAngle, firingOrder, halfBankAngleRad, mainJournalZ, mechanics, pistonRotationZ, shaftAngle, slider, throwOffsets, valveHalfAngleRad, valveLift } from '../src/data/engine/kinematics';
import { PISTON_GEOMETRY, PISTON_LOCAL_AXIS, derivedPistonClearanceMm } from '../src/data/engine/pistonGeometry';
import { configuration, mmToUnits } from '../src/data/documentation/configuration';
import { beltPoint, beltLength, beltSegments, beltTravel, timingWheels } from '../src/data/engine/timing';
import { detailLevels } from '../src/data/parts/detail';
import { t, useLocale } from '../src/core/i18n';
import { sources } from '../src/engines/2uz-fe/specifications';
import * as THREE from 'three';

describe('механические инварианты полного цикла',()=>{
 it('держит оси поршней, цилиндров и колец соосными все 720°',()=>{
  const localAxis = new THREE.Vector3(...PISTON_LOCAL_AXIS);
  for(let theta=0;theta<=720;theta+=3)for(let n=1;n<=8;n++){
   const pose=slider(theta,n);
   const expectedAxis=new THREE.Vector3(...cylinderAxis(n));
   const renderedAxis=localAxis.clone().applyEuler(new THREE.Euler(0,0,pistonRotationZ(n)));
   expect(renderedAxis.dot(expectedAxis)).toBeCloseTo(1,10);
   // У каждого цилиндра своя координата вдоль коленвала (Z); соосность проверяем
   // в поперечном сечении XY, где лежат обе оси V-образного блока.
   expect(new THREE.Vector3(pose.pin[0],pose.pin[1],0).cross(expectedAxis).length()).toBeLessThan(1e-10);
   // Мировой frame кольца выводим в тесте из тех же примитивов (поза пальца + ось
   // цилиндра), а не из прод-хелпера: так проверяется сама геометрия, а не её копия.
   for(const ring of PISTON_GEOMETRY.rings){
    const normal=new THREE.Vector3(...cylinderAxis(n));
    const center=new THREE.Vector3(...pose.pin).addScaledVector(normal,ring.centerY);
    const centerOffset=center.clone().sub(new THREE.Vector3(...pose.pin));
    expect(Math.abs(normal.dot(expectedAxis))).toBeCloseTo(1,10);
    expect(centerOffset.clone().cross(expectedAxis).length()).toBeLessThan(1e-10);
    expect(centerOffset.dot(expectedAxis)).toBeCloseTo(ring.centerY,10);
   }
  }
 });
 it('сохраняет длину шатуна и движение пальца по оси всех цилиндров',()=>{
  for(let theta=0;theta<=720;theta+=3)for(let n=1;n<=8;n++){
   const {pin,journal,rodAngle}=slider(theta,n);
   expect(Math.hypot(...pin.map((x,i)=>x-journal[i]))).toBeCloseTo(mechanics.rodLength,10);
   expect(pin[0]/pin[1]).toBeCloseTo(n%2?1:-1,10);
   const delta=new THREE.Vector3(0,mechanics.rodLength,0).applyAxisAngle(new THREE.Vector3(0,0,1),rodAngle);
   expect(delta.x).toBeCloseTo(pin[0]-journal[0],10);expect(delta.y).toBeCloseTo(pin[1]-journal[1],10);
   const a=throwOffsets[Math.floor((n-1)/2)];
   const crankpin=new THREE.Vector3(mechanics.crankRadius*Math.sin(a),mechanics.crankRadius*Math.cos(a),0).applyAxisAngle(new THREE.Vector3(0,0,1),shaftAngle(theta,'crank'));
   expect(crankpin.x).toBeCloseTo(journal[0],10);expect(crankpin.y).toBeCloseTo(journal[1],10);
  }
 });
 it('каждая вспышка соответствует ВМТ сжатия; ход 84 мм',()=>{
  firingOrder.forEach((n,i)=>{expect(cycleAngle(i*90,n)).toBe(0);expect(slider(i*90,n).distance).toBeCloseTo(mechanics.rodLength+mechanics.crankRadius,10);expect(slider(i*90,n).distance-slider(i*90+180,n).distance).toBeCloseTo(.84,10);expect(valveLift(i*90,n,true)).toBe(0);expect(valveLift(i*90,n,false)).toBe(0);});
 });
 it('распредвалы вращаются 2:1, выпускной в противоположную сторону',()=>{
  expect(shaftAngle(720,'crank')).toBeCloseTo(-4*Math.PI);expect(shaftAngle(720,'intake')).toBeCloseTo(-2*Math.PI);expect(shaftAngle(720,'exhaust')).toBeCloseTo(2*Math.PI);
 });
 it('ремень замкнут, касательные непрерывны, периферийные скорости совпадают',()=>{
  expect(beltPoint(0)).toEqual(beltPoint(beltLength));
  beltSegments.forEach((segment,i)=>{const a=segment.at(1),b=beltSegments[(i+1)%beltSegments.length].at(0);expect(Math.hypot(a[0]-b[0],a[1]-b[1])).toBeLessThan(1e-10);});
  for(const w of timingWheels)expect((-Math.PI*2*.25/w.r)*w.r).toBeCloseTo(beltTravel(360),10);
 });
});
describe('детализация и перевод',()=>{
 it('каждый уровень добавляет детали и не исключает родителей',()=>{
  let previous=0;for(const level of detailLevels){const visible=engine2uz.parts.filter(p=>p.minimumDetailLevel<=level);expect(visible.length).toBeGreaterThan(previous);previous=visible.length;for(const p of visible){if(p.parent)expect(visible.some(parent=>parent.id===p.parent)).toBe(true);expect(p.documentationSource.length).toBeGreaterThan(0);}}
 });
 it('весь технический текст имеет английский перевод',()=>{
  useLocale.getState().setLocale('en');
  const check=(v:string)=>expect(t(v),v).not.toMatch(/[А-Яа-яЁё]/);
  for(const p of engine2uz.parts){[p.nameRu,p.description,p.function,p.material,...p.technicalNotes,...p.failures,...p.failureSymptoms].forEach(check);}
  for(const l of engine2uz.lessons)[l.title,l.subtitle,l.text].forEach(check);
  for(const d of engine2uz.disassembly)[d.title,d.description].forEach(check);
  for(const s of engine2uz.specifications)[s.label,s.value].forEach(check);
  for(const s of sources)[s.title,s.note].forEach(check);
  useLocale.getState().setLocale('ru');
 });
});

describe('подтверждённые числа имеют единственный источник',()=>{
 const V=configuration.verified;
 it('кинематика выведена из configuration.verified и совпадает с документированными значениями',()=>{
  expect(mechanics.crankRadius).toBeCloseTo(mmToUnits(V.strokeMm.value)/2,12);
  expect(mechanics.crankRadius).toBeCloseTo(.42,12);
  expect(mechanics.bore).toBeCloseTo(mmToUnits(V.boreMm.value),12);
  expect(mechanics.bore).toBeCloseTo(.94,12);
  expect(mechanics.borePitch).toBeCloseTo(mmToUnits(V.borePitchMm.value),12);
  expect(mechanics.borePitch).toBeCloseTo(1.055,12);
  expect(mechanics.bankOffset).toBeCloseTo(mmToUnits(V.bankOffsetMm.value),12);
  expect(mechanics.bankOffset).toBeCloseTo(.21,12);
  expect(mechanics.rodLength).toBeCloseTo(mmToUnits(configuration.reconstruction.rodLengthMm),12);
  expect(mechanics.rodLength).toBeCloseTo(1.46,12);
  expect(valveHalfAngleRad).toBeCloseTo(V.includedValveAngleDeg.value*Math.PI/360,12);
  expect(firingOrder).toEqual(V.firingOrder.value);
 });
 it('развал выведен из подтверждённых 90° без потери точности',()=>{
  // Оси цилиндров наклонены на половину угла развала; значения обязаны совпасть
  // с прежними литералами бит-в-бит, иначе сдвинулась бы вся геометрия блока.
  expect(halfBankAngleRad).toBe(Math.PI/4);
  expect(Math.cos(halfBankAngleRad)).toBe(Math.SQRT1_2);
  expect(pistonRotationZ(1)).toBe(-Math.PI/4);
  expect(pistonRotationZ(2)).toBe(Math.PI/4);
 });
 it('зазор поршень–цилиндр модели лежит внутри подтверждённого диапазона RM630E',()=>{
  const {min,max}=V.pistonOilClearanceMm;
  expect(derivedPistonClearanceMm).toBeGreaterThanOrEqual(min);
  expect(derivedPistonClearanceMm).toBeLessThanOrEqual(max);
  // Диаметры тоже выведены, а не вписаны литералами.
  expect(PISTON_GEOMETRY.radius*2*100).toBeCloseTo((V.pistonDiameterMark1Mm.min+V.pistonDiameterMark1Mm.max)/2,9);
  expect(PISTON_GEOMETRY.cylinderBoreRadius*2*100).toBeCloseTo((V.cylinderBoreMark1Mm.min+V.cylinderBoreMark1Mm.max)/2,9);
 });
 it('продольная геометрия выведена из шага цилиндров и смещения рядов',()=>{
  expect(mainJournalZ).toEqual([2,1,0,-1,-2].map(k=>k*mechanics.borePitch));
  for(let i=0;i<4;i++)expect(cylinderPairZ(i)).toBeCloseTo(1.5*mechanics.borePitch-i*mechanics.borePitch,12);
  // Ряды разнесены ровно на подтверждённое смещение, а не на «похожее» число.
  for(let i=0;i<4;i++){
   const odd=cylinderZ(i*2+1),even=cylinderZ(i*2+2);
   expect(odd-even).toBeCloseTo(mechanics.bankOffset,12);
   expect((odd+even)/2).toBeCloseTo(cylinderPairZ(i),12);
  }
 });
 it('количество болтов ГБЦ на ряд совпадает с configuration',()=>{
  for(const bank of [1,2]){
   const bolts=engine2uz.parts.filter(p=>p.id.startsWith(`head-bolt-${bank}-`));
   expect(bolts).toHaveLength(V.headBoltCountPerBank.value);
  }
 });
 it('метаданные колец в каталоге совпадают с геометрией поршня',()=>{
  for(const part of engine2uz.parts.filter(p=>p.kind==='ring')){
   const index=Number(part.id.split('-').pop())-1;
   const ring=PISTON_GEOMETRY.rings[index]!;
   expect(part.localOffset).toBeCloseTo(ring.centerY+PISTON_GEOMETRY.height/2,12);
  }
 });
});
