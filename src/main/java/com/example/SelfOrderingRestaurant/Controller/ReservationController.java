package com.example.SelfOrderingRestaurant.Controller;

import com.example.SelfOrderingRestaurant.Dto.Request.ReservationRequestDTO.ChangeTableRequestDTO;
import com.example.SelfOrderingRestaurant.Dto.Request.ReservationRequestDTO.ReservationRequestDTO;
import com.example.SelfOrderingRestaurant.Dto.Response.ReservationResponseDTO.PublicTableDTO;
import com.example.SelfOrderingRestaurant.Dto.Response.ReservationResponseDTO.ReservationResponseDTO;
import com.example.SelfOrderingRestaurant.Enum.OrderStatus;
import com.example.SelfOrderingRestaurant.Service.Imp.IReservationService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/reservations")
public class ReservationController {

    private final IReservationService reservationService;

    public ReservationController(IReservationService reservationService) {
        this.reservationService = reservationService;
    }

    // Public: khách đặt bàn trước
    @PostMapping
    public ResponseEntity<ReservationResponseDTO> create(@Validated @RequestBody ReservationRequestDTO request) {
        return ResponseEntity.ok(reservationService.createByCustomer(request));
    }

    // Public: danh sách bàn rút gọn để khách chọn
    @GetMapping("/tables")
    public ResponseEntity<List<PublicTableDTO>> tables() {
        return ResponseEntity.ok(reservationService.getPublicTables());
    }

    @GetMapping
    public ResponseEntity<List<ReservationResponseDTO>> list(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) OrderStatus status) {
        return ResponseEntity.ok(reservationService.list(date, status));
    }

    @PostMapping("/manual")
    public ResponseEntity<ReservationResponseDTO> createManual(@Validated @RequestBody ReservationRequestDTO request) {
        return ResponseEntity.ok(reservationService.createManual(request));
    }

    @PutMapping("/{id}/confirm")
    public ResponseEntity<ReservationResponseDTO> confirm(@PathVariable Integer id) {
        return ResponseEntity.ok(reservationService.confirm(id));
    }

    @PutMapping("/{id}/reject")
    public ResponseEntity<ReservationResponseDTO> reject(@PathVariable Integer id) {
        return ResponseEntity.ok(reservationService.reject(id));
    }

    @PutMapping("/{id}/check-in")
    public ResponseEntity<ReservationResponseDTO> checkIn(@PathVariable Integer id) {
        return ResponseEntity.ok(reservationService.checkIn(id));
    }

    @PutMapping("/{id}/cancel")
    public ResponseEntity<ReservationResponseDTO> cancel(@PathVariable Integer id) {
        return ResponseEntity.ok(reservationService.cancel(id));
    }

    @PutMapping("/{id}/table")
    public ResponseEntity<ReservationResponseDTO> changeTable(@PathVariable Integer id,
                                                              @Validated @RequestBody ChangeTableRequestDTO request) {
        return ResponseEntity.ok(reservationService.changeTable(id, request.getTableId()));
    }
}
