package com.example.SelfOrderingRestaurant.Service;

import com.example.SelfOrderingRestaurant.Dto.Request.RevenueRequestDTO.RevenueExportDTO;
import com.example.SelfOrderingRestaurant.Dto.Response.RevenueResponseDTO.MonthlyRevenueDTO;
import com.example.SelfOrderingRestaurant.Dto.Response.RevenueResponseDTO.OverviewRevenueDTO;
import com.example.SelfOrderingRestaurant.Dto.Response.RevenueResponseDTO.RevenueDTO;
import com.example.SelfOrderingRestaurant.Dto.Response.RevenueResponseDTO.YearlyRevenueDTO;
import com.example.SelfOrderingRestaurant.Entity.Revenue;
import com.example.SelfOrderingRestaurant.Repository.RevenueRepository;
import com.itextpdf.text.BaseColor;
import com.lowagie.text.Font;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import com.lowagie.text.*;
import com.lowagie.text.pdf.*;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.Month;
import java.time.format.TextStyle;
import java.util.*;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
public class RevenueService {
    private final RevenueRepository revenueRepository;

    public List<RevenueDTO> getAllRevenues() {
        return revenueRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public OverviewRevenueDTO getRevenueOverview() {
        LocalDate today = LocalDate.now();
        LocalDate startDate = today.minusMonths(12);

        List<Revenue> revenueList = revenueRepository.findByDateBetweenOrderByDateDesc(startDate, today);

        OverviewRevenueDTO overviewDTO = new OverviewRevenueDTO();

        // Calculate totals
        BigDecimal totalRevenue = revenueList.stream()
                .map(Revenue::getTotalRevenue)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        int totalOrders = revenueList.stream()
                .mapToInt(Revenue::getTotalOrders)
                .sum();

        int totalCustomers = revenueList.stream()
                .mapToInt(Revenue::getTotalCustomers)
                .sum();

        BigDecimal averageOrderValue = totalOrders > 0
                ? totalRevenue.divide(new BigDecimal(totalOrders), 2, BigDecimal.ROUND_HALF_UP)
                : BigDecimal.ZERO;

        // Revenue by category
        BigDecimal totalFoodRevenue = revenueList.stream()
                .map(Revenue::getFoodRevenue)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalDrinkRevenue = revenueList.stream()
                .map(Revenue::getDrinkRevenue)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalOtherRevenue = revenueList.stream()
                .map(Revenue::getOtherRevenue)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Map<String, BigDecimal> revenueByCategory = new HashMap<>();
        revenueByCategory.put("Food", totalFoodRevenue);
        revenueByCategory.put("Drinks", totalDrinkRevenue);
        revenueByCategory.put("Other", totalOtherRevenue);

        // Monthly revenue (last 12 months)
        Map<String, BigDecimal> monthlyRevenue = new LinkedHashMap<>();
        for (int i = 11; i >= 0; i--) {
            LocalDate month = today.minusMonths(i);
            String monthName = month.getMonth().getDisplayName(TextStyle.SHORT, Locale.US) + " " + month.getYear();

            final int yearVal = month.getYear();
            final int monthVal = month.getMonthValue();

            BigDecimal monthRevenue = revenueList.stream()
                    .filter(r -> r.getDate().getYear() == yearVal && r.getDate().getMonthValue() == monthVal)
                    .map(Revenue::getTotalRevenue)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            monthlyRevenue.put(monthName, monthRevenue);
        }

        // Daily revenue (last 30 days)
        Map<String, BigDecimal> dailyRevenue = new LinkedHashMap<>();
        for (int i = 29; i >= 0; i--) {
            LocalDate day = today.minusDays(i);
            String dayStr = day.toString();

            final LocalDate dayVal = day;

            Optional<Revenue> dayRevenue = revenueList.stream()
                    .filter(r -> r.getDate().equals(dayVal))
                    .findFirst();

            dailyRevenue.put(dayStr, dayRevenue.map(Revenue::getTotalRevenue).orElse(BigDecimal.ZERO));
        }

        overviewDTO.setTotalRevenue(totalRevenue);
        overviewDTO.setTotalOrders(totalOrders);
        overviewDTO.setTotalCustomers(totalCustomers);
        overviewDTO.setRevenueByCategory(revenueByCategory);
        overviewDTO.setMonthlyRevenue(monthlyRevenue);
        overviewDTO.setDailyRevenue(dailyRevenue);
        overviewDTO.setAverageOrderValue(averageOrderValue);

        return overviewDTO;
    }

    public List<RevenueDTO> getDailyRevenue(LocalDate startDate, LocalDate endDate) {
        if (endDate == null) {
            endDate = LocalDate.now();
        }

        if (startDate == null) {
            startDate = endDate.minusDays(30);
        }

        return revenueRepository.findByDateBetweenOrderByDateDesc(startDate, endDate)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public MonthlyRevenueDTO getMonthlyRevenue(int year, int month) {
        List<Revenue> monthRevenues;
        try {
            monthRevenues = revenueRepository.findByYearAndMonth(year, month);
        } catch (Exception e) {
            System.err.println("Lỗi khi truy vấn revenueRepository.findByYearAndMonth: " + e.getMessage());
            return new MonthlyRevenueDTO(year, month, BigDecimal.ZERO, BigDecimal.ZERO,
                    BigDecimal.ZERO, 0, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO,
                    Collections.emptyList());
        }

        if (monthRevenues.isEmpty()) {
            return new MonthlyRevenueDTO(year, month, BigDecimal.ZERO, BigDecimal.ZERO,
                    BigDecimal.ZERO, 0, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO,
                    Collections.emptyList());
        }

        try {
            BigDecimal totalRevenue = monthRevenues.stream()
                    .map(revenue -> Objects.requireNonNullElse(revenue.getTotalRevenue(), BigDecimal.ZERO))
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal totalDiscount = monthRevenues.stream()
                    .map(revenue -> Objects.requireNonNullElse(revenue.getTotalDiscount(), BigDecimal.ZERO))
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal netRevenue = totalRevenue.subtract(totalDiscount);

            int totalOrders = monthRevenues.stream()
                    .mapToInt(revenue -> Objects.requireNonNullElse(revenue.getTotalOrders(), 0))
                    .sum();

            BigDecimal foodRevenue = monthRevenues.stream()
                    .map(revenue -> Objects.requireNonNullElse(revenue.getFoodRevenue(), BigDecimal.ZERO))
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal drinkRevenue = monthRevenues.stream()
                    .map(revenue -> Objects.requireNonNullElse(revenue.getDrinkRevenue(), BigDecimal.ZERO))
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal otherRevenue = monthRevenues.stream()
                    .map(revenue -> Objects.requireNonNullElse(revenue.getOtherRevenue(), BigDecimal.ZERO))
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            List<RevenueDTO> dailyRevenues = monthRevenues.stream()
                    .map(this::convertToDTO)
                    .collect(Collectors.toList());

            return new MonthlyRevenueDTO(
                    year, month, totalRevenue, totalDiscount, netRevenue, totalOrders,
                    foodRevenue, drinkRevenue, otherRevenue, dailyRevenues
            );
        } catch (Exception e) {
            System.err.println("Lỗi khi tính toán MonthlyRevenueDTO: " + e.getMessage());
            return new MonthlyRevenueDTO(year, month, BigDecimal.ZERO, BigDecimal.ZERO,
                    BigDecimal.ZERO, 0, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO,
                    Collections.emptyList());
        }
    }

    public YearlyRevenueDTO getYearlyRevenue(int year) {
        List<Revenue> yearRevenues = revenueRepository.findByYear(year);

        if (yearRevenues.isEmpty()) {
            return new YearlyRevenueDTO(year, BigDecimal.ZERO, BigDecimal.ZERO,
                    BigDecimal.ZERO, 0, new HashMap<>(), BigDecimal.ZERO,
                    BigDecimal.ZERO, BigDecimal.ZERO);
        }

        // Calculate yearly totals
        BigDecimal totalRevenue = yearRevenues.stream()
                .map(Revenue::getTotalRevenue)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalDiscount = yearRevenues.stream()
                .map(Revenue::getTotalDiscount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal netRevenue = totalRevenue.subtract(totalDiscount);

        int totalOrders = yearRevenues.stream()
                .mapToInt(Revenue::getTotalOrders)
                .sum();

        BigDecimal foodRevenue = yearRevenues.stream()
                .map(Revenue::getFoodRevenue)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal drinkRevenue = yearRevenues.stream()
                .map(Revenue::getDrinkRevenue)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal otherRevenue = yearRevenues.stream()
                .map(Revenue::getOtherRevenue)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Group by month
        Map<String, BigDecimal> monthlyRevenues = new LinkedHashMap<>();
        for (Month m : Month.values()) {
            final Month month = m;
            BigDecimal monthRevenue = yearRevenues.stream()
                    .filter(r -> r.getDate().getMonth() == month)
                    .map(Revenue::getTotalRevenue)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            monthlyRevenues.put(month.getDisplayName(TextStyle.FULL, Locale.US), monthRevenue);
        }

        return new YearlyRevenueDTO(
                year, totalRevenue, totalDiscount, netRevenue, totalOrders,
                monthlyRevenues, foodRevenue, drinkRevenue, otherRevenue
        );
    }

    public byte[] exportRevenueReport(RevenueExportDTO exportDTO) {
        if (exportDTO.getStartDate() == null) {
            exportDTO.setStartDate(LocalDate.now().withDayOfMonth(1)); // Default to first day of current month
        }

        if (exportDTO.getEndDate() == null) {
            exportDTO.setEndDate(LocalDate.now()); // Default to today
        }

        // Get revenue data based on report type and date range
        List<Revenue> revenueData;

        if (exportDTO.getRevenueIds() != null && !exportDTO.getRevenueIds().isEmpty()) {
            // If specific revenue IDs are provided, get only those records
            revenueData = revenueRepository.findAllById(exportDTO.getRevenueIds());
        } else {
            // Otherwise, get data by date range
            revenueData = revenueRepository.findByDateBetweenOrderByDateDesc(
                    exportDTO.getStartDate(), exportDTO.getEndDate());
        }

        // Generate report in requested format
        if ("pdf".equalsIgnoreCase(exportDTO.getExportFormat())) {
            return generatePdfReport(exportDTO, revenueData);
        } else if ("excel".equalsIgnoreCase(exportDTO.getExportFormat())) {
            return generateExcelReport(exportDTO, revenueData);
        }

        throw new IllegalArgumentException("Unsupported export format: " + exportDTO.getExportFormat());
    }

    private byte[] generatePdfReport(RevenueExportDTO exportDTO, List<Revenue> revenueData) {
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            // Create document and writer
            Document document = new Document(PageSize.A4, 50, 50, 50, 50);
            PdfWriter writer = PdfWriter.getInstance(document, baos);
            document.open();

            // Add title
            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18);
            String reportTitle = getReportTitle(exportDTO);
            Paragraph title = new Paragraph(reportTitle, titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            document.add(title);
            document.add(Chunk.NEWLINE);

            // Add date range
            Font normalFont = FontFactory.getFont(FontFactory.HELVETICA, 12);
            String dateRange = "Period: " + exportDTO.getStartDate() + " to " + exportDTO.getEndDate();
            Paragraph dates = new Paragraph(dateRange, normalFont);
            document.add(dates);
            document.add(Chunk.NEWLINE);

            // Add summary section if not daily report
            if (!"daily".equalsIgnoreCase(exportDTO.getReportType())) {
                addSummaryToPdf(document, revenueData);
            }

            // Add detailed data table
            PdfPTable table = new PdfPTable(8);
            table.setWidthPercentage(100);

            // Define table headers
            Stream.of("Date", "Total Revenue", "Orders", "Customers", "Food", "Drinks", "Other", "Notes")
                    .forEach(columnTitle -> {
                        PdfPCell header = new PdfPCell();
                        header.setBackgroundColor(java.awt.Color.LIGHT_GRAY);
                        header.setBorderWidth(2);
                        header.setPhrase(new Phrase(columnTitle));
                        header.setHorizontalAlignment(Element.ALIGN_CENTER);
                        table.addCell(header);
                    });

            // Add data rows
            for (Revenue revenue : revenueData) {
                table.addCell(revenue.getDate().toString());
                table.addCell("$" + revenue.getTotalRevenue().toString());
                table.addCell(revenue.getTotalOrders().toString());
                table.addCell(revenue.getTotalCustomers().toString());
                table.addCell("$" + revenue.getFoodRevenue().toString());
                table.addCell("$" + revenue.getDrinkRevenue().toString());
                table.addCell("$" + revenue.getOtherRevenue().toString());
                table.addCell(revenue.getNotes() != null ? revenue.getNotes() : "");
            }

            document.add(table);
            document.close();

            return baos.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate PDF report", e);
        }
    }

    private void addSummaryToPdf(Document document, List<Revenue> revenueData) throws DocumentException {
        Font subTitleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14);
        Font normalFont = FontFactory.getFont(FontFactory.HELVETICA, 12);

        // Add Summary section
        Paragraph summaryTitle = new Paragraph("Summary", subTitleFont);
        document.add(summaryTitle);
        document.add(Chunk.NEWLINE);

        // Calculate totals
        BigDecimal totalRevenue = revenueData.stream()
                .map(Revenue::getTotalRevenue)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        int totalOrders = revenueData.stream()
                .mapToInt(Revenue::getTotalOrders)
                .sum();

        int totalCustomers = revenueData.stream()
                .mapToInt(Revenue::getTotalCustomers)
                .sum();

        BigDecimal foodRevenue = revenueData.stream()
                .map(Revenue::getFoodRevenue)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal drinkRevenue = revenueData.stream()
                .map(Revenue::getDrinkRevenue)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal otherRevenue = revenueData.stream()
                .map(Revenue::getOtherRevenue)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Create a simple table for the summary
        PdfPTable summaryTable = new PdfPTable(2);
        summaryTable.setWidthPercentage(60);
        summaryTable.setHorizontalAlignment(Element.ALIGN_LEFT);

        summaryTable.addCell("Total Revenue");
        summaryTable.addCell("$" + totalRevenue.toString());

        summaryTable.addCell("Total Orders");
        summaryTable.addCell(String.valueOf(totalOrders));

        summaryTable.addCell("Total Customers");
        summaryTable.addCell(String.valueOf(totalCustomers));

        summaryTable.addCell("Food Revenue");
        summaryTable.addCell("$" + foodRevenue.toString());

        summaryTable.addCell("Drink Revenue");
        summaryTable.addCell("$" + drinkRevenue.toString());

        summaryTable.addCell("Other Revenue");
        summaryTable.addCell("$" + otherRevenue.toString());

        document.add(summaryTable);
        document.add(Chunk.NEWLINE);
    }

    private byte[] generateExcelReport(RevenueExportDTO exportDTO, List<Revenue> revenueData) {
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream();
             Workbook workbook = new XSSFWorkbook()) {

            // Create main data sheet
            Sheet dataSheet = workbook.createSheet("Revenue Data");

            // Create header row
            Row headerRow = dataSheet.createRow(0);
            CellStyle headerStyle = workbook.createCellStyle();
            headerStyle.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerStyle.setBorderBottom(BorderStyle.THIN);
            headerStyle.setBorderTop(BorderStyle.THIN);
            headerStyle.setBorderLeft(BorderStyle.THIN);
            headerStyle.setBorderRight(BorderStyle.THIN);

            org.apache.poi.ss.usermodel.Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerStyle.setFont(headerFont);

            // Define columns
            String[] columns = {"Date", "Total Revenue", "Orders", "Customers", "Food Revenue",
                    "Drink Revenue", "Other Revenue", "Discount", "Net Revenue", "Avg Order Value", "Notes"};

            // Create header cells
            for (int i = 0; i < columns.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(columns[i]);
                cell.setCellStyle(headerStyle);
                dataSheet.autoSizeColumn(i);
            }

            // Create data rows
            CellStyle dateCellStyle = workbook.createCellStyle();
            dateCellStyle.setDataFormat(workbook.createDataFormat().getFormat("yyyy-mm-dd"));

            CellStyle currencyCellStyle = workbook.createCellStyle();
            currencyCellStyle.setDataFormat(workbook.createDataFormat().getFormat("$#,##0.00"));

            int rowNum = 1;
            for (Revenue revenue : revenueData) {
                Row row = dataSheet.createRow(rowNum++);

                // Date
                Cell dateCell = row.createCell(0);
                dateCell.setCellValue(java.sql.Date.valueOf(revenue.getDate()));
                dateCell.setCellStyle(dateCellStyle);

                // Total Revenue
                Cell revenueCell = row.createCell(1);
                revenueCell.setCellValue(revenue.getTotalRevenue().doubleValue());
                revenueCell.setCellStyle(currencyCellStyle);

                // Orders
                row.createCell(2).setCellValue(revenue.getTotalOrders());

                // Customers
                row.createCell(3).setCellValue(revenue.getTotalCustomers());

                // Food Revenue
                Cell foodCell = row.createCell(4);
                foodCell.setCellValue(revenue.getFoodRevenue().doubleValue());
                foodCell.setCellStyle(currencyCellStyle);

                // Drink Revenue
                Cell drinkCell = row.createCell(5);
                drinkCell.setCellValue(revenue.getDrinkRevenue().doubleValue());
                drinkCell.setCellStyle(currencyCellStyle);

                // Other Revenue
                Cell otherCell = row.createCell(6);
                otherCell.setCellValue(revenue.getOtherRevenue().doubleValue());
                otherCell.setCellStyle(currencyCellStyle);

                // Discount
                Cell discountCell = row.createCell(7);
                discountCell.setCellValue(revenue.getTotalDiscount().doubleValue());
                discountCell.setCellStyle(currencyCellStyle);

                // Net Revenue
                Cell netCell = row.createCell(8);
                netCell.setCellValue(revenue.getNetRevenue().doubleValue());
                netCell.setCellStyle(currencyCellStyle);

                // Avg Order Value
                Cell avgCell = row.createCell(9);
                avgCell.setCellValue(revenue.getAverageOrderValue().doubleValue());
                avgCell.setCellStyle(currencyCellStyle);

                // Notes
                row.createCell(10).setCellValue(revenue.getNotes() != null ? revenue.getNotes() : "");
            }

            // Auto size all columns for better readability
            for (int i = 0; i < columns.length; i++) {
                dataSheet.autoSizeColumn(i);
            }

            // Create summary sheet if not daily report
            if (!"daily".equalsIgnoreCase(exportDTO.getReportType())) {
                createSummarySheet(workbook, revenueData, exportDTO);
            }

            // Write workbook to output stream
            workbook.write(baos);
            return baos.toByteArray();

        } catch (Exception e) {
            throw new RuntimeException("Failed to generate Excel report", e);
        }
    }

    private void createSummarySheet(Workbook workbook, List<Revenue> revenueData, RevenueExportDTO exportDTO) {
        Sheet summarySheet = workbook.createSheet("Summary");
        CellStyle headerStyle = workbook.createCellStyle();
        headerStyle.setFillForegroundColor(IndexedColors.LIGHT_BLUE.getIndex());
        headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

        org.apache.poi.ss.usermodel.Font headerFont = workbook.createFont();
        headerFont.setBold(true);
        headerStyle.setFont(headerFont);

        CellStyle currencyCellStyle = workbook.createCellStyle();
        currencyCellStyle.setDataFormat(workbook.createDataFormat().getFormat("$#,##0.00"));

        // Add title
        Row titleRow = summarySheet.createRow(0);
        Cell titleCell = titleRow.createCell(0);
        titleCell.setCellValue(getReportTitle(exportDTO));

        org.apache.poi.ss.usermodel.Font titleFont = workbook.createFont();
        titleFont.setBold(true);
        titleFont.setFontHeightInPoints((short) 14);
        CellStyle titleStyle = workbook.createCellStyle();
        titleStyle.setFont(titleFont);
        titleCell.setCellStyle(titleStyle);

        // Add date range
        Row dateRow = summarySheet.createRow(1);
        dateRow.createCell(0).setCellValue("Period: " + exportDTO.getStartDate() + " to " + exportDTO.getEndDate());

        // Leave a blank row
        summarySheet.createRow(2);

        // Create totals section
        Row headerRow = summarySheet.createRow(3);
        headerRow.createCell(0).setCellValue("Metric");
        headerRow.createCell(1).setCellValue("Value");
        headerRow.getCell(0).setCellStyle(headerStyle);
        headerRow.getCell(1).setCellStyle(headerStyle);

        // Calculate totals
        BigDecimal totalRevenue = revenueData.stream()
                .map(Revenue::getTotalRevenue)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        int totalOrders = revenueData.stream()
                .mapToInt(Revenue::getTotalOrders)
                .sum();

        int totalCustomers = revenueData.stream()
                .mapToInt(Revenue::getTotalCustomers)
                .sum();

        BigDecimal foodRevenue = revenueData.stream()
                .map(Revenue::getFoodRevenue)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal drinkRevenue = revenueData.stream()
                .map(Revenue::getDrinkRevenue)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal otherRevenue = revenueData.stream()
                .map(Revenue::getOtherRevenue)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalDiscount = revenueData.stream()
                .map(Revenue::getTotalDiscount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal netRevenue = totalRevenue.subtract(totalDiscount);

        BigDecimal avgOrderValue = totalOrders > 0
                ? totalRevenue.divide(new BigDecimal(totalOrders), 2, BigDecimal.ROUND_HALF_UP)
                : BigDecimal.ZERO;

        // Add total rows
        int rowNum = 4;

        Row row1 = summarySheet.createRow(rowNum++);
        row1.createCell(0).setCellValue("Total Revenue");
        Cell cell1 = row1.createCell(1);
        cell1.setCellValue(totalRevenue.doubleValue());
        cell1.setCellStyle(currencyCellStyle);

        Row row2 = summarySheet.createRow(rowNum++);
        row2.createCell(0).setCellValue("Total Orders");
        row2.createCell(1).setCellValue(totalOrders);

        Row row3 = summarySheet.createRow(rowNum++);
        row3.createCell(0).setCellValue("Total Customers");
        row3.createCell(1).setCellValue(totalCustomers);

        Row row4 = summarySheet.createRow(rowNum++);
        row4.createCell(0).setCellValue("Food Revenue");
        Cell cell4 = row4.createCell(1);
        cell4.setCellValue(foodRevenue.doubleValue());
        cell4.setCellStyle(currencyCellStyle);

        Row row5 = summarySheet.createRow(rowNum++);
        row5.createCell(0).setCellValue("Drink Revenue");
        Cell cell5 = row5.createCell(1);
        cell5.setCellValue(drinkRevenue.doubleValue());
        cell5.setCellStyle(currencyCellStyle);

        Row row6 = summarySheet.createRow(rowNum++);
        row6.createCell(0).setCellValue("Other Revenue");
        Cell cell6 = row6.createCell(1);
        cell6.setCellValue(otherRevenue.doubleValue());
        cell6.setCellStyle(currencyCellStyle);

        Row row7 = summarySheet.createRow(rowNum++);
        row7.createCell(0).setCellValue("Total Discount");
        Cell cell7 = row7.createCell(1);
        cell7.setCellValue(totalDiscount.doubleValue());
        cell7.setCellStyle(currencyCellStyle);

        Row row8 = summarySheet.createRow(rowNum++);
        row8.createCell(0).setCellValue("Net Revenue");
        Cell cell8 = row8.createCell(1);
        cell8.setCellValue(netRevenue.doubleValue());
        cell8.setCellStyle(currencyCellStyle);

        Row row9 = summarySheet.createRow(rowNum++);
        row9.createCell(0).setCellValue("Average Order Value");
        Cell cell9 = row9.createCell(1);
        cell9.setCellValue(avgOrderValue.doubleValue());
        cell9.setCellStyle(currencyCellStyle);

        // Autosize columns
        summarySheet.autoSizeColumn(0);
        summarySheet.autoSizeColumn(1);
    }

    private String getReportTitle(RevenueExportDTO exportDTO) {
        String reportTypeText;
        switch (exportDTO.getReportType().toLowerCase()) {
            case "daily":
                reportTypeText = "Daily";
                break;
            case "monthly":
                reportTypeText = "Monthly";
                break;
            case "yearly":
                reportTypeText = "Yearly";
                break;
            default:
                reportTypeText = "";
        }

        return reportTypeText + " Revenue Report";
    }

    private RevenueDTO convertToDTO(Revenue revenue) {
        RevenueDTO dto = new RevenueDTO();
        dto.setRevenueId(revenue.getRevenueId());
        dto.setDate(revenue.getDate());
        dto.setTotalRevenue(Objects.requireNonNullElse(revenue.getTotalRevenue(), BigDecimal.ZERO));
        dto.setTotalOrders(Objects.requireNonNullElse(revenue.getTotalOrders(), 0));
        dto.setTotalCustomers(Objects.requireNonNullElse(revenue.getTotalCustomers(), 0));
        dto.setFoodRevenue(Objects.requireNonNullElse(revenue.getFoodRevenue(), BigDecimal.ZERO));
        dto.setDrinkRevenue(Objects.requireNonNullElse(revenue.getDrinkRevenue(), BigDecimal.ZERO));
        dto.setOtherRevenue(Objects.requireNonNullElse(revenue.getOtherRevenue(), BigDecimal.ZERO));
        dto.setTotalDiscount(Objects.requireNonNullElse(revenue.getTotalDiscount(), BigDecimal.ZERO));
        dto.setNetRevenue(Objects.requireNonNullElse(revenue.getNetRevenue(), BigDecimal.ZERO));
        dto.setAverageOrderValue(Objects.requireNonNullElse(revenue.getAverageOrderValue(), BigDecimal.ZERO));
        dto.setNotes(revenue.getNotes());
        return dto;
    }
}