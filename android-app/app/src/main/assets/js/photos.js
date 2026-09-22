/**
 * EEMM - Manejador de las 4 ranuras de fotos
 * Soporta selección de archivo, captura de cámara y compresión automática.
 */

class PhotoManager {
  constructor(containerId, maxPhotos = 4, customLabels = null) {
    this.container = document.getElementById(containerId);
    this.maxPhotos = maxPhotos;
    this.customLabels = customLabels;
    this.photos = new Array(maxPhotos).fill(null);
    this.initSlots();
  }

  initSlots() {
    if (!this.container) return;
    this.container.innerHTML = "";
    this.photos = new Array(this.maxPhotos).fill(null);

    const prefix = this.container.id || "pm";

    for (let i = 0; i < this.maxPhotos; i++) {
      const slot = document.createElement("div");
      slot.className = "photo-slot";
      slot.dataset.index = i;

      const labelText = (this.customLabels && this.customLabels[i]) 
        ? this.customLabels[i] 
        : `Foto #${i + 1}`;

      slot.innerHTML = `
        <input type="file" accept="image/*" style="display:none;" id="${prefix}-file-slot-${i}">
        <div class="photo-placeholder" id="${prefix}-placeholder-${i}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
            <circle cx="12" cy="13" r="4"></circle>
          </svg>
          <p>${labelText}</p>
        </div>
        <img id="${prefix}-img-preview-${i}" style="display:none;" alt="${labelText}">
        <button type="button" class="photo-remove-btn" id="${prefix}-btn-remove-${i}" style="display:none;" title="Eliminar foto">✕</button>
        <span class="photo-badge">#${i + 1}</span>
      `;

      const fileInput = slot.querySelector(`#${prefix}-file-slot-${i}`);
      const previewImg = slot.querySelector(`#${prefix}-img-preview-${i}`);
      const placeholder = slot.querySelector(`#${prefix}-placeholder-${i}`);
      const removeBtn = slot.querySelector(`#${prefix}-btn-remove-${i}`);

      // Click para cargar foto
      slot.addEventListener("click", (e) => {
        if (e.target !== removeBtn) {
          fileInput.click();
        }
      });

      // Cambio en el input de archivo
      fileInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (file) {
          this.processImage(file, i, previewImg, placeholder, removeBtn, slot);
        }
      });

      // Botón remover
      removeBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.clearSlot(i, fileInput, previewImg, placeholder, removeBtn, slot);
      });

      // Soporte Drag and Drop
      slot.addEventListener("dragover", (e) => {
        e.preventDefault();
        slot.style.borderColor = "var(--primary)";
      });
      slot.addEventListener("dragleave", () => {
        slot.style.borderColor = "";
      });
      slot.addEventListener("drop", (e) => {
        e.preventDefault();
        slot.style.borderColor = "";
        if (e.dataTransfer.files.length > 0) {
          const file = e.dataTransfer.files[0];
          if (file.type.startsWith("image/")) {
            this.processImage(file, i, previewImg, placeholder, removeBtn, slot);
          }
        }
      });

      this.container.appendChild(slot);
    }
  }

  processImage(file, index, previewImg, placeholder, removeBtn, slot) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Redimensionar para optimizar peso (máximo 1280px de ancho/alto)
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;
        const maxDim = 1280;

        if (width > height && width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.85);
        this.photos[index] = compressedDataUrl;

        previewImg.src = compressedDataUrl;
        previewImg.style.display = "block";
        placeholder.style.display = "none";
        removeBtn.style.display = "flex";
        slot.classList.add("has-image");
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  clearSlot(index, fileInput, previewImg, placeholder, removeBtn, slot) {
    this.photos[index] = null;
    fileInput.value = "";
    previewImg.src = "";
    previewImg.style.display = "none";
    placeholder.style.display = "block";
    removeBtn.style.display = "none";
    slot.classList.remove("has-image");
  }

  clearAll() {
    this.initSlots();
  }

  getPhotos() {
    return this.photos;
  }
}
