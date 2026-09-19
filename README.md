# EEMM - Sistema Web de Gestión de Equipos Médicos

Aplicación web desarrollada para el control, inspección y chequeo preventivo de equipos médicos hospitalarios, construida a partir de la base de datos de equipamiento clínico y ejecutada de forma **100% local**.

---

## 🌟 Características Principales

1. **Autenticación Segura por RUT y Contraseña:**
   * Inicio de sesión formal sin botones de acceso rápido de un clic.
   * Formateo automático de RUT (`XX.XXX.XXX-X`) con soporte para ingreso con o sin puntos/guion.
2. **Roles de Usuario y Gestión desde Panel Administrador:**
   * **Administrador del Sistema:** Acceso total al panel de administración, estadísticas de chequeos, métricas por servicio/técnico, gestión de catálogo y **Gestión de Usuarios** (Crear, Editar RUT/Contraseña/Rol y Eliminar usuarios).
   * **Técnico EEMM:** Formulario de chequeo preventivo, historial de chequeos realizados y consulta de stock en bodega.
3. **Formulario de Chequeo Preventivo:**
   * **Selector de Equipos:** Búsqueda en tiempo real entre **2.553 equipos médicos** por Nombre, N° de Serie, Marca o Modelo con ficha técnica flotante.
   * **Selector de Unidad / Servicio:** Catálogo de 18 unidades hospitalarias (Urgencia, Pabellones, UPC, etc.).
   * **Pauta de Puntos de Control:** Estados rápidos `[OK]`, `[NO]`, `[N/A]` para cables, higiene, encendido, batería, alarmas y sensores.
   * **Cuadro de Observaciones:** Registro detallado de intervenciones.
   * **4 Ranuras de Fotografías:** Carga con vista previa y compresión automática.
   * **Canvas de Firma Digital:** Dibujo de firma táctil para recepción del servicio.
4. **Diseño Minimalista y Profesional:**
   * Tipografías *Plus Jakarta Sans* y *JetBrains Mono*, acentos en azul clínico, bordes ultra-finos y distribución Bento.
   * **Modo Claro** y **Modo Oscuro** nativos con alternancia instantánea.

---

## 🚀 ¿Cómo Iniciar la Aplicación?

### Opción 1: Lanzador de un Clic (Recomendado)
Haz doble clic sobre el archivo **`iniciar_eemm.bat`** que se encuentra en tu **Escritorio** o en esta carpeta (`c:\Users\patro\OneDrive\Documentos\EEMM\`).
Se abrirá automáticamente el navegador en:
👉 **[http://localhost:8000](http://localhost:8000)**

### Opción 2: Desde Terminal PowerShell
```powershell
cd "c:\Users\patro\OneDrive\Documentos\EEMM"
& "C:\Users\patro\.gemini\antigravity\bin\uv.exe" run --with fastapi --with uvicorn --with python-multipart python app.py
```

---


> [!NOTE]
> Nuevos usuarios técnicos y administradores pueden ser registrados directamente por el Administrador desde la pestaña **Administración > Gestión de Usuarios del Sistema**.

---

## 📁 Estructura del Proyecto

* **`app.py`**: Servidor API REST con FastAPI (Login por RUT, CRUD usuarios, chequeos, equipos e inventario).
* **`Dockerfile`**: Configuración optimizada para despliegue en Coolify / Docker.
* **`docker-compose.yml`**: Orquestación con volúmenes persistentes para producción.
* **`requirements.txt`**: Dependencias oficiales de Python.
* **`eemm.db`**: Base de datos local SQLite con 2.553 equipos, historial e inventario.
* **`uploads/`**: Almacenamiento local de fotografías y firmas adjuntas.
* **`static/`**:
  * `index.html`: Interfaz web moderna con pestañas y modales.
  * `css/style.css`: Sistema de diseño minimalista con modo claro/oscuro.
  * `js/app.js`: Lógica de autenticación, control de formularios y gestión de usuarios.
  * `js/signature.js`: Controlador de firma sobre Canvas HTML5.
  * `js/photos.js`: Gestor de 4 ranuras de fotografías.
* **`iniciar_eemm.bat`**: Script de arranque directo para Windows.

---

## ☁️ Despliegue en Producción con Coolify

1. **Conectar Repositorio**: En Coolify, crea un nuevo recurso tipo **Application** apuntando a tu repositorio de GitHub.
2. **Build Pack**: Selecciona **`Dockerfile`**.
3. **Puerto de Escucha**: Configura el puerto expuesto en **`8000`**.
4. **Verificación de Salud (Health Check)**: Apunta a `/api/health`.
5. **Almacenamiento Persistente (Storages)**:
   * `/app/uploads`: Para persistir fotos y firmas.
   * `/app/data`: Para persistir la base de datos `eemm.db` (configurando la variable de entorno `DB_PATH=/app/data/eemm.db`).

