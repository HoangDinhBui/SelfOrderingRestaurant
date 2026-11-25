package com.example.SelfOrderingRestaurant.Service;

import com.example.SelfOrderingRestaurant.Entity.DinningTable;
import com.example.SelfOrderingRestaurant.Entity.Order;
import com.example.SelfOrderingRestaurant.Enum.OrderStatus;
import com.example.SelfOrderingRestaurant.Enum.PaymentStatus;
import com.example.SelfOrderingRestaurant.Enum.TableStatus;
import com.example.SelfOrderingRestaurant.Exception.ValidationException;
import com.example.SelfOrderingRestaurant.Repository.DinningTableRepository;
import com.example.SelfOrderingRestaurant.Repository.OrderRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class ReservationPolicyTest {

    private static final ZoneId ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private OrderRepository orderRepository;
    private DinningTableRepository tableRepository;
    private DinningTable table;

    @BeforeEach
    void setUp() {
        orderRepository = mock(OrderRepository.class);
        tableRepository = mock(DinningTableRepository.class);
        when(orderRepository.findReservationsOnTableBetween(anyInt(), anyList(), any(), any())).thenReturn(List.of());
        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> inv.getArgument(0));
        table = table(901, 4);
    }

    private static DinningTable table(int number, int capacity) {
        DinningTable t = new DinningTable();
        t.setTableNumber(number);
        t.setCapacity(capacity);
        t.setTableStatus(TableStatus.AVAILABLE);
        return t;
    }

    /** Policy với đồng hồ cố định tại thời điểm giờ Việt Nam đã cho. */
    private ReservationPolicy policyAt(LocalDateTime vnNow) {
        Clock clock = Clock.fixed(vnNow.atZone(ZONE).toInstant(), ZONE);
        return new ReservationPolicy(orderRepository, tableRepository, clock);
    }

    private ReservationPolicy policy() {
        return policyAt(LocalDateTime.of(2026, 12, 1, 10, 0));
    }

    private Order reservation(int id, OrderStatus status, LocalDateTime time, DinningTable t) {
        Order o = new Order();
        o.setOrderId(id);
        o.setStatus(status);
        o.setReservationTime(time);
        o.setTables(t);
        o.setGuestCount(2);
        o.setPaymentStatus(PaymentStatus.UNPAID);
        return o;
    }

    @Test
    void validateNew_pastTime_rejected() {
        assertThrows(ValidationException.class,
                () -> policy().validateNew(table, LocalDateTime.of(2026, 12, 1, 9, 0), 2, null));
    }

    @Test
    void validateNew_beyond30Days_rejected() {
        assertThrows(ValidationException.class,
                () -> policy().validateNew(table, LocalDateTime.of(2026, 12, 31, 10, 1), 2, null));
        assertDoesNotThrow(() -> policy().validateNew(table, LocalDateTime.of(2026, 12, 31, 9, 59), 2, null));
    }

    @Test
    void validateNew_overCapacity_rejected() {
        ValidationException ex = assertThrows(ValidationException.class,
                () -> policy().validateNew(table, LocalDateTime.of(2026, 12, 2, 19, 0), 5, null));
        assertTrue(ex.getMessage().contains("4"), ex.getMessage());
    }

    @Test
    void validateNew_overlapWithin2h_rejected() {
        LocalDateTime t = LocalDateTime.of(2026, 12, 2, 18, 0);
        Order other = reservation(77, OrderStatus.CONFIRMED, LocalDateTime.of(2026, 12, 2, 19, 0), table);
        when(orderRepository.findReservationsOnTableBetween(eq(901), eq(ReservationPolicy.WAITING),
                eq(t.minusHours(2)), eq(t.plusHours(2)))).thenReturn(List.of(other));

        ValidationException ex = assertThrows(ValidationException.class,
                () -> policy().validateNew(table, t, 2, null));
        assertTrue(ex.getMessage().contains("19:00"), ex.getMessage());
    }

    @Test
    void validateNew_excludesSelf() {
        LocalDateTime t = LocalDateTime.of(2026, 12, 2, 19, 0);
        Order self = reservation(77, OrderStatus.CONFIRMED, t, table);
        when(orderRepository.findReservationsOnTableBetween(anyInt(), anyList(), any(), any())).thenReturn(List.of(self));

        assertDoesNotThrow(() -> policy().validateNew(table, t, 2, 77));
    }

    @Test
    void checkIn_onReservationDay_setsPendingAndOccupied() {
        Order o = reservation(10, OrderStatus.CONFIRMED, LocalDateTime.of(2026, 12, 1, 19, 0), table);

        policy().checkIn(o);

        assertEquals(OrderStatus.PENDING, o.getStatus());
        assertEquals(TableStatus.OCCUPIED, table.getTableStatus());
        verify(tableRepository).save(table);
    }

    @Test
    void checkIn_otherDay_rejected() {
        Order o = reservation(10, OrderStatus.CONFIRMED, LocalDateTime.of(2026, 12, 2, 19, 0), table);
        assertThrows(ValidationException.class, () -> policy().checkIn(o));
        assertEquals(OrderStatus.CONFIRMED, o.getStatus());
    }

    @Test
    void checkIn_onReservationDayAfterMidnight_allowed() {
        LocalDateTime time = LocalDateTime.of(2026, 12, 2, 0, 30);
        Order before = reservation(10, OrderStatus.CONFIRMED, time, table);
        assertThrows(ValidationException.class,
                () -> policyAt(LocalDateTime.of(2026, 12, 1, 23, 50)).checkIn(before));

        Order after = reservation(11, OrderStatus.CONFIRMED, time, table);
        policyAt(LocalDateTime.of(2026, 12, 2, 0, 5)).checkIn(after);
        assertEquals(OrderStatus.PENDING, after.getStatus());
    }

    @Test
    void checkIn_tableBusy_rejected() {
        Order o = reservation(10, OrderStatus.CONFIRMED, LocalDateTime.of(2026, 12, 1, 19, 0), table);
        when(orderRepository.existsServingUnpaidOrderOnTable(901, 10)).thenReturn(true);

        ValidationException ex = assertThrows(ValidationException.class, () -> policy().checkIn(o));
        assertEquals("Bàn 901 đang có khách, hãy đổi bàn cho lịch hẹn rồi nhận khách", ex.getMessage());
    }

    @Test
    void confirm_fromScheduled_ok() {
        Order o = reservation(10, OrderStatus.SCHEDULED, LocalDateTime.of(2026, 12, 2, 19, 0), table);
        policy().confirm(o);
        assertEquals(OrderStatus.CONFIRMED, o.getStatus());
    }

    @Test
    void confirm_fromConfirmed_rejected() {
        Order o = reservation(10, OrderStatus.CONFIRMED, LocalDateTime.of(2026, 12, 2, 19, 0), table);
        assertThrows(ValidationException.class, () -> policy().confirm(o));
    }

    @Test
    void reject_fromConfirmed_rejected() {
        Order o = reservation(10, OrderStatus.CONFIRMED, LocalDateTime.of(2026, 12, 2, 19, 0), table);
        assertThrows(ValidationException.class, () -> policy().reject(o));
    }

    @Test
    void reject_fromScheduled_cancels() {
        Order o = reservation(10, OrderStatus.SCHEDULED, LocalDateTime.of(2026, 12, 2, 19, 0), table);
        policy().reject(o);
        assertEquals(OrderStatus.CANCELLED, o.getStatus());
    }

    @Test
    void cancel_fromPending_rejected() {
        Order o = reservation(10, OrderStatus.PENDING, LocalDateTime.of(2026, 12, 1, 19, 0), table);
        assertThrows(ValidationException.class, () -> policy().cancel(o));
    }

    @Test
    void changeTable_sameTable_noSelfConflict() {
        LocalDateTime t = LocalDateTime.of(2026, 12, 2, 19, 0);
        Order o = reservation(10, OrderStatus.CONFIRMED, t, table);
        when(orderRepository.findReservationsOnTableBetween(anyInt(), anyList(), any(), any())).thenReturn(List.of(o));

        policy().changeTable(o, table);

        assertSame(table, o.getTables());
    }

    @Test
    void changeTable_tooSmall_rejected() {
        Order o = reservation(10, OrderStatus.CONFIRMED, LocalDateTime.of(2026, 12, 2, 19, 0), table);
        o.setGuestCount(3);
        DinningTable small = table(902, 2);

        assertThrows(ValidationException.class, () -> policy().changeTable(o, small));
        assertSame(table, o.getTables());
    }

    @Test
    void changeTable_afterCheckIn_rejected() {
        Order o = reservation(10, OrderStatus.PENDING, LocalDateTime.of(2026, 12, 1, 19, 0), table);
        assertThrows(ValidationException.class, () -> policy().changeTable(o, table(902, 4)));
    }
}
