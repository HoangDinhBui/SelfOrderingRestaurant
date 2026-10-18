# Attendance Auto-Scan Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Nhân viên check-in/check-out bằng khuôn mặt không cần bấm nút; giờ công tính theo ca; có chấm công thủ công chờ admin duyệt.

**Architecture:** Frontend dùng MediaPipe Face Detector để tự chụp 1 ảnh khi thấy mặt ổn định, gửi `POST /api/attendance/scan`. Backend: `AttendanceController` mỏng → `AttendanceService` (nghiệp vụ) → `FaceVerificationClient` (HTTP tới Python DeepFace) + `WorkingHoursCalculator` (hàm thuần). Python service bật anti-spoofing.

**Tech Stack:** Spring Boot 3.4.3 / Java 21 / JPA / JUnit 5 + Mockito; React 19 + Vite + Tailwind 4; `@mediapipe/tasks-vision` 0.10.14; Flask + DeepFace 0.0.93.

**Spec:** `docs/superpowers/specs/2026-10-18-attendance-autoscan-design.md`

## Global Constraints

- Ân hạn đi trễ / về sớm: **5 phút**.
- Tối đa **3** lần nhận diện thất bại trước khi hiện chấm công thủ công.
- Điều kiện tự chụp: đúng 1 mặt, confidence ≥ **0.8**, bbox ≥ **20%** chiều rộng khung, ổn định ≥ **500ms**, JPEG quality **0.9**.
- Timeout gọi Python service: **10s**.
- `reason` chấm công thủ công: bắt buộc, ≤ **255** ký tự.
- Giờ công làm tròn **2** chữ số thập phân. Không còn trần 5 tiếng, không còn logic "spam".
- Cột mới trong `attendances` phải **nullable** (DB production có thể là PostgreSQL, `ddl-auto: update`); code đọc bằng `Boolean.TRUE.equals(...)`.
- Mã lỗi & HTTP status đúng bảng ở spec §5.1, body `{ "code", "message", "status", "timestamp" }`.
- Đường dẫn backend gốc: `src/main/java/com/example/SelfOrderingRestaurant` (dưới đây viết tắt `B/`), test: `src/test/java/com/example/SelfOrderingRestaurant` (`T/`).
- Interface service đặt ở `B/Service/Imp/I*.java`, cài đặt ở `B/Service/*.java` (pattern sẵn có).
- Chạy test backend: `./mvnw -q test -Dtest=<TestClass>` từ thư mục gốc repo (Git Bash). Các test mới là unit test thuần, **không** dùng `@SpringBootTest`.

## Review Focus

1. **CDN MediaPipe/model không tải được** (mạng chặn jsdelivr/googleapis) → scanner không được kẹt ở "Đang tải"; phải hiện nút "Chụp ảnh" thủ công để vẫn gửi ảnh được. (Task 6, bước kiểm tra tay 6.6)
2. **Ca qua đêm, check-out sau 0h** → vẫn tìm được bản ghi đang mở của hôm trước, không báo `NOT_CHECKED_IN`. (Task 3, test `checkOut_afterMidnight_findsOpenRecordFromYesterday`)
3. **Ảnh gốc là URL Cloudinary và tải lỗi / nhân viên chưa có ảnh gốc** → `FACE_SERVICE_UNAVAILABLE` / `NO_REFERENCE_FACE`, không 500. (Task 2, tests `verify_referenceUrlFails_throwsUnavailable`, `verify_noReference_throwsNoReferenceFace`)
4. **Nhiều khuôn mặt trong khung / gửi trùng khi request đang chạy** → không chụp khi có ≠ 1 mặt; không gửi request thứ 2 khi request đầu chưa xong. (Task 6, bước kiểm tra tay 6.6)
5. **Lý do thủ công rỗng hoặc > 255 ký tự** → 400 `VALIDATION_ERROR`, không 500. (Task 4, test `manual_blankReason_returns400`)

---

### Task 1: `WorkingHoursCalculator`

**Files:**
- Create: `B/Service/WorkingHoursCalculator.java`
- Test: `T/Service/WorkingHoursCalculatorTest.java`

**Interfaces:**
- Produces:
  - `record WorkingHoursCalculator.ShiftWindow(String name, LocalDateTime start, LocalDateTime end)` + `static ShiftWindow of(String name, LocalDate date, LocalTime start, LocalTime end)` (end ≤ start ⇒ end sang ngày hôm sau)
  - `record WorkingHoursCalculator.Result(double workingHours, boolean late, boolean earlyLeave)`
  - `static boolean isLate(LocalDateTime checkIn, List<ShiftWindow> shifts)`
  - `static Result calculate(LocalDateTime checkIn, LocalDateTime checkOut, List<ShiftWindow> shifts)`
  - `static Optional<ShiftWindow> displayShift(LocalDateTime at, List<ShiftWindow> shifts)`
  - `static double overlapHours(LocalDateTime checkIn, LocalDateTime checkOut, ShiftWindow shift)`

- [ ] **Step 1.1: Write the failing test**

`T/Service/WorkingHoursCalculatorTest.java`:

```java
package com.example.SelfOrderingRestaurant.Service;

import com.example.SelfOrderingRestaurant.Service.WorkingHoursCalculator.Result;
import com.example.SelfOrderingRestaurant.Service.WorkingHoursCalculator.ShiftWindow;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class WorkingHoursCalculatorTest {

    private static final LocalDate D = LocalDate.of(2026, 10, 18);
    private static final ShiftWindow MORNING = ShiftWindow.of("Ca sáng", D, LocalTime.of(8, 0), LocalTime.of(14, 0));

    private static LocalDateTime at(int h, int m) {
        return D.atTime(h, m);
    }

    @Test
    void onTime_countsOnlyShiftHours() {
        Result r = WorkingHoursCalculator.calculate(at(7, 58), at(14, 5), List.of(MORNING));
        assertEquals(6.0, r.workingHours());
        assertFalse(r.late());
        assertFalse(r.earlyLeave());
    }

    @Test
    void lateWithinGrace_isNotLate() {
        Result r = WorkingHoursCalculator.calculate(at(8, 4), at(14, 0), List.of(MORNING));
        assertFalse(r.late());
        assertEquals(5.93, r.workingHours());
    }

    @Test
    void lateBeyondGrace_isLate() {
        assertTrue(WorkingHoursCalculator.isLate(at(8, 6), List.of(MORNING)));
        assertTrue(WorkingHoursCalculator.calculate(at(8, 6), at(14, 0), List.of(MORNING)).late());
    }

    @Test
    void earlyLeave_beyondGraceOnly() {
        assertTrue(WorkingHoursCalculator.calculate(at(8, 0), at(13, 50), List.of(MORNING)).earlyLeave());
        assertFalse(WorkingHoursCalculator.calculate(at(8, 0), at(13, 56), List.of(MORNING)).earlyLeave());
    }

    @Test
    void twoShifts_sumsOverlaps_ignoresGap() {
        ShiftWindow a = ShiftWindow.of("Sáng", D, LocalTime.of(8, 0), LocalTime.of(11, 0));
        ShiftWindow b = ShiftWindow.of("Tối", D, LocalTime.of(17, 0), LocalTime.of(22, 0));
        Result r = WorkingHoursCalculator.calculate(at(7, 55), at(22, 10), List.of(b, a));
        assertEquals(8.0, r.workingHours());
        assertFalse(r.late());
        assertFalse(r.earlyLeave());
    }

    @Test
    void overnightShift_endsNextDay() {
        ShiftWindow night = ShiftWindow.of("Ca đêm", D, LocalTime.of(22, 0), LocalTime.of(6, 0));
        assertEquals(D.plusDays(1).atTime(6, 0), night.end());
        Result r = WorkingHoursCalculator.calculate(at(21, 58), D.plusDays(1).atTime(6, 3), List.of(night));
        assertEquals(8.0, r.workingHours());
        assertFalse(r.earlyLeave());
    }

    @Test
    void noShift_countsActualHours() {
        Result r = WorkingHoursCalculator.calculate(at(9, 0), at(12, 30), List.of());
        assertEquals(3.5, r.workingHours());
        assertFalse(r.late());
        assertFalse(r.earlyLeave());
        assertFalse(WorkingHoursCalculator.isLate(at(23, 0), List.of()));
    }

    @Test
    void workedEntirelyOutsideShift_isZero() {
        Result r = WorkingHoursCalculator.calculate(at(5, 0), at(7, 0), List.of(MORNING));
        assertEquals(0.0, r.workingHours());
        assertTrue(r.earlyLeave());
    }

    @Test
    void displayShift_prefersContainingThenNearest() {
        ShiftWindow evening = ShiftWindow.of("Tối", D, LocalTime.of(17, 0), LocalTime.of(22, 0));
        assertEquals("Ca sáng", WorkingHoursCalculator.displayShift(at(9, 0), List.of(evening, MORNING)).orElseThrow().name());
        assertEquals("Tối", WorkingHoursCalculator.displayShift(at(16, 30), List.of(MORNING, evening)).orElseThrow().name());
        assertTrue(WorkingHoursCalculator.displayShift(at(9, 0), List.of()).isEmpty());
    }
}
```

- [ ] **Step 1.2: Run test to verify it fails**

Run: `./mvnw -q test -Dtest=WorkingHoursCalculatorTest`
Expected: COMPILATION ERROR — `WorkingHoursCalculator` không tồn tại.

- [ ] **Step 1.3: Write implementation**

`B/Service/WorkingHoursCalculator.java`:

```java
package com.example.SelfOrderingRestaurant.Service;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

/** Tính giờ công theo ca. Hàm thuần, không phụ thuộc Spring. */
public final class WorkingHoursCalculator {

    public static final Duration GRACE = Duration.ofMinutes(5);

    private WorkingHoursCalculator() {
    }

    public record ShiftWindow(String name, LocalDateTime start, LocalDateTime end) {
        public static ShiftWindow of(String name, LocalDate date, LocalTime start, LocalTime end) {
            LocalDateTime s = date.atTime(start);
            LocalDateTime e = date.atTime(end);
            if (!end.isAfter(start)) {
                e = e.plusDays(1); // ca qua đêm
            }
            return new ShiftWindow(name, s, e);
        }
    }

    public record Result(double workingHours, boolean late, boolean earlyLeave) {
    }

    public static boolean isLate(LocalDateTime checkIn, List<ShiftWindow> shifts) {
        return shifts.stream()
                .map(ShiftWindow::start)
                .min(Comparator.naturalOrder())
                .map(start -> checkIn.isAfter(start.plus(GRACE)))
                .orElse(false);
    }

    public static Result calculate(LocalDateTime checkIn, LocalDateTime checkOut, List<ShiftWindow> shifts) {
        if (shifts.isEmpty()) {
            return new Result(round(Duration.between(checkIn, checkOut)), false, false);
        }
        double hours = shifts.stream().mapToDouble(s -> overlapHoursRaw(checkIn, checkOut, s)).sum();
        LocalDateTime lastEnd = shifts.stream().map(ShiftWindow::end).max(Comparator.naturalOrder()).orElseThrow();
        boolean earlyLeave = checkOut.isBefore(lastEnd.minus(GRACE));
        return new Result(round(hours), isLate(checkIn, shifts), earlyLeave);
    }

    public static double overlapHours(LocalDateTime checkIn, LocalDateTime checkOut, ShiftWindow shift) {
        return round(overlapHoursRaw(checkIn, checkOut, shift));
    }

    public static Optional<ShiftWindow> displayShift(LocalDateTime at, List<ShiftWindow> shifts) {
        Optional<ShiftWindow> containing = shifts.stream()
                .filter(s -> !at.isBefore(s.start()) && at.isBefore(s.end()))
                .findFirst();
        if (containing.isPresent()) {
            return containing;
        }
        return shifts.stream()
                .min(Comparator.comparingLong(s -> Math.abs(Duration.between(at, s.start()).toMinutes())));
    }

    private static double overlapHoursRaw(LocalDateTime checkIn, LocalDateTime checkOut, ShiftWindow shift) {
        LocalDateTime from = checkIn.isAfter(shift.start()) ? checkIn : shift.start();
        LocalDateTime to = checkOut.isBefore(shift.end()) ? checkOut : shift.end();
        return to.isAfter(from) ? Duration.between(from, to).toMinutes() / 60.0 : 0.0;
    }

    private static double round(Duration d) {
        return round(d.toMinutes() / 60.0);
    }

    private static double round(double hours) {
        return Math.round(hours * 100) / 100.0;
    }
}
```

- [ ] **Step 1.4: Run test to verify it passes**

Run: `./mvnw -q test -Dtest=WorkingHoursCalculatorTest`
Expected: PASS (9 tests).

- [ ] **Step 1.5: Commit**

```bash
git add src/main/java/com/example/SelfOrderingRestaurant/Service/WorkingHoursCalculator.java src/test/java/com/example/SelfOrderingRestaurant/Service/WorkingHoursCalculatorTest.java
git commit -m "feat(attendance): add shift-based working hours calculator"
```

---

### Task 2: `AttendanceException` + `FaceVerificationClient`

**Files:**
- Create: `B/Exception/AttendanceError.java`
- Create: `B/Exception/AttendanceException.java`
- Modify: `B/Exception/GlobalExeptionHandler.java` (thêm 2 handler trước handler `Exception.class`)
- Create: `B/Service/FaceVerificationClient.java`
- Test: `T/Service/FaceVerificationClientTest.java`

**Interfaces:**
- Produces:
  - `enum AttendanceError { NO_FACE, FACE_MISMATCH, SPOOF_DETECTED, ALREADY_CHECKED_IN, NOT_CHECKED_IN, ALREADY_CHECKED_OUT, NO_REFERENCE_FACE, FACE_SERVICE_UNAVAILABLE, ALREADY_REVIEWED }` với `HttpStatus status()` và `String defaultMessage()`
  - `class AttendanceException extends RuntimeException` — `AttendanceException(AttendanceError)`, `AttendanceException(AttendanceError, String message)`, `AttendanceError getError()`
  - `class FaceVerificationClient` — `VerifyResult verify(byte[] image, String referencePath)`; `record FaceVerificationClient.VerifyResult(boolean verified, boolean spoof, boolean noFace)`
  - JSON lỗi: `{ "timestamp", "status", "code", "message" }`; `MethodArgumentNotValidException` → 400 `code: "VALIDATION_ERROR"`

- [ ] **Step 2.1: Write the failing test**

`T/Service/FaceVerificationClientTest.java`:

```java
package com.example.SelfOrderingRestaurant.Service;

import com.example.SelfOrderingRestaurant.Exception.AttendanceError;
import com.example.SelfOrderingRestaurant.Exception.AttendanceException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestTemplate;

import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.*;

class FaceVerificationClientTest {

    private static final String URL = "http://face/verify";
    private RestTemplate restTemplate;
    private MockRestServiceServer server;
    private FaceVerificationClient client;
    @TempDir
    Path tmp;
    private String refPath;

    @BeforeEach
    void setUp() throws Exception {
        restTemplate = new RestTemplate();
        server = MockRestServiceServer.bindTo(restTemplate).build();
        client = new FaceVerificationClient(restTemplate, URL);
        Path ref = tmp.resolve("ref.jpg");
        Files.write(ref, new byte[]{1, 2, 3});
        refPath = ref.toString();
    }

    @Test
    void verify_verified() {
        server.expect(requestTo(URL)).andExpect(method(HttpMethod.POST))
                .andRespond(withSuccess("{\"verified\":true,\"distance\":0.4}", MediaType.APPLICATION_JSON));
        FaceVerificationClient.VerifyResult r = client.verify(new byte[]{9}, refPath);
        assertTrue(r.verified());
        assertFalse(r.spoof());
        assertFalse(r.noFace());
    }

    @Test
    void verify_spoofAndNoFaceFlags() {
        server.expect(requestTo(URL))
                .andRespond(withSuccess("{\"verified\":false,\"spoof\":true}", MediaType.APPLICATION_JSON));
        assertTrue(client.verify(new byte[]{9}, refPath).spoof());
        server.reset();
        server.expect(requestTo(URL))
                .andRespond(withSuccess("{\"verified\":false,\"no_face\":true}", MediaType.APPLICATION_JSON));
        assertTrue(client.verify(new byte[]{9}, refPath).noFace());
    }

    @Test
    void verify_serviceError_throwsUnavailable() {
        server.expect(requestTo(URL)).andRespond(withServerError());
        AttendanceException ex = assertThrows(AttendanceException.class, () -> client.verify(new byte[]{9}, refPath));
        assertEquals(AttendanceError.FACE_SERVICE_UNAVAILABLE, ex.getError());
    }

    @Test
    void verify_noReference_throwsNoReferenceFace() {
        assertEquals(AttendanceError.NO_REFERENCE_FACE,
                assertThrows(AttendanceException.class, () -> client.verify(new byte[]{9}, null)).getError());
        assertEquals(AttendanceError.NO_REFERENCE_FACE,
                assertThrows(AttendanceException.class, () -> client.verify(new byte[]{9}, tmp.resolve("missing.jpg").toString())).getError());
    }

    @Test
    void verify_referenceUrlFails_throwsUnavailable() {
        server.expect(requestTo("http://cdn/ref.jpg")).andRespond(withServerError());
        AttendanceException ex = assertThrows(AttendanceException.class, () -> client.verify(new byte[]{9}, "http://cdn/ref.jpg"));
        assertEquals(AttendanceError.FACE_SERVICE_UNAVAILABLE, ex.getError());
    }

    @Test
    void verify_referenceUrl_downloadsThenVerifies() {
        server.expect(requestTo("http://cdn/ref.jpg")).andRespond(withSuccess(new byte[]{1}, MediaType.IMAGE_JPEG));
        server.expect(requestTo(URL)).andRespond(withSuccess("{\"verified\":true}", MediaType.APPLICATION_JSON));
        assertTrue(client.verify(new byte[]{9}, "http://cdn/ref.jpg").verified());
        server.verify();
    }
}
```

- [ ] **Step 2.2: Run test to verify it fails**

Run: `./mvnw -q test -Dtest=FaceVerificationClientTest`
Expected: COMPILATION ERROR — `FaceVerificationClient`, `AttendanceException`, `AttendanceError` không tồn tại.

- [ ] **Step 2.3: Write implementation**

`B/Exception/AttendanceError.java`:

```java
package com.example.SelfOrderingRestaurant.Exception;

import org.springframework.http.HttpStatus;

public enum AttendanceError {
    NO_FACE(HttpStatus.BAD_REQUEST, "Không phát hiện khuôn mặt, vui lòng nhìn thẳng vào camera"),
    FACE_MISMATCH(HttpStatus.UNAUTHORIZED, "Khuôn mặt không khớp với hồ sơ nhân viên"),
    SPOOF_DETECTED(HttpStatus.UNAUTHORIZED, "Phát hiện hình ảnh giả mạo"),
    ALREADY_CHECKED_IN(HttpStatus.CONFLICT, "Hôm nay bạn đã check-in"),
    NOT_CHECKED_IN(HttpStatus.CONFLICT, "Bạn chưa check-in hôm nay"),
    ALREADY_CHECKED_OUT(HttpStatus.CONFLICT, "Hôm nay bạn đã check-out"),
    NO_REFERENCE_FACE(HttpStatus.UNPROCESSABLE_ENTITY, "Nhân viên chưa có ảnh khuôn mặt gốc"),
    FACE_SERVICE_UNAVAILABLE(HttpStatus.SERVICE_UNAVAILABLE, "Dịch vụ xác thực khuôn mặt không khả dụng"),
    ALREADY_REVIEWED(HttpStatus.CONFLICT, "Bản ghi này không ở trạng thái chờ duyệt");

    private final HttpStatus status;
    private final String defaultMessage;

    AttendanceError(HttpStatus status, String defaultMessage) {
        this.status = status;
        this.defaultMessage = defaultMessage;
    }

    public HttpStatus status() {
        return status;
    }

    public String defaultMessage() {
        return defaultMessage;
    }
}
```

`B/Exception/AttendanceException.java`:

```java
package com.example.SelfOrderingRestaurant.Exception;

public class AttendanceException extends RuntimeException {
    private final AttendanceError error;

    public AttendanceException(AttendanceError error) {
        this(error, error.defaultMessage());
    }

    public AttendanceException(AttendanceError error, String message) {
        super(message);
        this.error = error;
    }

    public AttendanceError getError() {
        return error;
    }
}
```

`B/Exception/GlobalExeptionHandler.java` — thêm import `org.springframework.web.bind.MethodArgumentNotValidException` và 2 method sau, đặt **trước** `handleGlobalException`:

```java
    @ExceptionHandler(AttendanceException.class)
    public ResponseEntity<Object> handleAttendanceException(AttendanceException ex) {
        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", LocalDateTime.now());
        body.put("code", ex.getError().name());
        body.put("message", ex.getMessage());
        body.put("status", ex.getError().status().value());
        return new ResponseEntity<>(body, ex.getError().status());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Object> handleMethodArgumentNotValid(MethodArgumentNotValidException ex) {
        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", LocalDateTime.now());
        body.put("code", "VALIDATION_ERROR");
        body.put("message", ex.getBindingResult().getFieldErrors().stream()
                .map(e -> e.getField() + ": " + e.getDefaultMessage())
                .findFirst().orElse("Dữ liệu không hợp lệ"));
        body.put("status", HttpStatus.BAD_REQUEST.value());
        return new ResponseEntity<>(body, HttpStatus.BAD_REQUEST);
    }
```

`B/Service/FaceVerificationClient.java`:

```java
package com.example.SelfOrderingRestaurant.Service;

import com.example.SelfOrderingRestaurant.Exception.AttendanceError;
import com.example.SelfOrderingRestaurant.Exception.AttendanceException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.util.Map;

/** Gọi dịch vụ Python DeepFace để so khớp ảnh chụp với ảnh gốc của nhân viên. */
@Component
public class FaceVerificationClient {

    public record VerifyResult(boolean verified, boolean spoof, boolean noFace) {
    }

    private static final Duration TIMEOUT = Duration.ofSeconds(10);

    private final RestTemplate restTemplate;
    private final String verifyUrl;

    @Autowired
    public FaceVerificationClient(RestTemplateBuilder builder,
                                  @Value("${deepface.api.url:http://localhost:5000/verify}") String verifyUrl) {
        this(builder.connectTimeout(TIMEOUT).readTimeout(TIMEOUT).build(), verifyUrl);
    }

    FaceVerificationClient(RestTemplate restTemplate, String verifyUrl) {
        this.restTemplate = restTemplate;
        this.verifyUrl = verifyUrl;
    }

    public VerifyResult verify(byte[] image, String referencePath) {
        byte[] reference = loadReference(referencePath);

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("image", namedResource(image, "capture.jpg"));
        body.add("reference_image", namedResource(reference, "reference.jpg"));
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);

        try {
            Map<?, ?> res = restTemplate.postForObject(verifyUrl, new HttpEntity<>(body, headers), Map.class);
            if (res == null) {
                throw new AttendanceException(AttendanceError.FACE_SERVICE_UNAVAILABLE);
            }
            return new VerifyResult(isTrue(res.get("verified")), isTrue(res.get("spoof")), isTrue(res.get("no_face")));
        } catch (RestClientException e) {
            throw new AttendanceException(AttendanceError.FACE_SERVICE_UNAVAILABLE);
        }
    }

    private byte[] loadReference(String referencePath) {
        if (referencePath == null || referencePath.isBlank()) {
            throw new AttendanceException(AttendanceError.NO_REFERENCE_FACE);
        }
        if (referencePath.startsWith("http")) {
            try {
                byte[] bytes = restTemplate.getForObject(referencePath, byte[].class);
                if (bytes == null || bytes.length == 0) {
                    throw new AttendanceException(AttendanceError.NO_REFERENCE_FACE);
                }
                return bytes;
            } catch (RestClientException e) {
                throw new AttendanceException(AttendanceError.FACE_SERVICE_UNAVAILABLE);
            }
        }
        Path path = Path.of(referencePath);
        if (!Files.exists(path)) {
            throw new AttendanceException(AttendanceError.NO_REFERENCE_FACE);
        }
        try {
            return Files.readAllBytes(path);
        } catch (IOException e) {
            throw new AttendanceException(AttendanceError.NO_REFERENCE_FACE);
        }
    }

    private static ByteArrayResource namedResource(byte[] bytes, String filename) {
        return new ByteArrayResource(bytes) {
            @Override
            public String getFilename() {
                return filename;
            }
        };
    }

    private static boolean isTrue(Object value) {
        return Boolean.TRUE.equals(value);
    }
}
```

- [ ] **Step 2.4: Run test to verify it passes**

Run: `./mvnw -q test -Dtest=FaceVerificationClientTest`
Expected: PASS (6 tests).

- [ ] **Step 2.5: Commit**

```bash
git add src/main/java/com/example/SelfOrderingRestaurant/Exception/AttendanceError.java src/main/java/com/example/SelfOrderingRestaurant/Exception/AttendanceException.java src/main/java/com/example/SelfOrderingRestaurant/Exception/GlobalExeptionHandler.java src/main/java/com/example/SelfOrderingRestaurant/Service/FaceVerificationClient.java src/test/java/com/example/SelfOrderingRestaurant/Service/FaceVerificationClientTest.java
git commit -m "feat(attendance): add face verification client and error codes"
```

---

### Task 3: `AttendanceService` (entity, repository, DTO, nghiệp vụ)

**Files:**
- Modify: `B/Entity/Attendance.java` (thêm 5 cột)
- Modify: `B/Repository/AttendanceRepository.java` (thêm 1 query)
- Create: `B/Dto/Response/AttendanceResponseDTO/ShiftInfoDTO.java`
- Create: `B/Dto/Response/AttendanceResponseDTO/AttendanceResultDTO.java`
- Create: `B/Dto/Response/AttendanceResponseDTO/AttendanceTodayDTO.java`
- Create: `B/Dto/Response/AttendanceResponseDTO/PendingAttendanceDTO.java`
- Create: `B/Service/Imp/IAttendanceService.java`
- Create: `B/Service/AttendanceService.java`
- Test: `T/Service/AttendanceServiceTest.java`

**Interfaces:**
- Consumes: `WorkingHoursCalculator` (Task 1), `FaceVerificationClient.verify(byte[], String)`, `AttendanceException`, `AttendanceError` (Task 2); `StaffRepository.findByUserUsername(String): Optional<Staff>`; `StaffShiftRepository.findByStaffAndDate(Staff, LocalDate): List<StaffShift>`; `AttendanceRepository.findByStaffIdAndCheckInTimeBetween(Integer, LocalDateTime, LocalDateTime)`.
- Produces (`IAttendanceService`):
  - `AttendanceResultDTO scan(String username, Attendance.AttendanceStatus type, byte[] image)`
  - `AttendanceResultDTO manual(String username, Attendance.AttendanceStatus type, String reason)`
  - `AttendanceTodayDTO today(String username)`
  - `List<PendingAttendanceDTO> pending()`
  - `void review(Integer attendanceId, boolean approved)`
- DTO (records, JSON field names = record component names):
  - `ShiftInfoDTO(String name, String start, String end)` — giờ dạng `"HH:mm"`
  - `AttendanceResultDTO(Integer attendanceId, String type, String staffName, LocalDateTime time, ShiftInfoDTO shift, boolean late, boolean earlyLeave, Double workingHours, boolean manual, String message)`
  - `AttendanceTodayDTO(String status, AttendanceResultDTO attendance, ShiftInfoDTO shift)` — `status ∈ {"NONE","CHECKED_IN","CHECKED_OUT"}`
  - `PendingAttendanceDTO(Integer attendanceId, Integer staffId, String staffName, LocalDateTime checkInTime, LocalDateTime checkOutTime, Double workingHours, String reason)`

Quy tắc chọn bản ghi (lấy các bản ghi `checkInTime ∈ [now − 24h, now]` của nhân viên):
- **open** = bản ghi mới nhất có `checkOutTime == null` → dùng cho CHECK_OUT (hỗ trợ ca qua đêm).
- **todayRecord** = bản ghi mới nhất có `checkInTime.toLocalDate() == now.toLocalDate()`.
- CHECK_IN: có `open` hoặc `todayRecord` ⇒ `ALREADY_CHECKED_IN`.
- CHECK_OUT: không có `open` ⇒ `todayRecord != null` ? `ALREADY_CHECKED_OUT` : `NOT_CHECKED_IN`.
- Kiểm tra chuyển trạng thái **trước** khi gọi nhận diện khuôn mặt.
- Cộng giờ vào `Staff.totalWorkingHours` khi bản ghi có `checkOutTime` **và** (`manual != true` **hoặc** `approved == true`) — tại check-out hoặc tại lúc admin duyệt.

- [ ] **Step 3.1: Write the failing test**

`T/Service/AttendanceServiceTest.java`:

```java
package com.example.SelfOrderingRestaurant.Service;

import com.example.SelfOrderingRestaurant.Dto.Response.AttendanceResponseDTO.AttendanceResultDTO;
import com.example.SelfOrderingRestaurant.Dto.Response.AttendanceResponseDTO.AttendanceTodayDTO;
import com.example.SelfOrderingRestaurant.Entity.Attendance;
import com.example.SelfOrderingRestaurant.Entity.Attendance.AttendanceStatus;
import com.example.SelfOrderingRestaurant.Entity.Shift;
import com.example.SelfOrderingRestaurant.Entity.Staff;
import com.example.SelfOrderingRestaurant.Entity.StaffShift;
import com.example.SelfOrderingRestaurant.Enum.StaffShiftStatus;
import com.example.SelfOrderingRestaurant.Exception.AttendanceError;
import com.example.SelfOrderingRestaurant.Exception.AttendanceException;
import com.example.SelfOrderingRestaurant.Repository.AttendanceRepository;
import com.example.SelfOrderingRestaurant.Repository.StaffRepository;
import com.example.SelfOrderingRestaurant.Repository.StaffShiftRepository;
import com.example.SelfOrderingRestaurant.Service.FaceVerificationClient.VerifyResult;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.*;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class AttendanceServiceTest {

    private static final ZoneId ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final LocalDate D = LocalDate.of(2026, 10, 18);
    private static final byte[] IMG = {1};

    private AttendanceRepository attendanceRepository;
    private StaffRepository staffRepository;
    private StaffShiftRepository staffShiftRepository;
    private FaceVerificationClient faceClient;
    private AttendanceService service;
    private Staff staff;
    private final List<Attendance> records = new ArrayList<>();
    private final List<StaffShift> shifts = new ArrayList<>();

    @BeforeEach
    void setUp() {
        attendanceRepository = mock(AttendanceRepository.class);
        staffRepository = mock(StaffRepository.class);
        staffShiftRepository = mock(StaffShiftRepository.class);
        faceClient = mock(FaceVerificationClient.class);
        service = new AttendanceService(attendanceRepository, staffRepository, staffShiftRepository, faceClient);

        staff = new Staff();
        staff.setStaffId(1);
        staff.setFullname("Bùi Đình Hoàng");
        staff.setFaceImagePath("ref.jpg");
        staff.setTotalWorkingHours(10.0);

        when(staffRepository.findByUserUsername("hoang")).thenReturn(Optional.of(staff));
        when(attendanceRepository.findByStaffIdAndCheckInTimeBetween(eq(1), any(), any())).thenReturn(records);
        when(attendanceRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(staffShiftRepository.findByStaffAndDate(eq(staff), any())).thenReturn(shifts);
        when(faceClient.verify(any(), any())).thenReturn(new VerifyResult(true, false, false));
    }

    private void now(LocalDateTime t) {
        service.setClock(Clock.fixed(t.atZone(ZONE).toInstant(), ZONE));
    }

    private void morningShift() {
        Shift shift = new Shift();
        shift.setName("Ca sáng");
        shift.setStartTime(LocalTime.of(8, 0));
        shift.setEndTime(LocalTime.of(14, 0));
        StaffShift ss = new StaffShift();
        ss.setShift(shift);
        ss.setStaff(staff);
        ss.setDate(D);
        ss.setStatus(StaffShiftStatus.ASSIGNED);
        shifts.add(ss);
    }

    private Attendance openRecord(LocalDateTime checkIn) {
        Attendance a = new Attendance();
        a.setAttendanceId(7);
        a.setStaffId(1);
        a.setCheckInTime(checkIn);
        a.setStatus(AttendanceStatus.CHECK_IN);
        records.add(a);
        return a;
    }

    @Test
    void checkIn_success_returnsShiftAndSavesRecord() {
        morningShift();
        now(D.atTime(7, 58));
        AttendanceResultDTO r = service.scan("hoang", AttendanceStatus.CHECK_IN, IMG);
        assertEquals("CHECK_IN", r.type());
        assertEquals("Bùi Đình Hoàng", r.staffName());
        assertEquals("Ca sáng", r.shift().name());
        assertEquals("08:00", r.shift().start());
        assertFalse(r.late());
        assertFalse(r.manual());
        verify(attendanceRepository).save(argThat(a -> a.getCheckInTime().equals(D.atTime(7, 58))
                && a.getStatus() == AttendanceStatus.CHECK_IN && !Boolean.TRUE.equals(a.getManual())));
    }

    @Test
    void checkIn_late_isFlagged() {
        morningShift();
        now(D.atTime(8, 20));
        assertTrue(service.scan("hoang", AttendanceStatus.CHECK_IN, IMG).late());
    }

    @Test
    void checkIn_twice_throwsAlreadyCheckedIn_withoutCallingFaceService() {
        openRecord(D.atTime(7, 58));
        now(D.atTime(9, 0));
        AttendanceException ex = assertThrows(AttendanceException.class,
                () -> service.scan("hoang", AttendanceStatus.CHECK_IN, IMG));
        assertEquals(AttendanceError.ALREADY_CHECKED_IN, ex.getError());
        verifyNoInteractions(faceClient);
    }

    @Test
    void checkOut_withoutCheckIn_throwsNotCheckedIn() {
        now(D.atTime(14, 0));
        assertEquals(AttendanceError.NOT_CHECKED_IN, assertThrows(AttendanceException.class,
                () -> service.scan("hoang", AttendanceStatus.CHECK_OUT, IMG)).getError());
    }

    @Test
    void checkOut_twice_throwsAlreadyCheckedOut() {
        Attendance a = openRecord(D.atTime(7, 58));
        a.setCheckOutTime(D.atTime(14, 0));
        a.setStatus(AttendanceStatus.CHECK_OUT);
        now(D.atTime(15, 0));
        assertEquals(AttendanceError.ALREADY_CHECKED_OUT, assertThrows(AttendanceException.class,
                () -> service.scan("hoang", AttendanceStatus.CHECK_OUT, IMG)).getError());
    }

    @Test
    void checkOut_success_computesHoursAddsToStaffAndCompletesShift() {
        morningShift();
        openRecord(D.atTime(7, 58));
        now(D.atTime(14, 5));
        AttendanceResultDTO r = service.scan("hoang", AttendanceStatus.CHECK_OUT, IMG);
        assertEquals(6.0, r.workingHours());
        assertFalse(r.earlyLeave());
        assertEquals(16.0, staff.getTotalWorkingHours());
        verify(staffRepository).save(staff);
        assertEquals(StaffShiftStatus.COMPLETED, shifts.get(0).getStatus());
        verify(staffShiftRepository).save(shifts.get(0));
    }

    @Test
    void checkOut_afterMidnight_findsOpenRecordFromYesterday() {
        openRecord(D.atTime(22, 0));
        now(D.plusDays(1).atTime(6, 0));
        AttendanceResultDTO r = service.scan("hoang", AttendanceStatus.CHECK_OUT, IMG);
        assertEquals(8.0, r.workingHours());
    }

    @Test
    void scan_mismatch_throwsFaceMismatch() {
        when(faceClient.verify(any(), any())).thenReturn(new VerifyResult(false, false, false));
        now(D.atTime(8, 0));
        assertEquals(AttendanceError.FACE_MISMATCH, assertThrows(AttendanceException.class,
                () -> service.scan("hoang", AttendanceStatus.CHECK_IN, IMG)).getError());
        verify(attendanceRepository, never()).save(any());
    }

    @Test
    void scan_spoof_throwsSpoofDetected() {
        when(faceClient.verify(any(), any())).thenReturn(new VerifyResult(false, true, false));
        now(D.atTime(8, 0));
        assertEquals(AttendanceError.SPOOF_DETECTED, assertThrows(AttendanceException.class,
                () -> service.scan("hoang", AttendanceStatus.CHECK_IN, IMG)).getError());
    }

    @Test
    void scan_noFace_throwsNoFace() {
        when(faceClient.verify(any(), any())).thenReturn(new VerifyResult(false, false, true));
        now(D.atTime(8, 0));
        assertEquals(AttendanceError.NO_FACE, assertThrows(AttendanceException.class,
                () -> service.scan("hoang", AttendanceStatus.CHECK_IN, IMG)).getError());
    }

    @Test
    void scan_serviceDown_propagatesUnavailable() {
        when(faceClient.verify(any(), any())).thenThrow(new AttendanceException(AttendanceError.FACE_SERVICE_UNAVAILABLE));
        now(D.atTime(8, 0));
        assertEquals(AttendanceError.FACE_SERVICE_UNAVAILABLE, assertThrows(AttendanceException.class,
                () -> service.scan("hoang", AttendanceStatus.CHECK_IN, IMG)).getError());
    }

    @Test
    void manualCheckOut_doesNotAddHoursUntilApproved() {
        Attendance a = openRecord(D.atTime(8, 0));
        now(D.atTime(12, 0));
        AttendanceResultDTO r = service.manual("hoang", AttendanceStatus.CHECK_OUT, "Camera hỏng");
        assertTrue(r.manual());
        assertEquals(10.0, staff.getTotalWorkingHours());
        assertNull(a.getApproved());
        assertEquals("Camera hỏng", a.getManualReason());
        verifyNoInteractions(faceClient);

        when(attendanceRepository.findById(7)).thenReturn(Optional.of(a));
        when(staffRepository.findById(1)).thenReturn(Optional.of(staff));
        service.review(7, true);
        assertTrue(a.getApproved());
        assertEquals(14.0, staff.getTotalWorkingHours());
    }

    @Test
    void review_reject_doesNotAddHours_andSecondReviewFails() {
        Attendance a = openRecord(D.atTime(8, 0));
        now(D.atTime(12, 0));
        service.manual("hoang", AttendanceStatus.CHECK_OUT, "Camera hỏng");
        when(attendanceRepository.findById(7)).thenReturn(Optional.of(a));
        service.review(7, false);
        assertFalse(a.getApproved());
        assertEquals(10.0, staff.getTotalWorkingHours());
        assertEquals(AttendanceError.ALREADY_REVIEWED,
                assertThrows(AttendanceException.class, () -> service.review(7, true)).getError());
    }

    @Test
    void faceCheckOut_afterPendingManualCheckIn_defersHours() {
        Attendance a = openRecord(D.atTime(8, 0));
        a.setManual(true);
        now(D.atTime(12, 0));
        service.scan("hoang", AttendanceStatus.CHECK_OUT, IMG);
        assertEquals(10.0, staff.getTotalWorkingHours());
        verify(staffRepository, never()).save(any());
    }

    @Test
    void today_reportsStatus() {
        now(D.atTime(7, 0));
        assertEquals("NONE", service.today("hoang").status());
        Attendance a = openRecord(D.atTime(7, 58));
        now(D.atTime(9, 0));
        AttendanceTodayDTO t = service.today("hoang");
        assertEquals("CHECKED_IN", t.status());
        assertEquals(7, t.attendance().attendanceId());
        a.setCheckOutTime(D.atTime(14, 0));
        assertEquals("CHECKED_OUT", service.today("hoang").status());
    }
}
```

- [ ] **Step 3.2: Run test to verify it fails**

Run: `./mvnw -q test -Dtest=AttendanceServiceTest`
Expected: COMPILATION ERROR — `AttendanceService`, DTOs, `Attendance.getManual()` không tồn tại.

- [ ] **Step 3.3: Add entity columns and repository query**

`B/Entity/Attendance.java` — thêm sau field `workingHours`:

```java
    @Column(name = "manual")
    private Boolean manual = false;

    @Column(name = "approved")
    private Boolean approved;

    @Column(name = "late")
    private Boolean late = false;

    @Column(name = "early_leave")
    private Boolean earlyLeave = false;

    @Column(name = "manual_reason", length = 255)
    private String manualReason;
```

`B/Repository/AttendanceRepository.java` — thêm method:

```java
    List<Attendance> findByManualTrueAndApprovedIsNullOrderByCheckInTimeDesc();
```

- [ ] **Step 3.4: Create DTOs**

`B/Dto/Response/AttendanceResponseDTO/ShiftInfoDTO.java`:

```java
package com.example.SelfOrderingRestaurant.Dto.Response.AttendanceResponseDTO;

public record ShiftInfoDTO(String name, String start, String end) {
}
```

`B/Dto/Response/AttendanceResponseDTO/AttendanceResultDTO.java`:

```java
package com.example.SelfOrderingRestaurant.Dto.Response.AttendanceResponseDTO;

import java.time.LocalDateTime;

public record AttendanceResultDTO(
        Integer attendanceId,
        String type,
        String staffName,
        LocalDateTime time,
        ShiftInfoDTO shift,
        boolean late,
        boolean earlyLeave,
        Double workingHours,
        boolean manual,
        String message) {
}
```

`B/Dto/Response/AttendanceResponseDTO/AttendanceTodayDTO.java`:

```java
package com.example.SelfOrderingRestaurant.Dto.Response.AttendanceResponseDTO;

public record AttendanceTodayDTO(String status, AttendanceResultDTO attendance, ShiftInfoDTO shift) {
}
```

`B/Dto/Response/AttendanceResponseDTO/PendingAttendanceDTO.java`:

```java
package com.example.SelfOrderingRestaurant.Dto.Response.AttendanceResponseDTO;

import java.time.LocalDateTime;

public record PendingAttendanceDTO(
        Integer attendanceId,
        Integer staffId,
        String staffName,
        LocalDateTime checkInTime,
        LocalDateTime checkOutTime,
        Double workingHours,
        String reason) {
}
```

- [ ] **Step 3.5: Create service interface and implementation**

`B/Service/Imp/IAttendanceService.java`:

```java
package com.example.SelfOrderingRestaurant.Service.Imp;

import com.example.SelfOrderingRestaurant.Dto.Response.AttendanceResponseDTO.AttendanceResultDTO;
import com.example.SelfOrderingRestaurant.Dto.Response.AttendanceResponseDTO.AttendanceTodayDTO;
import com.example.SelfOrderingRestaurant.Dto.Response.AttendanceResponseDTO.PendingAttendanceDTO;
import com.example.SelfOrderingRestaurant.Entity.Attendance;

import java.util.List;

public interface IAttendanceService {
    AttendanceResultDTO scan(String username, Attendance.AttendanceStatus type, byte[] image);

    AttendanceResultDTO manual(String username, Attendance.AttendanceStatus type, String reason);

    AttendanceTodayDTO today(String username);

    List<PendingAttendanceDTO> pending();

    void review(Integer attendanceId, boolean approved);
}
```

`B/Service/AttendanceService.java`:

```java
package com.example.SelfOrderingRestaurant.Service;

import com.example.SelfOrderingRestaurant.Dto.Response.AttendanceResponseDTO.AttendanceResultDTO;
import com.example.SelfOrderingRestaurant.Dto.Response.AttendanceResponseDTO.AttendanceTodayDTO;
import com.example.SelfOrderingRestaurant.Dto.Response.AttendanceResponseDTO.PendingAttendanceDTO;
import com.example.SelfOrderingRestaurant.Dto.Response.AttendanceResponseDTO.ShiftInfoDTO;
import com.example.SelfOrderingRestaurant.Entity.Attendance;
import com.example.SelfOrderingRestaurant.Entity.Attendance.AttendanceStatus;
import com.example.SelfOrderingRestaurant.Entity.Staff;
import com.example.SelfOrderingRestaurant.Entity.StaffShift;
import com.example.SelfOrderingRestaurant.Enum.StaffShiftStatus;
import com.example.SelfOrderingRestaurant.Exception.AttendanceError;
import com.example.SelfOrderingRestaurant.Exception.AttendanceException;
import com.example.SelfOrderingRestaurant.Exception.ResourceNotFoundException;
import com.example.SelfOrderingRestaurant.Repository.AttendanceRepository;
import com.example.SelfOrderingRestaurant.Repository.StaffRepository;
import com.example.SelfOrderingRestaurant.Repository.StaffShiftRepository;
import com.example.SelfOrderingRestaurant.Service.FaceVerificationClient.VerifyResult;
import com.example.SelfOrderingRestaurant.Service.Imp.IAttendanceService;
import com.example.SelfOrderingRestaurant.Service.WorkingHoursCalculator.ShiftWindow;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

@Service
public class AttendanceService implements IAttendanceService {

    private static final DateTimeFormatter HH_MM = DateTimeFormatter.ofPattern("HH:mm");

    private final AttendanceRepository attendanceRepository;
    private final StaffRepository staffRepository;
    private final StaffShiftRepository staffShiftRepository;
    private final FaceVerificationClient faceClient;
    private Clock clock = Clock.systemDefaultZone();

    public AttendanceService(AttendanceRepository attendanceRepository,
                             StaffRepository staffRepository,
                             StaffShiftRepository staffShiftRepository,
                             FaceVerificationClient faceClient) {
        this.attendanceRepository = attendanceRepository;
        this.staffRepository = staffRepository;
        this.staffShiftRepository = staffShiftRepository;
        this.faceClient = faceClient;
    }

    void setClock(Clock clock) {
        this.clock = clock;
    }

    @Override
    @Transactional
    public AttendanceResultDTO scan(String username, AttendanceStatus type, byte[] image) {
        Staff staff = findStaff(username);
        LocalDateTime now = LocalDateTime.now(clock);
        Records recs = loadRecords(staff, now);
        validateTransition(type, recs);

        VerifyResult result = faceClient.verify(image, staff.getFaceImagePath());
        if (result.noFace()) {
            throw new AttendanceException(AttendanceError.NO_FACE);
        }
        if (result.spoof()) {
            throw new AttendanceException(AttendanceError.SPOOF_DETECTED);
        }
        if (!result.verified()) {
            throw new AttendanceException(AttendanceError.FACE_MISMATCH);
        }
        return record(staff, type, recs, now, null);
    }

    @Override
    @Transactional
    public AttendanceResultDTO manual(String username, AttendanceStatus type, String reason) {
        Staff staff = findStaff(username);
        LocalDateTime now = LocalDateTime.now(clock);
        Records recs = loadRecords(staff, now);
        validateTransition(type, recs);
        return record(staff, type, recs, now, reason);
    }

    @Override
    @Transactional(readOnly = true)
    public AttendanceTodayDTO today(String username) {
        Staff staff = findStaff(username);
        LocalDateTime now = LocalDateTime.now(clock);
        Records recs = loadRecords(staff, now);
        Attendance current = recs.open() != null ? recs.open() : recs.today();
        String status = recs.open() != null ? "CHECKED_IN" : recs.today() != null ? "CHECKED_OUT" : "NONE";
        LocalDate shiftDate = current != null ? current.getCheckInTime().toLocalDate() : now.toLocalDate();
        List<ShiftWindow> windows = shiftWindows(staff, shiftDate);
        LocalDateTime anchor = current != null ? current.getCheckInTime() : now;
        ShiftInfoDTO shift = WorkingHoursCalculator.displayShift(anchor, windows).map(AttendanceService::toShiftInfo).orElse(null);
        AttendanceResultDTO attendance = current == null ? null : toResult(staff, current, shift, null);
        return new AttendanceTodayDTO(status, attendance, shift);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PendingAttendanceDTO> pending() {
        return attendanceRepository.findByManualTrueAndApprovedIsNullOrderByCheckInTimeDesc().stream()
                .map(a -> new PendingAttendanceDTO(
                        a.getAttendanceId(),
                        a.getStaffId(),
                        staffRepository.findById(a.getStaffId()).map(Staff::getFullname).orElse("#" + a.getStaffId()),
                        a.getCheckInTime(),
                        a.getCheckOutTime(),
                        a.getWorkingHours(),
                        a.getManualReason()))
                .toList();
    }

    @Override
    @Transactional
    public void review(Integer attendanceId, boolean approved) {
        Attendance a = attendanceRepository.findById(attendanceId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bản ghi chấm công " + attendanceId));
        if (!Boolean.TRUE.equals(a.getManual()) || a.getApproved() != null) {
            throw new AttendanceException(AttendanceError.ALREADY_REVIEWED);
        }
        a.setApproved(approved);
        a.setUpdatedAt(LocalDateTime.now(clock));
        attendanceRepository.save(a);
        if (approved && a.getCheckOutTime() != null && a.getWorkingHours() != null) {
            staffRepository.findById(a.getStaffId()).ifPresent(staff -> addHours(staff, a.getWorkingHours()));
        }
    }

    // ---------- helpers ----------

    private record Records(Attendance open, Attendance today) {
    }

    private Staff findStaff(String username) {
        return staffRepository.findByUserUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy nhân viên: " + username));
    }

    private Records loadRecords(Staff staff, LocalDateTime now) {
        List<Attendance> recent = attendanceRepository.findByStaffIdAndCheckInTimeBetween(
                staff.getStaffId(), now.minusHours(24), now);
        Comparator<Attendance> byCheckIn = Comparator.comparing(Attendance::getCheckInTime);
        Attendance open = recent.stream()
                .filter(a -> a.getCheckInTime() != null && a.getCheckOutTime() == null)
                .max(byCheckIn).orElse(null);
        Attendance today = recent.stream()
                .filter(a -> a.getCheckInTime() != null && a.getCheckInTime().toLocalDate().equals(now.toLocalDate()))
                .max(byCheckIn).orElse(null);
        return new Records(open, today);
    }

    private void validateTransition(AttendanceStatus type, Records recs) {
        if (type == AttendanceStatus.CHECK_IN && (recs.open() != null || recs.today() != null)) {
            throw new AttendanceException(AttendanceError.ALREADY_CHECKED_IN);
        }
        if (type == AttendanceStatus.CHECK_OUT && recs.open() == null) {
            throw new AttendanceException(recs.today() != null
                    ? AttendanceError.ALREADY_CHECKED_OUT
                    : AttendanceError.NOT_CHECKED_IN);
        }
    }

    /** reason == null nghĩa là chấm công bằng khuôn mặt; khác null là chấm công thủ công. */
    private AttendanceResultDTO record(Staff staff, AttendanceStatus type, Records recs, LocalDateTime now, String reason) {
        boolean manual = reason != null;
        Attendance a;
        List<ShiftWindow> windows;
        if (type == AttendanceStatus.CHECK_IN) {
            windows = shiftWindows(staff, now.toLocalDate());
            a = new Attendance();
            a.setStaffId(staff.getStaffId());
            a.setCheckInTime(now);
            a.setStatus(AttendanceStatus.CHECK_IN);
            a.setCreatedAt(now);
            a.setLate(WorkingHoursCalculator.isLate(now, windows));
        } else {
            a = recs.open();
            windows = shiftWindows(staff, a.getCheckInTime().toLocalDate());
            WorkingHoursCalculator.Result r = WorkingHoursCalculator.calculate(a.getCheckInTime(), now, windows);
            a.setCheckOutTime(now);
            a.setStatus(AttendanceStatus.CHECK_OUT);
            a.setWorkingHours(r.workingHours());
            a.setLate(r.late());
            a.setEarlyLeave(r.earlyLeave());
        }
        a.setUpdatedAt(now);
        if (manual) {
            a.setManual(true);
            a.setApproved(null);
            a.setManualReason(a.getManualReason() == null ? reason : a.getManualReason() + " | " + reason);
        }
        attendanceRepository.save(a);

        if (type == AttendanceStatus.CHECK_OUT) {
            completeShifts(staff, a, windows);
            if (!Boolean.TRUE.equals(a.getManual()) || Boolean.TRUE.equals(a.getApproved())) {
                addHours(staff, a.getWorkingHours());
            }
        }
        ShiftInfoDTO shift = WorkingHoursCalculator.displayShift(a.getCheckInTime(), windows)
                .map(AttendanceService::toShiftInfo).orElse(null);
        return toResult(staff, a, shift, message(type, manual));
    }

    private List<ShiftWindow> shiftWindows(Staff staff, LocalDate date) {
        return activeShifts(staff, date).stream()
                .map(ss -> ShiftWindow.of(ss.getShift().getName(), date, ss.getShift().getStartTime(), ss.getShift().getEndTime()))
                .toList();
    }

    private List<StaffShift> activeShifts(Staff staff, LocalDate date) {
        return staffShiftRepository.findByStaffAndDate(staff, date).stream()
                .filter(ss -> ss.getShift() != null && ss.getStatus() != StaffShiftStatus.ABSENT)
                .toList();
    }

    private void completeShifts(Staff staff, Attendance a, List<ShiftWindow> windows) {
        LocalDate date = a.getCheckInTime().toLocalDate();
        for (StaffShift ss : activeShifts(staff, date)) {
            ShiftWindow w = ShiftWindow.of(ss.getShift().getName(), date, ss.getShift().getStartTime(), ss.getShift().getEndTime());
            if (WorkingHoursCalculator.overlapHours(a.getCheckInTime(), a.getCheckOutTime(), w) > 0) {
                ss.setStatus(StaffShiftStatus.COMPLETED);
                staffShiftRepository.save(ss);
            }
        }
    }

    private void addHours(Staff staff, Double hours) {
        double current = staff.getTotalWorkingHours() == null ? 0.0 : staff.getTotalWorkingHours();
        staff.setTotalWorkingHours(Math.round((current + hours) * 100) / 100.0);
        staffRepository.save(staff);
    }

    private static String message(AttendanceStatus type, boolean manual) {
        if (manual) {
            return "Đã ghi nhận chấm công thủ công, chờ quản lý duyệt";
        }
        return type == AttendanceStatus.CHECK_IN ? "Check-in thành công" : "Check-out thành công";
    }

    private static ShiftInfoDTO toShiftInfo(ShiftWindow w) {
        return new ShiftInfoDTO(w.name(), w.start().format(HH_MM), w.end().format(HH_MM));
    }

    private static AttendanceResultDTO toResult(Staff staff, Attendance a, ShiftInfoDTO shift, String message) {
        boolean checkedOut = a.getCheckOutTime() != null;
        return new AttendanceResultDTO(
                a.getAttendanceId(),
                checkedOut ? "CHECK_OUT" : "CHECK_IN",
                staff.getFullname(),
                checkedOut ? a.getCheckOutTime() : a.getCheckInTime(),
                shift,
                Boolean.TRUE.equals(a.getLate()),
                Boolean.TRUE.equals(a.getEarlyLeave()),
                a.getWorkingHours(),
                Boolean.TRUE.equals(a.getManual()),
                message);
    }
}
```

- [ ] **Step 3.6: Run test to verify it passes**

Run: `./mvnw -q test -Dtest=AttendanceServiceTest`
Expected: PASS (15 tests).

- [ ] **Step 3.7: Commit**

```bash
git add src/main/java/com/example/SelfOrderingRestaurant/Entity/Attendance.java src/main/java/com/example/SelfOrderingRestaurant/Repository/AttendanceRepository.java src/main/java/com/example/SelfOrderingRestaurant/Dto/Response/AttendanceResponseDTO src/main/java/com/example/SelfOrderingRestaurant/Service/Imp/IAttendanceService.java src/main/java/com/example/SelfOrderingRestaurant/Service/AttendanceService.java src/test/java/com/example/SelfOrderingRestaurant/Service/AttendanceServiceTest.java
git commit -m "feat(attendance): add attendance service with shift-based hours and manual approval"
```

---

### Task 4: Viết lại `AttendanceController` + SecurityConfig

**Files:**
- Create: `B/Dto/Request/AttendanceRequestDTO/ManualAttendanceRequestDTO.java`
- Create: `B/Dto/Request/AttendanceRequestDTO/AttendanceApprovalRequestDTO.java`
- Modify (rewrite toàn bộ): `B/Controller/AttendanceController.java`
- Modify: `B/Config/SecurityConfig.java:85-86`
- Test: `T/Controller/AttendanceControllerTest.java`

**Interfaces:**
- Consumes: `IAttendanceService` (Task 3), `GlobalExeptionHandler` (Task 2).
- Produces (HTTP, dùng bởi Task 6–8):
  - `POST /api/attendance/scan` multipart `image` (file), `type` (`CHECK_IN|CHECK_OUT`) → `AttendanceResultDTO`
  - `POST /api/attendance/manual` JSON `{ "type", "reason" }` → `AttendanceResultDTO`
  - `GET /api/attendance/today` → `AttendanceTodayDTO`
  - `GET /api/attendance/pending` → `PendingAttendanceDTO[]`
  - `PATCH /api/attendance/{id}/approval` JSON `{ "approved": true|false }` → 204
  - Giữ nguyên `POST /api/attendance/add-face`, `GET /api/attendance/history`.

- [ ] **Step 4.1: Write the failing test**

`T/Controller/AttendanceControllerTest.java`:

```java
package com.example.SelfOrderingRestaurant.Controller;

import com.example.SelfOrderingRestaurant.Dto.Response.AttendanceResponseDTO.AttendanceResultDTO;
import com.example.SelfOrderingRestaurant.Entity.Attendance.AttendanceStatus;
import com.example.SelfOrderingRestaurant.Exception.AttendanceError;
import com.example.SelfOrderingRestaurant.Exception.AttendanceException;
import com.example.SelfOrderingRestaurant.Exception.GlobalExeptionHandler;
import com.example.SelfOrderingRestaurant.Repository.AttendanceRepository;
import com.example.SelfOrderingRestaurant.Repository.StaffRepository;
import com.example.SelfOrderingRestaurant.Service.Imp.IAttendanceService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDateTime;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class AttendanceControllerTest {

    private IAttendanceService service;
    private MockMvc mvc;
    private final UsernamePasswordAuthenticationToken staff =
            new UsernamePasswordAuthenticationToken("hoang", null);

    @BeforeEach
    void setUp() {
        service = mock(IAttendanceService.class);
        AttendanceController controller = new AttendanceController(service,
                mock(AttendanceRepository.class), mock(StaffRepository.class));
        mvc = MockMvcBuilders.standaloneSetup(controller)
                .setControllerAdvice(new GlobalExeptionHandler())
                .build();
    }

    @Test
    void scan_success_returnsResult() throws Exception {
        when(service.scan(eq("hoang"), eq(AttendanceStatus.CHECK_IN), any())).thenReturn(new AttendanceResultDTO(
                1, "CHECK_IN", "Hoàng", LocalDateTime.of(2026, 10, 18, 7, 58), null, false, false, null, false, "Check-in thành công"));
        mvc.perform(multipart("/api/attendance/scan")
                        .file(new MockMultipartFile("image", "c.jpg", "image/jpeg", new byte[]{1}))
                        .param("type", "CHECK_IN")
                        .principal(staff))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.staffName").value("Hoàng"))
                .andExpect(jsonPath("$.type").value("CHECK_IN"));
    }

    @Test
    void scan_attendanceError_mapsStatusAndCode() throws Exception {
        when(service.scan(any(), any(), any())).thenThrow(new AttendanceException(AttendanceError.FACE_MISMATCH));
        mvc.perform(multipart("/api/attendance/scan")
                        .file(new MockMultipartFile("image", "c.jpg", "image/jpeg", new byte[]{1}))
                        .param("type", "CHECK_IN")
                        .principal(staff))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("FACE_MISMATCH"));
    }

    @Test
    void manual_blankReason_returns400() throws Exception {
        mvc.perform(post("/api/attendance/manual")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"type\":\"CHECK_IN\",\"reason\":\"  \"}")
                        .principal(staff))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
        String tooLong = "x".repeat(256);
        mvc.perform(post("/api/attendance/manual")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"type\":\"CHECK_IN\",\"reason\":\"" + tooLong + "\"}")
                        .principal(staff))
                .andExpect(status().isBadRequest());
        verifyNoInteractions(service);
    }

    @Test
    void approval_callsReview_returns204() throws Exception {
        mvc.perform(patch("/api/attendance/7/approval")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"approved\":true}"))
                .andExpect(status().isNoContent());
        verify(service).review(7, true);
    }
}
```

- [ ] **Step 4.2: Run test to verify it fails**

Run: `./mvnw -q test -Dtest=AttendanceControllerTest`
Expected: COMPILATION ERROR — constructor `AttendanceController(IAttendanceService, AttendanceRepository, StaffRepository)` không tồn tại.

- [ ] **Step 4.3: Create request DTOs**

`B/Dto/Request/AttendanceRequestDTO/ManualAttendanceRequestDTO.java`:

```java
package com.example.SelfOrderingRestaurant.Dto.Request.AttendanceRequestDTO;

import com.example.SelfOrderingRestaurant.Entity.Attendance;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ManualAttendanceRequestDTO(
        @NotNull Attendance.AttendanceStatus type,
        @NotBlank @Size(max = 255) String reason) {
}
```

`B/Dto/Request/AttendanceRequestDTO/AttendanceApprovalRequestDTO.java`:

```java
package com.example.SelfOrderingRestaurant.Dto.Request.AttendanceRequestDTO;

import jakarta.validation.constraints.NotNull;

public record AttendanceApprovalRequestDTO(@NotNull Boolean approved) {
}
```

- [ ] **Step 4.4: Rewrite controller**

Thay **toàn bộ** nội dung `B/Controller/AttendanceController.java` bằng:

```java
package com.example.SelfOrderingRestaurant.Controller;

import com.example.SelfOrderingRestaurant.Dto.Request.AttendanceRequestDTO.AttendanceApprovalRequestDTO;
import com.example.SelfOrderingRestaurant.Dto.Request.AttendanceRequestDTO.ManualAttendanceRequestDTO;
import com.example.SelfOrderingRestaurant.Dto.Response.AttendanceResponseDTO.AttendanceResultDTO;
import com.example.SelfOrderingRestaurant.Dto.Response.AttendanceResponseDTO.AttendanceTodayDTO;
import com.example.SelfOrderingRestaurant.Dto.Response.AttendanceResponseDTO.PendingAttendanceDTO;
import com.example.SelfOrderingRestaurant.Entity.Attendance;
import com.example.SelfOrderingRestaurant.Entity.Staff;
import com.example.SelfOrderingRestaurant.Exception.ResourceNotFoundException;
import com.example.SelfOrderingRestaurant.Repository.AttendanceRepository;
import com.example.SelfOrderingRestaurant.Repository.StaffRepository;
import com.example.SelfOrderingRestaurant.Service.Imp.IAttendanceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/attendance")
@RequiredArgsConstructor
public class AttendanceController {

    private final IAttendanceService attendanceService;
    private final AttendanceRepository attendanceRepository;
    private final StaffRepository staffRepository;

    @PreAuthorize("hasRole('STAFF')")
    @PostMapping(value = "/scan", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public AttendanceResultDTO scan(@RequestParam("image") MultipartFile image,
                                    @RequestParam("type") Attendance.AttendanceStatus type,
                                    Authentication authentication) throws IOException {
        return attendanceService.scan(authentication.getName(), type, image.getBytes());
    }

    @PreAuthorize("hasRole('STAFF')")
    @PostMapping("/manual")
    public AttendanceResultDTO manual(@Valid @RequestBody ManualAttendanceRequestDTO request,
                                      Authentication authentication) {
        return attendanceService.manual(authentication.getName(), request.type(), request.reason().trim());
    }

    @PreAuthorize("hasRole('STAFF')")
    @GetMapping("/today")
    public AttendanceTodayDTO today(Authentication authentication) {
        return attendanceService.today(authentication.getName());
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/pending")
    public List<PendingAttendanceDTO> pending() {
        return attendanceService.pending();
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/{id}/approval")
    public ResponseEntity<Void> review(@PathVariable Integer id,
                                       @Valid @RequestBody AttendanceApprovalRequestDTO request) {
        attendanceService.review(id, request.approved());
        return ResponseEntity.noContent().build();
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/add-face")
    public ResponseEntity<?> addFace(@RequestParam("staffId") Integer staffId,
                                     @RequestParam("image") MultipartFile image) throws IOException {
        String uploadDir = "uploads/staff_faces/";
        File dir = new File(uploadDir);
        if (!dir.exists()) {
            dir.mkdirs();
        }
        String filePath = uploadDir + staffId + ".jpg";
        Files.write(Paths.get(filePath), image.getBytes());

        Staff staff = staffRepository.findById(staffId)
                .orElseThrow(() -> new ResourceNotFoundException("Staff not found"));
        staff.setFaceImagePath(filePath);
        staffRepository.save(staff);

        return ResponseEntity.ok(Map.of("message", "Face added successfully for staff ID " + staffId));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/history")
    public List<Attendance> getAttendanceHistory() {
        return attendanceRepository.findAll();
    }
}
```

- [ ] **Step 4.5: Update SecurityConfig**

Trong `B/Config/SecurityConfig.java`, thay 2 dòng:

```java
                        .requestMatchers("/api/attendance/check-in", "/api/attendance/check-in-camera").hasRole("STAFF")
                        .requestMatchers("/api/attendance/add-face", "/api/attendance/history").hasRole("ADMIN")
```

bằng:

```java
                        .requestMatchers("/api/attendance/scan", "/api/attendance/manual", "/api/attendance/today").hasRole("STAFF")
                        .requestMatchers("/api/attendance/add-face", "/api/attendance/history",
                                "/api/attendance/pending", "/api/attendance/*/approval").hasRole("ADMIN")
```

- [ ] **Step 4.6: Run tests**

Run: `./mvnw -q test -Dtest="AttendanceControllerTest,AttendanceServiceTest,FaceVerificationClientTest,WorkingHoursCalculatorTest"`
Expected: PASS (tất cả 34 tests).

Run: `./mvnw -q -DskipTests package`
Expected: BUILD SUCCESS (không còn tham chiếu tới OpenCV trong `AttendanceController`).

- [ ] **Step 4.7: Commit**

```bash
git add src/main/java/com/example/SelfOrderingRestaurant/Dto/Request/AttendanceRequestDTO src/main/java/com/example/SelfOrderingRestaurant/Controller/AttendanceController.java src/main/java/com/example/SelfOrderingRestaurant/Config/SecurityConfig.java src/test/java/com/example/SelfOrderingRestaurant/Controller/AttendanceControllerTest.java
git commit -m "refactor(attendance): replace 4 check-in/out endpoints with scan/manual/today API"
```

---

### Task 5: Python service — anti-spoofing & lỗi không thấy mặt

**Files:**
- Modify: `FaceRecognition/face_recognition.py` (khối `DeepFace.verify` + `except ValueError`)
- Modify: `FaceRecognition/requirements.txt`

**Interfaces:**
- Produces: `POST /verify` → `200 {"verified": bool, "distance": float}` | `200 {"verified": false, "spoof": true}` | `200 {"verified": false, "no_face": true}` (đúng định dạng `FaceVerificationClient` đọc ở Task 2).

- [ ] **Step 5.1: Update verify call and error mapping**

Trong `FaceRecognition/face_recognition.py`, thay đoạn từ `result = DeepFace.verify(` tới hết `except ValueError as ve:` block bằng:

```python
            result = DeepFace.verify(
                img1_path=temp_image_path,
                img2_path=temp_reference_path,
                model_name="ArcFace",
                detector_backend="opencv",
                distance_metric="euclidean_l2",
                enforce_detection=True,
                anti_spoofing=True
            )
            logger.debug(f"Verification result: {result}")
            response = {
                "verified": result["verified"],
                "distance": result["distance"]
            }

            return jsonify(response), 200

        except ValueError as ve:
            message = str(ve)
            if "spoof" in message.lower():
                logger.warning(f"Spoof detected: {message}")
                return jsonify({"verified": False, "spoof": True}), 200
            if "could not be detected" in message.lower():
                logger.info(f"No face detected: {message}")
                return jsonify({"verified": False, "no_face": True}), 200
            logger.error(f"DeepFace verification failed: {message}")
            return jsonify({"error": f"Face verification failed: {message}"}), 400
```

- [ ] **Step 5.2: Update requirements**

`FaceRecognition/requirements.txt` — đổi `deepface==0.0.84` thành `deepface==0.0.93`, thêm dòng đầu file và dòng torch:

```
--extra-index-url https://download.pytorch.org/whl/cpu
Flask==3.0.0
deepface==0.0.93
opencv-python-headless==4.8.1.78
tensorflow==2.15.0
tf-keras==2.15.0
torch==2.3.1+cpu
Werkzeug==3.0.1
```

- [ ] **Step 5.3: Verify syntax**

Run: `python -c "import ast,sys; ast.parse(open('FaceRecognition/face_recognition.py',encoding='utf-8').read()); print('ok')"`
Expected: `ok`

(Kiểm thử chạy thật ở Task 9 nếu máy có môi trường Python của service.)

- [ ] **Step 5.4: Commit**

```bash
git add FaceRecognition/face_recognition.py FaceRecognition/requirements.txt
git commit -m "feat(face): enable DeepFace anti-spoofing and return no_face/spoof flags"
```

---

### Task 6: Frontend — API attendance + `FaceScanner`

**Files:**
- Modify: `frontend/package.json` (thêm `@mediapipe/tasks-vision` 0.10.14, exact)
- Create: `frontend/src/services/attendanceAPI.js`
- Create: `frontend/src/components/attendance/attendanceMessages.js`
- Create: `frontend/src/components/attendance/FaceScanner.jsx`

**Interfaces:**
- Consumes: HTTP API Task 4; `authAPI` từ `frontend/src/axiosConfig.js`.
- Produces:
  - `scanAttendance(type: "CHECK_IN"|"CHECK_OUT", blob: Blob): Promise<AttendanceResult>`
  - `manualAttendance(type, reason: string): Promise<AttendanceResult>`
  - `getTodayAttendance(): Promise<{status, attendance, shift}>`
  - `getPendingAttendance(): Promise<PendingAttendance[]>`
  - `reviewAttendance(id: number, approved: boolean): Promise<void>`
  - `describeAttendanceError(error): { code: string, message: string, kind: "retry"|"done"|"fatal" }`
  - `formatAttendanceResult(result): string`
  - `<FaceScanner mode="CHECK_IN"|"CHECK_OUT" onSuccess={(result) => …} onCancel?={() => …} />` — `onSuccess` nhận `AttendanceResult` hoặc `{ alreadyDone: true, message }` khi server trả 409.

- [ ] **Step 6.1: Install dependency**

Run (trong `frontend/`): `npm install --save-exact @mediapipe/tasks-vision@0.10.14`
Expected: `package.json` có `"@mediapipe/tasks-vision": "0.10.14"`.

- [ ] **Step 6.2: Create API module**

`frontend/src/services/attendanceAPI.js`:

```js
import { authAPI } from "../axiosConfig";

export const scanAttendance = async (type, blob) => {
  const formData = new FormData();
  formData.append("image", blob, "capture.jpg");
  formData.append("type", type);
  const { data } = await authAPI.post("/api/attendance/scan", formData);
  return data;
};

export const manualAttendance = async (type, reason) => {
  const { data } = await authAPI.post("/api/attendance/manual", { type, reason });
  return data;
};

export const getTodayAttendance = async () => {
  const { data } = await authAPI.get("/api/attendance/today");
  return data;
};

export const getPendingAttendance = async () => {
  const { data } = await authAPI.get("/api/attendance/pending");
  return data;
};

export const reviewAttendance = async (id, approved) => {
  await authAPI.patch(`/api/attendance/${id}/approval`, { approved });
};
```

- [ ] **Step 6.3: Create message helpers**

`frontend/src/components/attendance/attendanceMessages.js`:

```js
const RETRYABLE = new Set(["NO_FACE", "FACE_MISMATCH", "SPOOF_DETECTED"]);

const FALLBACK_MESSAGES = {
  NETWORK: "Không kết nối được máy chủ",
  UNAUTHORIZED: "Phiên đăng nhập đã hết hạn",
  UNKNOWN: "Có lỗi xảy ra, vui lòng thử lại",
};

export function describeAttendanceError(error) {
  const status = error?.response?.status;
  const data = error?.response?.data || {};
  if (!error?.response) {
    return { code: "NETWORK", message: FALLBACK_MESSAGES.NETWORK, kind: "fatal" };
  }
  const code = data.code || (status === 401 || status === 403 ? "UNAUTHORIZED" : "UNKNOWN");
  const message = data.message || FALLBACK_MESSAGES[code] || FALLBACK_MESSAGES.UNKNOWN;
  if (status === 409) return { code, message, kind: "done" };
  if (RETRYABLE.has(code)) return { code, message, kind: "retry" };
  return { code, message, kind: "fatal" };
}

const hhmm = (iso) => (iso ? iso.substring(11, 16) : "");

export function formatAttendanceResult(result) {
  if (!result) return "";
  if (result.alreadyDone || result.manual) return result.message;
  if (result.type === "CHECK_IN") {
    const shift = result.shift ? ` · ${result.shift.name} ${result.shift.start}–${result.shift.end}` : "";
    const late = result.late ? " (đi trễ)" : "";
    return `Chào ${result.staffName}${shift} · Vào lúc ${hhmm(result.time)}${late}`;
  }
  const totalMinutes = Math.round((result.workingHours || 0) * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = String(totalMinutes % 60).padStart(2, "0");
  return `Ra lúc ${hhmm(result.time)} · Làm ${h}h${m}'`;
}
```

- [ ] **Step 6.4: Create `FaceScanner`**

`frontend/src/components/attendance/FaceScanner.jsx`:

```jsx
import { useCallback, useEffect, useRef, useState } from "react";
import { FaceDetector, FilesetResolver } from "@mediapipe/tasks-vision";
import { manualAttendance, scanAttendance } from "../../services/attendanceAPI";
import { describeAttendanceError, formatAttendanceResult } from "./attendanceMessages";

const WASM_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm";
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite";
const MAX_ATTEMPTS = 3;
const STABLE_MS = 500;
const MIN_CONFIDENCE = 0.8;
const MIN_FACE_RATIO = 0.2;
const RETRY_DELAY_MS = 1500;

// Trạng thái: INIT | SEARCHING | VERIFYING | SUCCESS | RETRY | FAILED
const HINTS = {
  INIT: "Đang bật camera…",
  SEARCHING: "Đưa khuôn mặt vào khung",
  VERIFYING: "Đang xác thực…",
};

function isFaceReady(detections, videoWidth) {
  if (detections.length !== 1) return false;
  const d = detections[0];
  const score = d.categories?.[0]?.score ?? 0;
  return score >= MIN_CONFIDENCE && d.boundingBox.width / videoWidth >= MIN_FACE_RATIO;
}

export default function FaceScanner({ mode, onSuccess, onCancel }) {
  const videoRef = useRef(null);
  const detectorRef = useRef(null);
  const stableSinceRef = useRef(null);
  const busyRef = useRef(false);
  const stateRef = useRef("INIT");
  const attemptsRef = useRef(0);
  const [state, setStateValue] = useState("INIT");
  const [message, setMessage] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [detectorFailed, setDetectorFailed] = useState(false);
  const [reason, setReason] = useState("");

  const setState = useCallback((s) => {
    stateRef.current = s;
    setStateValue(s);
  }, []);

  const finish = useCallback(
    (result) => {
      setState("SUCCESS");
      setMessage(formatAttendanceResult(result));
      onSuccess(result);
    },
    [onSuccess, setState]
  );

  const handleError = useCallback(
    (error) => {
      const { message: msg, kind } = describeAttendanceError(error);
      if (kind === "done") {
        finish({ alreadyDone: true, message: msg });
        return;
      }
      if (kind === "fatal") {
        setMessage(msg);
        setState("FAILED");
        return;
      }
      attemptsRef.current += 1;
      setAttempts(attemptsRef.current);
      setMessage(msg);
      if (attemptsRef.current >= MAX_ATTEMPTS) {
        setState("FAILED");
        return;
      }
      setState("RETRY");
      setTimeout(() => {
        stableSinceRef.current = null;
        if (stateRef.current === "RETRY") setState("SEARCHING");
      }, RETRY_DELAY_MS);
    },
    [finish, setState]
  );

  const captureAndVerify = useCallback(async () => {
    const video = videoRef.current;
    if (busyRef.current || !video || !video.videoWidth) return;
    busyRef.current = true;
    setState("VERIFYING");
    try {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext("2d").drawImage(video, 0, 0);
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));
      const result = await scanAttendance(mode, blob);
      finish(result);
    } catch (error) {
      handleError(error);
    } finally {
      busyRef.current = false;
    }
  }, [mode, finish, handleError, setState]);

  // Bật camera + nạp detector
  useEffect(() => {
    let cancelled = false;
    let stream;
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
        if (cancelled) return;
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      } catch {
        if (!cancelled) {
          setMessage("Không truy cập được camera");
          setState("FAILED");
        }
        return;
      }
      try {
        const vision = await FilesetResolver.forVisionTasks(WASM_URL);
        detectorRef.current = await FaceDetector.createFromOptions(vision, {
          baseOptions: { modelAssetPath: MODEL_URL },
          runningMode: "VIDEO",
          minDetectionConfidence: 0.5,
        });
      } catch {
        if (!cancelled) setDetectorFailed(true); // vẫn cho chụp bằng nút
      }
      if (!cancelled && stateRef.current === "INIT") setState("SEARCHING");
    })();
    return () => {
      cancelled = true;
      stream?.getTracks().forEach((t) => t.stop());
      detectorRef.current?.close();
      detectorRef.current = null;
    };
  }, [setState]);

  // Vòng lặp phát hiện khuôn mặt
  useEffect(() => {
    if (state !== "SEARCHING" || detectorFailed) return;
    let frame;
    const loop = () => {
      const video = videoRef.current;
      const detector = detectorRef.current;
      if (video && detector && video.readyState >= 2 && !busyRef.current) {
        const { detections } = detector.detectForVideo(video, performance.now());
        if (isFaceReady(detections, video.videoWidth)) {
          stableSinceRef.current ??= performance.now();
          if (performance.now() - stableSinceRef.current >= STABLE_MS) {
            captureAndVerify();
            return;
          }
        } else {
          stableSinceRef.current = null;
        }
      }
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [state, detectorFailed, captureAndVerify]);

  const submitManual = async () => {
    if (!reason.trim() || busyRef.current) return;
    busyRef.current = true;
    try {
      finish(await manualAttendance(mode, reason.trim()));
    } catch (error) {
      const { message: msg, kind } = describeAttendanceError(error);
      if (kind === "done") finish({ alreadyDone: true, message: msg });
      else setMessage(msg);
    } finally {
      busyRef.current = false;
    }
  };

  const title = mode === "CHECK_IN" ? "Check-in" : "Check-out";
  const ringColor =
    state === "SUCCESS" ? "border-green-400" : state === "RETRY" || state === "FAILED" ? "border-red-400" : "border-white/80";

  return (
    <div className="w-full max-w-md mx-auto flex flex-col items-center gap-4 p-4 rounded-3xl bg-black/60 backdrop-blur text-white shadow-2xl">
      <h2 className="text-2xl font-semibold">{title} bằng khuôn mặt</h2>

      <div className="relative w-full aspect-[3/4] overflow-hidden rounded-2xl bg-black">
        <video ref={videoRef} playsInline muted className="absolute inset-0 w-full h-full object-cover -scale-x-100" />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div
            className={`w-3/5 aspect-[3/4] rounded-[50%] border-4 transition-colors ${ringColor} ${
              state === "VERIFYING" ? "animate-pulse" : ""
            }`}
          />
        </div>
        {state === "SUCCESS" && (
          <div className="absolute inset-0 flex items-center justify-center bg-green-600/40 text-6xl">✓</div>
        )}
      </div>

      <p className="text-center min-h-[3rem]" aria-live="polite">
        {state === "SUCCESS" || state === "RETRY" || state === "FAILED" ? message : HINTS[state]}
        {state === "RETRY" && ` (lần ${attempts}/${MAX_ATTEMPTS})`}
      </p>

      {detectorFailed && state === "SEARCHING" && (
        <button
          type="button"
          onClick={captureAndVerify}
          className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 font-medium"
        >
          Chụp ảnh
        </button>
      )}

      {state === "FAILED" && (
        <div className="w-full flex flex-col gap-2">
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value.slice(0, 255))}
            placeholder="Lý do chấm công thủ công (bắt buộc)"
            rows={2}
            className="w-full rounded-xl p-3 text-black"
          />
          <button
            type="button"
            disabled={!reason.trim()}
            onClick={submitManual}
            className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 font-medium"
          >
            Chấm công thủ công
          </button>
        </div>
      )}

      {onCancel && state !== "SUCCESS" && (
        <button type="button" onClick={onCancel} className="text-sm text-white/70 underline">
          Huỷ
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 6.5: Lint & build**

Run (trong `frontend/`): `npx eslint src/components/attendance src/services/attendanceAPI.js && npm run build`
Expected: không lỗi ESLint; `vite build` thành công.

- [ ] **Step 6.6: Commit**

```bash
git add frontend/package.json frontend/package-lock.json frontend/src/services/attendanceAPI.js frontend/src/components/attendance
git commit -m "feat(frontend): add auto-capturing FaceScanner with MediaPipe face detection"
```

(Kiểm tra tay các mục Review Focus #1, #4 thực hiện ở Task 9 khi có backend chạy.)

---

### Task 7: Frontend — nối luồng check-in / check-out, xoá `CheckOut.jsx`

**Files:**
- Modify (rewrite): `frontend/src/pages/Staff/Attendance/Attendance.jsx`
- Create: `frontend/src/components/attendance/useStaffLogout.jsx`
- Modify: `frontend/src/components/layout/MenuBar.jsx` (`handleLogout` dòng ~141–177 và JSX gốc)
- Modify: `frontend/src/pages/Staff/StaffInformation/StaffInformation.jsx` (`handleLogout` dòng ~255–287 và JSX gốc)
- Modify: `frontend/src/pages/Staff/Login/Login.jsx` (Google login STAFF → `/attendance`, dòng ~230)
- Modify: `frontend/src/App.jsx` (xoá import + route `/check-out`)
- Modify: `frontend/src/ProtectedRoute.jsx` (xoá `/check-out` khỏi `staffRoutes` và `bypassRoutes`)
- Modify: `frontend/src/axiosConfig.js` (xoá `attendanceCheckOut`, dòng ~300–313)
- Delete: `frontend/src/pages/Staff/CheckOut/CheckOut.jsx`

**Interfaces:**
- Consumes: `FaceScanner`, `getTodayAttendance`, `formatAttendanceResult` (Task 6); `logout` từ `axiosConfig.js`.
- Produces: `useStaffLogout(): { requestLogout: () => Promise<void>, logoutModal: JSX.Element | null }`.

- [ ] **Step 7.1: Rewrite Attendance page**

`frontend/src/pages/Staff/Attendance/Attendance.jsx`:

```jsx
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import FaceScanner from "../../../components/attendance/FaceScanner";
import { formatAttendanceResult } from "../../../components/attendance/attendanceMessages";
import { getTodayAttendance } from "../../../services/attendanceAPI";

const STAFF_HOME = "/table-management_staff";

const Attendance = () => {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const userType = localStorage.getItem("userType");
    if (!localStorage.getItem("accessToken")) {
      navigate("/login", { replace: true });
      return;
    }
    if (userType === "ADMIN") {
      navigate("/table-management_admin", { replace: true });
      return;
    }
    getTodayAttendance()
      .then((today) => {
        if (today.status === "NONE") setReady(true);
        else navigate(STAFF_HOME, { replace: true });
      })
      .catch(() => setReady(true));
  }, [navigate]);

  const handleSuccess = useCallback(
    (result) => {
      toast.success(formatAttendanceResult(result));
      setTimeout(() => navigate(STAFF_HOME, { replace: true }), 1500);
    },
    [navigate]
  );

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center p-4 bg-cover bg-center"
      style={{ backgroundImage: "url('https://i.pinimg.com/736x/94/95/3b/94953b87c421ef358cad42c358876403.jpg')" }}
    >
      {ready ? (
        <FaceScanner mode="CHECK_IN" onSuccess={handleSuccess} />
      ) : (
        <div className="w-12 h-12 rounded-full border-4 border-white border-t-transparent animate-spin" />
      )}
    </div>
  );
};

export default Attendance;
```

- [ ] **Step 7.2: Create logout hook**

`frontend/src/components/attendance/useStaffLogout.jsx`:

```jsx
import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { logout } from "../../axiosConfig";
import FaceScanner from "./FaceScanner";
import { formatAttendanceResult } from "./attendanceMessages";
import { getTodayAttendance } from "../../services/attendanceAPI";

const SESSION_KEYS = ["accessToken", "refreshToken", "username", "userType", "staffId"];

/** Đăng xuất; với STAFF đang check-in thì mở modal check-out bằng khuôn mặt trước. */
export default function useStaffLogout() {
  const navigate = useNavigate();
  const [scanning, setScanning] = useState(false);

  const finishLogout = useCallback(async () => {
    try {
      await logout();
    } catch {
      // vẫn xoá phiên phía client dù server lỗi
    }
    SESSION_KEYS.forEach((k) => localStorage.removeItem(k));
    navigate("/login", { replace: true });
  }, [navigate]);

  const requestLogout = useCallback(async () => {
    if (localStorage.getItem("userType") === "STAFF") {
      try {
        const today = await getTodayAttendance();
        if (today.status === "CHECKED_IN") {
          setScanning(true);
          return;
        }
      } catch {
        // không lấy được trạng thái → đăng xuất luôn
      }
    }
    await finishLogout();
  }, [finishLogout]);

  const handleCheckedOut = useCallback(
    (result) => {
      toast.success(formatAttendanceResult(result));
      setTimeout(() => {
        setScanning(false);
        finishLogout();
      }, 1500);
    },
    [finishLogout]
  );

  const logoutModal = scanning ? (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 p-4">
      <FaceScanner mode="CHECK_OUT" onSuccess={handleCheckedOut} onCancel={() => setScanning(false)} />
    </div>
  ) : null;

  return { requestLogout, logoutModal };
}
```

- [ ] **Step 7.3: Wire MenuBar**

Trong `frontend/src/components/layout/MenuBar.jsx`:
1. Thêm import: `import useStaffLogout from "../attendance/useStaffLogout";`
2. Trong thân component (gần các `useState` khác) thêm: `const { requestLogout, logoutModal } = useStaffLogout();`
3. Thay **toàn bộ** hàm `handleLogout` (từ `const handleLogout = () => {` tới `};` đóng của nó, khoảng dòng 141–177) bằng:

```jsx
  const handleLogout = () => {
    requestLogout();
  };
```

4. Render modal: trong JSX trả về, ngay trước thẻ đóng ngoài cùng của component thêm `{logoutModal}`. Nếu phần tử gốc không phải fragment, bọc lại: `return (<>{/* JSX cũ */}{logoutModal}</>);`.

- [ ] **Step 7.4: Wire StaffInformation**

Trong `frontend/src/pages/Staff/StaffInformation/StaffInformation.jsx`:
1. Thêm import: `import useStaffLogout from "../../../components/attendance/useStaffLogout";`
2. Trong thân component thêm: `const { requestLogout, logoutModal } = useStaffLogout();`
3. Thay toàn bộ hàm `handleLogout` (khoảng dòng 255–287) bằng:

```jsx
  const handleLogout = () => {
    requestLogout();
  };
```

4. Thêm `{logoutModal}` vào cuối JSX trả về (bọc fragment nếu cần, như Step 7.3).

- [ ] **Step 7.5: Google login STAFF → /attendance**

Trong `frontend/src/pages/Staff/Login/Login.jsx`, trong khối điều hướng sau `toast.success("Google login successful!");`, đổi:

```jsx
        case "STAFF":
          navigate("/staff-information_staff", { replace: true });
```

thành:

```jsx
        case "STAFF":
          navigate("/attendance", { replace: true });
```

- [ ] **Step 7.6: Remove old check-out page and references**

1. Xoá file: `git rm frontend/src/pages/Staff/CheckOut/CheckOut.jsx`
2. `frontend/src/App.jsx`: xoá dòng `import CheckOut from "./pages/Staff/CheckOut/CheckOut";` và khối `<Route path="/check-out" …>…</Route>` (dòng ~148–155).
3. `frontend/src/ProtectedRoute.jsx`: xoá dòng `"/check-out", // This route is added …` trong `staffRoutes`; đổi `const bypassRoutes = ["/check-out"];` thành `const bypassRoutes = [];`.
4. `frontend/src/axiosConfig.js`: xoá hàm `attendanceCheckOut` (comment `// Attendance` và cả hàm).
5. Kiểm tra không còn tham chiếu:

Run: `grep -rn "check-out\|CheckOut\|attendanceCheckOut" frontend/src`
Expected: không có kết quả.

- [ ] **Step 7.7: Lint & build**

Run (trong `frontend/`): `npx eslint src/pages/Staff/Attendance src/components/attendance && npm run build`
Expected: thành công.

- [ ] **Step 7.8: Commit**

```bash
git add -A frontend/src
git commit -m "feat(frontend): auto check-in after login and face check-out on logout"
```

---

### Task 8: Admin — duyệt chấm công thủ công

**Files:**
- Create: `frontend/src/components/attendance/PendingAttendancePanel.jsx`
- Modify: `frontend/src/pages/Admin/StaffManagement/StaffManagement.jsx` (import + chèn panel ngay sau `<h1 style={styles.title}>Staff</h1>`, dòng ~859)

**Interfaces:**
- Consumes: `getPendingAttendance`, `reviewAttendance` (Task 6); `describeAttendanceError` (Task 6).
- Produces: `<PendingAttendancePanel />` — tự fetch, không render gì khi danh sách rỗng.

- [ ] **Step 8.1: Create panel**

`frontend/src/components/attendance/PendingAttendancePanel.jsx`:

```jsx
import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { getPendingAttendance, reviewAttendance } from "../../services/attendanceAPI";
import { describeAttendanceError } from "./attendanceMessages";

const fmt = (iso) => (iso ? `${iso.substring(8, 10)}/${iso.substring(5, 7)} ${iso.substring(11, 16)}` : "—");

export default function PendingAttendancePanel() {
  const [items, setItems] = useState([]);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(() => {
    getPendingAttendance()
      .then(setItems)
      .catch((e) => toast.error(describeAttendanceError(e).message));
  }, []);

  useEffect(load, [load]);

  const review = async (id, approved) => {
    setBusyId(id);
    try {
      await reviewAttendance(id, approved);
      toast.success(approved ? "Đã duyệt" : "Đã từ chối");
      setItems((prev) => prev.filter((i) => i.attendanceId !== id));
    } catch (e) {
      toast.error(describeAttendanceError(e).message);
      load();
    } finally {
      setBusyId(null);
    }
  };

  if (items.length === 0) return null;

  return (
    <section className="mb-6 rounded-2xl border border-amber-300 bg-amber-50 p-4">
      <h2 className="mb-3 text-lg font-semibold text-amber-800">Chấm công chờ duyệt ({items.length})</h2>
      <ul className="flex flex-col gap-2">
        {items.map((i) => (
          <li
            key={i.attendanceId}
            className="flex flex-col gap-2 rounded-xl bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="text-sm">
              <div className="font-medium">{i.staffName}</div>
              <div className="text-gray-600">
                Vào {fmt(i.checkInTime)} · Ra {fmt(i.checkOutTime)}
                {i.workingHours != null && ` · ${i.workingHours}h`}
              </div>
              <div className="italic text-gray-500">“{i.reason}”</div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={busyId === i.attendanceId}
                onClick={() => review(i.attendanceId, true)}
                className="rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:opacity-50"
              >
                Duyệt
              </button>
              <button
                type="button"
                disabled={busyId === i.attendanceId}
                onClick={() => review(i.attendanceId, false)}
                className="rounded-lg bg-red-500 px-4 py-2 text-white hover:bg-red-600 disabled:opacity-50"
              >
                Từ chối
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
```

- [ ] **Step 8.2: Mount in StaffManagement**

Trong `frontend/src/pages/Admin/StaffManagement/StaffManagement.jsx`:
1. Thêm import: `import PendingAttendancePanel from "../../../components/attendance/PendingAttendancePanel";`
2. Ngay sau dòng `<h1 style={styles.title}>Staff</h1>` thêm: `<PendingAttendancePanel />`

- [ ] **Step 8.3: Lint & build**

Run (trong `frontend/`): `npx eslint src/components/attendance && npm run build`
Expected: thành công.

- [ ] **Step 8.4: Commit**

```bash
git add frontend/src/components/attendance/PendingAttendancePanel.jsx frontend/src/pages/Admin/StaffManagement/StaffManagement.jsx
git commit -m "feat(admin): review pending manual attendance records"
```

---

### Task 9: Kiểm tra toàn bộ

**Files:** không sửa code (chỉ sửa nếu phát hiện lỗi, commit riêng).

- [ ] **Step 9.1: Backend test & build**

Run: `./mvnw -q test -Dtest="AttendanceControllerTest,AttendanceServiceTest,FaceVerificationClientTest,WorkingHoursCalculatorTest"` → PASS.
Run: `./mvnw -q -DskipTests package` → BUILD SUCCESS.
Run: `./mvnw -q test` → ghi lại kết quả; các test `@SpringBootTest` có sẵn cần DB — nếu fail vì thiếu DB/kết nối (không liên quan thay đổi), ghi rõ trong báo cáo, không sửa.

- [ ] **Step 9.2: Frontend build**

Run (trong `frontend/`): `npm run build` → thành công.

- [ ] **Step 9.3: Kiểm tra tay (nếu chạy được backend + Python service + frontend)**

1. Login STAFF → camera tự bật → nhìn camera → tự check-in → toast lời chào → tự chuyển `/table-management_staff`.
2. Login lại cùng ngày → bỏ qua camera, vào thẳng quản lý bàn.
3. Đăng xuất → modal camera → tự check-out → toast "Ra lúc … · Làm …" → về `/login`.
4. Giơ 2 khuôn mặt / không có mặt → không chụp (Review Focus #4); trong khi đang "Đang xác thực…" không có request thứ 2 (tab Network).
5. Chặn `cdn.jsdelivr.net` (DevTools → Network request blocking) → hiện nút "Chụp ảnh", bấm vẫn gửi được (Review Focus #1).
6. Từ chối quyền camera → hiện ô lý do + "Chấm công thủ công" → gửi → admin thấy trong "Chấm công chờ duyệt" → Duyệt → biến mất khỏi danh sách.
7. Giơ ảnh chụp khuôn mặt trên điện thoại trước camera → "Phát hiện hình ảnh giả mạo".

Nếu không chạy được môi trường đầy đủ, báo cáo rõ những bước nào chưa kiểm tra được.
