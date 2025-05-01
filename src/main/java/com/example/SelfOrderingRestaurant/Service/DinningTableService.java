package com.example.SelfOrderingRestaurant.Service;

import com.example.SelfOrderingRestaurant.Dto.Response.DinningTableResponseDTO.DinningTableResponseDTO;
import com.example.SelfOrderingRestaurant.Entity.DinningTable;
import com.example.SelfOrderingRestaurant.Entity.Order;
import com.example.SelfOrderingRestaurant.Enum.PaymentStatus;
import com.example.SelfOrderingRestaurant.Enum.TableStatus;
import com.example.SelfOrderingRestaurant.Repository.DinningTableRepository;
import com.example.SelfOrderingRestaurant.Repository.OrderRepository;
import com.example.SelfOrderingRestaurant.Service.Imp.IDinningTableService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class DinningTableService implements IDinningTableService {

    private final DinningTableRepository dinningTableRepository;
    private final OrderRepository orderRepository;

    public DinningTableService(DinningTableRepository dinningTableRepository, OrderRepository orderRepository) {
        this.dinningTableRepository = dinningTableRepository;
        this.orderRepository = orderRepository;
    }

    @Transactional
    @Override
    public List<DinningTableResponseDTO> getAllTables() {
        return dinningTableRepository.findAll().stream()
                .map(table -> {
                    // Lấy danh sách đơn hàng
                    List<Order> tableOrders = orderRepository.findByTableNumber(table.getTableNumber());

                    // Tính trạng thái
                    TableStatus status;
                    if (tableOrders.isEmpty()) {
                        status = TableStatus.AVAILABLE;
                    } else if (tableOrders.size() == 1 && PaymentStatus.PAID.name().equals(tableOrders.get(0).getPaymentStatus())) {
                        status = TableStatus.AVAILABLE;
                    } else {
                        status = TableStatus.OCCUPIED;
                    }

                    // Cập nhật trạng thái nếu khác
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
}