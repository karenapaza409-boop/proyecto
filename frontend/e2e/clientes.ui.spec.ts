import { test, expect } from '@playwright/test';
// Datos ficticios/API interceptada: no prueba Keycloak ni Oracle reales.
test('clientes: consulta fallida, alta manual, búsqueda, edición y duplicado sin ficha',async({page})=>{
 await page.addInitScript(()=>{sessionStorage.setItem('cantomoda.session',JSON.stringify({access_token:'test.'+btoa(JSON.stringify({sub:'cliente-ui-test',exp:Math.floor(Date.now()/1000)+3600,realm_access:{roles:['ADMIN']}}))+'.test',refresh_token:'solo-prueba'}));});
 const rows:any[]=[];
 await page.route('**/api/v1/clientes**',async r=>{
  const req=r.request(),url=new URL(req.url()),path=url.pathname;
  if(path.endsWith('/consulta-dni'))return r.fulfill({status:503,json:{detail:'Consulta no configurada'}});
  if(path.endsWith('/buscar')){const q=(url.searchParams.get('q')||'').toLowerCase();const found=rows.filter(c=>c.nombre.toLowerCase().includes(q)||c.documento.includes(q));return r.fulfill({json:{content:found,number:0,size:20,totalElements:found.length,totalPages:found.length?1:0}});}
  const id=path.match(/\/clientes\/(\d+)$/);
  if(req.method()==='GET'&&id)return r.fulfill({json:rows.find(c=>c.id===Number(id[1]))});
  const b=req.postDataJSON();const dup=rows.find(c=>c.documento===b.documento&&c.id!==Number(id?.[1]));
  if(dup)return r.fulfill({status:409,json:{detail:'DNI ya registrado',duplicadoId:dup.id,errors:{documento:'DNI ya registrado'}}});
  const value={...b,id:id?Number(id[1]):rows.length+1,activo:true};const index=rows.findIndex(c=>c.id===value.id);if(index>=0)rows[index]=value;else rows.push(value);
  return r.fulfill({status:id?200:201,json:value});
 });
 await page.goto('/clientes/nuevo');await expect(page.locator('.field-error-msg')).toHaveCount(0);
 await page.getByLabel('Número de documento *',{exact:true}).fill('00000000');await page.getByRole('button',{name:'Consultar',exact:true}).click();
 await expect(page.getByText(/Consulta de DNI no disponible/)).toBeVisible();
 await page.getByLabel('Nombres *',{exact:true}).fill('Ana Maria');await page.getByLabel('Apellidos *',{exact:true}).fill('Torres Prueba');
 await page.screenshot({path:'../docs/evidencias/clientes-registro.png',fullPage:true});
 await page.getByRole('button',{name:'Guardar cliente',exact:true}).click();await expect(page.getByRole('heading',{name:'Cliente registrado'})).toBeVisible();
 expect(rows[0].nombres).toBe('Ana Maria');expect(rows[0].apellidos).toBe('Torres Prueba');expect(rows[0].telefono).toBeNull();
 await page.getByRole('link',{name:'Volver al listado',exact:true}).click();await page.getByLabel('Buscar clientes').fill('00000000');await page.getByRole('button',{name:'Buscar',exact:true}).click();
 await expect(page.getByRole('cell',{name:'Ana Maria Torres Prueba',exact:true})).toBeVisible();await expect(page.getByRole('link',{name:'Ver ficha'})).toHaveCount(0);
 await page.screenshot({path:'../docs/evidencias/clientes-listado.png',fullPage:true});
 await page.getByRole('link',{name:'Editar',exact:true}).click();await expect(page.getByLabel('Nombres *',{exact:true})).toHaveValue('Ana Maria');await expect(page.getByLabel('Apellidos *',{exact:true})).toHaveValue('Torres Prueba');
 await page.getByLabel('Nombres *',{exact:true}).fill('Ana Rosa');await page.getByRole('button',{name:'Guardar cliente',exact:true}).click();await expect(page.getByRole('heading',{name:'Cliente actualizado'})).toBeVisible();
 await page.goto('/clientes/nuevo');await page.getByLabel('Número de documento *',{exact:true}).fill('00000000');await page.getByLabel('Nombres *',{exact:true}).fill('Otro');await page.getByLabel('Apellidos *',{exact:true}).fill('Duplicado');
 await page.getByRole('button',{name:'Guardar cliente',exact:true}).click();await expect(page.getByRole('link',{name:'Editar cliente existente con este documento'})).toBeVisible();await expect(page.getByLabel('Nombres *',{exact:true})).toHaveValue('Otro');
});
