"""
Migración para la tabla perfiles en eemm.db.
- Agrega la columna rut
- Configura el administrador: RUT 20.967.660-5 y contraseña 4277
- Configura los técnicos iniciales con RUTs
"""

import sqlite3
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "eemm.db")

conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

# Verificar columnas
cursor.execute("PRAGMA table_info(perfiles);")
cols = [row[1] for row in cursor.fetchall()]
print("Columnas actuales en perfiles:", cols)

if "rut" not in cols:
    cursor.execute("ALTER TABLE perfiles ADD COLUMN rut TEXT;")
    print("Columna 'rut' agregada exitosamente.")

# Normalizar y configurar Administrador
cursor.execute("""
    UPDATE perfiles
    SET nombre = 'Administrador General',
        rut = '11.111.111-1',
        password = '4277',
        rol = 'administrador',
        correo = 'admin@eemm.cl',
        funcion = 'Jefe de Servicio',
        tecnico = 'Administrador del Sistema'
    WHERE rol = 'administrador' OR id = 1;
""")

# Asignar RUTs a los técnicos existentes
tecnicos_data = [
    ("Patricio Bustamante", "20.967.660-5", "patriciobustamante.ec@gmail.com", "1234", "tecnico"),
    ("Martin Peralta", "21.284.838-7", "martin.peralta@gmail.com", "1234", "tecnico"),
    ("Luis Vallejos", "16.345.678-9", "equiposmedicos1.@gmail.com", "1234", "tecnico"),
    ("Jorge Ambrosetti", "15.088.541-8", "jambrosettic@gmail.com", "1234", "tecnico")
]

for nom, rut, cor, pwd, rol in tecnicos_data:
    cursor.execute("""
        UPDATE perfiles
        SET rut = ?, password = ?, nombre = ?, tecnico = ?
        WHERE correo = ?;
    """, (rut, pwd, nom.split()[0], nom, cor))

conn.commit()

# Mostrar usuarios actualizados
cursor.execute("SELECT id, nombre, rut, correo, password, rol FROM perfiles;")
print("\nUsuarios registrados:")
for u in cursor.fetchall():
    print(f"ID: {u[0]} | Nombre: {u[1]} | RUT: {u[2]} | Correo: {u[3]} | Clave: {u[4]} | Rol: {u[5]}")

conn.close()
print("\nMigración completada exitosamente.")
