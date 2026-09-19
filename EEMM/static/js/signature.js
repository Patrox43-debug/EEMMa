/**
 * EEMM - Módulo de Firma Digital en Canvas
 * Soporta mouse, lápiz stylus y pantallas táctiles con alta resolución.
 */

class SignaturePad {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;

    this.ctx = this.canvas.getContext("2d");
    this.isDrawing = false;
    this.hasDrawn = false;
    this.points = [];

    this.initCanvas();
    this.bindEvents();
  }

  initCanvas() {
    // Configurar resolución adecuada para pantallas Retina / High-DPI
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.scale(dpr, dpr);

    this.updateStrokeStyle();
  }

  updateStrokeStyle() {
    const isDark = document.documentElement.getAttribute("data-theme") === "dark";
    this.ctx.strokeStyle = isDark ? "#60a5fa" : "#1e3a8a"; // Tono azul según el tema
    this.ctx.lineWidth = 2.5;
    this.ctx.lineCap = "round";
    this.ctx.lineJoin = "round";
  }

  bindEvents() {
    // Eventos Mouse
    this.canvas.addEventListener("mousedown", (e) => this.startDrawing(e));
    window.addEventListener("mousemove", (e) => this.draw(e));
    window.addEventListener("mouseup", () => this.stopDrawing());

    // Eventos Touch (Móviles y Tablets)
    this.canvas.addEventListener("touchstart", (e) => {
      e.preventDefault();
      this.startDrawing(e.touches[0]);
    }, { passive: false });

    window.addEventListener("touchmove", (e) => {
      if (this.isDrawing && e.touches.length > 0) {
        e.preventDefault();
        this.draw(e.touches[0]);
      }
    }, { passive: false });

    window.addEventListener("touchend", () => this.stopDrawing());

    // Redimensionar si cambia el tamaño de la ventana
    window.addEventListener("resize", () => {
      // Guardar trazo actual antes de redimensionar
      const data = this.toDataURL();
      this.initCanvas();
      if (this.hasDrawn && data) {
        const img = new Image();
        img.onload = () => this.ctx.drawImage(img, 0, 0, this.canvas.clientWidth, this.canvas.clientHeight);
        img.src = data;
      }
    });
  }

  getCoordinates(e) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }

  startDrawing(e) {
    const rect = this.canvas.getBoundingClientRect();
    if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) {
      return;
    }
    this.isDrawing = true;
    this.hasDrawn = true;
    this.updateStrokeStyle();
    const pos = this.getCoordinates(e);
    this.ctx.beginPath();
    this.ctx.moveTo(pos.x, pos.y);
  }

  draw(e) {
    if (!this.isDrawing) return;
    const pos = this.getCoordinates(e);
    this.ctx.lineTo(pos.x, pos.y);
    this.ctx.stroke();
  }

  stopDrawing() {
    if (this.isDrawing) {
      this.isDrawing = false;
      this.ctx.closePath();
    }
  }

  clear() {
    const dpr = window.devicePixelRatio || 1;
    this.ctx.clearRect(0, 0, this.canvas.width / dpr, this.canvas.height / dpr);
    this.hasDrawn = false;
  }

  isEmpty() {
    return !this.hasDrawn;
  }

  toDataURL() {
    if (this.isEmpty()) return null;
    return this.canvas.toDataURL("image/png");
  }
}
