package com.example.SelfOrderingRestaurant.Service;

import com.example.SelfOrderingRestaurant.Entity.Order;
import com.example.SelfOrderingRestaurant.Entity.OrderItem;
import com.example.SelfOrderingRestaurant.Repository.OrderItemRepository;
import com.example.SelfOrderingRestaurant.Repository.OrderRepository;
import com.lowagie.text.*;
import com.lowagie.text.pdf.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.List;
import lombok.AllArgsConstructor;

@AllArgsConstructor
@Service
public class ReceiptService {
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

            // Add footer
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

        document.add(new Paragraph(" ")); // Add spacing

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
        PdfPTable table = new PdfPTable(4);
        table.setWidthPercentage(100);
        table.setWidths(new float[] {2, 1, 1, 1});

        // Add table headers
        Font headerFont = new Font(Font.HELVETICA, 12, Font.BOLD);
        table.addCell(new PdfPCell(new Phrase("Item", headerFont)));
        table.addCell(new PdfPCell(new Phrase("Price", headerFont)));
        table.addCell(new PdfPCell(new Phrase("Qty", headerFont)));
        table.addCell(new PdfPCell(new Phrase("Subtotal", headerFont)));

        // Add items
        Font contentFont = new Font(Font.HELVETICA, 11);
        for (OrderItem item : orderItems) {
            table.addCell(new Phrase(item.getDish().getName(), contentFont));
            table.addCell(new Phrase(item.getUnitPrice().toString(), contentFont));
            table.addCell(new Phrase(item.getQuantity().toString(), contentFont));

            BigDecimal subtotal = item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity()));
            table.addCell(new Phrase(subtotal.toString(), contentFont));
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
        totalsTable.addCell(new Phrase(order.getTotalAmount().toString(), normalFont));

        // Discount (if any)
        if (order.getDiscount() != null && order.getDiscount().compareTo(BigDecimal.ZERO) > 0) {
            totalsTable.addCell(new Phrase("Discount:", normalFont));
            totalsTable.addCell(new Phrase(order.getDiscount().toString(), normalFont));
        }

        // Total
        BigDecimal totalAfterDiscount = order.getTotalAmount();
        if (order.getDiscount() != null) {
            totalAfterDiscount = totalAfterDiscount.subtract(order.getDiscount());
        }

        totalsTable.addCell(new Phrase("Total:", boldFont));
        totalsTable.addCell(new Phrase(totalAfterDiscount.toString(), boldFont));

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