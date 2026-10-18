# Chấm công tự động bằng khuôn mặt (Attendance Auto-Scan) — Design

- **Ngày:** 2026-10-18
- **Phạm vi:** Dự án con #1 / 5 (các phần sau: bảo mật–hiệu năng–CI/CD, UI quản lý bàn, UI khách, AI giọng nói + chatbot)
- **Trạng thái:** Đã duyệt thiết kế trong hội thoại, chờ duyệt spec

## 1. Bối cảnh & vấn đề

Luồng hiện tại của nhân viên (STAFF):

1. Login → trang `/attendance` → **bấm nút** chụp → check-in → `/table-management_staff`.
2. Đăng xuất → trang riêng `CheckOut.jsx` → **bấm nút** chụp → check-out → logout. Có nút "Skip" bỏ qua không ghi nhận gì.

Vấn đề:

- Nhiều bước thủ công, chuyển trang thừa.
- Backend `AttendanceController` (552 dòng) có 4 endpoint gần trùng (`/check-in`, `/check-in-camera`, `/check-out`, `/check-out-camera`), logic nghiệp vụ nằm trong controller, việc xoá file tạm lặp lại ở mọi nhánh.
- Quy tắc giờ công khó hiểu: cắt cứng 5 tiếng/ngày, nhánh "spam" khi check-out lần 2. Không dùng tới dữ liệu ca (`Shift`, `StaffShift`) đã có.
- Không chống giả mạo (giơ ảnh chụp trước camera vẫn qua).

## 2. Mục tiêu

- Check-in/check-out **không cần bấm nút**: camera tự bật, tự nhận mặt, tự chuyển trang.
- Giờ công tính **theo ca đã xếp**, có cờ đi trễ / về sớm.
- Có lối thoát khi camera hỏng nhưng vẫn kiểm soát được (chấm công thủ công cần admin duyệt).
- Backend gọn: 1 service, 3 endpoint, có unit test.

**Ngoài phạm vi:** kiosk nhận diện 1:N, tính lương, thay đổi luồng của ADMIN.

## 3. Luồng người dùng

```
Login (STAFF)
  └► GET /api/attendance/today
       ├ đã check-in hôm nay → vào thẳng /table-management_staff
       └ chưa → /attendance (FaceScanner, mode=CHECK_IN)
            ├ phát hiện mặt ổn định ~0.5s → tự chụp → POST /api/attendance/scan
            ├ ✅ "Chào {tên} · {ca} {start}–{end} · Vào lúc {hh:mm}" → 1.5s → /table-management_staff
            ├ ❌ không khớp / spoof → tự thử lại, tối đa 3 lần
            └ sau 3 lần thất bại → nút "Chấm công thủ công" → POST /api/attendance/manual

Nút Đăng xuất (STAFF, đang check-in chưa check-out)
  └► Modal FaceScanner (mode=CHECK_OUT), không đổi trang
       ├ ✅ "Ra lúc {hh:mm} · Làm {Xh Ym}" → logout
       └ 3 lần thất bại → "Chấm công thủ công" → logout
```

- ADMIN: không chấm công, giữ nguyên luồng.
- STAFF đã check-out hôm nay hoặc chưa check-in: nút Đăng xuất logout ngay (không mở camera).

## 4. Frontend

### 4.1 Component `FaceScanner` (mới, dùng chung)

- Vị trí: `frontend/src/components/attendance/FaceScanner.jsx`.
- Props: `mode: "CHECK_IN" | "CHECK_OUT"`, `onSuccess(result)`, `onManual(result)`, `onCancel?()`.
- Phát hiện khuôn mặt **phía client** bằng MediaPipe Face Detector (`@mediapipe/tasks-vision`, model short-range, chạy CPU/WebGL). Chỉ phát hiện *có mặt*, không định danh.
- Điều kiện tự chụp: đúng 1 khuôn mặt, độ tin cậy ≥ 0.8, bbox chiếm ≥ 20% chiều rộng khung, giữ ổn định ≥ 500ms. Chụp 1 frame JPEG (chất lượng 0.9) → `multipart/form-data`.
- Trạng thái UI: `INIT` (xin quyền camera) → `SEARCHING` (khung oval, gợi ý "Đưa mặt vào khung") → `VERIFYING` (spinner) → `SUCCESS` (lời chào) | `RETRY` (thông báo lỗi, đếm lần) → sau 3 lần `FAILED` (hiện nút thủ công).
- Không có camera / bị từ chối quyền → vào thẳng `FAILED` (nút thủ công).
- Dừng mọi track camera khi unmount.
- Responsive: khung video co theo chiều rộng màn hình (mobile ≥ 360px), dùng Tailwind có sẵn.

### 4.2 Thay đổi khác

- `pages/Staff/Attendance/Attendance.jsx`: chỉ còn bọc `FaceScanner` mode CHECK_IN + điều hướng.
- `Login.jsx`: sau login STAFF gọi `/attendance/today` để quyết định điều hướng.
- `MenuBar.jsx` (nút Đăng xuất): mở modal `FaceScanner` mode CHECK_OUT khi cần.
- **Xoá** `pages/Staff/CheckOut/CheckOut.jsx` và route của nó trong `App.jsx` / `ProtectedRoute.jsx`.
- Admin: thêm tab "Chấm công chờ duyệt" trong trang Quản lý nhân viên (danh sách + nút Duyệt / Từ chối).

## 5. Backend

### 5.1 API

| Method | Path | Quyền | Mô tả |
|---|---|---|---|
| `POST` | `/api/attendance/scan` | STAFF | multipart: `image`, `type` (`CHECK_IN`/`CHECK_OUT`) |
| `POST` | `/api/attendance/manual` | STAFF | JSON: `type`, `reason` (≤ 255 ký tự) |
| `GET` | `/api/attendance/today` | STAFF | Trạng thái hôm nay + ca hôm nay |
| `GET` | `/api/attendance/pending` | ADMIN | Bản ghi thủ công chờ duyệt |
| `PATCH` | `/api/attendance/{id}/approval` | ADMIN | JSON: `approved: boolean` |
| `GET` | `/api/attendance/history` | (giữ nguyên) | |

Response `scan` / `manual` thành công (200):

```json
{
  "attendanceId": 12,
  "type": "CHECK_IN",
  "staffName": "Bùi Đình Hoàng",
  "time": "2026-10-18T07:58:12",
  "shift": { "name": "Ca sáng", "start": "08:00", "end": "14:00" },
  "late": false,
  "earlyLeave": false,
  "workingHours": null,
  "manual": false,
  "message": "Check-in thành công"
}
```

`GET /today`: `{ "status": "NONE" | "CHECKED_IN" | "CHECKED_OUT", "attendance": {...} | null, "shift": {...} | null }`.

Mã lỗi (body `{ "code": "...", "message": "..." }`):

| HTTP | code | Khi nào |
|---|---|---|
| 400 | `NO_FACE` | DeepFace/OpenCV không thấy mặt |
| 401 | `FACE_MISMATCH` | Mặt không khớp hồ sơ |
| 401 | `SPOOF_DETECTED` | Anti-spoofing phát hiện giả mạo |
| 409 | `ALREADY_CHECKED_IN` | Check-in lần 2 trong ngày |
| 409 | `NOT_CHECKED_IN` | Check-out khi chưa check-in |
| 409 | `ALREADY_CHECKED_OUT` | Check-out lần 2 |
| 422 | `NO_REFERENCE_FACE` | Nhân viên chưa có ảnh khuôn mặt gốc |
| 503 | `FACE_SERVICE_UNAVAILABLE` | Không gọi được dịch vụ Python |

### 5.2 Cấu trúc

- `Service/Imp/IAttendanceService.java` (interface) + `Service/AttendanceService.java` (cài đặt) — theo pattern hiện có của repo (`ICategoryService` / `CategoryService`).
- `Service/FaceVerificationClient.java` — bọc lời gọi HTTP tới `deepface.api.url`, nhận `byte[]` ảnh + reference, trả `VerifyResult { verified, spoof, noFace }`. Quản lý file tạm bằng `try/finally`.
- `Service/WorkingHoursCalculator.java` — hàm thuần, không phụ thuộc Spring (dễ test).
- `Exception/AttendanceException.java` (mang `code` + HTTP status) + handler trong `Exception/GlobalExeptionHandler.java`.
- DTO: `Dto/Response/AttendanceResponseDTO/AttendanceResultDTO.java`, `AttendanceTodayDTO.java`; `Dto/Request/AttendanceRequestDTO/ManualAttendanceRequestDTO.java`.
- `AttendanceController` viết lại còn ~80 dòng, chỉ gọi service. Giữ `/add-face`, `/history`.
- Bỏ bước detect bằng OpenCV Haar trong Java (Python service đã detect với `enforce_detection=True`) → giảm phụ thuộc `opencv_java490.dll` cho luồng này.

### 5.3 Quy tắc giờ công (`WorkingHoursCalculator`)

Đầu vào: `checkIn`, `checkOut`, danh sách ca hôm đó (`StaffShift` theo `staff` + `date`, status ≠ `ABSENT`).

- **Có ca:** giờ công = tổng độ dài giao của `[checkIn, checkOut]` với từng ca (ca qua đêm: `end < start` ⇒ `end` thuộc ngày hôm sau).
  - `late` = `checkIn` > `start` ca sớm nhất + **5 phút ân hạn**.
  - `earlyLeave` = `checkOut` < `end` ca muộn nhất − 5 phút.
- **Không có ca:** giờ công = `checkOut − checkIn`, `late = earlyLeave = false`.
- Làm tròn 2 chữ số thập phân (giờ). Bỏ trần 5 tiếng và logic "spam".
- Ca dùng để hiển thị: ca đầu tiên chứa / gần nhất với thời điểm check-in.
- Khi check-out thành công: cộng `workingHours` vào `Staff.totalWorkingHours` (giữ hành vi hiện tại của trường này); đặt `StaffShift.status = COMPLETED` cho các ca có giao > 0.

### 5.4 Chấm công thủ công

- Tạo/cập nhật bản ghi như scan nhưng `manual = true`, `approved = null` (chờ duyệt), lưu `reason`.
- Giờ công bản ghi thủ công **chưa** cộng vào `totalWorkingHours` cho tới khi admin duyệt (`approved = true`). Từ chối ⇒ `approved = false`, không cộng.
- Không giới hạn số lần thủ công ở backend (frontend đã ép phải thất bại 3 lần); admin thấy lý do khi duyệt.

### 5.5 Dữ liệu

`Attendance` thêm cột (JPA `ddl-auto: update` tự thêm, mặc định an toàn cho dữ liệu cũ):

| Cột | Kiểu | Mặc định |
|---|---|---|
| `manual` | BOOLEAN | false |
| `approved` | BOOLEAN NULL | null |
| `late` | BOOLEAN | false |
| `early_leave` | BOOLEAN | false |
| `manual_reason` | VARCHAR(255) NULL | null |

Thêm query repository: tìm bản ghi hôm nay theo `staffId` + khoảng `checkInTime` (không lọc theo status); tìm `manual = true AND approved IS NULL`.

Không lưu ảnh chụp chấm công lên đĩa nữa (`faceImagePath` hiện trỏ tới file tạm đã bị xoá — set `null` cho bản ghi mới).

### 5.6 Dịch vụ Python (`FaceRecognition/face_recognition.py`)

- `DeepFace.verify(..., anti_spoofing=True)`. Bắt exception spoof của DeepFace ⇒ trả `200 {"verified": false, "spoof": true}`.
- Không thấy mặt (`enforce_detection` lỗi) ⇒ `200 {"verified": false, "no_face": true}` thay vì 500.
- Thêm phụ thuộc nếu cần (`torch` cho model anti-spoof của DeepFace) vào `requirements.txt`.

## 6. Xử lý lỗi

- Mọi lỗi nghiệp vụ trả JSON có `code`; frontend ánh xạ `code` → câu tiếng Việt và quyết định thử lại (`NO_FACE`, `FACE_MISMATCH`, `SPOOF_DETECTED` → tính 1 lần thất bại; `409` → hiển thị trạng thái và điều hướng như đã chấm công; `503`/`422` → vào `FAILED` ngay, hiện nút thủ công).
- File tạm luôn được xoá trong `finally`.
- Timeout gọi Python service: 10s.

## 7. Kiểm thử

- `WorkingHoursCalculatorTest` (JUnit thuần): đúng giờ; đi trễ trong/ngoài 5 phút ân hạn; về sớm; làm thêm ngoài ca (không tính); 2 ca trong ngày; ca qua đêm; không có ca.
- `AttendanceServiceTest` (Mockito, mock `FaceVerificationClient` + repository): check-in thành công; check-in lần 2 → `ALREADY_CHECKED_IN`; check-out khi chưa check-in; check-out lần 2; mismatch; spoof; service down → `FACE_SERVICE_UNAVAILABLE`; thủ công không cộng giờ tới khi duyệt; duyệt cộng giờ.
- Thủ công trên trình duyệt: login STAFF → tự check-in → đăng xuất → tự check-out; từ chối quyền camera → nút thủ công; admin duyệt bản ghi thủ công.

## 8. Tiêu chí hoàn thành

- STAFF check-in/check-out không cần bấm nút nào khi nhận diện thành công.
- 4 endpoint cũ bị xoá, thay bằng API ở 5.1; `CheckOut.jsx` bị xoá.
- Toàn bộ test mới pass; build frontend & backend thành công.
