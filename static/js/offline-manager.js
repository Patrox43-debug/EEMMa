/**
 * EEMM - Módulo de Almacenamiento Local y Sincronización Automática (Offline-First)
 * Permite guardar chequeos y datos en IndexedDB cuando no hay conexión y sincronizarlos
 * automáticamente en cuanto se recupera el acceso a Internet.
 */

class OfflineManagerClass {
  constructor() {
    this.dbName = "eemm_offline_db";
    this.dbVersion = 1;
    this.db = null;
    this.isOnline = navigator.onLine;
    this.isSyncing = false;
    this.connectionListeners = [];
    this.queueListeners = [];
    this.syncListeners = [];
    this.healthCheckTimer = null;
  }

  /**
   * Inicializa la base de datos IndexedDB y los escuchadores de red.
   */
  async init() {
    try {
      await this.openDB();
      console.log("[OfflineManager] Base de datos local IndexedDB conectada");
    } catch (err) {
      console.warn("[OfflineManager] No se pudo abrir IndexedDB, usando fallback:", err);
    }

    this.setupNetworkListeners();
    this.startHealthChecks();
    
    // Si al iniciar tenemos conexión, intentamos sincronizar datos pendientes
    if (this.isOnline) {
      setTimeout(() => this.syncAll(), 2000);
    }

    this.notifyQueueChange();
    this.notifyConnectionChange(this.isOnline);
  }

  /**
   * Abre o crea las tablas en IndexedDB.
   */
  openDB() {
    return new Promise((resolve, reject) => {
      if (!window.indexedDB) {
        return reject(new Error("IndexedDB no soportado en este navegador"));
      }

      const req = indexedDB.open(this.dbName, this.dbVersion);

      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        // Almacén para solicitudes pendientes de sincronización
        if (!db.objectStoreNames.contains("sync_queue")) {
          const store = db.createObjectStore("sync_queue", { keyPath: "id", autoIncrement: true });
          store.createIndex("type", "type", { unique: false });
          store.createIndex("status", "status", { unique: false });
          store.createIndex("createdAt", "createdAt", { unique: false });
        }
        // Almacén para caché local de catálogos
        if (!db.objectStoreNames.contains("cache_store")) {
          db.createObjectStore("cache_store", { keyPath: "key" });
        }
      };

      req.onsuccess = (e) => {
        this.db = e.target.result;
        resolve(this.db);
      };

      req.onerror = (e) => {
        reject(e.target.error);
      };
    });
  }

  /**
   * Configura eventos online/offline nativos del navegador.
   */
  setupNetworkListeners() {
    window.addEventListener("online", () => {
      console.log("[OfflineManager] Evento online detectado");
      this.checkRealConnection(true);
    });

    window.addEventListener("offline", () => {
      console.log("[OfflineManager] Evento offline detectado");
      this.isOnline = false;
      this.notifyConnectionChange(false);
    });
  }

  /**
   * Verifica activamente si hay salida real a Internet mediante un ping ligero.
   */
  async checkRealConnection(triggerSyncIfOnline = false) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const res = await fetch("/api/health", {
        method: "GET",
        cache: "no-store",
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const wasOffline = !this.isOnline;
      this.isOnline = res.ok;
      this.notifyConnectionChange(this.isOnline);

      if (this.isOnline && (wasOffline || triggerSyncIfOnline)) {
        console.log("[OfflineManager] Conexión activa restaurada, iniciando sincronización...");
        this.syncAll();
      }
    } catch (err) {
      if (this.isOnline) {
        this.isOnline = false;
        this.notifyConnectionChange(false);
      }
    }
  }

  /**
   * Monitoreo periódico de conectividad en segundo plano (cada 20s).
   */
  startHealthChecks() {
    if (this.healthCheckTimer) clearInterval(this.healthCheckTimer);
    this.healthCheckTimer = setInterval(() => {
      this.checkRealConnection(true);
    }, 20000);
  }

  /* ==========================================================================
     COLA DE PETICIONES OFFLINE (sync_queue)
     ========================================================================== */

  /**
   * Encola una solicitud para ser subida cuando haya internet.
   */
  async queueRequest(type, url, method, payload, extra = {}) {
    const item = {
      type,
      url,
      method: method.toUpperCase(),
      payload,
      extra,
      createdAt: new Date().toISOString(),
      attempts: 0,
      status: "pending",
    };

    if (this.db) {
      await new Promise((resolve, reject) => {
        const tx = this.db.transaction("sync_queue", "readwrite");
        const store = tx.objectStore("sync_queue");
        const req = store.add(item);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
    } else {
      // Fallback a localStorage si IndexedDB no está disponible
      const queue = JSON.parse(localStorage.getItem("eemm_fallback_queue") || "[]");
      item.id = Date.now();
      queue.push(item);
      localStorage.setItem("eemm_fallback_queue", JSON.stringify(queue));
    }

    console.log(`[OfflineManager] Solicitud guardada localmente en cola (${type}):`, extra);
    this.notifyQueueChange();
    return item;
  }

  /**
   * Obtiene todos los elementos pendientes en cola.
   */
  async getPendingItems(filterType = null) {
    if (this.db) {
      return new Promise((resolve, reject) => {
        const tx = this.db.transaction("sync_queue", "readonly");
        const store = tx.objectStore("sync_queue");
        const req = store.getAll();
        req.onsuccess = () => {
          let items = req.result || [];
          if (filterType) {
            items = items.filter((i) => i.type === filterType);
          }
          // Ordenar del más antiguo al más reciente
          items.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
          resolve(items);
        };
        req.onerror = () => reject(req.error);
      });
    } else {
      const queue = JSON.parse(localStorage.getItem("eemm_fallback_queue") || "[]");
      if (filterType) {
        return queue.filter((i) => i.type === filterType);
      }
      return queue;
    }
  }

  /**
   * Obtiene la cantidad de elementos pendientes.
   */
  async getPendingCount() {
    const items = await this.getPendingItems();
    return items.length;
  }

  /**
   * Elimina un elemento de la cola tras una sincronización exitosa.
   */
  async removeQueueItem(id) {
    if (this.db) {
      await new Promise((resolve, reject) => {
        const tx = this.db.transaction("sync_queue", "readwrite");
        const store = tx.objectStore("sync_queue");
        const req = store.delete(id);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } else {
      let queue = JSON.parse(localStorage.getItem("eemm_fallback_queue") || "[]");
      queue = queue.filter((i) => i.id !== id);
      localStorage.setItem("eemm_fallback_queue", JSON.stringify(queue));
    }
    this.notifyQueueChange();
  }

  /**
   * Procesa y sincroniza todos los elementos pendientes con el servidor.
   */
  async syncAll() {
    if (this.isSyncing) return;
    const items = await this.getPendingItems();
    if (items.length === 0) return;

    // Verificar primero conectividad real
    if (!navigator.onLine) {
      this.isOnline = false;
      this.notifyConnectionChange(false);
      return;
    }

    this.isSyncing = true;
    console.log(`[OfflineManager] Iniciando sincronización de ${items.length} elemento(s)...`);

    let syncedCount = 0;
    let failedCount = 0;

    for (const item of items) {
      try {
        const res = await fetch(item.url, {
          method: item.method,
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(item.payload),
        });

        if (res.ok) {
          await this.removeQueueItem(item.id);
          syncedCount++;
          console.log(`[OfflineManager] Elemento #${item.id} (${item.type}) sincronizado correctamente`);
        } else {
          // Error devuelto por el servidor (ej: 400 o 500)
          const errData = await res.json().catch(() => ({}));
          console.error(`[OfflineManager] Error servidor al sincronizar #${item.id}:`, errData);
          failedCount++;
          // Si el servidor responde con 4xx, podemos incrementar intentos
          item.attempts = (item.attempts || 0) + 1;
        }
      } catch (networkErr) {
        // Corte de conexión durante el envío
        console.warn(`[OfflineManager] Pérdida de conexión al sincronizar #${item.id}:`, networkErr);
        this.isOnline = false;
        this.notifyConnectionChange(false);
        break; // Detener hasta que vuelva el internet
      }
    }

    this.isSyncing = false;
    const remainingCount = await this.getPendingCount();

    if (syncedCount > 0) {
      this.notifySyncComplete({
        syncedCount,
        remainingCount,
      });
    }
  }

  /* ==========================================================================
     CACHÉ LOCAL DE CATÁLOGOS (cache_store)
     ========================================================================== */

  async cacheData(key, data) {
    if (this.db) {
      return new Promise((resolve) => {
        try {
          const tx = this.db.transaction("cache_store", "readwrite");
          const store = tx.objectStore("cache_store");
          store.put({ key, data, updatedAt: new Date().toISOString() });
          resolve();
        } catch (e) {
          resolve();
        }
      });
    } else {
      localStorage.setItem(`eemm_cache_${key}`, JSON.stringify(data));
    }
  }

  async getCachedData(key) {
    if (this.db) {
      return new Promise((resolve) => {
        try {
          const tx = this.db.transaction("cache_store", "readonly");
          const store = tx.objectStore("cache_store");
          const req = store.get(key);
          req.onsuccess = () => resolve(req.result ? req.result.data : null);
          req.onerror = () => resolve(null);
        } catch (e) {
          resolve(null);
        }
      });
    } else {
      const raw = localStorage.getItem(`eemm_cache_${key}`);
      return raw ? JSON.parse(raw) : null;
    }
  }

  /* ==========================================================================
     SUSCRIPTORES Y EVENTOS
     ========================================================================== */

  onConnectionChange(cb) {
    this.connectionListeners.push(cb);
    cb(this.isOnline);
  }

  onQueueChange(cb) {
    this.queueListeners.push(cb);
    this.getPendingCount().then((count) => cb(count));
  }

  onSyncComplete(cb) {
    this.syncListeners.push(cb);
  }

  notifyConnectionChange(status) {
    this.connectionListeners.forEach((cb) => {
      try { cb(status); } catch (e) { console.error(e); }
    });
  }

  async notifyQueueChange() {
    const count = await this.getPendingCount();
    this.queueListeners.forEach((cb) => {
      try { cb(count); } catch (e) { console.error(e); }
    });
  }

  notifySyncComplete(info) {
    this.syncListeners.forEach((cb) => {
      try { cb(info); } catch (e) { console.error(e); }
    });
  }
}

// Instancia global
window.OfflineManager = new OfflineManagerClass();
