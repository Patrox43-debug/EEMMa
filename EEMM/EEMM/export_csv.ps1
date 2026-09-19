# ==============================================================================
# Script de Exportación de Excel a CSV (UTF-8 con separador coma o punto y coma)
# ==============================================================================

[CmdletBinding()]
param(
    [string]$ExcelPath = "C:\Users\patro\OneDrive\Escritorio\Base de Datos APP.xlsx",
    [string]$OutputDir = "c:\Users\patro\OneDrive\Documentos\EEMM\csv"
)

$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

if (-not (Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
}

$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false

try {
    $wb = $excel.Workbooks.Open($ExcelPath, [Type]::Missing, $true)

    # 1. Perfiles
    $sh = $wb.Sheets.Item("Perfiles")
    $used = $sh.UsedRange
    $vals = $used.Value2
    $list = @()
    for ($r = 2; $r -le $used.Rows.Count; $r++) {
        if ($null -ne $vals[$r, 1] -or $null -ne $vals[$r, 2]) {
            $list += [PSCustomObject]@{
                id = $r - 1
                nombre = [string]$vals[$r, 1]
                correo = [string]$vals[$r, 2]
                funcion = [string]$vals[$r, 3]
                tecnico = [string]$vals[$r, 4]
            }
        }
    }
    $list | Export-Csv -Path (Join-Path $OutputDir "perfiles.csv") -NoTypeInformation -Encoding UTF8

    # 2. Equipos
    $sh = $wb.Sheets.Item("Equipos")
    $used = $sh.UsedRange
    $vals = $used.Value2
    $list = @()
    $eqId = 1
    for ($r = 2; $r -le $used.Rows.Count; $r++) {
        if ($null -ne $vals[$r, 1] -or $null -ne $vals[$r, 2]) {
            $list += [PSCustomObject]@{
                id_equipo = $eqId++
                codigo_origen = [string]$vals[$r, 1]
                nombre = [string]$vals[$r, 2]
                marca = [string]$vals[$r, 3]
                modelo = [string]$vals[$r, 4]
                serie = [string]$vals[$r, 5]
                categoria = [string]$vals[$r, 6]
                estado = if ($null -ne $vals[$r, 7]) { [string]$vals[$r, 7] } else { "Operativo" }
                ubicacion = [string]$vals[$r, 8]
                detalles = [string]$vals[$r, 9]
            }
        }
    }
    $list | Export-Csv -Path (Join-Path $OutputDir "equipos.csv") -NoTypeInformation -Encoding UTF8

    # 3. Registros
    $sh = $wb.Sheets.Item("Registros")
    $used = $sh.UsedRange
    $vals = $used.Value2
    $list = @()
    $regId = 1
    for ($r = 2; $r -le $used.Rows.Count; $r++) {
        if ($null -ne $vals[$r, 1] -or $null -ne $vals[$r, 2]) {
            $fVal = $vals[$r, 1]
            $fStr = ""
            $oaNum = 0.0
            if ($null -ne $fVal -and [double]::TryParse([string]$fVal, [System.Globalization.NumberStyles]::Any, [System.Globalization.CultureInfo]::InvariantCulture, [ref]$oaNum)) {
                try { $fStr = [DateTime]::FromOADate($oaNum).ToString("yyyy-MM-dd HH:mm:ss") } catch {}
            }
            $list += [PSCustomObject]@{
                id_registro = $regId++
                fecha = $fStr
                usuario = [string]$vals[$r, 2]
                nombre_equipo = [string]$vals[$r, 3]
                marca = [string]$vals[$r, 4]
                modelo = [string]$vals[$r, 5]
                serie = [string]$vals[$r, 6]
                unidad = [string]$vals[$r, 7]
                respuestas = [string]$vals[$r, 8]
                obs = [string]$vals[$r, 9]
                idpdf = [string]$vals[$r, 10]
            }
        }
    }
    $list | Export-Csv -Path (Join-Path $OutputDir "registros.csv") -NoTypeInformation -Encoding UTF8

    # 4. Reparaciones (Estructura vacía)
    $repHeaders = [PSCustomObject]@{
        id_reparacion = ""
        fecha = ""
        usuario = ""
        equipo = ""
        marca = ""
        modelo = ""
        serie = ""
        destino = ""
        parte_reparada = ""
        obs = ""
    }
    @($repHeaders | Select-Object -Skip 1) | Export-Csv -Path (Join-Path $OutputDir "reparaciones.csv") -NoTypeInformation -Encoding UTF8

    # 5. Inventario
    $sh = $wb.Sheets.Item("Inventario")
    $used = $sh.UsedRange
    $vals = $used.Value2
    $list = @()
    for ($r = 2; $r -le $used.Rows.Count; $r++) {
        if ($null -ne $vals[$r, 1] -and ([string]$vals[$r, 1]).Trim() -ne "") {
            $fiStr = ""
            $fiVal = $vals[$r, 7]
            if ($null -ne $fiVal) {
                $dtP = [DateTime]::MinValue
                if ([DateTime]::TryParse([string]$fiVal, [ref]$dtP)) { $fiStr = $dtP.ToString("yyyy-MM-dd HH:mm:ss") }
            }
            $ftStr = ""
            $ftVal = $vals[$r, 8]
            if ($null -ne $ftVal) {
                $dtP = [DateTime]::MinValue
                if ([DateTime]::TryParse([string]$ftVal, [ref]$dtP)) { $ftStr = $dtP.ToString("yyyy-MM-dd HH:mm:ss") }
            }
            $list += [PSCustomObject]@{
                id_caja = [string]$vals[$r, 1]
                nombre_caja = [string]$vals[$r, 2]
                cantidad = [string]$vals[$r, 3]
                seccion_id = [string]$vals[$r, 4]
                estanteria_id = [string]$vals[$r, 5]
                barcode = [string]$vals[$r, 6]
                finicio = $fiStr
                ftermino = $ftStr
                estado = [string]$vals[$r, 9]
            }
        }
    }
    $list | Export-Csv -Path (Join-Path $OutputDir "inventario.csv") -NoTypeInformation -Encoding UTF8

    $wb.Close($false)
    Write-Host "CSVs exportados con exito en $OutputDir" -ForegroundColor Green
}
finally {
    $excel.Quit()
    [System.Runtime.Interopservices.Marshal]::ReleaseComObject($excel) | Out-Null
    [System.GC]::Collect()
    [System.GC]::WaitForPendingFinalizers()
}
