"""
Inicializador de base de datos local SQLite para EEMM.
Lee los datos limpios de la exportación anterior (CSV o base_de_datos_app.sql)
y crea eemm.db con usuarios, roles, 2.553 equipos, inventario y registros.
"""

import sqlite3
import csv
import os
import sys

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "eemm.db")
CSV_DIR = os.path.join(BASE_DIR, "csv")
UPLOADS_DIR = os.path.join(BASE_DIR, "uploads")

os.makedirs(UPLOADS_DIR, exist_ok=True)

def init_database():
    print("=" * 60)
    print("Iniciando creación de base de datos local SQLite: eemm.db")
    print("=" * 60)

    if os.path.exists(DB_PATH):
        try:
            os.remove(DB_PATH)
            print("Base de datos anterior eliminada para recrear limpia.")
        except Exception as e:
            print(f"Nota: No se pudo eliminar eemm.db previa ({e}), se continuará.")

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # 1. Tabla perfiles / usuarios
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS perfiles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        rut TEXT UNIQUE,
        correo TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        funcion TEXT NOT NULL,
        tecnico TEXT NOT NULL,
        rol TEXT NOT NULL DEFAULT 'tecnico',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 2. Tabla equipos
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS equipos (
        id_equipo INTEGER PRIMARY KEY AUTOINCREMENT,
        codigo_origen INTEGER,
        nombre TEXT NOT NULL,
        marca TEXT,
        modelo TEXT,
        serie TEXT,
        categoria TEXT,
        estado TEXT DEFAULT 'Operativo',
        ubicacion TEXT,
        detalles TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    """)
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_equipos_nombre ON equipos(nombre);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_equipos_serie ON equipos(serie);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_equipos_categoria ON equipos(categoria);")

    # 3. Tabla registros (chequeos preventivos)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS registros (
        id_registro INTEGER PRIMARY KEY AUTOINCREMENT,
        fecha DATETIME NOT NULL,
        usuario TEXT NOT NULL,
        nombre_equipo TEXT NOT NULL,
        marca TEXT,
        modelo TEXT,
        serie TEXT,
        unidad TEXT,
        respuestas TEXT,
        obs TEXT,
        idpdf TEXT,
        foto_1 TEXT,
        foto_2 TEXT,
        foto_3 TEXT,
        foto_4 TEXT,
        firma_data TEXT,
        firma_nombre TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    """)
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_registros_fecha ON registros(fecha);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_registros_usuario ON registros(usuario);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_registros_serie ON registros(serie);")

    # 4. Tabla reparaciones
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS reparaciones (
        id_reparacion INTEGER PRIMARY KEY AUTOINCREMENT,
        fecha DATETIME,
        usuario TEXT,
        equipo TEXT,
        marca TEXT,
        modelo TEXT,
        serie TEXT,
        destino TEXT,
        parte_reparada TEXT,
        obs TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 5. Tabla inventario
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS inventario (
        id_caja TEXT PRIMARY KEY,
        nombre_caja TEXT NOT NULL,
        cantidad INTEGER DEFAULT 0,
        seccion_id TEXT NOT NULL,
        estanteria_id TEXT NOT NULL,
        barcode TEXT,
        finicio DATETIME,
        ftermino DATETIME,
        estado TEXT DEFAULT 'OK',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 6. Tabla unidades / servicios hospitalarios
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS unidades (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL UNIQUE
    );
    """)

    # Insertar usuarios por defecto (Técnicos + Administrador)
    usuarios_iniciales = [
        ("Administrador General", "11.111.111-1", "admin@eemm.cl", "4277", "Jefe de Servicio", "Administrador del Sistema", "administrador"),
        ("Patricio Bustamante", "20.967.660-5", "patriciobustamante.ec@gmail.com", "1234", "Tecnico EEMM", "Patricio Bustamante", "tecnico"),
        ("Martin Peralta", "21.284.838-7", "martin.peralta@gmail.com", "1234", "Tecnico EEMM", "Martin Peralta", "tecnico"),
        ("Luis Vallejos", "16.345.678-9", "equiposmedicos1.@gmail.com", "1234", "Tecnico EEMM", "Luis Vallejos", "tecnico"),
        ("Jorge Ambrosetti", "15.088.541-8", "jambrosettic@gmail.com", "1234", "Tecnico EEMM", "Jorge Ambrosetti", "tecnico")
    ]
    cursor.executemany("""
        INSERT OR IGNORE INTO perfiles (nombre, rut, correo, password, funcion, tecnico, rol)
        VALUES (?, ?, ?, ?, ?, ?, ?);
    """, usuarios_iniciales)

    # Cargar Equipos desde CSV
    equipos_csv = os.path.join(CSV_DIR, "equipos.csv")
    if os.path.exists(equipos_csv):
        with open(equipos_csv, mode="r", encoding="utf-8-sig") as f:
            reader = csv.DictReader(f)
            equipos_batch = []
            for row in reader:
                cod = row.get("codigo_origen")
                cod_int = int(cod) if cod and cod.isdigit() else None
                equipos_batch.append((
                    cod_int,
                    row.get("nombre", "SIN NOMBRE") or "SIN NOMBRE",
                    row.get("marca", "") or None,
                    row.get("modelo", "") or None,
                    row.get("serie", "") or None,
                    row.get("categoria", "") or None,
                    row.get("estado", "Operativo") or "Operativo",
                    row.get("ubicacion", "") or None,
                    row.get("detalles", "") or None
                ))
            cursor.executemany("""
                INSERT INTO equipos (codigo_origen, nombre, marca, modelo, serie, categoria, estado, ubicacion, detalles)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
            """, equipos_batch)
            print(f"[OK] {len(equipos_batch)} equipos cargados en SQLite.")

    # Cargar Registros históricos desde CSV
    registros_csv = os.path.join(CSV_DIR, "registros.csv")
    unidades_set = set()
    if os.path.exists(registros_csv):
        with open(registros_csv, mode="r", encoding="utf-8-sig") as f:
            reader = csv.DictReader(f)
            reg_batch = []
            for row in reader:
                uni = (row.get("unidad") or "").strip()
                if uni:
                    unidades_set.add(uni)
                reg_batch.append((
                    row.get("fecha") or "2026-01-01 00:00:00",
                    row.get("usuario") or "Tecnico",
                    row.get("nombre_equipo", "") or "Equipo",
                    row.get("marca", ""),
                    row.get("modelo", ""),
                    row.get("serie", ""),
                    uni,
                    row.get("respuestas", ""),
                    row.get("obs", ""),
                    row.get("idpdf", "")
                ))
            cursor.executemany("""
                INSERT INTO registros (fecha, usuario, nombre_equipo, marca, modelo, serie, unidad, respuestas, obs, idpdf)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
            """, reg_batch)
            print(f"[OK] {len(reg_batch)} registros de chequeo cargados en SQLite.")

    # Cargar Inventario desde CSV
    inv_csv = os.path.join(CSV_DIR, "inventario.csv")
    if os.path.exists(inv_csv):
        with open(inv_csv, mode="r", encoding="utf-8-sig") as f:
            reader = csv.DictReader(f)
            inv_batch = []
            for row in reader:
                cant = row.get("cantidad", "0")
                cant_int = int(cant) if cant and cant.isdigit() else 0
                inv_batch.append((
                    row.get("id_caja"),
                    row.get("nombre_caja", "Caja"),
                    cant_int,
                    row.get("seccion_id", ""),
                    row.get("estanteria_id", ""),
                    row.get("barcode", ""),
                    row.get("finicio") or None,
                    row.get("ftermino") or None,
                    row.get("estado", "OK") or "OK"
                ))
            cursor.executemany("""
                INSERT OR REPLACE INTO inventario (id_caja, nombre_caja, cantidad, seccion_id, estanteria_id, barcode, finicio, ftermino, estado)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
            """, inv_batch)
            print(f"[OK] {len(inv_batch)} cajas de inventario cargadas en SQLite.")

    # Catálogo de Unidades / Servicios hospitalarios
    unidades_base = [
        "URGENCIA", "PABELLONES-QUIRURGICOS", "UPC", "ATENCION-OBSTETRICA",
        "GINECOLOGIA-Y-OBSTETRICIA", "LABORATORIO", "AISLAMIENTO",
        "MEDICO-QUIRURGICA-ADULTO", "MEDICO-QUIRURGICA-PEDIATRICA",
        "DIALISIS", "KINESIOTERAPIA-Y-REHABILITACION", "PARTOS",
        "PATOLOGICA(MORGUE)", "SOCIO-SANITARIO", "CIRUGIA-MENOR", "GES"
    ]
    for u in unidades_base:
        unidades_set.add(u)
    cursor.executemany("""
        INSERT OR IGNORE INTO unidades (nombre) VALUES (?);
    """, [(u,) for u in sorted(unidades_set)])
    print(f"[OK] {len(unidades_set)} unidades hospitalarias disponibles.")

    conn.commit()
    conn.close()
    print("=" * 60)
    print("Base de datos eemm.db creada e inicializada exitosamente!")
    print("=" * 60)

if __name__ == "__main__":
    init_database()
