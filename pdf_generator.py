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
import json

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
            if os.path.isabs(str(rel_path)) and os.path.exists(str(rel_path)):
                abs_path = str(rel_path)
            elif os.path.exists(os.path.join(BASE_DIR, str(rel_path))):
                abs_path = os.path.join(BASE_DIR, str(rel_path))
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
    canvas.drawString(36, 20, "Hospital Claudio Vicuña · Unidad de Equipos Médicos (EEMM)")
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
        Paragraph("HOSPITAL CLAUDIO VICUÑA", title_style),
        Spacer(1, 2),
        Paragraph("REPORTE OFICIAL DE CHEQUEO PREVENTIVO", subtitle_style),
        Spacer(1, 1),
        Paragraph("Unidad de Equipos Médicos · Control Técnico Oficial", tag_style)
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
        Paragraph("HOSPITAL CLAUDIO VICUÑA", title_style),
        Spacer(1, 2),
        Paragraph("INFORME OFICIAL DE REVISIÓN CLÍNICA POR SERVICIO", subtitle_style),
        Spacer(1, 1),
        Paragraph("Unidad de Equipos Médicos · Control Preventivo Consolidado", tag_style)
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
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#18181b')),
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


def generate_entregas_pdf(entregas: list, fecha_inicio: str = None, fecha_fin: str = None) -> bytes:
    """
    Genera un informe PDF oficial consolidado de entregas de accesorios e insumos clínicos
    por rango de fechas para el Hospital Claudio Vicuña (Ingeniería Clínica EEMM).
    """
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

    # Estilos tipográficos
    title_style = ParagraphStyle(
        'DocTitleEnt',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=13,
        textColor=colors.HexColor('#0f172a')
    )
    subtitle_style = ParagraphStyle(
        'DocSubEnt',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor('#0f172a')
    )
    tag_style = ParagraphStyle(
        'DocTagEnt',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7,
        leading=9,
        textColor=colors.HexColor('#64748b')
    )
    meta_title = ParagraphStyle(
        'MetaTitleEnt',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=11,
        alignment=TA_RIGHT,
        textColor=colors.HexColor('#0f172a')
    )
    meta_sub = ParagraphStyle(
        'MetaSubEnt',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7,
        leading=9,
        alignment=TA_RIGHT,
        textColor=colors.HexColor('#64748b')
    )
    sec_heading = ParagraphStyle(
        'SecHeadEnt',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor('#0f172a')
    )
    cell_hdr = ParagraphStyle(
        'CellHdrEnt',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=7,
        leading=8.5,
        alignment=TA_CENTER,
        textColor=colors.HexColor('#ffffff')
    )
    cell_txt = ParagraphStyle(
        'CellTxtEnt',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=6.8,
        leading=8.5,
        textColor=colors.HexColor('#1e293b')
    )
    cell_txt_bold = ParagraphStyle(
        'CellTxtBoldEnt',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=7,
        leading=8.5,
        textColor=colors.HexColor('#0f172a')
    )
    cell_txt_center = ParagraphStyle(
        'CellTxtCenterEnt',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7,
        leading=8.5,
        alignment=TA_CENTER,
        textColor=colors.HexColor('#1e293b')
    )

    story = []

    # 1. ENCABEZADO INSTITUCIONAL
    logo_hcv = get_scaled_image("static/hcv_logo.png", max_width=95, max_height=42) or \
               get_scaled_image("static/eemm_logo.jpg", max_width=95, max_height=42)
    
    col_izq = []
    if logo_hcv:
        col_izq.append(logo_hcv)
    else:
        col_izq.append(Paragraph("<b>HOSPITAL CLAUDIO VICUÑA</b>", subtitle_style))
    
    col_centro = [
        Paragraph("HOSPITAL CLAUDIO VICUÑA — EEMM", title_style),
        Spacer(1, 1),
        Paragraph("CONTROL DE ENTREGA Y DESPACHO DE ACCESORIOS E INSUMOS", subtitle_style),
        Spacer(1, 1),
        Paragraph("UNIDAD DE INGENIERÍA CLÍNICA Y GESTIÓN BIOMÉDICA", tag_style)
    ]

    rango_texto = "Histórico Completo"
    if fecha_inicio and fecha_fin:
        rango_texto = f"{fecha_inicio} al {fecha_fin}"
    elif fecha_inicio:
        rango_texto = f"Desde {fecha_inicio}"
    elif fecha_fin:
        rango_texto = f"Hasta {fecha_fin}"

    now_str = datetime.now().strftime("%d/%m/%Y %H:%M")
    col_der = [
        Paragraph("ACTA OFICIAL DE ENTREGA", meta_title),
        Spacer(1, 1),
        Paragraph(f"<b>Período:</b> {rango_texto}", meta_sub),
        Paragraph(f"<b>Emisión:</b> {now_str}", meta_sub),
        Paragraph(f"<b>Total Registros:</b> {len(entregas)}", meta_sub)
    ]

    header_table = Table([[col_izq, col_centro, col_der]], colWidths=[100, 260, 180])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('TOPPADDING', (0, 0), (-1, -1), 0),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
    ]))
    story.append(header_table)
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#0f172a'), spaceBefore=4, spaceAfter=8))

    # 2. TARJETAS DE RESUMEN EJECUTIVO
    total_unidades = sum(int(e.get("cantidad") or 0) for e in entregas)
    servicios_unicos = len(set(e.get("servicio") for e in entregas if e.get("servicio")))

    summary_data = [
        [
            Paragraph("TOTAL ENTREGAS", tag_style),
            Paragraph("UNIDADES ENTREGADAS", tag_style),
            Paragraph("SERVICIOS BENEFICIADOS", tag_style),
            Paragraph("ESTADO DE BODEGA", tag_style)
        ],
        [
            Paragraph(f"<b>{len(entregas)}</b> entregas", cell_txt_bold),
            Paragraph(f"<b>{total_unidades}</b> unidades", cell_txt_bold),
            Paragraph(f"<b>{servicios_unicos}</b> áreas / servicios", cell_txt_bold),
            Paragraph("<b>Descontado en Bodega</b>", cell_txt_bold)
        ]
    ]
    summary_table = Table(summary_data, colWidths=[135, 135, 135, 135])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f8fafc')),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(summary_table)
    story.append(Spacer(1, 8))

    # 3. TABLA DE ENTREGAS
    story.append(Paragraph("DETALLE DE ENTREGAS Y RECEPCIÓN CONFORME", sec_heading))
    story.append(Spacer(1, 4))

    # Anchos de columna que suman exactamente 540 pt (ancho imprimible en carta con 36pt de márgenes)
    col_w = [24, 66, 78, 124, 34, 110, 104]

    table_data = [
        [
            Paragraph("<b>#</b>", cell_hdr),
            Paragraph("<b>Fecha / Folio</b>", cell_hdr),
            Paragraph("<b>Servicio Clínico</b>", cell_hdr),
            Paragraph("<b>Accesorio / Insumo</b>", cell_hdr),
            Paragraph("<b>Cant.</b>", cell_hdr),
            Paragraph("<b>Receptor / Entrega</b>", cell_hdr),
            Paragraph("<b>Firma Recepción</b>", cell_hdr),
        ]
    ]

    if not entregas:
        table_data.append([
            "",
            Paragraph("No se encontraron entregas en el rango de fechas seleccionado.", cell_txt),
            "", "", "", "", ""
        ])
    else:
        for idx, e in enumerate(entregas, 1):
            fecha_e = str(e.get("fecha_fmt") or e.get("fecha") or "")
            folio_e = str(e.get("folio") or f"ENT-{e.get('id', idx)}")
            rec_e = str(e.get("nombre_receptor") or "")
            tec_e = str(e.get("usuario_entrega") or "Técnico EEMM")
            acc_e = str(e.get("nombre_accesorio") or "")
            serv_e = str(e.get("servicio") or "")
            cant_e = str(e.get("cantidad") or "1")
            obs_e = str(e.get("observaciones") or "").strip()

            c_fecha = [
                Paragraph(f"<b>{fecha_e}</b>", cell_txt),
                Paragraph(f"<font color='#64748b'>{folio_e}</font>", tag_style)
            ]
            c_serv = Paragraph(f"<b>{serv_e}</b>", cell_txt)

            # Desglose de ítems si es una entrega múltiple
            items_list = []
            if e.get("items") and isinstance(e["items"], list):
                items_list = e["items"]
            elif e.get("items_json"):
                try:
                    items_list = json.loads(e["items_json"])
                except Exception:
                    items_list = []

            c_acc_items = []
            if items_list and len(items_list) > 1:
                c_acc_items.append(Paragraph(f"<b>Despacho Múltiple ({len(items_list)} insumos):</b>", cell_txt_bold))
                for it in items_list:
                    it_nom = it.get("nombre_accesorio") or it.get("nombre_caja") or it.get("id_caja") or "Insumo"
                    it_cant = it.get("cantidad", 1)
                    c_acc_items.append(Paragraph(f"• <b>{it_nom}</b> ({it_cant} un.)", cell_txt))
            elif items_list and len(items_list) == 1:
                it = items_list[0]
                it_nom = it.get("nombre_accesorio") or it.get("nombre_caja") or it.get("id_caja") or acc_e
                c_acc_items.append(Paragraph(f"<b>{it_nom}</b>", cell_txt_bold))
            else:
                c_acc_items.append(Paragraph(f"<b>{acc_e}</b>", cell_txt_bold))

            if obs_e:
                c_acc_items.append(Paragraph(f"<i>Nota: {obs_e}</i>", tag_style))
            
            if items_list and len(items_list) > 1:
                c_cant = [
                    Paragraph(f"<b>{cant_e}</b> un.", cell_txt_center),
                    Paragraph(f"<font color='#64748b'>({len(items_list)} ítems)</font>", tag_style)
                ]
            else:
                c_cant = Paragraph(f"<b>{cant_e}</b> un.", cell_txt_center)
            c_rec = [
                Paragraph(f"<b>Recibe:</b> {rec_e}", cell_txt),
                Paragraph(f"<b>Entrega:</b> {tec_e}", tag_style)
            ]

            # Firma digital
            firma_data = e.get("firma_data") or e.get("firma")
            sig_img = get_scaled_image(firma_data, max_width=94, max_height=30)
            if sig_img:
                c_sig = sig_img
            else:
                c_sig = Paragraph("<font color='#94a3b8'>Firma digital registrada</font>", tag_style)

            table_data.append([
                Paragraph(str(idx), cell_txt_center),
                c_fecha,
                c_serv,
                c_acc_items,
                c_cant,
                c_rec,
                c_sig
            ])

    ent_table = Table(table_data, colWidths=col_w, repeatRows=1)
    t_styles = [
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0f172a')),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('ALIGN', (0, 0), (0, -1), 'CENTER'),
        ('ALIGN', (4, 0), (4, -1), 'CENTER'),
        ('ALIGN', (6, 0), (6, -1), 'CENTER'),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('LEFTPADDING', (0, 0), (-1, -1), 3),
        ('RIGHTPADDING', (0, 0), (-1, -1), 3),
    ]

    for r in range(1, len(table_data)):
        bg = colors.HexColor('#ffffff') if r % 2 != 0 else colors.HexColor('#f8fafc')
        t_styles.append(('BACKGROUND', (0, r), (-1, r), bg))

    ent_table.setStyle(TableStyle(t_styles))
    story.append(ent_table)
    story.append(Spacer(1, 10))

    # 4. CIERRE INSTITUCIONAL Y DECLARACIÓN
    closing_elements = [
        Paragraph(
            "<b>Nota Legal e Institucional:</b> La presente acta certifica el despacho efectivo y la recepción conforme de los insumos y accesorios descritos precedentemente para el servicio hospitalario correspondiente, habiéndose descontado debidamente del inventario oficial de la bodega EEMM.",
            tag_style
        ),
        Spacer(1, 12)
    ]

    firmas_cierre = [
        [
            Paragraph("__________________________________________<br/><b>Responsable de Bodega / Ingeniería Clínica</b><br/>Unidad de Equipos Médicos", cell_txt_center),
            Paragraph("__________________________________________<br/><b>Supervisión / Jefatura de Servicio</b><br/>Hospital Claudio Vicuña", cell_txt_center)
        ]
    ]
    t_firmas = Table(firmas_cierre, colWidths=[270, 270])
    t_firmas.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    closing_elements.append(t_firmas)
    story.append(KeepTogether(closing_elements))

    doc.build(story, onFirstPage=build_pdf_header_footer, onLaterPages=build_pdf_header_footer)
    buf.seek(0)
    return buf.getvalue()


def generate_entrega_equipo_pdf(record: dict) -> bytes:
    """
    Genera el acta oficial de entrega individual de equipo médico para el Hospital Claudio Vicuña.
    Incluye datos del equipo (nombre, marca, modelo, inventario), servicio de destino,
    funcionario receptor, técnico responsable de EEMM, firma digital y condiciones de entrega.
    """
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
        'DocTitleEq',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=13,
        textColor=colors.HexColor('#0f172a')
    )
    subtitle_style = ParagraphStyle(
        'DocSubEq',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor('#0f172a')
    )
    tag_style = ParagraphStyle(
        'DocTagEq',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7.5,
        leading=10,
        textColor=colors.HexColor('#64748b')
    )
    meta_title = ParagraphStyle(
        'MetaTitleEq',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9.5,
        leading=12,
        alignment=TA_RIGHT,
        textColor=colors.HexColor('#0284c7')
    )
    meta_sub = ParagraphStyle(
        'MetaSubEq',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7.5,
        leading=10,
        alignment=TA_RIGHT,
        textColor=colors.HexColor('#64748b')
    )
    sec_heading = ParagraphStyle(
        'SecHeadEq',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor('#0f172a')
    )
    cell_lbl = ParagraphStyle(
        'CellLblEq',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=10,
        textColor=colors.HexColor('#475569')
    )
    cell_val = ParagraphStyle(
        'CellValEq',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor('#0f172a')
    )
    cell_val_bold = ParagraphStyle(
        'CellValBoldEq',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor('#0f172a')
    )
    cell_txt_center = ParagraphStyle(
        'CellTxtCenterEq',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7.5,
        leading=10,
        alignment=TA_CENTER,
        textColor=colors.HexColor('#475569')
    )

    story = []

    # 1. ENCABEZADO INSTITUCIONAL
    logo_hcv = get_scaled_image("static/hcv_logo.png", max_width=75, max_height=45) or \
               get_scaled_image("static/hcv_logo.jpg", max_width=75, max_height=45)

    col_izq = logo_hcv if logo_hcv else Paragraph("<b>Hospital Claudio Vicuña</b>", tag_style)
    col_centro = [
        Paragraph("HOSPITAL CLAUDIO VICUÑA", title_style),
        Paragraph("SUBDIRECCIÓN DE OPERACIONES · UNIDAD DE EQUIPOS MÉDICOS", subtitle_style),
        Paragraph("Ingeniería Clínica & Gestión de Tecnología Sanitaria", tag_style)
    ]

    folio = record.get("folio") or f"ENT-EQ-{record.get('id', '0001')}"
    fecha_str = str(record.get("fecha_fmt") or record.get("fecha") or datetime.now().strftime("%d/%m/%Y %H:%M"))
    now_str = datetime.now().strftime("%d/%m/%Y %H:%M")

    col_der = [
        Paragraph("ACTA DE ENTREGA DE EQUIPO", meta_title),
        Spacer(1, 2),
        Paragraph(f"<b>Folio:</b> {folio}", meta_sub),
        Paragraph(f"<b>Fecha Entrega:</b> {fecha_str}", meta_sub),
        Paragraph(f"<b>Emisión:</b> {now_str}", meta_sub)
    ]

    header_table = Table([[col_izq, col_centro, col_der]], colWidths=[80, 280, 180])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
    ]))
    story.append(header_table)
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#0284c7'), spaceBefore=6, spaceAfter=8))

    # 2. IDENTIFICACIÓN DEL EQUIPO MÉDICO
    story.append(Paragraph("1. IDENTIFICACIÓN DEL EQUIPO MÉDICO", sec_heading))
    story.append(Spacer(1, 3))

    nombre_eq = record.get("nombre_equipo") or "No especificado"
    marca_eq = record.get("marca") or "N/A"
    modelo_eq = record.get("modelo") or "N/A"
    inv_eq = record.get("inventario") or ""
    serie_eq = record.get("serie") or record.get("numero_serie") or ""

    if serie_eq and inv_eq and serie_eq != inv_eq:
        eq_data = [
            [
                Paragraph("Nombre del Equipo:", cell_lbl),
                Paragraph(f"<b>{nombre_eq}</b>", cell_val_bold),
                Paragraph("N° de Serie:", cell_lbl),
                Paragraph(f"<b>{serie_eq}</b>", cell_val_bold)
            ],
            [
                Paragraph("Marca:", cell_lbl),
                Paragraph(marca_eq, cell_val),
                Paragraph("Modelo:", cell_lbl),
                Paragraph(modelo_eq, cell_val)
            ],
            [
                Paragraph("N° Inventario / Activo:", cell_lbl),
                Paragraph(f"<b>{inv_eq}</b>", cell_val_bold),
                Paragraph("", cell_lbl),
                Paragraph("", cell_val)
            ]
        ]
    else:
        label_id = "N° de Serie / Inventario:" if (serie_eq or inv_eq) else "N° de Inventario / Activo:"
        val_id = serie_eq or inv_eq or "S/I"
        eq_data = [
            [
                Paragraph("Nombre del Equipo:", cell_lbl),
                Paragraph(f"<b>{nombre_eq}</b>", cell_val_bold),
                Paragraph(label_id, cell_lbl),
                Paragraph(f"<b>{val_id}</b>", cell_val_bold)
            ],
            [
                Paragraph("Marca:", cell_lbl),
                Paragraph(marca_eq, cell_val),
                Paragraph("Modelo:", cell_lbl),
                Paragraph(modelo_eq, cell_val)
            ]
        ]

    eq_table = Table(eq_data, colWidths=[120, 150, 140, 130])
    eq_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f8fafc')),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(eq_table)
    story.append(Spacer(1, 8))

    # 3. DESTINO Y RESPONSABLES
    story.append(Paragraph("2. DESTINO Y RESPONSABLES DEL DESPACHO", sec_heading))
    story.append(Spacer(1, 3))

    servicio_rec = record.get("servicio") or "No asignado"
    nombre_rec = record.get("nombre_receptor") or "No especificado"
    tecnico_ent = record.get("usuario_entrega") or "Técnico EEMM"

    resp_data = [
        [
            Paragraph("Servicio Clínico Receptor:", cell_lbl),
            Paragraph(f"<b>{servicio_rec}</b>", cell_val_bold),
            Paragraph("Fecha y Hora:", cell_lbl),
            Paragraph(fecha_str, cell_val)
        ],
        [
            Paragraph("Funcionario que Recibe:", cell_lbl),
            Paragraph(f"<b>{nombre_rec}</b>", cell_val_bold),
            Paragraph("Técnico EEMM que Entrega:", cell_lbl),
            Paragraph(f"<b>{tecnico_ent}</b>", cell_val)
        ]
    ]

    resp_table = Table(resp_data, colWidths=[130, 140, 140, 130])
    resp_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f8fafc')),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(resp_table)
    story.append(Spacer(1, 8))

    # 4. OBSERVACIONES Y CONDICIONES
    story.append(Paragraph("3. OBSERVACIONES TÉCNICAS Y CONDICIONES DE ENTREGA", sec_heading))
    story.append(Spacer(1, 3))

    obs = record.get("observaciones") or ""
    obs_txt = obs.strip() if obs and obs.strip() else "Equipo entregado en condiciones óptimas de operatividad técnica, limpio y verificado por la Unidad de Equipos Médicos para su puesta en marcha en el servicio clínico."

    obs_table = Table([[Paragraph(obs_txt, cell_val)]], colWidths=[540])
    obs_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f8fafc')),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(obs_table)
    story.append(Spacer(1, 10))

    # 5. FIRMA DE RECEPCIÓN
    firma_ruta = record.get("firma_data") or record.get("firma")
    sig_img = get_scaled_image(firma_ruta, max_width=200, max_height=75)

    tag_style_center = ParagraphStyle(
        'DocTagEqCenter',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7.5,
        leading=10,
        alignment=TA_CENTER,
        textColor=colors.HexColor('#64748b')
    )

    if sig_img:
        rec_sig_cell = [
            Table([[sig_img]], colWidths=[280], style=[
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('LEFTPADDING', (0, 0), (-1, -1), 0),
                ('RIGHTPADDING', (0, 0), (-1, -1), 0),
                ('TOPPADDING', (0, 0), (-1, -1), 0),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
            ]),
            Spacer(1, 3),
            Paragraph("__________________________________________", cell_txt_center),
            Spacer(1, 3),
            Paragraph(f"<b>{nombre_rec}</b>", cell_txt_center),
            Paragraph(f"Receptor Conforme / {servicio_rec}", tag_style_center)
        ]
    else:
        rec_sig_cell = [
            Spacer(1, 45),
            Paragraph("__________________________________________", cell_txt_center),
            Spacer(1, 3),
            Paragraph(f"<b>{nombre_rec}</b>", cell_txt_center),
            Paragraph(f"Receptor Conforme / {servicio_rec}", tag_style_center)
        ]

    # Tabla centrada para la firma de recepción (ancho total 540 pt)
    t_firmas = Table([["", rec_sig_cell, ""]], colWidths=[130, 280, 130])
    t_firmas.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'BOTTOM'),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('TOPPADDING', (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
    ]))

    closing_elements = [
        Spacer(1, 20),
        t_firmas
    ]
    story.append(KeepTogether(closing_elements))

    doc.build(story, onFirstPage=build_pdf_header_footer, onLaterPages=build_pdf_header_footer)
    buf.seek(0)
    return buf.getvalue()


def generate_entregas_equipos_consolidado_pdf(entregas: list, fecha_inicio: str = None, fecha_fin: str = None, servicio: str = None) -> bytes:
    """
    Genera un informe PDF oficial consolidado de entregas de equipos médicos
    por rango de fechas y/o servicio clínico para el Hospital Claudio Vicuña.
    """
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
        'DocTitleEntEqCons',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=13,
        textColor=colors.HexColor('#0f172a')
    )
    subtitle_style = ParagraphStyle(
        'DocSubEntEqCons',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor('#0f172a')
    )
    tag_style = ParagraphStyle(
        'DocTagEntEqCons',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7,
        leading=9,
        textColor=colors.HexColor('#64748b')
    )
    meta_title = ParagraphStyle(
        'MetaTitleEntEqCons',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=11,
        alignment=TA_RIGHT,
        textColor=colors.HexColor('#0284c7')
    )
    meta_sub = ParagraphStyle(
        'MetaSubEntEqCons',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7,
        leading=9,
        alignment=TA_RIGHT,
        textColor=colors.HexColor('#64748b')
    )
    cell_hdr = ParagraphStyle(
        'CellHdrEntEqCons',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=7.5,
        leading=9.5,
        alignment=TA_CENTER,
        textColor=colors.HexColor('#ffffff')
    )
    cell_txt = ParagraphStyle(
        'CellTxtEntEqCons',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7.5,
        leading=9.5,
        textColor=colors.HexColor('#0f172a')
    )
    cell_txt_bold = ParagraphStyle(
        'CellTxtBoldEntEqCons',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=10,
        textColor=colors.HexColor('#0f172a')
    )
    cell_txt_center = ParagraphStyle(
        'CellTxtCenterEntEqCons',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7,
        leading=9,
        alignment=TA_CENTER,
        textColor=colors.HexColor('#475569')
    )

    story = []

    # 1. ENCABEZADO INSTITUCIONAL
    logo_hcv = get_scaled_image("static/hcv_logo.png", max_width=68, max_height=42) or \
               get_scaled_image("static/hcv_logo.jpg", max_width=68, max_height=42)
    logo_eemm = get_scaled_image("static/eemm_logo_clean.jpg", max_width=68, max_height=42) or \
                get_scaled_image("static/eemm_logo.jpg", max_width=68, max_height=42)

    logos_cell = []
    if logo_hcv: logos_cell.append(logo_hcv)
    if logo_eemm: logos_cell.append(logo_eemm)

    col_izq = Table([logos_cell], colWidths=[46] * len(logos_cell)) if logos_cell else Paragraph("<b>Hospital Claudio Vicuña</b>", tag_style)
    col_centro = [
        Paragraph("HOSPITAL CLAUDIO VICUÑA", title_style),
        Paragraph("SUBDIRECCIÓN DE OPERACIONES · UNIDAD DE EQUIPOS MÉDICOS", subtitle_style),
        Paragraph("Historial Oficial de Entregas y Asignaciones de Equipamiento Médico", tag_style)
    ]

    now_str = datetime.now().strftime("%d/%m/%Y %H:%M")
    rango_texto = "Histórico Completo"
    if fecha_inicio and fecha_fin:
        rango_texto = f"{fecha_inicio} al {fecha_fin}"
    elif fecha_inicio:
        rango_texto = f"Desde {fecha_inicio}"
    elif fecha_fin:
        rango_texto = f"Hasta {fecha_fin}"

    col_der = [
        Paragraph("HISTORIAL DE ENTREGAS", meta_title),
        Spacer(1, 1),
        Paragraph(f"<b>Período:</b> {rango_texto}", meta_sub),
        Paragraph(f"<b>Emisión:</b> {now_str}", meta_sub),
        Paragraph(f"<b>Total Equipos:</b> {len(entregas)}", meta_sub)
    ]

    header_table = Table([[col_izq, col_centro, col_der]], colWidths=[100, 260, 180])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
    ]))
    story.append(header_table)
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#0284c7'), spaceBefore=4, spaceAfter=8))

    # 2. TARJETAS DE RESUMEN EJECUTIVO
    servicios_unicos = len(set(e.get("servicio") for e in entregas if e.get("servicio")))
    equipos_unicos = len(set(e.get("nombre_equipo") for e in entregas if e.get("nombre_equipo")))

    summary_data = [
        [
            Paragraph("TOTAL ENTREGAS", tag_style),
            Paragraph("EQUIPOS ENTREGADOS", tag_style),
            Paragraph("SERVICIOS BENEFICIADOS", tag_style),
            Paragraph("ESTADO REGISTRO", tag_style)
        ],
        [
            Paragraph(f"<b>{len(entregas)}</b> actas", cell_txt_bold),
            Paragraph(f"<b>{equipos_unicos}</b> tipos de equipo", cell_txt_bold),
            Paragraph(f"<b>{servicios_unicos}</b> áreas / servicios", cell_txt_bold),
            Paragraph("<b>Conformes y Firmadas</b>", cell_txt_bold)
        ]
    ]

    summary_table = Table(summary_data, colWidths=[135, 135, 135, 135])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f0f9ff')),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#bae6fd')),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e0f2fe')),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(summary_table)
    story.append(Spacer(1, 10))

    # 3. TABLA DETALLADA DE ENTREGAS
    col_w = [68, 75, 115, 80, 85, 57, 60]
    table_data = [
        [
            Paragraph("<b>Folio / Fecha</b>", cell_hdr),
            Paragraph("<b>Servicio Clínico</b>", cell_hdr),
            Paragraph("<b>Equipo / Marca / Modelo</b>", cell_hdr),
            Paragraph("<b>N° Inventario</b>", cell_hdr),
            Paragraph("<b>Receptor / Entrega</b>", cell_hdr),
            Paragraph("<b>Firma</b>", cell_hdr),
            Paragraph("<b>Obs.</b>", cell_hdr),
        ]
    ]

    if not entregas:
        table_data.append([
            "",
            Paragraph("No se encontraron entregas de equipos en los criterios seleccionados.", cell_txt),
            "", "", "", "", ""
        ])
    else:
        for idx, e in enumerate(entregas, 1):
            fecha_e = str(e.get("fecha_fmt") or e.get("fecha") or "")
            folio_e = str(e.get("folio") or f"ENT-EQ-{e.get('id', idx)}")
            rec_e = str(e.get("nombre_receptor") or "")
            tec_e = str(e.get("usuario_entrega") or "Técnico EEMM")
            nom_eq = str(e.get("nombre_equipo") or "")
            marca_mod = f"{e.get('marca') or ''} {e.get('modelo') or ''}".strip() or "S/M"
            inv_e = str(e.get("inventario") or "S/I")
            serv_e = str(e.get("servicio") or "")
            obs_e = str(e.get("observaciones") or "").strip()

            c_folio_fecha = [
                Paragraph(f"<b>{folio_e}</b>", cell_txt_bold),
                Paragraph(f"<font color='#64748b'>{fecha_e}</font>", tag_style)
            ]
            c_serv = Paragraph(f"<b>{serv_e}</b>", cell_txt)
            c_equipo = [
                Paragraph(f"<b>{nom_eq}</b>", cell_txt),
                Paragraph(f"<font color='#475569'>{marca_mod}</font>", tag_style)
            ]
            c_inv = Paragraph(f"<b>{inv_e}</b>", cell_txt)
            c_resp = [
                Paragraph(f"<b>Recibe:</b> {rec_e}", cell_txt),
                Paragraph(f"<b>Entrega:</b> {tec_e}", tag_style)
            ]

            firma_data = e.get("firma_data") or e.get("firma")
            sig_img = get_scaled_image(firma_data, max_width=52, max_height=26)
            if sig_img:
                c_sig = sig_img
            else:
                c_sig = Paragraph("<font color='#0284c7'>Firmado</font>", tag_style)

            c_obs = Paragraph(obs_e if obs_e else "<font color='#94a3b8'>-</font>", tag_style)

            table_data.append([
                c_folio_fecha,
                c_serv,
                c_equipo,
                c_inv,
                c_resp,
                c_sig,
                c_obs
            ])

    ent_table = Table(table_data, colWidths=col_w, repeatRows=1)
    t_styles = [
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0284c7')),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('ALIGN', (0, 0), (0, -1), 'CENTER'),
        ('ALIGN', (3, 0), (3, -1), 'CENTER'),
        ('ALIGN', (5, 0), (5, -1), 'CENTER'),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('LEFTPADDING', (0, 0), (-1, -1), 3),
        ('RIGHTPADDING', (0, 0), (-1, -1), 3),
    ]

    for r in range(1, len(table_data)):
        bg = colors.HexColor('#ffffff') if r % 2 != 0 else colors.HexColor('#f8fafc')
        t_styles.append(('BACKGROUND', (0, r), (-1, r), bg))

    ent_table.setStyle(TableStyle(t_styles))
    story.append(ent_table)
    story.append(Spacer(1, 10))

    # 4. CIERRE INSTITUCIONAL Y DECLARACIÓN
    closing_elements = [
        Paragraph(
            "<b>Nota Legal e Institucional:</b> La presente acta certifica la entrega técnica y recepción conforme del equipamiento médico detallado para el servicio hospitalario correspondiente, de acuerdo a las normativas de Ingeniería Clínica y gestión de activos del Hospital Claudio Vicuña.",
            tag_style
        ),
        Spacer(1, 12)
    ]

    firmas_cierre = [
        [
            Paragraph("__________________________________________<br/><b>Ingeniería Clínica / Unidad de Equipos Médicos</b><br/>Hospital Claudio Vicuña", cell_txt_center),
            Paragraph("__________________________________________<br/><b>Jefatura / Supervisión de Servicio Clínico</b><br/>Hospital Claudio Vicuña", cell_txt_center)
        ]
    ]
    t_firmas = Table(firmas_cierre, colWidths=[270, 270])
    t_firmas.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    closing_elements.append(t_firmas)
    story.append(KeepTogether(closing_elements))

    doc.build(story, onFirstPage=build_pdf_header_footer, onLaterPages=build_pdf_header_footer)
    buf.seek(0)
    return buf.getvalue()


def _format_fecha_cl(fecha_str: str) -> str:
    """Convierte YYYY-MM-DD a DD/MM/YYYY de forma segura."""
    if not fecha_str:
        return ""
    s = str(fecha_str).strip()
    try:
        dt = datetime.strptime(s[:10], "%Y-%m-%d")
        return dt.strftime("%d/%m/%Y")
    except Exception:
        return s


def _format_dia_semana_es(fecha_str: str) -> str:
    """Retorna el día de la semana en español para una fecha YYYY-MM-DD."""
    dias = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]
    try:
        dt = datetime.strptime(str(fecha_str).strip()[:10], "%Y-%m-%d")
        return f"{dias[dt.weekday()]} {dt.strftime('%d/%m/%Y')}"
    except Exception:
        return str(fecha_str or "")


def _tareas_pdf_styles():
    """Retorna diccionario de estilos comunes para reportes diarios y semanales de tareas."""
    styles = getSampleStyleSheet()
    return {
        "title": ParagraphStyle(
            'DocTitleTareas', parent=styles['Normal'], fontName='Helvetica-Bold',
            fontSize=11, leading=13, textColor=colors.HexColor('#0f172a')
        ),
        "subtitle": ParagraphStyle(
            'DocSubTareas', parent=styles['Normal'], fontName='Helvetica-Bold',
            fontSize=8.5, leading=11, textColor=colors.HexColor('#0f172a')
        ),
        "tag": ParagraphStyle(
            'DocTagTareas', parent=styles['Normal'], fontName='Helvetica',
            fontSize=7, leading=9.5, textColor=colors.HexColor('#64748b')
        ),
        "meta_title": ParagraphStyle(
            'MetaTitleTareas', parent=styles['Normal'], fontName='Helvetica-Bold',
            fontSize=9, leading=11, alignment=TA_RIGHT, textColor=colors.HexColor('#6d28d9')
        ),
        "meta_sub": ParagraphStyle(
            'MetaSubTareas', parent=styles['Normal'], fontName='Helvetica',
            fontSize=7.2, leading=9.5, alignment=TA_RIGHT, textColor=colors.HexColor('#475569')
        ),
        "sec_heading": ParagraphStyle(
            'SecHeadTareas', parent=styles['Normal'], fontName='Helvetica-Bold',
            fontSize=8.5, leading=11, textColor=colors.HexColor('#0f172a')
        ),
        "day_heading": ParagraphStyle(
            'DayHeadTareas', parent=styles['Normal'], fontName='Helvetica-Bold',
            fontSize=8.2, leading=10.5, textColor=colors.HexColor('#4c1d95')
        ),
        "cell_hdr": ParagraphStyle(
            'CellHdrTareas', parent=styles['Normal'], fontName='Helvetica-Bold',
            fontSize=7.5, leading=9.5, alignment=TA_CENTER, textColor=colors.HexColor('#ffffff')
        ),
        "cell_txt": ParagraphStyle(
            'CellTxtTareas', parent=styles['Normal'], fontName='Helvetica',
            fontSize=7.5, leading=10, textColor=colors.HexColor('#0f172a')
        ),
        "cell_txt_bold": ParagraphStyle(
            'CellTxtBoldTareas', parent=styles['Normal'], fontName='Helvetica-Bold',
            fontSize=7.8, leading=10, textColor=colors.HexColor('#0f172a')
        ),
        "cell_txt_center": ParagraphStyle(
            'CellTxtCenterTareas', parent=styles['Normal'], fontName='Helvetica',
            fontSize=7.2, leading=9.5, alignment=TA_CENTER, textColor=colors.HexColor('#334155')
        ),
    }


def _build_tareas_header(st: dict, subtitle_desc: str, right_meta: list) -> list:
    """Construye encabezado institucional Hospital Claudio Vicuña para reportes de tareas."""
    logo_hcv = get_scaled_image("static/hcv_logo.png", max_width=72, max_height=44) or \
               get_scaled_image("static/hcv_logo.jpg", max_width=72, max_height=44)
    col_izq = logo_hcv if logo_hcv else Paragraph("<b>Hospital Claudio Vicuña</b>", st["tag"])
    col_centro = [
        Paragraph("HOSPITAL CLAUDIO VICUÑA", st["title"]),
        Paragraph("SUBDIRECCIÓN DE OPERACIONES · UNIDAD DE EQUIPOS MÉDICOS", st["subtitle"]),
        Paragraph(subtitle_desc, st["tag"])
    ]
    header_table = Table([[col_izq, col_centro, right_meta]], colWidths=[78, 282, 180])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
    ]))
    return [
        header_table,
        HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#6d28d9'), spaceBefore=5, spaceAfter=8)
    ]


def _build_tareas_table(items: list, st: dict, include_tecnico: bool = False) -> Table:
    """Genera la tabla estandarizada de tareas/trabajos realizados."""
    if include_tecnico:
        col_w = [40, 82, 95, 100, 168, 55]
        headers = ["Hora", "Técnico", "Servicio Clínico", "Tipo / Equipo", "Descripción del Trabajo", "Estado"]
    else:
        col_w = [44, 108, 118, 212, 58]
        headers = ["Hora", "Servicio Clínico", "Tipo / Equipo", "Descripción del Trabajo", "Estado"]

    rows = [[Paragraph(f"<b>{h}</b>", st["cell_hdr"]) for h in headers]]

    if not items:
        empty_row = [""] * len(headers)
        empty_row[1] = Paragraph("Sin trabajos o tareas registradas en este período.", st["cell_txt"])
        rows.append(empty_row)
    else:
        for it in items:
            hora = str(it.get("hora") or "--:--").strip()
            serv = str(it.get("servicio") or "GENERAL").strip()
            tipo = str(it.get("tipo_tarea") or "Labor Técnica").strip()
            equipo = str(it.get("equipo") or "").strip()
            desc = str(it.get("descripcion") or "").strip()
            estado_t = str(it.get("estado_tarea") or "Completada").strip()

            labor_html = f"<b>{tipo}</b>"
            if equipo:
                labor_html += f"<br/><font color='#475569' size='7'>Equipo: {equipo}</font>"

            est_color = "#15803d" if estado_t.lower() == "completada" else ("#b45309" if "proceso" in estado_t.lower() else "#b91c1c")
            c_hora = Paragraph(f"<b>{hora}</b>", st["cell_txt_center"])
            c_serv = Paragraph(f"<b>{serv}</b>", st["cell_txt"])
            c_labor = Paragraph(labor_html, st["cell_txt"])
            c_desc = Paragraph(desc.replace("\n", "<br/>"), st["cell_txt"])
            c_est = Paragraph(f"<font color='{est_color}'><b>{estado_t}</b></font>", st["cell_txt_center"])

            if include_tecnico:
                tec_name = str(it.get("tecnico") or "").strip()
                rows.append([c_hora, Paragraph(tec_name, st["cell_txt"]), c_serv, c_labor, c_desc, c_est])
            else:
                rows.append([c_hora, c_serv, c_labor, c_desc, c_est])

    tbl = Table(rows, colWidths=col_w, repeatRows=1)
    t_styles = [
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#6d28d9')),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('ALIGN', (0, 0), (0, -1), 'CENTER'),
        ('ALIGN', (-1, 0), (-1, -1), 'CENTER'),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 4),
        ('RIGHTPADDING', (0, 0), (-1, -1), 4),
    ]
    for r in range(1, len(rows)):
        bg = colors.HexColor('#ffffff') if r % 2 != 0 else colors.HexColor('#f8fafc')
        t_styles.append(('BACKGROUND', (0, r), (-1, r), bg))
    tbl.setStyle(TableStyle(t_styles))
    return tbl


def generate_tareas_diarias_pdf(reportes: list, fecha: str = None, tecnico: str = None) -> bytes:
    """
    Genera el Reporte Diario oficial de Tareas / Trabajos realizados por técnico (o consolidado diario)
    para el Hospital Claudio Vicuña.
    """
    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf, pagesize=letter, leftMargin=36, rightMargin=36, topMargin=36, bottomMargin=42
    )
    st = _tareas_pdf_styles()
    story = []

    now_str = datetime.now().strftime("%d/%m/%Y %H:%M")
    fecha_cl = _format_fecha_cl(fecha) if fecha else now_str[:10]
    single_rep = reportes[0] if len(reportes) == 1 else None
    all_items = []
    for rep in reportes:
        for it in rep.get("items", []):
            item_copy = dict(it)
            item_copy["tecnico"] = rep.get("tecnico", "")
            all_items.append(item_copy)

    tecnico_label = (single_rep.get("tecnico") if single_rep else (tecnico or "Todos los Técnicos"))
    folio_label = (single_rep.get("folio") or "BORRADOR") if single_rep else f"DIARIO-{fecha or 'EEMM'}"
    estado_label = (single_rep.get("estado") or "BORRADOR") if single_rep else "CONSOLIDADO"

    right_meta = [
        Paragraph("REPORTE DIARIO DE TAREAS", st["meta_title"]),
        Spacer(1, 2),
        Paragraph(f"<b>Folio:</b> {folio_label}", st["meta_sub"]),
        Paragraph(f"<b>Fecha Jornada:</b> {fecha_cl}", st["meta_sub"]),
        Paragraph(f"<b>Estado:</b> {estado_label}", st["meta_sub"]),
        Paragraph(f"<b>Emisión:</b> {now_str}", st["meta_sub"])
    ]
    story.extend(_build_tareas_header(st, "Control de Actividades Diarias & Ingeniería Clínica", right_meta))

    servicios_unicos = len(set(it.get("servicio") for it in all_items if it.get("servicio")))
    completadas = sum(1 for it in all_items if str(it.get("estado_tarea", "")).lower() == "completada")

    summary_data = [
        [
            Paragraph("TÉCNICO RESPONSABLE", st["tag"]),
            Paragraph("TAREAS REGISTRADAS", st["tag"]),
            Paragraph("COMPLETADAS", st["tag"]),
            Paragraph("SERVICIOS ATENDIDOS", st["tag"])
        ],
        [
            Paragraph(f"<b>{tecnico_label}</b>", st["cell_txt_bold"]),
            Paragraph(f"<b>{len(all_items)}</b> actividades", st["cell_txt_bold"]),
            Paragraph(f"<b>{completadas} / {len(all_items)}</b>", st["cell_txt_bold"]),
            Paragraph(f"<b>{servicios_unicos}</b> áreas clínicas", st["cell_txt_bold"])
        ]
    ]
    summary_table = Table(summary_data, colWidths=[185, 115, 115, 125])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f5f3ff')),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#ddd6fe')),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#ede9fe')),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(summary_table)
    story.append(Spacer(1, 10))

    story.append(Paragraph("1. DETALLE DE TRABAJOS Y TAREAS DE LA JORNADA", st["sec_heading"]))
    story.append(Spacer(1, 4))
    story.append(_build_tareas_table(all_items, st, include_tecnico=(len(reportes) > 1)))
    story.append(Spacer(1, 10))

    obs_list = []
    for rep in reportes:
        obs_txt = (rep.get("observaciones_generales") or "").strip()
        if obs_txt:
            prefix = f"<b>{rep.get('tecnico')}:</b> " if len(reportes) > 1 else ""
            obs_list.append(f"{prefix}{obs_txt}")

    if obs_list:
        story.append(Paragraph("2. OBSERVACIONES GENERALES DE LA JORNADA", st["sec_heading"]))
        story.append(Spacer(1, 3))
        obs_tbl = Table([[Paragraph("<br/>".join(obs_list), st["cell_txt"])]], colWidths=[540])
        obs_tbl.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f8fafc')),
            ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('LEFTPADDING', (0, 0), (-1, -1), 8),
            ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ]))
        story.append(obs_tbl)
        story.append(Spacer(1, 14))

    t_firmas = Table([[
        Paragraph(f"__________________________________________<br/><b>{tecnico_label}</b><br/>Unidad de Equipos Médicos (EEMM)", st["cell_txt_center"]),
        Paragraph("__________________________________________<br/><b>V°B° Jefatura / Supervisión EEMM</b><br/>Hospital Claudio Vicuña", st["cell_txt_center"])
    ]], colWidths=[270, 270])
    t_firmas.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('TOPPADDING', (0, 0), (-1, -1), 16),
    ]))
    story.append(KeepTogether([t_firmas]))

    doc.build(story, onFirstPage=build_pdf_header_footer, onLaterPages=build_pdf_header_footer)
    buf.seek(0)
    return buf.getvalue()


def generate_tareas_semanal_pdf(reportes: list, fecha_inicio: str, fecha_fin: str, tecnico: str = None) -> bytes:
    """
    Genera el Reporte Semanal consolidado de trabajos y tareas por técnico
    agrupado cronológicamente por jornada para el Hospital Claudio Vicuña.
    """
    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf, pagesize=letter, leftMargin=36, rightMargin=36, topMargin=36, bottomMargin=42
    )
    st = _tareas_pdf_styles()
    story = []

    now_str = datetime.now().strftime("%d/%m/%Y %H:%M")
    ini_cl = _format_fecha_cl(fecha_inicio)
    fin_cl = _format_fecha_cl(fecha_fin)
    tecnico_label = tecnico.strip() if tecnico and tecnico.strip() else "Todos los Técnicos EEMM"

    all_items = [it for rep in reportes for it in rep.get("items", [])]
    dias_con_registro = len(set(rep.get("fecha") for rep in reportes if rep.get("items")))
    servicios_unicos = len(set(it.get("servicio") for it in all_items if it.get("servicio")))
    completadas = sum(1 for it in all_items if str(it.get("estado_tarea", "")).lower() == "completada")

    right_meta = [
        Paragraph("REPORTE SEMANAL DE TAREAS", st["meta_title"]),
        Spacer(1, 2),
        Paragraph(f"<b>Período:</b> {ini_cl} al {fin_cl}", st["meta_sub"]),
        Paragraph(f"<b>Técnico:</b> {tecnico_label}", st["meta_sub"]),
        Paragraph(f"<b>Total Tareas:</b> {len(all_items)}", st["meta_sub"]),
        Paragraph(f"<b>Emisión:</b> {now_str}", st["meta_sub"])
    ]
    story.extend(_build_tareas_header(st, "Informe Semanal de Labores Técnicas e Ingeniería Clínica", right_meta))

    summary_data = [
        [
            Paragraph("TÉCNICO / ALCANCE", st["tag"]),
            Paragraph("JORNADAS ACTIVAS", st["tag"]),
            Paragraph("TOTAL TAREAS SEMANA", st["tag"]),
            Paragraph("COMPLETADAS / ÁREAS", st["tag"])
        ],
        [
            Paragraph(f"<b>{tecnico_label}</b>", st["cell_txt_bold"]),
            Paragraph(f"<b>{dias_con_registro}</b> días reportados", st["cell_txt_bold"]),
            Paragraph(f"<b>{len(all_items)}</b> actividades", st["cell_txt_bold"]),
            Paragraph(f"<b>{completadas}</b> ok · <b>{servicios_unicos}</b> servicios", st["cell_txt_bold"])
        ]
    ]
    summary_table = Table(summary_data, colWidths=[180, 110, 120, 130])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f5f3ff')),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#ddd6fe')),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#ede9fe')),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(summary_table)
    story.append(Spacer(1, 10))

    if not reportes or not all_items:
        empty_box = Table(
            [[Paragraph("No se encontraron tareas ni reportes diarios registrados para el técnico y semana seleccionados.", st["cell_txt_center"])]],
            colWidths=[540]
        )
        empty_box.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f8fafc')),
            ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
            ('TOPPADDING', (0, 0), (-1, -1), 16),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 16),
        ]))
        story.append(empty_box)
    else:
        for rep in reportes:
            items_rep = rep.get("items", [])
            if not items_rep:
                continue
            dia_txt = _format_dia_semana_es(rep.get("fecha"))
            folio_r = rep.get("folio") or "BORRADOR"
            est_r = rep.get("estado") or "BORRADOR"
            tec_r = rep.get("tecnico") or ""
            header_day_txt = f"{dia_txt} · Técnico: {tec_r} · Folio: {folio_r} ({est_r}) — {len(items_rep)} tareas"

            day_banner = Table([[Paragraph(header_day_txt, st["day_heading"])]], colWidths=[540])
            day_banner.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#ede9fe')),
                ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#c4b5fd')),
                ('TOPPADDING', (0, 0), (-1, -1), 4),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
                ('LEFTPADDING', (0, 0), (-1, -1), 6),
            ]))
            story.append(day_banner)
            story.append(Spacer(1, 3))
            story.append(_build_tareas_table(items_rep, st, include_tecnico=False))

            obs_r = (rep.get("observaciones_generales") or "").strip()
            if obs_r:
                story.append(Spacer(1, 2))
                story.append(Paragraph(f"<i>Obs. Jornada: {obs_r}</i>", st["tag"]))

            story.append(Spacer(1, 10))

    t_firmas = Table([[
        Paragraph(f"__________________________________________<br/><b>{tecnico_label}</b><br/>Unidad de Equipos Médicos (EEMM)", st["cell_txt_center"]),
        Paragraph("__________________________________________<br/><b>V°B° Jefatura / Supervisión EEMM</b><br/>Hospital Claudio Vicuña", st["cell_txt_center"])
    ]], colWidths=[270, 270])
    t_firmas.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('TOPPADDING', (0, 0), (-1, -1), 14),
    ]))
    story.append(KeepTogether([t_firmas]))

    doc.build(story, onFirstPage=build_pdf_header_footer, onLaterPages=build_pdf_header_footer)
    buf.seek(0)
    return buf.getvalue()

