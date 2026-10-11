import { create } from 'zustand';
import messages from './en.json';
import ru from './ru.json';
import dataMessages from './data-en.json';
export type Locale='ru'|'en';
const dictionaries:Record<Locale,Record<string,string>>={ru,en:{...messages,...dataMessages}};
function initialLocale():Locale{
 try{const saved=localStorage.getItem('atlas.locale');if(saved==='ru'||saved==='en')return saved;}catch{/* Storage can be disabled. */}
 return typeof navigator!=='undefined'&&navigator.language.toLowerCase().startsWith('en')?'en':'ru';
}
export const useLocale=create<{locale:Locale;setLocale:(locale:Locale)=>void}>(set=>({locale:initialLocale(),setLocale:locale=>{
 try{localStorage.setItem('atlas.locale',locale);}catch{/* Session-only preference. */}
 if(typeof document!=='undefined')document.documentElement.lang=locale;
 set({locale});
}}));
if(typeof document!=='undefined')document.documentElement.lang=useLocale.getState().locale;
export function t(key:string|undefined,values:unknown[]=[]):string{
 if(key===undefined)return '';
 const text=dictionaries[useLocale.getState().locale][key]??key;
 return text.replace(/\{(\d+)\}/g,(_,index)=>t(String(values[Number(index)]??'')));
}
