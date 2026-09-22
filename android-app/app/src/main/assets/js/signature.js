/**
 * EEMM - Módulo de Firma Digital en Canvas
 * Soporta mouse, lápiz stylus y pantallas táctiles con alta resolución (Pointer Events).
 */

class SignaturePad {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;

    this.ctx = this.canvas.getContext("2d", { willReadFrequently: true });
    this.isDrawing = false;
    this.hasDrawn = false;
    this.dpr = window.devicePixelRatio || 1;

    this.initCanvas();
    this.bindEvents();
  }

  initCanvas() {
    if (!this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      // Si el elemento está oculto en el DOM, diferir hasta que se muestre
      return;
    }

    const dpr = window.devicePixelRatio || 1;
    this.dpr = dpr;

    // Preservar trazo si ya existía antes de redimensionar
    let previousData = null;
    if (this.hasDrawn && this.canvas.width > 0 && this.canvas.height > 0) {
      try {
        previousData = this.canvas.toDataURL("image/png");
      } catch (e) {}
    }

    this.canvas.width = Math.round(rect.width * dpr);
    this.canvas.height = Math.round(rect.height * dpr);

    // Resetear y fijar transformación sin multiplicar escalas acumuladas
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.updateStrokeStyle();

    if (previousData) {
      const img = new Image();
      img.onload = () => {
        this.ctx.drawImage(img, 0, 0, rect.width, rect.height);
      };
      img.src = previousData;
    }
  }

  updateStrokeStyle() {
    if (!this.ctx) return;
    const isDark = document.documentElement.getAttribute("data-theme") === "dark";
    this.ctx.strokeStyle = isDark ? "#60a5fa" : "#1e3a8a"; // Azul visible según tema
    this.ctx.lineWidth = 2.5;
    this.ctx.lineCap = "round";
    this.ctx.lineJoin = "round";
  }

  bindEvents() {
    if (!this.canvas) return;
    this.canvas.style.touchAction = "none";

    // Pointer Events (Mouse, Touch y Stylus unificados nativamente)
    this.canvas.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      try {
        this.canvas.setPointerCapture(e.pointerId);
      } catch (err) {}
      this.startDrawing(e);
    });

    this.canvas.addEventListener("pointermove", (e) => {
      if (!this.isDrawing) return;
      e.preventDefault();
      this.draw(e);
    });

    const handlePointerEnd = (e) => {
      if (this.isDrawing) {
        try {
          this.canvas.releasePointerCapture(e.pointerId);
        } catch (err) {}
        this.stopDrawing();
      }
    };

    this.canvas.addEventListener("pointerup", handlePointerEnd);
    this.canvas.addEventListener("pointercancel", handlePointerEnd);

    // Redimensionar si cambia el tamaño de la ventana
    window.addEventListener("resize", () => {
      this.initCanvas();
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
    if (this.canvas.width === 0 || this.canvas.height === 0) {
      this.initCanvas();
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
    if (!this.canvas || !this.ctx) return;
    this.ctx.save();
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.restore();
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.updateStrokeStyle();
    this.hasDrawn = false;
  }

  isEmpty() {
    return !this.hasDrawn;
  }

  toDataURL() {
    if (this.isEmpty()) return null;
    return this.canvas.toDataURL("image/png");
  }

  getSignatureData() {
    return this.toDataURL();
  }
}
