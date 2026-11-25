package com.example.SelfOrderingRestaurant;

import com.example.SelfOrderingRestaurant.Dto.Request.OrderRequestDTO.OrderItemDTO;
import com.example.SelfOrderingRestaurant.Dto.Request.OrderRequestDTO.OrderRequestDTO;
import com.example.SelfOrderingRestaurant.Dto.Response.DinningTableResponseDTO.DinningTableResponseDTO;
import com.example.SelfOrderingRestaurant.Entity.*;
import com.example.SelfOrderingRestaurant.Enum.*;
import com.example.SelfOrderingRestaurant.Exception.ValidationException;
import com.example.SelfOrderingRestaurant.Repository.*;
import com.example.SelfOrderingRestaurant.Service.DinningTableService;
import com.example.SelfOrderingRestaurant.Service.OrderService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Date;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@SpringBootTest
@Transactional
public class ReservationOrderFlowIntegrationTest {

    private static final ZoneId ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    // "Bây giờ" trong test: 10:00 ngày 01/12/2026 giờ Việt Nam
    private static final LocalDateTime NOW = LocalDateTime.of(2026, 12, 1, 10, 0);

    @MockitoBean
    private Clock clock;

    @MockitoBean
    private StaffShiftRepository staffShiftRepository;

    @Autowired private OrderService orderService;
    @Autowired private DinningTableService dinningTableService;
    @Autowired private OrderRepository orderRepository;
    @Autowired private DinningTableRepository tableRepository;
    @Autowired private DishRepository dishRepository;
    @Autowired private CustomerRepository customerRepository;

    private DinningTable table901;
    private DinningTable table902;
    private Dish dish;

    @BeforeEach
    void setUp() {
        when(clock.getZone()).thenReturn(ZONE);
        when(clock.instant()).thenReturn(NOW.atZone(ZONE).toInstant());
        when(staffShiftRepository.findStaffOnCurrentShift(any(), any())).thenReturn(List.of());

        table901 = saveTable(901, 4);
        table902 = saveTable(902, 4);

        dish = new Dish();
        dish.setName("Phở Bò");
        dish.setPrice(BigDecimal.valueOf(50000));
        dish.setStatus(DishStatus.AVAILABLE);
        dishRepository.save(dish);
    }

    private DinningTable saveTable(int number, int capacity) {
        DinningTable t = new DinningTable();
        t.setTableNumber(number);
        t.setCapacity(capacity);
        t.setTableStatus(TableStatus.AVAILABLE);
        return tableRepository.save(t);
    }

    private OrderRequestDTO request(DinningTable table, LocalDateTime reservationTime) {
        OrderItemDTO item = new OrderItemDTO();
        item.setDishId(dish.getDishId());
        item.setQuantity(1);
        OrderRequestDTO r = new OrderRequestDTO();
        r.setTableId(table.getTableNumber());
        r.setCustomerName("Bà Lan");
        r.setItems(List.of(item));
        r.setReservationTime(reservationTime);
        return r;
    }

    /** Lưu trực tiếp một lịch hẹn ở trạng thái đã cho, bỏ qua kiểm tra. */
    private Order saveReservation(DinningTable table, OrderStatus status, LocalDateTime time) {
        Customer c = new Customer();
        c.setFullname("Khách hẹn");
        c.setPoints(0);
        customerRepository.save(c);
        Order o = new Order();
        o.setCustomer(c);
        o.setTables(table);
        o.setStatus(status);
        o.setPaymentStatus(PaymentStatus.UNPAID);
        o.setReservationTime(time);
        o.setGuestCount(2);
        o.setOrderDate(new Date());
        o.setTotalAmount(BigDecimal.ZERO);
        return orderRepository.save(o);
    }

    private DinningTableResponseDTO tableDto(int number) {
        return dinningTableService.getAllTables().stream()
                .filter(t -> t.getTable_id() == number).findFirst().orElseThrow();
    }

    @Test
    void reservation_doesNotLockTable_andSkipsShiftCheck() {
        Integer id = orderService.createOrder(request(table901, LocalDateTime.of(2026, 12, 2, 19, 0)));

        Order saved = orderRepository.findById(id).orElseThrow();
        assertEquals(OrderStatus.SCHEDULED, saved.getStatus());
        assertEquals(TableStatus.AVAILABLE, tableRepository.findById(901).orElseThrow().getTableStatus());
    }

    @Test
    void getAllTables_ignoresFutureReservation() {
        saveReservation(table901, OrderStatus.CONFIRMED, LocalDateTime.of(2026, 12, 2, 19, 0));

        assertEquals("AVAILABLE", tableDto(901).getStatus());
    }

    @Test
    void getAllTables_showsTodayConfirmedTime() {
        saveReservation(table902, OrderStatus.CONFIRMED, LocalDateTime.of(2026, 12, 1, 19, 0));
        saveReservation(table901, OrderStatus.CONFIRMED, LocalDateTime.of(2026, 12, 2, 19, 0));

        assertEquals("19:00", tableDto(902).getNextReservationTime());
        assertNull(tableDto(901).getNextReservationTime());
    }

    @Test
    void walkIn_doesNotMergeIntoReservation() {
        when(staffShiftRepository.findStaffOnCurrentShift(any(), any())).thenReturn(List.of(new Staff()));
        table901.setTableStatus(TableStatus.OCCUPIED);
        tableRepository.save(table901);
        Order reservation = saveReservation(table901, OrderStatus.CONFIRMED, LocalDateTime.of(2026, 12, 1, 19, 0));

        Integer walkInId = orderService.createOrder(request(table901, null));

        assertNotEquals(reservation.getOrderId(), walkInId);
        assertEquals(OrderStatus.PENDING, orderRepository.findById(walkInId).orElseThrow().getStatus());
    }

    @Test
    void payment_tableFreedDespiteFutureReservation() {
        saveReservation(table901, OrderStatus.CONFIRMED, LocalDateTime.of(2026, 12, 1, 19, 0));

        assertFalse(orderRepository.existsByTablesTableNumberAndPaymentStatus(901, PaymentStatus.UNPAID));
        assertEquals(0, orderRepository.countActiveOrdersByTableId(901));
    }

    @Test
    @WithMockUser(roles = "STAFF")
    void graphqlStatusPending_onReservation_checksIn() {
        Order o = saveReservation(table901, OrderStatus.SCHEDULED, LocalDateTime.of(2026, 12, 1, 19, 0));

        orderService.updateOrderStatus(o.getOrderId(), "PENDING");

        assertEquals(OrderStatus.PENDING, orderRepository.findById(o.getOrderId()).orElseThrow().getStatus());
        assertEquals(TableStatus.OCCUPIED, tableRepository.findById(901).orElseThrow().getTableStatus());
    }

    @Test
    @WithMockUser(roles = "STAFF")
    void graphqlStatusCompleted_onReservation_rejected() {
        Order o = saveReservation(table901, OrderStatus.CONFIRMED, LocalDateTime.of(2026, 12, 2, 19, 0));

        assertThrows(ValidationException.class, () -> orderService.updateOrderStatus(o.getOrderId(), "COMPLETED"));
    }
}
