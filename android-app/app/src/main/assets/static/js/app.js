/**
 * EEMM - Aplicación Web Principal
 * Gestión de Equipos Médicos, Chequeos Preventivos con Fotos y Firma
 */

const app = {
  currentUser: null,
  selectedEquipment: null,
  signaturePad: null,
  photoManager: null,
  activeTab: "modulo-selector",
  currentModule: "chequeo",
  debounceTimers: {},

  // Estado para Chequeo por Servicio
  servicioSelectedEquipment: null,
  servicioPhotoManager: null,
  servicioSignaturePad: null,
  selectedServicioClinico: "",
  servicioBatchEquipos: [],
  servicioSessionList: [],
  servicioChecklistValues: {},
  servicioCurrentCategory: null,

  currentHistorialTab: "equipos",
  historialServiciosData: [],

  currentCategory: "GENERAL",
  currentChecklistItems: [],
  checklistValues: {},

  inventarioView: "racks",
  selectedEstante: "all",
  inventarioData: [],
  estantesSummary: [],
  estanteMap: {},

  pautasPorCategoria: {
    "GENERAL": [
      "Chasis / Carcasa", "Ruedas / Frenos", "Cables alimentación", "Interruptores / Fusibles", 
      "Tubos / Mangueras", "Transductores", "Controles / Perillas", "Indicadores / Display", 
      "Señales audibles", "Control remoto / Pedal", "Batería", "Accesorios", 
      "Limpieza exterior", "Limpieza interior", "Lubricación", "Calibración", 
      "Reemplazo partes", "Chequeo fugas", "Revisión presiones", "Vaporizadores"
    ],
    "VENTILACION": [
      "Estado de mangueras de oxígeno/aire", "Válvula exhalatoria", "Celda de O2", 
      "Prueba de fugas de circuito", "Filtros antibacterianos", "Sensores de flujo", 
      "Verificación de alarmas", "Batería interna (autonomía)", "Compresor (si aplica)", 
      "Humidificador", "Limpieza de filtros de aire"
    ],
    "MONITOREO": [
      "Chasis / Carcasa", "Limpieza exterior", "Cables alimentación", "Alarmas", 
      "Estado Bateria", "Manguera PANI", "Manguito PANI", "Cable SPO2", 
      "Señales audibles", "Estado Pantalla/Display", "Estado Botones Interruptores", "Accesorios", 
      "Limpieza interior", "Calibración", "Cable ECG", "Estado de Palas", "Estado de Parches"
    ],
    "ASPIRACION": [
      "Chasis / Carcasa", "Limpieza exterior", "Cables alimentación", 
      "Estado Bateria", "Estado Botones Interruptores", "Accesorios"
    ],
    "LABORATORIO": [
      "Chasis / Carcasa", "Limpieza exterior", "Cables alimentación", "Alarmas", 
      "Estado Bateria", "Manguera PANI", "Manguito PANI", "Cable SPO2", 
      "Señales audibles", "Estado Pantalla/Display", "Estado Botones Interruptores", "Accesorios", 
      "Limpieza interior", "Calibración", "Cable ECG", "Estado de Palas", "Estado de Parches"
    ],
    "CALEFACCION": [
      "Chasis / Carcasa", "Limpieza exterior", "Cables alimentación", "Alarmas", 
      "Estado Bateria", "Señales audibles", "Estado Pantalla/Display", "Estado Botones Interruptores", "Accesorios", 
      "Limpieza interior"
    ],
    "CARPA": [
      "Recubrimiento", "Limpieza exterior", "Cables alimentación", "Accesorios", 
      "Limpieza interior", "Estado generador", "Mangueras", "Iluminarias", "Capas termicas"
    ],
    "CARROS": [
      "Chasis / Carcasa", "Limpieza exterior",
      "Limpieza interior", "Estado de ruedas", "Estado de frenos", "Lubricación", "Pernos y tuercas"
    ],
    "CHATAS": [
      "Chasis / Carcasa", "Limpieza exterior", "Cables alimentación", "Alarmas",  
      "Señales audibles", "Estado Pantalla/Display", "Estado Botones Interruptores", "Estado de sal",
      "Estado de detergente", "Sensores de nivel de Agua", "Estado Ablandador", "Parada de Emergencia"
    ],
    "ECOGRAFO": [
      "Chasis / Carcasa", "Limpieza exterior", "Cables alimentación", "Alarmas", 
      "Señales audibles", "Estado Pantalla/Display", "Estado Botones Interruptores", "Accesorios", 
      "Limpieza interior", "Estado de tranductores", "Limpieza de tranductores"
    ],
    "ELECTROVISTURI": [
      "Chasis / Carcasa", "Limpieza exterior", "Cables alimentación", "Alarmas", 
      "Estado Bateria", "Manguera PANI", "Manguito PANI", "Cable SPO2", 
      "Señales audibles", "Estado Pantalla/Display", "Estado Botones Interruptores", "Accesorios", 
      "Limpieza interior", "Calibración", "Cable ECG", "Estado de Palas", "Estado de Parches"
    ],
    "ESTERILIZACION": [
      "Chasis / Carcasa", "Limpieza exterior", "Cables alimentación", "Alarmas", 
      "Estado Bateria", "Manguera PANI", "Manguito PANI", "Cable SPO2", 
      "Señales audibles", "Estado Pantalla/Display", "Estado Botones Interruptores", "Accesorios", 
      "Limpieza interior", "Calibración", "Cable ECG", "Estado de Palas", "Estado de Parches"
    ],
    "GABINETE": [
      "Chasis / Carcasa", "Limpieza exterior", "Cables alimentación", "Alarmas", 
      "Señales audibles", "Accesorios", "Limpieza interior"
    ],
    "INCUBADORA": [
      "Chasis / Carcasa", "Limpieza exterior", "Cables alimentación", "Alarmas", 
      "Estado Bateria", "Cable SPO2", "Señales audibles", "Estado Pantalla/Display",
      "Estado Botones Interruptores", "Accesorios", 
      "Limpieza interior", "Calibración", "Estado de sellos", "Estado colochon"
    ],
    "MEDICIONES": [
      "Chasis / Carcasa", "Limpieza exterior", "Estado Pantalla/Display", 
      "Calibración", "Pilas / Baterias"
    ],
    "OPTICA": [
      "Chasis / Carcasa", "Limpieza exterior", "Cables alimentación", "Alarmas", 
      "Estado Bateria", "Manguera PANI", "Manguito PANI", "Cable SPO2", 
      "Señales audibles", "Estado Pantalla/Display", "Estado Botones Interruptores", "Accesorios", 
      "Limpieza interior", "Calibración", "Cable ECG", "Estado de Palas", "Estado de Parches"
    ],
    "PRESION": [
      "Chasis / Carcasa", "Limpieza exterior", "Cables alimentación", "Alarmas", 
      "Estado Bateria", "Manguera ", "Manguitos",
      "Señales audibles", "Estado Pantalla/Display", "Estado Botones Interruptores", "Accesorios",
      "Calibración"
    ],
    "REFRIGERACION": [
      "Chasis / Carcasa", "Limpieza exterior", "Cables alimentación", "Alarmas", 
      "Estado Bateria", "Señales audibles", "Estado Pantalla/Display",
      "Estado Botones Interruptores", "Limpieza interior", "Seteo temperaturas"
    ],
    "RX": [
      "Chasis / Carcasa", "Limpieza exterior", "Cables alimentación", "Alarmas", 
      "Estado Bateria", "Partes moviles", "Estado de ruedas",
      "Señales audibles", "Estado Pantalla/Display",
      "Estado Botones Interruptores", "Accesorios", "Calibración"
    ],
    "SELLADORA": [
      "Chasis / Carcasa", "Limpieza exterior", "Cables alimentación", "Alarmas", 
      "Señales audibles", "Estado Pantalla/Display", "Estado Botones Interruptores",
      "Limpieza interior", "Calibración"
    ],
    "TRASLADORAS": [
      "Chasis / Carcasa", "Limpieza exterior", 
      "Limpieza interior", "Estado de ruedas", "Estado de frenos",
      "Respaldo", "Estado colchon", "Estado Pistones", "Estado manillas", "Estado Barandas",
      "Estado de Bateria", "Controles / Perillas", "Indicadores / Display"
    ]
  },

  init() {
    this.equiposBase = [];
    this.perfilesBase = [];
    this.loadBaseDataOffline();

    this.initTheme();
    this.initOfflineSupport();
    this.renderPlaceholderChecklist();
    this.loadUnidades();

    // Inicializar manejador de fotos y firma (Chequeo General)
    this.photoManager = new PhotoManager("photos-container");
    this.signaturePad = new SignaturePad("signature-canvas");

    // Inicializar manejador de fotos y firma para Chequeo por Servicio (2 fotos por equipo)
    this.servicioPhotoManager = new PhotoManager("servicio-photos-container", 2, [
      "Foto 1: Frontal / General",
      "Foto 2: Placa / Detalle"
    ]);
    this.servicioSignaturePad = new SignaturePad("servicio-signature-canvas");

    // Configurar buscadores con autocompletado
    this.initAutocomplete();
    this.initServicioAutocomplete();
    this.renderPlaceholderServicioChecklist();

    // Verificar sesión previa guardada
    const savedUser = localStorage.getItem("eemm_user");
    if (savedUser) {
      try {
        this.setSession(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem("eemm_user");
        this.navigate("login");
      }
    } else {
      this.navigate("login");
    }

    // Manejador del botón de tema
    const themeBtn = document.getElementById("theme-toggle-btn");
    if (themeBtn) {
      themeBtn.addEventListener("click", () => {
        this.toggleTheme();
      });
    }

    // Cerrar menú desplegable de usuario al hacer clic fuera o presionar Escape
    document.addEventListener("click", (e) => {
      const wrapper = document.getElementById("user-dropdown-container");
      if (wrapper && wrapper.classList.contains("open") && !wrapper.contains(e.target)) {
        this.closeUserDropdown();
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        this.closeUserDropdown();
        this.closeChangePasswordModal();
        this.closeNewEquipmentModal();
      }
    });

    this.syncLocalRevisionesServicio();
  },

  /* ==========================================================================
     SOPORTE OFFLINE Y SINCRONIZACIÓN AUTOMÁTICA
     ========================================================================== */
  initOfflineSupport() {
    if (!window.OfflineManager) return;

    window.OfflineManager.init();

    // Actualizar badge de red cuando cambie el estado
    window.OfflineManager.onConnectionChange((isOnline) => {
      const badge = document.getElementById("network-status-badge");
      const text = document.getElementById("network-status-text");
      if (badge && text) {
        if (isOnline) {
          badge.className = "network-badge online";
          text.textContent = "En línea";
          badge.title = "Conexión a Internet activa";
          this.syncLocalRevisionesServicio();
        } else {
          badge.className = "network-badge offline";
          text.textContent = "Sin conexión";
          badge.title = "Modo sin conexión: los datos se guardarán localmente";
        }
      }
    });

    // Actualizar contador de pendientes
    window.OfflineManager.onQueueChange((count) => {
      const btnSync = document.getElementById("btn-sync-pending");
      const countEl = document.getElementById("sync-pending-count");
      if (btnSync && countEl) {
        countEl.textContent = count;
        btnSync.style.display = count > 0 ? "inline-flex" : "none";
      }
    });

    // Notificar cuando termine una sincronización automática
    window.OfflineManager.onSyncComplete(({ syncedCount, remainingCount }) => {
      this.showToast(`¡Sincronización completada! Se guardaron ${syncedCount} chequeo(s) en el servidor.`, "success");
      // Si estamos en la pestaña historial o admin, refrescarlos
      if (this.currentTab === "historial") {
        this.loadHistorial();
      } else if (this.currentTab === "admin") {
        this.loadAdminDashboard();
      }
    });
  },

  /* ==========================================================================
     SINCRONIZACIÓN DE REVISIONES GENERALES DE SERVICIO OFFLINE -> ONLINE
     ========================================================================== */
  async syncLocalRevisionesServicio() {
    try {
      const localRevs = JSON.parse(localStorage.getItem("local_revisiones_servicio") || "[]");
      if (!Array.isArray(localRevs) || localRevs.length === 0) return;

      let changed = false;
      for (const rev of localRevs) {
        if (!rev.id_revision) {
          try {
            const res = await fetch("/api/revisiones-servicio", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(rev)
            });
            if (res.ok) {
              const resJson = await res.json();
              if (resJson && resJson.id_revision) {
                rev.id_revision = resJson.id_revision;
                if (resJson.folio) rev.folio = resJson.folio;
                changed = true;
              }
            }
          } catch (e) {
            // Servidor posiblemente desconectado
            break;
          }
        }
      }

      if (changed) {
        localStorage.setItem("local_revisiones_servicio", JSON.stringify(localRevs));
        console.log("Revisiones de servicio locales sincronizadas con el servidor");
      }
    } catch (err) {
      console.warn("Error sincronizando revisiones de servicio offline:", err);
    }
  },

  async manualSync() {
    if (!window.OfflineManager) return;
    if (!window.OfflineManager.isOnline) {
      this.showToast("Aún no tienes conexión a Internet. Se sincronizará en cuanto recuperes señal.", "warning");
      return;
    }
    const count = await window.OfflineManager.getPendingCount();
    if (count === 0) {
      this.showToast("No hay registros pendientes de sincronización.", "info");
      await this.syncLocalRevisionesServicio();
      return;
    }
    this.showToast(`Sincronizando ${count} registro(s) con el servidor...`, "info");
    await window.OfflineManager.syncAll();
    await this.syncLocalRevisionesServicio();
  },

  async loadBaseDataOffline() {
    try {
      const resEq = await fetch("/static/data/equipos_base.json");
      if (resEq.ok) {
        this.equiposBase = await resEq.json();
      }
    } catch (e) {
      console.warn("Carga de equipos_base.json en segundo plano:", e);
    }

    // Incorporar equipos creados localmente/personalizados
    try {
      const customEq = JSON.parse(localStorage.getItem("eemm_custom_equipos") || "[]");
      if (customEq && Array.isArray(customEq) && customEq.length > 0) {
        if (!this.equiposBase) this.equiposBase = [];
        this.equiposBase = [...customEq, ...this.equiposBase];
      }
    } catch (e) {
      console.warn("Carga de eemm_custom_equipos:", e);
    }

    try {
      const resPerf = await fetch("/static/data/perfiles_base.json");
      if (resPerf.ok) {
        this.perfilesBase = await resPerf.json();
      }
    } catch (e) {
      console.warn("Carga de perfiles_base.json en segundo plano:", e);
    }
  },

  searchEquiposOffline(query) {
    if (!this.equiposBase || this.equiposBase.length === 0) return [];
    const q = query.toLowerCase().trim();
    const results = [];
    for (let i = 0; i < this.equiposBase.length; i++) {
      const eq = this.equiposBase[i];
      if (
        (eq.nombre && eq.nombre.toLowerCase().includes(q)) ||
        (eq.serie && eq.serie.toLowerCase().includes(q)) ||
        (eq.marca && eq.marca.toLowerCase().includes(q)) ||
        (eq.modelo && eq.modelo.toLowerCase().includes(q))
      ) {
        results.push(eq);
        if (results.length >= 15) break;
      }
    }
    return results;
  },

  /* ==========================================================================
     TEMA: Modo Claro / Modo Oscuro
     ========================================================================== */
  initTheme() {
    const savedTheme = localStorage.getItem("eemm_theme") || "light";
    this.applyTheme(savedTheme);
  },

  applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("eemm_theme", theme);
    const sunIcon = document.getElementById("theme-icon-sun");
    const moonIcon = document.getElementById("theme-icon-moon");

    if (theme === "dark") {
      if (sunIcon) sunIcon.style.display = "block";
      if (moonIcon) moonIcon.style.display = "none";
    } else {
      if (sunIcon) sunIcon.style.display = "none";
      if (moonIcon) moonIcon.style.display = "block";
    }

    // Actualizar elementos dentro del menú desplegable
    const ddSun = document.getElementById("dropdown-icon-sun");
    const ddMoon = document.getElementById("dropdown-icon-moon");
    const ddTitle = document.getElementById("dropdown-theme-title");
    const ddDesc = document.getElementById("dropdown-theme-desc");

    if (theme === "dark") {
      if (ddSun) ddSun.style.display = "block";
      if (ddMoon) ddMoon.style.display = "none";
      if (ddTitle) ddTitle.textContent = "Cambiar a Modo Claro";
      if (ddDesc) ddDesc.textContent = "Apariencia con fondo blanco";
    } else {
      if (ddSun) ddSun.style.display = "none";
      if (ddMoon) ddMoon.style.display = "block";
      if (ddTitle) ddTitle.textContent = "Cambiar a Modo Oscuro";
      if (ddDesc) ddDesc.textContent = "Apariencia nocturna descansada";
    }

    if (this.signaturePad) {
      this.signaturePad.updateStrokeStyle();
    }
  },

  toggleTheme() {
    const current = document.documentElement.getAttribute("data-theme") || "light";
    const next = current === "dark" ? "light" : "dark";
    this.applyTheme(next);
  },

  /* ==========================================================================
     NAVEGACIÓN SPA
     ========================================================================== */
  navigate(tabName) {
    if (!this.currentUser && tabName !== "login") {
      tabName = "login";
    }

    this.activeTab = tabName;

    // Ocultar todas las vistas
    const views = ["login", "modulo-selector", "chequeo", "chequeo-servicio", "historial", "equipos", "admin", "inventario"];
    views.forEach((v) => {
      const el = document.getElementById(`view-${v}`);
      if (el) el.style.display = v === tabName ? "block" : "none";
    });

    const appNav = document.getElementById("app-nav");
    if (tabName === "login" || tabName === "modulo-selector") {
      if (appNav) appNav.style.display = "none";
    } else if (this.currentUser) {
      if (appNav) appNav.style.display = "flex";
      // Mantener sincronizado el módulo activo según la pestaña navegada
      if (tabName === "inventario") {
        this.currentModule = "bodega";
      } else if (tabName === "chequeo" || tabName === "chequeo-servicio" || tabName === "historial" || tabName === "equipos") {
        this.currentModule = "chequeo";
      }
      this.updateModuleSwitcherUI();
    }

    // Actualizar tabs activas en la barra
    document.querySelectorAll(".nav-tab").forEach((tab) => {
      if (tab.dataset.tab === tabName) {
        tab.classList.add("active");
      } else {
        tab.classList.remove("active");
      }
    });

    // Cargar datos según la vista
    if (tabName === "historial") {
      this.refreshCurrentHistorialTab();
    } else if (tabName === "equipos") {
      this.loadEquiposCatalog();
    } else if (tabName === "admin") {
      this.loadAdminDashboard();
    } else if (tabName === "inventario") {
      this.loadInventario();
    } else if (tabName === "chequeo" && this.signaturePad) {
      // Reajustar canvas para tamaño correcto
      setTimeout(() => this.signaturePad.initCanvas(), 100);
    } else if (tabName === "chequeo-servicio") {
      this.loadChequeoServicio();
      if (this.servicioSignaturePad) {
        setTimeout(() => this.servicioSignaturePad.initCanvas(), 100);
      }
    }
  },

  /* ==========================================================================
     AUTENTICACIÓN POR RUT Y CONTRASEÑA
     ========================================================================== */
  formatRutInput(input) {
    let val = input.value.replace(/[^0-9kK]/g, "");
    if (!val) { input.value = ""; return; }
    let dv = val.slice(-1);
    let rut = val.slice(0, -1);
    if (rut.length > 0) {
      rut = rut.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
      input.value = `${rut}-${dv}`;
    } else {
      input.value = val;
    }
  },

  async handleLogin(e) {
    e.preventDefault();
    const rutInput = document.getElementById("login-rut").value.trim();
    const passInput = document.getElementById("login-pass").value;

    const btn = document.getElementById("btn-submit-login");
    btn.disabled = true;
    btn.textContent = "Verificando credenciales...";

    try {
      let data = null;
      try {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rut: rutInput, password: passInput })
        });

        if (res.ok) {
          data = await res.json();
          // Guardar perfil en almacenamiento local para futuros accesos offline
          if (window.OfflineManager) {
            window.OfflineManager.cacheData("cached_user_" + rutInput.replace(/[^0-9kK]/g, "").toUpperCase(), data.user);
          }
        } else {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.detail || "RUT o contraseña incorrectos");
        }
      } catch (netErr) {
        // Si el error fue de credenciales incorrectas devueltas por el servidor, relanzarlo
        if (netErr.message && netErr.message.includes("incorrectos")) {
          throw netErr;
        }

        // Si fue un fallo de conexión, validar contra perfiles base locales
        const cleanRut = rutInput.replace(/[^0-9kK]/g, "").toUpperCase();
        const localProfiles = this.perfilesBase || [
          { nombre: "Administrador General", rut: "20.967.660-5", correo: "admin@eemm.cl", password: "4277", funcion: "Jefe de Servicio", tecnico: "Administrador del Sistema", rol: "administrador" },
          { nombre: "Patricio Bustamante", rut: "18.123.456-7", correo: "patriciobustamante.ec@gmail.com", password: "1234", funcion: "Tecnico EEMM", tecnico: "Patricio Bustamante", rol: "tecnico" },
          { nombre: "Martin Peralta", rut: "17.234.567-8", correo: "martin.peralta@gmail.com", password: "1234", funcion: "Tecnico EEMM", tecnico: "Martin Peralta", rol: "tecnico" },
          { nombre: "Luis Vallejos", rut: "16.345.678-9", correo: "equiposmedicos1.@gmail.com", password: "1234", funcion: "Tecnico EEMM", tecnico: "Luis Vallejos", rol: "tecnico" },
          { nombre: "Jorge Ambrosetti", rut: "15.456.789-0", correo: "jambrosettic@gmail.com", password: "1234", funcion: "Tecnico EEMM", tecnico: "Jorge Ambrosetti", rol: "tecnico" }
        ];

        const match = localProfiles.find(p => 
          (p.rut || "").replace(/[^0-9kK]/g, "").toUpperCase() === cleanRut && p.password === passInput
        );

        if (match) {
          data = {
            user: {
              id: match.id || 1,
              nombre: match.nombre,
              rut: match.rut,
              correo: match.correo,
              funcion: match.funcion,
              tecnico: match.tecnico,
              rol: match.rol
            }
          };
          this.showToast("Acceso concedido en modo local (Sin conexión)", "info");
        } else {
          throw new Error("Sin conexión a Internet y credenciales no reconocidas localmente");
        }
      }

      this.setSession(data.user);
      this.showToast(`Bienvenido/a, ${data.user.nombre} (${data.user.rol})`, "success");
    } catch (err) {
      this.showToast(err.message, "error");
    } finally {
      btn.disabled = false;
      btn.textContent = "Ingresar al Sistema";
    }
  },

  setSession(user) {
    this.currentUser = user;
    localStorage.setItem("eemm_user", JSON.stringify(user));

    // Mostrar menú desplegable de usuario y ocultar botón de tema aislado
    const ddContainer = document.getElementById("user-dropdown-container");
    if (ddContainer) ddContainer.style.display = "inline-block";

    const themeToggleBtn = document.getElementById("theme-toggle-btn");
    if (themeToggleBtn) themeToggleBtn.style.display = "none";

    // Actualizar datos del disparador (Trigger)
    const initials = (user.nombre || user.tecnico || "U").charAt(0).toUpperCase();
    const initialsEl = document.getElementById("user-avatar-initials");
    if (initialsEl) initialsEl.textContent = initials;

    const nameEl = document.getElementById("header-user-name");
    if (nameEl) nameEl.textContent = user.tecnico || user.nombre;

    const roleBadge = document.getElementById("header-user-role");
    if (roleBadge) {
      roleBadge.textContent = user.rol === "administrador" ? "Admin" : "Técnico";
      roleBadge.className = `badge ${user.rol === "administrador" ? "badge-admin" : "badge-tecnico"}`;
    }

    // Actualizar datos dentro del Menú Desplegable
    const ddInitials = document.getElementById("dropdown-avatar-initials");
    if (ddInitials) ddInitials.textContent = initials;

    const ddFullname = document.getElementById("dropdown-user-fullname");
    if (ddFullname) ddFullname.textContent = user.nombre || user.tecnico || "Usuario";

    const ddRut = document.getElementById("dropdown-user-rut");
    if (ddRut) ddRut.textContent = user.rut ? `RUT: ${user.rut}` : "RUT: No asignado";

    const ddRoleBadge = document.getElementById("dropdown-user-role-badge");
    if (ddRoleBadge) {
      ddRoleBadge.textContent = user.rol === "administrador" ? "Administrador" : "Técnico EEMM";
      ddRoleBadge.className = `badge ${user.rol === "administrador" ? "badge-admin" : "badge-tecnico"}`;
    }

    // Cargar módulo preferido o por defecto
    const savedModule = localStorage.getItem("eemm_current_module");
    if (savedModule === "bodega" || savedModule === "chequeo") {
      this.currentModule = savedModule;
    } else {
      this.currentModule = "chequeo";
    }

    // Personalizar saludo del selector de módulos
    const greetingEl = document.getElementById("module-selector-greeting");
    if (greetingEl) {
      const name = user.tecnico || user.nombre || "Técnico";
      greetingEl.textContent = `Bienvenido/a, ${name}`;
    }

    // Banner de administración en selector de módulos
    const adminCard = document.getElementById("module-selector-admin-card");
    if (adminCard) {
      adminCard.style.display = user.rol === "administrador" ? "flex" : "none";
    }

    // Pestaña Admin visible solo si rol === 'administrador'
    const adminTab = document.getElementById("nav-tab-admin");
    if (adminTab) {
      adminTab.style.display = user.rol === "administrador" ? "flex" : "none";
    }

    // Sincronizar botones de cambio de módulo
    this.updateModuleSwitcherUI();

    // Badge técnico en formulario
    const formTecnicoBadge = document.getElementById("chequeo-tecnico-badge");
    if (formTecnicoBadge) formTecnicoBadge.textContent = user.tecnico || user.nombre;

    // Ir siempre al Sub-Menú Selector de Módulos al iniciar sesión
    this.navigate("modulo-selector");
  },

  logout() {
    this.closeUserDropdown();
    this.currentUser = null;
    localStorage.removeItem("eemm_user");

    const ddContainer = document.getElementById("user-dropdown-container");
    if (ddContainer) ddContainer.style.display = "none";

    const themeToggleBtn = document.getElementById("theme-toggle-btn");
    if (themeToggleBtn) themeToggleBtn.style.display = "inline-flex";

    document.getElementById("app-nav").style.display = "none";
    this.navigate("login");
    this.showToast("Has cerrado sesión.", "info");
  },

  /* ==========================================================================
     MENÚ DESPLEGABLE DE USUARIO Y CAMBIO DE CONTRASEÑA
     ========================================================================== */
  toggleUserDropdown(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const wrapper = document.getElementById("user-dropdown-container");
    if (!wrapper) return;
    const isOpen = wrapper.classList.contains("open");
    if (isOpen) {
      this.closeUserDropdown();
    } else {
      wrapper.classList.add("open");
      const btn = document.getElementById("user-dropdown-btn");
      if (btn) btn.setAttribute("aria-expanded", "true");
    }
  },

  closeUserDropdown() {
    const wrapper = document.getElementById("user-dropdown-container");
    if (wrapper) {
      wrapper.classList.remove("open");
      const btn = document.getElementById("user-dropdown-btn");
      if (btn) btn.setAttribute("aria-expanded", "false");
    }
  },

  openChangePasswordModal() {
    this.closeUserDropdown();
    const modal = document.getElementById("modal-change-password");
    if (!modal) return;
    const form = document.getElementById("form-change-password");
    if (form) form.reset();
    modal.classList.add("active");
    setTimeout(() => {
      const input = document.getElementById("cp-current-password");
      if (input) input.focus();
    }, 100);
  },

  closeChangePasswordModal() {
    const modal = document.getElementById("modal-change-password");
    if (modal) modal.classList.remove("active");
  },

  async submitChangePassword(e) {
    e.preventDefault();
    if (!this.currentUser) {
      this.showToast("Debes iniciar sesión para realizar esta acción.", "error");
      return;
    }

    const currentPwd = document.getElementById("cp-current-password").value;
    const newPwd = document.getElementById("cp-new-password").value;
    const confirmPwd = document.getElementById("cp-confirm-password").value;

    if (!currentPwd || !newPwd || !confirmPwd) {
      this.showToast("Por favor completa todos los campos requeridos.", "warning");
      return;
    }

    if (newPwd.length < 4) {
      this.showToast("La nueva contraseña debe tener al menos 4 caracteres.", "warning");
      return;
    }

    if (newPwd !== confirmPwd) {
      this.showToast("Las nuevas contraseñas no coinciden.", "warning");
      return;
    }

    const submitBtn = document.getElementById("btn-submit-change-password");
    submitBtn.disabled = true;
    submitBtn.textContent = "Actualizando...";

    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: this.currentUser.id,
          current_password: currentPwd,
          new_password: newPwd
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Error al actualizar la contraseña");
      }

      // Actualizar también la contraseña en memoria y en perfilesBase si existe
      if (this.perfilesBase && Array.isArray(this.perfilesBase)) {
        const pIndex = this.perfilesBase.findIndex(p => p.id === this.currentUser.id);
        if (pIndex !== -1) {
          this.perfilesBase[pIndex].password = newPwd;
          if (window.OfflineManager) {
            window.OfflineManager.cacheData("perfiles_base", this.perfilesBase);
          }
        }
      }

      this.closeChangePasswordModal();
      this.showToast("¡Contraseña actualizada exitosamente!", "success");
    } catch (err) {
      console.error("Error al cambiar contraseña:", err);
      this.showToast(err.message || "Error al actualizar la contraseña", "error");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Actualizar Contraseña";
    }
  },

  /* ==========================================================================
     GESTIÓN DE MÓDULOS (CHEQUEO & EQUIPOS vs BODEGA & INSUMOS)
     ========================================================================== */
  selectModule(moduleName, targetTab) {
    this.currentModule = moduleName;
    localStorage.setItem("eemm_current_module", moduleName);
    this.updateModuleSwitcherUI();

    // Mostrar barra de navegación adaptada
    const appNav = document.getElementById("app-nav");
    if (appNav) appNav.style.display = "flex";

    // Navegar a la pestaña solicitada dentro del módulo
    if (targetTab) {
      this.navigate(targetTab);
    } else {
      if (moduleName === "bodega") {
        this.navigate("inventario");
      } else {
        this.navigate("chequeo");
      }
    }
  },

  toggleModuleSwitch() {
    this.closeUserDropdown();
    if (this.currentModule === "bodega") {
      this.selectModule("chequeo", "chequeo");
      this.showToast("Cambiado a Módulo Chequeos y Equipos", "info");
    } else {
      this.selectModule("bodega", "inventario");
      this.showToast("Cambiado a Módulo Bodega e Insumos", "info");
    }
  },

  goToModuleSelector() {
    this.closeUserDropdown();
    const appNav = document.getElementById("app-nav");
    if (appNav) appNav.style.display = "none";
    this.navigate("modulo-selector");
  },

  updateModuleSwitcherUI() {
    const isBodega = this.currentModule === "bodega";

    // 1. Grupos de pestañas en la barra superior
    const tabsChequeo = document.getElementById("nav-tabs-chequeo");
    const tabsBodega = document.getElementById("nav-tabs-bodega");
    if (tabsChequeo) tabsChequeo.style.display = isBodega ? "none" : "flex";
    if (tabsBodega) tabsBodega.style.display = isBodega ? "flex" : "none";

    // 2. Botón de conmutación rápida en la barra de navegación
    const navSwitchLabel = document.getElementById("nav-switch-label");
    if (navSwitchLabel) {
      navSwitchLabel.textContent = isBodega ? "Ir a Chequeos 🩺" : "Ir a Bodega 📦";
    }

    // 3. Botón de conmutación dentro del Menú Desplegable de Usuario
    const ddTitle = document.getElementById("dropdown-module-switch-title");
    const ddDesc = document.getElementById("dropdown-module-switch-desc");
    const iconToBodega = document.getElementById("dropdown-icon-to-bodega");
    const iconToChequeo = document.getElementById("dropdown-icon-to-chequeo");

    if (isBodega) {
      if (ddTitle) ddTitle.textContent = "Cambiar a Módulo Chequeo";
      if (ddDesc) ddDesc.textContent = "Nuevo Chequeo, Historial y Equipos";
      if (iconToBodega) iconToBodega.style.display = "none";
      if (iconToChequeo) iconToChequeo.style.display = "inline-block";
    } else {
      if (ddTitle) ddTitle.textContent = "Cambiar a Módulo Bodega";
      if (ddDesc) ddDesc.textContent = "Equipos de Bodega, Insumos y Racks";
      if (iconToBodega) iconToBodega.style.display = "inline-block";
      if (iconToChequeo) iconToChequeo.style.display = "none";
    }
  },

  /* ==========================================================================
     CATÁLOGOS: Unidades & Checklist
     ========================================================================== */
  async loadUnidades() {
    try {
      let unidades = [];
      try {
        const res = await fetch("/api/unidades");
        if (res.ok) {
          unidades = await res.json();
          if (window.OfflineManager) {
            window.OfflineManager.cacheData("unidades", unidades);
          }
        }
      } catch (netErr) {
        // Fallback a caché local si estamos sin conexión
        if (window.OfflineManager) {
          unidades = (await window.OfflineManager.getCachedData("unidades")) || [];
        }
      }

      // Si aún está vacío (primera carga sin red), usar catálogo hospitalario de respaldo
      if (!unidades || unidades.length === 0) {
        unidades = [
          "URGENCIA", "PABELLONES-QUIRURGICOS", "UPC", "ATENCION-OBSTETRICA",
          "GINECOLOGIA-Y-OBSTETRICIA", "LABORATORIO", "AISLAMIENTO",
          "MEDICO-QUIRURGICA-ADULTO", "MEDICO-QUIRURGICA-PEDIATRICA",
          "DIALISIS", "KINESIOTERAPIA-Y-REHABILITACION", "PARTOS",
          "PATOLOGICA(MORGUE)", "SOCIO-SANITARIO", "CIRUGIA-MENOR", "GES"
        ];
      }
      
      const select = document.getElementById("select-unidad");
      const filtro = document.getElementById("filtro-historial-unidad");
      const selectServicio = document.getElementById("select-servicio-clinico");
      if (select) select.innerHTML = '<option value="">-- Seleccionar Servicio / Unidad --</option>';
      if (filtro) filtro.innerHTML = '<option value="">Todas las Unidades</option>';
      if (selectServicio) selectServicio.innerHTML = '<option value="">-- Selecciona el Servicio Clínico --</option>';
      
      unidades.forEach((u) => {
        if (select) {
          const opt = document.createElement("option");
          opt.value = u;
          opt.textContent = u;
          select.appendChild(opt);
        }
        if (filtro) {
          const opt2 = document.createElement("option");
          opt2.value = u;
          opt2.textContent = u;
          filtro.appendChild(opt2);
        }
        if (selectServicio) {
          const opt3 = document.createElement("option");
          opt3.value = u;
          opt3.textContent = u;
          selectServicio.appendChild(opt3);
        }
      });

      if (selectServicio && this.selectedServicioClinico) {
        selectServicio.value = this.selectedServicioClinico;
      }
    } catch (e) {
      console.error("Error cargando unidades:", e);
    }
  },

  renderPlaceholderChecklist() {
    this.currentCategory = null;
    this.currentChecklistItems = [];
    this.checklistValues = {};

    const badge = document.getElementById("checklist-category-badge");
    if (badge) {
      badge.textContent = "Sin equipo seleccionado";
      badge.className = "badge";
    }

    const hint = document.getElementById("checklist-count-hint");
    if (hint) hint.textContent = "";

    const container = document.getElementById("checklist-container");
    if (!container) return;
    container.innerHTML = `
      <div style="grid-column: 1 / -1; padding: 1.5rem 1rem; text-align: center; color: var(--text-tertiary); background: var(--bg-subtle); border: 1px dashed var(--border); border-radius: var(--radius-md); font-size: 0.825rem;">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin: 0 auto 6px; display: block; opacity: 0.5;"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
        Selecciona un equipo médico en el buscador para cargar automáticamente su pauta de revisión
      </div>
    `;
  },

  resolveCategory(cat) {
    if (!cat) return "GENERAL";
    let clean = cat.toString().trim().toUpperCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (this.pautasPorCategoria[clean]) return clean;
    if (clean === "OPTICAS") return "OPTICA";
    if (clean === "CENTRIFUGA") return "LABORATORIO";
    if (clean === "REABILITACION") return "GENERAL";
    return "GENERAL";
  },

  setCategory(cat) {
    const resolved = this.resolveCategory(cat);
    this.currentCategory = resolved;

    const badge = document.getElementById("checklist-category-badge");
    if (badge) {
      badge.textContent = resolved;
      badge.className = "badge badge-tecnico";
    }

    this.currentChecklistItems = this.pautasPorCategoria[resolved] || this.pautasPorCategoria["GENERAL"];

    const hint = document.getElementById("checklist-count-hint");
    if (hint) {
      hint.textContent = `${this.currentChecklistItems.length} puntos de revisión`;
    }

    this.renderChecklist();
  },

  renderChecklist() {
    const container = document.getElementById("checklist-container");
    if (!container) return;
    container.innerHTML = "";
    this.checklistValues = {};

    this.currentChecklistItems.forEach((item, idx) => {
      this.checklistValues[idx] = "OK"; // Por defecto OK

      const row = document.createElement("div");
      row.className = "checklist-item";
      row.innerHTML = `
        <span class="checklist-label">${idx + 1}. ${item}</span>
        <div class="toggle-group" data-index="${idx}">
          <button type="button" class="toggle-btn active-ok" data-val="OK">OK</button>
          <button type="button" class="toggle-btn" data-val="NO">NO</button>
          <button type="button" class="toggle-btn" data-val="NA">N/A</button>
        </div>
      `;

      const buttons = row.querySelectorAll(".toggle-btn");
      buttons.forEach((b) => {
        b.addEventListener("click", () => {
          buttons.forEach((btn) => btn.className = "toggle-btn");
          const val = b.dataset.val;
          this.checklistValues[idx] = val;
          if (val === "OK") b.classList.add("active-ok");
          else if (val === "NO") b.classList.add("active-no");
          else b.classList.add("active-na");
        });
      });

      container.appendChild(row);
    });
  },

  /* ==========================================================================
     BUSCADOR Y AUTOCOMPLETADO DE EQUIPOS (2.553 Equipos)
     ========================================================================== */
  initAutocomplete() {
    const input = document.getElementById("input-equipo-search");
    const dropdown = document.getElementById("autocomplete-list");

    input.addEventListener("input", () => {
      clearTimeout(this.debounceTimers.equipos);
      const val = input.value.trim();

      if (val.length < 2) {
        dropdown.style.display = "none";
        return;
      }

      this.debounceTimers.equipos = setTimeout(async () => {
        let equipos = [];
        // Si hay conexión activa, intentar buscar en el servidor
        if (window.OfflineManager && window.OfflineManager.isOnline) {
          try {
            const res = await fetch(`/api/equipos?q=${encodeURIComponent(val)}&limit=15`);
            if (res.ok) equipos = await res.json();
          } catch (e) {
            // Fallback a búsqueda local si la red falla
          }
        }

        // Si estamos sin conexión o el servidor no respondió, buscar en el catálogo local de 2.553 equipos
        if (!equipos || equipos.length === 0) {
          equipos = this.searchEquiposOffline(val);
        }

        this.renderAutocomplete(equipos, dropdown);
      }, 150);
    });

    // Cerrar al hacer clic fuera
    document.addEventListener("click", (e) => {
      if (!input.contains(e.target) && !dropdown.contains(e.target)) {
        dropdown.style.display = "none";
      }
    });
  },

  renderAutocomplete(equipos, dropdown) {
    if (equipos.length === 0) {
      dropdown.innerHTML = `<div style="padding:0.75rem; text-align:center; color:var(--text-muted); font-size:0.8rem;">No se encontraron equipos</div>`;
      dropdown.style.display = "block";
      return;
    }

    dropdown.innerHTML = "";
    equipos.forEach((eq) => {
      const item = document.createElement("div");
      item.className = "autocomplete-item";
      item.innerHTML = `
        <div class="autocomplete-item-title">${eq.nombre}</div>
        <div class="autocomplete-item-meta">
          <span><strong>Marca:</strong> ${eq.marca || "S/M"}</span>
          <span><strong>Modelo:</strong> ${eq.modelo || "S/M"}</span>
          <span><strong>Serie:</strong> ${eq.serie || "S/N"}</span>
          <span><strong>Cat:</strong> ${eq.categoria || "-"}</span>
        </div>
      `;

      item.onclick = () => {
        this.selectEquipment(eq);
        dropdown.style.display = "none";
      };

      dropdown.appendChild(item);
    });

    dropdown.style.display = "block";
  },

  selectEquipment(eq) {
    this.selectedEquipment = eq;
    document.getElementById("input-equipo-search").value = eq.nombre;

    // Mostrar strip preview
    const preview = document.getElementById("selected-equipment-card");
    document.getElementById("preview-nombre").textContent = eq.nombre;
    const marcaModelo = [eq.marca, eq.modelo].filter(Boolean).join(" · ") || "Sin marca/modelo";
    const mmEl = document.getElementById("preview-marca-modelo");
    if (mmEl) mmEl.textContent = marcaModelo;
    document.getElementById("preview-serie").textContent = eq.serie || "S/N";
    document.getElementById("preview-categoria").textContent = eq.categoria || "General";
    document.getElementById("preview-estado").textContent = eq.estado || "Operativo";

    preview.style.display = "grid";

    // Auto-ajustar pauta preventiva a la categoría del equipo
    this.setCategory(eq.categoria);
  },

  clearSignature() {
    if (this.signaturePad) {
      this.signaturePad.clear();
    }
  },

  resetChequeoForm() {
    this.selectedEquipment = null;
    document.getElementById("input-equipo-search").value = "";
    document.getElementById("selected-equipment-card").style.display = "none";
    document.getElementById("select-unidad").value = "";
    document.getElementById("input-obs").value = "";
    document.getElementById("input-firma-nombre").value = "";
    this.renderPlaceholderChecklist();
    if (this.photoManager) this.photoManager.clearAll();
    if (this.signaturePad) this.signaturePad.clear();
  },

  /* ==========================================================================
     ENVÍO DE CHEQUEO PREVENTIVO
     ========================================================================== */
  async submitChequeo(e) {
    e.preventDefault();

    if (!this.selectedEquipment) {
      this.showToast("Por favor selecciona un equipo médico de la lista.", "error");
      document.getElementById("input-equipo-search").focus();
      return;
    }

    const unidad = document.getElementById("select-unidad").value;
    if (!unidad) {
      this.showToast("Por favor selecciona la unidad o servicio hospitalario.", "error");
      document.getElementById("select-unidad").focus();
      return;
    }

    // Validar firma
    if (this.signaturePad.isEmpty()) {
      this.showToast("Por favor dibuja la firma digital de recepción antes de guardar.", "error");
      return;
    }

    const submitBtn = document.getElementById("btn-submit-chequeo");
    submitBtn.disabled = true;
    submitBtn.innerHTML = "Guardando chequeo...";

    try {
      // Recopilar respuestas según los ítems de la pauta activa
      const respuestas = this.currentChecklistItems.map((item, idx) => ({
        item: item,
        val: this.checklistValues[idx] || "OK"
      }));

      // Fotos y Firma
      const fotos = this.photoManager.getPhotos().filter(Boolean);
      const firma = this.signaturePad.toDataURL();
      const firmaNombre = document.getElementById("input-firma-nombre").value.trim();

      const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
      const payload = {
        usuario: this.currentUser ? (this.currentUser.tecnico || this.currentUser.nombre) : "Técnico",
        nombre_equipo: this.selectedEquipment.nombre,
        marca: this.selectedEquipment.marca || "",
        modelo: this.selectedEquipment.modelo || "",
        serie: this.selectedEquipment.serie || "",
        unidad: unidad,
        categoria: this.currentCategory || "GENERAL",
        respuestas: respuestas,
        obs: document.getElementById("input-obs").value.trim(),
        fotos: fotos,
        firma: firma,
        firma_nombre: firmaNombre,
        fecha: nowStr
      };

      const extraInfo = {
        nombre_equipo: payload.nombre_equipo,
        marca: payload.marca,
        modelo: payload.modelo,
        serie: payload.serie,
        unidad: payload.unidad,
        categoria: payload.categoria,
        usuario: payload.usuario,
        fecha: payload.fecha,
        fotosCount: fotos.length,
        hasFirma: !!firma
      };

      // Si estamos sin conexión, guardar directamente en la base de datos local
      if (window.OfflineManager && !window.OfflineManager.isOnline) {
        await window.OfflineManager.queueRequest("chequeo", "/api/chequeos", "POST", payload, extraInfo);
        this.showToast("💾 Chequeo guardado localmente (Sin conexión). Se sincronizará automáticamente al recuperar señal.", "warning");
        this.resetChequeoForm();
        this.navigate("historial");
        return;
      }

      // Si parece online, intentar enviar por red
      try {
        const res = await fetch("/api/chequeos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        if (!res.ok) {
          throw new Error("Error en el servidor al registrar chequeo");
        }

        const result = await res.json();
        this.showToast("¡Chequeo preventivo guardado exitosamente!", "success");
        this.resetChequeoForm();
        this.navigate("historial");

      } catch (netErr) {
        // Si falló por corte repentino de red, guardar en cola local
        console.warn("Fallo de conexión al enviar chequeo, guardando localmente:", netErr);
        if (window.OfflineManager) {
          await window.OfflineManager.queueRequest("chequeo", "/api/chequeos", "POST", payload, extraInfo);
          this.showToast("💾 Sin conexión: El chequeo quedó guardado localmente y se subirá automáticamente.", "warning");
          this.resetChequeoForm();
          this.navigate("historial");
        } else {
          throw netErr;
        }
      }

    } catch (err) {
      console.error(err);
      this.showToast(err.message || "Error al registrar el chequeo preventivo", "error");
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
        Registrar Chequeo Preventivo
      `;
    }
  },

  /* ==========================================================================
     CHEQUEO POR SERVICIO CLÍNICO (Por Lote y Reporte Consolidado)
     ========================================================================== */
  loadChequeoServicio() {
    const badge = document.getElementById("servicio-tecnico-badge");
    if (badge && this.currentUser) {
      badge.textContent = this.currentUser.nombre;
    }
    this.renderServicioBatchUI();
    if (this.servicioSignaturePad) {
      setTimeout(() => this.servicioSignaturePad.initCanvas(), 100);
    }
  },

  onServicioClinicoChange() {
    const select = document.getElementById("select-servicio-clinico");
    const newService = select ? select.value.trim() : "";

    if (this.servicioBatchEquipos.length > 0 && this.selectedServicioClinico && newService !== this.selectedServicioClinico) {
      const confirmChange = confirm(
        `Tienes ${this.servicioBatchEquipos.length} equipo(s) acumulados en la revisión activa de "${this.selectedServicioClinico}".\n\n¿Deseas cambiar de servicio y reiniciar la revisión actual?`
      );
      if (!confirmChange) {
        if (select) select.value = this.selectedServicioClinico;
        return;
      }
      this.servicioBatchEquipos = [];
    }

    this.selectedServicioClinico = newService;
    this.renderServicioBatchUI();
  },

  initServicioAutocomplete() {
    const input = document.getElementById("input-servicio-equipo-search");
    const dropdown = document.getElementById("servicio-autocomplete-list");
    if (!input || !dropdown) return;

    input.addEventListener("input", () => {
      clearTimeout(this.debounceTimers.servicioEquipos);
      const val = input.value.trim();

      if (val.length < 2) {
        dropdown.style.display = "none";
        return;
      }

      this.debounceTimers.servicioEquipos = setTimeout(async () => {
        let equipos = [];
        if (window.OfflineManager && window.OfflineManager.isOnline) {
          try {
            const res = await fetch(`/api/equipos?q=${encodeURIComponent(val)}&limit=15`);
            if (res.ok) equipos = await res.json();
          } catch (e) {
            // fallback
          }
        }

        if (!equipos || equipos.length === 0) {
          equipos = this.searchEquiposOffline(val);
        }

        this.renderServicioAutocomplete(equipos, dropdown);
      }, 150);
    });

    document.addEventListener("click", (e) => {
      if (!input.contains(e.target) && !dropdown.contains(e.target)) {
        dropdown.style.display = "none";
      }
    });
  },

  renderServicioAutocomplete(equipos, dropdown) {
    dropdown.innerHTML = "";
    if (!equipos || equipos.length === 0) {
      const item = document.createElement("div");
      item.className = "autocomplete-item";
      item.style.color = "var(--text-tertiary)";
      item.textContent = "No se encontraron equipos coincidentes";
      dropdown.appendChild(item);
      dropdown.style.display = "block";
      return;
    }

    equipos.slice(0, 10).forEach((eq) => {
      const item = document.createElement("div");
      item.className = "autocomplete-item";
      const serie = eq.serie ? String(eq.serie).trim() : "S/N";
      const marca = eq.marca ? String(eq.marca).trim() : "";
      const modelo = eq.modelo ? String(eq.modelo).trim() : "";
      const infoMarcaModelo = [marca, modelo].filter(Boolean).join(" - ");

      item.innerHTML = `
        <div class="ac-title">${eq.nombre || "Equipo Médico"}</div>
        <div class="ac-meta">
          <span>${infoMarcaModelo || "Sin marca/modelo"}</span>
          <span>•</span>
          <span style="font-family: var(--font-mono); color: var(--primary);">Serie: ${serie}</span>
          <span>•</span>
          <span class="badge" style="font-size: 0.65rem;">${eq.categoria || "GENERAL"}</span>
        </div>
      `;

      item.addEventListener("click", () => {
        this.selectServicioEquipment(eq);
        dropdown.style.display = "none";
      });

      dropdown.appendChild(item);
    });

    dropdown.style.display = "block";
  },

  selectServicioEquipment(equipo) {
    this.servicioSelectedEquipment = equipo;

    const input = document.getElementById("input-servicio-equipo-search");
    if (input) input.value = `${equipo.nombre} (S/N: ${equipo.serie || "S/N"})`;

    const card = document.getElementById("servicio-selected-equipment-card");
    if (card) {
      document.getElementById("servicio-preview-nombre").textContent = equipo.nombre || "-";
      document.getElementById("servicio-preview-marca-modelo").textContent = `${equipo.marca || ""} ${equipo.modelo || ""}`.trim() || "-";
      document.getElementById("servicio-preview-serie").textContent = equipo.serie || "S/N";
      document.getElementById("servicio-preview-categoria").textContent = equipo.categoria || "GENERAL";
      document.getElementById("servicio-preview-estado").textContent = equipo.estado || "Operativo";
      card.style.display = "grid";
    }

    // Cargar pauta preventiva por categoría
    this.renderServicioChecklist(equipo.categoria || "GENERAL");
  },

  renderServicioChecklist(categoria) {
    this.servicioCurrentCategory = categoria;
    const cat = categoria ? categoria.toUpperCase() : "GENERAL";
    const items = this.pautasPorCategoria[cat] || this.pautasPorCategoria["GENERAL"] || [];

    const badge = document.getElementById("servicio-checklist-category-badge");
    if (badge) {
      badge.textContent = cat;
      badge.className = "badge badge-primary";
    }

    const hint = document.getElementById("servicio-checklist-count-hint");
    if (hint) {
      hint.textContent = `${items.length} puntos técnicos verificados`;
    }

    const container = document.getElementById("servicio-checklist-container");
    if (!container) return;

    container.innerHTML = "";
    this.servicioChecklistValues = {};

    items.forEach((item, idx) => {
      this.servicioChecklistValues[item] = "OK";

      const div = document.createElement("div");
      div.className = "checklist-item checked-ok";

      div.innerHTML = `
        <label class="custom-checkbox" style="flex: 1; cursor: pointer;">
          <input type="checkbox" id="chk-srv-${idx}" checked>
          <span class="chk-label" style="font-size: 0.8rem; font-weight: 500;">${item}</span>
        </label>
        <span class="chk-status" id="chk-srv-status-${idx}" style="font-size: 0.72rem; color: var(--success); font-weight: 600;">OK</span>
      `;

      const inputChk = div.querySelector(`#chk-srv-${idx}`);
      const statusSpan = div.querySelector(`#chk-srv-status-${idx}`);

      inputChk.addEventListener("change", (e) => {
        if (e.target.checked) {
          this.servicioChecklistValues[item] = "OK";
          div.className = "checklist-item checked-ok";
          statusSpan.textContent = "OK";
          statusSpan.style.color = "var(--success)";
        } else {
          this.servicioChecklistValues[item] = "NO_CONFORME";
          div.className = "checklist-item checked-nok";
          statusSpan.textContent = "OBSERVADO";
          statusSpan.style.color = "var(--danger)";
        }
      });

      container.appendChild(div);
    });
  },

  renderPlaceholderServicioChecklist() {
    this.servicioCurrentCategory = null;
    this.servicioChecklistValues = {};

    const badge = document.getElementById("servicio-checklist-category-badge");
    if (badge) {
      badge.textContent = "Sin equipo seleccionado";
      badge.className = "badge";
    }

    const hint = document.getElementById("servicio-checklist-count-hint");
    if (hint) hint.textContent = "";

    const container = document.getElementById("servicio-checklist-container");
    if (container) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; padding: 1rem; text-align: center; color: var(--text-tertiary); font-size: 0.8rem; background: var(--surface-secondary); border-radius: var(--radius-md);">
          Busca y selecciona un equipo para cargar automáticamente su pauta técnica preventiva.
        </div>
      `;
    }
  },

  clearServicioSignature() {
    if (this.servicioSignaturePad) {
      this.servicioSignaturePad.clear();
    }
  },

  resetChequeoServicioForm() {
    this.servicioSelectedEquipment = null;
    const input = document.getElementById("input-servicio-equipo-search");
    if (input) input.value = "";

    const card = document.getElementById("servicio-selected-equipment-card");
    if (card) card.style.display = "none";

    const obs = document.getElementById("input-servicio-obs");
    if (obs) obs.value = "";

    this.renderPlaceholderServicioChecklist();

    if (this.servicioPhotoManager) {
      this.servicioPhotoManager.clearAll();
    }
  },

  addEquipmentToServicioBatch(e) {
    e.preventDefault();

    const selectServicio = document.getElementById("select-servicio-clinico");
    const unidad = selectServicio ? selectServicio.value.trim() : "";
    if (!unidad) {
      this.showToast("Por favor selecciona primero el Servicio Clínico en la parte superior.", "error");
      if (selectServicio) selectServicio.focus();
      return;
    }

    if (!this.servicioSelectedEquipment) {
      this.showToast("Por favor busca y selecciona el equipo médico a inspeccionar.", "error");
      const searchInput = document.getElementById("input-servicio-equipo-search");
      if (searchInput) searchInput.focus();
      return;
    }

    const fotos = this.servicioPhotoManager ? this.servicioPhotoManager.getPhotos().filter(Boolean) : [];
    if (fotos.length < 2) {
      const confirmOk = confirm(
        `Has adjuntado ${fotos.length} de 2 fotografías para este equipo.\n\n¿Deseas agregarlo a la revisión con las fotos actuales?`
      );
      if (!confirmOk) return;
    }

    const estadoEquipo = document.getElementById("select-servicio-estado-equipo") ? document.getElementById("select-servicio-estado-equipo").value : "Operativo";
    const condicion = document.getElementById("select-servicio-condicion") ? document.getElementById("select-servicio-condicion").value : "Conforme";
    const obsInput = document.getElementById("input-servicio-obs") ? document.getElementById("input-servicio-obs").value.trim() : "";

    const item = {
      id_lote: "item_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
      id_equipo: this.servicioSelectedEquipment.id_equipo || null,
      nombre: this.servicioSelectedEquipment.nombre,
      marca: this.servicioSelectedEquipment.marca || "",
      modelo: this.servicioSelectedEquipment.modelo || "",
      serie: this.servicioSelectedEquipment.serie || "S/N",
      categoria: this.servicioSelectedEquipment.categoria || "GENERAL",
      estado: estadoEquipo,
      condicion: condicion,
      puntos_control: { ...this.servicioChecklistValues },
      observaciones: obsInput,
      fotos: [...fotos],
      timestamp: new Date().toISOString()
    };

    this.servicioBatchEquipos.push(item);
    this.showToast(`✅ Equipo "${item.nombre}" agregado a la revisión (${this.servicioBatchEquipos.length} en total)`, "success");

    // Limpiar formulario para chequear otro equipo
    this.resetChequeoServicioForm();
    this.renderServicioBatchUI();
  },

  removeEquipmentFromServicioBatch(index) {
    if (index >= 0 && index < this.servicioBatchEquipos.length) {
      const removed = this.servicioBatchEquipos.splice(index, 1);
      this.showToast(`Equipo "${removed[0].nombre}" eliminado de la revisión.`, "info");
      this.renderServicioBatchUI();
    }
  },

  renderServicioBatchUI() {
    const counterPill = document.getElementById("servicio-counter-pill");
    const counterText = document.getElementById("servicio-counter-text");
    const batchCountSpan = document.getElementById("servicio-batch-count");
    const statusHint = document.getElementById("servicio-batch-status-hint");
    const batchListContainer = document.getElementById("servicio-batch-list");

    const count = this.servicioBatchEquipos.length;
    if (batchCountSpan) batchCountSpan.textContent = count;

    if (counterPill && counterText) {
      if (this.selectedServicioClinico) {
        counterPill.style.display = "inline-flex";
        counterText.textContent = `${count} equipo(s) en revisión de ${this.selectedServicioClinico}`;
      } else {
        counterPill.style.display = "none";
      }
    }

    if (statusHint) {
      statusHint.textContent = count > 0 
        ? `${count} equipo(s) listos para guardado general y reporte oficial` 
        : "Agrega equipos para incluirlos en el reporte consolidado";
    }

    if (batchListContainer) {
      if (count === 0) {
        batchListContainer.innerHTML = `
          <div style="text-align: center; padding: 2rem 1rem; color: var(--text-tertiary); background: var(--surface-secondary); border-radius: var(--radius-md);">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-bottom: 0.5rem; opacity: 0.6;"><rect x="2" y="3" width="20" height="14" rx="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
            <p style="font-size: 0.88rem; font-weight: 500; margin: 0;">Aún no has agregado equipos a esta revisión</p>
            <p style="font-size: 0.75rem; margin: 4px 0 0 0;">Usa el formulario superior para inspeccionar y agregar equipos uno a uno.</p>
          </div>
        `;
      } else {
        batchListContainer.innerHTML = "";
        this.servicioBatchEquipos.forEach((eq, idx) => {
          const card = document.createElement("div");
          card.className = "batch-item-card";

          const badgeState = eq.estado === "Operativo" ? "badge-success" : (eq.estado === "En Mantención" ? "badge-warning" : "badge-secondary");
          const infoMarcaModelo = [eq.marca, eq.modelo].filter(Boolean).join(" - ");

          let thumbsHtml = "";
          if (eq.fotos && eq.fotos.length > 0) {
            thumbsHtml = `<div class="batch-item-thumbs">` + 
              eq.fotos.map((f, fIdx) => `<img src="${f}" class="batch-thumb-img" title="Foto ${fIdx + 1}: ${eq.nombre}" alt="Foto">`).join("") +
              `</div>`;
          } else {
            thumbsHtml = `<span style="font-size: 0.7rem; color: var(--text-tertiary);">Sin fotos</span>`;
          }

          card.innerHTML = `
            <div class="batch-item-info">
              <div class="batch-item-num">#${idx + 1}</div>
              <div class="batch-item-details">
                <h4>${eq.nombre}</h4>
                <p>
                  <span>${infoMarcaModelo || "Sin marca/modelo"}</span> • 
                  <code style="font-family: var(--font-mono); color: var(--primary);">S/N: ${eq.serie}</code> • 
                  <span class="badge" style="font-size: 0.65rem;">${eq.categoria}</span>
                </p>
                <div style="display: flex; gap: 0.4rem; align-items: center; flex-wrap: wrap;">
                  <span class="badge ${badgeState}">${eq.estado}</span>
                  <span class="badge" style="font-size: 0.68rem;">Condición: ${eq.condicion}</span>
                  ${eq.observaciones ? `<span style="font-size: 0.72rem; color: var(--text-secondary); max-width: 280px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">"${eq.observaciones}"</span>` : ""}
                </div>
              </div>
            </div>

            <div style="display: flex; align-items: center; gap: 0.85rem;">
              ${thumbsHtml}
              <button type="button" class="btn btn-outline btn-xs" onclick="app.removeEquipmentFromServicioBatch(${idx})" style="color: var(--danger); border-color: var(--border-subtle); display: inline-flex; align-items: center; gap: 4px;" title="Quitar equipo de la revisión">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                Quitar
              </button>
            </div>
          `;

          batchListContainer.appendChild(card);
        });
      }
    }

    // Inicializar o ajustar resolución del canvas de firma
    if (this.servicioSignaturePad) {
      setTimeout(() => this.servicioSignaturePad.initCanvas(), 60);
    }
  },

  async submitGeneralServicioRevision() {
    const selectServicio = document.getElementById("select-servicio-clinico");
    const unidad = selectServicio ? selectServicio.value.trim() : "";

    if (!unidad) {
      this.showToast("Por favor selecciona el Servicio Clínico en la parte superior.", "error");
      if (selectServicio) selectServicio.focus();
      return;
    }

    if (!this.servicioBatchEquipos || this.servicioBatchEquipos.length === 0) {
      this.showToast("Debes inspeccionar y agregar al menos un equipo antes de finalizar la revisión general.", "warning");
      const inputSearch = document.getElementById("input-servicio-equipo-search");
      if (inputSearch) inputSearch.focus();
      return;
    }

    if (!this.servicioSignaturePad || this.servicioSignaturePad.isEmpty()) {
      this.showToast("Por favor dibuja la firma digital antes de finalizar la revisión.", "error");
      return;
    }

    const btnSubmit = document.getElementById("btn-submit-general-revision");
    if (btnSubmit) {
      btnSubmit.disabled = true;
      btnSubmit.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation: spin 1s linear infinite;"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
        <span>Guardando Revisión y Generando Reporte...</span>
      `;
    }

    try {
      const firmaData = this.servicioSignaturePad.getSignatureData();
      const firmaNombre = document.getElementById("input-servicio-firma-nombre") ? document.getElementById("input-servicio-firma-nombre").value.trim() : "";
      const obsGeneral = document.getElementById("input-servicio-obs-general") ? document.getElementById("input-servicio-obs-general").value.trim() : "";
      const batchId = "REV-" + Date.now();
      const tecnicoNombre = this.currentUser ? this.currentUser.nombre : "Técnico EEMM";
      const fechaNow = new Date().toISOString();

      // Guardar cada equipo del lote en la base de datos o cola offline
      let savedCount = 0;
      for (const eq of this.servicioBatchEquipos) {
        const fullObs = `[Revisión Servicio: ${unidad}] [Lote: ${batchId}] [Condición: ${eq.condicion}] ${eq.observaciones} ${obsGeneral ? `(Nota General: ${obsGeneral})` : ""}`.trim();
        
        const payload = {
          id_equipo: eq.id_equipo || null,
          nombre_equipo: eq.nombre,
          marca: eq.marca || "",
          modelo: eq.modelo || "",
          serie: eq.serie || "S/N",
          unidad: unidad,
          categoria: eq.categoria || "GENERAL",
          respuestas: eq.puntos_control,
          obs: fullObs,
          fotos: eq.fotos || [],
          firma: firmaData,
          firma_nombre: firmaNombre || tecnicoNombre,
          fecha: eq.timestamp || fechaNow
        };

        const extraInfo = {
          equipo: payload.nombre_equipo,
          serie: payload.serie,
          unidad: payload.unidad,
          categoria: payload.categoria,
          usuario: tecnicoNombre,
          fecha: payload.fecha,
          fotosCount: (payload.fotos || []).length,
          hasFirma: !!firmaData
        };

        if (window.OfflineManager && !window.OfflineManager.isOnline) {
          await window.OfflineManager.queueRequest("chequeo", "/api/chequeos", "POST", payload, extraInfo);
          savedCount++;
        } else {
          try {
            const res = await fetch("/api/chequeos", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload)
            });
            if (res.ok) savedCount++;
          } catch (netErr) {
            if (window.OfflineManager) {
              await window.OfflineManager.queueRequest("chequeo", "/api/chequeos", "POST", payload, extraInfo);
              savedCount++;
            }
          }
        }
      }

      // Preparar objeto de reporte consolidado (Folio estrictamente numérico)
      const now = new Date();
      const folioGen = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}${String(now.getSeconds()).padStart(2, "0")}`;
      const reporteConsolidado = {
        folio: folioGen,
        batch_id: folioGen,
        unidad: unidad,
        fecha: fechaNow,
        usuario: tecnicoNombre,
        tecnico: tecnicoNombre,
        supervisor: firmaNombre || "Responsable de Servicio",
        obs_general: obsGeneral,
        firma: firmaData,
        firma_nombre: firmaNombre || tecnicoNombre,
        total_equipos: this.servicioBatchEquipos.length,
        equipos: [...this.servicioBatchEquipos]
      };

      // Registrar la revisión consolidada en el servidor (o caché local si offline)
      try {
        const revRes = await fetch("/api/revisiones-servicio", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(reporteConsolidado)
        });
        if (revRes.ok) {
          const revJson = await revRes.json();
          if (revJson && revJson.id_revision) {
            reporteConsolidado.id_revision = revJson.id_revision;
            reporteConsolidado.folio = revJson.folio || folioGen;
          }
        } else {
          console.warn("Respuesta no exitosa al registrar revisión de servicio:", revRes.status);
        }
      } catch (revErr) {
        console.warn("Modo sin conexión: guardando revisión consolidada en caché local", revErr);
      }

      // Guardar copia local para consulta offline inmediata
      try {
        const localRevs = JSON.parse(localStorage.getItem("local_revisiones_servicio") || "[]");
        localRevs.unshift(reporteConsolidado);
        localStorage.setItem("local_revisiones_servicio", JSON.stringify(localRevs.slice(0, 100)));
      } catch (e) {}

      this.showToast(`¡Revisión de ${unidad} guardada con éxito! Se registraron ${this.servicioBatchEquipos.length} equipos.`, "success");

      // Abrir reporte consolidado
      this.openServicioReporteModal(reporteConsolidado);

      // Reiniciar lote para la siguiente revisión
      this.servicioBatchEquipos = [];
      if (document.getElementById("input-servicio-obs-general")) document.getElementById("input-servicio-obs-general").value = "";
      if (document.getElementById("input-servicio-firma-nombre")) document.getElementById("input-servicio-firma-nombre").value = "";
      this.clearServicioSignature();
      this.renderServicioBatchUI();

    } catch (err) {
      console.error("Error al finalizar revisión general:", err);
      this.showToast(err.message || "Error al procesar el guardado general", "error");
    } finally {
      if (btnSubmit) {
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = `
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
          <span>Finalizar Revisión General y Generar Reporte</span>
        `;
      }
    }
  },

  openServicioReporteModal(reporte) {
    const modal = document.getElementById("modal-reporte-servicio");
    if (!modal) return;

    // Metadatos
    const metaContainer = document.getElementById("reporte-meta-container");
    if (metaContainer) {
      const fechaFormat = new Date(reporte.fecha).toLocaleString("es-CL", { dateStyle: "long", timeStyle: "short" });
      const rawFolio = String(reporte.folio || reporte.batch_id || reporte.id_revision || "");
      const numericFolio = rawFolio.replace(/\D/g, "") || String(Date.now());
      metaContainer.innerHTML = `
        <div class="reporte-meta-item">
          <label>Servicio Clínico</label>
          <span>${reporte.unidad}</span>
        </div>
        <div class="reporte-meta-item">
          <label>Fecha y Hora</label>
          <span>${fechaFormat}</span>
        </div>
        <div class="reporte-meta-item">
          <label>Técnico Inspector EEMM</label>
          <span>${reporte.tecnico}</span>
        </div>
        <div class="reporte-meta-item">
          <label>Recepción / Supervisor</label>
          <span>${reporte.supervisor || "Personal de Turno"}</span>
        </div>
        <div class="reporte-meta-item">
          <label>FOLIO Nº</label>
          <code style="font-family: var(--font-mono); font-weight: 700; color: #0f172a; font-size: 0.95rem;">${numericFolio}</code>
        </div>
      `;
    }

    // KPIs de Estados
    const kpiContainer = document.getElementById("reporte-kpi-container");
    if (kpiContainer) {
      const total = reporte.equipos.length;
      const operativos = reporte.equipos.filter((e) => e.estado === "Operativo").length;
      const mantencion = reporte.equipos.filter((e) => e.estado === "En Mantención").length;
      const otros = total - operativos - mantencion;

      kpiContainer.innerHTML = `
        <div class="servicio-stats-pill" style="border-color: #0f172a; color: #0f172a;">
          <strong>Total Equipos:</strong> <span>${total}</span>
        </div>
        <div class="servicio-stats-pill" style="border-color: var(--success); color: var(--success);">
          <strong>Operativos:</strong> <span>${operativos}</span>
        </div>
        ${mantencion > 0 ? `
        <div class="servicio-stats-pill" style="border-color: var(--warning); color: var(--warning);">
          <strong>En Mantención:</strong> <span>${mantencion}</span>
        </div>` : ""}
        ${otros > 0 ? `
        <div class="servicio-stats-pill" style="border-color: var(--danger); color: var(--danger);">
          <strong>Otros / Fuera de Servicio:</strong> <span>${otros}</span>
        </div>` : ""}
      `;
    }

    // Equipos con fotos
    const eqContainer = document.getElementById("reporte-equipos-container");
    if (eqContainer) {
      eqContainer.innerHTML = "";
      reporte.equipos.forEach((eq, idx) => {
        const div = document.createElement("div");
        div.className = "reporte-equipment-row";

        const infoMarcaModelo = [eq.marca, eq.modelo].filter(Boolean).join(" - ");
        const badgeClass = eq.estado === "Operativo" ? "badge-success" : (eq.estado === "En Mantención" ? "badge-warning" : "badge-secondary");

        let photosHtml = "";
        if (eq.fotos && eq.fotos.length > 0) {
          photosHtml = `<div class="reporte-photos-flex">` +
            eq.fotos.map((f, pIdx) => `
              <div class="reporte-photo-box">
                <img src="${f}" alt="Foto ${pIdx + 1}">
                <span>${pIdx === 0 ? "Foto 1: Vista Frontal / General" : "Foto 2: Placa / Detalle Serie"}</span>
              </div>
            `).join("") +
            `</div>`;
        } else {
          photosHtml = `<p style="font-size: 0.75rem; color: #64748b; margin-top: 0.5rem; font-style: italic;">Sin fotografías adjuntas para este equipo.</p>`;
        }

        // Puntos no conformes si existieran
        let nokItems = [];
        if (eq.puntos_control) {
          for (let p in eq.puntos_control) {
            if (eq.puntos_control[p] === "NO_CONFORME") nokItems.push(p);
          }
        }

        div.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 0.5rem;">
            <div>
              <h4 style="font-size: 0.95rem; font-weight: 700; margin: 0 0 2px 0;">#${idx + 1} - ${eq.nombre}</h4>
              <p style="font-size: 0.78rem; color: #64748b; margin: 0;">
                ${infoMarcaModelo || "Sin marca/modelo"} • <code style="font-family: var(--font-mono); font-weight: 600;">S/N: ${eq.serie}</code> • Categoría: ${eq.categoria}
              </p>
            </div>
            <div style="display: flex; gap: 0.4rem; align-items: center;">
              <span class="badge ${badgeClass}">${eq.estado}</span>
              <span class="badge" style="font-size: 0.7rem;">${eq.condicion}</span>
            </div>
          </div>

          ${eq.observaciones ? `<p style="font-size: 0.8rem; margin: 0.4rem 0 0 0; background: rgba(241, 245, 249, 0.6); padding: 0.4rem 0.65rem; border-radius: 4px;"><strong>Observaciones:</strong> ${eq.observaciones}</p>` : ""}
          ${nokItems.length > 0 ? `<p style="font-size: 0.78rem; color: var(--danger); margin: 0.35rem 0 0 0;"><strong>⚠️ Puntos Observados:</strong> ${nokItems.join(", ")}</p>` : ""}

          ${photosHtml}
        `;

        eqContainer.appendChild(div);
      });
    }

    // Firma Estampada
    const firmaBox = document.getElementById("reporte-firma-img-box");
    if (firmaBox) {
      if (reporte.firma) {
        firmaBox.innerHTML = `<img src="${reporte.firma}" alt="Firma Digital">`;
      } else {
        firmaBox.innerHTML = `<span style="font-size: 0.75rem; color: #64748b;">Firma Digital Registrada</span>`;
      }
    }

    const nombreLabel = document.getElementById("reporte-firma-nombre-label");
    if (nombreLabel) {
      nombreLabel.textContent = reporte.supervisor ? `${reporte.supervisor} / ${reporte.tecnico}` : reporte.tecnico;
    }

    const fechaLabel = document.getElementById("reporte-firma-fecha-label");
    if (fechaLabel) {
      fechaLabel.textContent = `Validación Digital Oficial EEMM · ${new Date(reporte.fecha).toLocaleDateString("es-CL")}`;
    }

    this.currentActiveServicioReporte = reporte;
    modal.style.display = "flex";
    modal.classList.add("active");
  },

  closeServicioReporteModal() {
    const modal = document.getElementById("modal-reporte-servicio");
    if (modal) {
      modal.style.display = "none";
      modal.classList.remove("active");
    }
  },

  printServicioReporte() {
    window.print();
  },

  async downloadCurrentServicioPdf() {
    if (!this.currentActiveServicioReporte) {
      this.showToast("No hay reporte de servicio seleccionado", "warning");
      return;
    }
    const r = this.currentActiveServicioReporte;
    const rawFolio = String(r.folio || r.batch_id || r.id_revision || "");
    const numFolio = rawFolio.replace(/\D/g, "") || String(Date.now());
    const uniClean = (r.unidad || "GENERAL").replace(/[^a-zA-Z0-9_-]/g, "_");
    const filename = `Reporte_Servicio_${numFolio}_${uniClean}.pdf`;
    const idOrFolio = r.id_revision || r.folio || r.batch_id || numFolio;
    await this.downloadServicioPdf(idOrFolio, filename);
  },

  async downloadServicioPdf(idOrFolio, filename) {
    const rawId = String(idOrFolio || "").trim();
    const cleanNum = rawId.replace(/\D/g, "");
    const fn = filename || `Reporte_Servicio_${cleanNum || rawId}.pdf`;

    // 1. Localizar los datos de la revisión si están disponibles en memoria o caché
    let localItem = null;
    if (this.currentActiveServicioReporte) {
      const cur = this.currentActiveServicioReporte;
      const curId = String(cur.id_revision || "");
      const curFolio = String(cur.folio || cur.batch_id || "");
      if (curId === rawId || curFolio === rawId || curFolio.replace(/\D/g, "") === cleanNum) {
        localItem = cur;
      }
    }
    if (!localItem && Array.isArray(this.historialServiciosData)) {
      localItem = this.historialServiciosData.find(d => {
        const dId = String(d.id_revision || "");
        const dFolio = String(d.folio || d.batch_id || "");
        return dId === rawId || dFolio === rawId || dFolio.replace(/\D/g, "") === cleanNum;
      });
    }
    if (!localItem) {
      try {
        const localRevs = JSON.parse(localStorage.getItem("local_revisiones_servicio") || "[]");
        localItem = localRevs.find(d => {
          const dId = String(d.id_revision || "");
          const dFolio = String(d.folio || d.batch_id || "");
          return dId === rawId || dFolio === rawId || dFolio.replace(/\D/g, "") === cleanNum;
        });
      } catch (_) {}
    }

    // 2. Si no tiene id_revision en la base de datos pero tenemos el objeto completo, sincronizarlo al servidor
    if (localItem && !localItem.id_revision) {
      try {
        const syncRes = await fetch("/api/revisiones-servicio", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(localItem)
        });
        if (syncRes.ok) {
          const syncJson = await syncRes.json();
          if (syncJson && syncJson.id_revision) {
            localItem.id_revision = syncJson.id_revision;
            if (syncJson.folio) localItem.folio = syncJson.folio;
            try {
              const lrs = JSON.parse(localStorage.getItem("local_revisiones_servicio") || "[]");
              const idx = lrs.findIndex(x => (x.folio || x.batch_id) === (localItem.folio || localItem.batch_id));
              if (idx !== -1) {
                lrs[idx] = localItem;
                localStorage.setItem("local_revisiones_servicio", JSON.stringify(lrs));
              }
            } catch (_) {}
          }
        }
      } catch (_) {}
    }

    this.showToast("Generando reporte PDF oficial...", "info");

    // 3. Probar descarga estándar por GET
    const targetKey = (localItem && localItem.id_revision) ? localItem.id_revision : (cleanNum || rawId);
    let success = false;
    try {
      const res = await fetch(`/api/revisiones-servicio/${targetKey}/pdf?download=true`);
      if (res.ok) {
        const blob = await res.blob();
        this._saveBlobPdf(blob, fn);
        success = true;
        this.showToast("PDF descargado correctamente", "success");
        return;
      }
    } catch (e) {
      console.warn("Fallo GET de PDF en backend:", e);
    }

    // 4. Si el GET falló o no existe en SQLite pero tenemos el objeto local:
    // Compilarlo al vuelo con /api/revisiones-servicio/pdf-preview
    if (!success && localItem) {
      try {
        this.showToast("Compilando PDF oficial desde datos de revisión...", "info");
        const resPreview = await fetch("/api/revisiones-servicio/pdf-preview?download=true", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(localItem)
        });
        if (resPreview.ok) {
          const blob = await resPreview.blob();
          this._saveBlobPdf(blob, fn);
          this.showToast("PDF generado y descargado exitosamente", "success");
          return;
        }
      } catch (previewErr) {
        console.error("Error al generar PDF preview:", previewErr);
      }
    }

    if (!success) {
      this.showToast("No se pudo obtener el PDF de la revisión de servicio", "error");
    }
  },

  async downloadCurrentChequeoPdf() {
    if (!this.currentActiveChequeo) {
      this.showToast("No hay chequeo seleccionado", "warning");
      return;
    }
    const item = this.currentActiveChequeo;
    const numFolio = String(item.id_registro || "1").replace(/\D/g, "").padStart(6, "0");
    const serieClean = (item.serie || "SN").replace(/[^a-zA-Z0-9_-]/g, "_");
    const filename = `Chequeo_EEMM_${numFolio}_${serieClean}.pdf`;
    await this.downloadChequeoPdf(item.id_registro, filename);
  },

  async downloadChequeoPdf(id, filename) {
    const rawId = String(id || "").trim();
    const cleanNum = rawId.replace(/\D/g, "");
    const fn = filename || `Chequeo_EEMM_${cleanNum || rawId}.pdf`;
    const targetKey = cleanNum || rawId;

    try {
      this.showToast("Generando reporte PDF oficial...", "info");
      const res = await fetch(`/api/chequeos/${targetKey}/pdf?download=true`);
      if (res.ok) {
        const blob = await res.blob();
        this._saveBlobPdf(blob, fn);
        this.showToast("PDF descargado correctamente", "success");
        return;
      }
      let errDetail = "No se pudo obtener el PDF del servidor";
      try {
        const j = await res.json();
        if (j && j.detail) errDetail = j.detail;
      } catch (_) {}
      this.showToast(`Error al generar PDF: ${errDetail}`, "error");
    } catch (err) {
      console.error("Error al descargar chequeo PDF:", err);
      this.showToast("Error de conexión al obtener PDF", "error");
    }
  },

  _saveBlobPdf(blob, filename) {
    try {
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = blobUrl;
      a.download = filename || "Reporte_EEMM.pdf";
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        try {
          document.body.removeChild(a);
          window.URL.revokeObjectURL(blobUrl);
        } catch (_) {}
      }, 4000);
    } catch (err) {
      console.error("Error al disparar descarga de blob:", err);
      this.showToast("Error al guardar archivo en el dispositivo", "error");
    }
  },

  async downloadPdf(url, filename) {
    try {
      this.showToast("Generando documento PDF oficial...", "info");
      const res = await fetch(url);
      if (!res.ok) {
        let errDetail = "No se pudo obtener el PDF del servidor";
        try {
          const j = await res.json();
          if (j && j.detail) errDetail = j.detail;
        } catch (_) {}
        throw new Error(errDetail);
      }
      const blob = await res.blob();
      this._saveBlobPdf(blob, filename);
      this.showToast("PDF descargado correctamente", "success");
    } catch (err) {
      console.error("Error al descargar PDF:", err);
      this.showToast("Error al obtener PDF: " + (err.message || "Servidor no disponible"), "error");
    }
  },

  /* ==========================================================================
     SUB-PESTAÑAS DE HISTORIAL (EQUIPOS vs SERVICIOS CLÍNICOS)
     ========================================================================== */

  switchHistorialTab(tab) {
    this.currentHistorialTab = tab;
    const btnEquipos = document.getElementById("btn-historial-subnav-equipos");
    const btnServicios = document.getElementById("btn-historial-subnav-servicios");
    const tabEquipos = document.getElementById("historial-tab-equipos");
    const tabServicios = document.getElementById("historial-tab-servicios");
    const mainTitle = document.getElementById("historial-main-title");
    const mainSubtitle = document.getElementById("historial-main-subtitle");

    if (tab === "servicios") {
      if (btnEquipos) btnEquipos.classList.remove("active");
      if (btnServicios) btnServicios.classList.add("active");
      if (tabEquipos) tabEquipos.style.display = "none";
      if (tabServicios) tabServicios.style.display = "block";
      if (mainTitle) mainTitle.textContent = "Historial de Revisiones por Servicio";
      if (mainSubtitle) mainSubtitle.textContent = "Informes consolidados y pautas preventivas por unidad médica";
      this.populateServiciosUnidadesFilter();
      this.loadHistorialServicios();
    } else {
      if (btnEquipos) btnEquipos.classList.add("active");
      if (btnServicios) btnServicios.classList.remove("active");
      if (tabEquipos) tabEquipos.style.display = "block";
      if (tabServicios) tabServicios.style.display = "none";
      if (mainTitle) mainTitle.textContent = "Historial de Chequeos";
      if (mainSubtitle) mainSubtitle.textContent = "Inspecciones preventivas realizadas y registradas";
      this.loadHistorial();
    }
  },

  refreshCurrentHistorialTab() {
    if (this.currentHistorialTab === "servicios") {
      this.loadHistorialServicios();
    } else {
      this.loadHistorial();
    }
  },

  populateServiciosUnidadesFilter() {
    const select = document.getElementById("filtro-historial-servicio-unidad");
    if (!select || select.options.length > 1) return;
    const unidades = [
      "URGENCIA ADULTO", "URGENCIA PEDIATRIA", "PABELLONES QUIRURGICOS", "UPC (UCI / UTI)", 
      "CIRUGIA ADULTO", "MEDICINA ADULTO", "PEDIATRIA", "GINECOLOGIA Y OBSTETRICIA", 
      "NEONATOLOGIA", "DIALISIS", "LABORATORIO CLINICO", "IMAGENOLOGIA (RAYOS X / TAC)", 
      "ANESTESIA Y RECUPERACION", "FARMACIA CLINICA", "CONSULTA EXTERNA (CAE)", "CENTRAL DE ESTERILIZACION"
    ];
    unidades.forEach(u => {
      const opt = document.createElement("option");
      opt.value = u;
      opt.textContent = u;
      select.appendChild(opt);
    });
  },

  async loadHistorialServicios() {
    const tbody = document.getElementById("historial-servicios-tbody");
    if (!tbody) return;

    const qInput = document.getElementById("filtro-historial-servicio-query");
    const q = qInput ? qInput.value.trim().toLowerCase() : "";

    const uniEl = document.getElementById("filtro-historial-servicio-unidad");
    const unidad = uniEl ? uniEl.value : "";

    tbody.innerHTML = `
      <tr>
        <td colspan="9" style="text-align: center; padding: 2rem; color: var(--text-tertiary);">
          <div style="display: flex; align-items: center; justify-content: center; gap: 8px;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation: spin 1s linear infinite;"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
            <span>Cargando revisiones de servicio...</span>
          </div>
        </td>
      </tr>
    `;

    let data = [];
    try {
      let url = `/api/revisiones-servicio?limit=50`;
      if (q) url += `&q=${encodeURIComponent(q)}`;
      if (unidad) url += `&unidad=${encodeURIComponent(unidad)}`;

      const res = await fetch(url);
      if (res.ok) {
        data = await res.json();
        this.syncLocalRevisionesServicio();
      }
    } catch (err) {
      console.warn("Modo offline: buscando revisiones locales en localStorage", err);
    }

    // Combinar con revisiones en caché local si offline o no presentes
    try {
      const localRevs = JSON.parse(localStorage.getItem("local_revisiones_servicio") || "[]");
      if (localRevs.length > 0) {
        const existingFolios = new Set(data.map(d => d.folio));
        localRevs.forEach(lr => {
          if (!existingFolios.has(lr.folio) && !existingFolios.has(lr.batch_id)) {
            data.unshift(lr);
          }
        });
      }
    } catch (e) {}

    // Filtrar localmente si se está en modo offline
    if (q || unidad) {
      data = data.filter(item => {
        if (unidad && (item.unidad || "").toLowerCase() !== unidad.toLowerCase()) return false;
        if (q) {
          const matchFolio = (item.folio || item.batch_id || "").toLowerCase().includes(q);
          const matchUser = (item.usuario || "").toLowerCase().includes(q);
          const matchSup = (item.supervisor || "").toLowerCase().includes(q);
          const matchObs = (item.obs_general || "").toLowerCase().includes(q);
          if (!matchFolio && !matchUser && !matchSup && !matchObs) return false;
        }
        return true;
      });
    }

    this.historialServiciosData = data;

    if (data.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="9" style="text-align: center; padding: 2.5rem; color: var(--text-tertiary);">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin: 0 auto 0.5rem auto; opacity: 0.5; display: block;"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
            <p style="margin: 0; font-weight: 500;">No se encontraron revisiones por servicio registradas</p>
            <small style="color: var(--text-tertiary);">Realiza una revisión en "Chequeo por Servicio" para verla reflejada aquí</small>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = "";
    data.forEach(item => {
      const tr = document.createElement("tr");
      const rawFolio = String(item.folio || item.batch_id || item.id_revision || "");
      const numericFolio = rawFolio.replace(/\D/g, "") || String(item.id_revision || "000001").padStart(6, "0");
      const folioDisplay = `FOLIO Nº ${numericFolio}`;
      const searchKey = item.folio || item.batch_id || item.id_revision || numericFolio;
      const fechaFormatted = item.fecha ? new Date(item.fecha).toLocaleString("es-CL", { dateStyle: "short", timeStyle: "short" }) : "-";
      const countEquipos = item.total_equipos || (item.equipos ? item.equipos.length : 0);
      const hasFirma = !!(item.firma_data || item.firma);
      const idOrFolio = item.id_revision || item.folio || item.batch_id || numericFolio;

      tr.innerHTML = `
        <td>
          <code style="font-family: var(--font-mono); font-size: 0.78rem; font-weight: 700; color: #0f172a; background: #f1f5f9; border: 1px solid #e2e8f0; padding: 2px 6px; border-radius: 4px;">${folioDisplay}</code>
        </td>
        <td style="font-size: 0.8rem; color: var(--text-secondary); white-space: nowrap;">${fechaFormatted}</td>
        <td>
          <span class="badge badge-secondary" style="font-size: 0.75rem;">${item.unidad || "General"}</span>
        </td>
        <td style="font-size: 0.82rem; font-weight: 500;">${item.usuario || "Técnico EEMM"}</td>
        <td style="font-size: 0.82rem; color: var(--text-secondary);">${item.supervisor || "Responsable"}</td>
        <td style="text-align: center;">
          <span class="badge" style="background: var(--bg-surface-hover); color: var(--text-primary); font-weight: 700;">${countEquipos} Eq.</span>
        </td>
        <td style="font-size: 0.78rem;">
          <span style="color: var(--success); font-weight: 600;">${item.resumen_estados || `${countEquipos} Operativos`}</span>
        </td>
        <td style="text-align: center;">
          ${hasFirma ? '<span title="Firma digital estampada" style="color: var(--success); font-size: 1rem;">✍️</span>' : '<span style="color: var(--text-tertiary); font-size: 0.75rem;">Sin firma</span>'}
        </td>
        <td class="col-actions" style="text-align: center;">
          <div style="display: inline-flex; gap: 0.35rem; align-items: center; justify-content: center;">
            <button type="button" class="btn btn-outline btn-sm" onclick="app.openServicioReporteFromHistorial('${searchKey}')" title="Ver informe y equipos">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
              Ver Detalle
            </button>
            <button type="button" class="btn btn-primary btn-sm" onclick="app.downloadServicioPdf('${idOrFolio}', 'Reporte_Servicio_${numericFolio}.pdf')" title="Descargar reporte oficial en PDF">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><line x1="9" y1="15" x2="15" y2="15"></line></svg>
              PDF
            </button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });
  },

  filterHistorialServiciosDebounced() {
    clearTimeout(this.debounceTimers.historialServicios);
    this.debounceTimers.historialServicios = setTimeout(() => this.loadHistorialServicios(), 300);
  },

  async openServicioReporteFromHistorial(folioOrId) {
    let item = (this.historialServiciosData || []).find(d => d.folio === folioOrId || d.batch_id === folioOrId || String(d.id_revision) === String(folioOrId));
    if (!item) {
      try {
        const res = await fetch(`/api/revisiones-servicio/${folioOrId}`);
        if (res.ok) item = await res.json();
      } catch (e) {
        console.error("Error al obtener detalle de revisión:", e);
      }
    }
    if (item) {
      const reporteConsolidado = {
        id_revision: item.id_revision,
        folio: item.folio || item.batch_id,
        batch_id: item.folio || item.batch_id,
        unidad: item.unidad,
        fecha: item.fecha,
        tecnico: item.usuario,
        supervisor: item.supervisor,
        obs_general: item.obs_general,
        firma: item.firma_data || item.firma,
        equipos: item.equipos || []
      };
      this.openServicioReporteModal(reporteConsolidado);
    } else {
      this.showToast("No se pudo cargar el detalle de la revisión seleccionada", "error");
    }
  },

  /* ==========================================================================
     HISTORIAL DE CHEQUEOS PREVENTIVOS
     ========================================================================== */
  async loadHistorial() {
    try {
      const qInput = document.getElementById("filtro-historial-query") || document.getElementById("filtro-historial-search");
      const q = qInput ? qInput.value.trim().toLowerCase() : "";

      const uniEl = document.getElementById("filtro-historial-unidad");
      const unidad = uniEl ? uniEl.value : "";

      // 1. Obtener chequeos guardados localmente aún no sincronizados
      const pendingItems = window.OfflineManager ? (await window.OfflineManager.getPendingItems("chequeo")) : [];

      // Filtrar pendientes según los filtros de búsqueda
      const filteredPending = pendingItems.filter((item) => {
        const ext = item.extra || {};
        if (unidad && ext.unidad !== unidad) return false;
        if (q) {
          const matchEquipo = (ext.nombre_equipo || "").toLowerCase().includes(q);
          const matchSerie = (ext.serie || "").toLowerCase().includes(q);
          const matchUser = (ext.usuario || "").toLowerCase().includes(q);
          if (!matchEquipo && !matchSerie && !matchUser) return false;
        }
        return true;
      });

      // 2. Obtener historial del servidor (si hay conexión)
      let serverData = [];
      let fetchFailed = false;
      try {
        let url = `/api/chequeos?limit=100`;
        if (q) url += `&q=${encodeURIComponent(q)}`;
        if (unidad) url += `&unidad=${encodeURIComponent(unidad)}`;

        const res = await fetch(url);
        if (res.ok) {
          serverData = await res.json();
          if (!q && !unidad && window.OfflineManager && Array.isArray(serverData) && serverData.length > 0) {
            window.OfflineManager.cacheData('last_historial', serverData);
          }
        } else {
          fetchFailed = true;
        }
      } catch (netErr) {
        fetchFailed = true;
        console.warn("[Historial] Modo sin conexión: mostrando datos locales");
        if (window.OfflineManager) {
          const cached = await window.OfflineManager.getCachedData('last_historial');
          if (Array.isArray(cached)) {
            serverData = cached;
            if (q || unidad) {
              serverData = serverData.filter((item) => {
                if (unidad && item.unidad !== unidad) return false;
                if (q) {
                  const matchEquipo = (item.nombre_equipo || "").toLowerCase().includes(q);
                  const matchSerie = (item.serie || "").toLowerCase().includes(q);
                  const matchUser = (item.usuario || "").toLowerCase().includes(q);
                  if (!matchEquipo && !matchSerie && !matchUser) return false;
                }
                return true;
              });
            }
          }
        }
      }

      const tbody = document.getElementById("historial-tbody");
      tbody.innerHTML = "";

      if (filteredPending.length === 0 && serverData.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:1.5rem; color:var(--text-muted);">${fetchFailed ? "Sin conexión a Internet. No hay chequeos pendientes en este dispositivo." : "No se encontraron chequeos preventivos."}</td></tr>`;
        return;
      }

      // Renderizar primero los chequeos pendientes guardados localmente
      filteredPending.forEach((item) => {
        const ext = item.extra || {};
        const tr = document.createElement("tr");
        tr.style.backgroundColor = "rgba(245, 158, 11, 0.06)";

        const fotoCount = ext.fotosCount || (item.payload.fotos ? item.payload.fotos.filter(Boolean).length : 0);
        const fotoBadge = fotoCount > 0 
          ? `<span class="badge badge-success" title="${fotoCount} foto(s) guardadas localmente">📷 ${fotoCount}</span>`
          : `<span style="color:var(--text-tertiary); font-size:0.7rem;">Sin fotos</span>`;

        const firmaBadge = ext.hasFirma || item.payload.firma
          ? `<span class="badge badge-tecnico" title="Firma digital guardada localmente">✍️ Sí</span>`
          : `<span style="color:var(--text-tertiary); font-size:0.7rem;">Sin firma</span>`;

        let fechaFormatted = ext.fecha || item.createdAt.substring(0, 19).replace("T", " ");
        if (fechaFormatted.includes(" ")) {
          const parts = fechaFormatted.split(" ");
          fechaFormatted = `<div style="font-weight:600; font-size:0.78rem;">${parts[0]}</div><div style="font-size:0.7rem; color:var(--text-tertiary);">${parts[1]}</div>`;
        }

        tr.innerHTML = `
          <td>
            <span class="badge" style="background:rgba(245, 158, 11, 0.18); color:#d97706; border:1px solid rgba(245,158,11,0.4); font-size:0.68rem; font-weight:700;">
              🟡 Pendiente
            </span>
          </td>
          <td>${fechaFormatted}</td>
          <td><div style="font-weight: 500; font-size: 0.8rem;">${ext.usuario || "Técnico"}</div></td>
          <td>
            <div style="font-weight: 600; color: var(--text-primary); max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${ext.nombre_equipo}">
              ${ext.nombre_equipo || "Equipo"}
            </div>
            ${ext.categoria ? `<span style="font-size: 0.68rem; color: var(--text-tertiary); text-transform: uppercase;">${ext.categoria}</span>` : ""}
          </td>
          <td><code>${ext.serie || "-"}</code></td>
          <td>
            <span class="badge" style="background:var(--primary-subtle); color:var(--primary); font-size:0.72rem; max-width:140px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; display:inline-block;" title="${ext.unidad || "-"}">
              ${ext.unidad || "-"}
            </span>
          </td>
          <td style="text-align: center;">
            <div style="display: flex; gap: 4px; justify-content: center; align-items: center;">
              ${fotoBadge}
              ${firmaBadge}
            </div>
          </td>
          <td class="col-actions">
            <div class="action-buttons-group">
              <button class="btn btn-primary btn-sm" onclick="app.manualSync()" style="gap:4px; font-size:0.72rem; padding:0.25rem 0.6rem;">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
                Subir
              </button>
            </div>
          </td>
        `;
        tbody.appendChild(tr);
      });

      serverData.forEach((item) => {
        const tr = document.createElement("tr");

        // Contar fotos disponibles
        const fotoCount = [item.foto_1, item.foto_2, item.foto_3, item.foto_4].filter(Boolean).length;
        
        // Evidencia visual: fotos + firma en un espacio limpio
        const fotoBadge = fotoCount > 0 
          ? `<span class="badge badge-success" title="${fotoCount} foto(s) registrada(s)">📷 ${fotoCount}</span>`
          : `<span style="color:var(--text-tertiary); font-size:0.7rem;">Sin fotos</span>`;

        const firmaBadge = item.firma_data 
          ? `<span class="badge badge-tecnico" title="Firma digital guardada">✍️ Sí</span>`
          : `<span style="color:var(--text-tertiary); font-size:0.7rem;">Sin firma</span>`;

        // Formateo de fecha compacto: YYYY-MM-DD y hora sutil debajo
        let fechaFormatted = item.fecha || "";
        if (fechaFormatted.includes(" ")) {
          const parts = fechaFormatted.split(" ");
          fechaFormatted = `<div style="font-weight:600; font-size:0.78rem;">${parts[0]}</div><div style="font-size:0.7rem; color:var(--text-tertiary);">${parts[1]}</div>`;
        }

        const numericFolio = String(item.id_registro).replace(/\D/g, '').padStart(6, '0');
        tr.innerHTML = `
          <td><strong style="font-family: var(--font-mono); color: #0f172a;">${numericFolio}</strong></td>
          <td>${fechaFormatted}</td>
          <td>
            <div style="font-weight: 500; font-size: 0.8rem;">${item.usuario || "Técnico"}</div>
          </td>
          <td>
            <div style="font-weight: 600; color: var(--text-primary); max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${item.nombre_equipo}">
              ${item.nombre_equipo}
            </div>
            ${item.categoria ? `<span style="font-size: 0.68rem; color: var(--text-tertiary); text-transform: uppercase;">${item.categoria}</span>` : ""}
          </td>
          <td><code>${item.serie || "-"}</code></td>
          <td>
            <span class="badge badge-secondary" style="font-size:0.72rem; max-width:140px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; display:inline-block;" title="${item.unidad || "-"}">
              ${item.unidad || "-"}
            </span>
          </td>
          <td style="text-align: center;">
            <div style="display: flex; gap: 4px; justify-content: center; align-items: center;">
              ${fotoBadge}
              ${firmaBadge}
            </div>
          </td>
          <td class="col-actions">
            <div class="action-buttons-group">
              <button class="btn btn-outline btn-sm" onclick="app.openDetailModal(${item.id_registro})" title="Ver ficha técnica completa">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                Ver Ficha
              </button>
              <button type="button" class="btn btn-outline btn-sm" onclick="app.downloadChequeoPdf(${item.id_registro}, 'Chequeo_EEMM_${numericFolio}.pdf')" title="Descargar o imprimir informe en PDF">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><line x1="9" y1="15" x2="15" y2="15"></line></svg>
                PDF
              </button>
            </div>
          </td>
        `;
        tbody.appendChild(tr);
      });
    } catch (e) {
      console.error("Error cargando historial:", e);
    }
  },

  filterHistorialDebounced() {
    clearTimeout(this.debounceTimers.historial);
    this.debounceTimers.historial = setTimeout(() => this.loadHistorial(), 300);
  },

  async openDetailModal(id) {
    try {
      const res = await fetch(`/api/chequeos/${id}`);
      const item = await res.json();
      this.currentActiveChequeo = item;

      const folioNum = String(item.id_registro).replace(/\D/g, '').padStart(6, '0');
      document.getElementById("modal-title").textContent = `FOLIO Nº ${folioNum}`;

      const body = document.getElementById("modal-body");

      // Galería de Fotos (hasta 4)
      const fotosDisponibles = [item.foto_1, item.foto_2, item.foto_3, item.foto_4].filter(Boolean);
      let fotosHtml = "";
      if (fotosDisponibles.length > 0) {
        fotosHtml = `
          <div style="margin-top:1rem;">
            <h4 style="font-size:0.9rem; font-weight:600; margin-bottom:0.5rem;">Registro Fotográfico (${fotosDisponibles.length} fotos):</h4>
            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(130px, 1fr)); gap:0.5rem;">
              ${fotosDisponibles.map((f, i) => `
                <a href="${f}" target="_blank" title="Ver imagen ampliada" style="border-radius:var(--radius-sm); overflow:hidden; border:1px solid var(--border-color); display:block;">
                  <img src="${f}" style="width:100%; height:100px; object-fit:cover; display:block;" alt="Foto ${i+1}">
                </a>
              `).join("")}
            </div>
          </div>
        `;
      } else {
        fotosHtml = `<p style="font-size:0.8rem; color:var(--text-muted); margin-top:0.5rem;">Sin fotografías adjuntas.</p>`;
      }

      // Firma
      let firmaHtml = "";
      if (item.firma_data) {
        firmaHtml = `
          <div style="margin-top:1rem;">
            <h4 style="font-size:0.9rem; font-weight:600; margin-bottom:0.3rem;">Firma de Recepción:</h4>
            <div style="background:#ffffff; border:1px solid var(--border-color); border-radius:var(--radius-sm); padding:0.5rem; display:inline-block;">
              <img src="${item.firma_data}" style="max-height:80px; display:block;" alt="Firma">
            </div>
            ${item.firma_nombre ? `<p style="font-size:0.75rem; color:var(--text-muted); margin-top:4px;">Firmante: <strong>${item.firma_nombre}</strong></p>` : ""}
          </div>
        `;
      }

      // Renderizar puntos de control formateados
      let respuestasHtml = "";
      if (item.respuestas) {
        const parts = item.respuestas.split(" | ");
        respuestasHtml = `
          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(230px, 1fr)); gap:0.4rem; margin-top:0.4rem;">
            ${parts.map((p) => {
              const colonIdx = p.indexOf(":");
              let lbl = p;
              let val = "OK";
              if (colonIdx !== -1) {
                lbl = p.substring(0, colonIdx).trim();
                val = p.substring(colonIdx + 1).trim();
              }
              const v = val.toUpperCase();
              let badgeColor = "var(--success)";
              let badgeBg = "var(--success-subtle)";
              if (v === "NO") {
                badgeColor = "var(--danger)";
                badgeBg = "rgba(239, 68, 68, 0.15)";
              } else if (v === "NA" || v === "N/A") {
                badgeColor = "var(--text-tertiary)";
                badgeBg = "var(--bg-subtle)";
              }
              return `
                <div style="display:flex; justify-content:space-between; align-items:center; background:var(--bg-subtle); padding:0.4rem 0.6rem; border-radius:var(--radius-sm); border:1px solid var(--border); font-size:0.78rem;">
                  <span style="color:var(--text-secondary);">${lbl}</span>
                  <span style="font-weight:700; font-size:0.7rem; padding:1px 6px; border-radius:3px; background:${badgeBg}; color:${badgeColor};">${v}</span>
                </div>
              `;
            }).join("")}
          </div>
        `;
      } else {
        respuestasHtml = `<p style="font-size:0.8rem; color:var(--text-tertiary);">Sin respuestas registradas</p>`;
      }

      body.innerHTML = `
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(140px, 1fr)); gap:0.75rem; background:var(--bg-card-subtle); padding:0.85rem; border-radius:var(--radius-md); font-size:0.85rem;">
          <div><span style="color:var(--text-muted); display:block; font-size:0.7rem;">EQUIPO:</span><strong>${item.nombre_equipo}</strong></div>
          <div><span style="color:var(--text-muted); display:block; font-size:0.7rem;">SERIE:</span><code>${item.serie || "S/N"}</code></div>
          <div><span style="color:var(--text-muted); display:block; font-size:0.7rem;">CATEGORÍA:</span><span class="badge badge-tecnico">${item.categoria || "GENERAL"}</span></div>
          <div><span style="color:var(--text-muted); display:block; font-size:0.7rem;">UNIDAD:</span>${item.unidad || "-"}</div>
          <div><span style="color:var(--text-muted); display:block; font-size:0.7rem;">TÉCNICO:</span>${item.usuario}</div>
          <div><span style="color:var(--text-muted); display:block; font-size:0.7rem;">FECHA:</span>${item.fecha}</div>
        </div>

        <div style="margin-top:1rem;">
          <h4 style="font-size:0.9rem; font-weight:600; margin-bottom:0.3rem;">Pauta de Control / Evaluaciones:</h4>
          ${respuestasHtml}
        </div>

        <div style="margin-top:1rem;">
          <h4 style="font-size:0.9rem; font-weight:600; margin-bottom:0.3rem;">Observaciones Técnicas:</h4>
          <p style="font-size:0.85rem; color:var(--text-main); background:var(--bg-card-subtle); padding:0.75rem; border-radius:var(--radius-sm); border-left:3px solid var(--primary);">
            ${item.obs || "Sin observaciones adicionales."}
          </p>
        </div>

        ${fotosHtml}
        ${firmaHtml}

        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:1.25rem; padding-top:0.85rem; border-top:1px solid var(--border-color); flex-wrap:wrap; gap:0.5rem;">
          <button type="button" onclick="app.downloadCurrentChequeoPdf()" class="btn btn-primary" style="display:inline-flex; align-items:center; gap:6px; flex:1 1 auto; justify-content:center;">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><line x1="9" y1="15" x2="15" y2="15"></line></svg>
            Descargar Informe PDF Oficial
          </button>
          <button type="button" class="btn btn-outline" onclick="app.closeModal()" style="flex:0 0 auto;">Cerrar</button>
        </div>
      `;

      document.getElementById("modal-detalle").classList.add("active");
    } catch (e) {
      console.error(e);
      this.showToast("Error al abrir detalle", "error");
    }
  },

  closeModal() {
    document.getElementById("modal-detalle").classList.remove("active");
  },

  /* ==========================================================================
     CATÁLOGO GENERAL DE EQUIPOS (2.553)
     ========================================================================== */
  async loadEquiposCatalog(q = "") {
    try {
      let data = [];
      try {
        const res = await fetch(`/api/equipos?limit=50&q=${encodeURIComponent(q)}`);
        if (res.ok) {
          data = await res.json();
        } else {
          throw new Error("Error en respuesta de /api/equipos");
        }
      } catch (netErr) {
        data = this.searchEquiposOffline(q);
      }

      const totalEl = document.getElementById("equipos-catalog-total");
      if (totalEl && this.equiposBase && this.equiposBase.length > 0) {
        totalEl.textContent = this.equiposBase.length.toLocaleString();
      }

      const tbody = document.getElementById("equipos-catalog-tbody");
      tbody.innerHTML = "";

      if (data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:1.5rem; color:var(--text-tertiary);">No se encontraron equipos médicos coincidentes.</td></tr>`;
        return;
      }

      data.forEach((eq) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td><strong>#${eq.id_equipo}</strong></td>
          <td><strong>${eq.nombre}</strong></td>
          <td>${eq.marca || "-"}</td>
          <td>${eq.modelo || "-"}</td>
          <td><code>${eq.serie || "S/N"}</code></td>
          <td><span class="badge badge-tecnico">${eq.categoria || "GENERAL"}</span></td>
          <td><span class="badge badge-success">${eq.estado || "Operativo"}</span></td>
          <td class="col-actions">
            <button class="btn btn-primary btn-sm" onclick='app.jumpToChequeoWithEquipo(${JSON.stringify(eq)})' title="Iniciar chequeo técnico de este equipo">
              Hacer Chequeo
            </button>
          </td>
        `;
        tbody.appendChild(tr);
      });
    } catch (e) {
      console.error("Error al cargar catálogo de equipos:", e);
    }
  },

  searchCatalogDebounced() {
    clearTimeout(this.debounceTimers.catalog);
    const q = document.getElementById("equipos-catalog-search").value.trim();
    this.debounceTimers.catalog = setTimeout(() => this.loadEquiposCatalog(q), 300);
  },

  jumpToChequeoWithEquipo(eq) {
    this.navigate("chequeo");
    this.selectEquipment(eq);
    window.scrollTo({ top: 0, behavior: "smooth" });
  },

  /* ==========================================================================
     CREACIÓN DE NUEVOS EQUIPOS MÉDICOS
     ========================================================================== */
  openNewEquipmentModal() {
    const modal = document.getElementById("modal-nuevo-equipo");
    if (!modal) return;
    const form = document.getElementById("form-nuevo-equipo");
    if (form) form.reset();

    // Rellenar selector de ubicación con las unidades hospitalarias
    const selUbicacion = document.getElementById("ne-ubicacion");
    if (selUbicacion && selUbicacion.options.length <= 1) {
      selUbicacion.innerHTML = '<option value="">Seleccionar Unidad Hospitalaria...</option>';
      const unidades = [
        "Pabellón Central", "UCI Adulto", "UTI Adulto", "Urgencias / Reanimador", "Maternidad", 
        "Pediatría", "Neonatología", "Laboratorio Clínico", "Imagenología / RX", 
        "Diálisis", "Endoscopía", "Banco de Sangre", "Esterilización", "Farmacia",
        "Kinesiterapia", "Policlínico / CAE", "Oftalmología", "Dental", "Bodega Equipos"
      ];
      unidades.forEach((u) => {
        const opt = document.createElement("option");
        opt.value = u;
        opt.textContent = u;
        selUbicacion.appendChild(opt);
      });
    }

    modal.classList.add("active");
    setTimeout(() => {
      const input = document.getElementById("ne-nombre");
      if (input) input.focus();
    }, 100);
  },

  closeNewEquipmentModal() {
    const modal = document.getElementById("modal-nuevo-equipo");
    if (modal) modal.classList.remove("active");
  },

  async submitNewEquipment(e) {
    e.preventDefault();
    const btn = document.getElementById("btn-submit-nuevo-equipo");
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation: spin 1s linear infinite;"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
      Guardando...
    `;

    const nombre = document.getElementById("ne-nombre").value.trim();
    const marca = document.getElementById("ne-marca").value.trim();
    const modelo = document.getElementById("ne-modelo").value.trim();
    const serie = document.getElementById("ne-serie").value.trim() || "S/N";
    const categoria = document.getElementById("ne-categoria").value || "GENERAL";
    const ubicacion = document.getElementById("ne-ubicacion").value || "";
    const estado = document.getElementById("ne-estado").value || "Operativo";
    const codigoRaw = document.getElementById("ne-codigo").value.trim();
    const codigo_origen = codigoRaw ? parseInt(codigoRaw, 10) || null : null;
    const detalles = document.getElementById("ne-detalles").value.trim();

    if (!nombre) {
      this.showToast("El nombre del equipo es obligatorio.", "warning");
      btn.disabled = false;
      btn.innerHTML = originalText;
      return;
    }

    const payload = {
      nombre,
      marca,
      modelo,
      serie,
      categoria,
      estado,
      ubicacion,
      codigo_origen,
      detalles
    };

    let equipoCreado = null;
    try {
      try {
        const res = await fetch("/api/equipos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          equipoCreado = await res.json();
        } else {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.detail || "Error del servidor al registrar equipo");
        }
      } catch (netErr) {
        // Modo offline / fallo de conexión: crear localmente
        console.warn("Registrando equipo en modo local:", netErr);
        const tempId = Date.now();
        equipoCreado = {
          id_equipo: tempId,
          ...payload
        };
        // Guardar en caché personalizada para persistir offline
        const cachedCustom = JSON.parse(localStorage.getItem("eemm_custom_equipos") || "[]");
        cachedCustom.unshift(equipoCreado);
        localStorage.setItem("eemm_custom_equipos", JSON.stringify(cachedCustom));
        this.showToast("Equipo guardado localmente (Modo sin conexión).", "info");
      }

      // Incorporar inmediatamente al catálogo en memoria para autocompletado y búsqueda
      if (!this.equiposBase) this.equiposBase = [];
      this.equiposBase.unshift(equipoCreado);

      // Si estamos en la vista de catálogo, refrescar la tabla
      if (this.activeTab === "equipos") {
        this.loadEquiposCatalog();
      }

      // Actualizar contadores si están en pantalla
      const totalEl = document.getElementById("equipos-catalog-total");
      if (totalEl) {
        totalEl.textContent = this.equiposBase.length.toLocaleString();
      }

      this.closeNewEquipmentModal();
      this.showToast(`¡Equipo "${nombre}" registrado con éxito!`, "success");

      // Preguntar o dar opción de realizar chequeo preventivo inmediato
      setTimeout(() => {
        if (confirm(`¿Deseas realizar un chequeo preventivo inmediato a "${nombre}" (Serie: ${serie})?`)) {
          this.jumpToChequeoWithEquipo(equipoCreado);
        }
      }, 350);

    } catch (err) {
      console.error("Error al guardar equipo:", err);
      this.showToast(err.message || "Error al registrar el equipo médico.", "error");
    } finally {
      btn.disabled = false;
      btn.innerHTML = originalText;
    }
  },

  /* ==========================================================================
     PANEL ADMINISTRADOR
     ========================================================================== */
  async loadAdminDashboard() {
    try {
      const res = await fetch("/api/stats");
      const stats = await res.json();

      document.getElementById("kpi-total-equipos").textContent = stats.total_equipos.toLocaleString();
      document.getElementById("kpi-total-chequeos").textContent = stats.total_chequeos.toLocaleString();
      document.getElementById("kpi-con-multimedia").textContent = stats.chequeos_con_multimedia.toLocaleString();
      document.getElementById("kpi-total-cajas").textContent = stats.total_cajas_inventario.toLocaleString();

      // Unidades
      const unidadesContainer = document.getElementById("stats-unidades-list");
      unidadesContainer.innerHTML = "";
      stats.top_unidades.forEach((u) => {
        const div = document.createElement("div");
        div.style.marginBottom = "0.75rem";
        div.innerHTML = `
          <div style="display:flex; justify-content:space-between; font-size:0.8rem; margin-bottom:2px;">
            <span><strong>${u.unidad}</strong></span>
            <span>${u.cant} chequeos</span>
          </div>
          <div style="height:6px; background:var(--bg-card-subtle); border-radius:3px; overflow:hidden;">
            <div style="height:100%; width:${Math.min(100, (u.cant / stats.total_chequeos) * 250)}%; background:var(--primary);"></div>
          </div>
        `;
        unidadesContainer.appendChild(div);
      });

      // Técnicos
      const tecnicosContainer = document.getElementById("stats-tecnicos-list");
      tecnicosContainer.innerHTML = "";
      stats.por_tecnico.forEach((t) => {
        const div = document.createElement("div");
        div.style.marginBottom = "0.75rem";
        div.innerHTML = `
          <div style="display:flex; justify-content:space-between; font-size:0.8rem; margin-bottom:2px;">
            <span><strong>${t.usuario}</strong></span>
            <span>${t.cant} chequeos</span>
          </div>
          <div style="height:6px; background:var(--bg-card-subtle); border-radius:3px; overflow:hidden;">
            <div style="height:100%; width:${Math.min(100, (t.cant / stats.total_chequeos) * 200)}%; background:var(--accent);"></div>
          </div>
        `;
        tecnicosContainer.appendChild(div);
      });

      // Cargar tabla de usuarios
      this.loadAdminUsers();

    } catch (e) {
      console.error("Error cargando dashboard:", e);
    }
  },

  /* ==========================================================================
     ADMINISTRACIÓN DE USUARIOS (CRUD)
     ========================================================================== */
  async loadAdminUsers() {
    try {
      const res = await fetch("/api/admin/users");
      const users = await res.json();
      const tbody = document.getElementById("admin-users-tbody");
      if (!tbody) return;
      tbody.innerHTML = "";

      users.forEach((u) => {
        const tr = document.createElement("tr");
        const roleBadge = u.rol === "administrador"
          ? `<span class="badge badge-admin">Administrador</span>`
          : `<span class="badge badge-tecnico">Técnico</span>`;

        const isMe = this.currentUser && this.currentUser.id === u.id;

        tr.innerHTML = `
          <td><strong>#${u.id}</strong></td>
          <td><strong>${u.nombre}</strong></td>
          <td><code>${u.rut || "-"}</code></td>
          <td>${u.correo}</td>
          <td>${roleBadge}</td>
          <td class="col-actions">
            <div class="action-buttons-group">
              <button class="btn btn-outline btn-sm" onclick='app.openUserModal(${JSON.stringify(u)})'>
                Editar
              </button>
              ${!isMe ? `
                <button class="btn btn-subtle btn-sm" style="color: var(--danger);" onclick="app.deleteUser(${u.id}, '${u.nombre}')">
                  Eliminar
                </button>
              ` : `<span style="font-size:0.75rem; color:var(--text-tertiary); padding:4px 8px;">(Tú)</span>`}
            </div>
          </td>
        `;
        tbody.appendChild(tr);
      });
    } catch (e) {
      console.error("Error cargando usuarios admin:", e);
    }
  },

  openUserModal(user = null) {
    const modal = document.getElementById("modal-user");
    const title = document.getElementById("modal-user-title");
    const idInput = document.getElementById("user-edit-id");
    const pwdReq = document.getElementById("user-pwd-req");
    const pwdHint = document.getElementById("user-pwd-hint");
    const pwdInput = document.getElementById("user-password");

    if (user) {
      title.textContent = `Editar Usuario: ${user.nombre}`;
      idInput.value = user.id;
      document.getElementById("user-nombre").value = user.nombre;
      document.getElementById("user-rut").value = user.rut || "";
      document.getElementById("user-correo").value = user.correo;
      document.getElementById("user-rol").value = user.rol;
      pwdInput.value = "";
      pwdInput.required = false;
      pwdReq.style.display = "none";
      pwdHint.style.display = "block";
    } else {
      title.textContent = "Nuevo Usuario";
      idInput.value = "";
      document.getElementById("form-user").reset();
      pwdInput.required = true;
      pwdReq.style.display = "inline";
      pwdHint.style.display = "none";
    }
    modal.classList.add("active");
  },

  closeUserModal() {
    document.getElementById("modal-user").classList.remove("active");
  },

  async saveUser(e) {
    e.preventDefault();
    const id = document.getElementById("user-edit-id").value;
    const nombre = document.getElementById("user-nombre").value.trim();
    const rut = document.getElementById("user-rut").value.trim();
    const correo = document.getElementById("user-correo").value.trim();
    const password = document.getElementById("user-password").value;
    const rol = document.getElementById("user-rol").value;

    const payload = { nombre, rut, correo, rol };
    if (password) payload.password = password;

    const btn = document.getElementById("btn-save-user");
    btn.disabled = true;
    btn.textContent = "Guardando...";

    try {
      const url = id ? `/api/admin/users/${id}` : `/api/admin/users`;
      const method = id ? "PUT" : "POST";

      const res = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Error al guardar usuario");
      }

      this.showToast(id ? "Usuario actualizado exitosamente" : "Usuario creado exitosamente", "success");
      this.closeUserModal();
      this.loadAdminUsers();
    } catch (err) {
      this.showToast(err.message, "error");
    } finally {
      btn.disabled = false;
      btn.textContent = "Guardar Usuario";
    }
  },

  async deleteUser(id, nombre) {
    if (!confirm(`¿Estás seguro de que deseas eliminar al usuario "${nombre}"?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Error al eliminar usuario");
      }
      this.showToast("Usuario eliminado correctamente", "info");
      this.loadAdminUsers();
    } catch (err) {
      this.showToast(err.message, "error");
    }
  },

  /* ==========================================================================
     MANTENIMIENTO Y RESPALDO DE BASE DE DATOS (EXPORTAR / IMPORTAR)
     ========================================================================== */
  async exportDatabase() {
    const btn = document.getElementById("btn-export-db");
    const originalHtml = btn ? btn.innerHTML : "";
    try {
      if (btn) {
        btn.disabled = true;
        btn.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation: spin 1s linear infinite;"><circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle><path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"></path></svg>
          Preparando respaldo...
        `;
      }
      this.showToast("Generando respaldo de la base de datos...", "info");

      const res = await fetch("/api/admin/database/export");
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Error al descargar la base de datos");
      }

      // Obtener nombre sugerido por el backend
      let filename = "eemm_backup.db";
      const disposition = res.headers.get("content-disposition");
      if (disposition && disposition.indexOf("filename=") !== -1) {
        const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(disposition);
        if (matches != null && matches[1]) {
          filename = matches[1].replace(/['"]/g, "");
        }
      }

      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      a.remove();

      this.showToast("Copia de seguridad descargada exitosamente", "success");
    } catch (err) {
      console.error("Error exportando base de datos:", err);
      this.showToast(err.message || "Error al generar respaldo", "error");
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = originalHtml;
      }
    }
  },

  onDatabaseFileSelected(event) {
    const file = event.target.files && event.target.files[0];
    const label = document.getElementById("db-file-label");
    const btnImport = document.getElementById("btn-import-db");

    if (!file) {
      if (label) label.textContent = "📁 Haz clic para seleccionar archivo (.db o .sql)";
      if (btnImport) btnImport.disabled = true;
      return;
    }

    const sizeKb = (file.size / 1024).toFixed(1);
    const sizeStr = file.size > 1024 * 1024 ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` : `${sizeKb} KB`;

    if (label) {
      label.innerHTML = `<strong>${file.name}</strong> <span style="opacity:0.75;">(${sizeStr})</span>`;
    }
    if (btnImport) {
      btnImport.disabled = false;
    }
  },

  async importDatabase() {
    const fileInput = document.getElementById("db-file-input");
    const file = fileInput && fileInput.files && fileInput.files[0];

    if (!file) {
      this.showToast("Por favor selecciona un archivo de base de datos (.db o .sql)", "error");
      return;
    }

    const confirmed = window.confirm(
      `⚠️ ATENCIÓN: ¿Estás seguro de que deseas restaurar la base de datos con el archivo "${file.name}"?\n\nEsta acción reemplazará todos los datos actuales del sistema. Se creará automáticamente un respaldo previo de seguridad.`
    );
    if (!confirmed) return;

    const btn = document.getElementById("btn-import-db");
    const originalHtml = btn ? btn.innerHTML : "";

    try {
      if (btn) {
        btn.disabled = true;
        btn.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation: spin 1s linear infinite;"><circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle><path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"></path></svg>
          Restaurando y verificando...
        `;
      }
      this.showToast("Restaurando base de datos, por favor espera...", "info");

      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/database/import", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Error al restaurar la base de datos");
      }

      let summary = "¡Base de datos restaurada con éxito!";
      if (data.stats) {
        summary += ` (${data.stats.usuarios || 0} usuarios, ${data.stats.equipos || 0} equipos, ${data.stats.chequeos || 0} chequeos)`;
      }
      this.showToast(summary, "success");

      // Resetear selector
      fileInput.value = "";
      const label = document.getElementById("db-file-label");
      if (label) label.textContent = "📁 Haz clic para seleccionar archivo (.db o .sql)";

      // Recargar métricas y datos del panel
      await this.loadAdminDashboard();
      if (typeof this.loadCatalogos === "function") this.loadCatalogos();
    } catch (err) {
      console.error("Error restaurando base de datos:", err);
      this.showToast(err.message || "Error al restaurar base de datos", "error");
    } finally {
      if (btn) {
        btn.disabled = !(fileInput && fileInput.files && fileInput.files.length > 0);
        btn.innerHTML = originalHtml;
      }
    }
  },

  /* ==========================================================================
     INVENTARIO BODEGA: RACKS FÍSICOS, ESTANTES Y REPISAS CON CUADROS
     ========================================================================== */
  async loadInventario() {
    try {
      const qInput = document.getElementById("inventario-search");
      const q = qInput ? qInput.value.trim() : "";
      const estadoSelect = document.getElementById("inventario-filtro-estado");
      const estado = estadoSelect ? estadoSelect.value : "";

      // 1. Cargar resumen de estantes si aún no existe
      if (!this.estantesSummary || this.estantesSummary.length === 0) {
        try {
          const resEst = await fetch("/api/inventario/estanterias");
          if (resEst.ok) {
            this.estantesSummary = await resEst.json();
            this.estanteMap = {};
            this.estantesSummary.forEach(e => {
              this.estanteMap[e.id_estanteria] = e;
            });
          }
        } catch (e) {
          console.warn("No se pudo cargar resumen de estantes:", e);
        }
      }

      // 2. Cargar cajas de inventario (hasta 500)
      let url = `/api/inventario?limit=500`;
      if (q) url += `&q=${encodeURIComponent(q)}`;
      if (estado) url += `&estado=${encodeURIComponent(estado)}`;
      if (this.selectedEstante && this.selectedEstante !== "all") {
        url += `&estanteria=${encodeURIComponent(this.selectedEstante)}`;
      }

      const res = await fetch(url);
      if (!res.ok) throw new Error("Error cargando inventario");
      const data = await res.json();
      this.inventarioData = data;

      // 3. Actualizar KPIs de Bodega
      const totalCajas = data.length;
      const totalUnidades = data.reduce((acc, it) => acc + (it.cantidad || 0), 0);
      const stockBajo = data.filter(it => it.estado !== "OK").length;
      const totalEstantes = new Set(data.map(it => it.estanteria_id)).size;

      const kpiCajas = document.getElementById("inv-kpi-total-cajas");
      if (kpiCajas) kpiCajas.textContent = totalCajas.toLocaleString("es-CL");

      const kpiUnidades = document.getElementById("inv-kpi-total-unidades");
      if (kpiUnidades) kpiUnidades.textContent = totalUnidades.toLocaleString("es-CL");

      const kpiStockBajo = document.getElementById("inv-kpi-stock-bajo");
      if (kpiStockBajo) {
        kpiStockBajo.textContent = stockBajo.toLocaleString("es-CL");
        kpiStockBajo.style.color = stockBajo > 0 ? "var(--warning)" : "var(--success)";
      }

      const kpiEstantes = document.getElementById("inv-kpi-estantes");
      if (kpiEstantes) kpiEstantes.textContent = totalEstantes;

      // 4. Renderizar barra de Pills de Estantes
      this.renderEstantesPills();

      // 5. Renderizar vista de Racks / Repisas Físicas
      this.renderInventarioRacks(data);

      // 6. Renderizar vista de Tabla Tradicional
      this.renderInventarioTable(data);

    } catch (e) {
      console.error("Error cargando inventario:", e);
    }
  },

  renderEstantesPills() {
    const container = document.getElementById("inventario-estantes-pills");
    if (!container) return;

    if (!this.estantesSummary || this.estantesSummary.length === 0) return;

    let html = `
      <button type="button" class="estante-pill ${this.selectedEstante === 'all' ? 'active' : ''}" onclick="app.filterInventarioByEstante('all')">
        Todos los Estantes
        <span class="pill-count">${this.estantesSummary.length}</span>
      </button>
    `;

    this.estantesSummary.forEach(e => {
      const isAct = this.selectedEstante === e.id_estanteria ? 'active' : '';
      html += `
        <button type="button" class="estante-pill ${isAct}" onclick="app.filterInventarioByEstante('${e.id_estanteria}')" title="${e.nombre} (${e.total_cajas} cajas)">
          ${e.nombre}
          <span class="pill-count">${e.total_cajas}</span>
        </button>
      `;
    });

    container.innerHTML = html;
  },

  filterInventarioByEstante(estanteId) {
    this.selectedEstante = estanteId;
    this.loadInventario();
  },

  setInventarioView(viewName) {
    this.inventarioView = viewName;
    const btnRacks = document.getElementById("btn-toggle-racks");
    const btnTable = document.getElementById("btn-toggle-table");
    const viewRacks = document.getElementById("inventario-racks-view");
    const viewTable = document.getElementById("inventario-table-view");

    if (viewName === "racks") {
      btnRacks.classList.add("active");
      btnTable.classList.remove("active");
      viewRacks.style.display = "flex";
      viewTable.style.display = "none";
    } else {
      btnTable.classList.add("active");
      btnRacks.classList.remove("active");
      viewTable.style.display = "block";
      viewRacks.style.display = "none";
    }
  },

  renderInventarioRacks(data) {
    const container = document.getElementById("inventario-racks-view");
    if (!container) return;

    if (!data || data.length === 0) {
      container.innerHTML = `
        <div class="panel" style="text-align: center; padding: 2.5rem 1rem; color: var(--text-muted);">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-bottom: 0.5rem; opacity: 0.6;"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>
          <p style="font-weight: 600; font-size: 0.95rem; margin-bottom: 0.25rem;">No se encontraron cajas de insumos</p>
          <small style="color: var(--text-tertiary);">Prueba ajustando los términos de búsqueda o el filtro de estado</small>
        </div>
      `;
      return;
    }

    // Agrupar cajas por estanteria_id
    const estantesMap = new Map();
    data.forEach(item => {
      const eid = item.estanteria_id;
      if (!estantesMap.has(eid)) {
        estantesMap.set(eid, []);
      }
      estantesMap.get(eid).push(item);
    });

    let racksHtml = "";

    // Ordenar los estantes por su número asignado
    const sortedEstantes = Array.from(estantesMap.entries()).sort((a, b) => {
      const infoA = this.estanteMap[a[0]] || {};
      const infoB = this.estanteMap[b[0]] || {};
      return (infoA.numero || 999) - (infoB.numero || 999);
    });

    sortedEstantes.forEach(([eid, cajas]) => {
      const info = this.estanteMap[eid] || {
        numero: "?",
        nombre: `Estante ${eid}`,
        total_cajas: cajas.length,
        total_stock: cajas.reduce((sum, c) => sum + (c.cantidad || 0), 0)
      };

      const estanteCajasCount = cajas.length;
      const estanteStockCount = cajas.reduce((sum, c) => sum + (c.cantidad || 0), 0);

      // Agrupar cajas por seccion_id (Repisas)
      const repisasMap = new Map();
      cajas.forEach(c => {
        const sid = c.seccion_id || "sin_seccion";
        if (!repisasMap.has(sid)) {
          repisasMap.set(sid, []);
        }
        repisasMap.get(sid).push(c);
      });

      // Ordenar repisas (sec_1, sec_2, sec_3, sec_4)
      const sortedRepisas = Array.from(repisasMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));

      let repisasHtml = "";

      sortedRepisas.forEach(([sid, repisaCajas]) => {
        // Obtener número de repisa
        let repisaNum = 1;
        if (sid.includes("_sec_")) {
          const part = sid.split("_sec_")[1];
          repisaNum = parseInt(part, 10) || 1;
        }

        let repisaTitle = `Repisa ${repisaNum}`;
        if (repisaNum === 1) repisaTitle += " (Nivel Superior)";
        else if (repisaNum === 2) repisaTitle += " (Nivel Medio)";
        else if (repisaNum === 3) repisaTitle += " (Nivel Inferior)";
        else if (repisaNum === 4) repisaTitle += " (Nivel Base)";

        // Renderizar cuadros (cajas) de esta repisa
        const boxesHtml = repisaCajas.map(box => {
          const isBajo = box.estado !== "OK";
          const statusBadge = isBajo
            ? `<span class="badge" style="background:var(--warning-subtle); color:var(--warning); font-size:0.68rem; font-weight:700;">STOCK BAJO</span>`
            : `<span class="badge badge-success" style="font-size:0.68rem; font-weight:700;">OK</span>`;

          const boxJson = JSON.stringify(box).replace(/"/g, '&quot;');

          return `
            <div class="box-item ${isBajo ? 'stock-bajo' : ''}" onclick="app.openBoxModal(${boxJson})" title="Clic para ver detalle de la caja">
              <div class="box-header">
                <span class="box-id">${box.id_caja}</span>
                ${statusBadge}
              </div>

              <div class="box-title" title="${box.nombre_caja}">
                ${box.nombre_caja}
              </div>

              <div class="box-body">
                <div>
                  <span class="box-stock-val">${box.cantidad}</span>
                  <span class="box-stock-unit">unidades</span>
                </div>
                ${box.barcode ? `
                  <div class="box-barcode" title="Código de barras: ${box.barcode}">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="16" rx="2"></rect><line x1="7" y1="8" x2="7" y2="16"></line><line x1="10" y1="8" x2="10" y2="16"></line><line x1="14" y1="8" x2="14" y2="16"></line><line x1="17" y1="8" x2="17" y2="16"></line></svg>
                    <span>${box.barcode}</span>
                  </div>
                ` : `<span style="font-size:0.68rem; color:var(--text-tertiary);">S/C</span>`}
              </div>

              <div class="box-footer">
                <span>📍 E${info.numero || 1} • R${repisaNum}</span>
                <div style="display:flex; gap:3px; align-items:center;">
                  <button type="button" class="btn btn-outline btn-sm" style="font-size:0.65rem; padding:1px 5px;" onclick="event.stopPropagation(); app.openIngresoStockModal('${box.id_caja}')" title="Ingresar stock">
                    +Stock
                  </button>
                  <button type="button" class="btn btn-outline-danger btn-sm" style="font-size:0.65rem; padding:1px 5px;" onclick="event.stopPropagation(); app.deleteInsumo('${box.id_caja}', '${(box.nombre_caja || '').replace(/'/g, "\\'")}')" title="Eliminar producto">
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          `;
        }).join("");

        repisasHtml += `
          <div class="shelf-level">
            <div class="shelf-header">
              <div class="shelf-tag">
                <span class="shelf-tag-icon">${repisaNum}</span>
                <span>${repisaTitle}</span>
              </div>
              <div style="display:flex; align-items:center; gap:0.5rem;">
                <span class="badge badge-subtle" style="font-size:0.7rem;">${repisaCajas.length} caja(s)</span>
                <button type="button" class="btn btn-outline btn-sm" style="font-size:0.7rem; padding:2px 7px;" onclick="event.stopPropagation(); app.openNewInsumoModal('${eid}', '${repisaNum}')" title="Crear un producto directamente en esta repisa">
                  + Insumo aquí
                </button>
              </div>
            </div>

            <div class="boxes-grid">
              ${boxesHtml}
            </div>

            <div class="shelf-beam"></div>
          </div>
        `;
      });

      racksHtml += `
        <div class="rack-card">
          <div class="rack-header">
            <div class="rack-title-box">
              <div class="rack-badge-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
              </div>
              <div>
                <h3 class="rack-title">${info.nombre}</h3>
                <p class="rack-subtitle">Estantería hospitalaria #${info.numero} (${eid})</p>
              </div>
            </div>

            <div class="rack-stats-box">
              <span class="badge badge-tecnico">${estanteCajasCount} cajas</span>
              <span class="badge badge-success">${estanteStockCount} un. stock</span>
            </div>
          </div>

          <div class="rack-shelves">
            ${repisasHtml}
          </div>
        </div>
      `;
    });

    container.innerHTML = racksHtml;
  },

  renderInventarioTable(data) {
    const tbody = document.getElementById("inventario-tbody");
    if (!tbody) return;
    tbody.innerHTML = "";

    if (!data || data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:1.5rem; color:var(--text-muted);">No se encontraron cajas de insumos.</td></tr>`;
      return;
    }

    data.forEach((inv) => {
      const tr = document.createElement("tr");
      const statusBadge = inv.estado === "OK" 
        ? `<span class="badge badge-success">OK</span>`
        : `<span class="badge" style="background:var(--warning-subtle); color:var(--warning);">STOCK BAJO</span>`;

      const info = this.estanteMap[inv.estanteria_id] || { numero: "?", nombre: inv.estanteria_id };
      let repisaNum = 1;
      if (inv.seccion_id && inv.seccion_id.includes("_sec_")) {
        repisaNum = parseInt(inv.seccion_id.split("_sec_")[1], 10) || 1;
      }

      const boxJson = JSON.stringify(inv).replace(/"/g, '&quot;');

      tr.innerHTML = `
        <td><code>${inv.id_caja}</code></td>
        <td><strong>${inv.nombre_caja}</strong></td>
        <td><span style="font-size:1.05rem; font-weight:700; color:var(--primary);">${inv.cantidad}</span> <span style="font-size:0.75rem; color:var(--text-tertiary);">un.</span></td>
        <td>
          <div style="font-weight:600; font-size:0.8rem;">Estante #${info.numero || 1}</div>
          <div style="font-size:0.7rem; color:var(--text-tertiary);">Repisa ${repisaNum}</div>
        </td>
        <td><small>${inv.barcode || "S/C"}</small></td>
        <td>${statusBadge}</td>
        <td class="col-actions">
          <div style="display:flex; gap:0.35rem; justify-content:center;">
            <button class="btn btn-outline btn-sm" onclick="app.openBoxModal(${boxJson})" title="Ver ficha completa">
              Ver
            </button>
            <button class="btn btn-outline btn-sm" onclick="app.openIngresoStockModal('${inv.id_caja}')" title="Ingresar stock">
              +Stock
            </button>
            <button class="btn btn-outline-danger btn-sm" onclick="app.deleteInsumo('${inv.id_caja}', '${(inv.nombre_caja || '').replace(/'/g, "\\'")}')" title="Eliminar producto">
              🗑️
            </button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });
  },

  openBoxModal(box) {
    const modal = document.getElementById("modal-caja");
    if (!modal) return;

    const info = this.estanteMap[box.estanteria_id] || { numero: 1, nombre: `Estante #${box.estanteria_id}` };
    let repisaNum = 1;
    if (box.seccion_id && box.seccion_id.includes("_sec_")) {
      repisaNum = parseInt(box.seccion_id.split("_sec_")[1], 10) || 1;
    }

    let repisaNombre = `Repisa ${repisaNum}`;
    if (repisaNum === 1) repisaNombre += " (Nivel Superior)";
    else if (repisaNum === 2) repisaNombre += " (Nivel Medio)";
    else if (repisaNum === 3) repisaNombre += " (Nivel Inferior)";
    else if (repisaNum === 4) repisaNombre += " (Nivel Base)";

    const isBajo = box.estado !== "OK";
    const statusBadge = isBajo
      ? `<span class="badge" style="background:var(--warning-subtle); color:var(--warning); font-weight:700;">STOCK BAJO</span>`
      : `<span class="badge badge-success" style="font-weight:700;">STOCK ÓPTIMO (OK)</span>`;

    const boxJson = JSON.stringify(box).replace(/"/g, '&quot;');
    const safeNombre = (box.nombre_caja || '').replace(/'/g, "\\'");

    document.getElementById("modal-caja-title").textContent = box.nombre_caja;
    document.getElementById("modal-caja-subtitle").textContent = `Identificador de Caja: ${box.id_caja}`;

    const body = document.getElementById("modal-caja-body");
    body.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 1rem;">
        <!-- Ubicación Física Destacada -->
        <div style="background: var(--primary-subtle); border: 1px solid var(--primary-border); border-radius: var(--radius-lg); padding: 1rem;">
          <div style="font-size: 0.75rem; text-transform: uppercase; font-weight: 700; color: var(--primary); letter-spacing: 0.05em; margin-bottom: 0.35rem;">
            📍 Ubicación Asignada en Bodega
          </div>
          <div style="display: flex; gap: 1.5rem; align-items: center; margin-top: 0.25rem;">
            <div>
              <div style="font-size: 0.72rem; color: var(--text-secondary);">Estantería</div>
              <div style="font-size: 1.15rem; font-weight: 700; color: var(--text-primary);">${info.nombre}</div>
            </div>
            <div style="width: 1px; height: 35px; background: var(--primary-border);"></div>
            <div>
              <div style="font-size: 0.72rem; color: var(--text-secondary);">Nivel / Estante</div>
              <div style="font-size: 1.15rem; font-weight: 700; color: var(--text-primary);">${repisaNombre}</div>
            </div>
          </div>
        </div>

        <!-- Ficha de Stock y Códigos -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
          <div style="background: var(--bg-subtle); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 0.75rem;">
            <div style="font-size: 0.72rem; color: var(--text-tertiary);">Cantidad en Stock</div>
            <div style="font-size: 1.45rem; font-weight: 700; color: var(--primary);">${box.cantidad} <span style="font-size: 0.8rem; font-weight: 500; color: var(--text-secondary);">unidades</span></div>
          </div>

          <div style="background: var(--bg-subtle); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 0.75rem;">
            <div style="font-size: 0.72rem; color: var(--text-tertiary);">Estado del Stock</div>
            <div style="margin-top: 0.35rem;">${statusBadge}</div>
          </div>
        </div>

        <!-- Detalles de Código y Referencias -->
        <div style="border: 1px solid var(--border); border-radius: var(--radius-md); padding: 0.85rem; font-size: 0.825rem; display: flex; flex-direction: column; gap: 0.45rem;">
          <div style="display: flex; justify-content: space-between; border-bottom: 1px dashed var(--border-subtle); padding-bottom: 0.4rem;">
            <span style="color: var(--text-tertiary);">Código de Barras (EAN):</span>
            <strong>${box.barcode || "Sin código de barras registrado"}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; border-bottom: 1px dashed var(--border-subtle); padding-bottom: 0.4rem;">
            <span style="color: var(--text-tertiary);">Código Interno Estante:</span>
            <code>${box.estanteria_id}</code>
          </div>
          <div style="display: flex; justify-content: space-between; border-bottom: 1px dashed var(--border-subtle); padding-bottom: 0.4rem;">
            <span style="color: var(--text-tertiary);">Código Sección:</span>
            <code>${box.seccion_id}</code>
          </div>
          ${box.finicio ? `
            <div style="display: flex; justify-content: space-between;">
              <span style="color: var(--text-tertiary);">Fecha Inicio:</span>
              <span>${box.finicio}</span>
            </div>
          ` : ""}
          ${box.ftermino ? `
            <div style="display: flex; justify-content: space-between;">
              <span style="color: var(--text-tertiary);">Fecha Término / Venc.:</span>
              <span>${box.ftermino}</span>
            </div>
          ` : ""}
        </div>

        <!-- Botones de Acción de la Ficha -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 1rem; padding-top: 0.85rem; border-top: 1px solid var(--border-subtle); gap: 0.5rem; flex-wrap: wrap;">
          <button type="button" class="btn btn-outline-danger btn-sm" onclick="app.deleteInsumo('${box.id_caja}', '${safeNombre}')" title="Eliminar permanentemente este producto">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            Eliminar
          </button>
          
          <div style="display: flex; gap: 0.5rem; align-items: center;">
            <button type="button" class="btn btn-outline btn-sm" onclick="app.openIngresoStockModal('${box.id_caja}')" title="Sumar stock a este producto">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
              Ingresar Stock
            </button>
            <button type="button" class="btn btn-outline btn-sm" onclick='app.openEditInsumoModal(${boxJson})' title="Editar información o ubicación">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
              Editar
            </button>
            <button type="button" class="btn btn-primary btn-sm" onclick="app.closeCajaModal()">
              Cerrar
            </button>
          </div>
        </div>
      </div>
    `;

    modal.classList.add("active");
  },

  closeCajaModal() {
    const modal = document.getElementById("modal-caja");
    if (modal) modal.classList.remove("active");
  },

  /* ==========================================================================
     CRUD DE INSUMOS / PRODUCTOS DE BODEGA
     ========================================================================== */
  populateEstanteriaSelect(selectId, selectedValue = null) {
    const select = document.getElementById(selectId);
    if (!select) return;
    select.innerHTML = "";

    const estantes = (this.estantesSummary && this.estantesSummary.length > 0)
      ? this.estantesSummary
      : Object.values(this.estanteMap);

    if (estantes.length === 0) {
      for (let i = 1; i <= 16; i++) {
        const opt = document.createElement("option");
        opt.value = `shelf_${i}`;
        opt.textContent = `Estante #${i}`;
        select.appendChild(opt);
      }
      return;
    }

    const sorted = [...estantes].sort((a, b) => (a.numero || 0) - (b.numero || 0));

    sorted.forEach(e => {
      const opt = document.createElement("option");
      opt.value = e.id_estanteria;
      opt.textContent = e.nombre || `Estante #${e.numero}`;
      if (selectedValue && e.id_estanteria === selectedValue) {
        opt.selected = true;
      }
      select.appendChild(opt);
    });
  },

  openNewInsumoModal(defaultEstante = null, defaultRepisa = null) {
    const form = document.getElementById("form-insumo");
    if (form) form.reset();

    const title = document.getElementById("modal-form-insumo-title");
    if (title) title.textContent = "Crear Nuevo Insumo / Caja";

    document.getElementById("insumo-edit-id").value = "";
    document.getElementById("btn-save-insumo").textContent = "Crear Producto";

    this.populateEstanteriaSelect("insumo-estanteria", defaultEstante);

    if (defaultRepisa) {
      const repisaSelect = document.getElementById("insumo-repisa");
      if (repisaSelect) repisaSelect.value = String(defaultRepisa);
    }

    document.getElementById("insumo-cantidad").value = "1";
    document.getElementById("insumo-estado").value = "OK";
    document.getElementById("insumo-barcode").value = "";

    const modal = document.getElementById("modal-form-insumo");
    if (modal) modal.classList.add("active");
  },

  closeInsumoModal() {
    const modal = document.getElementById("modal-form-insumo");
    if (modal) modal.classList.remove("active");
  },

  openEditInsumoModal(box) {
    if (typeof box === "string") {
      box = this.inventarioData.find(b => b.id_caja === box);
    }
    if (!box) return;

    this.closeCajaModal();

    const title = document.getElementById("modal-form-insumo-title");
    if (title) title.textContent = `Editar Insumo: ${box.nombre_caja}`;

    document.getElementById("insumo-edit-id").value = box.id_caja;
    document.getElementById("insumo-nombre").value = box.nombre_caja || "";
    document.getElementById("insumo-cantidad").value = box.cantidad || 0;
    document.getElementById("insumo-estado").value = box.estado || "OK";
    document.getElementById("insumo-barcode").value = box.barcode || "";

    this.populateEstanteriaSelect("insumo-estanteria", box.estanteria_id);

    let repisaNum = "1";
    if (box.seccion_id && box.seccion_id.includes("_sec_")) {
      repisaNum = box.seccion_id.split("_sec_")[1];
    }
    const repSelect = document.getElementById("insumo-repisa");
    if (repSelect) repSelect.value = repisaNum;

    document.getElementById("btn-save-insumo").textContent = "Guardar Cambios";

    const modal = document.getElementById("modal-form-insumo");
    if (modal) modal.classList.add("active");
  },

  async saveInsumo(event) {
    event.preventDefault();

    const editId = document.getElementById("insumo-edit-id").value;
    const nombre = document.getElementById("insumo-nombre").value.trim();
    const estanteriaId = document.getElementById("insumo-estanteria").value;
    const repisa = document.getElementById("insumo-repisa").value;
    const cantidad = parseInt(document.getElementById("insumo-cantidad").value, 10) || 0;
    const estado = document.getElementById("insumo-estado").value;
    const barcode = document.getElementById("insumo-barcode").value.trim();

    if (!nombre) {
      this.showToast("El nombre del insumo es obligatorio", "error");
      return;
    }

    const payload = {
      nombre_caja: nombre,
      cantidad: cantidad,
      estanteria_id: estanteriaId,
      seccion_id: `${estanteriaId}_sec_${repisa}`,
      barcode: barcode || null,
      estado: estado
    };

    const saveBtn = document.getElementById("btn-save-insumo");
    saveBtn.disabled = true;

    try {
      let res;
      if (editId) {
        res = await fetch(`/api/inventario/${encodeURIComponent(editId)}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch("/api/inventario", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      }

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Error al guardar producto");
      }

      this.showToast(editId ? "Producto actualizado correctamente" : "Producto registrado exitosamente en bodega", "success");
      this.closeInsumoModal();

      this.estantesSummary = [];
      await this.loadInventario();

    } catch (err) {
      console.error("Error guardando producto:", err);
      this.showToast(err.message, "error");
    } finally {
      saveBtn.disabled = false;
    }
  },

  openIngresoStockModal(defaultBoxId = null) {
    const select = document.getElementById("ingreso-select-caja");
    if (!select) return;
    select.innerHTML = "";

    const sorted = [...this.inventarioData].sort((a, b) => (a.nombre_caja || "").localeCompare(b.nombre_caja || ""));

    if (sorted.length === 0) {
      this.showToast("No hay insumos disponibles para ingresar stock", "warning");
      return;
    }

    sorted.forEach(box => {
      const opt = document.createElement("option");
      opt.value = box.id_caja;
      const shelfInfo = this.estanteMap[box.estanteria_id];
      const shelfText = shelfInfo ? `Estante #${shelfInfo.numero}` : box.estanteria_id;
      opt.textContent = `${box.nombre_caja} (Stock actual: ${box.cantidad} un. | ${shelfText})`;
      if (defaultBoxId && box.id_caja === defaultBoxId) {
        opt.selected = true;
      }
      select.appendChild(opt);
    });

    document.getElementById("ingreso-cantidad").value = "1";

    const modal = document.getElementById("modal-ingreso-stock");
    if (modal) modal.classList.add("active");
  },

  closeIngresoStockModal() {
    const modal = document.getElementById("modal-ingreso-stock");
    if (modal) modal.classList.remove("active");
  },

  async submitIngresoStock(event) {
    event.preventDefault();

    const boxId = document.getElementById("ingreso-select-caja").value;
    const cantidad = parseInt(document.getElementById("ingreso-cantidad").value, 10);

    if (!boxId) {
      this.showToast("Selecciona un producto para ingresar stock", "error");
      return;
    }
    if (isNaN(cantidad) || cantidad <= 0) {
      this.showToast("La cantidad a sumar debe ser mayor a 0", "error");
      return;
    }

    const submitBtn = document.getElementById("btn-submit-ingreso");
    submitBtn.disabled = true;

    try {
      const res = await fetch(`/api/inventario/${encodeURIComponent(boxId)}/ingreso`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cantidad: cantidad })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Error al sumar stock");
      }

      const data = await res.json();
      this.showToast(`Stock actualizado exitosamente (+${cantidad} un.). Total ahora: ${data.caja.cantidad} un.`, "success");
      this.closeIngresoStockModal();
      this.closeCajaModal();

      this.estantesSummary = [];
      await this.loadInventario();

    } catch (err) {
      console.error("Error ingresando stock:", err);
      this.showToast(err.message, "error");
    } finally {
      submitBtn.disabled = false;
    }
  },

  async deleteInsumo(idCaja, nombreCaja) {
    if (!confirm(`¿Estás seguro de que deseas eliminar permanentemente el producto "${nombreCaja}" (${idCaja}) de la bodega?\n\nEsta acción no se puede deshacer.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/inventario/${encodeURIComponent(idCaja)}`, {
        method: "DELETE"
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Error al eliminar producto");
      }

      this.showToast(`Producto "${nombreCaja}" eliminado de bodega`, "info");
      this.closeCajaModal();

      this.estantesSummary = [];
      await this.loadInventario();

    } catch (err) {
      console.error("Error eliminando insumo:", err);
      this.showToast(err.message, "error");
    }
  },

  filterInventario() {
    this.loadInventario();
  },

  filterInventarioDebounced() {
    clearTimeout(this.debounceTimers.inv);
    this.debounceTimers.inv = setTimeout(() => this.loadInventario(), 300);
  },

  exportInventarioExcel() {
    const qInput = document.getElementById("inventario-search");
    const q = qInput ? qInput.value.trim() : "";
    const estadoSelect = document.getElementById("inventario-filtro-estado");
    const estado = estadoSelect ? estadoSelect.value : "";

    let url = "/api/inventario/export/excel";
    const params = new URLSearchParams();
    if (q) params.append("q", q);
    if (estado) params.append("estado", estado);
    if (this.selectedEstante && this.selectedEstante !== "all") {
      params.append("estanteria", this.selectedEstante);
    }
    const qs = params.toString();
    if (qs) url += `?${qs}`;

    this.showToast("Generando y descargando reporte Excel de bodega...", "info");
    window.location.href = url;
  },

  /* ==========================================================================
     TOAST NOTIFICATIONS
     ========================================================================== */
  showToast(message, type = "info") {
    const container = document.getElementById("toast-container");
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateX(100%)";
      toast.style.transition = "all 0.3s ease";
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }
};

// Arrancar cuando el DOM esté listo
document.addEventListener("DOMContentLoaded", () => {
  app.init();
});
