<div align="center">

# 🏦 SISTEMA FINANCIERO CORPORATIVO

### Manual de Usuario, Operaciones y Guía Técnica (Versión Mejorada)

[![React](https://img.shields.io/badge/React-18.x-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.x-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.x-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

*Plataforma web centralizada para el control estricto de flujo de dinero, gestión de contribuyentes y administración multi-sede, fuertemente jerarquizada por niveles de acceso.*

</div>

---

## 📖 ÍNDICE DE CONTENIDOS

| N° | Capítulo | Descripción |
|----|----------|-------------|
| 1 | [Introducción y Niveles de Acceso](#-capítulo-1-introducción-y-niveles-de-acceso) | Arquitectura jerárquica y permisos por nivel |
| 2 | [Acceso y Seguridad](#-capítulo-2-acceso-y-seguridad-login) | Autenticación y aislamiento de datos |
| 3 | [Nivel 1: Operaciones del Administrador](#-capítulo-3-nivel-1-operaciones-del-administrador) | Control total, configuración y monitoreo global |
| 4 | [Nivel 2: Operaciones del Cajero](#-capítulo-4-nivel-2-operaciones-del-cajero) | Operativa diaria, aislamiento por sede y movimientos |
| 5 | [Flujo de Trabajo y Aprobaciones](#-capítulo-5-flujo-de-trabajo-y-aprobaciones-inter-nivel) | Cómo interactúan ambos niveles (El ciclo del dinero) |
| 6 | [Módulo Universal de Contribuyentes](#-capítulo-6-módulo-universal-de-contribuyentes) | CRM de clientes, proveedores y credenciales |
| 7 | [Reportes y Exportación](#-capítulo-7-reportes-y-exportación-pdfexcel) | Generación de PDFs y Excel por nivel |
| 8 | [Guía Técnica para Desarrolladores](#-capítulo-8-guía-técnica-para-desarrolladores) | Stack, instalación y arquitectura |
| 9 | [Preguntas Frecuentes (FAQ)](#-capítulo-9-preguntas-frecuentes-faq) | Solución de problemas comunes |

---

## 🏛️ CAPÍTULO 1: INTRODUCCIÓN Y NIVELES DE ACCESO

El **Sistema Financiero Corporativo** ha sido diseñado bajo una arquitectura de seguridad estricta basada en **Niveles Jerárquicos**. Esto garantiza que cada usuario vea única y exclusivamente la información que le corresponde, previniendo fraudes y fugas de información.

### 1.1. Los Dos Niveles del Sistema

Todo el sistema gira en torno a estos dos niveles fundamentales:

#### 👑 NIVEL 1: ADMINISTRADOR (Control Total)
Es el rol gerencial de la empresa.
- **Visibilidad Global:** Puede ver los saldos, gráficos y transacciones de **todas las sedes** y **todas las empresas**.
- **Configuración Estratégica:** Es el único nivel que puede crear nuevos usuarios, abrir nuevas sedes, crear cajas bancarias, configurar empresas y series de comprobantes.
- **Poder de Veto:** Es el encargado final de aprobar o rechazar transacciones delicadas o de alto monto creadas por el Nivel 2.
- **Módulos Exclusivos:** Dashboard Global, Aprobaciones, Configuración, Usuarios.

#### 👷 NIVEL 2: CAJERO / OPERADOR (Control Aislado)
Es el rol operativo de trinchera.
- **Aislamiento por Sede (Silo):** Un cajero asignado a la "Sede A" jamás podrá ver el dinero, las cajas, ni las transacciones de la "Sede B".
- **Operativa Restringida:** Su función principal es registrar ingresos y egresos.
- **Sujeto a Aprobación:** Sus movimientos de salida de dinero (egresos) quedan congelados en estado "Pendiente" hasta que el Nivel 1 los apruebe.
- **Módulos Habilitados:** Dashboard de Sede, Mis Movimientos, Directorio de Contribuyentes.

### 1.2. Glosario Fundamental
- **Sede:** Sucursal física (ej. Oficina Principal). Aísla a los cajeros.
- **Empresa:** Razón Social / RUC.
- **Caja:** Clasificación del dinero (Caja Efectivo, Cuenta BCP).
- **Contribuyente:** Entidad a la que se le paga o cobra.

---

## 🔑 CAPÍTULO 2: ACCESO Y SEGURIDAD (LOGIN)

El ingreso al sistema detecta automáticamente tu **Nivel** y reconstruye toda la interfaz gráfica para adaptarse a tus permisos.

### 2.1. Ingreso Inteligente
1. El usuario ingresa su correo y contraseña.
2. El sistema consulta la base de datos y verifica:
   - ¿El usuario está Activo?
   - ¿Es Nivel 1 o Nivel 2?
   - Si es Nivel 2, ¿A qué sede pertenece?
3. En base a eso, se genera un **Token de Seguridad (JWT)** que acompaña cada clic que hace el usuario. Si un Cajero intenta forzar la URL para ver el Dashboard del Admin (Nivel 1), el sistema lo bloqueará.

### 2.2. Aislamiento Visual (Sidebar)
El menú lateral cambia radicalmente según tu nivel:
- **Nivel 1 ve:** Dashboard, Contribuyentes (+ submenús de configuración), Configuración (+ Sedes, Cajas, Empresas, Usuarios), Bandeja de Aprobaciones.
- **Nivel 2 ve:** Dashboard (resumido), Contribuyentes (solo lista y formularios base), Mis Movimientos (para registrar).

---

## 👑 CAPÍTULO 3: NIVEL 1 - OPERACIONES DEL ADMINISTRADOR

El Administrador tiene el control absoluto. Su panel es el **Centro de Mando**.

### 3.1. Dashboard Global Inteligente
El panel principal del administrador carga de forma ultrarrápida cruzando datos locales en milisegundos y muestra:
- **Capital Total Consolidado:** Suma de todas las cajas de todas las sedes a nivel nacional.
- **Flujo Neto Diario:** Variación de ingresos vs egresos.
- **Gráficos Expandibles:** Flujo Histórico y Evolución por Caja (con degradados interactivos y exportables).
- **Distribución de Capital:** Gráficos de Dona que muestran qué sede y qué empresa concentra el mayor porcentaje de dinero de la corporación.

### 3.2. Módulo de Configuraciones Maestras
Solo el Nivel 1 puede acceder a esta sección para parametrizar el negocio:
- **Gestión de Sedes:** Crear y desactivar sucursales.
- **Gestión de Empresas:** Registrar razones sociales y RUCs.
- **Gestión de Cajas:** Crear "Cuentas Corrientes" o "Cajas Fuertes" y asignarlas a Sedes específicas.
- **Series de Comprobantes:** Configurar las boletas/facturas que los cajeros podrán usar.
- **Gestión de Usuarios:** Crear nuevos Cajeros, asignarles su sede, y darles su contraseña inicial temporal.

---

## 👷 CAPÍTULO 4: NIVEL 2 - OPERACIONES DEL CAJERO

El Cajero vive en un entorno diseñado para la rapidez y precisión en caja, sin distracciones de otras sucursales.

### 4.1. Dashboard de Sede (Silo)
A diferencia del Admin, el Dashboard del cajero:
- Solo muestra el Saldo Total de **su propia sede**.
- Los gráficos solo dibujan las curvas de sus propias cajas.
- Está diseñado para mostrar si su caja cuadra con el dinero físico.

### 4.2. Registro de Movimientos
Es la tarea principal del Nivel 2.
- El Cajero presiona "Nuevo Movimiento".
- Selecciona si es **INGRESO** (suma) o **EGRESO** (resta).
- Selecciona de qué **Caja** entrará o saldrá la plata (solo verá las cajas de su sede).
- Ingresa el monto, el Contribuyente (proveedor/cliente) y el Comprobante (F001-00123).
- **Control Antifraude:** Si intenta registrar un egreso para sacar dinero de la caja, el sistema lo advertirá y mandará la transacción a estado PENDIENTE.

---

## 🔄 CAPÍTULO 5: FLUJO DE TRABAJO Y APROBACIONES INTER-NIVEL

Esta es la funcionalidad más importante de seguridad del sistema. Muestra cómo interactúan ambos niveles.

### El Ciclo de un Egreso (Salida de Dinero)
1. **Acción del Nivel 2 (Cajero):** El cajero necesita pagarle a un proveedor S/ 5,000. Registra el egreso en su panel.
2. **Congelamiento (Sistema):** El sistema **no descuenta el dinero de la caja**. La transacción queda marcada en amarillo como `PENDIENTE`.
3. **Notificación al Nivel 1 (Admin):** El Administrador entra a su módulo exclusivo **"Aprobaciones"**. Allí ve una tarjeta que dice: *"El cajero Juan (Sede Norte) quiere sacar S/ 5,000 para pagar a Proveedores S.A.C."*
4. **Decisión del Nivel 1:**
   - **Opción A (APROBAR 🟢):** El Administrador acepta. Inmediatamente el sistema descuenta los S/ 5,000 de la caja del cajero y la transacción pasa a estado `APROBADO`.
   - **Opción B (RECHAZAR 🔴):** El Administrador rechaza. El sistema le obliga a escribir un motivo (Ej. *"Factura incorrecta, emitir de nuevo"*). El dinero no se descuenta y la transacción muere.

Este flujo por niveles garantiza que ningún empleado pueda extraer fondos de la empresa sin autorización gerencial.

---

## 📇 CAPÍTULO 6: MÓDULO UNIVERSAL DE CONTRIBUYENTES

El directorio de contactos (Clientes, Proveedores, Empleados) es transversal a la empresa, pero con configuraciones restringidas.

### Funciones Compartidas (Nivel 1 y Nivel 2)
Ambos pueden:
- Ver la lista completa de contribuyentes y su RUC/DNI.
- Crear nuevos contribuyentes.
- Ingresar a su perfil y agregarles Teléfonos, correos o subirles Documentos (PDF, JPG) a su repositorio digital.
- Consultar las Credenciales Confidenciales del contribuyente (El sistema audita y registra silenciosamente quién vio la contraseña).

### Funciones Exclusivas (Solo Nivel 1)
Solo el Administrador puede:
- Modificar los catálogos del sistema: Crear nuevos **Rubros Comerciales** (asociados a Detracciones SUNAT), crear nuevos Tipos de Documentos permitidos, Tipos de Teléfonos, etc.
- Activar o Desactivar (banear) a un contribuyente de todo el sistema.

---

## 📑 CAPÍTULO 7: REPORTES Y EXPORTACIÓN PDF/EXCEL

La herramienta de reportes es vital para la contabilidad y también obedece a las reglas de los Niveles.

- **Para el Nivel 1 (Admin):** Puede descargar un PDF/Excel "Consolidado Global" con los ingresos y egresos de absolutamente todas las sedes a nivel nacional.
- **Para el Nivel 2 (Cajero):** Al presionar "Descargar PDF", el sistema generará automáticamente su reporte de "Caja Diaria" que sirve como sustento de cierre de caja para su sucursal exclusivamente.

**Diseño de los Reportes:**
Todos los PDFs se generan localmente en milisegundos con `jsPDF`.
Incluyen automáticamente:
- Papel Membretado oficial (Hoja en blanco corporativa de fondo).
- Tablas estructuradas con separación de colores para Ingresos (Verde) y Egresos (Rojo).
- Fechas de corte, totales acumulados y firma digital de quien generó el reporte.

---

## 💻 CAPÍTULO 8: GUÍA TÉCNICA PARA DESARROLLADORES

### Stack Tecnológico
- **Frontend:** React 18 + TypeScript + Vite.
- **Estilos:** Tailwind CSS 3.x (Soporte Nativo de Modo Claro / Oscuro).
- **Gráficos:** Recharts (SVG responsivos con degradados y optimización asíncrona).
- **Reportes:** jsPDF + jsPDF-AutoTable (PDF) y ExcelJS (Excel).
- **Iconografía:** Lucide React.

### Arquitectura de Rendimiento
- **Carga Síncrona vs Asíncrona:** El Dashboard Nivel 1 cruza datos localmente desde la memoria del navegador tras descargar el bloque central de transacciones. Esto elimina los bucles de peticiones HTTP (`N * peticiones`) y hace que los esqueletos de carga desaparezcan en milisegundos.
- **Responsive Design:** Interfaces que se adaptan dinámicamente desde pantallas de PC anchas hasta teléfonos celulares, colapsando menús y reorganizando columnas (Grid y Flexbox).

### Instalación Local
```bash
git clone https://github.com/skyps2003/cajas.git
cd cajas
npm install
npm run dev
# URL local: http://localhost:5173
```

---

## 🆘 CAPÍTULO 9: PREGUNTAS FRECUENTES (FAQ)

| Problema | Nivel Afectado | Solución |
|----------|----------------|----------|
| **"No puedo iniciar sesión"** | Todos | Revisa tu correo y contraseña. Si eres cajero nuevo, pídele al Nivel 1 (Admin) que resetee tu clave en la pestaña Usuarios. |
| **"Registré un pago pero la caja no descontó la plata"** | Nivel 2 | Es correcto. Todo egreso requiere autorización. Espera a que el Nivel 1 lo revise en su Bandeja de Aprobaciones. |
| **"Soy cajero y no veo las ventas de la otra tienda"** | Nivel 2 | Es la seguridad del sistema. Tu nivel aísla tu visión exclusivamente a tu Sede. |
| **"Quiero crear una nueva Sede pero no tengo el botón"** | Nivel 2 | La creación de la estructura empresarial es potestad exclusiva del Nivel 1. Comunícate con Gerencia. |
| **"Los gráficos demoran mucho en cargar"** | Nivel 1 | Ya ha sido solucionado. El sistema ahora realiza cruces en memoria ultrarrápidos. Si notas un retardo, actualiza con `F5`. |

---

<div align="center">

**Sistema Financiero Corporativo** · Manual de Usuario V3.0  
Desarrollado para optimizar la seguridad jerárquica y velocidad operativa.  
*Documento actualizado y estructurado por Niveles de Acceso.*

</div>