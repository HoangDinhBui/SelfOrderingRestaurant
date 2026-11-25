package com.example.SelfOrderingRestaurant;

import com.example.SelfOrderingRestaurant.Entity.Customer;
import com.example.SelfOrderingRestaurant.Entity.DinningTable;
import com.example.SelfOrderingRestaurant.Entity.Order;
import com.example.SelfOrderingRestaurant.Enum.OrderStatus;
import com.example.SelfOrderingRestaurant.Enum.PaymentStatus;
import com.example.SelfOrderingRestaurant.Enum.TableStatus;
import com.example.SelfOrderingRestaurant.Repository.CustomerRepository;
import com.example.SelfOrderingRestaurant.Repository.DinningTableRepository;
import com.example.SelfOrderingRestaurant.Repository.OrderRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

import static org.hamcrest.Matchers.hasItem;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
public class ReservationApiIntegrationTest {

    private static final ZoneId ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final LocalDateTime NOW = LocalDateTime.of(2026, 12, 1, 10, 0);

    @MockitoBean
    private Clock clock;

    @Autowired private MockMvc mvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private DinningTableRepository tableRepository;
    @Autowired private OrderRepository orderRepository;
    @Autowired private CustomerRepository customerRepository;

    @BeforeEach
    void setUp() {
        when(clock.getZone()).thenReturn(ZONE);
        when(clock.instant()).thenReturn(NOW.atZone(ZONE).toInstant());
        saveTable(903, 4);
        saveTable(904, 6);
    }

    private void saveTable(int number, int capacity) {
        DinningTable t = new DinningTable();
        t.setTableNumber(number);
        t.setCapacity(capacity);
        t.setTableStatus(TableStatus.AVAILABLE);
        tableRepository.save(t);
    }

    private Map<String, Object> body(String time) {
        Map<String, Object> b = new HashMap<>();
        b.put("customerName", "Ông Tư");
        b.put("contactPhone", "0982774889");
        b.put("guestCount", 2);
        b.put("tableId", 903);
        b.put("reservationTime", time);
        b.put("notes", "Ghế gần cửa sổ");
        return b;
    }

    private ResultActions post(String url, Object body) throws Exception {
        return mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post(url)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)));
    }

    private Integer createdId(ResultActions result) throws Exception {
        String json = result.andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(json).get("orderId").asInt();
    }

    @Test
    void create_public_returnsScheduled() throws Exception {
        post("/api/reservations", body("2026-12-02T19:00:00"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SCHEDULED"))
                .andExpect(jsonPath("$.guestCount").value(2))
                .andExpect(jsonPath("$.tableNumber").value(903));
    }

    @Test
    void create_phoneNormalized() throws Exception {
        Map<String, Object> b = body("2026-12-02T19:00:00");
        b.put("contactPhone", "0982 774.889");
        post("/api/reservations", b)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.contactPhone").value("0982774889"));
    }

    @Test
    void create_duplicateSameSlot_rejected() throws Exception {
        post("/api/reservations", body("2026-12-02T19:00:00")).andExpect(status().isOk());
        post("/api/reservations", body("2026-12-02T19:00:00")).andExpect(status().isBadRequest());
    }

    @Test
    void create_missingPhone_400() throws Exception {
        Map<String, Object> b = body("2026-12-02T19:00:00");
        b.remove("contactPhone");
        post("/api/reservations", b).andExpect(status().isBadRequest());
    }

    @Test
    void tables_public_listsNumberAndCapacity() throws Exception {
        mvc.perform(get("/api/reservations/tables"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.tableNumber == 903)].capacity").value(hasItem(4)))
                .andExpect(jsonPath("$[0].status").doesNotExist());
    }

    @Test
    void list_requiresStaff() throws Exception {
        mvc.perform(get("/api/reservations")).andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(roles = "CUSTOMER")
    void list_customerForbidden() throws Exception {
        mvc.perform(get("/api/reservations")).andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "STAFF")
    void manual_asStaff_returnsConfirmed() throws Exception {
        post("/api/reservations/manual", body("2026-12-02T19:00:00"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CONFIRMED"));

        mvc.perform(get("/api/reservations").param("date", "2026-12-02"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.tableNumber == 903)].customerName").value(hasItem("Ông Tư")));
    }

    @Test
    @WithMockUser(roles = "STAFF")
    void lifecycle_confirmCheckIn() throws Exception {
        Integer id = createdId(post("/api/reservations", body("2026-12-01T19:00:00")).andExpect(status().isOk()));

        mvc.perform(put("/api/reservations/{id}/confirm", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CONFIRMED"));
        mvc.perform(put("/api/reservations/{id}/check-in", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PENDING"));
        mvc.perform(put("/api/reservations/{id}/confirm", id))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(roles = "STAFF")
    void checkIn_whenScheduledOnOtherDay_400() throws Exception {
        Integer id = createdId(post("/api/reservations", body("2026-12-02T19:00:00")).andExpect(status().isOk()));

        mvc.perform(put("/api/reservations/{id}/check-in", id)).andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(roles = "STAFF")
    void changeTable_asStaff_movesReservation() throws Exception {
        Integer id = createdId(post("/api/reservations", body("2026-12-02T19:00:00")).andExpect(status().isOk()));

        mvc.perform(put("/api/reservations/{id}/table", id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"tableId\":904}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tableNumber").value(904));
    }

    @Test
    @WithMockUser(roles = "STAFF")
    void action_onNonReservation_400() throws Exception {
        Customer c = new Customer();
        c.setFullname("Khách vãng lai");
        c.setPoints(0);
        customerRepository.save(c);
        Order walkIn = new Order();
        walkIn.setCustomer(c);
        walkIn.setTables(tableRepository.findById(903).orElseThrow());
        walkIn.setStatus(OrderStatus.PENDING);
        walkIn.setPaymentStatus(PaymentStatus.UNPAID);
        walkIn.setOrderDate(new Date());
        walkIn.setTotalAmount(BigDecimal.ZERO);
        orderRepository.save(walkIn);

        mvc.perform(put("/api/reservations/{id}/confirm", walkIn.getOrderId()))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(roles = "STAFF")
    void checkIn_scheduledToday_400() throws Exception {
        Integer id = createdId(post("/api/reservations", body("2026-12-01T19:00:00")).andExpect(status().isOk()));

        mvc.perform(put("/api/reservations/{id}/check-in", id)).andExpect(status().isBadRequest());
    }
}
