package com.example.SelfOrderingRestaurant.Controller;

import com.example.SelfOrderingRestaurant.Dto.Request.UserRequestDTO.RegisterRequestDto;
import com.example.SelfOrderingRestaurant.Dto.Request.RevenueRequestDTO.RevenueExportDTO;
import com.example.SelfOrderingRestaurant.Dto.Request.ShiftRequestDTO.ShiftRequestDTO;
import com.example.SelfOrderingRestaurant.Dto.Request.StaffRequestDTO.AssignStaffRequestDTO;
import com.example.SelfOrderingRestaurant.Dto.Request.StaffRequestDTO.UpdateStaffDTO;
import com.example.SelfOrderingRestaurant.Dto.Response.RevenueResponseDTO.MonthlyRevenueDTO;
import com.example.SelfOrderingRestaurant.Dto.Response.RevenueResponseDTO.OverviewRevenueDTO;
import com.example.SelfOrderingRestaurant.Dto.Response.RevenueResponseDTO.RevenueDTO;
import com.example.SelfOrderingRestaurant.Dto.Response.RevenueResponseDTO.YearlyRevenueDTO;
import com.example.SelfOrderingRestaurant.Dto.Response.ShiftResponseDTO.ShiftResponseDTO;
import com.example.SelfOrderingRestaurant.Dto.Response.StaffResponseDTO.GetAllStaffResponseDTO;

import com.example.SelfOrderingRestaurant.Entity.Staff;
import com.example.SelfOrderingRestaurant.Enum.UserStatus;
import com.example.SelfOrderingRestaurant.Repository.StaffRepository;
import com.example.SelfOrderingRestaurant.Service.AuthService;
import com.example.SelfOrderingRestaurant.Service.RevenueService;
import com.example.SelfOrderingRestaurant.Service.ShiftService;
import com.example.SelfOrderingRestaurant.Service.StaffService;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@PreAuthorize("hasRole('ADMIN')")
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final StaffService staffService;
    private final AuthService authService;
    private final ShiftService shiftService;
    private final RevenueService revenueService;
    private final StaffRepository staffRepository;

    // Staff Management Endpoints
    @PostMapping("/staff/register")
    public ResponseEntity<?> registerStaff(@RequestBody RegisterRequestDto request) {
        authService.registerStaff(request);
        return ResponseEntity.ok("Staff registered successfully!");
    }

    @GetMapping("/staff")
    public List<GetAllStaffResponseDTO> getAllStaff(@RequestParam(required = false) UserStatus status) {
        List<Staff> staffList = status != null
                ? staffRepository.findAllByStatus(status)
                : staffRepository.findAllByStatus(UserStatus.ACTIVE);
        return staffList.stream()
                .map(staff -> new GetAllStaffResponseDTO(
                        staff.getStaffId(),
                        staff.getFullname(),
                        staff.getPosition(),
                        staff.getStatus()
                ))
                .collect(Collectors.toList());
    }

    @GetMapping("/staff/{id}")
    public ResponseEntity<GetAllStaffResponseDTO> getStaffById(@PathVariable("id") Integer id) {
        GetAllStaffResponseDTO staff = staffService.getStaffById(id);
        return new ResponseEntity<>(staff, HttpStatus.OK);
    }

    @PutMapping("/staff/{id}")
    public ResponseEntity<?> updateStaff(@PathVariable("id") Integer id,
                                         @Valid @RequestBody UpdateStaffDTO staffUpdateDTO) {
        try {
            staffService.updateStaff(id, staffUpdateDTO);
            return ResponseEntity.ok("Staff updated successfully!");
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Staff with ID " + id + " not found");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error updating staff: " + e.getMessage());
        }
    }

    @DeleteMapping("/staff/{id}")
    public ResponseEntity<?> deleteStaff(@PathVariable("id") Integer id) {
        try {
            staffService.deleteStaff(id);
            return ResponseEntity.ok("Staff deleted successfully!");
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Staff with ID " + id + " not found");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error deleting staff: " + e.getMessage());
        }
    }

    @PostMapping("/staff")
    public ResponseEntity<?> assignStaffShift(@RequestBody AssignStaffRequestDTO request) {
        staffService.assignStaffShift(request.getStaffId(), request.getShiftId(), request.getDate());
        return ResponseEntity.ok("Staff shift assigned successfully!");
    }

    // Shift Management Endpoints
    @GetMapping("/shifts")
    public ResponseEntity<List<ShiftResponseDTO>> getAllShifts() {
        List<ShiftResponseDTO> shifts = shiftService.getAllShifts();
        return ResponseEntity.ok(shifts);
    }

    @GetMapping("/shifts/{id}")
    public ResponseEntity<ShiftResponseDTO> getShiftById(@PathVariable Integer id) {
        ShiftResponseDTO shift = shiftService.getShiftById(id);
        return shift != null ? ResponseEntity.ok(shift) : ResponseEntity.notFound().build();
    }

    @PostMapping("/shifts")
    public ResponseEntity<ShiftResponseDTO> createShift(@RequestBody ShiftRequestDTO shiftRequestDTO) {
        return ResponseEntity.ok(shiftService.createShift(shiftRequestDTO));
    }

    @PutMapping("/shifts/{id}")
    public ResponseEntity<ShiftResponseDTO> updateShift(@PathVariable Integer id, @RequestBody ShiftRequestDTO shiftRequestDTO) {
        ShiftResponseDTO updatedShift = shiftService.updateShift(id, shiftRequestDTO);
        return updatedShift != null ? ResponseEntity.ok(updatedShift) : ResponseEntity.notFound().build();
    }

    @DeleteMapping("/shifts/{id}")
    public ResponseEntity<Map<String, String>> deleteShift(@PathVariable Integer id) {
        shiftService.deleteShift(id);
        return ResponseEntity.ok(Map.of("message", "Shift deleted successfully"));
    }


    @GetMapping("/revenue")
    public ResponseEntity<OverviewRevenueDTO> getRevenueOverview() {
        OverviewRevenueDTO overview = revenueService.getRevenueOverview();
        return ResponseEntity.ok(overview);
    }

    @GetMapping("/revenue/daily")
    public ResponseEntity<List<RevenueDTO>> getDailyRevenue(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        if (startDate != null && endDate != null && startDate.isAfter(endDate)) {
            throw new IllegalArgumentException("startDate must be before or equal to endDate");
        }
        List<RevenueDTO> revenues = revenueService.getDailyRevenue(startDate, endDate);
        return ResponseEntity.ok(revenues);
    }

    @GetMapping("/revenue/monthly")
    public ResponseEntity<MonthlyRevenueDTO> getMonthlyRevenue(
            @RequestParam(required = false, defaultValue = "#{T(java.time.LocalDate).now().getYear()}") int year,
            @RequestParam(required = false, defaultValue = "#{T(java.time.LocalDate).now().getMonthValue()}") int month) {
        // Validate month
        if (month < 1 || month > 12) {
            throw new IllegalArgumentException("Month must be between 1 and 12");
        }
        // Validate year (optional, can be adjusted based on requirements)
        if (year < 2000 || year > LocalDate.now().getYear() + 1) {
            throw new IllegalArgumentException("Year must be between 2000 and " + (LocalDate.now().getYear() + 1));
        }
        MonthlyRevenueDTO monthlyRevenue = revenueService.getMonthlyRevenue(year, month);
        return ResponseEntity.ok(monthlyRevenue);
    }

    @GetMapping("/revenue/yearly")
    public ResponseEntity<YearlyRevenueDTO> getYearlyRevenue(
            @RequestParam(required = false, defaultValue = "#{T(java.time.LocalDate).now().getYear()}") int year) {

        YearlyRevenueDTO yearlyRevenue = revenueService.getYearlyRevenue(year);
        return ResponseEntity.ok(yearlyRevenue);
    }

    @PostMapping(value = "/revenue/export", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<byte[]> exportRevenueReport(@RequestBody RevenueExportDTO exportDTO) {
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

        System.out.println("Exporting revenue report: " + exportDTO);
        System.out.println("Report size: " + reportBytes.length + " bytes");

        return new ResponseEntity<>(reportBytes, headers, HttpStatus.OK);
    }
}