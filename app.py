"""
Backend API para la aplicación EEMM (Gestión de Equipos Médicos).
Construido con FastAPI y SQLite local.
"""

import os
import re
import io
import uuid
import base64
import sqlite3
from datetime import datetime
from typing import Optional, List, Dict, Any
from PIL import Image, ImageOps

from fastapi import FastAPI, HTTPException, Query, Body, Response
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from pdf_generator import generate_chequeo_pdf

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "eemm.db")
STATIC_DIR = os.path.join(BASE_DIR, "static")
UPLOADS_DIR = os.path.join(BASE_DIR, "uploads")

os.makedirs(STATIC_DIR, exist_ok=True)
os.makedirs(UPLOADS_DIR, exist_ok=True)

app = FastAPI(title="EEMM - Gestión de Equipos Médicos", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def save_base64_image(data_uri: str, prefix: str) -> Optional[str]:
    """Guarda una imagen enviada como base64 data URI a disco con compresión y retorna la ruta relativa."""
    if not data_uri or not isinstance(data_uri, str) or not data_uri.startswith("data:image"):
        return None
    try:
        header, encoded = data_uri.split(",", 1)
        raw_bytes = base64.b64decode(encoded)
        img = Image.open(io.BytesIO(raw_bytes))

        # Corregir orientación EXIF si proviene de dispositivos móviles
        try:
            img = ImageOps.exif_transpose(img)
        except Exception:
            pass

        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        uid = uuid.uuid4().hex[:6]

        if prefix.startswith("firma"):
            # Para firmas: redimensionar si supera 800px y comprimir como PNG optimizado
            if img.width > 800:
                new_height = max(1, int(img.height * (800 / img.width)))
                img = img.resize((800, new_height), Image.Resampling.LANCZOS)
            filename = f"{prefix}_{timestamp}_{uid}.png"
            filepath = os.path.join(UPLOADS_DIR, filename)
            img.save(filepath, format="PNG", optimize=True)
        else:
            # Para fotos: convertir a RGB (reemplazar canal alfa por fondo blanco), redimensionar y comprimir JPEG
            if img.mode in ("RGBA", "LA", "P"):
                background = Image.new("RGB", img.size, (255, 255, 255))
                if img.mode == "P":
                    img = img.convert("RGBA")
                background.paste(img, mask=img.split()[-1] if img.mode == "RGBA" else None)
                img = background
            elif img.mode != "RGB":
                img = img.convert("RGB")

            # Redimensionar a un máximo de 1280px para mantener nitidez reduciendo peso drásticamente
            max_dim = 1280
            if img.width > max_dim or img.height > max_dim:
                img.thumbnail((max_dim, max_dim), Image.Resampling.LANCZOS)

            filename = f"{prefix}_{timestamp}_{uid}.jpg"
            filepath = os.path.join(UPLOADS_DIR, filename)
            # Calidad 78 optimizada: reduce el tamaño a ~60-120 KB por foto
            img.save(filepath, format="JPEG", quality=78, optimize=True)

        return f"/uploads/{filename}"
    except Exception as e:
        print(f"Error procesando/comprimiendo imagen ({prefix}): {e}")
        return None

def normalize_rut(rut: str) -> str:
    """Normaliza un RUT chileno eliminando puntos, guiones y espacios."""
    if not rut:
        return ""
    return re.sub(r'[^0-9kK]', '', str(rut)).upper()

# Modelos Pydantic
class LoginRequest(BaseModel):
    rut: str
    password: str

class UserCreate(BaseModel):
    nombre: str
    rut: str
    correo: str
    password: str
    rol: Optional[str] = "tecnico"
    funcion: Optional[str] = "Tecnico EEMM"

class UserUpdate(BaseModel):
    nombre: str
    rut: str
    correo: str
    password: Optional[str] = None
    rol: Optional[str] = "tecnico"
    funcion: Optional[str] = "Tecnico EEMM"

class ChequeoCreate(BaseModel):
    usuario: str
    nombre_equipo: str
    marca: Optional[str] = ""
    modelo: Optional[str] = ""
    serie: Optional[str] = ""
    unidad: Optional[str] = ""
    categoria: Optional[str] = "GENERAL"
    respuestas: Optional[Any] = None
    obs: Optional[str] = ""
    fotos: Optional[List[str]] = []  # Lista de hasta 4 data URIs
    firma: Optional[str] = None      # Data URI del canvas
    firma_nombre: Optional[str] = ""

# Rutas de Autenticación con RUT
@app.post("/api/auth/login")
def login(creds: LoginRequest):
    rut_clean = normalize_rut(creds.rut)
    if not rut_clean:
        raise HTTPException(status_code=400, detail="Por favor ingresa un RUT válido")

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, nombre, rut, correo, password, funcion, tecnico, rol
        FROM perfiles
    """)
    users = cursor.fetchall()
    conn.close()

    matched_user = None
    for u in users:
        if normalize_rut(u["rut"]) == rut_clean:
            matched_user = u
            break

    if not matched_user:
        raise HTTPException(status_code=401, detail="RUT no registrado en el sistema")
    
    # Validar contraseña
    if str(matched_user["password"]).strip() != str(creds.password).strip():
        raise HTTPException(status_code=401, detail="Contraseña incorrecta")

    return {
        "status": "ok",
        "user": {
            "id": matched_user["id"],
            "nombre": matched_user["nombre"],
            "rut": matched_user["rut"],
            "correo": matched_user["correo"],
            "funcion": matched_user["funcion"],
            "tecnico": matched_user["tecnico"] or matched_user["nombre"],
            "rol": matched_user["rol"]
        }
    }

# ==============================================================================
# Rutas de Administración de Usuarios (CRUD)
# ==============================================================================
@app.get("/api/admin/users")
def get_admin_users():
    """Listar todos los usuarios para el panel de administración."""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, nombre, rut, correo, password, funcion, tecnico, rol, created_at
        FROM perfiles
        ORDER BY id ASC
    """)
    users = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return users

@app.post("/api/admin/users")
def create_admin_user(data: UserCreate):
    """Crear un nuevo usuario."""
    rut_clean = normalize_rut(data.rut)
    if not rut_clean:
        raise HTTPException(status_code=400, detail="El RUT proporcionado es inválido")

    conn = get_db()
    cursor = conn.cursor()

    # Verificar si el RUT ya existe
    cursor.execute("SELECT id, rut FROM perfiles")
    for row in cursor.fetchall():
        if normalize_rut(row["rut"]) == rut_clean:
            conn.close()
            raise HTTPException(status_code=400, detail=f"Ya existe un usuario con el RUT {data.rut}")

    # Verificar correo
    cursor.execute("SELECT id FROM perfiles WHERE LOWER(correo) = LOWER(?)", (data.correo.strip(),))
    if cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail=f"Ya existe un usuario con el correo {data.correo}")

    cursor.execute("""
        INSERT INTO perfiles (nombre, rut, correo, password, funcion, tecnico, rol)
        VALUES (?, ?, ?, ?, ?, ?, ?);
    """, (
        data.nombre.strip(),
        data.rut.strip(),
        data.correo.strip(),
        data.password.strip(),
        data.funcion.strip() if data.funcion else "Tecnico EEMM",
        data.nombre.strip(),
        data.rol.strip() if data.rol in ["administrador", "tecnico"] else "tecnico"
    ))
    new_id = cursor.lastrowid
    conn.commit()
    conn.close()

    return {"status": "ok", "id": new_id, "message": "Usuario creado exitosamente"}

@app.put("/api/admin/users/{user_id}")
def update_admin_user(user_id: int, data: UserUpdate):
    """Actualizar datos de un usuario existente."""
    rut_clean = normalize_rut(data.rut)
    if not rut_clean:
        raise HTTPException(status_code=400, detail="El RUT proporcionado es inválido")

    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT id FROM perfiles WHERE id = ?", (user_id,))
    if not cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    # Validar que otro usuario no tenga el mismo RUT
    cursor.execute("SELECT id, rut FROM perfiles WHERE id != ?", (user_id,))
    for row in cursor.fetchall():
        if normalize_rut(row["rut"]) == rut_clean:
            conn.close()
            raise HTTPException(status_code=400, detail=f"El RUT {data.rut} ya pertenece a otro usuario")

    # Actualizar con o sin contraseña
    if data.password and data.password.strip():
        cursor.execute("""
            UPDATE perfiles
            SET nombre = ?, rut = ?, correo = ?, password = ?, rol = ?, funcion = ?, tecnico = ?
            WHERE id = ?;
        """, (
            data.nombre.strip(),
            data.rut.strip(),
            data.correo.strip(),
            data.password.strip(),
            data.rol.strip(),
            data.funcion.strip() if data.funcion else "Tecnico EEMM",
            data.nombre.strip(),
            user_id
        ))
    else:
        cursor.execute("""
            UPDATE perfiles
            SET nombre = ?, rut = ?, correo = ?, rol = ?, funcion = ?, tecnico = ?
            WHERE id = ?;
        """, (
            data.nombre.strip(),
            data.rut.strip(),
            data.correo.strip(),
            data.rol.strip(),
            data.funcion.strip() if data.funcion else "Tecnico EEMM",
            data.nombre.strip(),
            user_id
        ))

    conn.commit()
    conn.close()
    return {"status": "ok", "message": "Usuario actualizado exitosamente"}

@app.delete("/api/admin/users/{user_id}")
def delete_admin_user(user_id: int):
    """Eliminar un usuario (no permite eliminar al último administrador)."""
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT id, rol FROM perfiles WHERE id = ?", (user_id,))
    user = cursor.fetchone()
    if not user:
        conn.close()
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    if user["rol"] == "administrador":
        cursor.execute("SELECT COUNT(*) FROM perfiles WHERE rol = 'administrador'")
        admin_count = cursor.fetchone()[0]
        if admin_count <= 1:
            conn.close()
            raise HTTPException(status_code=400, detail="No se puede eliminar el único administrador del sistema")

    cursor.execute("DELETE FROM perfiles WHERE id = ?", (user_id,))
    conn.commit()
    conn.close()
    return {"status": "ok", "message": "Usuario eliminado exitosamente"}

# Rutas de Catálogos (Equipos y Unidades)
@app.get("/api/equipos")
def get_equipos(q: Optional[str] = Query(None, description="Término de búsqueda"), limit: int = 50):
    conn = get_db()
    cursor = conn.cursor()
    if q and q.strip():
        term = f"%{q.strip()}%"
        cursor.execute("""
            SELECT id_equipo, codigo_origen, nombre, marca, modelo, serie, categoria, estado, ubicacion, detalles
            FROM equipos
            WHERE nombre LIKE ? OR serie LIKE ? OR marca LIKE ? OR modelo LIKE ?
            ORDER BY nombre ASC
            LIMIT ?
        """, (term, term, term, term, limit))
    else:
        cursor.execute("""
            SELECT id_equipo, codigo_origen, nombre, marca, modelo, serie, categoria, estado, ubicacion, detalles
            FROM equipos
            ORDER BY id_equipo ASC
            LIMIT ?
        """, (limit,))
    
    equipos = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return equipos

@app.get("/api/unidades")
def get_unidades():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id, nombre FROM unidades ORDER BY nombre ASC")
    unidades = [row["nombre"] for row in cursor.fetchall()]
    conn.close()
    return unidades

# Rutas de Chequeos Preventivos
@app.post("/api/chequeos")
def create_chequeo(data: ChequeoCreate):
    conn = get_db()
    cursor = conn.cursor()

    # Procesar hasta 4 fotos
    foto_rutas = [None, None, None, None]
    if data.fotos:
        for idx, foto_b64 in enumerate(data.fotos[:4]):
            if foto_b64:
                ruta = save_base64_image(foto_b64, f"foto_{idx+1}")
                foto_rutas[idx] = ruta

    # Procesar firma
    firma_ruta = None
    if data.firma:
        firma_ruta = save_base64_image(data.firma, "firma")

    # Formatear respuestas
    respuestas_str = ""
    if isinstance(data.respuestas, list):
        respuestas_str = " | ".join([f"{item.get('item', '')}: {item.get('val', 'OK')}" for item in data.respuestas])
    elif isinstance(data.respuestas, str):
        respuestas_str = data.respuestas

    fecha_ahora = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    cursor.execute("""
        INSERT INTO registros (
            fecha, usuario, nombre_equipo, marca, modelo, serie, unidad, categoria,
            respuestas, obs, idpdf, foto_1, foto_2, foto_3, foto_4, firma_data, firma_nombre
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    """, (
        fecha_ahora,
        data.usuario or "Técnico",
        data.nombre_equipo or "Equipo",
        data.marca or "",
        data.modelo or "",
        data.serie or "",
        data.unidad or "",
        (data.categoria or "GENERAL").strip().upper(),
        respuestas_str,
        data.obs or "",
        f"PDF-{int(datetime.now().timestamp())}",
        foto_rutas[0],
        foto_rutas[1],
        foto_rutas[2],
        foto_rutas[3],
        firma_ruta,
        data.firma_nombre or ""
    ))
    new_id = cursor.lastrowid
    conn.commit()
    conn.close()

    return {
        "status": "ok",
        "id_registro": new_id,
        "message": "Chequeo preventivo registrado exitosamente",
        "fotos": [f for f in foto_rutas if f],
        "firma": firma_ruta
    }

@app.get("/api/chequeos")
def get_chequeos(
    usuario: Optional[str] = None,
    unidad: Optional[str] = None,
    q: Optional[str] = None,
    limit: int = 50
):
    conn = get_db()
    cursor = conn.cursor()

    conditions = []
    params = []

    if usuario and usuario.strip():
        conditions.append("LOWER(usuario) = LOWER(?)")
        params.append(usuario.strip())
    if unidad and unidad.strip():
        conditions.append("LOWER(unidad) = LOWER(?)")
        params.append(unidad.strip())
    if q and q.strip():
        term = f"%{q.strip()}%"
        conditions.append("(nombre_equipo LIKE ? OR serie LIKE ? OR obs LIKE ?)")
        params.extend([term, term, term])

    where_clause = "WHERE " + " AND ".join(conditions) if conditions else ""
    query = f"""
        SELECT id_registro, fecha, usuario, nombre_equipo, marca, modelo, serie,
               unidad, categoria, respuestas, obs, idpdf, foto_1, foto_2, foto_3, foto_4,
               firma_data, firma_nombre, created_at
        FROM registros
        {where_clause}
        ORDER BY id_registro DESC
        LIMIT ?
    """
    params.append(limit)
    cursor.execute(query, params)
    chequeos = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return chequeos

@app.get("/api/chequeos/{id_reg}")
def get_chequeo_detail(id_reg: int):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id_registro, fecha, usuario, nombre_equipo, marca, modelo, serie,
               unidad, categoria, respuestas, obs, idpdf, foto_1, foto_2, foto_3, foto_4,
               firma_data, firma_nombre, created_at
        FROM registros
        WHERE id_registro = ?
    """, (id_reg,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Registro no encontrado")
    return dict(row)

@app.get("/api/chequeos/{id_reg}/pdf")
def get_chequeo_pdf(id_reg: int):
    """Genera y descarga el reporte oficial en PDF del chequeo preventivo bajo demanda."""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id_registro, fecha, usuario, nombre_equipo, marca, modelo, serie,
               unidad, categoria, respuestas, obs, idpdf, foto_1, foto_2, foto_3, foto_4,
               firma_data, firma_nombre, created_at
        FROM registros
        WHERE id_registro = ?
    """, (id_reg,))
    row = cursor.fetchone()
    conn.close()

    if not row:
        raise HTTPException(status_code=404, detail="Chequeo no encontrado")

    try:
        record = dict(row)
        pdf_bytes = generate_chequeo_pdf(record)
        filename = f"Chequeo_EEMM_{record.get('id_registro')}_{record.get('serie') or 'SN'}.pdf"
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"inline; filename=\"{filename}\"",
                "Cache-Control": "no-cache"
            }
        )
    except Exception as e:
        print(f"Error generando PDF para chequeo #{id_reg}: {e}")
        raise HTTPException(status_code=500, detail=f"Error al generar PDF: {str(e)}")

# Métricas para Panel de Administrador
@app.get("/api/stats")
def get_stats():
    conn = get_db()
    cursor = conn.cursor()

    # Total equipos
    cursor.execute("SELECT COUNT(*) FROM equipos")
    total_equipos = cursor.fetchone()[0]

    # Total chequeos
    cursor.execute("SELECT COUNT(*) FROM registros")
    total_chequeos = cursor.fetchone()[0]

    # Chequeos con fotos o firmas
    cursor.execute("SELECT COUNT(*) FROM registros WHERE foto_1 IS NOT NULL OR firma_data IS NOT NULL")
    chequeos_con_multimedia = cursor.fetchone()[0]

    # Total inventario
    cursor.execute("SELECT COUNT(*), SUM(cantidad) FROM inventario")
    inv_row = cursor.fetchone()
    total_cajas = inv_row[0]
    total_unidades_stock = inv_row[1] or 0

    # Top unidades con más chequeos
    cursor.execute("""
        SELECT unidad, COUNT(*) as cant
        FROM registros
        WHERE unidad IS NOT NULL AND TRIM(unidad) != ''
        GROUP BY unidad
        ORDER BY cant DESC
        LIMIT 6
    """)
    top_unidades = [dict(row) for row in cursor.fetchall()]

    # Chequeos por técnico
    cursor.execute("""
        SELECT usuario, COUNT(*) as cant
        FROM registros
        GROUP BY usuario
        ORDER BY cant DESC
    """)
    por_tecnico = [dict(row) for row in cursor.fetchall()]

    conn.close()

    return {
        "total_equipos": total_equipos,
        "total_chequeos": total_chequeos,
        "chequeos_con_multimedia": chequeos_con_multimedia,
        "total_cajas_inventario": total_cajas,
        "total_unidades_stock": total_unidades_stock,
        "top_unidades": top_unidades,
        "por_tecnico": por_tecnico
    }

@app.get("/api/inventario")
def get_inventario(
    q: Optional[str] = None, 
    estanteria: Optional[str] = None,
    seccion: Optional[str] = None,
    estado: Optional[str] = None,
    limit: int = 500
):
    conn = get_db()
    cursor = conn.cursor()
    
    conditions = []
    params = []

    if q and q.strip():
        term = f"%{q.strip()}%"
        conditions.append("(nombre_caja LIKE ? OR id_caja LIKE ? OR barcode LIKE ? OR estanteria_id LIKE ?)")
        params.extend([term, term, term, term])

    if estanteria and estanteria.strip():
        conditions.append("estanteria_id = ?")
        params.append(estanteria.strip())

    if seccion and seccion.strip():
        conditions.append("seccion_id = ?")
        params.append(seccion.strip())

    if estado and estado.strip():
        conditions.append("estado = ?")
        params.append(estado.strip())

    sql = "SELECT id_caja, nombre_caja, cantidad, seccion_id, estanteria_id, barcode, finicio, ftermino, estado FROM inventario"
    if conditions:
        sql += " WHERE " + " AND ".join(conditions)
    sql += " ORDER BY estanteria_id ASC, seccion_id ASC, id_caja ASC LIMIT ?"
    params.append(limit)

    cursor.execute(sql, tuple(params))
    cajas = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return cajas

@app.get("/api/inventario/estanterias")
def get_estanterias_summary():
    """Retorna los 16 estantes con sus métricas y repisas organizadas para la vista física."""
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT 
            estanteria_id, 
            seccion_id,
            COUNT(*) as total_cajas,
            SUM(cantidad) as total_stock,
            SUM(CASE WHEN estado != 'OK' THEN 1 ELSE 0 END) as stock_bajo
        FROM inventario
        GROUP BY estanteria_id, seccion_id
        ORDER BY estanteria_id ASC, seccion_id ASC
    """)
    rows = cursor.fetchall()
    conn.close()

    estantes_dict = {}
    idx = 1
    for r in rows:
        eid = r["estanteria_id"]
        if eid not in estantes_dict:
            estantes_dict[eid] = {
                "id_estanteria": eid,
                "numero": idx,
                "nombre": f"Estante #{idx}",
                "total_cajas": 0,
                "total_stock": 0,
                "stock_bajo": 0,
                "repisas": []
            }
            idx += 1

        sec_id = r["seccion_id"]
        # Extraer número de sección: p.ej. "shelf_..._sec_1" -> 1
        repisa_num = 1
        if "_sec_" in sec_id:
            try:
                repisa_num = int(sec_id.split("_sec_")[-1])
            except ValueError:
                repisa_num = 1

        repisa_nombre = f"Repisa {repisa_num}"
        if repisa_num == 1:
            repisa_nombre += " (Nivel Superior)"
        elif repisa_num == 2:
            repisa_nombre += " (Nivel Medio)"
        elif repisa_num == 3:
            repisa_nombre += " (Nivel Inferior)"
        elif repisa_num == 4:
            repisa_nombre += " (Nivel Base)"

        estantes_dict[eid]["total_cajas"] += r["total_cajas"]
        estantes_dict[eid]["total_stock"] += (r["total_stock"] or 0)
        estantes_dict[eid]["stock_bajo"] += (r["stock_bajo"] or 0)
        estantes_dict[eid]["repisas"].append({
            "seccion_id": sec_id,
            "repisa_num": repisa_num,
            "nombre": repisa_nombre,
            "cajas_count": r["total_cajas"],
            "stock_count": r["total_stock"] or 0
        })

    return list(estantes_dict.values())

# Catálogo oficial de pautas técnicas por categoría
PAUTAS_POR_CATEGORIA = {
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
}

@app.get("/api/pautas")
def get_pautas():
    return PAUTAS_POR_CATEGORIA

# Servir uploads y archivos estáticos
app.mount("/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

@app.get("/")
def serve_home():
    return FileResponse(os.path.join(STATIC_DIR, "index.html"))

if __name__ == "__main__":
    import uvicorn
    print("Iniciando servidor EEMM en http://localhost:8000 ...")
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
