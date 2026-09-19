/**
 * EEMM - Aplicación Web Principal
 * Gestión de Equipos Médicos, Chequeos Preventivos con Fotos y Firma
 */

const app = {
  currentUser: null,
  selectedEquipment: null,
  signaturePad: null,
  photoManager: null,
  activeTab: "chequeo",
  debounceTimers: {},

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
    this.initTheme();
    this.renderPlaceholderChecklist();
    this.loadUnidades();

    // Inicializar manejador de fotos y firma
    this.photoManager = new PhotoManager("photos-container");
    this.signaturePad = new SignaturePad("signature-canvas");

    // Configurar buscador con autocompletado
    this.initAutocomplete();

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
    document.getElementById("theme-toggle-btn").addEventListener("click", () => {
      this.toggleTheme();
    });
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
      sunIcon.style.display = "block";
      moonIcon.style.display = "none";
    } else {
      sunIcon.style.display = "none";
      moonIcon.style.display = "block";
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
    const views = ["login", "chequeo", "historial", "equipos", "admin", "inventario"];
    views.forEach((v) => {
      const el = document.getElementById(`view-${v}`);
      if (el) el.style.display = v === tabName ? "block" : "none";
    });

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
      this.loadHistorial();
    } else if (tabName === "equipos") {
      this.loadEquiposCatalog();
    } else if (tabName === "admin") {
      this.loadAdminDashboard();
    } else if (tabName === "inventario") {
      this.loadInventario();
    } else if (tabName === "chequeo" && this.signaturePad) {
      // Reajustar canvas para tamaño correcto
      setTimeout(() => this.signaturePad.initCanvas(), 100);
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
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rut: rutInput, password: passInput })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "RUT o contraseña incorrectos");
      }

      const data = await res.json();
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

    // Actualizar UI Header
    document.getElementById("user-profile-badge").style.display = "flex";
    document.getElementById("header-user-name").textContent = user.tecnico || user.nombre;
    const initialsEl = document.getElementById("user-avatar-initials");
    if (initialsEl) initialsEl.textContent = (user.nombre || "U").charAt(0).toUpperCase();

    const roleBadge = document.getElementById("header-user-role");
    roleBadge.textContent = user.rol;
    roleBadge.className = `badge ${user.rol === "administrador" ? "badge-admin" : "badge-tecnico"}`;
    document.getElementById("btn-logout").style.display = "inline-flex";

    // Mostrar barra de navegación
    document.getElementById("app-nav").style.display = "flex";

    // Pestaña Admin visible solo si rol === 'administrador'
    const adminTab = document.getElementById("nav-tab-admin");
    if (user.rol === "administrador") {
      adminTab.style.display = "flex";
    } else {
      adminTab.style.display = "none";
    }

    // Badge técnico en formulario
    document.getElementById("chequeo-tecnico-badge").textContent = user.tecnico || user.nombre;

    // Ir a pestaña por defecto
    if (user.rol === "administrador") {
      this.navigate("admin");
    } else {
      this.navigate("chequeo");
    }
  },

  logout() {
    this.currentUser = null;
    localStorage.removeItem("eemm_user");
    document.getElementById("user-profile-badge").style.display = "none";
    document.getElementById("btn-logout").style.display = "none";
    document.getElementById("app-nav").style.display = "none";
    this.navigate("login");
    this.showToast("Has cerrado sesión.", "info");
  },

  /* ==========================================================================
     CATÁLOGOS: Unidades & Checklist
     ========================================================================== */
  async loadUnidades() {
    try {
      const res = await fetch("/api/unidades");
      const unidades = await res.json();
      
      const select = document.getElementById("select-unidad");
      const filtro = document.getElementById("filtro-historial-unidad");
      
      unidades.forEach((u) => {
        const opt = document.createElement("option");
        opt.value = u;
        opt.textContent = u;
        select.appendChild(opt);

        const opt2 = document.createElement("option");
        opt2.value = u;
        opt2.textContent = u;
        filtro.appendChild(opt2);
      });
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
        try {
          const res = await fetch(`/api/equipos?q=${encodeURIComponent(val)}&limit=15`);
          const equipos = await res.json();
          this.renderAutocomplete(equipos, dropdown);
        } catch (e) {
          console.error("Error buscando equipos:", e);
        }
      }, 250);
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
        firma_nombre: firmaNombre
      };

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

      // Limpiar formulario y viajar a historial
      this.resetChequeoForm();
      this.navigate("historial");

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
     HISTORIAL DE CHEQUEOS PREVENTIVOS
     ========================================================================== */
  async loadHistorial() {
    try {
      const qInput = document.getElementById("filtro-historial-query") || document.getElementById("filtro-historial-search");
      const q = qInput ? qInput.value.trim() : "";

      const uniEl = document.getElementById("filtro-historial-unidad");
      const unidad = uniEl ? uniEl.value : "";

      let url = `/api/chequeos?limit=100`;
      if (q) url += `&q=${encodeURIComponent(q)}`;
      if (unidad) url += `&unidad=${encodeURIComponent(unidad)}`;

      const res = await fetch(url);
      if (!res.ok) throw new Error("Error al obtener el historial");
      const data = await res.json();
      const tbody = document.getElementById("historial-tbody");
      tbody.innerHTML = "";

      if (!data || data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:1.5rem; color:var(--text-muted);">No se encontraron chequeos preventivos.</td></tr>`;
        return;
      }

      data.forEach((item) => {
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

        tr.innerHTML = `
          <td><strong>#${item.id_registro}</strong></td>
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
            <span class="badge" style="background:var(--primary-subtle); color:var(--primary); font-size:0.72rem; max-width:140px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; display:inline-block;" title="${item.unidad || "-"}">
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
              <a href="/api/chequeos/${item.id_registro}/pdf" target="_blank" class="btn btn-primary btn-sm" title="Descargar o imprimir informe en PDF" style="text-decoration: none;">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><line x1="9" y1="15" x2="15" y2="15"></line></svg>
                PDF
              </a>
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

      document.getElementById("modal-title").textContent = `Chequeo Preventivo #${item.id_registro}`;
      const pdfBtn = document.getElementById("modal-btn-pdf");
      if (pdfBtn) {
        pdfBtn.href = `/api/chequeos/${item.id_registro}/pdf`;
      }

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

        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:1.25rem; padding-top:0.85rem; border-top:1px solid var(--border-color);">
          <a href="/api/chequeos/${item.id_registro}/pdf" target="_blank" class="btn btn-primary" style="display:inline-flex; align-items:center; gap:6px; text-decoration:none;">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><line x1="9" y1="15" x2="15" y2="15"></line></svg>
            Descargar Informe PDF Oficial
          </a>
          <button type="button" class="btn btn-outline" onclick="app.closeModal()">Cerrar</button>
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
      const res = await fetch(`/api/equipos?limit=50&q=${encodeURIComponent(q)}`);
      const data = await res.json();
      const tbody = document.getElementById("equipos-catalog-tbody");
      tbody.innerHTML = "";

      data.forEach((eq) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td><strong>#${eq.id_equipo}</strong></td>
          <td><strong>${eq.nombre}</strong></td>
          <td>${eq.marca || "-"}</td>
          <td>${eq.modelo || "-"}</td>
          <td><code>${eq.serie || "S/N"}</code></td>
          <td><span class="badge badge-tecnico">${eq.categoria || "General"}</span></td>
          <td><span class="badge badge-success">${eq.estado || "Operativo"}</span></td>
          <td class="col-actions">
            <button class="btn btn-primary btn-sm" onclick='app.jumpToChequeoWithEquipo(${JSON.stringify(eq)})'>
              Hacer Chequeo
            </button>
          </td>
        `;
        tbody.appendChild(tr);
      });
    } catch (e) {
      console.error(e);
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
                <span style="color:var(--primary); font-weight:600; font-size:0.68rem;">Ver ficha →</span>
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
              <span class="badge badge-subtle" style="font-size:0.7rem;">${repisaCajas.length} caja(s)</span>
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
          <button class="btn btn-outline btn-sm" onclick="app.openBoxModal(${boxJson})" title="Ver ficha de caja">
            Ver Ficha
          </button>
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

        <div style="display: flex; justify-content: flex-end; margin-top: 0.5rem;">
          <button type="button" class="btn btn-primary" onclick="app.closeCajaModal()">
            Entendido
          </button>
        </div>
      </div>
    `;

    modal.classList.add("active");
  },

  closeCajaModal() {
    const modal = document.getElementById("modal-caja");
    if (modal) modal.classList.remove("active");
  },

  filterInventario() {
    this.loadInventario();
  },

  filterInventarioDebounced() {
    clearTimeout(this.debounceTimers.inv);
    this.debounceTimers.inv = setTimeout(() => this.loadInventario(), 300);
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
