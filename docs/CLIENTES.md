# Módulo Clientes

Implementación inicial funcional del módulo de **Clientes** para gestión de ventas identificadas.

## Endpoints Backend (`/api/v1/clientes`)

- `GET /api/v1/clientes/buscar?q={q}&activo={activo}&page={page}&size={size}`: Consulta paginada con filtro por nombre/documento y estado.
- `GET /api/v1/clientes/duplicado?tipoDocumento=DNI&documento={documento}&excluirId={id}`: Verificación previa de documento duplicado.
- `GET /api/v1/clientes/{id}`: Obtiene el cliente por su identificador.
- `POST /api/v1/clientes`: Crea un nuevo cliente con validaciones y auditoría (`ADMIN`).
- `PUT /api/v1/clientes/{id}`: Actualiza un cliente existente (`ADMIN`).
- `POST /api/v1/clientes/consulta-dni`: Reutiliza el adaptador `ConsultaDniProvider` existente. Si no está disponible o falla, responde 503 sin bloquear el registro manual.

## Base de Datos

- Migración incremental: `database/migrations/07_clientes.sql`.
- Agrega columnas `tipo_documento`, `telefono`, `correo` y `activo` de forma idempotente conservando los datos existentes.
- Añade restricción de verificación de DNI de 8 dígitos y crea índice único para evitar duplicados.

## Frontend Angular

- Componentes en `frontend/src/app/features/clientes/`:
  - `cliente-list.ts`: Listado con buscador por nombre/documento, filtro por estado, paginación, mensaje de ayuda sobre "Consumidor final" y botón Registrar/Editar.
  - `cliente-form.ts`: Formulario reactivo con campos DNI (8 dígitos), nombres, apellidos, teléfono y correo opcionales, botón "Consultar" integrado con el backend, prevención de doble envío y mensajes de error por campo.
  - `clientes.css`: Estilo oscuro adaptado al boceto visual del proyecto.
