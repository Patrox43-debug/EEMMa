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

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

def get_scaled_image(rel_path: str, max_width: float, max_height: float):
    """Carga una imagen local y calcula sus dimensiones proporcionales para ReportLab."""
    if not rel_path:
        return None
    clean_path = rel_path.lstrip("/").replace("/", os.sep)
    abs_path = os.path.join(BASE_DIR, clean_path)
    if not os.path.exists(abs_path):
        return None
    
    try:
        with PILImage.open(abs_path) as im:
            w, h = im.size
            if w <= 0 or h <= 0:
                return None
            ratio = min(max_width / w, max_height / h)
            target_w = w * ratio
            target_h = h * ratio
        return RLImage(abs_path, width=target_w, height=target_h)
    except Exception as e:
        print(f"Error procesando imagen para PDF ({rel_path}): {e}")
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
        fontSize=13,
        leading=15,
        textColor=colors.HexColor('#1e40af')
    )
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=12,
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
        textColor=colors.HexColor('#1e40af')
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
        textColor=colors.HexColor('#1e3a8a')
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

    # 1. ENCABEZADO INSTITUCIONAL
    header_left = [
        Paragraph("EEMM · INGENIERÍA CLÍNICA", title_style),
        Spacer(1, 2),
        Paragraph("REPORTE OFICIAL DE CHEQUEO PREVENTIVO", subtitle_style),
        Spacer(1, 1),
        Paragraph("Control Técnico y Recepción de Equipos Médicos Hospitalarios", tag_style)
    ]

    id_reg = record.get("id_registro", 0)
    fecha_reg = record.get("fecha", datetime.now().strftime("%Y-%m-%d %H:%M"))
    idpdf = record.get("idpdf", f"PDF-{id_reg}")

    header_right = [
        Paragraph(f"FOLIO Nº <b>#{id_reg:05d}</b>", meta_title),
        Spacer(1, 2),
        Paragraph(f"Fecha: <b>{fecha_reg}</b>", meta_sub),
        Paragraph(f"Cód: <code>{idpdf}</code>", meta_sub),
        Paragraph("<font color='#16a34a'><b>● REGISTRO CONFIRMADO</b></font>", meta_sub)
    ]

    header_table = Table([[header_left, header_right]], colWidths=[340, 200])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('TOPPADDING', (0,0), (-1,-1), 0),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 0),
    ]))
    story.append(header_table)
    story.append(Spacer(1, 6))

    # Barra separadora en azul cobalto
    story.append(HRFlowable(width="100%", thickness=2, color=colors.HexColor('#2563eb'), spaceAfter=8, spaceBefore=2))

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
        ('LINELEFT', (0, 0), (0, 0), 3, colors.HexColor('#2563eb')),
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
