# Đặt bàn trước, Quản lý lịch hẹn, Đặt món thủ công — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Khách đặt bàn trước qua web. Staff/Admin quản lý lịch hẹn (duyệt, từ chối, nhận khách, hủy, đổi bàn, tự nhập). Đặt món thủ công dùng dữ liệu thật.

**Architecture:** Lịch hẹn vẫn là một `Order` có `reservationTime`. Có thêm trạng thái `CONFIRMED` và hai cột `contactPhone`, `guestCount`. Mọi quy tắc của lịch hẹn (kiểm tra khi tạo, chuyển trạng thái, đổi bàn) nằm trong `ReservationPolicy`, chỉ phụ thuộc repository + `Clock`. Cả `OrderService` (đường cũ `POST /api/orders` và GraphQL `updateOrderStatus` mà app Flutter dùng) lẫn `ReservationService` mới (REST `/api/reservations`) đều đi qua nó. Frontend lọc các đơn hẹn chưa nhận khách khỏi bếp và sơ đồ bàn.

**Tech Stack:** Spring Boot 3.4.3, JPA, JUnit 5 + Mockito + `@MockitoBean`, H2 khi test. React 19 + Vite + Tailwind + axios.

**Spec:** `docs/superpowers/specs/2026-11-25-reservation-and-manual-order-design.md`

## Global Constraints

- Thời gian luôn lấy từ bean `java.time.Clock` (giờ `Asia/Ho_Chi_Minh`), không gọi `LocalDateTime.now()` trần.
- `reservationTime` phải ở tương lai và ≤ 30 ngày tính từ bây giờ.
- Chống trùng: cùng bàn, lịch `SCHEDULED`/`CONFIRMED` khác trong khoảng **±2 giờ** → từ chối.
- `guestCount` (nếu có) ≤ `DinningTable.capacity`.
- Tạo lịch hẹn **không** đổi trạng thái bàn và **không** kiểm tra "có nhân viên trong ca".
- Khách tự đặt → `SCHEDULED`. Nhân viên đặt thủ công → `CONFIRMED`.
- Nhận khách: chỉ đúng **ngày hẹn**, và bàn không có đơn đang phục vụ chưa thanh toán. Sai thì 400 với thông báo: `Bàn {n} đang có khách, hãy đổi bàn cho lịch hẹn rồi nhận khách`.
- Mọi lỗi nghiệp vụ ném `ValidationException` (đã map sang 400) với thông báo tiếng Việt.
- Hai cột mới nullable. Không thêm thư viện mới (backend lẫn frontend).
- Giữ tương thích app Flutter: `POST /api/orders` có `reservationTime` → `SCHEDULED`. GraphQL `updateOrderStatus(PENDING)` trên lịch hẹn = nhận khách.
- UI không dùng `window.alert/confirm`. Dùng modal hoặc toast trong trang.
- Trong integration test, dùng số bàn ≥ 900 để không đụng dữ liệu seed.

## Review Focus

1. **Lịch hẹn qua nửa đêm hoặc sát giờ:** đặt 23:30 cho 00:30 hôm sau phải hợp lệ. "Đúng ngày hẹn" so theo ngày của `reservationTime`, không theo ngày tạo. → test `checkIn_onReservationDayAfterMidnight_allowed` (Task 1).
2. **Đổi bàn sang chính bàn hiện tại hoặc bàn quá nhỏ:** lịch hẹn không được tự trùng với chính nó. Bàn nhỏ hơn số khách phải bị từ chối. → `changeTable_sameTable_noSelfConflict`, `changeTable_tooSmall_rejected` (Task 1).
3. **Thanh toán xong đơn tại chỗ trên bàn có lịch hẹn tối nay:** bàn phải về `AVAILABLE`, không bị kẹt `OCCUPIED`. → `payment_tableFreedDespiteFutureReservation` (Task 2).
4. **Số điện thoại có khoảng trắng hoặc dấu chấm** (`0982 774 889`, `0982.774.889`): được chấp nhận và lưu dạng chỉ có chữ số. → `create_phoneNormalized` (Task 3).
5. **Gửi hai lần liền tay** (double-click "Xác nhận đặt bàn"): nút bị khóa khi đang gửi. Backend có lần thứ hai thì báo trùng giờ chứ không tạo hai lịch. → `create_duplicateSameSlot_rejected` (Task 3), cùng với việc khóa nút ở Task 6/7.

---

## File Structure

Backend (`src/main/java/com/example/SelfOrderingRestaurant/`):
- `Enum/OrderStatus.java`: thêm `CONFIRMED`.
- `Entity/Order.java`: thêm `contactPhone`, `guestCount`.
- `Repository/OrderRepository.java`: thêm query lịch hẹn. Sửa các query "đơn đang phục vụ" để loại đơn hẹn.
- `Service/ReservationPolicy.java` (mới): quy tắc và chuyển trạng thái.
- `Service/OrderService.java`: đường tạo lịch hẹn, gộp đơn, `updateOrderStatus` cho lịch hẹn.
- `Service/DinningTableService.java`: `getAllTables` bỏ qua đơn hẹn, trả `nextReservationTime`.
- `Dto/Response/DinningTableResponseDTO/DinningTableResponseDTO.java`: thêm `nextReservationTime`.
- `Dto/Request/OrderRequestDTO/OrderRequestDTO.java`: thêm `contactPhone`, `guestCount`.
- `Dto/Request/ReservationRequestDTO/ReservationRequestDTO.java`, `ChangeTableRequestDTO.java` (mới).
- `Dto/Response/ReservationResponseDTO/ReservationResponseDTO.java`, `PublicTableDTO.java` (mới).
- `Service/Imp/IReservationService.java`, `Service/ReservationService.java`, `Controller/ReservationController.java` (mới).
- `Config/SecurityConfig.java`: rule cho `/api/reservations/**`.

Test (`src/test/java/com/example/SelfOrderingRestaurant/`):
- `Service/ReservationPolicyTest.java` (unit, Mockito, `Clock.fixed`).
- `ReservationOrderFlowIntegrationTest.java` (`@SpringBootTest @Transactional`, `@MockitoBean Clock`).
- `ReservationApiIntegrationTest.java` (`@SpringBootTest @AutoConfigureMockMvc`, có security).

Frontend (`frontend/src/`):
- `utils/reservation.js` (mới): helper lọc và định dạng.
- `services/reservationAPI.js` (mới): gọi API.
- `components/reservation/ReservationForm.jsx` (mới): form dùng chung cho khách và nhân viên.
- `components/reservation/ReservationManager.jsx` (chuyển từ `pages/Admin/TableManagement/ReservationModal.jsx`).
- `components/order/ManualOrderModal.jsx` (chuyển từ `pages/Admin/TableManagement/ManualOrderModal.jsx`).
- `pages/Customer/Reservation/Reservation.jsx` (mới), `pages/Customer/Home/Home.jsx`, `App.jsx`.
- `pages/Admin/TableManagement/TableManagement.jsx`, `pages/Staff/TableManagement/TableManagement.jsx`, `pages/Staff/DishManagement/DishManagement.jsx`.
- Xóa `pages/Staff/TableManagement/QuickOrderModal.jsx`.

---

### Task 1: Mô hình dữ liệu + `ReservationPolicy`

**Files:**
- Modify: `Enum/OrderStatus.java`, `Entity/Order.java`, `Repository/OrderRepository.java`
- Create: `Service/ReservationPolicy.java`
- Test: `src/test/.../Service/ReservationPolicyTest.java`

**Interfaces:**
- Produces:
  - `OrderStatus.CONFIRMED`
  - `Order.contactPhone: String` (`@Column(name="contact_phone", length=20)`), `Order.guestCount: Integer` (`@Column(name="guest_count")`)
  - `OrderRepository.findReservationsOnTableBetween(Integer tableNumber, List<OrderStatus> statuses, LocalDateTime from, LocalDateTime to): List<Order>`
  - `OrderRepository.findByReservationTimeIsNotNullOrderByReservationTimeAsc(): List<Order>`
  - `OrderRepository.existsServingUnpaidOrderOnTable(Integer tableNumber, Integer excludeOrderId): boolean`: đơn `UNPAID`, status ∉ {CANCELLED, SCHEDULED, CONFIRMED, COMPLETED}, `orderId <> excludeOrderId`.
  - `ReservationPolicy` (`@Component`, constructor `(OrderRepository, DinningTableRepository, Clock)`):
    - `static final List<OrderStatus> WAITING = List.of(SCHEDULED, CONFIRMED)`
    - `static boolean isAwaiting(Order o)`: `reservationTime != null && WAITING.contains(status)`
    - `void validateNew(DinningTable table, LocalDateTime time, Integer guestCount, Integer excludeOrderId)`
    - `void confirm(Order o)`: SCHEDULED → CONFIRMED, kiểm tra lại trùng giờ (exclude chính nó)
    - `void reject(Order o)`: SCHEDULED → CANCELLED
    - `void cancel(Order o)`: SCHEDULED|CONFIRMED → CANCELLED
    - `void checkIn(Order o)`: SCHEDULED|CONFIRMED → PENDING, bàn → `OCCUPIED` (lưu bàn)
    - `void changeTable(Order o, DinningTable newTable)`: chỉ khi `isAwaiting`, chạy `validateNew(newTable, o.reservationTime, o.guestCount, o.orderId)` rồi set bàn
  - Các hàm chuyển trạng thái chỉ set field và lưu bằng `orderRepository.save`. Sai trạng thái nguồn → `ValidationException("Không thể {hành động} lịch hẹn ở trạng thái {status}")`.

Cho phép nhận khách thẳng từ `SCHEDULED` để giữ hành vi của app Flutter (duyệt = nhận khách).

- [ ] **Step 1: Viết test thất bại** `ReservationPolicyTest`. Dùng `Clock.fixed(Instant.parse("2026-12-01T03:00:00Z"), ZoneId.of("Asia/Ho_Chi_Minh"))`, tức 10:00 ngày 01/12 giờ VN. Mock hai repository. Bàn số 901, sức chứa 4. Các test:
  - `validateNew_pastTime_rejected`: time = 01/12 09:00 → `ValidationException`.
  - `validateNew_beyond30Days_rejected`: time = 31/12 10:01 → exception. 31/12 09:59 → OK.
  - `validateNew_overCapacity_rejected`: guestCount 5 → exception có chứa `"4"`.
  - `validateNew_overlapWithin2h_rejected`: `findReservationsOnTableBetween(901, WAITING, t-2h, t+2h)` trả về một đơn khác → exception có chứa giờ `"19:00"` của đơn trùng.
  - `validateNew_excludesSelf`: trả về đơn có id = excludeOrderId → không ném.
  - `checkIn_onReservationDay_setsPendingAndOccupied`: đơn CONFIRMED 01/12 19:00 → status PENDING, bàn OCCUPIED, `tableRepository.save` được gọi.
  - `checkIn_otherDay_rejected`: đơn 02/12 19:00 → exception.
  - `checkIn_onReservationDayAfterMidnight_allowed`: clock 01/12 23:50, đơn 02/12 00:30 → exception (khác ngày). Clock 02/12 00:05, đơn 02/12 00:30 → OK.
  - `checkIn_tableBusy_rejected`: `existsServingUnpaidOrderOnTable(901, id)` = true → message đúng chuỗi ở Global Constraints.
  - `confirm_fromScheduled_ok`, `confirm_fromConfirmed_rejected`, `reject_fromConfirmed_rejected`, `cancel_fromPending_rejected`.
  - `changeTable_sameTable_noSelfConflict`, `changeTable_tooSmall_rejected`, `changeTable_afterCheckIn_rejected`.
- [ ] **Step 2: Chạy, xác nhận fail.** `mvn -q test -Dtest=ReservationPolicyTest` → lỗi biên dịch / FAIL.
- [ ] **Step 3: Implement** enum, cột entity, query repository (JPQL theo kiểu các query hiện có trong `OrderRepository`), và `ReservationPolicy`. Định dạng giờ trong message: `HH:mm dd/MM`.
- [ ] **Step 4: Chạy lại** `mvn -q test -Dtest=ReservationPolicyTest` → PASS.
- [ ] **Step 5: Commit** `feat(reservation): add CONFIRMED status, contact fields and ReservationPolicy`.

### Task 2: Tích hợp vào luồng đơn, bàn, thanh toán

**Files:**
- Modify: `Service/OrderService.java` (createOrder ~75–165, updateOrderStatus ~535–580), `Repository/OrderRepository.java`, `Service/DinningTableService.java` (getAllTables ~83–101, convertToResponseDTO ~118), `Dto/Response/DinningTableResponseDTO/DinningTableResponseDTO.java`, `Dto/Request/OrderRequestDTO/OrderRequestDTO.java`
- Test: `src/test/.../ReservationOrderFlowIntegrationTest.java`

**Interfaces:**
- Consumes: mọi thứ Task 1 produce.
- Produces:
  - `OrderRequestDTO.contactPhone: String`, `OrderRequestDTO.guestCount: Integer`
  - `OrderService.createReservationOrder(OrderRequestDTO request, OrderStatus initialStatus): Integer`, chỉ nhận `SCHEDULED` hoặc `CONFIRMED`. `createOrder(request)` có `reservationTime` thì gọi hàm này với `SCHEDULED`.
  - `DinningTableResponseDTO.nextReservationTime: String` (`"HH:mm"` hoặc null). Giữ constructor 3 tham số cũ chạy được.

Việc cần làm:
- `createReservationOrder`: không kiểm tra ca, không gộp đơn, gọi `policy.validateNew(table, time, guestCount, null)`, set `contactPhone`/`guestCount`, **không đổi trạng thái bàn**, vẫn gọi `sendOrderNotification`. Giữ nguyên phần tạo item và tính tổng, tách thành hàm private dùng chung với đường walk-in.
- Gộp đơn walk-in: thay `findByTableNumberAndPaymentStatus(...)` bằng query mới `findServingUnpaidOrdersOnTable(Integer tableNumber): List<Order>` (cùng điều kiện như `existsServingUnpaidOrderOnTable` nhưng không có exclude).
- `existsByTablesTableNumberAndPaymentStatus` và `countActiveOrdersByTableId`: thêm loại trừ `SCHEDULED`, `CONFIRMED`. Các nơi gọi trong `PaymentController`/`PaymentService` tự hưởng thay đổi này.
- `updateOrderStatus`: nếu `ReservationPolicy.isAwaiting(order)` thì newStatus `PENDING` → `policy.checkIn`, `CONFIRMED` → `policy.confirm`, `CANCELLED` → `policy.cancel`, khác → `ValidationException`. Gửi thông báo như cũ. Đơn thường giữ nguyên hành vi.
- `getAllTables`: lọc `tableOrders` bỏ các đơn `isAwaiting` trước khi tính trạng thái. `nextReservationTime` = giờ của lịch `CONFIRMED` sớm nhất của bàn có `reservationTime` thuộc hôm nay (theo `Clock`) và ≥ bây giờ.

- [ ] **Step 1: Viết test thất bại** `ReservationOrderFlowIntegrationTest` (`@SpringBootTest @Transactional`, `@MockitoBean Clock` trả về clock fixed 01/12/2026 10:00 VN, `@WithMockUser(roles="STAFF")` trên các test cần quyền). Tạo bàn 901 (4 chỗ), 902, một món. Các test:
  - `reservation_doesNotLockTable_andSkipsShiftCheck`: `orderService.createOrder` với `reservationTime` 02/12 19:00, không có ca nào → trả về id. Đơn `SCHEDULED`. Bàn 901 vẫn `AVAILABLE`.
  - `getAllTables_ignoresFutureReservation`: sau đó `dinningTableService.getAllTables()` → bàn 901 có status `AVAILABLE`.
  - `getAllTables_showsTodayConfirmedTime`: lịch CONFIRMED 01/12 19:00 trên 902 → `nextReservationTime == "19:00"`. Lịch 02/12 không hiện.
  - `walkIn_doesNotMergeIntoReservation`: bàn 901 `OCCUPIED` có lịch hẹn `UNPAID` → tạo walk-in tạo **đơn mới**, không thêm vào đơn hẹn. Cần một `StaffShift` đang trong ca, xem `StaffShiftScheduleIntegrationTest` để biết cách tạo.
  - `payment_tableFreedDespiteFutureReservation`: bàn 901 có 1 đơn walk-in và 1 lịch CONFIRMED tối nay. Đánh dấu walk-in PAID rồi gọi `orderRepository.existsByTablesTableNumberAndPaymentStatus(901, UNPAID)` → `false`.
  - `graphqlStatusPending_onReservation_checksIn`: `orderService.updateOrderStatus(id, "PENDING")` trên lịch 01/12 19:00 → status PENDING, bàn OCCUPIED.
  - `graphqlStatusCompleted_onReservation_rejected` → `ValidationException`.
- [ ] **Step 2: Chạy, xác nhận fail.** `mvn -q test -Dtest=ReservationOrderFlowIntegrationTest`.
- [ ] **Step 3: Implement** các thay đổi ở trên.
- [ ] **Step 4: Chạy** test của task + test cũ liên quan: `mvn -q test -Dtest='ReservationOrderFlowIntegrationTest,OrderCancelIntegrationTest,PaymentConfirmIntegrationTest,ReservationPolicyTest'` → PASS.
- [ ] **Step 5: Commit** `fix(reservation): reservations no longer lock tables, merge into walk-ins or block payment`.

### Task 3: API `/api/reservations` + security

**Files:**
- Create: `Dto/Request/ReservationRequestDTO/ReservationRequestDTO.java`, `Dto/Request/ReservationRequestDTO/ChangeTableRequestDTO.java`, `Dto/Response/ReservationResponseDTO/ReservationResponseDTO.java`, `Dto/Response/ReservationResponseDTO/PublicTableDTO.java`, `Service/Imp/IReservationService.java`, `Service/ReservationService.java`, `Controller/ReservationController.java`
- Modify: `Config/SecurityConfig.java`, `README.md` (mục Supabase)
- Test: `src/test/.../ReservationApiIntegrationTest.java`

**Interfaces:**
- Consumes: `OrderService.createReservationOrder`, `ReservationPolicy.*`, repository từ Task 1.
- Produces (frontend Task 5–8 dùng đúng các field/đường dẫn này):
  - `ReservationRequestDTO { @NotBlank customerName; @NotBlank contactPhone; @NotNull @Min(1) guestCount; @NotNull tableId; @NotNull LocalDateTime reservationTime; String notes; List<OrderItemDTO> items }`
  - `ChangeTableRequestDTO { @NotNull Integer tableId }`
  - `ReservationResponseDTO { Integer orderId; String customerName; String contactPhone; Integer guestCount; Integer tableNumber; Integer tableCapacity; LocalDateTime reservationTime; String status; String notes; BigDecimal totalAmount; List<OrderItemDTO> items }` (item có `dishId, dishName, quantity, price, notes`)
  - `PublicTableDTO { Integer tableNumber; Integer capacity }`
  - Endpoint:

| Method | Path | Quyền | Trả về |
|---|---|---|---|
| POST | `/api/reservations` | public | `ReservationResponseDTO` (status `SCHEDULED`) |
| GET | `/api/reservations/tables` | public | `List<PublicTableDTO>` theo số bàn tăng dần |
| GET | `/api/reservations?date=yyyy-MM-dd&status=` | STAFF, ADMIN | `List<ReservationResponseDTO>`, sắp theo giờ. `date` lọc theo ngày của `reservationTime`, `status` tùy chọn |
| POST | `/api/reservations/manual` | STAFF, ADMIN | `ReservationResponseDTO` (status `CONFIRMED`) |
| PUT | `/api/reservations/{id}/confirm` \| `/reject` \| `/check-in` \| `/cancel` | STAFF, ADMIN | `ReservationResponseDTO` |
| PUT | `/api/reservations/{id}/table` | STAFF, ADMIN | `ReservationResponseDTO` |

- `ReservationService`:
  - chuẩn hóa `contactPhone` (bỏ mọi ký tự không phải số, sau đó phải dài 9–11 chữ số, sai thì `ValidationException("Số điện thoại không hợp lệ")`)
  - map sang `OrderRequestDTO`, gắn `customerId` nếu người gọi là customer đã đăng nhập (dùng `SecurityUtils`, xem cách `OrderService` lấy customer)
  - id không phải lịch hẹn (`reservationTime == null`) → `ValidationException("Đơn #{id} không phải lịch hẹn")`
  - sau mỗi thao tác staff, gửi thông báo trạng thái như `OrderService` đang làm
- `SecurityConfig`: thêm **trước** các rule staff: `POST /api/reservations` và `GET /api/reservations/tables` → `permitAll`; `/api/reservations/**` → `hasAnyRole("STAFF","ADMIN")`.
- `README.md`: thêm vào mục Supabase hai câu `ALTER TABLE restaurant.orders ADD COLUMN contact_phone varchar(20), ADD COLUMN guest_count integer;`. Kiểm tra tên bảng thật trong `@Table` của `Order`.

- [ ] **Step 1: Viết test thất bại** `ReservationApiIntegrationTest` (`@SpringBootTest @AutoConfigureMockMvc @Transactional`, `@MockitoBean Clock` fixed 01/12/2026 10:00 VN, bàn 903 sức chứa 4):
  - `create_public_returnsScheduled`: POST không token, body hợp lệ 02/12 19:00 → 200, `$.status == "SCHEDULED"`, `$.guestCount == 2`.
  - `create_phoneNormalized`: `"0982 774.889"` → `$.contactPhone == "0982774889"`.
  - `create_duplicateSameSlot_rejected`: POST hai lần cùng bàn và giờ → lần 2 trả 400.
  - `create_missingPhone_400`.
  - `tables_public_listsNumberAndCapacity`: GET `/api/reservations/tables` không token → 200, có phần tử `tableNumber == 903, capacity == 4`, **không** có field `status`.
  - `list_requiresStaff`: GET `/api/reservations` không token → 401. `@WithMockUser(roles="CUSTOMER")` → 403.
  - `manual_asStaff_returnsConfirmed` (`@WithMockUser(roles="STAFF")`).
  - `lifecycle_confirmCheckIn`: tạo lịch 01/12 19:00 → `/confirm` 200 CONFIRMED → `/check-in` 200 PENDING.
  - `checkIn_whenScheduledOnOtherDay_400`.
  - `changeTable_asStaff_movesReservation`.
  - `action_onNonReservation_400`: gọi `/confirm` trên một đơn walk-in.
- [ ] **Step 2: Chạy, xác nhận fail.** `mvn -q test -Dtest=ReservationApiIntegrationTest`.
- [ ] **Step 3: Implement** DTO, service, controller, security, README.
- [ ] **Step 4: Chạy toàn bộ backend** `mvn -q test` → tất cả PASS (kể cả 73 test cũ).
- [ ] **Step 5: Commit** `feat(reservation): add /api/reservations for customers and staff`.

### Task 4: Frontend nền: helper, API client, ẩn lịch hẹn khỏi bếp và sơ đồ bàn

**Files:**
- Create: `frontend/src/utils/reservation.js`, `frontend/src/services/reservationAPI.js`
- Modify: `frontend/src/pages/Staff/DishManagement/DishManagement.jsx`, `frontend/src/pages/Staff/TableManagement/TableManagement.jsx`, `frontend/src/pages/Admin/TableManagement/TableManagement.jsx`

**Interfaces:**
- Produces:
  - `utils/reservation.js`: `RESERVATION_WAITING = ["SCHEDULED","CONFIRMED"]`, `isAwaitingReservation(order) → boolean` (so status không phân biệt hoa thường), `formatReservationTime(isoString) → "19:00 · T3 02/12"`, `RESERVATION_STATUS_LABEL = { SCHEDULED:"Chờ duyệt", CONFIRMED:"Đã xác nhận", PENDING:"Đã nhận khách", PROCESSING:"Đã nhận khách", COMPLETED:"Đã nhận khách", CANCELLED:"Đã hủy" }`
  - `services/reservationAPI.js` (dùng `authAPI`/`publicAPI` trong `axiosConfig.js`): `createReservation(body)`, `getPublicTables()`, `listReservations({date, status})`, `createManualReservation(body)`, `confirmReservation(id)`, `rejectReservation(id)`, `checkInReservation(id)`, `cancelReservation(id)`, `changeReservationTable(id, tableId)`. Mỗi hàm trả `response.data`.

Việc cần làm:
- Bếp (`DishManagement.jsx`): bỏ các order `isAwaitingReservation` khỏi danh sách.
- Hai trang TableManagement: bỏ các order `isAwaitingReservation` ở **mọi** chỗ nhóm đơn theo bàn hoặc lọc đơn chưa thanh toán (gồm luồng thanh toán ~dòng 1114/1124), để thanh toán bàn không bao giờ chạm vào lịch hẹn. Trên thẻ bàn, nếu bàn có `nextReservationTime` từ `/api/staff/tables` hoặc `/api/admin/tables` thì hiện badge nhỏ `Hẹn {HH:mm}`. Giữ nguyên field này khi map dữ liệu bàn.

- [ ] **Step 1: Implement** helper, client, bộ lọc, badge.
- [ ] **Step 2: Kiểm tra** `cd frontend && npx eslint src/utils/reservation.js src/services/reservationAPI.js` → 0 lỗi. `npx vite build` → `built in`.
- [ ] **Step 3: Commit** `feat(frontend): hide pending reservations from kitchen and table bills, show today's booking badge`.

### Task 5: `ReservationForm` dùng chung

**Files:**
- Create: `frontend/src/components/reservation/ReservationForm.jsx`
- Tham khảo UI: form "Đặt bàn thủ công" trong `pages/Admin/TableManagement/ReservationModal.jsx` (~dòng 590+) và app tham khảo (lưới khung giờ, stepper số khách, chọn món có danh mục).

**Interfaces:**
- Produces: `<ReservationForm tables={[{tableNumber, capacity}]} dishes={[{dishId, name, price, categoryName, status}]} submitting={bool} error={string} submitLabel="Xác nhận đặt bàn" onSubmit={(body) => Promise} />`. `body` đúng shape `ReservationRequestDTO`. `reservationTime` dạng `"yyyy-MM-ddTHH:mm:00"`, giờ local.

Nội dung form:
- Tên*, SĐT*.
- Ngày: hôm nay → +30 ngày.
- Khung giờ 10:00–21:00 mỗi 30 phút. Khung đã qua của hôm nay bị ẩn.
- Số khách: stepper, tối thiểu 1.
- Bàn: chỉ hiện bàn có `capacity ≥ số khách`. Tự bỏ chọn khi bàn không còn hợp lệ.
- Món đặt trước (tùy chọn): chỉ món còn bán, có tab danh mục, nút +/−, tổng tiền định dạng `vi-VN`.
- Ghi chú.

Kiểm tra phía client trước khi gửi: tên, SĐT ≥ 9 chữ số, đã chọn bàn. Nút gửi bị disable khi `submitting`. Dùng tốt ở bề rộng 360px.

- [ ] **Step 1: Implement** component.
- [ ] **Step 2: Kiểm tra** `npx eslint src/components/reservation/ReservationForm.jsx` → 0 lỗi. `npx vite build` OK.
- [ ] **Step 3: Commit** `feat(frontend): add shared ReservationForm`.

### Task 6: Trang khách "Đặt bàn trước"

**Files:**
- Create: `frontend/src/pages/Customer/Reservation/Reservation.jsx`
- Modify: `frontend/src/App.jsx` (route public `/reservation`), `frontend/src/pages/Customer/Home/Home.jsx` (nút)

Việc cần làm:
- Trang nạp `getPublicTables()` và `/api/dishes` (giống `QuickOrderModal.fetchDishes`), rồi render `ReservationForm`.
- Gửi bằng `createReservation`. Thành công thì thay form bằng màn xác nhận: `Mã lịch hẹn #{orderId}`, giờ (`formatReservationTime`), bàn, số khách, câu "Nhà hàng sẽ liên hệ xác nhận qua số {contactPhone}.", và nút "Về trang chủ".
- Lỗi thì hiện `err.response?.data?.message`.
- Home có nút **"Đặt bàn trước"** to, dễ thấy, nằm cạnh các nút hành động chính hiện có (~dòng 500–580), dẫn tới `/reservation`. Giữ phong cách Tailwind của trang customer.

- [ ] **Step 1: Implement.**
- [ ] **Step 2: Kiểm tra** eslint file mới → 0 lỗi. `npx vite build` OK.
- [ ] **Step 3: Chạy thử** backend (`mvn spring-boot:run`) + `npm run dev`. Mở `/reservation` ở viewport 375px, đặt một lịch, thấy màn xác nhận. Đặt lại đúng slot đó thì thấy lỗi trùng giờ.
- [ ] **Step 4: Commit** `feat(customer): add advance table reservation page`.

### Task 7: `ReservationManager` cho Staff + Admin

**Files:**
- Create: `frontend/src/components/reservation/ReservationManager.jsx` (từ `pages/Admin/TableManagement/ReservationModal.jsx`; xóa file cũ)
- Modify: `pages/Admin/TableManagement/TableManagement.jsx` (~dòng 1824, import mới), `pages/Staff/TableManagement/TableManagement.jsx` (thêm nút "Lịch hẹn" cạnh nút đặt đơn ~dòng 2660, render manager)

**Interfaces:**
- Consumes: `reservationAPI.*`, `ReservationForm`, `utils/reservation.js`.
- Produces: `<ReservationManager isOpen onClose tables={[{tableNumber, capacity}]} onChanged={() => void} />`, trong đó `onChanged` để trang cha làm mới bàn/đơn sau khi nhận khách hoặc đổi bàn.

Việc cần làm:
- Bỏ toàn bộ dữ liệu giả (`initialRequests`, `initialBookings`, bàn và menu cứng).
- Tab **Chờ duyệt** (`status=SCHEDULED`, mọi ngày, badge đếm), **Đã xác nhận** (`CONFIRMED`, lọc ngày, mặc định hôm nay), **Đã xử lý** (các trạng thái còn lại, theo ngày lọc). Ô tìm theo tên/SĐT lọc phía client.
- Mỗi dòng hiện giờ, tên, SĐT, số khách, bàn, món, ghi chú.
- Nút theo trạng thái: Chấp nhận / Từ chối (chờ duyệt), Khách đã đến / Hủy (đã xác nhận), Đổi bàn (cả hai; chọn bàn trong danh sách bàn đủ chỗ).
- Từ chối/Hủy phải qua modal xác nhận trong trang.
- Lỗi backend hiện dạng toast.
- Nút **"Đặt bàn thủ công"** mở `ReservationForm` (submitLabel "Lưu lịch hẹn") → `createManualReservation`.
- Khi WebSocket nhận message `type === "NEW_RESERVATION"` thì làm mới danh sách và badge. Dùng kết nối WS sẵn có của trang cha: trang cha truyền một `refreshKey` hoặc gọi lại `onChanged`. Builder chọn cách gọn nhất với code hiện có.

- [ ] **Step 1: Implement.**
- [ ] **Step 2: Kiểm tra** eslint các file mới/sửa không thêm lỗi mới. `npx vite build` OK.
- [ ] **Step 3: Chạy thử** với tài khoản staff và admin: duyệt lịch đặt ở Task 6, nhận khách đúng ngày (thấy bàn chuyển "đang dùng"), từ chối một lịch khác, đổi bàn, đặt thủ công (xuất hiện ở tab Đã xác nhận).
- [ ] **Step 4: Commit** `feat(staff,admin): reservation management backed by API`.

### Task 8: `ManualOrderModal` dùng dữ liệu thật, thay `QuickOrderModal`

**Files:**
- Create: `frontend/src/components/order/ManualOrderModal.jsx` (từ `pages/Admin/TableManagement/ManualOrderModal.jsx`; xóa file cũ)
- Modify: hai trang TableManagement (import, props). Xóa `pages/Staff/TableManagement/QuickOrderModal.jsx` và mọi tham chiếu tới nó.

**Interfaces:**
- Produces: `<ManualOrderModal isOpen onClose tables={[{tableNumber, capacity, status}]} defaultTableNumber={number|undefined} onOrderSuccess={(orderId) => void} />`

Việc cần làm:
- Bỏ `DEFAULT_MENU_ITEMS`. Nạp `/api/dishes` (chỉ món `AVAILABLE`), danh mục lấy từ field danh mục của món.
- Thêm ô "Tên khách" tùy chọn, mặc định gửi `Khách tại bàn {n}`.
- Gửi `POST /api/orders` `{ tableId, customerName, notes, items:[{dishId, quantity, notes}] }` không có `reservationTime`.
- Thành công: gọi `onOrderSuccess`, đóng modal, toast "Đã tạo đơn #{id}". Thất bại: hiện message backend, ví dụ lỗi không có nhân viên trong ca. Nút gửi khóa khi đang gửi.
- Mở từ một bàn cụ thể thì chọn sẵn bàn đó.

- [ ] **Step 1: Implement.**
- [ ] **Step 2: Kiểm tra** `grep -rn QuickOrderModal frontend/src` → không còn kết quả. eslint file mới → 0 lỗi. `npx vite build` OK.
- [ ] **Step 3: Chạy thử** (staff đang trong ca): tạo đơn cho bàn trống → đơn hiện trong bếp, bàn chuyển "đang dùng". Tạo tiếp cho cùng bàn → món được gộp vào đơn cũ.
- [ ] **Step 4: Commit** `feat(staff,admin): manual order modal uses live menu and tables`.
