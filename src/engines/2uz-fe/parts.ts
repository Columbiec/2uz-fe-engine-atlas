import { additionalParts } from '../../data/parts/detail';
import { bankPoint, cylinderZ, mainJournalZ, mechanics, pistonRotationZ, slider, valveHalfAngleRad } from '../../data/engine/kinematics';
import { configuration } from '../../data/documentation/configuration';
import type { EnginePart, PartKind, SystemId, Vec3 } from '../../core/types';
import { systems } from './systems';
const content: Partial<Record<PartKind, [string,string,string,string[],string[]]>> = {
 block:['Несущая чугунная отливка с двумя рядами цилиндров под углом 90°.','Направляет поршни и удерживает опоры коленвала. Рубашка охлаждения отводит тепло от цилиндров.','Чугун',['Износ цилиндров','Повреждение плоскостей'],['Снижение компрессии','Расход масла']],
 head:['Алюминиевая головка с четырьмя клапанами на цилиндр.','Образует камеру сгорания, направляет газообмен и поддерживает два распредвала.','Алюминиевый сплав',['Деформация плоскости','Износ направляющих'],['Потеря герметичности','Нестабильная работа']],
 piston:['Поршень передаёт давление газов на шатун. Три кольцевые канавки показаны в геометрии.','Скользит вдоль оси цилиндра; за два оборота коленвала проходит четыре такта.','Алюминиевый сплав',['Износ юбки и колец','Повреждение днища'],['Расход масла','Снижение компрессии']],
 rod:['Шатун связывает поршневой палец с шатунной шейкой коленвала.','Вместе с коленвалом преобразует возвратно-поступательное движение во вращение.','Сталь',['Износ вкладышей','Деформация'],['Стук под нагрузкой','Падение давления масла']],
 crank:['Коленчатый вал V8 с четырьмя шатунными шейками и пятью коренными опорами.','Принимает усилие шатунов. Крестообразное расположение четырёх шатунных шеек; противовесы уравновешивают механизм.','Сталь',['Износ шеек','Повреждение подшипников'],['Стук нижней части двигателя','Падение давления масла']],
 cam:['Один из четырёх верхних распределительных валов.','Кулачки действуют через толкатели на клапаны. Вал делает один оборот за два оборота коленчатого вала.','Чугун / сталь, условный материал визуализации',['Износ кулачков и опор'],['Шум клапанного механизма','Снижение наполнения']],
 valve:['Тарельчатый клапан с направляющим стержнем.','Открывает канал при подъёме кулачка и закрывается усилием пружины. Профили в атласе идеализированы.','Жаростойкая сталь',['Негерметичность седла','Износ стержня'],['Пропуски воспламенения','Потеря компрессии']],
 spring:['Винтовая пружина клапана.','Возвращает клапан на седло и поддерживает контакт привода с кулачком.','Пружинная сталь',['Потеря упругости','Поломка'],['Нарушение газообмена','Шум']],
 belt:['Зубчатый ремень привода газораспределительного механизма.','Синхронизирует коленвал с впускными распредвалами. Выпускные валы приводятся межвальными шестернями.','Армированный эластомер',['Износ зубьев','Трещины'],['Нарушение фаз','Остановка двигателя']],
 injector:['Форсунка распределённого впрыска.','Дозирует топливо во впускной канал перед клапанами; это не непосредственный впрыск в цилиндр.','Сталь и полимер',['Загрязнение распылителя','Нарушение герметичности'],['Неравномерный холостой ход','Отклонение состава смеси']],
 plug:['Свеча расположена в центре камеры сгорания.','Искровой разряд инициирует горение сжатой смеси в конце такта сжатия.','Сталь и керамика',['Износ электродов','Загрязнение изолятора'],['Пропуски воспламенения','Затруднённый запуск']],
 coil:['Индивидуальная катушка зажигания над свечой.','Создаёт высокое напряжение для искрового разряда по команде ЭБУ.','Полимер, медь и сталь',['Пробой изоляции','Неисправность электроники'],['Пропуски воспламенения']],
 pan:['Резервуар масла в нижней части двигателя.','Собирает масло, стекающее после смазки механизмов, и подводит его к маслоприёмнику.','Сталь / алюминиевый сплав',['Повреждение корпуса','Нарушение уплотнения'],['Течь масла']],
 rail:['Топливная рампа одного ряда цилиндров.','Распределяет топливо между четырьмя форсунками.','Металл',['Негерметичность соединений'],['Запах топлива','Отклонение давления']],
 sensor:['Датчик системы управления двигателем. Положение в модели схематично.','Преобразует физическую величину в сигнал для электронного блока управления.','Металл и полимер',['Нарушение сигнала','Плохой контакт'],['Код неисправности','Нестабильная работа']],
};
const result: EnginePart[]=[];
function add(id:string,nameRu:string,name:string,system:SystemId,kind:PartKind,position:Vec3,explodedVector:Vec3,extra:Partial<EnginePart>={}) {
 const c=content[kind]; const sys=systems.find(s=>s.id===system)!;
 result.push({id,slug:id,name,nameRu,system,kind,parent:'block',modelNode:id,description:c?.[0]??`${nameRu} — элемент системы «${sys.nameRu}».`,function:c?.[1]??sys.description,material:c?.[2]??'Материал в визуализации условный',failures:c?.[3]??['Износ или нарушение герметичности'],failureSymptoms:c?.[4]??['Требуется проверка соответствующей системы'],technicalNotes:['Геометрия учебная: не использовать для измерений и изготовления.','Диагностические признаки общие, не заменяют проверку по ремонтной документации.'],relatedParts:[],tags:[nameRu,name,sys.name,sys.nameRu],position,rotation:[0,0,0],explodedVector,visibility:true,accuracy:'educational',sourceIds:['toyota-proper'],minimumDetailLevel:10, category:system,assembly:extra.parent??'block',pivot:position,rotationAxis:['crank','cam','pulley','gear'].includes(kind)?[0,0,1]:null,confidence:'approximate',documentationSource:[{id:'toyota-proper',section:'Engine proper'}],...extra});
}
export function cylinderPosition(n:number):{side:number;z:number;rotation:Vec3} {const side=n%2?1:-1;return {side,z:cylinderZ(n),rotation:[0,0,pistonRotationZ(n)]};}
add('block','Блок цилиндров','Cylinder block','engine','block',[0,0,0],[0,0,0],{parent:null,housing:true,relatedParts:['crankshaft','head-1','head-2','oil-pump','water-pump']});
add('crankshaft','Коленчатый вал','Crankshaft','engine','crank',[0,0,0],[0,-2.6,0],{tags:['коленвал','crankshaft'],relatedParts:['rod-1','main-bearing-1','crank-pulley','oil-pump']});
for(let i=0;i<mainJournalZ.length;i++)add(`main-bearing-${i+1}`,`Коренной подшипник ${i+1}`,`Main bearing ${i+1}`,'engine','bearing',[0,0,mainJournalZ[i]!],[0,-1.5,0],{relatedParts:['crankshaft','oil-pump']});
for(let bank=1;bank<=2;bank++){
 const side=bank===1?1:-1;const rot:Vec3=[0,0,-side*Math.PI/4];
 add(`head-${bank}`,`Головка блока · ряд ${bank}`,`Cylinder head · bank ${bank}`,'engine','head',bankPoint(side,2.67,0),[side*2.2,1.7,0],{bank,rotation:rot,housing:true,relatedParts:[`cam-intake-${bank}`,`cam-exhaust-${bank}`,`gasket-${bank}`]});
 add(`valve-cover-${bank}`,`Клапанная крышка · ряд ${bank}`,`Cylinder head cover · bank ${bank}`,'valvetrain','cover',bankPoint(side,3.27,0),[side*2.9,2.8,0],{bank,rotation:rot,housing:true,relatedParts:[`head-${bank}`]});
 add(`gasket-${bank}`,`Прокладка ГБЦ · ряд ${bank}`,`Head gasket · bank ${bank}`,'fasteners','gasket',bankPoint(side,2.34,0),[side*2,1.3,0],{bank,rotation:rot,relatedParts:[`head-${bank}`,'block']});
 for(const type of ['intake','exhaust'] as const){
  const inner=type==='intake'?-side*.33:side*.33;
  add(`cam-${type}-${bank}`,`${type==='intake'?'Впускной':'Выпускной'} распредвал · ряд ${bank}`,`${type} camshaft · bank ${bank}`,'valvetrain','cam',bankPoint(side,2.46,0,inner),[side*(type==='intake'?2.4:3.1),2.3,0],{bank,rotation:[0,0,0],valveType:type,relatedParts:['timing-belt',`gear-${type}-${bank}`,`${type}-valve-${bank}-1`]});
  add(`gear-${type}-${bank}`,`Шестерня распредвала · ${type} ${bank}`,`Cam gear ${type} ${bank}`,'timing','gear',bankPoint(side,2.46,2.13,inner),[side*2.6,1.8,-1],{bank,relatedParts:[`cam-${type}-${bank}`]});
 }
 add(`cam-pulley-${bank}`,`Шкив ГРМ · ряд ${bank}`,`Intake cam pulley · bank ${bank}`,'timing','pulley',bankPoint(side,2.46,2.55,-side*.33),[side*1.2,1.1,2.8],{bank,scale:[1,1,1],relatedParts:['timing-belt',`cam-intake-${bank}`]});
 add(`timing-cover-${bank}`,`Кожух ГРМ · ряд ${bank}`,`Timing cover · bank ${bank}`,'timing','timingCover',[side*1.48,1.65,2.8],[side*.6,0,4],{bank,housing:true,relatedParts:['timing-belt',`cam-pulley-${bank}`]});
 add(`fuel-rail-${bank}`,`Топливная рампа · ряд ${bank}`,`Fuel rail · bank ${bank}`,'fuel','rail',[side*.92,2.08,0],[side*1.4,2.8,0],{bank,relatedParts:[`injector-${bank}`]});
 add(`exhaust-manifold-${bank}`,`Выпускной коллектор · ряд ${bank}`,`Exhaust manifold · bank ${bank}`,'exhaust','exhaust',[side*1.85,1.0,0],[side*3.3,0,0],{bank,relatedParts:[`exhaust-valve-${bank}-1`]});
}
for(let n=1;n<=8;n++){
 const {side,z,rotation}=cylinderPosition(n);const bank=side===1?1:2;
 const meta={cylinder:n,bank,rotation,tags:[`cylinder ${n}`,`цилиндр ${n}`,`bank ${bank}`]};
 add(`piston-${n}`,`Поршень №${n}`,`Piston #${n}`,'engine','piston',bankPoint(side,1.6,z),[side*1.8,3.5,(z>0?1:-1)*.4],{...meta,relatedParts:[`pin-${n}`,`rod-${n}`,'crankshaft',`intake-valve-${n}-1`,`plug-${n}`]});
 add(`pin-${n}`,`Поршневой палец №${n}`,`Piston pin #${n}`,'engine','pin',bankPoint(side,1.46,z),[side*2.3,3.1,0],{...meta,relatedParts:[`piston-${n}`,`rod-${n}`]});
 add(`rod-${n}`,`Шатун №${n}`,`Connecting rod #${n}`,'engine','rod',[0,0,z],[side*2,1.9,0],{...meta,relatedParts:[`piston-${n}`,`pin-${n}`,'crankshaft']});
 add(`runner-${n}`,`Впускной канал №${n}`,`Intake runner #${n}`,'intake','runner',[0,0,z],[side*.8,3.4,0],{...meta,rotation:[0,0,0],relatedParts:['intake-manifold',`injector-${n}`,`intake-valve-${n}-1`]});
 add(`injector-${n}`,`Форсунка №${n}`,`Fuel injector #${n}`,'fuel','injector',bankPoint(side,2.12,z,-side*.44),[side*1.4,3.4,0],{...meta,relatedParts:[`fuel-rail-${bank}`,`runner-${n}`]});
 add(`plug-${n}`,`Свеча зажигания №${n}`,`Spark plug #${n}`,'ignition','plug',bankPoint(side,2.85,z),[side*2.8,3.7,0],{...meta,relatedParts:[`coil-${n}`,`piston-${n}`]});
 add(`coil-${n}`,`Катушка зажигания №${n}`,`Ignition coil #${n}`,'ignition','coil',bankPoint(side,3.52,z),[side*3,4,0],{...meta,relatedParts:[`plug-${n}`]});
 for(const type of ['intake','exhaust'] as const)for(let v=1;v<=2;v++){
  const x=(type==='intake'?-side:side)*.27;const pos=bankPoint(side,2.65,z+(v===1?-.19:.19),x);
  add(`${type}-valve-${n}-${v}`,`${type==='intake'?'Впускной':'Выпускной'} клапан ${n}.${v}`,`${type} valve ${n}.${v}`,'valvetrain','valve',pos,[side*(type==='intake'?2.6:3.4),2.8,0],{...meta,valveType:type,relatedParts:[`spring-${type}-${n}-${v}`,`cam-${type}-${bank}`,`piston-${n}`]});
  add(`spring-${type}-${n}-${v}`,`Пружина клапана ${type} ${n}.${v}`,`Valve spring ${type} ${n}.${v}`,'valvetrain','spring',bankPoint(side,2.25,z+(v===1?-.19:.19),x),[side*(type==='intake'?2.6:3.4),3.25,0],{...meta,valveType:type,relatedParts:[`${type}-valve-${n}-${v}`]});
  add(`bucket-${type}-${n}-${v}`,`Толкатель ${type} ${n}.${v}`,`Valve bucket ${type} ${n}.${v}`,'valvetrain','bucket',bankPoint(side,2.39,z+(v===1?-.19:.19),x),[side*(type==='intake'?2.6:3.4),3.55,0],{...meta,valveType:type,relatedParts:[`cam-${type}-${bank}`,`${type}-valve-${n}-${v}`]});
 }
}
add('intake-manifold','Впускной коллектор','Intake manifold','intake','plenum',[0,2.68,0],[0,4.8,0],{housing:true,relatedParts:['throttle-body',...Array.from({length:8},(_,i)=>`runner-${i+1}`)]});
add('engine-cover','Декоративная крышка','V-bank engine cover','intake','cover',[0,3.11,-.2],[0,6,0],{housing:true,scale:[.95,.65,.75],relatedParts:['intake-manifold']});
add('throttle-body','Дроссельный узел','Throttle body','intake','throttle',[0,2.63,2.3],[0,3.8,2.7],{relatedParts:['intake-manifold','throttle-sensor'],function:'Регулирует поступление воздуха во впускной коллектор. Форма привода зависит от версии.'});
add('timing-belt','Ремень ГРМ','Timing belt','timing','belt',[0,0,2.55],[0,0,3.5],{relatedParts:['crank-pulley','cam-pulley-1','cam-pulley-2','timing-tensioner']});
add('crank-pulley','Шкив коленвала','Crankshaft pulley','timing','pulley',[0,0,2.95],[0,0,4],{relatedParts:['crankshaft','timing-belt','accessory-belt']});
add('timing-tensioner','Натяжитель ремня ГРМ','Timing tensioner','timing','pulley',[-.68,.62,2.55],[-1,-.3,3.5],{scale:[.36,.36,.5],relatedParts:['timing-belt']});
add('timing-idler','Обводной ролик ГРМ','Timing idler','timing','pulley',[.68,.62,2.55],[1,-.3,3.5],{scale:[.36,.36,.5],relatedParts:['timing-belt']});
add('oil-pan','Масляный поддон','Oil pan','lubrication','pan',[0,-.85,0],[0,-4,0],{housing:true,relatedParts:['oil-pickup','oil-pump']});
add('oil-pickup','Маслоприёмник','Oil pickup','lubrication','pickup',[0,-.7,.6],[0,-3,.5],{relatedParts:['oil-pan','oil-pump'],function:'Забирает масло из поддона через сетку и направляет его к насосу.'});
add('oil-pump','Масляный насос','Oil pump','lubrication','pump',[0,0,2.21],[0,-1.4,3.1],{relatedParts:['oil-pickup','crankshaft','oil-filter'],function:'Приводимый коленвалом насос создаёт поток масла в системе смазки. Внутренний профиль роторов схематичен.'});
add('oil-filter','Масляный фильтр','Oil filter','lubrication','filter',[1.35,-.35,1.8],[2,-1,1.5],{relatedParts:['oil-pump','crankshaft'],function:'Задерживает частицы загрязнения в циркулирующем масле.'});
add('water-pump','Водяной насос','Water pump','cooling','pump',[0,1.2,2.3],[0,1,3],{relatedParts:['thermostat','block'],function:'Обеспечивает циркуляцию охлаждающей жидкости через блок и головки.'});
add('thermostat','Корпус термостата','Thermostat housing','cooling','throttle',[0,.8,2.85],[0,.8,4.3],{scale:[.65,.65,.65],relatedParts:['water-pump','coolant-pipe'],function:'Термостат регулирует циркуляцию через радиатор по температуре охлаждающей жидкости.'});
add('coolant-pipe','Перепускная трубка охлаждения','Coolant bypass pipe','cooling','pipe',[0,1.2,0],[0,2.2,-1],{relatedParts:['water-pump','head-1','head-2']});
add('alternator','Генератор','Alternator','accessories','alternator',[-2.1,-.12,2.1],[-3,-.3,1],{relatedParts:['accessory-belt'],function:'Преобразует механическую энергию ременного привода в электрическую.'});
add('starter','Стартер','Starter motor','accessories','starter',[0,1.2,-.75],[0,3.5,-2],{relatedParts:['crankshaft','intake-manifold'],function:'Прокручивает двигатель при запуске. У 2UZ-FE находится в развале блока под впуском; форма крепления схематична.'});
add('accessory-belt','Ремень навесного оборудования','Accessory belt','accessories','belt',[0,-.1,3.15],[0,-.5,4.8],{scale:[1,.65,1],relatedParts:['alternator','crank-pulley'],technicalNotes:['Маршрут сокращён: кондиционер и гидроусилитель не включены в эту модель.']});
add('crank-sensor','Датчик положения коленвала','Crankshaft position sensor','sensors','sensor',[.68,-.25,2.32],[1,-.5,3],{tags:['датчик коленвала','ckp','crank sensor'],relatedParts:['crankshaft','crank-pulley'],function:'Передаёт ЭБУ сигнал об угловом положении и частоте вращения коленвала.'});
add('cam-sensor','Датчик положения распредвала','Camshaft position sensor','sensors','sensor',[1.88,1.7,2.32],[2,.4,3],{relatedParts:['cam-intake-1'],function:'Помогает ЭБУ определить фазу рабочего цикла.'});
for(let n=1;n<=2;n++)add(`knock-sensor-${n}`,`Датчик детонации ${n}`,`Knock sensor ${n}`,'sensors','sensor',[0,1.05,n===1?.8:-.8],[0,2.5,n===1?1:-1],{relatedParts:['block'],function:'Регистрирует вибрации блока для коррекции угла зажигания. Положение показано условно в развале блока.'});
add('coolant-sensor','Датчик температуры ОЖ','Coolant temperature sensor','sensors','sensor',[.4,1.05,2.1],[1,1,3],{relatedParts:['water-pump','thermostat']});
add('throttle-sensor','Датчик положения дросселя','Throttle position sensor','sensors','sensor',[.52,2.65,2.3],[1,4,2],{relatedParts:['throttle-body']});
for(let bank=1;bank<=2;bank++)for(let i=0;i<configuration.verified.headBoltCountPerBank.value;i++){
 const side=bank===1?1:-1;
 add(`head-bolt-${bank}-${i+1}`,`Болт ГБЦ ${bank}.${i+1}`,`Head bolt ${bank}.${i+1}`,'fasteners','bolt',bankPoint(side,2.2,mainJournalZ[0]!-Math.floor(i/2)*mechanics.borePitch,(i%2?1:-1)*.55),[side*3.5,4.2,0],{bank,rotation:[0,0,-side*Math.PI/4],relatedParts:[`head-${bank}`],documentationSource:[{id:'rm956u',section:'EM-57'}],technicalNotes:[`${configuration.verified.headBoltCountPerBank.value} основных болтов на ГБЦ подтверждены RM956U EM-57. Размеры и положение реконструированы приблизительно.`]});
}
for(const p of result){
 p.nameRu=p.nameRu.replaceAll('intake','впуск').replaceAll('exhaust','выпуск');
 if(p.cylinder && ['pin','rod','piston'].includes(p.kind))p.parent=p.kind==='piston'?'block':`piston-${p.cylinder}`;
 else if(p.bank && p.kind!=='head')p.parent=`head-${p.bank}`;
 p.assembly=p.parent??'engine';
 if(p.kind==='valve'||p.kind==='bucket'||p.kind==='spring'){
   const side=p.bank===1?1:-1;
   p.rotation[2]=-side*Math.PI/4+(p.valveType==='intake'?side:-side)*valveHalfAngleRad;
 }
 if(p.id==='timing-tensioner')p.nameRu='Натяжной ролик ГРМ';
}
add('crank-sprocket','Зубчатый шкив коленвала','Crankshaft timing sprocket','timing','pulley',[0,0,2.55],[0,0,3.5],{scale:[.5,.5,1],relatedParts:['crankshaft','timing-belt']});
add('water-pump-pulley','Шкив водяного насоса','Water pump pulley','cooling','pulley',[0,1.2,2.55],[0,1,3],{scale:[.76,.76,1],parent:'water-pump',relatedParts:['water-pump','timing-belt']});
export const parts=[...result,...additionalParts(result)];
for(const p of parts){
 if(p.system==='engine'&&['crank','bearing','piston','pin','rod','rodCap','ring','mainCap'].includes(p.kind))p.system='cranktrain';
 if(p.kind==='head')p.system='heads';
 p.category=p.system;
 if(['timing','valvetrain'].includes(p.system))p.documentationSource=[{id:'rm956u',section:p.system==='timing'?'EM-11–26':'EM-4–8 / EM-32–64'}];
 if(p.kind==='bucket'||p.kind==='spring'){
  const valve=result.find(v=>v.kind==='valve'&&v.cylinder===p.cylinder&&v.valveType===p.valveType&&Math.abs(v.position[2]-p.position[2])<.01)!;
  const d=p.kind==='bucket'?.4:.18;
  p.position=[valve.position[0]-Math.sin(p.rotation[2])*d,valve.position[1]+Math.cos(p.rotation[2])*d,p.position[2]];
 }
 if(p.cylinder&&['piston','pin','rod','rodCap','ring'].includes(p.kind)){
   const pose=slider(0,p.cylinder),side=p.cylinder%2?1:-1;
   if(p.kind==='rod')p.position=pose.pin.map((n,i)=>(n+pose.journal[i])/2) as Vec3;
   else if(p.kind==='rodCap')p.position=[...pose.journal];
   else {const d=p.kind==='ring'?p.localOffset??0:0;p.position=[pose.pin[0]+side*d*Math.SQRT1_2,pose.pin[1]+d*Math.SQRT1_2,pose.pin[2]];}
 }
 p.pivot=[...p.position];
}

// Align each cam axis to the closed follower contact, with a 10.5 mm base circle.
for(const p of parts.filter(p=>p.kind==='cam')){
 const valve=parts.find(v=>v.kind==='valve'&&v.bank===p.bank&&v.valveType===p.valveType)!;
 p.position=[valve.position[0]-Math.sin(valve.rotation[2])*.55,valve.position[1]+Math.cos(valve.rotation[2])*.55,0];
 const gear=parts.find(g=>g.id===`gear-${p.valveType}-${p.bank}`)!;
 gear.position=[p.position[0],p.position[1],2.13];gear.scale=[1.13,1.13,1];gear.pivot=[...gear.position];
 if(p.valveType==='intake'){const pulley=parts.find(g=>g.id===`cam-pulley-${p.bank}`)!;pulley.position=[p.position[0],p.position[1],2.55];pulley.pivot=[...pulley.position];}
 p.pivot=[...p.position];
}
export const partById=Object.fromEntries(parts.map(p=>[p.id,p]));
