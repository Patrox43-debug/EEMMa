"""
Generador de Reportes PDF Profesionales para EEMM (Ingeniería Clínica).
Construye informes de chequeos preventivos en formato PDF bajo demanda.
"""

import io
import os
from datetime import datetime
from PIL import Image as PILImage

from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    Image as RLImage, KeepTogether, HRFlowable
)

import base64
import re

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

def get_scaled_image(rel_path: str, max_width: float, max_height: float):
    """Carga una imagen local o en base64 y calcula sus dimensiones proporcionales para ReportLab."""
    if not rel_path:
        return None
    try:
        if isinstance(rel_path, str) and rel_path.startswith("data:image"):
            # Imagen codificada en base64
            header, encoded = rel_path.split(",", 1)
            raw_bytes = base64.b64decode(encoded)
            buf = io.BytesIO(raw_bytes)
            with PILImage.open(buf) as im:
                w, h = im.size
                if w <= 0 or h <= 0:
                    return None
                ratio = min(max_width / w, max_height / h)
                target_w = w * ratio
                target_h = h * ratio
            buf.seek(0)
            return RLImage(buf, width=target_w, height=target_h)
        else:
            clean_path = str(rel_path).lstrip("/").replace("/", os.sep)
            abs_path = os.path.join(BASE_DIR, clean_path)
            if not os.path.exists(abs_path):
                return None
            with PILImage.open(abs_path) as im:
                w, h = im.size
                if w <= 0 or h <= 0:
                    return None
                ratio = min(max_width / w, max_height / h)
                target_w = w * ratio
                target_h = h * ratio
            return RLImage(abs_path, width=target_w, height=target_h)
    except Exception as e:
        print(f"Error procesando imagen para PDF: {e}")
        return None

def build_pdf_header_footer(canvas, doc):
    """Agrega pie de página institucional en cada hoja."""
    canvas.saveState()
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(colors.HexColor("#64748b"))
    
    # Línea sutil superior de pie de página
    canvas.setStrokeColor(colors.HexColor("#e2e8f0"))
    canvas.setLineWidth(0.5)
    canvas.line(36, 30, 576, 30)
    
    # Texto pie de página
    canvas.drawString(36, 20, "EEMM · Sistema de Gestión de Equipos Médicos | Documento Oficial de Inspección")
    canvas.drawRightString(576, 20, f"Pág. {doc.page}")
    canvas.restoreState()

def generate_chequeo_pdf(record: dict) -> bytes:
    """
    Genera un informe PDF profesional y estructurado a partir de los datos del chequeo.
    Retorna los bytes del archivo PDF listo para descarga.
    """
    buf = io.BytesIO()
    
    # Margen de 0.5 pulgada (36 pt)
    doc = SimpleDocTemplate(
        buf,
        pagesize=letter,
        leftMargin=36,
        rightMargin=36,
        topMargin=36,
        bottomMargin=42
    )

    styles = getSampleStyleSheet()

    # Estilos tipográficos personalizados
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=13,
        textColor=colors.HexColor('#0f172a')
    )
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=11,
        textColor=colors.HexColor('#0f172a')
    )
    tag_style = ParagraphStyle(
        'DocTag',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7.5,
        leading=9,
        textColor=colors.HexColor('#64748b')
    )
    meta_title = ParagraphStyle(
        'MetaTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=12,
        alignment=TA_RIGHT,
        textColor=colors.HexColor('#0f172a')
    )
    meta_sub = ParagraphStyle(
        'MetaSub',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=10,
        alignment=TA_RIGHT,
        textColor=colors.HexColor('#475569')
    )
    sec_heading = ParagraphStyle(
        'SecHeading',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=12,
        textColor=colors.HexColor('#0f172a')
    )
    cell_lbl = ParagraphStyle(
        'CellLbl',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=10,
        textColor=colors.HexColor('#475569')
    )
    cell_val = ParagraphStyle(
        'CellVal',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=10,
        textColor=colors.HexColor('#0f172a')
    )
    cell_mono = ParagraphStyle(
        'CellMono',
        parent=styles['Normal'],
        fontName='Courier-Bold',
        fontSize=8.5,
        leading=10,
        textColor=colors.HexColor('#1e293b')
    )
    obs_text = ParagraphStyle(
        'ObsText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor('#1e293b')
    )

    story = []

    # 1. ENCABEZADO INSTITUCIONAL CON LOGO EN PARTE SUPERIOR IZQUIERDA
    logo_img = get_scaled_image("static/hcv_logo.png", max_width=44, max_height=44)

    header_left = [
        Paragraph("HOSPITAL CLÍNICO · INGENIERÍA CLÍNICA", title_style),
        Spacer(1, 2),
        Paragraph("REPORTE OFICIAL DE CHEQUEO PREVENTIVO", subtitle_style),
        Spacer(1, 1),
        Paragraph("Control Técnico y Recepción de Equipos Médicos", tag_style)
    ]

    id_reg = record.get("id_registro", 0)
    fecha_reg = record.get("fecha", datetime.now().strftime("%Y-%m-%d %H:%M"))
    
    # Folio y código exclusivamente con números sin letras
    numeric_folio = re.sub(r'[^0-9]', '', str(id_reg)) or "1"
    numeric_folio = numeric_folio.zfill(6)
    raw_idpdf = str(record.get("idpdf") or id_reg)
    numeric_cod = re.sub(r'[^0-9]', '', raw_idpdf) or numeric_folio

    header_right = [
        Paragraph(f"FOLIO Nº <b>{numeric_folio}</b>", meta_title),
        Spacer(1, 2),
        Paragraph(f"Fecha: <b>{fecha_reg}</b>", meta_sub),
        Paragraph(f"Cód: <code>{numeric_cod}</code>", meta_sub),
        Paragraph("<font color='#16a34a'><b>● REGISTRO CONFIRMADO</b></font>", meta_sub)
    ]

    if logo_img:
        header_table = Table([[logo_img, header_left, header_right]], colWidths=[46, 294, 200])
    else:
        header_table = Table([[header_left, header_right]], colWidths=[340, 200])

    header_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('TOPPADDING', (0,0), (-1,-1), 0),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 0),
    ]))
    story.append(header_table)
    story.append(Spacer(1, 4))

    # Barra separadora minimalista en negro
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#0f172a'), spaceAfter=8, spaceBefore=2))

    # 2. DATOS DEL EQUIPAMIENTO
    story.append(Paragraph("1. IDENTIFICACIÓN DEL EQUIPO Y SERVICIO", sec_heading))
    story.append(Spacer(1, 4))

    cat_nombre = (record.get("categoria") or "GENERAL").upper()

    eq_data = [
        [
            Paragraph("Nombre Equipo:", cell_lbl),
            Paragraph(f"<b>{record.get('nombre_equipo') or 'Sin especificar'}</b>", cell_val),
            Paragraph("N° de Serie:", cell_lbl),
            Paragraph(f"{record.get('serie') or 'S/N'}", cell_mono)
        ],
        [
            Paragraph("Marca:", cell_lbl),
            Paragraph(record.get('marca') or 'N/A', cell_val),
            Paragraph("Modelo:", cell_lbl),
            Paragraph(record.get('modelo') or 'N/A', cell_val)
        ],
        [
            Paragraph("Unidad / Servicio:", cell_lbl),
            Paragraph(f"<b>{record.get('unidad') or 'General'}</b>", cell_val),
            Paragraph("Categoría / Pauta:", cell_lbl),
            Paragraph(f"<b>{cat_nombre}</b>", cell_val)
        ],
        [
            Paragraph("Técnico Responsable:", cell_lbl),
            Paragraph(f"<b>{record.get('usuario') or 'Técnico EEMM'}</b>", cell_val),
            Paragraph("Fecha Inspección:", cell_lbl),
            Paragraph(fecha_reg, cell_val)
        ]
    ]

    eq_table = Table(eq_data, colWidths=[95, 175, 95, 175])
    eq_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f8fafc')),
        ('BACKGROUND', (2, 0), (2, -1), colors.HexColor('#f8fafc')),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#0f172a')),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(eq_table)
    story.append(Spacer(1, 10))

    # 3. PAUTA DE EVALUACIÓN Y PUNTOS DE CONTROL
    story.append(Paragraph(f"2. PAUTA TÉCNICA DE CONTROL PREVENTIVO · CATEGORÍA {cat_nombre}", sec_heading))
    story.append(Spacer(1, 4))

    # Parsear respuestas
    raw_respuestas = record.get("respuestas") or ""
    checklist_rows = []
    
    # Encabezado de la tabla
    checklist_rows.append([
        Paragraph("<b>Nº</b>", cell_lbl),
        Paragraph("<b>Punto de Control de Inspección</b>", cell_lbl),
        Paragraph("<para align='center'><b>Resultado</b></para>", cell_lbl)
    ])

    items_list = []
    if "|" in raw_respuestas:
        for part in raw_respuestas.split("|"):
            if ":" in part:
                p_item, p_val = part.split(":", 1)
                items_list.append((p_item.strip(), p_val.strip()))
    elif raw_respuestas:
        items_list.append(("Puntos Evaluados", raw_respuestas))
    else:
        # Pauta por defecto si no hubo respuestas explícitas
        defaults = [
            ("1. Cable de poder y enchufe en buen estado", "OK"),
            ("2. Limpieza e higiene externa del chasis", "OK"),
            ("3. Encendido y respuesta de pantalla / LEDs", "OK"),
            ("4. Batería interna y autonomía operativa", "OK"),
            ("5. Alarmas sonoras y visuales operativas", "OK"),
            ("6. Sensores, troncales y accesorios operativos", "OK")
        ]
        items_list = defaults

    for idx, (p_item, p_val) in enumerate(items_list, 1):
        v_upper = p_val.upper()
        if "OK" in v_upper:
            badge = "<font color='#15803d'><b>[ OK - CONFORME ]</b></font>"
        elif "NO" in v_upper:
            badge = "<font color='#b91c1c'><b>[ NO CONFORME ]</b></font>"
        else:
            badge = "<font color='#475569'><b>[ N/A ]</b></font>"

        checklist_rows.append([
            Paragraph(f"{idx}", cell_lbl),
            Paragraph(p_item, cell_val),
            Paragraph(f"<para align='center'>{badge}</para>", cell_val)
        ])

    chk_table = Table(checklist_rows, colWidths=[25, 415, 100])
    chk_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f1f5f9')),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('LEFTPADDING', (0, 0), (-1, -1), 5),
        ('RIGHTPADDING', (0, 0), (-1, -1), 5),
    ]))
    story.append(chk_table)
    story.append(Spacer(1, 10))

    # 4. OBSERVACIONES TÉCNICAS
    story.append(Paragraph("3. OBSERVACIONES Y ACCIONES TÉCNICAS", sec_heading))
    story.append(Spacer(1, 4))
    obs_content = record.get("obs") or "Equipo inspeccionado satisfactoriamente sin observaciones críticas registradas."
    obs_table = Table([[Paragraph(obs_content, obs_text)]], colWidths=[540])
    obs_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f8fafc')),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
        ('LINELEFT', (0, 0), (0, 0), 3, colors.HexColor('#0f172a')),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(obs_table)
    story.append(Spacer(1, 10))

    # 5. REGISTRO FOTOGRÁFICO (Hasta 4 fotos)
    fotos_rutas = [record.get(f"foto_{i}") for i in range(1, 5)]
    fotos_validas = []
    for i, r in enumerate(fotos_rutas, 1):
        if r:
            rl_img = get_scaled_image(r, max_width=255, max_height=150)
            if rl_img:
                fotos_validas.append((f"Fotografía #{i}", rl_img))

    if fotos_validas:
        photo_elements = [
            Paragraph(f"4. REGISTRO FOTOGRÁFICO DE RESPALDO ({len(fotos_validas)} Fotografías)", sec_heading),
            Spacer(1, 4)
        ]
        
        # Armar celdas de fotos en pares de 2 por fila
        grid_data = []
        for i in range(0, len(fotos_validas), 2):
            row_cells = []
            for j in range(2):
                if i + j < len(fotos_validas):
                    lbl_txt, img_obj = fotos_validas[i + j]
                    cell_content = [
                        Paragraph(f"<b>{lbl_txt}</b>", cell_lbl),
                        Spacer(1, 2),
                        img_obj
                    ]
                    row_cells.append(cell_content)
                else:
                    row_cells.append("")
            grid_data.append(row_cells)

        photo_table = Table(grid_data, colWidths=[270, 270])
        photo_table.setStyle(TableStyle([
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('LEFTPADDING', (0, 0), (-1, -1), 4),
            ('RIGHTPADDING', (0, 0), (-1, -1), 4),
        ]))
        photo_elements.append(photo_table)
        story.append(KeepTogether(photo_elements))
        story.append(Spacer(1, 8))

    # 6. CONFORMIDAD, RECEPCIÓN Y FIRMA DIGITAL
    reception_elements = [
        Paragraph("5. CONFORMIDAD Y VALIDACIÓN DE RECEPCIÓN", sec_heading),
        Spacer(1, 4)
    ]

    firma_ruta = record.get("firma_data")
    firma_nombre = record.get("firma_nombre") or record.get("usuario") or "Técnico / Recepcionista"
    firma_img = get_scaled_image(firma_ruta, max_width=180, max_height=65)

    legal_text = Paragraph(
        "Certifico mediante la presente firma digital que la inspección preventiva del equipamiento médico descrito ha sido ejecutada de acuerdo a las pautas de control técnico y normas de seguridad hospitalaria vigentes.",
        tag_style
    )

    sig_cell = []
    if firma_img:
        sig_cell.append(firma_img)
        sig_cell.append(Spacer(1, 2))
    else:
        sig_cell.append(Spacer(1, 28))
    
    sig_cell.extend([
        HRFlowable(width="80%", thickness=0.75, color=colors.HexColor('#0f172a'), spaceBefore=2, spaceAfter=2),
        Paragraph(f"<b>{firma_nombre}</b>", cell_val),
        Paragraph(f"Fecha Validación: {fecha_reg}", tag_style)
    ])

    rec_table = Table([[legal_text, sig_cell]], colWidths=[310, 230])
    rec_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f8fafc')),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
        ('VALIGN', (0, 0), (0, 0), 'MIDDLE'),
        ('VALIGN', (1, 0), (1, 0), 'BOTTOM'),
        ('ALIGN', (1, 0), (1, 0), 'CENTER'),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    reception_elements.append(rec_table)
    story.append(KeepTogether(reception_elements))

    # Construir documento
    doc.build(story, onFirstPage=build_pdf_header_footer, onLaterPages=build_pdf_header_footer)
    
    buf.seek(0)
    return buf.getvalue()


def generate_servicio_pdf(record: dict) -> bytes:
    """
    Genera un informe PDF consolidado de revisión por servicio clínico en ReportLab.
    Incluye:
    - Encabezado institucional con folio REP-SER-...
    - Metadatos del servicio, fecha, técnico, supervisor y notas generales
    - Resumen de estados y tabla completa de equipos médicos inspeccionados
    - Muestreo fotográfico técnico
    - Estampa de firma digital validada
    """
    import json
    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf,
        pagesize=letter,
        leftMargin=36,
        rightMargin=36,
        topMargin=36,
        bottomMargin=42
    )

    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        'DocTitleServ',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=13,
        textColor=colors.HexColor('#0f172a')
    )
    subtitle_style = ParagraphStyle(
        'DocSubServ',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=11,
        textColor=colors.HexColor('#0f172a')
    )
    tag_style = ParagraphStyle(
        'DocTagServ',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7.5,
        leading=9,
        textColor=colors.HexColor('#64748b')
    )
    meta_title = ParagraphStyle(
        'MetaTitleServ',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=12,
        alignment=TA_RIGHT,
        textColor=colors.HexColor('#0f172a')
    )
    meta_sub = ParagraphStyle(
        'MetaSubServ',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=10,
        alignment=TA_RIGHT,
        textColor=colors.HexColor('#475569')
    )
    sec_heading = ParagraphStyle(
        'SecHeadingServ',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=12,
        textColor=colors.HexColor('#0f172a')
    )
    cell_lbl = ParagraphStyle(
        'CellLblServ',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=10,
        textColor=colors.HexColor('#475569')
    )
    cell_val = ParagraphStyle(
        'CellValServ',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=10,
        textColor=colors.HexColor('#0f172a')
    )
    cell_val_center = ParagraphStyle(
        'CellValCenterServ',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=10,
        alignment=TA_CENTER,
        textColor=colors.HexColor('#0f172a')
    )
    cell_bold_center = ParagraphStyle(
        'CellBoldCenterServ',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=10,
        alignment=TA_CENTER,
        textColor=colors.HexColor('#0f172a')
    )
    th_style = ParagraphStyle(
        'ThStyleServ',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=10,
        textColor=colors.white
    )
    th_center = ParagraphStyle(
        'ThCenterServ',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=10,
        alignment=TA_CENTER,
        textColor=colors.white
    )

    story = []

    # Datos básicos y folio numérico sin letras
    raw_folio = str(record.get("folio") or record.get("id_revision") or "1")
    numeric_folio = re.sub(r'[^0-9]', '', raw_folio)
    if not numeric_folio or len(numeric_folio) < 4:
        numeric_folio = f"{record.get('id_revision', 1):06d}"

    unidad = record.get("unidad", "SERVICIO CLÍNICO GENERAL").upper()
    fecha_str = record.get("fecha", datetime.now().strftime("%Y-%m-%d %H:%M"))
    usuario = record.get("usuario") or record.get("tecnico") or "Técnico EEMM"
    supervisor = record.get("supervisor") or "Responsable del Servicio"
    obs_general = record.get("obs_general", "").strip() if record.get("obs_general") else ""
    
    equipos = record.get("equipos") or []
    if isinstance(equipos, str):
        try:
            equipos = json.loads(equipos)
        except Exception:
            equipos = []

    total_equipos = record.get("total_equipos") or len(equipos)

    # Contar estados
    op_count = sum(1 for e in equipos if "operativ" in str(e.get("estado", "")).lower() and "no" not in str(e.get("estado", "")).lower() and "fuera" not in str(e.get("estado", "")).lower() and "baja" not in str(e.get("estado", "")).lower())
    maint_count = sum(1 for e in equipos if "manten" in str(e.get("estado", "")).lower() or "espera" in str(e.get("estado", "")).lower() or "repar" in str(e.get("estado", "")).lower())
    baja_count = total_equipos - op_count - maint_count
    if baja_count < 0:
        baja_count = 0

    # 1. ENCABEZADO INSTITUCIONAL CON LOGO SUPERIOR IZQUIERDA
    logo_img = get_scaled_image("static/hcv_logo.png", max_width=44, max_height=44)

    header_left = [
        Paragraph("HOSPITAL CLÍNICO · INGENIERÍA CLÍNICA", title_style),
        Spacer(1, 2),
        Paragraph("INFORME OFICIAL DE REVISIÓN CLÍNICA POR SERVICIO", subtitle_style),
        Spacer(1, 1),
        Paragraph("Inspección Consolidada y Control Preventivo de Equipamiento", tag_style)
    ]

    header_right = [
        Paragraph(f"FOLIO Nº <b>{numeric_folio}</b>", meta_title),
        Spacer(1, 2),
        Paragraph(f"Fecha: <b>{fecha_str}</b>", meta_sub),
        Paragraph(f"Servicio: <b>{unidad}</b>", meta_sub),
        Paragraph("<font color='#16a34a'><b>● REVISIÓN CONSOLIDADA FINALIZADA</b></font>", meta_sub)
    ]

    if logo_img:
        header_table = Table([[logo_img, header_left, header_right]], colWidths=[46, 294, 200])
    else:
        header_table = Table([[header_left, header_right]], colWidths=[340, 200])

    header_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('TOPPADDING', (0,0), (-1,-1), 0),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 0),
    ]))
    story.append(header_table)
    story.append(Spacer(1, 4))

    # Barra separadora minimalista
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#0f172a'), spaceAfter=8, spaceBefore=2))

    # 2. METADATOS Y RESUMEN EJECUTIVO
    story.append(Paragraph("1. ANTECEDENTES DEL SERVICIO Y CONTROL EJECUTIVO", sec_heading))
    story.append(Spacer(1, 3))

    meta_grid = [
        [
            Paragraph("<b>Servicio Clínico:</b>", cell_lbl),
            Paragraph(f"<b>{unidad}</b>", cell_val),
            Paragraph("<b>Total Equipos:</b>", cell_lbl),
            Paragraph(f"<b>{total_equipos} equipo(s)</b>", cell_val),
        ],
        [
            Paragraph("<b>Técnico EEMM:</b>", cell_lbl),
            Paragraph(usuario, cell_val),
            Paragraph("<b>Operativos (OK):</b>", cell_lbl),
            Paragraph(f"<font color='#16a34a'><b>{op_count} equipo(s)</b></font>", cell_val),
        ],
        [
            Paragraph("<b>Supervisor / Entrega:</b>", cell_lbl),
            Paragraph(supervisor, cell_val),
            Paragraph("<b>En Mantención / F.S.:</b>", cell_lbl),
            Paragraph(f"<font color='#d97706'><b>{maint_count + baja_count} equipo(s)</b></font>", cell_val),
        ]
    ]

    meta_table = Table(meta_grid, colWidths=[110, 180, 110, 140])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f8fafc')),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(meta_table)

    if obs_general:
        story.append(Spacer(1, 4))
        obs_table = Table([
            [Paragraph("<b>Observaciones Generales de la Entrega:</b>", cell_lbl)],
            [Paragraph(obs_general, cell_val)]
        ], colWidths=[540])
        obs_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f8fafc')),
            ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
            ('LINELEFT', (0, 0), (0, -1), 3, colors.HexColor('#0f172a')),
            ('TOPPADDING', (0, 0), (-1, -1), 3),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('LEFTPADDING', (0, 0), (-1, -1), 6),
            ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ]))
        story.append(obs_table)

    story.append(Spacer(1, 8))

    # 3. TABLA DE EQUIPOS INSPECCIONADOS
    story.append(Paragraph(f"2. NÓMINA DE EQUIPOS MÉDICOS INSPECCIONADOS ({total_equipos})", sec_heading))
    story.append(Spacer(1, 4))

    eq_table_data = [
        [
            Paragraph("<b>#</b>", th_center),
            Paragraph("<b>Equipo Médico</b>", th_style),
            Paragraph("<b>Marca / Modelo</b>", th_style),
            Paragraph("<b>N° Serie</b>", th_style),
            Paragraph("<b>Estado Operativo</b>", th_center),
            Paragraph("<b>Observaciones / Box</b>", th_style),
        ]
    ]

    for idx, eq in enumerate(equipos, start=1):
        nombre_eq = eq.get("nombre") or eq.get("nombre_equipo") or "Equipo Médico"
        marca_mod = f"{eq.get('marca', '')} {eq.get('modelo', '')}".strip() or "S/I"
        serie_eq = eq.get("serie") or "S/N"
        estado_raw = eq.get("estado") or "Operativo"
        obs_eq = eq.get("observaciones") or eq.get("obs") or "-"
        
        st_lower = str(estado_raw).lower()
        if "operativ" in st_lower and "no" not in st_lower and "fuera" not in st_lower and "baja" not in st_lower:
            st_p = Paragraph(f"<font color='#16a34a'><b>● {estado_raw}</b></font>", cell_val_center)
        elif "manten" in st_lower or "espera" in st_lower:
            st_p = Paragraph(f"<font color='#d97706'><b>● {estado_raw}</b></font>", cell_val_center)
        else:
            st_p = Paragraph(f"<font color='#dc2626'><b>● {estado_raw}</b></font>", cell_val_center)

        eq_table_data.append([
            Paragraph(str(idx), cell_bold_center),
            Paragraph(f"<b>{nombre_eq}</b>", cell_val),
            Paragraph(marca_mod, cell_val),
            Paragraph(f"<code>{serie_eq}</code>", cell_val),
            st_p,
            Paragraph(obs_eq, cell_val),
        ])

    if len(eq_table_data) == 1:
        eq_table_data.append([
            Paragraph("-", cell_val_center),
            Paragraph("No se registraron equipos en este lote.", cell_val),
            Paragraph("-", cell_val),
            Paragraph("-", cell_val),
            Paragraph("-", cell_val),
            Paragraph("-", cell_val),
        ])

    col_widths = [22, 138, 100, 75, 85, 120]
    eq_table = Table(eq_table_data, colWidths=col_widths, repeatRows=1)
    
    t_styles = [
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e40af')),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('LEFTPADDING', (0, 0), (-1, -1), 4),
        ('RIGHTPADDING', (0, 0), (-1, -1), 4),
    ]

    for r in range(1, len(eq_table_data)):
        bg = colors.HexColor('#ffffff') if r % 2 != 0 else colors.HexColor('#f8fafc')
        t_styles.append(('BACKGROUND', (0, r), (-1, r), bg))

    eq_table.setStyle(TableStyle(t_styles))
    story.append(eq_table)
    story.append(Spacer(1, 8))

    # 4. EVIDENCIA FOTOGRÁFICA (si existen fotos en los equipos)
    fotos_items = []
    for eq in equipos:
        f_list = eq.get("fotos") or []
        for f_idx, f_item in enumerate(f_list):
            if f_item:
                fotos_items.append({
                    "img": f_item,
                    "label": f"{eq.get('nombre', 'Equipo')} (SN: {eq.get('serie', 'S/N')}) - Foto {f_idx + 1}"
                })

    if fotos_items:
        photo_elements = [
            Paragraph(f"3. EVIDENCIA FOTOGRÁFICA DEL SERVICIO ({len(fotos_items)} Capturas)", sec_heading),
            Spacer(1, 4)
        ]
        grid_data = []
        for i in range(0, min(len(fotos_items), 6), 2):
            row_cells = []
            for j in range(2):
                if i + j < len(fotos_items):
                    item = fotos_items[i + j]
                    img_obj = get_scaled_image(item["img"], max_width=250, max_height=140)
                    if img_obj:
                        row_cells.append([
                            Paragraph(f"<b>{item['label']}</b>", cell_lbl),
                            Spacer(1, 2),
                            img_obj
                        ])
                    else:
                        row_cells.append(Paragraph(f"<b>{item['label']}</b><br/>[Imagen no disponible]", cell_lbl))
                else:
                    row_cells.append("")
            grid_data.append(row_cells)

        if grid_data:
            photo_table = Table(grid_data, colWidths=[270, 270])
            photo_table.setStyle(TableStyle([
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
                ('TOPPADDING', (0, 0), (-1, -1), 4),
                ('LEFTPADDING', (0, 0), (-1, -1), 4),
                ('RIGHTPADDING', (0, 0), (-1, -1), 4),
            ]))
            photo_elements.append(photo_table)
            story.append(KeepTogether(photo_elements))
            story.append(Spacer(1, 8))

    # 5. CONFORMIDAD Y FIRMA DIGITAL
    sec_num = "4" if fotos_items else "3"
    reception_elements = [
        Paragraph(f"{sec_num}. VALIDACIÓN TÉCNICA, CONFORMIDAD Y FIRMA", sec_heading),
        Spacer(1, 4)
    ]

    firma_ruta = record.get("firma_data") or record.get("firma")
    firma_nombre = record.get("firma_nombre") or supervisor or usuario
    firma_img = get_scaled_image(firma_ruta, max_width=180, max_height=65)

    legal_text = Paragraph(
        "Certifico mediante la presente firma digital que la revisión preventiva del servicio clínico y sus equipos médicos asociados ha sido completada en su totalidad, registrando de manera fidedigna la condición técnica y operativa en el inventario hospitalario.",
        tag_style
    )

    sig_cell = []
    if firma_img:
        sig_cell.append(firma_img)
        sig_cell.append(Spacer(1, 2))
    else:
        sig_cell.append(Spacer(1, 26))

    sig_cell.extend([
        HRFlowable(width="80%", thickness=0.75, color=colors.HexColor('#0f172a'), spaceBefore=2, spaceAfter=2),
        Paragraph(f"<b>{firma_nombre}</b>", cell_val),
        Paragraph(f"Fecha Validación: {fecha_str}", tag_style)
    ])

    rec_table = Table([[legal_text, sig_cell]], colWidths=[310, 230])
    rec_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f8fafc')),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
        ('VALIGN', (0, 0), (0, 0), 'MIDDLE'),
        ('VALIGN', (1, 0), (1, 0), 'BOTTOM'),
        ('ALIGN', (1, 0), (1, 0), 'CENTER'),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    reception_elements.append(rec_table)
    story.append(KeepTogether(reception_elements))

    doc.build(story, onFirstPage=build_pdf_header_footer, onLaterPages=build_pdf_header_footer)
    buf.seek(0)
    return buf.getvalue()
