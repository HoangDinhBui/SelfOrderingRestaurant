package com.example.SelfOrderingRestaurant.Service;

import com.example.SelfOrderingRestaurant.Dto.Request.DinningTableRequestDTO.CreateTableRequestDTO;
import com.example.SelfOrderingRestaurant.Dto.Request.DinningTableRequestDTO.UpdateTableRequestDTO;
import com.example.SelfOrderingRestaurant.Dto.Response.DinningTableResponseDTO.DinningTableResponseDTO;
import com.example.SelfOrderingRestaurant.Dto.Response.NotificationResponseDTO.NotificationResponseDTO;
import com.example.SelfOrderingRestaurant.Entity.DinningTable;
import com.example.SelfOrderingRestaurant.Entity.Order;
import com.example.SelfOrderingRestaurant.Enum.PaymentStatus;
import com.example.SelfOrderingRestaurant.Enum.TableStatus;
import com.example.SelfOrderingRestaurant.Exception.ResourceNotFoundException;
import com.example.SelfOrderingRestaurant.Repository.DinningTableRepository;
import com.example.SelfOrderingRestaurant.Repository.OrderRepository;
import com.example.SelfOrderingRestaurant.Service.Imp.IDinningTableService;
import lombok.AllArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@AllArgsConstructor
public class DinningTableService implements IDinningTableService {
    private final DinningTableRepository dinningTableRepository;
    private final OrderRepository orderRepository;
    private final WebSocketService webSocketService;
    private static final Logger log = LoggerFactory.getLogger(DinningTableService.class);

    @Transactional
    @Override
    public DinningTableResponseDTO createTable(CreateTableRequestDTO request) {
        if (dinningTableRepository.existsById(request.getTableNumber())) {
            throw new IllegalArgumentException("Table with number " + request.getTableNumber() + " already exists");
        }

        DinningTable table = new DinningTable();
        table.setTableNumber(request.getTableNumber());
        table.setCapacity(request.getCapacity());
        table.setTableStatus(request.getTableStatus() != null ? request.getTableStatus() : TableStatus.AVAILABLE);
        table.setLocation(request.getLocation());
        table.setQrCode(request.getQrCode());

        DinningTable savedTable = dinningTableRepository.saveAndFlush(table);
        sendTableStatusUpdatedMessage(savedTable);
        return convertToResponseDTO(savedTable);
    }

    @Transactional
    @Override
    public DinningTableResponseDTO getTableById(Integer tableNumber) {
        DinningTable table = dinningTableRepository.findById(tableNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Table with number " + tableNumber + " not found"));
        boolean hasUnpaidOrders = orderRepository.existsByTablesTableNumberAndPaymentStatus(
                table.getTableNumber(), PaymentStatus.UNPAID);
        TableStatus status = hasUnpaidOrders ? TableStatus.OCCUPIED : TableStatus.AVAILABLE;
        if (table.getTableStatus() != status) {
            table.setTableStatus(status);
            dinningTableRepository.saveAndFlush(table);
            sendTableStatusUpdatedMessage(table);
        }
        return convertToResponseDTO(table);
    }

    @Transactional
    @Override
    public DinningTableResponseDTO updateTable(Integer tableNumber, UpdateTableRequestDTO request) {
        DinningTable table = dinningTableRepository.findById(tableNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Table with number " + tableNumber + " not found"));

        if (request.getCapacity() != null) {
            table.setCapacity(request.getCapacity());
        }
        if (request.getTableStatus() != null) {
            table.setTableStatus(request.getTableStatus());
        }
        if (request.getLocation() != null) {
            table.setLocation(request.getLocation());
        }
        if (request.getQrCode() != null) {
            table.setQrCode(request.getQrCode());
        }

        DinningTable updatedTable = dinningTableRepository.saveAndFlush(table);
        sendTableStatusUpdatedMessage(updatedTable);
        return convertToResponseDTO(updatedTable);
    }

    @Transactional
    @Override
    public List<DinningTableResponseDTO> getAllTables() {
        return dinningTableRepository.findAll().stream()
                .map(table -> {
                    boolean hasUnpaidOrders = orderRepository.existsByTablesTableNumberAndPaymentStatus(
                            table.getTableNumber(), PaymentStatus.UNPAID);
                    TableStatus status = hasUnpaidOrders ? TableStatus.OCCUPIED : TableStatus.AVAILABLE;
                    if (table.getTableStatus() != status) {
                        table.setTableStatus(status);
                        dinningTableRepository.saveAndFlush(table);
                        log.info("Table {} status updated to {} in getAllTables", table.getTableNumber(), status);
                        sendTableStatusUpdatedMessage(table);
                    }
                    return convertToResponseDTO(table);
                })
                .collect(Collectors.toList());
    }

    @Transactional
    @Override
    public void updateTableStatus(Integer tableNumber, TableStatus status) {
        DinningTable table = dinningTableRepository.findById(tableNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Table with number " + tableNumber + " not found"));
        if (status == null) {
            throw new IllegalArgumentException("Table status cannot be null");
        }
        table.setTableStatus(status);
        dinningTableRepository.saveAndFlush(table);
        log.info("Table {} status updated to {} via updateTableStatus", tableNumber, status);
        sendTableStatusUpdatedMessage(table);
    }

    @Transactional
    @Override
    public void swapTables(Integer tableNumberA, Integer tableNumberB) {
        DinningTable tableA = dinningTableRepository.findById(tableNumberA)
                .orElseThrow(() -> new ResourceNotFoundException("Table with number " + tableNumberA + " not found"));
        DinningTable tableB = dinningTableRepository.findById(tableNumberB)
                .orElseThrow(() -> new ResourceNotFoundException("Table with number " + tableNumberB + " not found"));

        List<Order> ordersTableA = orderRepository.findByTableNumber(tableNumberA);
        List<Order> ordersTableB = orderRepository.findByTableNumber(tableNumberB);

        if (ordersTableA.isEmpty() && ordersTableB.isEmpty()) {
            throw new IllegalStateException("Both tables have no active orders to swap");
        }

        ordersTableA.forEach(order -> order.setTables(tableB));
        ordersTableB.forEach(order -> order.setTables(tableA));

        orderRepository.saveAll(ordersTableA);
        orderRepository.saveAll(ordersTableB);

        updateTableStatusAfterSwap(tableA, ordersTableB);
        updateTableStatusAfterSwap(tableB, ordersTableA);
    }

    private void updateTableStatusAfterSwap(DinningTable table, List<Order> orders) {
        boolean hasUnpaidOrders = orderRepository.existsByTablesTableNumberAndPaymentStatus(
                table.getTableNumber(), PaymentStatus.UNPAID);
        TableStatus status = hasUnpaidOrders ? TableStatus.OCCUPIED : TableStatus.AVAILABLE;
        if (table.getTableStatus() != status) {
            table.setTableStatus(status);
            dinningTableRepository.saveAndFlush(table);
            log.info("Table {} status updated to {} after swap", table.getTableNumber(), status);
            sendTableStatusUpdatedMessage(table);
        }
    }

    private void sendTableStatusUpdatedMessage(DinningTable table) {
        Map<String, Object> message = new HashMap<>();
        message.put("type", "TABLE_STATUS_UPDATED");
        message.put("tableNumber", table.getTableNumber());
        message.put("tableStatus", table.getTableStatus().name());

        NotificationResponseDTO notification = NotificationResponseDTO.builder()
                .tableNumber(table.getTableNumber())
                .customPayload(message)
                .build();

        try {
            log.info("Sending WebSocket message for table {}: status={}",
                    table.getTableNumber(), table.getTableStatus());
            webSocketService.sendNotificationToActiveStaff(notification);
        } catch (Exception e) {
            log.error("Failed to send TABLE_STATUS_UPDATED for table {}: {}",
                    table.getTableNumber(), e.getMessage(), e);
        }
    }

    @Transactional
    @Override
    public DinningTableResponseDTO convertToResponseDTO(DinningTable dinningTable) {
        return new DinningTableResponseDTO(
                dinningTable.getTableNumber(),
                dinningTable.getCapacity(),
                dinningTable.getTableStatus() != null ? dinningTable.getTableStatus().toString() : "UNKNOWN"
        );
    }
}