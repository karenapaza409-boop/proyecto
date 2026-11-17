import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { ClienteForm } from './cliente-form';
import { ApiService } from '../../core/services/api-service';
import { AuthService } from '../../core/services/auth-service';
describe('Clientes esenciales sin ficha',()=>{
 let get:ReturnType<typeof vi.fn>,post:ReturnType<typeof vi.fn>,put:ReturnType<typeof vi.fn>,id:string|null;
 beforeEach(()=>{id=null;get=vi.fn();post=vi.fn();put=vi.fn();TestBed.configureTestingModule({providers:[
  {provide:ApiService,useValue:{get,post,put}},{provide:AuthService,useValue:{tiene:()=>true}},
  {provide:ActivatedRoute,useValue:{snapshot:{paramMap:{get:()=>id}}}},
 ]});});
 function form(){const f=TestBed.runInInjectionContext(()=>new ClienteForm());f.ngOnInit();return f;}
 function completar(f:ClienteForm){f.form.patchValue({documento:'00000000',nombres:'Ana Maria',apellidos:'Torres Prueba'});}
 it('permite guardar manualmente con contacto vacío si no hay proveedor DNI y evita doble envío',()=>{
  const f=form();completar(f);post.mockReturnValueOnce(throwError(()=>({status:503})));f.consultarDni();
  expect(f.form.controls.nombres.value).toBe('Ana Maria');expect(f.dniInfo()).toContain('manualmente');
  const pending=new Subject();post.mockReturnValueOnce(pending);f.guardar();f.guardar();
  expect(post).toHaveBeenCalledTimes(2);expect(post).toHaveBeenLastCalledWith('/clientes',expect.objectContaining({nombres:'Ana Maria',apellidos:'Torres Prueba',telefono:null,correo:null}));
 });
 it('conserva datos ante duplicado y ofrece editar el registro existente',()=>{
  const f=form();completar(f);const before=f.form.getRawValue();post.mockReturnValue(throwError(()=>({status:409,error:{detail:'Documento duplicado',duplicadoId:7,errors:{documento:'Documento duplicado'}}})));
  f.guardar();expect(f.form.getRawValue()).toEqual(before);expect(f.duplicateId()).toBe(7);expect(f.busy()).toBe(false);
 });
 it('no separa nombres antiguos por suposición y edita los campos separados existentes',()=>{
  id='7';get.mockReturnValue(of({id:7,nombre:'Nombre histórico intacto',documento:'00000000',tipoDocumento:null,telefono:null,correo:null,nombres:null,apellidos:null}));
  const f=form();expect(f.form.controls.nombres.value).toBe('');expect(f.form.controls.apellidos.value).toBe('');expect(f.legacyNombre()).toBe('Nombre histórico intacto');
  completar(f);put.mockReturnValue(of({id:7,nombre:'Ana Maria Torres Prueba'}));f.guardar();expect(put).toHaveBeenCalledWith('/clientes/7',expect.objectContaining({nombres:'Ana Maria',apellidos:'Torres Prueba'}));
 });
 it('ignora una respuesta DNI tardía si cambió el documento',()=>{
  const f=form();f.form.controls.documento.setValue('00000000');const pending=new Subject();post.mockReturnValue(pending);f.consultarDni();
  f.form.controls.documento.setValue('00000001');pending.next({nombres:'Respuesta antigua',apellidoPaterno:'Prueba'});expect(f.form.controls.nombres.value).toBe('');
 });
});
