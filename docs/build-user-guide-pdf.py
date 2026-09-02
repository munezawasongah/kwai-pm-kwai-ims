"""
Render USER_GUIDE.md into a branded PDF for staff.

Handles the subset of markdown actually used in the guide: headings, paragraphs,
bullet lists, tables, bold/italic/code spans, horizontal rules and blockquote-style
callouts. Not a general markdown engine — just enough, done properly.
"""
import re, os
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT
from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
                                PageBreak, HRFlowable, Image, KeepTogether)

SRC = "/home/claude/kwai-pm-kwai/USER_GUIDE.md"
OUT = "/mnt/user-data/outputs/kwai-pm-kwai-user-guide.pdf"
LOGO = "/home/claude/kwai-pm-kwai/public/branding/logo.png"

NAVY = colors.HexColor("#0a1420")
NAVY_SOFT = colors.HexColor("#16283d")
GOLD = colors.HexColor("#a5813c")
GOLD_LIGHT = colors.HexColor("#c9a15f")
INK = colors.HexColor("#1e1e1e")
MUTED = colors.HexColor("#5a5a5a")
RULE = colors.HexColor("#d8d2c4")
PANEL = colors.HexColor("#f6f2e9")

ss = getSampleStyleSheet()

def S(name, parent=None, **kw):
    return ParagraphStyle(name, parent=parent or ss["Normal"], **kw)

BODY = S("body", fontName="Helvetica", fontSize=9.6, leading=15, textColor=INK,
         spaceAfter=7, alignment=TA_LEFT)
LEAD = S("lead", parent=BODY, fontSize=10.6, leading=16.5, textColor=MUTED, spaceAfter=12)
H1 = S("h1", fontName="Helvetica-Bold", fontSize=19, leading=24, textColor=NAVY,
       spaceBefore=20, spaceAfter=4)
H2 = S("h2", fontName="Helvetica-Bold", fontSize=14, leading=19, textColor=NAVY,
       spaceBefore=17, spaceAfter=6)
H3 = S("h3", fontName="Helvetica-Bold", fontSize=11, leading=15, textColor=GOLD,
       spaceBefore=11, spaceAfter=4)
BULLET = S("bullet", parent=BODY, leftIndent=13, bulletIndent=3, spaceAfter=3.5)
CALLOUT = S("callout", parent=BODY, leftIndent=9, rightIndent=9, spaceBefore=3, spaceAfter=3)
TCELL = S("tcell", parent=BODY, fontSize=8.8, leading=12.5, spaceAfter=0)
THEAD = S("thead", parent=TCELL, fontName="Helvetica-Bold", textColor=colors.white)


def inline(t: str) -> str:
    """Markdown inline spans -> reportlab markup. Escape first, then re-introduce tags."""
    t = t.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    t = re.sub(r"`([^`]+)`", r'<font face="Courier" size="8.6" color="#8a5c1a">\1</font>', t)
    t = re.sub(r"\*\*([^*]+)\*\*", r"<b>\1</b>", t)
    t = re.sub(r"(?<!\*)\*([^*\n]+)\*(?!\*)", r"<i>\1</i>", t)
    # [text](link) -> text (this is a printed document; bare URLs add noise)
    t = re.sub(r"\[([^\]]+)\]\(([^)]+)\)", r"\1", t)
    t = t.replace("→", "-&gt;").replace("⚠", "!")
    return t


def build_table(rows):
    header, body = rows[0], rows[1:]
    data = [[Paragraph(inline(c), THEAD) for c in header]]
    for r in body:
        data.append([Paragraph(inline(c), TCELL) for c in r])

    ncols = len(header)
    avail = 168 * mm
    widths = [avail * 0.30] + [(avail * 0.70) / (ncols - 1)] * (ncols - 1) if ncols > 1 else [avail]

    t = Table(data, colWidths=widths, repeatRows=1, hAlign="LEFT")
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), NAVY),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING", (0, 0), (-1, -1), 7),
        ("RIGHTPADDING", (0, 0), (-1, -1), 7),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, PANEL]),
        ("LINEBELOW", (0, 0), (-1, -1), 0.4, RULE),
        ("BOX", (0, 0), (-1, -1), 0.5, RULE),
    ]))
    return t


def parse(md: str):
    flow = []
    lines = md.split("\n")
    i = 0
    skipping_toc = False

    while i < len(lines):
        line = lines[i].rstrip()

        # Table
        if line.startswith("|") and i + 1 < len(lines) and set(lines[i+1].replace("|", "").strip()) <= set("-: "):
            rows = []
            while i < len(lines) and lines[i].strip().startswith("|"):
                cells = [c.strip() for c in lines[i].strip().strip("|").split("|")]
                if not set("".join(cells)) <= set("-: "):
                    rows.append(cells)
                i += 1
            if rows:
                flow.append(Spacer(1, 5))
                flow.append(build_table(rows))
                flow.append(Spacer(1, 9))
            continue

        # Headings
        if line.startswith("### "):
            flow.append(Paragraph(inline(line[4:]), H3)); i += 1; continue
        if line.startswith("## "):
            txt = line[3:]
            if txt.strip().lower() == "contents":
                skipping_toc = True; i += 1; continue
            skipping_toc = False
            flow.append(Paragraph(inline(txt), H2)); i += 1; continue
        if line.startswith("# "):
            flow.append(Paragraph(inline(line[2:]), H1)); i += 1; continue

        if skipping_toc:
            i += 1; continue

        # Horizontal rule
        if line.strip() in ("---", "***", "___"):
            flow.append(Spacer(1, 7))
            flow.append(HRFlowable(width="100%", thickness=0.6, color=RULE))
            flow.append(Spacer(1, 7))
            i += 1; continue

        # Bullets
        if re.match(r"^\s*[-*]\s+", line):
            while i < len(lines) and re.match(r"^\s*[-*]\s+", lines[i].rstrip()):
                txt = re.sub(r"^\s*[-*]\s+", "", lines[i].rstrip())
                flow.append(Paragraph(inline(txt), BULLET, bulletText="•"))
                i += 1
            flow.append(Spacer(1, 5))
            continue

        # Numbered list
        if re.match(r"^\s*\d+\.\s+", line):
            while i < len(lines) and re.match(r"^\s*\d+\.\s+", lines[i].rstrip()):
                m = re.match(r"^\s*(\d+)\.\s+(.*)", lines[i].rstrip())
                flow.append(Paragraph(inline(m.group(2)), BULLET, bulletText=f"{m.group(1)}."))
                i += 1
            flow.append(Spacer(1, 5))
            continue

        # Blank
        if not line.strip():
            i += 1; continue

        # Paragraph — gather until blank
        buf = []
        while i < len(lines) and lines[i].strip() and not re.match(r"^(#{1,3}\s|\s*[-*]\s|\s*\d+\.\s|\|)", lines[i]) \
                and lines[i].strip() not in ("---", "***", "___"):
            buf.append(lines[i].strip()); i += 1
        text = " ".join(buf)

        # Warning/emphasis paragraphs get a tinted panel
        if text.startswith("!") or text.startswith("⚠") or text.startswith("**"):
            p = Paragraph(inline(text), CALLOUT)
            box = Table([[p]], colWidths=[168 * mm], hAlign="LEFT")
            box.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, -1), PANEL),
                ("LINEBEFORE", (0, 0), (0, -1), 2.2, GOLD),
                ("TOPPADDING", (0, 0), (-1, -1), 7),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
                ("LEFTPADDING", (0, 0), (-1, -1), 9),
                ("RIGHTPADDING", (0, 0), (-1, -1), 9),
            ]))
            flow.append(Spacer(1, 4)); flow.append(box); flow.append(Spacer(1, 8))
        else:
            flow.append(Paragraph(inline(text), BODY))

    return flow


def cover():
    el = [Spacer(1, 55 * mm)]
    if os.path.exists(LOGO):
        el.append(Image(LOGO, width=52 * mm, height=23.7 * mm, hAlign="LEFT"))
        el.append(Spacer(1, 16 * mm))
    el.append(Paragraph(
        '<font size="27" color="#0a1420"><b>Staff User Guide</b></font>',
        S("ct", leading=32)))
    el.append(Spacer(1, 5 * mm))
    el.append(Paragraph(
        '<font size="13" color="#a5813c">Internal Management System</font>',
        S("cs", leading=17)))
    el.append(Spacer(1, 9 * mm))
    el.append(HRFlowable(width="52%", thickness=1.4, color=GOLD, hAlign="LEFT"))
    el.append(Spacer(1, 9 * mm))
    el.append(Paragraph(
        '<font size="10.5" color="#5a5a5a">Kwai PM Kwai Travel and Tours Limited<br/>'
        'Sinza Kijiweni, Dar es Salaam, Tanzania</font>', S("cf", leading=16)))
    el.append(Spacer(1, 30 * mm))
    el.append(Paragraph(
        '<font size="8.5" color="#8a8a8a">This guide is for internal use by staff of '
        'Kwai PM Kwai Travel and Tours Limited.<br/>Version 1.0 &#183; September 2026</font>',
        S("cn", leading=13)))
    el.append(PageBreak())
    return el


def decorate(canv, doc):
    canv.saveState()
    if doc.page > 1:
        canv.setFont("Helvetica", 7.4)
        canv.setFillColor(colors.HexColor("#9a9a9a"))
        canv.drawString(21 * mm, 12 * mm, "Kwai PM Kwai Travel and Tours Limited - Staff User Guide")
        canv.drawRightString(A4[0] - 21 * mm, 12 * mm, str(doc.page))
        canv.setStrokeColor(RULE)
        canv.setLineWidth(0.4)
        canv.line(21 * mm, 15.5 * mm, A4[0] - 21 * mm, 15.5 * mm)
    canv.restoreState()


md = open(SRC, encoding="utf-8").read()
doc = SimpleDocTemplate(
    OUT, pagesize=A4,
    leftMargin=21 * mm, rightMargin=21 * mm,
    topMargin=20 * mm, bottomMargin=22 * mm,
    title="Staff User Guide - Kwai PM Kwai Travel and Tours Limited",
    author="Kwai PM Kwai Travel and Tours Limited",
    subject="Internal Management System - Staff User Guide",
)
doc.build(cover() + parse(md), onFirstPage=decorate, onLaterPages=decorate)
print("written:", OUT)
