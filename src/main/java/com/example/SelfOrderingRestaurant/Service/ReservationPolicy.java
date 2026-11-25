package com.example.SelfOrderingRestaurant.Service;

import com.example.SelfOrderingRestaurant.Entity.DinningTable;
import com.example.SelfOrderingRestaurant.Entity.Order;
import com.example.SelfOrderingRestaurant.Enum.OrderStatus;
import com.example.SelfOrderingRestaurant.Enum.TableStatus;
import com.example.SelfOrderingRestaurant.Exception.ValidationException;
import com.example.SelfOrderingRestaurant.Repository.DinningTableRepository;
import com.example.SelfOrderingRestaurant.Repository.OrderRepository;
import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Objects;

/**
 * Quy tắc của lịch hẹn (đơn có reservationTime): kiểm tra khi tạo và các bước chuyển trạng thái.
 * Dùng chung cho REST /api/reservations và đường cũ của app Flutter (POST /api/orders, GraphQL updateOrderStatus).
 */
@Component
public class ReservationPolicy {

    public static final List<OrderStatus> WAITING = List.of(OrderStatus.SCHEDULED, OrderStatus.CONFIRMED);

    static final Duration MIN_GAP = Duration.ofHours(2);
    static final Duration MAX_AHEAD = Duration.ofDays(30);
    private static final DateTimeFormatter TIME_FORMAT = DateTimeFormatter.ofPattern("HH:mm dd/MM");

    private final OrderRepository orderRepository;
    private final DinningTableRepository tableRepository;
    private final Clock clock;

    public ReservationPolicy(OrderRepository orderRepository, DinningTableRepository tableRepository, Clock clock) {
        this.orderRepository = orderRepository;
        this.tableRepository = tableRepository;
        this.clock = clock;
    }

    /** Lịch hẹn chưa nhận khách: không được tính là khách đang ngồi bàn. */
    public static boolean isAwaiting(Order order) {
        return order.getReservationTime() != null && WAITING.contains(order.getStatus());
    }

    public void validateNew(DinningTable table, LocalDateTime time, Integer guestCount, Integer excludeOrderId) {
        LocalDateTime now = LocalDateTime.now(clock);
        if (time == null || !time.isAfter(now)) {
            throw new ValidationException("Thời gian đặt bàn phải ở tương lai");
        }
        if (time.isAfter(now.plus(MAX_AHEAD))) {
            throw new ValidationException("Chỉ nhận đặt bàn trước tối đa 30 ngày");
        }
        validateFit(table, time, guestCount, excludeOrderId);
    }

    /** Sức chứa và trùng giờ: dùng cả khi xác nhận/đổi bàn, kể cả khi giờ hẹn đã qua (khách đến trễ). */
    void validateFit(DinningTable table, LocalDateTime time, Integer guestCount, Integer excludeOrderId) {
        if (guestCount != null && table.getCapacity() != null && guestCount > table.getCapacity()) {
            throw new ValidationException("Bàn " + table.getTableNumber() + " chỉ có " + table.getCapacity()
                    + " chỗ, không đủ cho " + guestCount + " khách");
        }
        orderRepository.findReservationsOnTableBetween(table.getTableNumber(), WAITING,
                        time.minus(MIN_GAP), time.plus(MIN_GAP)).stream()
                .filter(other -> !Objects.equals(other.getOrderId(), excludeOrderId))
                .findFirst()
                .ifPresent(other -> {
                    throw new ValidationException("Bàn " + table.getTableNumber() + " đã có lịch hẹn lúc "
                            + other.getReservationTime().format(TIME_FORMAT) + ", hãy chọn giờ hoặc bàn khác");
                });
    }

    public void confirm(Order order) {
        requireStatus(order, "xác nhận", OrderStatus.SCHEDULED);
        validateFit(order.getTables(), order.getReservationTime(), order.getGuestCount(), order.getOrderId());
        setStatus(order, OrderStatus.CONFIRMED);
    }

    public void reject(Order order) {
        requireStatus(order, "từ chối", OrderStatus.SCHEDULED);
        setStatus(order, OrderStatus.CANCELLED);
    }

    public void cancel(Order order) {
        requireStatus(order, "hủy", OrderStatus.SCHEDULED, OrderStatus.CONFIRMED);
        setStatus(order, OrderStatus.CANCELLED);
    }

    // Cho phép nhận khách thẳng từ SCHEDULED: app Flutter "duyệt" bằng cách chuyển sang PENDING
    public void checkIn(Order order) {
        requireStatus(order, "nhận khách cho", OrderStatus.SCHEDULED, OrderStatus.CONFIRMED);
        if (!order.getReservationTime().toLocalDate().equals(LocalDateTime.now(clock).toLocalDate())) {
            throw new ValidationException("Chỉ nhận khách vào đúng ngày hẹn ("
                    + order.getReservationTime().format(TIME_FORMAT) + ")");
        }
        DinningTable table = order.getTables();
        if (orderRepository.existsServingUnpaidOrderOnTable(table.getTableNumber(), order.getOrderId())) {
            throw new ValidationException("Bàn " + table.getTableNumber()
                    + " đang có khách, hãy đổi bàn cho lịch hẹn rồi nhận khách");
        }
        setStatus(order, OrderStatus.PENDING);
        table.setTableStatus(TableStatus.OCCUPIED);
        tableRepository.save(table);
    }

    public void changeTable(Order order, DinningTable newTable) {
        requireStatus(order, "đổi bàn cho", OrderStatus.SCHEDULED, OrderStatus.CONFIRMED);
        validateFit(newTable, order.getReservationTime(), order.getGuestCount(), order.getOrderId());
        order.setTables(newTable);
        orderRepository.save(order);
    }

    private void requireStatus(Order order, String action, OrderStatus... allowed) {
        if (order.getReservationTime() == null || !List.of(allowed).contains(order.getStatus())) {
            throw new ValidationException("Không thể " + action + " lịch hẹn ở trạng thái " + order.getStatus());
        }
    }

    private void setStatus(Order order, OrderStatus status) {
        order.setStatus(status);
        orderRepository.save(order);
    }
}
