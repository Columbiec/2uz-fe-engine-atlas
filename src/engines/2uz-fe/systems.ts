import type { EngineSystem } from '../../core/types';
export const systems: EngineSystem[] = [
 {id:'cranktrain',name:'Cranktrain',nameRu:'Кривошипный механизм',color:'#b2b9c2',description:'Коленчатый вал, поршни, шатуны и опоры.'},
 {id:'heads',name:'Cylinder heads',nameRu:'Головки блока',color:'#b2b9c2',description:'Головки блока цилиндров.'},
 {id:'engine',name:'Engine internals',nameRu:'Блок и механизмы',color:'#b2b9c2',description:'Несущая конструкция и кривошипно-шатунный механизм.'},
 {id:'valvetrain',name:'Valvetrain',nameRu:'Клапанный механизм',color:'#bca4d9',description:'Четыре распредвала, 32 клапана и их привод.'},
 {id:'timing',name:'Timing system',nameRu:'Привод ГРМ',color:'#dcab70',description:'Синхронизация коленчатого и распределительных валов.'},
 {id:'intake',name:'Intake',nameRu:'Впуск',color:'#76bbc9',description:'Подача воздуха в цилиндры.'},
 {id:'fuel',name:'Fuel system',nameRu:'Топливная система',color:'#92ba85',description:'Распределённый впрыск бензина во впускные каналы.'},
 {id:'ignition',name:'Ignition',nameRu:'Зажигание',color:'#dfbd69',description:'Индивидуальные катушки и свечи.'},
 {id:'lubrication',name:'Lubrication',nameRu:'Система смазки',color:'#d5a85d',description:'Подача масла к трущимся поверхностям.'},
 {id:'cooling',name:'Cooling',nameRu:'Охлаждение',color:'#6eaadd',description:'Отвод тепла от блока и головок.'},
 {id:'exhaust',name:'Exhaust',nameRu:'Выпуск',color:'#cd8577',description:'Отвод отработавших газов.'},
 {id:'sensors',name:'Sensors',nameRu:'Датчики',color:'#8ebbad',description:'Обратная связь для управления двигателем.'},
 {id:'accessories',name:'Accessories',nameRu:'Навесное оборудование',color:'#95a0b4',description:'Генератор, стартер и привод агрегатов.'},
 {id:'fasteners',name:'Gaskets & fasteners',nameRu:'Прокладки и крепёж',color:'#8d9098',description:'Условный набор крепежа и уплотнений, не полный OEM-каталог.'},
];
