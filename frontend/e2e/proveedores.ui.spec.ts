import { expect, test } from "@playwright/test";

// Pruebas de interfaz con datos ficticios y API interceptada. NO acreditan Oracle/Keycloak reales.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const claims = { sub: "ui-admin-ficticio", exp: Math.floor(Date.now() / 1000) + 3600, realm_access: { roles: ["ADMIN"] } };
    sessionStorage.setItem("cantomoda.session", JSON.stringify({ access_token: "test." + btoa(JSON.stringify(claims)) + ".test", refresh_token: "solo-prueba-ui" }));
  });
});
async function apiFicticia(page: import("@playwright/test").Page) {
  const proveedores: any[] = [{ id: 1, nombre: "Proveedor anterior ficticio", documento: "00000000001", tipoDocumento: "RUC", nombreComercial: null,
    personaContacto: null, telefono: null, correo: null, direccion: null, activo: true }];
  const compras: any[] = [];
  const pageResult = (rows: any[], page = 0, size = 20) => ({ content: rows.slice(page * size, (page + 1) * size), number: page, size, totalElements: rows.length, totalPages: Math.ceil(rows.length / size) });
  await page.route("**/api/v1/**", async route => {
    const req = route.request(), url = new URL(req.url()), path = url.pathname.replace("/api/v1", ""), method = req.method();
    const respond = (body: unknown, status = 200) => route.fulfill({ status, contentType: "application/json", headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*", "Access-Control-Allow-Methods": "*" }, body: JSON.stringify(body) });
    if (method === "OPTIONS") return route.fulfill({ status: 204, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*", "Access-Control-Allow-Methods": "*" } });
    if (path === "/proveedores/buscar") {
      const q = (url.searchParams.get("q") || "").toLowerCase(); const activo = url.searchParams.get("activo");
      const rows = proveedores.filter(p => (!activo || String(p.activo) === activo) && [p.nombre, p.nombreComercial, p.documento].some(v => String(v || "").toLowerCase().includes(q)));
      return respond(pageResult(rows, Number(url.searchParams.get("page") || 0), Number(url.searchParams.get("size") || 20)));
    }
    if (path === "/proveedores" && method === "POST") {
      const data = req.postDataJSON(); const duplicate = proveedores.find(p => p.tipoDocumento === data.tipoDocumento && p.documento === data.documento);
      if (duplicate) return respond({ detail: "Ya existe un proveedor con ese documento.", duplicadoId: duplicate.id, errors: { documento: "Documento duplicado" } }, 409);
      const p = { ...data, id: proveedores.length + 1, activo: true }; proveedores.push(p); return respond(p, 201);
    }
    const historial = path.match(/^\/proveedores\/(\d+)\/historial$/);
    if (historial) {
      const rows = compras.filter(c => c.proveedorId === Number(historial[1]));
      return respond({ compras: pageResult(rows, Number(url.searchParams.get("page") || 0), 10), ultimaCompra: rows.length ? rows[rows.length - 1].fecha : null });
    }
    const estado = path.match(/^\/proveedores\/(\d+)\/estado$/);
    if (estado && method === "PUT") { const p = proveedores.find(p => p.id === Number(estado[1])); p.activo = req.postDataJSON().activo; return respond(p); }
    const ficha = path.match(/^\/proveedores\/(\d+)$/);
    if (ficha) return respond(proveedores.find(p => p.id === Number(ficha[1])));
    if (path === "/productos") return respond(pageResult([{ id: 1, nombre: "Producto UI ficticio", codigo: "UI-TEST", precio: 2, stock: 0, categoria: { id: 1, nombre: "Prueba" } }]));
    if (path === "/compras/resumen") return respond({ cantidad: compras.length, total: compras.reduce((s,c) => s+c.total,0), promedio: compras.length ? compras.reduce((s,c) => s+c.total,0) / compras.length : 0 });
    if (path === "/compras" && method === "POST") {
      const data = req.postDataJSON(); const p = proveedores.find(p => p.id === data.proveedorId);
      if (!p.activo) return respond({ detail: "Proveedor inactivo" }, 409);
      const c = { ...data, id: compras.length + 1, proveedorId: p.id, proveedor: p.nombre, fecha: "2026-11-08T10:00:00", actor: "ui-admin-ficticio", estado: "REGISTRADA",
        total: data.detalles.reduce((s: number,d: any) => s + d.cantidad*d.precioUnitario,0), detalles: data.detalles.map((d: any) => ({ ...d, productoNombre: "Producto UI ficticio", subtotal: d.cantidad*d.precioUnitario })) };
      compras.push(c); return respond(c, 201);
    }
    if (path === "/compras") return respond(pageResult(compras));
    return respond({ detail: "Ruta no preparada en la prueba UI: " + path }, 404);
  });
  return { proveedores, compras };
}

test("formulario → confirmación → compra preseleccionada → historial → desactivación", async ({ page }) => {
  const data = await apiFicticia(page); page.on("dialog", dialog => dialog.accept());
  await page.goto("/proveedores/nuevo"); await expect(page.getByRole("heading", { name: "Registrar proveedor" })).toBeVisible();
  await expect(page.locator(".field-error")).toHaveCount(0);
  await page.getByRole("button", { name: "Guardar proveedor", exact: true }).click();
  await expect(page.locator("#tipo-error")).toContainText("Seleccione");
  await page.getByLabel("Tipo de documento *", { exact: true }).selectOption("RUC");
  await page.getByLabel("Número de documento *", { exact: true }).fill("00000000000");
  await page.getByLabel("Razón social o nombre del proveedor *", { exact: true }).fill("Distribuidora UI ficticia");
  await page.getByLabel("Nombre comercial (opcional)", { exact: true }).fill("Marca UI");
  await page.getByLabel("Teléfono (opcional)", { exact: true }).fill("+51 999 000 000");
  await page.getByLabel("Correo electrónico (opcional)", { exact: true }).fill("incorrecto");
  await page.getByRole("button", { name: "Guardar proveedor", exact: true }).click();
  await expect(page.locator("#correo-error")).toContainText("correo válido");
  await page.getByLabel("Correo electrónico (opcional)", { exact: true }).fill("proveedor@example.test");
  await page.evaluate(() => scrollTo(0, 0));
  await page.screenshot({ path: "../docs/evidencias/proveedores-formulario.png", fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: "../docs/evidencias/proveedores-formulario-movil.png", fullPage: true });
  await page.getByRole("button", { name: "Guardar proveedor", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Proveedor registrado", exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Registrar compra", exact: true }).click();
  await expect(page).toHaveURL(/compras\/nueva\?proveedorId=2/);
  await expect(page.getByLabel("Proveedor", { exact: true }).locator("option:checked")).toHaveText(/Distribuidora UI ficticia/);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.getByLabel("Tipo de comprobante", { exact: true }).selectOption("FACTURA");
  await page.getByLabel("Serie", { exact: true }).fill("F001");
  await page.getByLabel("Número", { exact: true }).fill("000125");
  await page.getByLabel("Observaciones (opcional)", { exact: true }).fill("Entrega ficticia revisada");
  await page.getByLabel("Agregar producto", { exact: true }).fill("Producto");
  await page.getByRole("button", { name: /Producto UI ficticio/ }).click();
  await page.evaluate(() => scrollTo(0,0));
  await page.screenshot({ path: "../docs/evidencias/compras-boceto.png", fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: "../docs/evidencias/compras-boceto-movil.png", fullPage: true });
  await page.getByRole("button", { name: "Confirmar compra", exact: true }).click();
  await expect(page).toHaveURL(/\/compras$/); expect(data.compras[0].proveedorId).toBe(2);
  expect(data.compras[0].tipoComprobante).toBe("FACTURA");
  expect(data.compras[0].numero).toBe("000125");
  expect(data.compras[0].observaciones).toBe("Entrega ficticia revisada");
  await page.goto("/proveedores/2"); await expect(page.getByRole("heading", { name: "Historial de compras" })).toBeVisible();
  await expect(page.getByRole("cell", { name: "#1", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Desactivar proveedor", exact: true }).click();
  await expect(page.locator(".badge")).toHaveText("Inactivo"); await expect(page.getByRole("link", { name: "Nueva compra", exact: true })).toHaveCount(0);
  await expect(page.getByRole("cell", { name: "#1", exact: true })).toBeVisible();
  await page.goto("/proveedores"); await page.getByLabel("Estado", { exact: true }).selectOption("false");
  await page.getByRole("button", { name: "Buscar", exact: true }).click();
  await expect(page.getByRole("cell", { name: "Inactivo", exact: true })).toBeVisible(); expect(data.proveedores[1].activo).toBe(false);
});

test("un documento duplicado conserva el formulario y permite abrir la ficha", async ({ page }) => {
  await apiFicticia(page); await page.goto("/proveedores/nuevo");
  await page.getByLabel("Tipo de documento *", { exact: true }).selectOption("RUC");
  await page.getByLabel("Número de documento *", { exact: true }).fill("00000000001");
  await page.getByLabel("Razón social o nombre del proveedor *", { exact: true }).fill("Intento duplicado ficticio");
  await page.getByRole("button", { name: "Guardar proveedor", exact: true }).click();
  await expect(page.locator("#documento-error")).toContainText("duplicado");
  await expect(page.getByLabel("Razón social o nombre del proveedor *", { exact: true })).toHaveValue("Intento duplicado ficticio");
  await page.getByRole("link", { name: "Abrir proveedor existente" }).click(); await expect(page).toHaveURL(/\/proveedores\/1$/);
});

test("listado del boceto: limpiar filtros y abrir las acciones del proveedor", async ({ page }) => {
  await apiFicticia(page); await page.goto("/proveedores");
  await expect(page.getByRole("link", { name: "Ver ficha", exact: true })).toBeVisible();
  await page.getByLabel("Más acciones para Proveedor anterior ficticio", { exact: true }).click();
  await expect(page.getByRole("link", { name: "Editar proveedor", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Desactivar", exact: true })).toBeVisible();
  await page.getByLabel("Más acciones para Proveedor anterior ficticio", { exact: true }).click();
  await page.getByLabel("Buscar proveedor", { exact: true }).fill("Sin coincidencias");
  await page.getByRole("button", { name: "Buscar", exact: true }).click();
  await expect(page.getByText("No hay proveedores con estos filtros.", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Limpiar", exact: true }).click();
  await expect(page.getByRole("link", { name: "Ver ficha", exact: true })).toBeVisible();
  await expect(page.getByLabel("Buscar proveedor", { exact: true })).toHaveValue("");
  await page.screenshot({ path: "../docs/evidencias/proveedores-listado-boceto.png", fullPage: true });
});

test("inventario: catálogo, ficha, merma y conteo físico",async({page})=>{
  await apiFicticia(page); page.on('dialog',d=>d.accept());
  const p={id:1,codigo:'PRUEBA-01',nombre:'Producto inventario ficticio',precio:4.5,stock:5,stockMinimo:6,unidadVenta:'UNIDAD',codigoBarras:'TEST-01',categoria:{id:1,nombre:'Categoría de prueba'}};
  const movimientos:any[]=[{id:1,fecha:'2026-11-08T09:00:00',tipo:'SALDO_INICIAL',referencia:'MIG-PRUEBA',entrada:5,salida:0,saldo:5,actor:'SISTEMA_PRUEBA',motivo:'Saldo de prueba'}];
  await page.route('**/api/v1/categorias*',r=>r.fulfill({json:[p.categoria]}));
  await page.route('**/api/v1/productos**',async r=>{
    const path=new URL(r.request().url()).pathname;
    if(path.endsWith('/ajustes')){const b=r.request().postDataJSON();expect(b.stockEsperado).toBe(p.stock);const delta=b.tipo==='MERMA'?-b.cantidad:b.cantidad-p.stock;p.stock+=delta;movimientos.unshift({id:movimientos.length+1,fecha:'2026-11-08T10:00:00',tipo:b.tipo,referencia:'AJ-PRUEBA',entrada:Math.max(0,delta),salida:Math.max(0,-delta),saldo:p.stock,actor:'ADMIN_PRUEBA',motivo:b.motivo});return r.fulfill({json:p});}
    if(path.endsWith('/movimientos'))return r.fulfill({json:{content:movimientos,number:0,size:20,totalElements:movimientos.length,totalPages:1}});
    if(path.endsWith('/productos/1'))return r.fulfill({json:p});
    return r.fulfill({json:{content:[p],number:0,size:10,totalElements:1,totalPages:1}});
  });
  await page.goto('/productos');await expect(page.locator('.badge').filter({hasText:'Stock bajo'})).toBeVisible();
  await page.screenshot({path:'../docs/evidencias/inventario-catalogo.png',fullPage:true});
  await page.getByRole('link',{name:'Ver ficha',exact:true}).click();
  await page.getByRole('button',{name:'Registrar merma',exact:true}).click();
  await page.getByLabel('Unidades de merma',{exact:true}).fill('1');await page.getByLabel('Motivo *',{exact:true}).fill('Envase ficticio roto');
  await page.getByRole('button',{name:'Confirmar ajuste',exact:true}).click();await expect(page.getByRole('cell',{name:'MERMA',exact:true})).toBeVisible();expect(p.stock).toBe(4);
  await page.getByRole('button',{name:'Conteo físico',exact:true}).click();await page.getByLabel('Unidades contadas',{exact:true}).fill('3');await page.getByLabel('Motivo *',{exact:true}).fill('Conteo físico de prueba');
  await page.getByRole('button',{name:'Confirmar ajuste',exact:true}).click();await expect(page.getByRole('cell',{name:'CONTEO',exact:true})).toBeVisible();expect(p.stock).toBe(3);
  await page.evaluate(()=>scrollTo(0,0));
  await page.screenshot({path:'../docs/evidencias/inventario-movimientos.png',fullPage:true});
  await page.setViewportSize({width:390,height:844});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:'../docs/evidencias/inventario-movil.png',fullPage:true});
  await page.setViewportSize({width:1280,height:900});
  await page.goto('/productos/nuevo');
  await page.getByLabel('Nombre',{exact:true}).fill('Nuevo producto ficticio');
  await page.getByLabel('Código',{exact:true}).fill('TEST-NUEVO');
  await page.getByLabel('Categoría',{exact:true}).selectOption({label:'Categoría de prueba'});
  await page.getByLabel('Precio de venta (S/)',{exact:true}).fill('4.50');
  await page.getByLabel('Código de barras (opcional)',{exact:true}).fill('TEST-02');
  await page.getByLabel('Stock mínimo *',{exact:true}).fill('6');
  await page.evaluate(()=>scrollTo(0,0));
  await page.screenshot({path:'../docs/evidencias/inventario-formulario.png',fullPage:true});
});
