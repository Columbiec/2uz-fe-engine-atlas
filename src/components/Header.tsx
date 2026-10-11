import { t, useLocale } from '../core/i18n';
import { BookOpen, Command, Info, Menu, Search } from 'lucide-react';
import { memo } from 'react';
import { useEngineStore } from '../core/store';
import { engine2uz } from '../engines/2uz-fe';
import { IconButton } from './IconButton';

export const Header = memo(function Header() {
 useLocale();
  const {locale,setLocale}=useLocale();
  const set = useEngineStore((s) => s.set);
  return <header className="topbar">
    <button className="mobile-menu" onClick={() => set({systemsOpen:true})} aria-label={t("Открыть системы")}><Menu size={19}/></button>
    <div className="brand">
      <div className="eyebrow"><i /> TOYOTA 4.7 V8 <span>{t("NON‑VVT‑i REFERENCE")}</span></div>
      <h1><strong>2UZ‑FE</strong><span>{t("Interactive Engine Atlas")}</span></h1>
      <div className="brand-meta"><b>{engine2uz.parts.length}</b> {t("отдельных компонентов")}<em>·</em> {t("учебная 3D-реконструкция")}</div>
    </div>
    <nav className="top-actions" aria-label={t("Основные действия")}>
      <div className="language-switch" aria-label="RU / EN">{(['ru','en'] as const).map(l=><button key={l} lang={l} aria-pressed={locale===l} className={locale===l?'active':''} onClick={()=>setLocale(l)}>{l.toUpperCase()}</button>)}</div>
      <button className="search-trigger" aria-label={t("Найти деталь")} onClick={() => set({searchOpen:true})}><Search size={18}/><span>{t("Найти деталь")}</span><kbd>/</kbd></button>
      <IconButton label={t("Характеристики двигателя")} onClick={() => set({specsOpen:true})}><Info size={18}/></IconButton>
      <IconButton label={t("Режим обучения")} onClick={() => set({workspace:'learn'})}><BookOpen size={18}/></IconButton>
      <IconButton label={t("Горячие клавиши")} onClick={() => set({shortcutsOpen:true})}><Command size={18}/></IconButton>
    </nav>
  </header>;
});
