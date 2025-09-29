package com.example.SelfOrderingRestaurant.Service;

import com.example.SelfOrderingRestaurant.Entity.Order;
import com.example.SelfOrderingRestaurant.Entity.OrderItem;
import com.example.SelfOrderingRestaurant.Repository.OrderItemRepository;
import com.example.SelfOrderingRestaurant.Repository.OrderRepository;
import com.lowagie.text.*;
import com.lowagie.text.pdf.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.List;
import lombok.AllArgsConstructor;

@AllArgsConstructor
@Service
public class  ReceiptService {
    private final Logger log = LoggerFactory.getLogger(ReceiptService.class);

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;

    /**
     * Generates a PDF receipt for the given order
     *
     * @param orderId The ID of the order to generate a receipt for
     * @return Byte array containing the PDF document
     * @throws Exception If there's an error during PDF generation
     */
    public byte[] generateReceiptPdf(Integer orderId) throws Exception {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found with ID: " + orderId));

        List<OrderItem> orderItems = orderItemRepository.findByOrder(order);

        // Create PDF document
        Document document = new Document(PageSize.A5);
        ByteArrayOutputStream out = new ByteArrayOutputStream();

        try {
            PdfWriter.getInstance(document, out);
            document.open();

            // Add header
            addHeader(document, order);

            // Add table information
            addTableInfo(document, order);

            // Add items table
            addItemsTable(document, orderItems);

            // Add total section
            addTotalSection(document, order);


            addFooter(document);

        } catch (Exception e) {
            log.error("Error generating PDF receipt", e);
            throw e;
        } finally {
            if (document.isOpen()) {
                document.close();
            }
        }

        return out.toByteArray();
    }

    private void addHeader(Document document, Order order) throws DocumentException {
        Font headerFont = new Font(Font.HELVETICA, 18, Font.BOLD);
        Font subHeaderFont = new Font(Font.HELVETICA, 12);

        Paragraph header = new Paragraph("RECEIPT", headerFont);
        header.setAlignment(Element.ALIGN_CENTER);
        document.add(header);

        Paragraph address = new Paragraph("450 Le Van Viet Street, Tang Nhon Phu A Ward, District 9", subHeaderFont);
        address.setAlignment(Element.ALIGN_CENTER);
        document.add(address);

        document.add(new Paragraph(" "));

        SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
        Paragraph dateTime = new Paragraph("Date: " + dateFormat.format(order.getOrderDate()), subHeaderFont);
        dateTime.setAlignment(Element.ALIGN_RIGHT);
        document.add(dateTime);

        Paragraph orderNumber = new Paragraph("Order #: " + order.getOrderId(), subHeaderFont);
        orderNumber.setAlignment(Element.ALIGN_RIGHT);
        document.add(orderNumber);

        document.add(new Paragraph(" ")); // Add spacing
    }

    private void addTableInfo(Document document, Order order) throws DocumentException {
        Font normalFont = new Font(Font.HELVETICA, 12);

        Paragraph tableInfo = new Paragraph("Table: " + order.getTables().getTableNumber(), normalFont);
        document.add(tableInfo);

        if (order.getCustomer() != null) {
            Paragraph customerInfo = new Paragraph("Customer: " + order.getCustomer().getFullname(), normalFont);
            document.add(customerInfo);
        }

        document.add(new Paragraph(" ")); // Add spacing
    }

    private void addItemsTable(Document document, List<OrderItem> orderItems) throws DocumentException {
        PdfPTable table = new PdfPTable(6); // 6 columns: No., Item, Price, Qty, Notes, Subtotal
        table.setWidthPercentage(100);
        table.setWidths(new float[] {0.5f, 2f, 1f, 0.8f, 1.5f, 1f}); // Adjusted column widths

        // Add table headers
        Font headerFont = new Font(Font.HELVETICA, 12, Font.BOLD);
        PdfPCell cell;

        cell = new PdfPCell(new Phrase("No.", headerFont));
        cell.setHorizontalAlignment(Element.ALIGN_CENTER);
        cell.setPadding(5);
        table.addCell(cell);

        cell = new PdfPCell(new Phrase("Item", headerFont));
        cell.setHorizontalAlignment(Element.ALIGN_LEFT);
        cell.setPadding(5);
        table.addCell(cell);

        cell = new PdfPCell(new Phrase("Price", headerFont));
        cell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        cell.setPadding(5);
        table.addCell(cell);

        cell = new PdfPCell(new Phrase("Qty", headerFont));
        cell.setHorizontalAlignment(Element.ALIGN_CENTER);
        cell.setPadding(5);
        table.addCell(cell);

        cell = new PdfPCell(new Phrase("Notes", headerFont));
        cell.setHorizontalAlignment(Element.ALIGN_LEFT);
        cell.setPadding(5);
        table.addCell(cell);

        cell = new PdfPCell(new Phrase("Subtotal", headerFont));
        cell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        cell.setPadding(5);
        table.addCell(cell);

        // Add items
        Font contentFont = new Font(Font.HELVETICA, 11);
        int index = 1;
        for (OrderItem item : orderItems) {
            // STT
            cell = new PdfPCell(new Phrase(String.valueOf(index++), contentFont));
            cell.setHorizontalAlignment(Element.ALIGN_CENTER);
            cell.setPadding(5);
            table.addCell(cell);

            // Item name
            cell = new PdfPCell(new Phrase(item.getDish().getName(), contentFont));
            cell.setHorizontalAlignment(Element.ALIGN_LEFT);
            cell.setPadding(5);
            table.addCell(cell);

            // Unit price
            cell = new PdfPCell(new Phrase(String.format("%.2f", item.getUnitPrice()), contentFont));
            cell.setHorizontalAlignment(Element.ALIGN_RIGHT);
            cell.setPadding(5);
            table.addCell(cell);

            // Quantity
            cell = new PdfPCell(new Phrase(item.getQuantity().toString(), contentFont));
            cell.setHorizontalAlignment(Element.ALIGN_CENTER);
            cell.setPadding(5);
            table.addCell(cell);

            // Notes
            String notes = item.getNotes() != null ? item.getNotes() : "";
            cell = new PdfPCell(new Phrase(notes, contentFont));
            cell.setHorizontalAlignment(Element.ALIGN_LEFT);
            cell.setPadding(5);
            table.addCell(cell);

            // Subtotal
            BigDecimal subtotal = item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity()));
            cell = new PdfPCell(new Phrase(String.format("%.2f", subtotal), contentFont));
            cell.setHorizontalAlignment(Element.ALIGN_RIGHT);
            cell.setPadding(5);
            table.addCell(cell);
        }

        document.add(table);
        document.add(new Paragraph(" ")); // Add spacing
    }

    private void addTotalSection(Document document, Order order) throws DocumentException {
        Font normalFont = new Font(Font.HELVETICA, 12);
        Font boldFont = new Font(Font.HELVETICA, 14, Font.BOLD);

        // Subtotal
        PdfPTable totalsTable = new PdfPTable(2);
        totalsTable.setWidthPercentage(60);
        totalsTable.setHorizontalAlignment(Element.ALIGN_RIGHT);
        totalsTable.getDefaultCell().setBorder(Rectangle.NO_BORDER);
        totalsTable.getDefaultCell().setHorizontalAlignment(Element.ALIGN_RIGHT);

        totalsTable.addCell(new Phrase("Subtotal:", normalFont));
        totalsTable.addCell(new Phrase(String.format("%.2f", order.getTotalAmount()), normalFont));

        // Discount (if any)
        if (order.getDiscount() != null && order.getDiscount().compareTo(BigDecimal.ZERO) > 0) {
            totalsTable.addCell(new Phrase("Discount:", normalFont));
            totalsTable.addCell(new Phrase(String.format("%.2f", order.getDiscount()), normalFont));
        }

        // Total
        BigDecimal totalAfterDiscount = order.getTotalAmount();
        if (order.getDiscount() != null) {
            totalAfterDiscount = totalAfterDiscount.subtract(order.getDiscount());
        }

        totalsTable.addCell(new Phrase("Total:", boldFont));
        totalsTable.addCell(new Phrase(String.format("%.2f", totalAfterDiscount), boldFont));

        document.add(totalsTable);
        document.add(new Paragraph(" ")); // Add spacing
    }

    private void addFooter(Document document) throws DocumentException {
        Font footerFont = new Font(Font.HELVETICA, 10, Font.ITALIC);

        Paragraph footer = new Paragraph("Thank you for your visit!", footerFont);
        footer.setAlignment(Element.ALIGN_CENTER);
        document.add(footer);
    }
}