package com.example.SelfOrderingRestaurant.Service;

import com.example.SelfOrderingRestaurant.Dto.Request.DinningTableRequestDTO.CreateTableRequestDTO;
import com.example.SelfOrderingRestaurant.Dto.Request.DinningTableRequestDTO.UpdateTableRequestDTO;
import com.example.SelfOrderingRestaurant.Dto.Response.DinningTableResponseDTO.DinningTableResponseDTO;
import com.example.SelfOrderingRestaurant.Entity.DinningTable;
import com.example.SelfOrderingRestaurant.Entity.Order;
import com.example.SelfOrderingRestaurant.Enum.PaymentStatus;
import com.example.SelfOrderingRestaurant.Enum.TableStatus;
import com.example.SelfOrderingRestaurant.Exception.ResourceNotFoundException;
import com.example.SelfOrderingRestaurant.Repository.DinningTableRepository;
import com.example.SelfOrderingRestaurant.Repository.OrderRepository;
import com.example.SelfOrderingRestaurant.Service.Imp.IDinningTableService;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@AllArgsConstructor
public class DinningTableService implements IDinningTableService {

    private final DinningTableRepository dinningTableRepository;
    private final OrderRepository orderRepository;

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

        DinningTable savedTable = dinningTableRepository.save(table);
        return convertToResponseDTO(savedTable);
    }

    @Transactional
    @Override
    public DinningTableResponseDTO getTableById(Integer tableNumber) {
        DinningTable table = dinningTableRepository.findById(tableNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Table with number " + tableNumber + " not found"));
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

        DinningTable updatedTable = dinningTableRepository.save(table);
        return convertToResponseDTO(updatedTable);
    }

    @Transactional
    @Override
    public List<DinningTableResponseDTO> getAllTables() {
        return dinningTableRepository.findAll().stream()
                .map(table -> {
                    List<Order> tableOrders = orderRepository.findByTableNumber(table.getTableNumber());
                    TableStatus status;
                    if (tableOrders.isEmpty()) {
                        status = TableStatus.AVAILABLE;
                    } else if (tableOrders.size() == 1 && tableOrders.get(0).getPaymentStatus() == PaymentStatus.PAID) {
                        status = TableStatus.AVAILABLE;
                    } else {
                        status = TableStatus.OCCUPIED;
                    }
                    if (table.getTableStatus() != status) {
                        table.setTableStatus(status);
                        dinningTableRepository.save(table);
                    }
                    return convertToResponseDTO(table);
                })
                .collect(Collectors.toList());
    }

    @Transactional
    @Override
    public void updateTableStatus(Integer tableNumber, TableStatus status) {
        DinningTable table = dinningTableRepository.findById(tableNumber)
                .orElseThrow(() -> new RuntimeException("Table not found"));
        if (status == null) {
            throw new IllegalArgumentException("Table status cannot be null");
        }
        table.setTableStatus(status);
        dinningTableRepository.save(table);
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

    @Transactional
    @Override
    public void swapTables(Integer tableNumberA, Integer tableNumberB) {
        // Kiểm tra xem cả hai bàn có tồn tại không
        DinningTable tableA = dinningTableRepository.findById(tableNumberA)
                .orElseThrow(() -> new ResourceNotFoundException("Table with number " + tableNumberA + " not found"));
        DinningTable tableB = dinningTableRepository.findById(tableNumberB)
                .orElseThrow(() -> new ResourceNotFoundException("Table with number " + tableNumberB + " not found"));

        // Lấy danh sách đơn hàng của hai bàn
        List<Order> ordersTableA = orderRepository.findByTableNumber(tableNumberA);
        List<Order> ordersTableB = orderRepository.findByTableNumber(tableNumberB);

        // Kiểm tra nếu cả hai bàn đều không có đơn hàng
        if (ordersTableA.isEmpty() && ordersTableB.isEmpty()) {
            throw new IllegalStateException("Both tables have no active orders to swap");
        }

        // Hoán đổi bàn trong đơn hàng
        ordersTableA.forEach(order -> order.setTables(tableB));
        ordersTableB.forEach(order -> order.setTables(tableA));

        // Lưu các đơn hàng đã cập nhật
        orderRepository.saveAll(ordersTableA);
        orderRepository.saveAll(ordersTableB);

        // Cập nhật trạng thái bàn
        updateTableStatusAfterSwap(tableA, ordersTableB);
        updateTableStatusAfterSwap(tableB, ordersTableA);
    }

    private void updateTableStatusAfterSwap(DinningTable table, List<Order> orders) {
        // Nếu bàn không có đơn hàng hoặc chỉ có đơn hàng đã thanh toán, đặt trạng thái là AVAILABLE
        if (orders.isEmpty() || orders.stream().allMatch(order -> order.getPaymentStatus() == PaymentStatus.PAID)) {
            table.setTableStatus(TableStatus.AVAILABLE);
        } else {
            table.setTableStatus(TableStatus.OCCUPIED);
        }
        dinningTableRepository.save(table);
    }
}