# Đặt bàn trước, quản lý lịch hẹn và đặt món thủ công — Thiết kế

Ngày: 2026-11-25

## Vì sao làm

Nhà hàng đang vận hành theo kiểu "khách tự order" qua QR tại bàn. Nhưng không phải khách nào cũng tự làm được (người lớn tuổi, khách không dùng điện thoại), và có khách muốn giữ bàn trước. Nhà hàng cần làm được cả hai kiểu như một nhà hàng truyền thống:

- Nhân viên **tự đặt món giúp khách** ngay tại bàn.
- Khách **đặt bàn trước** qua web. Nhân viên/admin **quản lý lịch hẹn**: duyệt, xếp, nhận khách. Nhân viên cũng **tự nhập lịch hẹn** khi khách gọi điện hoặc đến hẹn trực tiếp.

Flow tham khảo: app Flutter https://github.com/hoanglam0905/restaurant-self-order-app (dùng chung backend này). Màn staff "Tạo đơn hàng / Đặt bàn" và màn customer "Đặt bàn". App đó lưu lịch hẹn là một `Order` có `reservationTime`, trạng thái `SCHEDULED`. **Thiết kế này phải giữ tương thích với app đó** (xem phần Ràng buộc).

## Mục tiêu

1. **Customer — Đặt bàn trước.** Thêm nút "Đặt bàn trước" ở trang chủ khách (`pages/Customer/Home`). Nút mở trang đặt bàn công khai (route mới, ví dụ `/reservation`). Không bắt buộc đăng nhập.
2. **Staff + Admin — Quản lý lịch hẹn.** Một màn hình dùng chung cho cả hai vai trò: xem, duyệt, từ chối, nhận khách, hủy. Có nút **"Đặt bàn thủ công"** để nhân viên tự nhập lịch hẹn.
3. **Đặt món thủ công.** Nối `ManualOrderModal` (Admin) vào backend thật thay cho dữ liệu giả, và dùng nó ở cả trang Staff.

## Không làm (non-goals)

- Gửi SMS/email xác nhận cho khách.
- Đặt cọc, thanh toán trước khi đến.
- Tự động khóa bàn theo khung giờ, tự hủy khi khách không đến (nhân viên thao tác tay).
- Trang cho khách tra cứu hoặc tự hủy lịch hẹn khi không đăng nhập.
- Sửa app Flutter tham khảo.

## Anti-goals (làm vậy là hỏng, dù chạy được)

- Lịch hẹn cho tương lai làm **bàn bị khóa ngay hôm nay** (bug hiện tại, xem bên dưới).
- Món đặt trước của lịch hẹn **hiện ra ở bếp** trước khi khách đến.
- Khách vãng lai ngồi vào bàn bị **gộp đơn vào lịch hẹn** của người khác. Lịch hẹn chưa nhận khách bị **tính tiền chung** khi thanh toán bàn.
- Khách đặt bàn lúc ngoài giờ bị báo lỗi "không có nhân viên trong ca".
- Màn quản lý lịch hẹn hoặc đặt món thủ công vẫn còn dữ liệu giả.

## Hiện trạng (đã khảo sát code)

- `OrderRequestDTO` / GraphQL `OrderInput` đã có `customerName`, `tableId`, `items`, `notes`, `reservationTime`. `OrderService.createOrder` set `status = SCHEDULED` khi có `reservationTime`.
- `POST /api/orders` là public (`SecurityConfig`). Đơn hẹn có `items` rỗng vẫn được tạo.
- **Bug 1:** `createOrder` set bàn sang `RESERVED` ngay khi tạo đơn hẹn (`OrderService.java` ~dòng 153), bất kể hẹn ngày nào.
- **Bug 2:** `createOrder` ném lỗi nếu không có nhân viên trong ca, áp dụng cả cho đơn hẹn.
- Gộp đơn: đơn tại chỗ trên bàn `OCCUPIED` sẽ gộp vào đơn `UNPAID` đầu tiên của bàn (`findByTableNumberAndPaymentStatus`). Hàm này không phân biệt đơn hẹn.
- Bếp (`pages/Staff/DishManagement`) hiển thị mọi đơn chưa thanh toán, không lọc đơn hẹn.
- `OrderStatus` hiện có: `PENDING, PROCESSING, COMPLETED, CANCELLED, SCHEDULED`. Cột `status` lưu dạng chuỗi (`EnumType.STRING`).
- Không có chỗ lưu SĐT hoặc số khách. `Customer` chỉ có `fullname`. App tham khảo đang nhét chúng vào `notes` dạng `RESERVATION | Số khách: 4 | SĐT: 09.. | Ghi chú: ..`.
- Frontend:
  - `pages/Admin/TableManagement/ReservationModal.jsx`: UI đầy đủ (tab yêu cầu chờ duyệt, danh sách đã đặt, form đặt thủ công, chọn món) nhưng toàn dữ liệu giả.
  - `pages/Admin/TableManagement/ManualOrderModal.jsx`: UI đặt món đẹp (danh mục, tìm kiếm, +/−, tổng tiền), menu viết cứng (`DEFAULT_MENU_ITEMS`). Hiện chỉ nhận prop `isOpen`, `onClose`.
  - `pages/Staff/TableManagement/QuickOrderModal.jsx`: bản thô (dropdown chọn món, ô ngày giờ hẹn) đang dùng ở trang Staff.

## Thiết kế

### Mô hình dữ liệu (backend)

Lịch hẹn **vẫn là một `Order` có `reservationTime`**, như hiện tại và như app tham khảo.

Thêm vào `Order` hai cột, cho phép null:

- `contactPhone` (varchar 20)
- `guestCount` (int)

Thêm trạng thái `CONFIRMED` vào `OrderStatus`, nghĩa là lịch hẹn đã được nhà hàng xác nhận nhưng khách chưa đến.

Vòng đời lịch hẹn:

```
SCHEDULED (chờ duyệt) ──Chấp nhận──▶ CONFIRMED (đã xác nhận)
     │                                   │
     └──Từ chối──▶ CANCELLED   ◀──Hủy / Không đến──┘
                                         │
                                  Nhận khách (check-in)
                                         ▼
                              PENDING → luồng đơn bình thường
```

- Khách tự đặt: tạo ở `SCHEDULED`.
- Nhân viên tự đặt (đặt thủ công): tạo thẳng ở `CONFIRMED` (*quyết định của người thiết kế*).
- **Nhận khách:** đơn chuyển `PENDING`, bàn chuyển `OCCUPIED`, món đặt trước bắt đầu xuống bếp, đơn tiếp tục như đơn tại chỗ.
- Tương thích app Flutter: app đó "Chấp nhận" bằng cách set thẳng `PENDING` qua `updateOrderStatus`. Đường này vẫn phải chạy được, nghĩa là được coi như duyệt và nhận khách luôn. App đó lọc "chờ duyệt" theo `SCHEDULED`, nên vẫn đúng.
- Nếu request có SĐT hoặc số khách mà không gửi field riêng (app Flutter gửi trong `notes`), backend **không** cần parse `notes`. Màn quản lý hiển thị `notes` nguyên văn.

### Quy tắc backend

1. Tạo đơn hẹn **không** đổi trạng thái bàn. Bỏ việc set `RESERVED` lúc tạo.
2. Đơn hẹn **bỏ qua** kiểm tra "có nhân viên trong ca". Đơn tại chỗ giữ nguyên kiểm tra này.
3. `reservationTime` phải ở tương lai và không quá 30 ngày tới (*quyết định của người thiết kế*).
4. **Chống trùng bàn:** từ chối tạo hoặc duyệt lịch hẹn nếu cùng bàn đã có lịch `SCHEDULED`/`CONFIRMED` trong khoảng ±2 giờ (*quyết định của người thiết kế*). Thông báo lỗi bằng tiếng Việt, nói rõ giờ bị trùng.
5. Số khách (nếu có) phải ≤ sức chứa bàn (`DinningTable.capacity`).
6. **Gộp đơn tại chỗ và thanh toán bàn** chỉ xét đơn đang phục vụ. Loại các đơn `SCHEDULED`/`CONFIRMED`.
7. **Bếp** không thấy đơn `SCHEDULED`/`CONFIRMED`. Lọc ở backend (query GraphQL `orders` dùng cho bếp) hoặc ở frontend bếp. Builder chọn, miễn là bếp không bao giờ hiện chúng.
8. **Sơ đồ bàn:** `DinningTableService.getAllTables()` hiện tính lại trạng thái bàn từ các đơn của bàn và ghi ngược vào DB. Hàm này phải **bỏ qua đơn `SCHEDULED`/`CONFIRMED`**, nếu không lịch hẹn tuần sau sẽ làm bàn thành `OCCUPIED`. Trạng thái `RESERVED` không còn được gán tự động. Thay vào đó, API danh sách bàn trả thêm giờ của lịch `CONFIRMED` gần nhất **trong hôm nay** (ví dụ `nextReservationTime`). Trang bàn của Admin và Staff hiện badge nhỏ "Hẹn 19:00" trên thẻ bàn, còn trạng thái bàn giữ nguyên (*quyết định của người thiết kế*). Bàn đang kẹt ở `RESERVED` trong dữ liệu cũ thì builder tự xử lý.
9. **Bàn của lịch hẹn:** khách **bắt buộc** chọn bàn. Nhân viên **đổi được bàn** của lịch `SCHEDULED`/`CONFIRMED` trước khi nhận khách (endpoint đổi bàn bên dưới). Đổi bàn cũng chạy kiểm tra trùng giờ và sức chứa. Cột bàn của `Order` vẫn bắt buộc (*quyết định của người thiết kế*).
10. **Nhận khách (check-in):**
    - Chỉ cho phép vào **đúng ngày hẹn** (giờ Việt Nam). Khác ngày trả 400 (*quyết định của người thiết kế*).
    - Nếu bàn đang có đơn chưa thanh toán khác (khách vãng lai chưa về), **chặn** bằng 400: "Bàn X đang có khách, hãy đổi bàn cho lịch hẹn rồi nhận khách". Vì vậy một bàn không bao giờ có hai đơn đang phục vụ (*quyết định của người thiết kế*).
11. **Đường tắt GraphQL `updateOrderStatus`** (app Flutter): set `PENDING` cho đơn `SCHEDULED`/`CONFIRMED` phải đi qua **cùng logic nhận khách** (đổi bàn `OCCUPIED`, cùng kiểm tra ngày và bàn trống). Set `CANCELLED` cho đơn hẹn thì đi qua logic hủy. Các chuyển trạng thái khác của đơn hẹn bị từ chối. Đơn không phải đơn hẹn giữ nguyên hành vi cũ.
12. Khi khách tự đặt, gửi thông báo cho nhân viên qua cơ chế notification/WebSocket sẵn có (`sendOrderNotification` hoặc tương đương).
13. Khách đăng nhập (có JWT customer) đặt bàn thì gắn `customerId`. Khách vãng lai thì dùng `customerName` như flow hiện tại.

### API (backend)

Nhóm REST mới `/api/reservations` (*quyết định của người thiết kế*: tách riêng cho rõ, không nhồi vào `/api/orders`):

| Method | Path | Quyền | Việc |
|---|---|---|---|
| POST | `/api/reservations` | public | Khách tạo lịch hẹn → `SCHEDULED` |
| GET | `/api/reservations/tables` | public | Danh sách bàn cho khách chọn: số bàn, sức chứa (không lộ trạng thái hoặc QR) |
| GET | `/api/reservations?date=&status=` | STAFF, ADMIN | Danh sách lịch hẹn, sắp theo `reservationTime` |
| POST | `/api/reservations/manual` | STAFF, ADMIN | Nhân viên đặt thủ công → `CONFIRMED` |
| PUT | `/api/reservations/{id}/confirm` | STAFF, ADMIN | `SCHEDULED` → `CONFIRMED` |
| PUT | `/api/reservations/{id}/reject` | STAFF, ADMIN | `SCHEDULED` → `CANCELLED` |
| PUT | `/api/reservations/{id}/check-in` | STAFF, ADMIN | `CONFIRMED` → `PENDING`, bàn `OCCUPIED` |
| PUT | `/api/reservations/{id}/cancel` | STAFF, ADMIN | `SCHEDULED`/`CONFIRMED` → `CANCELLED` |
| PUT | `/api/reservations/{id}/table` | STAFF, ADMIN | Đổi bàn cho lịch `SCHEDULED`/`CONFIRMED` (body `tableId`) |

Body tạo lịch hẹn: `customerName`, `contactPhone`, `guestCount`, `tableId`, `reservationTime` (ISO local, giờ Việt Nam), `notes`, `items[]` (tùy chọn: `dishId`, `quantity`, `notes`).

`POST /api/orders` có `reservationTime` (đường của app Flutter) vẫn hoạt động và tuân theo cùng quy tắc 1–5.

Chuyển trạng thái sai (ví dụ check-in một lịch `SCHEDULED`) trả 400 kèm thông báo rõ ràng.

### Customer — trang Đặt bàn trước

- Nút **"Đặt bàn trước"** trên `pages/Customer/Home`, nổi bật, dễ thấy với người lớn tuổi.
- Trang đặt bàn (route public mới), nội dung form:
  - Tên khách *(bắt buộc)*, Số điện thoại *(bắt buộc)*.
  - Ngày (hôm nay → 30 ngày) và khung giờ (lưới khung giờ chọn bằng nút như app tham khảo; danh sách khung giờ để builder chọn hợp lý, ví dụ 10:00–21:00 mỗi 30 phút).
  - Số khách (stepper).
  - Bàn mong muốn: chọn từ `/api/reservations/tables`, chỉ hiện bàn có sức chứa ≥ số khách.
  - Món đặt trước *(tùy chọn)*: menu thật, lọc danh mục, +/−, tổng tiền.
  - Ghi chú.
- Gửi thành công: màn xác nhận có **mã lịch hẹn** (orderId), tóm tắt, và câu "Nhà hàng sẽ liên hệ xác nhận".
- Lỗi (trùng giờ, quá sức chứa...) hiển thị bằng thông báo tiếng Việt của backend.
- Giao diện theo phong cách các trang customer hiện có (Tailwind), dùng tốt trên điện thoại.

### Staff + Admin — màn Quản lý lịch hẹn

- Nối `ReservationModal.jsx` vào API thật. Dùng **chung một component** cho Admin và Staff, mở từ trang quản lý bàn của mỗi vai trò. Builder có thể chuyển nó thành trang riêng có mục trên menu nếu hợp hơn.
- Phần hiển thị:
  - Tab **Chờ duyệt** (`SCHEDULED`) kèm badge số lượng.
  - Tab **Đã xác nhận** (`CONFIRMED`), lọc theo ngày (mặc định hôm nay).
  - Tab **Đã xử lý** (đã nhận khách hoặc đã hủy).
  - Tìm theo tên hoặc SĐT.
- Mỗi lịch hẹn hiện: giờ, tên, SĐT, số khách, bàn, món đặt trước, ghi chú.
- Hành động theo trạng thái: **Chấp nhận / Từ chối** (chờ duyệt); **Khách đã đến / Hủy** (đã xác nhận); **Đổi bàn** (cả hai). Hủy và từ chối cần bước xác nhận (modal trong trang, không dùng `window.confirm`).
- Nút **"Đặt bàn thủ công"**: form giống form của khách. Bàn chọn từ danh sách bàn thật, menu thật. Gửi tới `/api/reservations/manual`.
- Có lịch hẹn mới từ khách (WebSocket) thì danh sách tự làm mới.

### Đặt món thủ công

- `ManualOrderModal.jsx`: bỏ `DEFAULT_MENU_ITEMS`, lấy món và danh mục thật (`/api/dishes`, `/api/categories` hoặc GraphQL đang dùng), chỉ hiện món còn bán. Lấy bàn thật.
- Modal nhận thêm prop: `tables`, bàn được chọn sẵn (khi mở từ một bàn cụ thể), `onOrderSuccess`.
- Gửi qua `POST /api/orders` (đơn tại chỗ, không có `reservationTime`). `customerName` lấy từ ô nhập tên nếu có, mặc định "Khách tại bàn X". Bàn đang có đơn chưa thanh toán thì backend tự gộp như hiện tại.
- Thành công: đóng modal, làm mới danh sách bàn/đơn, báo thành công. Thất bại: hiển thị lỗi backend (ví dụ "không có nhân viên trong ca").
- Trang Staff: thay `QuickOrderModal` bằng `ManualOrderModal`. Phần hẹn ngày giờ trong `QuickOrderModal` chuyển sang màn Quản lý lịch hẹn. Xóa `QuickOrderModal` khi không còn dùng.

## Ràng buộc

- Stack sẵn có: Spring Boot + JPA, React 19 + Vite + Tailwind. Không thêm thư viện UI mới.
- Tương thích app Flutter dùng chung backend: giữ `POST /api/orders` có `reservationTime`, giữ ý nghĩa `SCHEDULED`, giữ GraphQL `updateOrderStatus` set `PENDING` được cho đơn hẹn.
- Hai cột mới phải nullable, để `ddl-auto: update` (local) tự thêm. Ghi chú trong README hoặc migration notes cho profile Supabase (đang `validate`) để thêm cột tay.
- Thời gian theo bean `Clock` giờ Việt Nam sẵn có, không dùng `LocalDateTime.now()` trần.
- Security: thêm rule trong `SecurityConfig` theo bảng API. Các endpoint public chỉ là tạo lịch hẹn và xem danh sách bàn rút gọn.
- Test: viết integration test backend theo kiểu các test hiện có (`OrderCancelIntegrationTest`, `PaymentConfirmIntegrationTest`), phủ: tạo đơn hẹn không khóa bàn; bỏ kiểm tra ca; chống trùng ±2h; vượt sức chứa; vòng đời confirm/reject/check-in/cancel và chuyển sai trả 400; check-in sai ngày hoặc bàn đang có khách bị chặn; đổi bàn; `getAllTables` không biến lịch hẹn thành `OCCUPIED`; đường tắt `updateOrderStatus` đi qua logic nhận khách; gộp đơn tại chỗ bỏ qua đơn hẹn; bếp không thấy đơn hẹn; quyền truy cập (khách không gọi được endpoint staff).

## Để builder tự quyết

- Chi tiết bố cục và giao diện (bám theo `ReservationModal`/`ManualOrderModal` hiện có và trang customer).
- Danh sách khung giờ cụ thể.
- Lọc bếp ở backend hay frontend (miễn bếp không bao giờ thấy đơn hẹn).
- Tên route frontend, và việc Quản lý lịch hẹn là modal hay trang riêng.
- Cách tổ chức DTO, service (ví dụ `ReservationService` riêng).
