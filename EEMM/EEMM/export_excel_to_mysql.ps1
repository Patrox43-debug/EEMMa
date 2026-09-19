# ==============================================================================
# Script de Exportación de Excel a MySQL
# Origen: "C:\Users\patro\OneDrive\Escritorio\Base de Datos APP.xlsx"
# Destino: "base_de_datos_app.sql" (en Documentos\EEMM y Escritorio)
# ==============================================================================

[CmdletBinding()]
param(
    [string]$ExcelPath = "C:\Users\patro\OneDrive\Escritorio\Base de Datos APP.xlsx",
    [string]$OutputDir = "c:\Users\patro\OneDrive\Documentos\EEMM",
    [string]$DatabaseName = "base_de_datos_app"
)

$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "Iniciando proceso de conversion Excel -> MySQL..." -ForegroundColor Cyan
Write-Host "Archivo Excel: $ExcelPath"
Write-Host "Directorio salida: $OutputDir"
Write-Host "Base de Datos: $DatabaseName"
Write-Host "==========================================================" -ForegroundColor Cyan

if (-not (Test-Path $ExcelPath)) {
    throw "El archivo Excel no existe en la ruta especificada: $ExcelPath"
}

if (-not (Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
}

$sqlFile = Join-Path $OutputDir "base_de_datos_app.sql"
$desktopSqlFile = "C:\Users\patro\OneDrive\Escritorio\base_de_datos_app.sql"
$b = [char]96 # Backtick para identificadores SQL

# Funciones auxiliares para escape SQL
function Escape-SqlString([string]$val) {
    if ($null -eq $val) { return "NULL" }
    $s = $val.Trim()
    if ($s -eq "") { return "NULL" }
    # Escapar barras invertidas y comillas simples
    $escaped = $s.Replace("\", "\\").Replace("'", "\'")
    # Normalizar saltos de linea
    $escaped = $escaped.Replace("`r`n", "\r\n").Replace("`n", "\n").Replace("`r", "\r")
    return "'$escaped'"
}

function Format-SqlDate($val) {
    if ($null -eq $val) { return "NULL" }
    $s = [string]$val
    $s = $s.Trim()
    if ($s -eq "") { return "NULL" }

    # Intentar como numero serial de Excel (OADate)
    $oaNum = 0.0
    if ([double]::TryParse($s, [System.Globalization.NumberStyles]::Any, [System.Globalization.CultureInfo]::InvariantCulture, [ref]$oaNum)) {
        try {
            $dt = [DateTime]::FromOADate($oaNum)
            return "'$($dt.ToString('yyyy-MM-dd HH:mm:ss'))'"
        } catch {}
    }
    
    # Tambien probar con coma decimal
    if ([double]::TryParse($s.Replace(",", "."), [System.Globalization.NumberStyles]::Any, [System.Globalization.CultureInfo]::InvariantCulture, [ref]$oaNum)) {
        try {
            $dt = [DateTime]::FromOADate($oaNum)
            return "'$($dt.ToString('yyyy-MM-dd HH:mm:ss'))'"
        } catch {}
    }

    # Intentar como fecha ISO / formato estandar
    $dtParsed = [DateTime]::MinValue
    if ([DateTime]::TryParse($s, [ref]$dtParsed)) {
        return "'$($dtParsed.ToString('yyyy-MM-dd HH:mm:ss'))'"
    }

    return "NULL"
}

function Format-SqlInt($val, [string]$defaultVal = "NULL") {
    if ($null -eq $val) { return $defaultVal }
    $s = ([string]$val).Trim()
    if ($s -eq "") { return $defaultVal }
    $intVal = 0L
    if ([int64]::TryParse($s, [ref]$intVal)) {
        return "$intVal"
    }
    return $defaultVal
}

# Iniciar Excel COM
$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false
$excel.ScreenUpdating = $false

$sb = New-Object System.Text.StringBuilder

# Encabezado del script SQL
[void]$sb.AppendLine("-- ============================================================================")
[void]$sb.AppendLine("-- Base de Datos EEMM - Generada automaticamente desde Excel")
[void]$sb.AppendLine("-- Archivo de origen: Base de Datos APP.xlsx")
[void]$sb.AppendLine("-- Fecha de generacion: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')")
[void]$sb.AppendLine("-- Motor compatible: MySQL 5.7+, MySQL 8.0+, MariaDB 10.3+")
[void]$sb.AppendLine("-- ============================================================================")
[void]$sb.AppendLine()
[void]$sb.AppendLine("SET NAMES utf8mb4;")
[void]$sb.AppendLine("SET FOREIGN_KEY_CHECKS = 0;")
[void]$sb.AppendLine("SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';")
[void]$sb.AppendLine("SET AUTOCOMMIT = 0;")
[void]$sb.AppendLine("START TRANSACTION;")
[void]$sb.AppendLine()
[void]$sb.AppendLine("-- Creacion de Base de Datos")
[void]$sb.AppendLine("CREATE DATABASE IF NOT EXISTS ${b}${DatabaseName}${b} DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")
[void]$sb.AppendLine("USE ${b}${DatabaseName}${b};")
[void]$sb.AppendLine()

try {
    Write-Host "Abriendo archivo Excel..." -ForegroundColor Yellow
    $wb = $excel.Workbooks.Open($ExcelPath, [Type]::Missing, $true)

    # --------------------------------------------------------------------------
    # 1. TABLA: perfiles
    # --------------------------------------------------------------------------
    Write-Host "Procesando hoja 'Perfiles'..." -ForegroundColor Green
    [void]$sb.AppendLine("-- ----------------------------------------------------------------------------")
    [void]$sb.AppendLine("-- 1. Tabla: perfiles")
    [void]$sb.AppendLine("-- ----------------------------------------------------------------------------")
    [void]$sb.AppendLine("DROP TABLE IF EXISTS ${b}perfiles${b};")
    [void]$sb.AppendLine(@'
CREATE TABLE `perfiles` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nombre` VARCHAR(100) NOT NULL COMMENT 'Nombre de usuario/pila',
  `correo` VARCHAR(150) NOT NULL COMMENT 'Correo electronico unico',
  `funcion` VARCHAR(100) NOT NULL COMMENT 'Rol o cargo en el sistema',
  `tecnico` VARCHAR(150) NOT NULL COMMENT 'Nombre completo del tecnico',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_perfiles_correo` (`correo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Usuarios y tecnicos de EEMM';
'@)
    [void]$sb.AppendLine()

    $sh = $wb.Sheets.Item("Perfiles")
    $used = $sh.UsedRange
    $rCount = $used.Rows.Count
    $vals = $used.Value2

    $perfilRows = @()
    for ($r = 2; $r -le $rCount; $r++) {
        $nom = $vals[$r, 1]
        $cor = $vals[$r, 2]
        if ($null -eq $nom -and $null -eq $cor) { continue }
        if (([string]$nom).Trim() -eq "" -and ([string]$cor).Trim() -eq "") { continue }

        $nomSql = Escape-SqlString $vals[$r, 1]
        $corSql = Escape-SqlString $vals[$r, 2]
        $funSql = Escape-SqlString $vals[$r, 3]
        $tecSql = Escape-SqlString $vals[$r, 4]

        $perfilRows += "($nomSql, $corSql, $funSql, $tecSql)"
    }

    if ($perfilRows.Count -gt 0) {
        [void]$sb.AppendLine("INSERT INTO ${b}perfiles${b} (${b}nombre${b}, ${b}correo${b}, ${b}funcion${b}, ${b}tecnico${b}) VALUES")
        [void]$sb.AppendLine(($perfilRows -join ",`r`n") + ";")
        [void]$sb.AppendLine()
    }
    Write-Host "  -> $($perfilRows.Count) perfiles insertados."

    # --------------------------------------------------------------------------
    # 2. TABLA: equipos
    # --------------------------------------------------------------------------
    Write-Host "Procesando hoja 'Equipos'..." -ForegroundColor Green
    [void]$sb.AppendLine("-- ----------------------------------------------------------------------------")
    [void]$sb.AppendLine("-- 2. Tabla: equipos")
    [void]$sb.AppendLine("-- ----------------------------------------------------------------------------")
    [void]$sb.AppendLine("DROP TABLE IF EXISTS ${b}equipos${b};")
    [void]$sb.AppendLine(@'
CREATE TABLE `equipos` (
  `id_equipo` INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Clave primaria unica generada',
  `codigo_origen` INT NULL COMMENT 'ID original proveniente de Excel (puede contener duplicados)',
  `nombre` VARCHAR(255) NOT NULL COMMENT 'Nombre o descripcion del equipo',
  `marca` VARCHAR(150) NULL COMMENT 'Marca del equipo',
  `modelo` VARCHAR(150) NULL COMMENT 'Modelo comercial',
  `serie` VARCHAR(150) NULL COMMENT 'Numero de serie del fabricante',
  `categoria` VARCHAR(100) NULL COMMENT 'Servicio o categoria asignada',
  `estado` VARCHAR(50) NULL DEFAULT 'Operativo' COMMENT 'Estado operativo',
  `ubicacion` VARCHAR(150) NULL COMMENT 'Ubicacion fisica',
  `detalles` TEXT NULL COMMENT 'Detalles adicionales u observaciones tecnicas',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_equipos_serie` (`serie`),
  INDEX `idx_equipos_marca` (`marca`),
  INDEX `idx_equipos_categoria` (`categoria`),
  INDEX `idx_equipos_estado` (`estado`),
  INDEX `idx_equipos_codigo_origen` (`codigo_origen`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Inventario maestro de equipos medicos';
'@)
    [void]$sb.AppendLine()

    $sh = $wb.Sheets.Item("Equipos")
    $used = $sh.UsedRange
    $rCount = $used.Rows.Count
    $vals = $used.Value2

    $batchSize = 100
    $batch = @()
    $totalEquipos = 0

    for ($r = 2; $r -le $rCount; $r++) {
        $idVal = $vals[$r, 1]
        $nomVal = $vals[$r, 2]
        if ($null -eq $idVal -and $null -eq $nomVal) { continue }
        if (([string]$idVal).Trim() -eq "" -and ([string]$nomVal).Trim() -eq "") { continue }

        $idSql = Format-SqlInt $idVal "NULL"
        $nomSql = Escape-SqlString $nomVal
        if ($nomSql -eq "NULL") { $nomSql = "'SIN NOMBRE'" }
        $marcaSql = Escape-SqlString $vals[$r, 3]
        $modeloSql = Escape-SqlString $vals[$r, 4]
        $serieSql = Escape-SqlString $vals[$r, 5]
        $catSql = Escape-SqlString $vals[$r, 6]
        $estSql = Escape-SqlString $vals[$r, 7]
        $ubiSql = Escape-SqlString $vals[$r, 8]
        $detSql = Escape-SqlString $vals[$r, 9]

        $batch += "($idSql, $nomSql, $marcaSql, $modeloSql, $serieSql, $catSql, $estSql, $ubiSql, $detSql)"
        $totalEquipos++

        if ($batch.Count -ge $batchSize) {
            [void]$sb.AppendLine("INSERT INTO ${b}equipos${b} (${b}codigo_origen${b}, ${b}nombre${b}, ${b}marca${b}, ${b}modelo${b}, ${b}serie${b}, ${b}categoria${b}, ${b}estado${b}, ${b}ubicacion${b}, ${b}detalles${b}) VALUES")
            [void]$sb.AppendLine(($batch -join ",`r`n") + ";")
            $batch = @()
        }
    }

    if ($batch.Count -gt 0) {
        [void]$sb.AppendLine("INSERT INTO ${b}equipos${b} (${b}codigo_origen${b}, ${b}nombre${b}, ${b}marca${b}, ${b}modelo${b}, ${b}serie${b}, ${b}categoria${b}, ${b}estado${b}, ${b}ubicacion${b}, ${b}detalles${b}) VALUES")
        [void]$sb.AppendLine(($batch -join ",`r`n") + ";")
        $batch = @()
    }
    [void]$sb.AppendLine()
    Write-Host "  -> $totalEquipos equipos insertados en lotes."

    # --------------------------------------------------------------------------
    # 3. TABLA: registros
    # --------------------------------------------------------------------------
    Write-Host "Procesando hoja 'Registros'..." -ForegroundColor Green
    [void]$sb.AppendLine("-- ----------------------------------------------------------------------------")
    [void]$sb.AppendLine("-- 3. Tabla: registros")
    [void]$sb.AppendLine("-- ----------------------------------------------------------------------------")
    [void]$sb.AppendLine("DROP TABLE IF EXISTS ${b}registros${b};")
    [void]$sb.AppendLine(@'
CREATE TABLE `registros` (
  `id_registro` INT AUTO_INCREMENT PRIMARY KEY,
  `fecha` DATETIME NOT NULL COMMENT 'Fecha y hora de la inspeccion',
  `usuario` VARCHAR(100) NOT NULL COMMENT 'Usuario o tecnico que realizo el registro',
  `nombre_equipo` VARCHAR(255) NOT NULL COMMENT 'Nombre del equipo inspeccionado',
  `marca` VARCHAR(150) NULL COMMENT 'Marca',
  `modelo` VARCHAR(150) NULL COMMENT 'Modelo',
  `serie` VARCHAR(150) NULL COMMENT 'Numero de serie',
  `unidad` VARCHAR(150) NULL COMMENT 'Unidad o servicio hospitalario',
  `respuestas` TEXT NULL COMMENT 'Respuestas de la pauta de chequeo (OK/NO/NA)',
  `obs` TEXT NULL COMMENT 'Observaciones encontradas',
  `idpdf` VARCHAR(50) NULL COMMENT 'Identificador de reporte o documento PDF generado',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_registros_fecha` (`fecha`),
  INDEX `idx_registros_usuario` (`usuario`),
  INDEX `idx_registros_serie` (`serie`),
  INDEX `idx_registros_unidad` (`unidad`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Registros de inspecciones y rondas tecnicas';
'@)
    [void]$sb.AppendLine()

    $sh = $wb.Sheets.Item("Registros")
    $used = $sh.UsedRange
    $rCount = $used.Rows.Count
    $vals = $used.Value2

    $batch = @()
    $totalRegistros = 0

    for ($r = 2; $r -le $rCount; $r++) {
        $fVal = $vals[$r, 1]
        $uVal = $vals[$r, 2]
        if ($null -eq $fVal -and $null -eq $uVal) { continue }
        if (([string]$fVal).Trim() -eq "" -and ([string]$uVal).Trim() -eq "") { continue }

        $fSql = Format-SqlDate $fVal
        if ($fSql -eq "NULL") { $fSql = "NOW()" }
        $uSql = Escape-SqlString $uVal
        if ($uSql -eq "NULL") { $uSql = "'Desconocido'" }
        $nomSql = Escape-SqlString $vals[$r, 3]
        if ($nomSql -eq "NULL") { $nomSql = "'SIN NOMBRE'" }
        $marcaSql = Escape-SqlString $vals[$r, 4]
        $modeloSql = Escape-SqlString $vals[$r, 5]
        $serieSql = Escape-SqlString $vals[$r, 6]
        $uniSql = Escape-SqlString $vals[$r, 7]
        $respSql = Escape-SqlString $vals[$r, 8]
        $obsSql = Escape-SqlString $vals[$r, 9]
        $pdfSql = Escape-SqlString $vals[$r, 10]

        $batch += "($fSql, $uSql, $nomSql, $marcaSql, $modeloSql, $serieSql, $uniSql, $respSql, $obsSql, $pdfSql)"
        $totalRegistros++

        if ($batch.Count -ge $batchSize) {
            [void]$sb.AppendLine("INSERT INTO ${b}registros${b} (${b}fecha${b}, ${b}usuario${b}, ${b}nombre_equipo${b}, ${b}marca${b}, ${b}modelo${b}, ${b}serie${b}, ${b}unidad${b}, ${b}respuestas${b}, ${b}obs${b}, ${b}idpdf${b}) VALUES")
            [void]$sb.AppendLine(($batch -join ",`r`n") + ";")
            $batch = @()
        }
    }

    if ($batch.Count -gt 0) {
        [void]$sb.AppendLine("INSERT INTO ${b}registros${b} (${b}fecha${b}, ${b}usuario${b}, ${b}nombre_equipo${b}, ${b}marca${b}, ${b}modelo${b}, ${b}serie${b}, ${b}unidad${b}, ${b}respuestas${b}, ${b}obs${b}, ${b}idpdf${b}) VALUES")
        [void]$sb.AppendLine(($batch -join ",`r`n") + ";")
        $batch = @()
    }
    [void]$sb.AppendLine()
    Write-Host "  -> $totalRegistros registros de chequeo insertados."

    # --------------------------------------------------------------------------
    # 4. TABLA: reparaciones
    # --------------------------------------------------------------------------
    Write-Host "Procesando hoja 'Reparaciones' (Estructura DDL)..." -ForegroundColor Green
    [void]$sb.AppendLine("-- ----------------------------------------------------------------------------")
    [void]$sb.AppendLine("-- 4. Tabla: reparaciones")
    [void]$sb.AppendLine("-- ----------------------------------------------------------------------------")
    [void]$sb.AppendLine("DROP TABLE IF EXISTS ${b}reparaciones${b};")
    [void]$sb.AppendLine(@'
CREATE TABLE `reparaciones` (
  `id_reparacion` INT AUTO_INCREMENT PRIMARY KEY,
  `fecha` DATETIME NULL COMMENT 'Fecha de la intervencion/reparacion',
  `usuario` VARCHAR(100) NULL COMMENT 'Tecnico o usuario que realizo o reporto',
  `equipo` VARCHAR(255) NULL COMMENT 'Nombre o descripcion del equipo intervenido',
  `marca` VARCHAR(150) NULL COMMENT 'Marca',
  `modelo` VARCHAR(150) NULL COMMENT 'Modelo',
  `serie` VARCHAR(150) NULL COMMENT 'Numero de serie del equipo',
  `destino` VARCHAR(150) NULL COMMENT 'Destino o servicio donde se entrega',
  `parte_reparada` VARCHAR(255) NULL COMMENT 'Componente o parte reparada/reemplazada',
  `obs` TEXT NULL COMMENT 'Observaciones y comentarios tecnicos',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_reparaciones_fecha` (`fecha`),
  INDEX `idx_reparaciones_serie` (`serie`),
  INDEX `idx_reparaciones_usuario` (`usuario`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Historial de reparaciones y mantenimientos correctivos';
'@)
    [void]$sb.AppendLine()

    $sh = $wb.Sheets.Item("Reparaciones")
    $used = $sh.UsedRange
    $rCount = $used.Rows.Count
    $vals = $used.Value2
    $repCount = 0

    if ($rCount -gt 1) {
        $repBatch = @()
        for ($r = 2; $r -le $rCount; $r++) {
            $fVal = $vals[$r, 1]
            $uVal = $vals[$r, 2]
            $eqVal = $vals[$r, 3]
            if ($null -eq $fVal -and $null -eq $uVal -and $null -eq $eqVal) { continue }
            if (([string]$fVal).Trim() -eq "" -and ([string]$uVal).Trim() -eq "" -and ([string]$eqVal).Trim() -eq "") { continue }

            $fSql = Format-SqlDate $fVal
            $uSql = Escape-SqlString $uVal
            $eqSql = Escape-SqlString $eqVal
            $marcaSql = Escape-SqlString $vals[$r, 4]
            $modSql = Escape-SqlString $vals[$r, 5]
            $serSql = Escape-SqlString $vals[$r, 6]
            $desSql = Escape-SqlString $vals[$r, 7]
            $parteSql = Escape-SqlString $vals[$r, 8]
            $obsSql = Escape-SqlString $vals[$r, 9]

            $repBatch += "($fSql, $uSql, $eqSql, $marcaSql, $modSql, $serSql, $desSql, $parteSql, $obsSql)"
            $repCount++
        }

        if ($repBatch.Count -gt 0) {
            [void]$sb.AppendLine("INSERT INTO ${b}reparaciones${b} (${b}fecha${b}, ${b}usuario${b}, ${b}equipo${b}, ${b}marca${b}, ${b}modelo${b}, ${b}serie${b}, ${b}destino${b}, ${b}parte_reparada${b}, ${b}obs${b}) VALUES")
            [void]$sb.AppendLine(($repBatch -join ",`r`n") + ";")
            [void]$sb.AppendLine()
        }
    }
    Write-Host "  -> $repCount reparaciones insertadas (tabla lista para futuros registros)."

    # --------------------------------------------------------------------------
    # 5. TABLA: inventario
    # --------------------------------------------------------------------------
    Write-Host "Procesando hoja 'Inventario'..." -ForegroundColor Green
    [void]$sb.AppendLine("-- ----------------------------------------------------------------------------")
    [void]$sb.AppendLine("-- 5. Tabla: inventario")
    [void]$sb.AppendLine("-- ----------------------------------------------------------------------------")
    [void]$sb.AppendLine("DROP TABLE IF EXISTS ${b}inventario${b};")
    [void]$sb.AppendLine(@'
CREATE TABLE `inventario` (
  `id_caja` VARCHAR(100) PRIMARY KEY COMMENT 'Identificador unico de la caja de inventario',
  `nombre_caja` VARCHAR(255) NOT NULL COMMENT 'Nombre o descripcion del contenido de la caja',
  `cantidad` INT NOT NULL DEFAULT 0 COMMENT 'Cantidad de unidades en stock',
  `seccion_id` VARCHAR(100) NOT NULL COMMENT 'Identificador de la seccion de estanteria',
  `estanteria_id` VARCHAR(100) NOT NULL COMMENT 'Identificador de la estanteria',
  `barcode` VARCHAR(100) NULL COMMENT 'Codigo de barras del producto o lote',
  `finicio` DATETIME NULL COMMENT 'Fecha de inicio / ingreso / fabricacion',
  `ftermino` DATETIME NULL COMMENT 'Fecha de termino / vencimiento',
  `estado` VARCHAR(50) NOT NULL DEFAULT 'OK' COMMENT 'Estado del stock (OK, STOCK_BAJO, etc.)',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_inventario_seccion` (`seccion_id`),
  INDEX `idx_inventario_estanteria` (`estanteria_id`),
  INDEX `idx_inventario_barcode` (`barcode`),
  INDEX `idx_inventario_estado` (`estado`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Inventario de repuestos, consumibles y cajas en bodega';
'@)
    [void]$sb.AppendLine()

    $sh = $wb.Sheets.Item("Inventario")
    $used = $sh.UsedRange
    $rCount = $used.Rows.Count
    $vals = $used.Value2

    $batch = @()
    $totalInv = 0

    for ($r = 2; $r -le $rCount; $r++) {
        $cajaVal = $vals[$r, 1]
        if ($null -eq $cajaVal) { continue }
        if (([string]$cajaVal).Trim() -eq "") { continue }

        $cajaSql = Escape-SqlString $cajaVal
        $nomSql = Escape-SqlString $vals[$r, 2]
        if ($nomSql -eq "NULL") { $nomSql = "'SIN NOMBRE'" }
        $cantSql = Format-SqlInt $vals[$r, 3] "0"
        $secSql = Escape-SqlString $vals[$r, 4]
        $estSql = Escape-SqlString $vals[$r, 5]
        $barSql = Escape-SqlString $vals[$r, 6]
        $fiSql = Format-SqlDate $vals[$r, 7]
        $ftSql = Format-SqlDate $vals[$r, 8]
        $estadoSql = Escape-SqlString $vals[$r, 9]
        if ($estadoSql -eq "NULL") { $estadoSql = "'OK'" }

        $batch += "($cajaSql, $nomSql, $cantSql, $secSql, $estSql, $barSql, $fiSql, $ftSql, $estadoSql)"
        $totalInv++

        if ($batch.Count -ge $batchSize) {
            [void]$sb.AppendLine("INSERT INTO ${b}inventario${b} (${b}id_caja${b}, ${b}nombre_caja${b}, ${b}cantidad${b}, ${b}seccion_id${b}, ${b}estanteria_id${b}, ${b}barcode${b}, ${b}finicio${b}, ${b}ftermino${b}, ${b}estado${b}) VALUES")
            [void]$sb.AppendLine(($batch -join ",`r`n") + ";")
            $batch = @()
        }
    }

    if ($batch.Count -gt 0) {
        [void]$sb.AppendLine("INSERT INTO ${b}inventario${b} (${b}id_caja${b}, ${b}nombre_caja${b}, ${b}cantidad${b}, ${b}seccion_id${b}, ${b}estanteria_id${b}, ${b}barcode${b}, ${b}finicio${b}, ${b}ftermino${b}, ${b}estado${b}) VALUES")
        [void]$sb.AppendLine(($batch -join ",`r`n") + ";")
        $batch = @()
    }
    [void]$sb.AppendLine()
    Write-Host "  -> $totalInv cajas de inventario insertadas."

    # Finalizar script SQL
    [void]$sb.AppendLine("-- Finalizacion de Transaccion")
    [void]$sb.AppendLine("COMMIT;")
    [void]$sb.AppendLine("SET FOREIGN_KEY_CHECKS = 1;")
    [void]$sb.AppendLine("-- Fin del script")

    $wb.Close($false)
}
finally {
    $excel.Quit()
    [System.Runtime.Interopservices.Marshal]::ReleaseComObject($excel) | Out-Null
    [System.GC]::Collect()
    [System.GC]::WaitForPendingFinalizers()
}

Write-Host "Escribiendo archivo SQL en: $sqlFile ..." -ForegroundColor Yellow
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($sqlFile, $sb.ToString(), $utf8NoBom)

# Copiar tambien al Escritorio para acceso inmediato del usuario
Copy-Item -Path $sqlFile -Destination $desktopSqlFile -Force
Write-Host "Copia creada en el Escritorio: $desktopSqlFile" -ForegroundColor Yellow

$fi = Get-Item $sqlFile
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "CONVERSION COMPLETADA EXITOSAMENTE!" -ForegroundColor Green
Write-Host "Tamano del archivo SQL: $([Math]::Round($fi.Length / 1KB, 2)) KB" -ForegroundColor Green
Write-Host "Archivo principal: $sqlFile" -ForegroundColor Green
Write-Host "Archivo en Escritorio: $desktopSqlFile" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan
