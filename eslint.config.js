import js from '@eslint/js';
import ts from 'typescript-eslint';
import hooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
// Node-globals для скриптов и конфигов: покрываем и .mjs/.cjs, иначе node-скрипты
// (в том числе .mjs) падают на no-undef по console/process и ломают `npm run check`.
export default ts.config(
  { ignores: ['dist', 'node_modules', 'playwright-report', 'test-results', 'public/sw.js', 'public/glb'] },
  js.configs.recommended,
  ...ts.configs.recommended,
  { files: ['**/*.{ts,tsx}'], languageOptions: { globals: { ...globals.browser, ...globals.node } }, plugins: { 'react-hooks': hooks }, rules: { ...hooks.configs.recommended.rules } },
  { files: ['**/*.{js,mjs,cjs}'], languageOptions: { globals: globals.node } },
);
