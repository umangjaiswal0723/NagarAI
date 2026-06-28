from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from datetime import datetime
import os

os.makedirs("rti_pdfs", exist_ok=True)


def generate_rti_pdf(issue: dict, rti_data: dict) -> str:
    filename = f"rti_pdfs/RTI_Issue_{issue['id']}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
    doc = SimpleDocTemplate(
        filename,
        pagesize=A4,
        rightMargin=2.5*cm,
        leftMargin=2.5*cm,
        topMargin=2.5*cm,
        bottomMargin=2.5*cm
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "Title", parent=styles["Heading1"],
        fontSize=16, alignment=TA_CENTER, spaceAfter=6,
        textColor=colors.HexColor("#1a1a2e")
    )
    subtitle_style = ParagraphStyle(
        "Subtitle", parent=styles["Normal"],
        fontSize=11, alignment=TA_CENTER, spaceAfter=4,
        textColor=colors.HexColor("#444444")
    )
    heading_style = ParagraphStyle(
        "Heading", parent=styles["Heading2"],
        fontSize=12, spaceBefore=14, spaceAfter=4,
        textColor=colors.HexColor("#1a1a2e")
    )
    body_style = ParagraphStyle(
        "Body", parent=styles["Normal"],
        fontSize=10.5, leading=16, spaceAfter=8,
        textColor=colors.HexColor("#222222")
    )
    bold_style = ParagraphStyle(
        "Bold", parent=body_style,
        fontName="Helvetica-Bold"
    )

    story = []

    # Header
    story.append(Paragraph("APPLICATION UNDER RIGHT TO INFORMATION ACT, 2005", title_style))
    story.append(Paragraph("(Section 6(1) RTI Act 2005)", subtitle_style))
    story.append(Spacer(1, 0.3*cm))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#1a1a2e")))
    story.append(Spacer(1, 0.4*cm))

    # To
    story.append(Paragraph("To,", body_style))
    story.append(Paragraph(f"<b>The Public Information Officer</b>", body_style))
    story.append(Paragraph(f"{rti_data.get('authority', 'The Municipal Corporation')}", body_style))
    story.append(Spacer(1, 0.3*cm))

    # Date
    story.append(Paragraph(f"Date: {datetime.now().strftime('%d %B %Y')}", body_style))
    story.append(Spacer(1, 0.3*cm))

    # Subject
    issue_title = issue["title"]
    subject = rti_data.get("subject", f"RTI regarding unresolved civic issue - {issue_title}")
    story.append(Paragraph(
        f"<b>Subject:</b> {subject}",
        body_style
    ))
    
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#cccccc")))
    story.append(Spacer(1, 0.3*cm))

    # Applicant details
    story.append(Paragraph("APPLICANT DETAILS", heading_style))
    story.append(Paragraph(f"Name: <b>{issue.get('reporter_name', 'Citizen')}</b>", body_style))
    story.append(Paragraph("Address: As per complaint filed on NagarAI platform", body_style))
    story.append(Spacer(1, 0.2*cm))

    # Issue details
    story.append(Paragraph("ISSUE DETAILS", heading_style))
    story.append(Paragraph(f"Issue Title: <b>{issue['title']}</b>", body_style))
    story.append(Paragraph(f"Location: {issue['address']}", body_style))
    story.append(Paragraph(f"Date Reported: {issue['created_at']}", body_style))
    story.append(Paragraph(f"Issue Type: {issue['issue_type'].replace('_', ' ').title()}", body_style))
    story.append(Paragraph(f"Estimated Economic Loss: <b>₹{issue['economic_loss']:,.0f} per day</b>", body_style))
    story.append(Spacer(1, 0.2*cm))

    # RTI body
    story.append(Paragraph("INFORMATION SOUGHT", heading_style))
    body_text = rti_data.get("body", "Please provide information regarding the above mentioned issue.")
    for line in body_text.split("\n"):
        if line.strip():
            story.append(Paragraph(line.strip(), body_style))

    story.append(Spacer(1, 0.3*cm))

    # Fee note
    fee_note = rti_data.get("fee_note", "RTI application fee of ₹10 is attached as prescribed.")
    story.append(Paragraph(f"<i>{fee_note}</i>", body_style))
    story.append(Spacer(1, 0.5*cm))

    # Legal note
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#cccccc")))
    story.append(Spacer(1, 0.2*cm))
    story.append(Paragraph(
        "This application is filed under Section 6(1) of the Right to Information Act, 2005. "
        "The Public Information Officer is requested to provide the information within <b>30 days</b> "
        "as mandated under Section 7(1) of the RTI Act.",
        body_style
    ))
    story.append(Spacer(1, 0.5*cm))
    story.append(Paragraph("Yours faithfully,", body_style))
    story.append(Spacer(1, 1*cm))
    story.append(Paragraph(f"<b>{issue.get('reporter_name', 'Citizen')}</b>", body_style))
    story.append(Paragraph(f"Filed via NagarAI on {datetime.now().strftime('%d %B %Y')}", body_style))

    # Footer note
    story.append(Spacer(1, 0.5*cm))
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#cccccc")))
    story.append(Spacer(1, 0.2*cm))
    story.append(Paragraph(
        "<i>Generated by NagarAI — The City's Autonomous Nervous System. "
        "This document was auto-generated after 14 days of no resolution.</i>",
        ParagraphStyle("Footer", parent=body_style, fontSize=9, textColor=colors.HexColor("#888888"))
    ))

    doc.build(story)
    return filename
