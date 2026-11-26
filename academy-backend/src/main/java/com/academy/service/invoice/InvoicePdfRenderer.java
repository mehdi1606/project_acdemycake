package com.academy.service.invoice;

import com.academy.config.InvoiceSettings;
import com.academy.entity.Invoice;
import com.itextpdf.io.font.PdfEncodings;
import com.itextpdf.io.image.ImageDataFactory;
import com.itextpdf.kernel.colors.Color;
import com.itextpdf.kernel.colors.DeviceRgb;
import com.itextpdf.kernel.font.PdfFont;
import com.itextpdf.kernel.font.PdfFontFactory;
import com.itextpdf.kernel.geom.PageSize;
import com.itextpdf.kernel.geom.Rectangle;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfDocumentInfo;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.kernel.pdf.canvas.PdfCanvas;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.borders.Border;
import com.itextpdf.layout.borders.SolidBorder;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.Image;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.element.Text;
import com.itextpdf.layout.properties.HorizontalAlignment;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import com.itextpdf.layout.properties.VerticalAlignment;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

/**
 * Renders an {@link Invoice} as an A4 PDF: white page, burgundy headings, champagne
 * gold hairlines, the gold Saralöwe crest. French with short English sub-labels.
 * Uses only the fonts already bundled for certificates (Cinzel, Lato, Great Vibes);
 * no Arabic is printed (iText 7 cannot shape it without add-ons), so an Arabic-only
 * buyer name is replaced by the buyer's email or phone.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class InvoicePdfRenderer {

    private static final DeviceRgb BURGUNDY = new DeviceRgb(0x65, 0x1C, 0x32);
    private static final DeviceRgb GOLD = new DeviceRgb(0xC5, 0x91, 0x2C);
    private static final DeviceRgb INK = new DeviceRgb(0x2B, 0x22, 0x25);
    private static final DeviceRgb MUTED = new DeviceRgb(0x8A, 0x7F, 0x82);
    private static final DeviceRgb CREAM = new DeviceRgb(0xFB, 0xF7, 0xF0);

    private static final DateTimeFormatter DATE = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private final InvoiceSettings settings;

    private record Fonts(PdfFont title, PdfFont body, PdfFont italic, PdfFont script) {}

    public byte[] render(Invoice inv) {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            PdfDocument pdf = new PdfDocument(new PdfWriter(out));
            PdfDocumentInfo info = pdf.getDocumentInfo();
            info.setTitle("Facture " + inv.getInvoiceNumber());
            info.setAuthor(settings.getSellerName());
            info.setCreator(settings.getSellerName());

            Document doc = new Document(pdf, PageSize.A4);
            doc.setMargins(46, 56, 64, 56);
            Fonts f = loadFonts();

            header(doc, inv, f);
            parties(doc, inv, f);
            itemTable(doc, inv, f);
            totals(doc, inv, f);
            payment(doc, inv, f);
            footer(pdf, f);

            doc.close();
            return out.toByteArray();
        } catch (Exception e) {
            throw new IllegalStateException("Could not render invoice " + inv.getInvoiceNumber(), e);
        }
    }

    // ── Sections ─────────────────────────────────────────────────────────────

    private void header(Document doc, Invoice inv, Fonts f) {
        Table t = new Table(UnitValue.createPercentArray(new float[]{50, 50})).useAllAvailableWidth();

        Cell brand = plain().setVerticalAlignment(VerticalAlignment.MIDDLE);
        Image logo = logo();
        if (logo != null) {
            brand.add(logo.scaleToFit(80, 75).setHorizontalAlignment(HorizontalAlignment.LEFT));
        } else {
            brand.add(new Paragraph(settings.getSellerName()).setFont(f.title()).setFontSize(18).setFontColor(BURGUNDY));
        }
        t.addCell(brand);

        Cell title = plain().setTextAlignment(TextAlignment.RIGHT).setVerticalAlignment(VerticalAlignment.MIDDLE);
        title.add(new Paragraph("FACTURE").setFont(f.title()).setFontSize(30).setFontColor(BURGUNDY)
                .setCharacterSpacing(3).setMargin(0).setMultipliedLeading(1f));
        title.add(new Paragraph("INVOICE").setFont(f.body()).setFontSize(8.5f).setFontColor(GOLD)
                .setCharacterSpacing(4.5f).setMarginTop(2).setMarginBottom(8));
        title.add(labelValue("N°", "No.", inv.getInvoiceNumber(), f, TextAlignment.RIGHT));
        title.add(labelValue("Date", "Date", inv.getIssuedAt().format(DATE), f, TextAlignment.RIGHT));
        t.addCell(title);

        doc.add(t);
        doc.add(hairline(0.8f).setMarginTop(12).setMarginBottom(14));
    }

    private void parties(Document doc, Invoice inv, Fonts f) {
        Table t = new Table(UnitValue.createPercentArray(new float[]{50, 50})).useAllAvailableWidth();

        Cell seller = plain().setPaddingRight(18);
        seller.add(sectionLabel("Vendeur", "Seller", f));
        seller.add(strong(settings.getSellerName(), f));
        for (String line : splitLines(settings.getSellerAddress())) seller.add(line(line, f));
        addIdentifiers(seller, f, "ICE", settings.getSellerIce());
        addIdentifiers(seller, f, "IF", settings.getSellerIf(), "RC", settings.getSellerRc());
        String contact = String.join("  ·  ", java.util.stream.Stream.of(settings.getSellerEmail(), settings.getSellerPhone())
                .filter(v -> !v.isEmpty()).toList());
        if (!contact.isEmpty()) seller.add(line(contact, f));
        t.addCell(seller);

        Cell buyer = plain().setPaddingLeft(18).setBorderLeft(new SolidBorder(GOLD, 0.5f));
        buyer.add(sectionLabel("Client", "Bill to", f));
        List<String> lines = InvoiceMath.buyerLines(inv.getBuyerName(), inv.getBuyerEmail(), inv.getBuyerPhone());
        for (int i = 0; i < lines.size(); i++) buyer.add(i == 0 ? strong(lines.get(i), f) : line(lines.get(i), f));
        t.addCell(buyer);

        doc.add(t);
    }

    private void itemTable(Document doc, Invoice inv, Fonts f) {
        Table t = new Table(UnitValue.createPercentArray(new float[]{52, 10, 19, 19}))
                .useAllAvailableWidth().setMarginTop(20);

        t.addHeaderCell(headCell("Désignation", "Item", TextAlignment.LEFT, f));
        t.addHeaderCell(headCell("Qté", "Qty", TextAlignment.CENTER, f));
        t.addHeaderCell(headCell("Prix unitaire", "Unit price", TextAlignment.RIGHT, f));
        t.addHeaderCell(headCell("Total", "Total", TextAlignment.RIGHT, f));

        String unit = InvoiceMath.money(inv.getAmountTtc(), inv.getCurrency());
        t.addCell(bodyCell(inv.getItemDescription(), TextAlignment.LEFT, f));
        t.addCell(bodyCell("1", TextAlignment.CENTER, f));
        t.addCell(bodyCell(unit, TextAlignment.RIGHT, f));
        t.addCell(bodyCell(unit, TextAlignment.RIGHT, f));

        doc.add(t);
        if (inv.getVatRate() != null && inv.getVatRate().signum() > 0) {
            doc.add(new Paragraph("Prix TTC / Prices include VAT").setFont(f.italic()).setFontSize(7.5f)
                    .setFontColor(MUTED).setMarginTop(4));
        }
    }

    /** Totals on the right; the thank-you line sits in the space to their left. */
    private void totals(Document doc, Invoice inv, Fonts f) {
        Table t = new Table(UnitValue.createPercentArray(new float[]{30, 22}))
                .setWidth(UnitValue.createPercentValue(48));

        boolean vat = inv.getVatRate() != null && inv.getVatRate().signum() > 0;
        if (vat) {
            totalRow(t, "Total HT", "Subtotal excl. VAT", InvoiceMath.money(inv.getAmountHt(), inv.getCurrency()), f, false);
            totalRow(t, "TVA " + InvoiceMath.percent(inv.getVatRate()), "VAT",
                    InvoiceMath.money(inv.getVatAmount(), inv.getCurrency()), f, false);
            totalRow(t, "Total TTC", "Total incl. VAT", InvoiceMath.money(inv.getAmountTtc(), inv.getCurrency()), f, true);
        } else {
            totalRow(t, "Total payé", "Total paid", InvoiceMath.money(inv.getAmountTtc(), inv.getCurrency()), f, true);
        }

        Table row = new Table(UnitValue.createPercentArray(new float[]{52, 48})).useAllAvailableWidth().setMarginTop(10);
        Cell thanks = plain().setVerticalAlignment(VerticalAlignment.BOTTOM).setPaddingRight(16).setPaddingBottom(4)
                .add(new Paragraph("Merci pour votre confiance").setFont(f.script()).setFontSize(22)
                        .setFontColor(BURGUNDY).setMargin(0).setMultipliedLeading(1f))
                .add(new Paragraph("Thank you for your trust").setFont(f.italic()).setFontSize(8.5f)
                        .setFontColor(GOLD).setCharacterSpacing(1).setMargin(0).setMarginTop(2));
        row.addCell(thanks);
        row.addCell(plain().add(t.useAllAvailableWidth()));
        doc.add(row);
    }

    private void payment(Document doc, Invoice inv, Fonts f) {
        Table t = new Table(UnitValue.createPercentArray(new float[]{100})).useAllAvailableWidth().setMarginTop(14);
        Cell c = new Cell().setBorder(Border.NO_BORDER).setBackgroundColor(CREAM)
                .setBorderLeft(new SolidBorder(GOLD, 1.5f)).setPadding(10).setPaddingLeft(14);
        c.add(sectionLabel("Paiement", "Payment", f));

        Table rows = new Table(UnitValue.createPercentArray(new float[]{34, 66})).useAllAvailableWidth();
        payRow(rows, "Statut", "Status", "Payé / Paid", f);
        payRow(rows, "Date de paiement", "Payment date", inv.getIssuedAt().format(DATE), f);
        payRow(rows, "Moyen de paiement", "Method", inv.getPaymentMethod(),
                inv.getManualBookingId() != null ? "Direct payment (bank transfer / cash)" : null, f);
        payRow(rows, "Référence commande", "Order ref.", inv.getOrderReference(), f);
        payRow(rows, "Autorisation", "Auth. code", inv.getPaymentReference(), f);
        c.add(rows);
        t.addCell(c);
        doc.add(t);
    }

    /** Hairline and seller legal line at the bottom of every page. */
    private void footer(PdfDocument pdf, Fonts f) {
        List<String> parts = new ArrayList<>();
        parts.add(settings.getSellerName());
        if (!settings.getSellerIce().isEmpty()) parts.add("ICE " + settings.getSellerIce());
        if (!settings.getSellerIf().isEmpty()) parts.add("IF " + settings.getSellerIf());
        if (!settings.getSellerRc().isEmpty()) parts.add("RC " + settings.getSellerRc());
        if (!settings.getSellerEmail().isEmpty()) parts.add(settings.getSellerEmail());
        if (!settings.getSellerPhone().isEmpty()) parts.add(settings.getSellerPhone());
        String text = String.join("  ·  ", parts);

        for (int i = 1; i <= pdf.getNumberOfPages(); i++) {
            Rectangle page = pdf.getPage(i).getPageSize();
            PdfCanvas canvas = new PdfCanvas(pdf.getPage(i));
            float y = 46;
            canvas.saveState().setStrokeColor(GOLD).setLineWidth(0.5f)
                    .moveTo(56, y).lineTo(page.getWidth() - 56, y).stroke().restoreState();
            new com.itextpdf.layout.Canvas(canvas, page)
                    .showTextAligned(new Paragraph(text).setFont(f.body()).setFontSize(7).setFontColor(MUTED)
                                    .setCharacterSpacing(0.4f),
                            page.getWidth() / 2, y - 16, TextAlignment.CENTER)
                    .close();
        }
    }

    // ── Building blocks ──────────────────────────────────────────────────────

    private static Cell plain() {
        return new Cell().setBorder(Border.NO_BORDER).setPadding(0);
    }

    private static Table hairline(float width) {
        Table t = new Table(1).useAllAvailableWidth();
        t.addCell(new Cell().setBorder(Border.NO_BORDER).setBorderTop(new SolidBorder(GOLD, width))
                .setHeight(0).setPadding(0));
        return t;
    }

    private static Paragraph sectionLabel(String fr, String en, Fonts f) {
        return new Paragraph()
                .add(new Text(fr.toUpperCase()).setFont(f.title()).setFontSize(9).setFontColor(BURGUNDY))
                .add(new Text("   " + en).setFont(f.italic()).setFontSize(7.5f).setFontColor(GOLD))
                .setCharacterSpacing(0.8f).setMarginTop(0).setMarginBottom(7);
    }

    private static Paragraph labelValue(String fr, String en, String value, Fonts f, TextAlignment align) {
        return new Paragraph()
                .add(new Text(fr + " ").setFont(f.body()).setFontSize(8.5f).setFontColor(MUTED))
                .add(new Text("/ " + en + "   ").setFont(f.italic()).setFontSize(7.5f).setFontColor(GOLD))
                .add(new Text(value).setFont(f.body()).setFontSize(10).setFontColor(INK))
                .setTextAlignment(align).setMargin(0).setMultipliedLeading(1.35f);
    }

    private static Paragraph strong(String text, Fonts f) {
        return new Paragraph(text).setFont(f.body()).setFontSize(11).setFontColor(INK).setMargin(0)
                .setMarginBottom(2);
    }

    private static Paragraph line(String text, Fonts f) {
        return new Paragraph(text).setFont(f.body()).setFontSize(9).setFontColor(MUTED).setMargin(0)
                .setMultipliedLeading(1.3f);
    }

    /** One line of label/value pairs (e.g. "IF 123  RC 456"); empty values are skipped. */
    private static void addIdentifiers(Cell cell, Fonts f, String... labelValues) {
        Paragraph p = new Paragraph().setMargin(0).setMultipliedLeading(1.3f);
        boolean any = false;
        for (int i = 0; i + 1 < labelValues.length; i += 2) {
            String value = labelValues[i + 1];
            if (value == null || value.isEmpty()) continue;
            if (any) p.add(new Text("     "));
            p.add(new Text(labelValues[i] + "  ").setFont(f.body()).setFontSize(8).setFontColor(GOLD));
            p.add(new Text(value).setFont(f.body()).setFontSize(9).setFontColor(MUTED));
            any = true;
        }
        if (any) cell.add(p);
    }

    private static Cell headCell(String fr, String en, TextAlignment align, Fonts f) {
        return new Cell().setBorder(Border.NO_BORDER)
                .setBorderTop(new SolidBorder(GOLD, 0.8f)).setBorderBottom(new SolidBorder(GOLD, 0.8f))
                .setPaddingTop(7).setPaddingBottom(7).setPaddingLeft(4).setPaddingRight(4)
                .setTextAlignment(align)
                .add(new Paragraph(fr.toUpperCase()).setFont(f.title()).setFontSize(8.5f).setFontColor(BURGUNDY)
                        .setCharacterSpacing(0.6f).setMargin(0))
                .add(new Paragraph(en).setFont(f.italic()).setFontSize(7).setFontColor(GOLD).setMargin(0));
    }

    private static Cell bodyCell(String text, TextAlignment align, Fonts f) {
        return new Cell().setBorder(Border.NO_BORDER).setBorderBottom(new SolidBorder(GOLD, 0.4f))
                .setPaddingTop(10).setPaddingBottom(10).setPaddingLeft(4).setPaddingRight(4)
                .setTextAlignment(align).setVerticalAlignment(VerticalAlignment.MIDDLE)
                .add(new Paragraph(text == null ? "" : text).setFont(f.body()).setFontSize(10)
                        .setFontColor(INK).setMargin(0));
    }

    private static void totalRow(Table t, String fr, String en, String amount, Fonts f, boolean grand) {
        Color color = grand ? BURGUNDY : INK;
        SolidBorder top = grand ? new SolidBorder(GOLD, 0.8f) : null;
        Cell label = new Cell().setBorder(Border.NO_BORDER).setPaddingTop(grand ? 8 : 4).setPaddingBottom(4)
                .setPaddingLeft(0)
                .add(new Paragraph()
                        .add(new Text(grand ? fr.toUpperCase() : fr).setFont(grand ? f.title() : f.body())
                                .setFontSize(grand ? 10 : 9.5f).setFontColor(color))
                        .add(new Text("\n" + en).setFont(f.italic()).setFontSize(7).setFontColor(GOLD))
                        .setMargin(0).setMultipliedLeading(1.1f));
        Cell value = new Cell().setBorder(Border.NO_BORDER).setPaddingTop(grand ? 8 : 4).setPaddingBottom(4)
                .setPaddingRight(4).setTextAlignment(TextAlignment.RIGHT).setVerticalAlignment(VerticalAlignment.MIDDLE)
                .add(new Paragraph(amount).setFont(grand ? f.title() : f.body()).setFontSize(grand ? 13 : 10)
                        .setFontColor(color).setMargin(0));
        if (top != null) {
            label.setBorderTop(top);
            value.setBorderTop(top);
        }
        t.addCell(label);
        t.addCell(value);
    }

    private static void payRow(Table t, String fr, String en, String value, Fonts f) {
        payRow(t, fr, en, value, null, f);
    }

    /** A payment line; {@code valueEn} is an optional English sub-label under the value. */
    private static void payRow(Table t, String fr, String en, String value, String valueEn, Fonts f) {
        if (value == null || value.isBlank()) return;
        t.addCell(new Cell().setBorder(Border.NO_BORDER).setPadding(1f).setPaddingLeft(0)
                .add(new Paragraph()
                        .add(new Text(fr).setFont(f.body()).setFontSize(8.5f).setFontColor(MUTED))
                        .add(new Text(" / " + en).setFont(f.italic()).setFontSize(7).setFontColor(GOLD))
                        .setMargin(0)));
        t.addCell(new Cell().setBorder(Border.NO_BORDER).setPadding(1f)
                .add(new Paragraph()
                        .add(new Text(value).setFont(f.body()).setFontSize(9).setFontColor(INK))
                        .add(valueEn == null ? new Text("")
                                : new Text("  " + valueEn).setFont(f.italic()).setFontSize(7).setFontColor(GOLD))
                        .setMargin(0)));
    }

    private static List<String> splitLines(String text) {
        List<String> lines = new ArrayList<>();
        if (text == null || text.isBlank()) return lines;
        for (String l : text.replace("\\n", "\n").split("\\r?\\n|\\|")) {
            if (!l.isBlank()) lines.add(l.trim());
        }
        return lines;
    }

    // ── Resources ────────────────────────────────────────────────────────────

    private Fonts loadFonts() throws Exception {
        return new Fonts(
                loadFont("/fonts/Cinzel-Regular.ttf"),
                loadFont("/fonts/Lato-Regular.ttf"),
                loadFont("/fonts/Lato-Italic.ttf"),
                loadFont("/fonts/GreatVibes-Regular.ttf"));
    }

    private PdfFont loadFont(String classpathResource) throws Exception {
        try (InputStream is = getClass().getResourceAsStream(classpathResource)) {
            if (is == null) {
                log.warn("Font not found on classpath: {}, falling back to Helvetica", classpathResource);
                return PdfFontFactory.createFont();
            }
            return PdfFontFactory.createFont(is.readAllBytes(), PdfEncodings.IDENTITY_H,
                    PdfFontFactory.EmbeddingStrategy.FORCE_EMBEDDED);
        }
    }

    private Image logo() {
        try (InputStream is = getClass().getResourceAsStream("/invoice/logo-gold.png")) {
            if (is == null) return null;
            return new Image(ImageDataFactory.create(is.readAllBytes()));
        } catch (Exception e) {
            log.warn("Invoice logo could not be loaded: {}", e.getMessage());
            return null;
        }
    }
}
