package com.example.SelfOrderingRestaurant.Service;

import com.example.SelfOrderingRestaurant.Dto.Request.OrderRequestDTO.OrderItemDTO;
import com.example.SelfOrderingRestaurant.Dto.Request.OrderRequestDTO.OrderRequestDTO;
import com.example.SelfOrderingRestaurant.Dto.Request.ReservationRequestDTO.ReservationRequestDTO;
import com.example.SelfOrderingRestaurant.Dto.Response.ReservationResponseDTO.PublicTableDTO;
import com.example.SelfOrderingRestaurant.Dto.Response.ReservationResponseDTO.ReservationResponseDTO;
import com.example.SelfOrderingRestaurant.Entity.DinningTable;
import com.example.SelfOrderingRestaurant.Entity.Order;
import com.example.SelfOrderingRestaurant.Enum.OrderStatus;
import com.example.SelfOrderingRestaurant.Exception.ResourceNotFoundException;
import com.example.SelfOrderingRestaurant.Exception.ValidationException;
import com.example.SelfOrderingRestaurant.Repository.CustomerRepository;
import com.example.SelfOrderingRestaurant.Repository.DinningTableRepository;
import com.example.SelfOrderingRestaurant.Repository.OrderItemRepository;
import com.example.SelfOrderingRestaurant.Repository.OrderRepository;
import com.example.SelfOrderingRestaurant.Security.SecurityUtils;
import com.example.SelfOrderingRestaurant.Service.Imp.IReservationService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;

@Service
public class ReservationService implements IReservationService {

    private final OrderService orderService;
    private final ReservationPolicy reservationPolicy;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final DinningTableRepository tableRepository;
    private final CustomerRepository customerRepository;
    private final SecurityUtils securityUtils;

    public ReservationService(OrderService orderService, ReservationPolicy reservationPolicy,
                              OrderRepository orderRepository, OrderItemRepository orderItemRepository,
                              DinningTableRepository tableRepository, CustomerRepository customerRepository,
                              SecurityUtils securityUtils) {
        this.orderService = orderService;
        this.reservationPolicy = reservationPolicy;
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.tableRepository = tableRepository;
        this.customerRepository = customerRepository;
        this.securityUtils = securityUtils;
    }

    @Override
    @Transactional
    public ReservationResponseDTO createByCustomer(ReservationRequestDTO request) {
        OrderRequestDTO orderRequest = toOrderRequest(request);
        // Khách đã đăng nhập thì gắn lịch hẹn vào tài khoản để hiện trong lịch sử
        if (securityUtils.isCustomer()) {
            customerRepository.findByUserUsername(securityUtils.getCurrentUsername())
                    .ifPresent(customer -> orderRequest.setCustomerId(customer.getCustomerId()));
        }
        return toResponse(load(orderService.createReservationOrder(orderRequest, OrderStatus.SCHEDULED)));
    }

    @Override
    @Transactional
    public ReservationResponseDTO createManual(ReservationRequestDTO request) {
        return toResponse(load(orderService.createReservationOrder(toOrderRequest(request), OrderStatus.CONFIRMED)));
    }

    @Override
    public List<PublicTableDTO> getPublicTables() {
        return tableRepository.findAll().stream()
                .sorted(Comparator.comparing(DinningTable::getTableNumber))
                .map(table -> new PublicTableDTO(table.getTableNumber(), table.getCapacity()))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReservationResponseDTO> list(LocalDate date, OrderStatus status) {
        return orderRepository.findByReservationTimeIsNotNullOrderByReservationTimeAsc().stream()
                .filter(order -> date == null || order.getReservationTime().toLocalDate().equals(date))
                .filter(order -> status == null || order.getStatus() == status)
                .map(this::toResponse)
                .toList();
    }

    // Các bước chuyển trạng thái đi qua OrderService.updateOrderStatus để giữ thông báo WebSocket như cũ
    @Override
    @Transactional
    public ReservationResponseDTO confirm(Integer orderId) {
        return transition(orderId, OrderStatus.CONFIRMED);
    }

    @Override
    @Transactional
    public ReservationResponseDTO reject(Integer orderId) {
        Order order = loadAwaiting(orderId);
        reservationPolicy.reject(order);
        return toResponse(order);
    }

    @Override
    @Transactional
    public ReservationResponseDTO checkIn(Integer orderId) {
        return transition(orderId, OrderStatus.PENDING);
    }

    @Override
    @Transactional
    public ReservationResponseDTO cancel(Integer orderId) {
        return transition(orderId, OrderStatus.CANCELLED);
    }

    @Override
    @Transactional
    public ReservationResponseDTO changeTable(Integer orderId, Integer tableId) {
        Order order = loadAwaiting(orderId);
        DinningTable table = tableRepository.findById(tableId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bàn " + tableId));
        reservationPolicy.changeTable(order, table);
        return toResponse(order);
    }

    private ReservationResponseDTO transition(Integer orderId, OrderStatus target) {
        loadAwaiting(orderId);
        orderService.updateOrderStatus(orderId, target.name());
        return toResponse(load(orderId));
    }

    private Order load(Integer orderId) {
        return orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lịch hẹn #" + orderId));
    }

    /** Lịch hẹn chưa nhận khách; đơn thường hoặc lịch đã xử lý xong thì báo lỗi. */
    private Order loadAwaiting(Integer orderId) {
        Order order = load(orderId);
        if (order.getReservationTime() == null) {
            throw new ValidationException("Đơn #" + orderId + " không phải lịch hẹn");
        }
        if (!ReservationPolicy.isAwaiting(order)) {
            throw new ValidationException("Lịch hẹn #" + orderId + " đã được xử lý (" + order.getStatus() + ")");
        }
        return order;
    }

    private OrderRequestDTO toOrderRequest(ReservationRequestDTO request) {
        OrderRequestDTO orderRequest = new OrderRequestDTO();
        orderRequest.setCustomerName(request.getCustomerName().trim());
        orderRequest.setContactPhone(normalizePhone(request.getContactPhone()));
        orderRequest.setGuestCount(request.getGuestCount());
        orderRequest.setTableId(request.getTableId());
        orderRequest.setReservationTime(request.getReservationTime());
        orderRequest.setNotes(request.getNotes());
        orderRequest.setItems(request.getItems() != null ? request.getItems() : List.of());
        return orderRequest;
    }

    static String normalizePhone(String phone) {
        String digits = phone == null ? "" : phone.replaceAll("\\D", "");
        if (digits.length() < 9 || digits.length() > 11) {
            throw new ValidationException("Số điện thoại không hợp lệ");
        }
        return digits;
    }

    private ReservationResponseDTO toResponse(Order order) {
        List<OrderItemDTO> items = orderItemRepository.findByOrder(order).stream()
                .map(item -> {
                    OrderItemDTO dto = new OrderItemDTO();
                    dto.setDishId(item.getId().getDishId());
                    dto.setDishName(item.getDish().getName());
                    dto.setQuantity(item.getQuantity());
                    dto.setPrice(item.getUnitPrice() != null ? item.getUnitPrice() : item.getDish().getPrice());
                    dto.setNotes(item.getNotes());
                    dto.setStatus(item.getStatus() != null ? item.getStatus().name() : null);
                    return dto;
                })
                .toList();
        DinningTable table = order.getTables();
        return new ReservationResponseDTO(
                order.getOrderId(),
                order.getCustomer() != null ? order.getCustomer().getFullname() : null,
                order.getContactPhone(),
                order.getGuestCount(),
                table != null ? table.getTableNumber() : null,
                table != null ? table.getCapacity() : null,
                order.getReservationTime(),
                order.getStatus().name(),
                order.getNotes(),
                order.getTotalAmount(),
                items
        );
    }
}
