# 🏦 SISTEMA FINANCIERO CORPORATIVO
# MANUAL DE USUARIO Y OPERACIONES (VERSIÓN EXTENDIDA)

Este documento es la guía definitiva y obligatoria para todos los empleados, auditores y administradores que interactúan con el Sistema Financiero Corporativo. Aquí encontrarás documentado, campo por campo y pantalla por pantalla, el 100% de la funcionalidad del sistema con capturas visuales de referencia.

---

## 📖 ÍNDICE DE CONTENIDOS

1. [CAPÍTULO 1: INTRODUCCIÓN Y CONCEPTOS BÁSICOS](#capítulo-1-introducción-y-conceptos-básicos)
2. [CAPÍTULO 2: ACCESO Y NAVEGACIÓN (LOGIN)](#capítulo-2-acceso-y-navegación-login)
3. [CAPÍTULO 3: MÓDULO DE CAJA Y MOVIMIENTOS (CAJEROS)](#capítulo-3-módulo-de-caja-y-movimientos-cajeros)
4. [CAPÍTULO 4: GESTIÓN INTEGRAL DE CONTRIBUYENTES](#capítulo-4-gestión-integral-de-contribuyentes)
5. [CAPÍTULO 5: BANDEJA DE APROBACIONES (ADMINISTRADOR)](#capítulo-5-bandeja-de-aprobaciones-administrador)
6. [CAPÍTULO 6: CONFIGURACIÓN CENTRAL (ADMINISTRADOR)](#capítulo-6-configuración-central-administrador)
7. [CAPÍTULO 7: REPORTES Y PDF](#capítulo-7-reportes-y-pdf)
8. [CAPÍTULO 8: GUÍA TÉCNICA Y DE INSTALACIÓN (DESARROLLADORES)](#capítulo-8-guía-técnica-y-de-instalación-desarrolladores)

---

## 🏛️ CAPÍTULO 1: INTRODUCCIÓN Y CONCEPTOS BÁSICOS

El Sistema Financiero Corporativo es una plataforma web centralizada diseñada para llevar el control estricto del flujo de dinero (ingresos y egresos), la base de datos de clientes/proveedores, y la arquitectura organizativa de una empresa con múltiples sucursales (Sedes) y personerías jurídicas (Empresas).

### Jerarquía de Roles
El sistema está rigurosamente dividido en dos niveles de seguridad:
1. **Administrador (Nivel 1):** Acceso irrestricto. Puede crear usuarios, configurar empresas, crear nuevas cajas, establecer series de facturación y **es el único que puede aprobar transacciones financieras sensibles**.
2. **Cajero / Operador (Nivel 2):** Perfil operativo. Su labor es atender operaciones diarias, registrar movimientos en su caja asignada, y crear perfiles de nuevos contribuyentes.

### Glosario del Sistema
* **Sede:** Ubicación física de la sucursal (ej. Oficina Miraflores).
* **Empresa:** Razón Social / RUC con la que opera financieramente un brazo del grupo.
* **Tipo de Caja:** Clasificación del dinero (Caja Efectivo, Cuenta Corriente Banco X, Caja Fuerte).
* **Contribuyente:** Cualquier persona natural o jurídica que da o recibe dinero de nosotros (Cliente, Proveedor, Empleado).
* **Movimiento:** Una transacción. Puede ser Ingreso (suma saldo) o Egreso (resta saldo).

---

## 🔑 CAPÍTULO 2: ACCESO Y NAVEGACIÓN (LOGIN)

La puerta de entrada a la plataforma. Toda la conexión está cifrada de punto a punto para garantizar la seguridad de los datos.

![Pantalla de Login](docs/img/login.png)

### 2.1. Pantalla de Inicio de Sesión
* **Correo Electrónico:** Ingresa el correo corporativo (ej. cajero@empresa.com).
* **Contraseña:** Si es tu primer ingreso, usa la contraseña temporal entregada por tu administrador.
* Al iniciar sesión con éxito, el sistema te redirigirá a tu Dashboard correspondiente (Admin o Cajero) dependiendo de tu rol configurado.

### 2.2. Estructura de Navegación
Una vez dentro, el layout base consta de:
* **Barra Lateral (Menú):** Módulos disponibles según el nivel de seguridad.
* **Cabecera (Header):** Muestra al usuario conectado, sede asignada y botón para Salir.
* **Área Central:** Contiene los gráficos, tablas y formularios interactivos.

---

## 💵 CAPÍTULO 3: MÓDULO DE CAJA Y MOVIMIENTOS (CAJEROS)

Este es el módulo central donde el personal operativo gestionará el flujo del dinero. 

![Dashboard del Cajero](docs/img/dashboard-cajero.png)

### 3.1. Dashboard Principal del Cajero
Al entrar, se visualizan:
* **Tarjetas Superiores:** Saldo actual, ingresos del día y egresos del día.
* **Gráficos Dinámicos:** Visualización en tiempo real del "Flujo Neto" y la "Evolución por Caja". Los gráficos permiten interacción (clic para ampliar en la misma pantalla) y cambio de vista (Histórico / Mensual).
* **Tabla de Movimientos Recientes:** El historial del día en curso.

### 3.2. Formulario: Registrar Movimiento
Cuando haces clic en el botón "Nuevo Movimiento", se abre el siguiente modal:

![Formulario de Registro de Movimiento](docs/img/form-movimiento.png)

Debes llenar **ESTRICTAMENTE** los siguientes campos:
1. **Tipo:** `INGRESO` o `EGRESO`.
2. **Monto:** Introduce el valor numérico en la moneda de tu caja.
3. **Moneda:** Automática según la caja o seleccionable.
4. **Contribuyente:** Buscador inteligente integrado. Escribe RUC/DNI y el sistema autocompleta el nombre. (Si no existe, deberás ir al módulo de contribuyentes a registrarlo primero).
5. **Tipo de Comprobante:** Factura, Boleta, Recibo de Egresos, etc.
6. **Número de Comprobante:** Formato estándar (Ej. `F001-000034`).
7. **Concepto:** Descripción extensa y justificada de la operación.
8. **Imagen/Adjunto:** (Opcional/Obligatorio según la regla) Carga de la foto del recibo físico.

> **Importante:** Si un Cajero registra un `EGRESO` que supera el umbral permitido, el saldo no se descontará de inmediato. Quedará en estado `PENDIENTE` hasta que el Admin lo apruebe.

---

## 📇 CAPÍTULO 4: GESTIÓN INTEGRAL DE CONTRIBUYENTES

El menú "Contribuyentes" gestiona todo el ciclo de vida de los clientes, proveedores y personal de planilla externo.

![Vista Principal de Contribuyentes](docs/img/contribuyentes-directorio.png)

### 4.1. Directorio Principal (Formulario de Contribuyente)
Para registrar un nuevo cliente o proveedor:
1. **Tipo de Documento:** DNI o RUC.
2. **Número de Documento.**
3. **Nombres/Razón Social:** Identificador principal.
4. **Correo y Dirección Fiscal.**
5. **Estado:** Activo o Inactivo.

![Formulario de Nuevo Contribuyente](docs/img/form-contribuyente.png)

### 4.2. Teléfonos y Contactos
Permite agregar múltiples números a un mismo contribuyente.
* **Número:** El teléfono en sí.
* **Tipo:** Celular, Fijo, WhatsApp.
* **Contacto:** Nombre específico de quien contesta (Ej. "Juan - Asistente de Cobranzas").
* **Principal:** Un checkbox para indicar si es la vía de comunicación principal.

![Formulario de Teléfono](docs/img/form-telefonos.png)

### 4.3. Gestión Documental (Archivos Digitales)
Repositorio en la nube para guardar evidencias físicas (Fichas RUC, DNI escaneado, Contratos).
* Seleccionas al contribuyente.
* Subes el archivo (PDF, JPG).
* Le asignas un nombre descriptivo y su categoría.

![Formulario de Documentos](docs/img/form-documentos.png)

### 4.4. Credenciales Confidenciales
Caja fuerte virtual de usuarios y contraseñas externas (Clave SOL, AFP Net).
* **Entidad:** Sistema al que pertenece.
* **Usuario:** ID de acceso.
* **Clave:** Contraseña (oculta por defecto y auditada si se visualiza).

![Formulario de Credenciales](docs/img/form-credenciales.png)

### 4.5. Configuración de Tipos de Documento y Rubros
*(Acceso restringido para Cajeros en su mayoría)*
Define qué clase de documentos permite subir el sistema (con sus extensiones de archivo) y en qué rubros comerciales se agrupan los proveedores (con su % de detracción).

---

## 🛡️ CAPÍTULO 5: BANDEJA DE APROBACIONES (ADMINISTRADOR)

Módulo exclusivo de la gerencia para auditar salidas de dinero fuertes y evitar fraudes o errores humanos.

![Bandeja de Aprobaciones](docs/img/aprobaciones.png)

### 5.1. Proceso de Revisión
1. **Listado:** Se muestran las tarjetas con las operaciones que el sistema marcó como `Pendientes de Aprobación`.
2. **Detalle:** Al hacer clic en revisar, se despliega la información completa: Cajero que emite, Monto, Contribuyente, y Recibo/Foto adjunta.
3. **Botón Aprobar (Verde):** Autoriza el pago. El saldo se descuenta inmediatamente de la caja del cajero.
4. **Botón Rechazar (Rojo):** Deniega el pago. Se exige de forma obligatoria que el Admin escriba un motivo ("Falta firma del gerente" o "Monto excede lo pactado"). El cajero recibe el rechazo de inmediato.

![Formulario de Rechazo](docs/img/form-rechazo-aprobacion.png)

---

## ⚙️ CAPÍTULO 6: CONFIGURACIÓN CENTRAL (ADMINISTRADOR)

El corazón de la empresa. Aquí se definen las reglas del negocio.

![Panel de Configuración](docs/img/configuracion-general.png)

### 6.1. Gestión de Empresas
Define las razones sociales (RUC) bajo las cuales se factura y opera.

![Formulario de Empresa](docs/img/form-empresa.png)

### 6.2. Gestión de Sedes
Sucursales vinculadas a una empresa.
* **Nombre de Sede:** Identificador.
* **Empresa Vinculada:** De qué RUC depende.
* **Ubicación Física.**

![Formulario de Sedes](docs/img/form-sedes.png)

### 6.3. Gestión de Cajas (Centro de Costos)
Las bóvedas de dinero.

![Formulario de Caja](docs/img/form-caja.png)

* **Nombre:** "Caja Chica A", "Banco de Crédito Cuenta 1".
* **Sede:** Dónde se ubica esta caja.
* **Moneda:** PEN o USD.
* **Saldo Inicial:** Monto de apertura en el sistema.

### 6.4. Comprobantes (Series)
Configuración de talonarios de facturación.
* **Sede y Empresa.**
* **Tipo de Comprobante:** Boleta, Factura.
* **Serie:** Ej. F001, B002. Obligatorio para que el cajero pueda emitir comprobantes legales.

![Formulario de Series de Comprobantes](docs/img/form-comprobantes.png)

### 6.5. Usuarios y Permisos
Control de personal.

![Formulario de Usuarios](docs/img/form-usuarios.png)

* **Identidad:** DNI y Nombres.
* **Rol:** Admin vs Cajero.
* **Sede:** Restringe qué puede ver el usuario. (Un usuario no puede ver dinero de una sede a la que no pertenece).

---

## 📊 CAPÍTULO 7: REPORTES Y PDF

El sistema cuenta con un motor de exportación avanzado (`jspdf`).

### 7.1. Exportación de Tablas de Movimientos
* Al presionar el botón de **PDF**, se compilará un documento oficial en formato A4 (horizontal) con membrete de la empresa.
* Si el historial tiene múltiples páginas, el salto de página automático garantiza que ninguna fila pise el encabezado y se respeten los amplios márgenes preconfigurados.
* Los reportes PDF contienen metadatos (quién lo imprimió, hora y fecha exacta) para validez legal interna.

![Reporte PDF Ejemplo](docs/img/ejemplo-pdf.png)

---

## 💻 CAPÍTULO 8: GUÍA TÉCNICA Y DE INSTALACIÓN (DESARROLLADORES)

Si eres parte del equipo de desarrollo, aquí tienes las instrucciones para desplegar el entorno local:

### 8.1. Tecnologías Principales
* **Frontend:** React 18, Vite, TypeScript.
* **Estilos:** Tailwind CSS (Variables CSS personalizadas para Light/Dark Mode).
* **Gráficos Dinámicos:** Recharts (Áreas dinámicas, interactividad in-line para expandir vistas en cuadrículas).
* **Iconografía:** Lucide React.
* **Generación de Reportes PDF:** `jspdf` y `jspdf-autotable`.

### 8.2. Instalación Local
1. Clona el repositorio oficial desde GitHub: `git clone [url]`
2. Instala Node.js (v18+).
3. Abre terminal en raíz y corre la instalación de paquetes:
   ```bash
   npm install
   ```
4. Inicia el servidor de prueba:
   ```bash
   npm run dev
   ```
5. Accede mediante tu navegador a `http://localhost:5173`.

### 8.3. Arquitectura UI Reciente
* **Gráficos Expansibles (In-line):** Al hacer clic en un gráfico (Dashboard Cajero/Admin), este no despliega un modal bloqueante, sino que realiza una transición suave (`transition-all`) para ocupar un `col-span-2` en el Grid, maximizando el detalle.
* **Visualización de Ejes (X-Axis):** Configuración de superposición optimizada mediante `minTickGap={30}` en Recharts.
* **Linear Gradients:** Estilos de "Cristal Emborronado" en las series de Cajas (`<defs><linearGradient>`).

---
_Fin del Manual. Sujeto a revisiones y actualizaciones constantes._