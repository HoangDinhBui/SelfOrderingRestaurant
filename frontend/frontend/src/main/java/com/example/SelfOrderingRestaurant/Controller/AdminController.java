package com.example.SelfOrderingRestaurant.Controller;

import com.example.SelfOrderingRestaurant.Dto.Request.DinningTableRequestDTO.CreateTableRequestDTO;
import com.example.SelfOrderingRestaurant.Dto.Request.DinningTableRequestDTO.DinningTableRequestDTO;
import com.example.SelfOrderingRestaurant.Dto.Request.DinningTableRequestDTO.UpdateTableRequestDTO;
import com.example.SelfOrderingRestaurant.Dto.Request.UserRequestDTO.RegisterRequestDto;
import com.example.SelfOrderingRestaurant.Dto.Request.RevenueRequestDTO.RevenueExportDTO;
import com.example.SelfOrderingRestaurant.Dto.Request.ShiftRequestDTO.ShiftRequestDTO;
import com.example.SelfOrderingRestaurant.Dto.Request.StaffRequestDTO.AssignStaffRequestDTO;
import com.example.SelfOrderingRestaurant.Dto.Request.StaffRequestDTO.UpdateStaffDTO;
import com.example.SelfOrderingRestaurant.Dto.Response.DinningTableResponseDTO.DinningTableResponseDTO;
import com.example.SelfOrderingRestaurant.Dto.Response.RevenueResponseDTO.MonthlyRevenueDTO;
import com.example.SelfOrderingRestaurant.Dto.Response.RevenueResponseDTO.OverviewRevenueDTO;
import com.example.SelfOrderingRestaurant.Dto.Response.RevenueResponseDTO.RevenueDTO;
import com.example.SelfOrderingRestaurant.Dto.Response.RevenueResponseDTO.YearlyRevenueDTO;
import com.example.SelfOrderingRestaurant.Dto.Response.ShiftResponseDTO.ShiftResponseDTO;
import com.example.SelfOrderingRestaurant.Dto.Response.StaffResponseDTO.GetAllStaffResponseDTO;
import com.example.SelfOrderingRestaurant.Dto.Response.UserResponseDTO.AuthResponseDto;
import com.example.SelfOrderingRestaurant.Entity.Shift;
import com.example.SelfOrderingRestaurant.Entity.Staff;
import com.example.SelfOrderingRestaurant.Entity.StaffShift;
import com.example.SelfOrderingRestaurant.Enum.UserStatus;
import com.example.SelfOrderingRestaurant.Exception.BadRequestException;
import com.example.SelfOrderingRestaurant.Exception.ResourceNotFoundException;
import com.example.SelfOrderingRestaurant.Repository.StaffRepository;
import com.example.SelfOrderingRestaurant.Repository.StaffShiftRepository;
import com.example.SelfOrderingRestaurant.Service.*;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@PreAuthorize("hasRole('ADMIN')")
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {
    private static final Logger logger = LoggerFactory.getLogger(AdminController.class);

    private final StaffService staffService;
    private final AuthService authService;
    private final ShiftService shiftService;
    private final RevenueService revenueService;
    private final StaffRepository staffRepository;
    private final StaffShiftService staffShiftService;
    private final StaffShiftRepository staffShiftRepository;
    private final DinningTableService dinningTableService;

    @GetMapping("/tables")
    public ResponseEntity<List<DinningTableResponseDTO>> getAllTables() {
        List<DinningTableResponseDTO> tables = dinningTableService.getAllTables();
        return ResponseEntity.ok(tables);
    }

    @PostMapping("/tables")
    public ResponseEntity<?> createTable(@Valid @RequestBody CreateTableRequestDTO request) {
        try {
            logger.info("Creating new table with number: {}", request.getTableNumber());
            DinningTableResponseDTO createdTable = dinningTableService.createTable(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(createdTable);
        } catch (IllegalArgumentException e) {
            logger.warn("Invalid table creation request: {}", e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            logger.error("Error creating table: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error creating table: " + e.getMessage());
        }
    }

    @PutMapping("/tables/{tableNumber}")
    public ResponseEntity<?> updateTable(@PathVariable Integer tableNumber,
                                         @Valid @RequestBody UpdateTableRequestDTO request) {
        try {
            logger.info("Updating table with number: {}", tableNumber);
            DinningTableResponseDTO updatedTable = dinningTableService.updateTable(tableNumber, request);
            return ResponseEntity.ok(updatedTable);
        } catch (ResourceNotFoundException e) {
            logger.warn("Table not found with number: {}", tableNumber);
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Table with number " + tableNumber + " not found");
        } catch (IllegalArgumentException e) {
            logger.warn("Invalid table update request: {}", e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            logger.error("Error updating table with number {}: {}", tableNumber, e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error updating table: " + e.getMessage());
        }
    }

    @PutMapping("/tables/{table_id}")
    public ResponseEntity<String> updateTableStatus(
            @PathVariable("table_id") Integer tableId,
            @RequestBody DinningTableRequestDTO dinningTableRequestDTO) {
        dinningTableService.updateTableStatus(tableId, dinningTableRequestDTO.getStatus());
        return ResponseEntity.ok("Table status updated successfully!");
    }

    // Staff Management Endpoints
    @PostMapping(value = "/staff/register", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> registerStaff(
            @RequestPart("request") RegisterRequestDto request,
            @RequestPart(value = "image", required = false) MultipartFile image) {
        try {
            logger.info("Registering new staff: {}", request.getUsername());
            AuthResponseDto authResponse = authService.registerStaff(request, image);
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Staff registered successfully!");
            response.put("auth", authResponse);
            response.put("staffId", authResponse.getStaffId());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error registering staff: {}", e.getMessage());
            return ResponseEntity.badRequest().body("Error registering staff: " + e.getMessage());
        }
    }

    @GetMapping("/staff")
    public ResponseEntity<List<GetAllStaffResponseDTO>> getAllStaff(@RequestParam(required = false) UserStatus status) {
        try {
            logger.info("Fetching staff list with status: {}", status);
            List<Staff> staffList = status != null
                    ? staffRepository.findAllByStatus(status)
                    : staffRepository.findAllByStatus(UserStatus.ACTIVE);
            List<GetAllStaffResponseDTO> response = staffList.stream()
                    .map(staff -> new GetAllStaffResponseDTO(
                            staff.getStaffId(),
                            staff.getFullname(),
                            staff.getPosition(),
                            staff.getStatus(),
                            staff.getPosition(),
                            staff.getUser().getEmail(),
                            staff.getUser().getPhone(),
                            staff.getSalary()
                    ))
                    .collect(Collectors.toList());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error fetching staff list: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @GetMapping("/staff/{id}")
    public ResponseEntity<GetAllStaffResponseDTO> getStaffById(@PathVariable Integer id) {
        try {
            logger.info("Fetching staff with ID: {}", id);
            GetAllStaffResponseDTO staff = staffService.getStaffById(id);
            return ResponseEntity.ok(staff);
        } catch (EntityNotFoundException e) {
            logger.warn("Staff not found with ID: {}", id);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
        } catch (Exception e) {
            logger.error("Error fetching staff with ID {}: {}", id, e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @PutMapping("/staff/{id}")
    public ResponseEntity<?> updateStaff(@PathVariable Integer id,
                                         @Valid @RequestBody UpdateStaffDTO staffUpdateDTO) {
        try {
            logger.info("Updating staff with ID: {}", id);
            staffService.updateStaff(id, staffUpdateDTO);
            return ResponseEntity.ok("Staff updated successfully!");
        } catch (EntityNotFoundException e) {
            logger.warn("Staff not found with ID: {}", id);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Staff with ID " + id + " not found");
        } catch (IllegalArgumentException e) {
            logger.warn("Invalid input for staff update: {}", e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            logger.error("Error updating staff with ID {}: {}", id, e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error updating staff: " + e.getMessage());
        }
    }

    @DeleteMapping("/staff/{id}")
    public ResponseEntity<?> deleteStaff(@PathVariable Integer id) {
        try {
            logger.info("Deleting staff with ID: {}", id);
            staffService.deleteStaff(id);
            return ResponseEntity.ok("Staff deleted successfully!");
        } catch (EntityNotFoundException e) {
            logger.warn("Staff not found with ID: {}", id);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Staff with ID " + id + " not found");
        } catch (Exception e) {
            logger.error("Error deleting staff with ID {}: {}", id, e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error deleting staff: " + e.getMessage());
        }
    }

    // Shift Management Endpoints
    @GetMapping("/shifts")
    public ResponseEntity<List<ShiftResponseDTO>> getAllShifts() {
        try {
            logger.info("Fetching all shifts");
            List<ShiftResponseDTO> shifts = shiftService.getAllShifts();
            return ResponseEntity.ok(shifts);
        } catch (Exception e) {
            logger.error("Error fetching shifts: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @GetMapping("/shifts/{id}")
    public ResponseEntity<ShiftResponseDTO> getShiftById(@PathVariable Integer id) {
        try {
            logger.info("Fetching shift with ID: {}", id);
            ShiftResponseDTO shift = shiftService.getShiftById(id);
            return shift != null ? ResponseEntity.ok(shift) : ResponseEntity.notFound().build();
        } catch (NumberFormatException e) {
            logger.warn("Invalid shift ID format: {}", id);
            return ResponseEntity.badRequest().body(null);
        } catch (Exception e) {
            logger.error("Error fetching shift with ID {}: {}", id, e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @PostMapping("/shifts")
    public ResponseEntity<ShiftResponseDTO> createShift(@RequestBody ShiftRequestDTO shiftRequestDTO) {
        try {
            logger.info("Creating new shift: {}", shiftRequestDTO.getName());
            ShiftResponseDTO createdShift = shiftService.createShift(shiftRequestDTO);
            return ResponseEntity.ok(createdShift);
        } catch (Exception e) {
            logger.error("Error creating shift: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(null);
        }
    }

    @PutMapping("/shifts/{id}")
    public ResponseEntity<ShiftResponseDTO> updateShift(@PathVariable Integer id, @RequestBody ShiftRequestDTO shiftRequestDTO) {
        try {
            logger.info("Updating shift with ID: {}", id);
            ShiftResponseDTO updatedShift = shiftService.updateShift(id, shiftRequestDTO);
            return updatedShift != null ? ResponseEntity.ok(updatedShift) : ResponseEntity.notFound().build();
        } catch (Exception e) {
            logger.error("Error updating shift with ID {}: {}", id, e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(null);
        }
    }

    @DeleteMapping("/shifts/{id}")
    public ResponseEntity<Map<String, String>> deleteShift(@PathVariable Integer id) {
        try {
            logger.info("Deleting shift with ID: {}", id);
            shiftService.deleteShift(id);
            return ResponseEntity.ok(Map.of("message", "Shift deleted successfully"));
        } catch (Exception e) {
            logger.error("Error deleting shift with ID {}: {}", id, e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error deleting shift: " + e.getMessage()));
        }
    }

    @GetMapping("/shifts/empty")
    public ResponseEntity<List<ShiftResponseDTO>> getEmptyShifts(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        try {
            logger.info("Fetching empty shifts for date: {}", date);
            List<ShiftResponseDTO> allShifts = shiftService.getAllShifts();
            List<StaffShift> assignedShifts = staffShiftRepository.findByDate(date);
            List<Integer> assignedShiftIds = assignedShifts.stream()
                    .map(staffShift -> staffShift.getShift().getShiftId())
                    .collect(Collectors.toList());
            List<ShiftResponseDTO> emptyShifts = allShifts.stream()
                    .filter(shift -> !assignedShiftIds.contains(shift.getShiftId()))
                    .collect(Collectors.toList());
            return ResponseEntity.ok(emptyShifts);
        } catch (Exception e) {
            logger.error("Error fetching empty shifts for date {}: {}", date, e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @PostMapping("/staff/shift/assign")
    public ResponseEntity<?> assignStaffShift(@RequestBody AssignStaffRequestDTO request) {
        try {
            logger.info("Assigning shift {} to staff {} for date {}", request.getShiftId(), request.getStaffId(), request.getDate());
            staffShiftService.assignShiftByAdmin(request.getStaffId(), request.getShiftId(), request.getDate());
            return ResponseEntity.ok("Shift assigned successfully!");
        } catch (ResourceNotFoundException e) {
            logger.warn("Resource not found: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (BadRequestException e) {
            logger.warn("Bad request: {}", e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            logger.error("Error assigning shift: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error assigning shift: " + e.getMessage());
        }
    }

    // Revenue Endpoints
    @GetMapping("/revenue")
    public ResponseEntity<OverviewRevenueDTO> getRevenueOverview() {
        try {
            logger.info("Fetching revenue overview");
            OverviewRevenueDTO overview = revenueService.getRevenueOverview();
            return ResponseEntity.ok(overview);
        } catch (Exception e) {
            logger.error("Error fetching revenue overview: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @GetMapping("/revenue/daily")
    public ResponseEntity<List<RevenueDTO>> getDailyRevenue(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        try {
            logger.info("Fetching daily revenue from {} to {}", startDate, endDate);
            if (startDate != null && endDate != null && startDate.isAfter(endDate)) {
                throw new IllegalArgumentException("startDate must be before or equal to endDate");
            }
            List<RevenueDTO> revenues = revenueService.getDailyRevenue(startDate, endDate);
            return ResponseEntity.ok(revenues);
        } catch (IllegalArgumentException e) {
            logger.warn("Invalid date range: {}", e.getMessage());
            return ResponseEntity.badRequest().body(null);
        } catch (Exception e) {
            logger.error("Error fetching daily revenue: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @GetMapping("/revenue/monthly")
    public ResponseEntity<MonthlyRevenueDTO> getMonthlyRevenue(
            @RequestParam(required = false, defaultValue = "#{T(java.time.LocalDate).now().getYear()}") int year,
            @RequestParam(required = false, defaultValue = "#{T(java.time.LocalDate).now().getMonthValue()}") int month) {
        try {
            logger.info("Fetching monthly revenue for year {} and month {}", year, month);
            if (month < 1 || month > 12) {
                throw new IllegalArgumentException("Month must be between 1 and 12");
            }
            if (year < 2000 || year > LocalDate.now().getYear() + 1) {
                throw new IllegalArgumentException("Year must be between 2000 and " + (LocalDate.now().getYear() + 1));
            }
            MonthlyRevenueDTO monthlyRevenue = revenueService.getMonthlyRevenue(year, month);
            return ResponseEntity.ok(monthlyRevenue);
        } catch (IllegalArgumentException e) {
            logger.warn("Invalid input: {}", e.getMessage());
            return ResponseEntity.badRequest().body(null);
        } catch (Exception e) {
            logger.error("Error fetching monthly revenue: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @GetMapping("/revenue/yearly")
    public ResponseEntity<YearlyRevenueDTO> getYearlyRevenue(
            @RequestParam(required = false, defaultValue = "#{T(java.time.LocalDate).now().getYear()}") int year) {
        try {
            logger.info("Fetching yearly revenue for year {}", year);
            YearlyRevenueDTO yearlyRevenue = revenueService.getYearlyRevenue(year);
            return ResponseEntity.ok(yearlyRevenue);
        } catch (Exception e) {
            logger.error("Error fetching yearly revenue: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @PostMapping(value = "/revenue/export", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<byte[]> exportRevenueReport(@RequestBody RevenueExportDTO exportDTO) {
        try {
            logger.info("Exporting revenue report: {}", exportDTO.getReportType());
            byte[] reportBytes = revenueService.exportRevenueReport(exportDTO);

            String fileExtension = "xlsx";
            if ("pdf".equalsIgnoreCase(exportDTO.getExportFormat())) {
                fileExtension = "pdf";
            }

            String filename = "revenue_report_" + exportDTO.getReportType() + "_" +
                    LocalDate.now() + "." + fileExtension;

            HttpHeaders headers = new HttpHeaders();
            headers.add("Content-Disposition", "attachment; filename=\"" + filename + "\"");

            if ("pdf".equalsIgnoreCase(exportDTO.getExportFormat())) {
                headers.setContentType(MediaType.APPLICATION_PDF);
            } else if ("excel".equalsIgnoreCase(exportDTO.getExportFormat())) {
                headers.setContentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
            }

            return new ResponseEntity<>(reportBytes, headers, HttpStatus.OK);
        } catch (Exception e) {
            logger.error("Error exporting revenue report: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }
}