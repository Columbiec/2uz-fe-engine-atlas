import { expect, test } from '@playwright/test';

test('основной сценарий исследования', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /2UZ/i })).toBeVisible();
  await page.getByRole('button', { name: /найти деталь/i }).click();
  await page.getByRole('textbox', { name: 'Поиск' }).fill('коленвал');
  await page.getByRole('button', { name: /Коленчатый вал/i }).click();
  await expect(page.getByRole('heading', { name: 'Коленчатый вал' })).toBeVisible();
  await expect(page).toHaveURL(/part=crankshaft/);
  await page.getByRole('button', { name: /Прозрачность/i }).click();
  await page.getByRole('button', { name: /Разнести/i }).click();
  await expect(page.getByLabel('Разнести двигатель')).toHaveValue('100');
  expect(errors).toEqual([]);
});

test('режим разборки и мобильный drawer', async ({ page, isMobile }) => {
  await page.goto('/');
  if (isMobile) {
    await page.getByRole('button', { name: 'Открыть системы' }).click();
    await expect(page.getByLabel('Системы двигателя')).toHaveClass(/open/);
    await page.getByRole('button', { name: 'Закрыть', exact: true }).click();
  }
  await page.getByRole('button', { name: 'Разборка', exact: true }).click();
  await page.getByRole('button', { name: /Начать/i }).click();
  await expect(page.getByText('Снять декоративные крышки')).toBeVisible();
});

test('камера: все ракурсы, прерывание перехода и свободное управление',async({page,isMobile})=>{
 test.setTimeout(90_000);
 await page.goto('/');
 await page.locator('.technical-controls summary').click();
 await page.getByLabel('Механическая отладка: оси и центры').check();
 await page.locator('.technical-controls summary').click();
 const viewer=page.locator('.viewer'),canvas=page.locator('canvas');
 for(const name of ['front','back','left','right','top','bottom','iso','bank1','bank2']){
  await page.locator(`.camera-controls button[title="${name}"]`).click();
  await expect(viewer).toHaveAttribute('data-preset',name);
  await expect(viewer).toHaveAttribute('data-navigation','preset');
 }
 const box=(await canvas.boundingBox())!;
 const x=box.width*.51,y=box.height*.39;
 if(isMobile){
  const cdp=await page.context().newCDPSession(page);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+45,y:y+35}]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 }else{
  await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x+110,y+55,{steps:8});await page.mouse.up();
 }
 await expect(viewer).toHaveAttribute('data-preset','');
 await expect(viewer).toHaveAttribute('data-navigation','manual');
 const position=await canvas.getAttribute('data-camera-position');
 await page.waitForTimeout(1200);
 expect(await canvas.getAttribute('data-camera-position')).toBe(position);
 await page.locator('.camera-controls button[title="front"]').click();
 await page.mouse.move(x,y);await page.mouse.wheel(0,120);
 await expect(viewer).toHaveAttribute('data-navigation','manual');
 await expect(viewer).toHaveAttribute('data-preset','');
});

test('локализация, сохранение языка, детализация и отладка',async({page})=>{
 test.setTimeout(90_000);
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');await page.getByRole('button',{name:'EN',exact:true}).click();
 const english=async()=>expect(await page.locator('body').innerText()).not.toMatch(/[А-Яа-яЁё]/);
 await english();await page.reload();await expect(page.locator('html')).toHaveAttribute('lang','en');
 await page.locator('.technical-controls summary').click();
 const detail=page.getByLabel('Technical detail level');
 for(let i=0;i<9;i++){await detail.fill(String(i));await expect(detail).toHaveValue(String(i));}
 await detail.fill('0');
 await page.getByLabel('Render quality').selectOption('low');
 await page.getByLabel('Mechanical debug: axes and pivots').check();
 await page.getByLabel('Slow motion 0.05×').check();
 await page.getByRole('button',{name:'TDC #1 · 0°',exact:true}).click();
 await page.getByLabel('Crank angle',{exact:true}).fill('450');
 await expect(page.locator('.debug-readout')).toContainText('450.0°');
 await english();await page.locator('.technical-controls summary').click();
 await page.getByRole('button',{name:'Find a part',exact:true}).click();
 await page.getByRole('textbox',{name:'Search',exact:true}).fill('crankshaft');
 await english();await page.locator('.search-results button').first().click();await english();
 await page.locator('.part-panel').getByRole('button',{name:'Close',exact:true}).click();
 await page.getByRole('button',{name:'Learn',exact:true}).click();await english();
 await page.locator('.lesson-list button').first().click();await english();
 await page.locator('.learn-panel').getByRole('button',{name:'Close',exact:true}).click();
 if(await page.locator('.part-panel').isVisible())await page.locator('.part-panel').getByRole('button',{name:'Close',exact:true}).click();
 await page.getByRole('button',{name:'Quiz',exact:true}).click();await english();
 expect(errors).toEqual([]);
});

test('профиль 10 / 500 процентов и адаптивность',async({page,isMobile},testInfo)=>{
 test.setTimeout(90_000);
 await page.goto('/');await page.locator('.technical-controls summary').click();
 const detail=page.getByLabel('Техническая детализация');const samples=[];
 await page.getByLabel('Качество рендера').selectOption('low');
 await page.getByLabel('Замедление 0.05×').check();
 await page.locator('.engine-start').click();
 for(const level of [0,8]){
  await detail.fill(String(level));await page.waitForTimeout(2200);
  samples.push({level:level===0?10:500,fps:await page.locator('canvas').getAttribute('data-fps')});
 }
 console.log('FPS',testInfo.project.name,JSON.stringify(samples));
 await testInfo.attach('fps.json',{body:JSON.stringify(samples),contentType:'application/json'});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
 await page.locator('.technical-controls summary').click();
 await page.screenshot({path:`output/playwright/${isMobile?'mobile':'desktop'}-500.png`});
});
