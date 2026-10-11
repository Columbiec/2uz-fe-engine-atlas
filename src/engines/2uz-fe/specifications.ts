export const specifications = [
 {label:'Рабочий объём',value:'4.7 л / 4 664 см³',sourceId:'toyota-specs'},
 {label:'Конфигурация',value:'V8 · 90°',sourceId:'toyota-proper'},
 {label:'Газораспределение',value:'DOHC · 32 клапана',sourceId:'toyota-specs'},
 {label:'Диаметр цилиндра',value:'94 мм',sourceId:'toyota-specs'},
 {label:'Диаметр поршня · STD Mark 1',value:'93,902–93,912 мм',sourceId:'toyota-service-data'},
 {label:'Зазор поршень–цилиндр',value:'0,090–0,111 мм',sourceId:'toyota-service-data'},
 {label:'Ход поршня',value:'84 мм',sourceId:'toyota-specs'},
 {label:'Порядок зажигания',value:'1–8–4–3–6–5–7–2',sourceId:'toyota-proper'},
 {label:'Блок / головки',value:'Чугун / алюминий',sourceId:'toyota-proper'},
 {label:'Привод ГРМ',value:'Ремень + межвальные шестерни',sourceId:'toyota-timing'},
];
export const sources = [
 {id:'rm956u',title:'Toyota Tundra 2003 · RM956U · Engine Mechanical',url:'https://manuals.plus/m/c90d9089f4af774737599625194ceca9e94cc498d5e90b0ce16361527cb0e9b6.pdf',note:'Заводское руководство Toyota, копия на стороннем зеркале. Выбранная конфигурация: США, 2003, без VVT-i.'},
 {id:'toyota-proper',title:'Toyota NCF147E · Engine proper, стр. 66–71',url:'https://toyotamanuals.gitlab.io/pz471-z0020-ca/htmlweb/ncf/ncf147e/m_eg_0066.pdf',note:'Конструкция, материалы, нумерация цилиндров и порядок зажигания. Копия документа Toyota на стороннем зеркале.'},
 {id:'toyota-specs',title:'Toyota NCF147E · Technical specifications, стр. 306',url:'https://toyotamanuals.gitlab.io/pz471-z0020-ca/htmlweb/ncf/ncf147e/m_ap_0306.pdf',note:'Объём, диаметр, ход и DOHC. Мощность не приводится: зависит от рынка и стандарта измерения.'},
 {id:'toyota-timing',title:'Toyota NCF147E · Valve mechanism · 72',url:'https://toyotamanuals.gitlab.io/pz471-z0020-ca/htmlweb/ncf/ncf147e/m_eg_0072.pdf',note:'Non-VVT-i · intake belt drive / exhaust gear drive.'},
 {id:'toyota-block',title:'Toyota RM630E · Cylinder block disassembly, EM-70',url:'https://toyotamanuals.gitlab.io/pz471-z0020-ca/htmlweb/rm/rm630e/m_em_0070.pdf',note:'Структура разборки нижней части двигателя. Атлас сокращает и группирует операции.'},
 {id:'toyota-service-data',title:'Toyota RM630E · Service specifications · Engine Mechanical, SS-5',url:'https://toyotamanuals.gitlab.io/pz471-z0020-ca/htmlweb/rm/rm630e/m_ss_0003.pdf',note:'Заводские диапазоны диаметра цилиндра и поршня, зазора поршня, канавок и замков поршневых колец.'},
];
