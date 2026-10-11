# 2UZ-FE Interactive Engine Atlas

Интерактивный технический атлас Toyota 2UZ-FE: составная 3D-модель, поиск деталей, управление системами, exploded view, пошаговая разборка, анимация V8, порядок зажигания, режимы X-Ray/Cutaway, учебные потоки, уроки и тест на самой модели.

Live demo: **[GitHub Pages](https://columbiec.github.io/2uz-fe-engine-atlas/)**.

## Overview

An interactive, browser-based technical atlas of the Toyota 2UZ-FE V8 engine. The application combines a procedural 3D assembly with part search, system visibility controls, exploded views, guided disassembly, engine animation, firing-order visualization, X-Ray and cutaway modes, lessons, and quizzes. The interface supports English and Russian.

Built with TypeScript, React, Three.js, React Three Fiber, and Zustand. Geometry is generated locally in the browser; production hosting serves static assets only. Domain calculations, geometry builders, rendering rules, and UI components are organized in separate modules. Unit tests cover engine kinematics, geometry, part data, and exports; Playwright covers browser interaction scenarios.

The model represents a 2003 US-market Toyota Tundra engine without VVT-i. It is an educational reconstruction, not a dimensionally accurate CAD model or a repair reference. Verified specifications and reconstruction assumptions are documented in [DOCUMENTATION.md](./DOCUMENTATION.md) and [SOURCES.md](./SOURCES.md).

## Запуск

Требуется Node.js 22+.

```bash
npm install
npm run dev
```

Проверка перед публикацией:

```bash
npm run check
npm run test:e2e
```

Production preview:

```bash
npm run build
npm run preview
```

Дополнительные инструменты:

```bash
npm run qa:report    # пересобрать QA_REPORT.md (метрики геометрии и draw call)
npm run probe:fps    # замер FPS на собранной сборке; печатает фактический рендерер
npm run fetch:fonts  # обновить самохостинговые шрифты в src/assets/fonts
```

`probe:fps` по умолчанию запрашивает аппаратный рендеринг: headless Chromium без этого
рисует через SwiftShader (на CPU) и показывает ~1 fps вместо 60 fps на GPU.
Флаг `-- --software` воспроизводит программный режим. Подробнее — в [QA_REPORT.md](./QA_REPORT.md).

## Архитектура

- `src/core` — типы, состояние, URL-state, поиск и признак снятой детали.
- `src/viewer` — React Three Fiber, процедурная геометрия и анимация.
  Кинематика детали считается в одном месте (`parts/partPose.ts`), правила видимости и
  материалов — в `parts/materials.ts`; сцена и генератор QA-отчёта используют их совместно.
- `src/engines/2uz-fe` — независимый пакет двигателя: детали, системы, характеристики, уроки и разборка.
- `src/data/documentation/configuration.ts` — единственный источник подтверждённых чисел;
  кинематика и геометрия поршня выводятся из него, а не повторяют значения литералами.
- `src/components` — интерфейс атласа.
- `tests` — unit и Playwright E2E.

Контракт `EnginePackage` описывает данные двигателя через общие сущности `EnginePart` и `EngineSystem`. Сейчас UI, store и viewer напрямую подключают пакет 2UZ-FE; поддержка другого двигателя потребует также выделения точки выбора пакета.

## Точность

Атлас основан на ранней версии без VVT-i. Параметры разных годов и рынков не смешиваются. 3D-геометрия является оригинальной учебной реконструкцией; потоки и последовательность разборки намеренно помечены как образовательные. Полный список источников и лицензий: [SOURCES.md](./SOURCES.md).

## Deploy


- **Vercel:** импортировать репозиторий; build command `npm run build`, output `dist`. `vercel.json` добавляет SPA fallback и cache headers.
- **Cloudflare Pages:** build command `npm run build`, output `dist`; `wrangler.toml` готов для Wrangler.
- **GitHub Pages:** [live demo](https://columbiec.github.io/2uz-fe-engine-atlas/). Workflow `.github/workflows/pages.yml` собирает проект с base path имени репозитория.

PWA-манифест и service worker генерируются при production-сборке. Приложение кэширует оболочку и метаданные; процедурная модель не требует загрузки крупного CAD-файла.

## Управление

Мышь или один палец вращают модель, колесо или pinch меняют масштаб. Горячие клавиши: `F` фокус, `H` скрыть, `I` изолировать, `X` X-Ray, `E` разнести, `R` сброс, `Space` пуск/пауза, `/` поиск, `Esc` снять выделение.
