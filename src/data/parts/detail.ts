import type { EnginePart, PartKind, Vec3 } from '../../core/types';
import { ringOffsetFromBottom } from '../engine/pistonGeometry';
export const detailLevels=[10,25,50,100,150,200,300,400,500] as const;
/** Catalog records are cheap; GPU objects only mount at the requested level. */
export function additionalParts(base:EnginePart[]):EnginePart[]{
 const out:EnginePart[]=[];
 const add=(parent:EnginePart,id:string,ru:string,en:string,kind:PartKind,level:number,position:Vec3,section:string)=>{
  out.push({...parent,id,slug:id,modelNode:id,nameRu:ru,name:en,kind,parent:parent.id,assembly:parent.id,position,pivot:position,rotationAxis:null,minimumDetailLevel:level,housing:false,scale:undefined,
   description:`${ru}. Форма и размеры реконструированы приблизительно.`,function:({mainCap:'Удерживает коренной подшипник и коленчатый вал.',hydraulicTensioner:'Поддерживает натяжение ремня через рычаг натяжного ролика.',rodCap:'Замыкает большую головку шатуна вокруг шатунной шейки.',ring:'Уплотняет поршень в цилиндре и регулирует масляную плёнку.',retainer:'Удерживает верхний конец клапанной пружины.',guide:'Направляет стержень клапана.',seat:'Обеспечивает уплотнение тарелки клапана.',shim:'Задаёт тепловой зазор клапанного механизма.'} as Partial<Record<PartKind,string>>)[kind]??en,failures:[],failureSymptoms:[],technicalNotes:['Геометрия учебная: не использовать для измерений и изготовления.'],relatedParts:[parent.id],sourceIds:['rm956u'],documentationSource:[{id:'rm956u',section}],confidence:'approximate',tags:[ru,en]});
 };
 const block=base.find(p=>p.id==='block')!;
 for(let i=0;i<5;i++)add(block,`main-cap-${i+1}`,`Крышка коренной опоры ${i+1}`,`Main bearing cap ${i+1}`,'mainCap',25,[0,-.3,2.11-i*1.055],'EM-74 / EM-99');
 add(base.find(p=>p.id==='timing-tensioner')!,'hydraulic-tensioner','Гидравлический натяжитель ГРМ','Hydraulic timing belt tensioner','hydraulicTensioner',50,[-.9,.16,2.55],'EM-12 / EM-19');
 for(const p of base.filter(p=>p.kind==='rod'))add(p,`rod-cap-${p.cylinder}`,`Крышка шатуна ${p.cylinder}`,`Connecting rod cap ${p.cylinder}`,'rodCap',100,[...p.position],'EM-74 / EM-98');
 for(const p of base.filter(p=>p.kind==='piston'))for(let i=0;i<3;i++){add(p,`ring-${p.cylinder}-${i+1}`,`${i===2?'Маслосъёмное':'Компрессионное'} кольцо ${p.cylinder}.${i+1}`,`${i===2?'Oil control':'Compression'} ring ${p.cylinder}.${i+1}`,'ring',150,[...p.position],'EM-74 / EM-101');out[out.length-1].localOffset=ringOffsetFromBottom(i);}
 for(const p of base.filter(p=>p.kind==='valve')){
  const offset=(d:number):Vec3=>[p.position[0]-Math.sin(p.rotation[2])*d,p.position[1]+Math.cos(p.rotation[2])*d,p.position[2]];
  add(p,`retainer-${p.id}`,`Тарелка пружины · ${p.nameRu}`,`Spring retainer · ${p.name}`,'retainer',200,offset(.29),'EM-32 / EM-52');
  add(p,`guide-${p.id}`,`Направляющая · ${p.nameRu}`,`Valve guide · ${p.name}`,'guide',300,offset(0),'EM-32 / EM-45');
  add(p,`seat-${p.id}`,`Седло · ${p.nameRu}`,`Valve seat · ${p.name}`,'seat',400,offset(-.32),'EM-45 / EM-46');
  add(p,`shim-${p.id}`,`Регулировочная шайба · ${p.nameRu}`,`Adjusting shim · ${p.name}`,'shim',500,offset(.43),'EM-5 / EM-32');
 }
 return out;
}
