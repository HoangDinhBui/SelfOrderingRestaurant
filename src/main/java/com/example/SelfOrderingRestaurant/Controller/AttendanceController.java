package com.example.SelfOrderingRestaurant.Controller;

import com.example.SelfOrderingRestaurant.Entity.Attendance;
import com.example.SelfOrderingRestaurant.Entity.Staff;
import com.example.SelfOrderingRestaurant.Entity.StaffShift;
import com.example.SelfOrderingRestaurant.Repository.AttendanceRepository;
import com.example.SelfOrderingRestaurant.Repository.StaffRepository;
import com.example.SelfOrderingRestaurant.Repository.StaffShiftRepository;
import lombok.RequiredArgsConstructor;
import org.opencv.core.Mat;
import org.opencv.core.MatOfRect;
import org.opencv.imgcodecs.Imgcodecs;
import org.opencv.objdetect.CascadeClassifier;
import org.opencv.core.Size;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.net.URL;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/attendance")
@RequiredArgsConstructor
public class AttendanceController {

    @Autowired
    private AttendanceRepository attendanceRepository;

    @Autowired
    private StaffRepository staffRepository;

    @Autowired
    private StaffShiftRepository staffShiftRepository;

    @Autowired
    private RestTemplate restTemplate;

    @Value("${deepface.api.url:http://localhost:5000/verify}")
    private String deepfaceApiUrl;

    private CascadeClassifier faceDetector;

    public AttendanceController() {
        try {
            // Đọc tệp cascade từ classpath/resources dưới dạng InputStream
            java.io.InputStream is = getClass().getResourceAsStream("/cascade/haarcascade_frontalface_default.xml");
            if (is == null) {
                throw new RuntimeException("Không tìm thấy file haarcascade_frontalface_default.xml trong resources.");
            }

            // Tạo file tạm thời trên hệ thống tệp vật lý
            File tempCascadeFile = File.createTempFile("haarcascade_frontalface_default", ".xml");
            tempCascadeFile.deleteOnExit(); // Đảm bảo tự động xóa khi ứng dụng tắt

            // Sao chép luồng dữ liệu sang file tạm thời
            try (java.io.FileOutputStream os = new java.io.FileOutputStream(tempCascadeFile)) {
                byte[] buffer = new byte[4096];
                int bytesRead;
                while ((bytesRead = is.read(buffer)) != -1) {
                    os.write(buffer, 0, bytesRead);
                }
            }

            // Nạp CascadeClassifier từ đường dẫn của file tạm thời
            faceDetector = new CascadeClassifier(tempCascadeFile.getAbsolutePath());
            if (faceDetector.empty()) {
                throw new RuntimeException("Không thể load file cascade từ file tạm: " + tempCascadeFile.getAbsolutePath());
            }
            System.out.println("Đã nạp thành công Haar Cascade từ file tạm thời: " + tempCascadeFile.getAbsolutePath());

        } catch (Throwable e) {
            System.err.println("Lỗi khi khởi tạo AttendanceController: " + e.getMessage());
            faceDetector = null;
        }
    }

    private File getReferenceImageFile(String referencePath) throws IOException {
        if (referencePath == null || referencePath.isEmpty()) {
            return null;
        }
        if (referencePath.startsWith("http")) {
            File refTempFile = File.createTempFile("ref_face_", ".jpg");
            byte[] refBytes = restTemplate.getForObject(referencePath, byte[].class);
            if (refBytes != null) {
                Files.write(refTempFile.toPath(), refBytes);
                return refTempFile;
            }
            return null;
        } else {
            if (Files.exists(Paths.get(referencePath))) {
                return new File(referencePath);
            }
            return null;
        }
    }

    @PreAuthorize("hasRole('STAFF')")
    @PostMapping("/check-in")
    public ResponseEntity<?> checkIn(@RequestBody Map<String, String> payload, Authentication authentication) throws IOException {
        String imageBase64 = payload.get("image");
        byte[] imageBytes = Base64.getDecoder().decode(imageBase64);
        File tempFile = File.createTempFile("face_auth_", ".jpg");
        Files.write(tempFile.toPath(), imageBytes);

        // Phát hiện khuôn mặt bằng OpenCV (Tăng độ khó để không nhận nhầm bàn tay)
        Mat image = Imgcodecs.imread(tempFile.getAbsolutePath());
        MatOfRect faceDetections = new MatOfRect();
        faceDetector.detectMultiScale(image, faceDetections, 1.1, 7, 0, new Size(100, 100), new Size());

        if (faceDetections.toArray().length == 0) {
            Files.deleteIfExists(tempFile.toPath());
            return ResponseEntity.badRequest().body(Map.of("message", "Không phát hiện khuôn mặt hợp lệ (Vui lòng để rõ mặt)"));
        }

        // Lấy staffId từ JWT
        String username = authentication.getName();
        Staff staff = staffRepository.findByUserUsername(username)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy nhân viên với tên đăng nhập: " + username));
        Integer staffId = staff.getStaffId();

        String referencePath = staff.getFaceImagePath();
        File referenceFile = getReferenceImageFile(referencePath);
        if (referenceFile == null) {
            Files.deleteIfExists(tempFile.toPath());
            return ResponseEntity.badRequest().body(Map.of("message", "Đường dẫn ảnh khuôn mặt không hợp lệ cho " + staff.getFullname()));
        }

        // Gửi ảnh đến DeepFace microservice trước
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);
        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("image", new FileSystemResource(tempFile));
        body.add("reference_image", new FileSystemResource(referenceFile));

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(deepfaceApiUrl, new HttpEntity<>(body, headers), Map.class);
            if (response.getStatusCode().is2xxSuccessful() && (Boolean) response.getBody().get("verified")) {
                
                // Nếu đúng là mặt nhân viên, mới kiểm tra xem đã check-in chưa
                LocalDate today = LocalDate.now();
                LocalDateTime now = LocalDateTime.now();
                LocalDateTime startOfDay = today.atStartOfDay();
                LocalDateTime endOfDay = today.atTime(23, 59, 59);

                List<Attendance> existingCheckIns = attendanceRepository.findByStaffIdAndCheckInTimeBetweenAndStatus(
                        staffId, startOfDay, endOfDay, Attendance.AttendanceStatus.CHECK_IN);
                if (!existingCheckIns.isEmpty()) {
                    Files.deleteIfExists(tempFile.toPath());
                    if (referencePath != null && referencePath.startsWith("http")) referenceFile.delete();
                    return ResponseEntity.ok(Map.of("message", "Đã ghi nhận check-in cho " + staff.getFullname() + " hôm nay lúc " + existingCheckIns.get(0).getCreatedAt()));
                }

                Attendance attendance = new Attendance();
                attendance.setStaffId(staffId);
                attendance.setCheckInTime(now);
                attendance.setStatus(Attendance.AttendanceStatus.CHECK_IN);
                attendance.setFaceImagePath(tempFile.getAbsolutePath());
                attendance.setCreatedAt(now);
                attendanceRepository.save(attendance);

                Files.deleteIfExists(tempFile.toPath());
                if (referencePath != null && referencePath.startsWith("http")) referenceFile.delete();
                return ResponseEntity.ok(Map.of("message", "Check-in thành công cho " + staff.getFullname()));
            } else {
                Files.deleteIfExists(tempFile.toPath());
                if (referencePath != null && referencePath.startsWith("http")) referenceFile.delete();
                return ResponseEntity.badRequest().body(Map.of("message", "Khuôn mặt không khớp với hồ sơ nhân viên"));
            }
        } catch (HttpClientErrorException e) {
            System.out.println("Lỗi DeepFace: " + e.getResponseBodyAsString());
            Files.deleteIfExists(tempFile.toPath());
            if (referencePath != null && referencePath.startsWith("http")) referenceFile.delete();
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(Map.of("message", "Dịch vụ xác thực khuôn mặt không khả dụng"));
        }
    }

    @PreAuthorize("hasRole('STAFF')")
    @PostMapping("/check-in-camera")
    public ResponseEntity<?> checkInCamera(@RequestParam("image") MultipartFile image, Authentication authentication) throws IOException {
        File tempFile = File.createTempFile("face_auth_", ".jpg");
        Files.write(tempFile.toPath(), image.getBytes());

        // Phát hiện khuôn mặt bằng OpenCV (Tăng độ khó)
        Mat matImage = Imgcodecs.imread(tempFile.getAbsolutePath());
        MatOfRect faceDetections = new MatOfRect();
        faceDetector.detectMultiScale(matImage, faceDetections, 1.1, 7, 0, new Size(100, 100), new Size());

        if (faceDetections.toArray().length == 0) {
            Files.deleteIfExists(tempFile.toPath());
            return ResponseEntity.badRequest().body(Map.of("message", "Không phát hiện khuôn mặt hợp lệ (Vui lòng để rõ mặt)"));
        }

        // Lấy staffId từ JWT
        String username = authentication.getName();
        Staff staff = staffRepository.findByUserUsername(username)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy nhân viên với tên đăng nhập: " + username));
        Integer staffId = staff.getStaffId();

        String referencePath = staff.getFaceImagePath();
        File referenceFile = getReferenceImageFile(referencePath);
        if (referenceFile == null) {
            Files.deleteIfExists(tempFile.toPath());
            return ResponseEntity.badRequest().body(Map.of("message", "Đường dẫn ảnh khuôn mặt không hợp lệ cho " + staff.getFullname()));
        }

        // Gửi ảnh đến DeepFace microservice trước khi check xem đã check-in chưa
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);
        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("image", new FileSystemResource(tempFile));
        body.add("reference_image", new FileSystemResource(referenceFile));

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(deepfaceApiUrl, new HttpEntity<>(body, headers), Map.class);
            if (response.getStatusCode().is2xxSuccessful() && (Boolean) response.getBody().get("verified")) {
                
                // AI xác nhận đúng người, giờ mới check CSDL
                LocalDate today = LocalDate.now();
                LocalDateTime now = LocalDateTime.now();
                LocalDateTime startOfDay = today.atStartOfDay();
                LocalDateTime endOfDay = today.atTime(23, 59, 59);

                List<Attendance> existingCheckIns = attendanceRepository.findByStaffIdAndCheckInTimeBetweenAndStatus(
                        staffId, startOfDay, endOfDay, Attendance.AttendanceStatus.CHECK_IN);
                if (!existingCheckIns.isEmpty()) {
                    Files.deleteIfExists(tempFile.toPath());
                    if (referencePath != null && referencePath.startsWith("http")) referenceFile.delete();
                    return ResponseEntity.ok(Map.of("message", "Đã ghi nhận check-in cho " + staff.getFullname() + " hôm nay lúc " + existingCheckIns.get(0).getCreatedAt()));
                }

                Attendance attendance = new Attendance();
                attendance.setStaffId(staffId);
                attendance.setCheckInTime(now);
                attendance.setStatus(Attendance.AttendanceStatus.CHECK_IN);
                attendance.setFaceImagePath(tempFile.getAbsolutePath());
                attendance.setCreatedAt(now);
                attendanceRepository.save(attendance);

                Files.deleteIfExists(tempFile.toPath());
                if (referencePath != null && referencePath.startsWith("http")) referenceFile.delete();
                return ResponseEntity.ok(Map.of("message", "Check-in thành công cho " + staff.getFullname()));
            } else {
                Files.deleteIfExists(tempFile.toPath());
                if (referencePath != null && referencePath.startsWith("http")) referenceFile.delete();
                return ResponseEntity.badRequest().body(Map.of("message", "Khuôn mặt không khớp với hồ sơ nhân viên"));
            }
        } catch (HttpClientErrorException e) {
            System.out.println("Lỗi DeepFace: " + e.getResponseBodyAsString());
            Files.deleteIfExists(tempFile.toPath());
            if (referencePath != null && referencePath.startsWith("http")) referenceFile.delete();
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(Map.of("message", "Dịch vụ xác thực khuôn mặt không khả dụng"));
        }
    }

    @PreAuthorize("hasRole('STAFF')")
    @PostMapping("/check-out")
    public ResponseEntity<?> checkOut(@RequestBody Map<String, String> payload, Authentication authentication) throws IOException {
        String imageBase64 = payload.get("image");
        byte[] imageBytes = Base64.getDecoder().decode(imageBase64);
        File tempFile = File.createTempFile("face_auth_", ".jpg");
        Files.write(tempFile.toPath(), imageBytes);

        // Phát hiện khuôn mặt bằng OpenCV
        Mat image = Imgcodecs.imread(tempFile.getAbsolutePath());
        MatOfRect faceDetections = new MatOfRect();
        faceDetector.detectMultiScale(image, faceDetections);

        if (faceDetections.toArray().length == 0) {
            Files.deleteIfExists(tempFile.toPath());
            return ResponseEntity.badRequest().body(Map.of("message", "Không phát hiện khuôn mặt"));
        }

        // Lấy staffId từ JWT
        String username = authentication.getName();
        Staff staff = staffRepository.findByUserUsername(username)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy nhân viên với tên đăng nhập: " + username));
        Integer staffId = staff.getStaffId();

        String referencePath = staff.getFaceImagePath();
        File referenceFile = getReferenceImageFile(referencePath);
        if (referenceFile == null) {
            Files.deleteIfExists(tempFile.toPath());
            return ResponseEntity.badRequest().body(Map.of("message", "Đường dẫn ảnh khuôn mặt không hợp lệ cho " + staff.getFullname()));
        }

        // Kiểm tra bản ghi check-in hôm nay
        LocalDate today = LocalDate.now();
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime startOfDay = today.atStartOfDay();
        LocalDateTime endOfDay = today.atTime(23, 59, 59);

        List<Attendance> checkInRecords = attendanceRepository.findByStaffIdAndCheckInTimeBetweenAndStatus(
                staffId, startOfDay, endOfDay, Attendance.AttendanceStatus.CHECK_IN);
        if (checkInRecords.isEmpty()) {
            Files.deleteIfExists(tempFile.toPath());
            if (referencePath != null && referencePath.startsWith("http")) referenceFile.delete();
            return ResponseEntity.badRequest().body(Map.of("message", "Không tìm thấy bản ghi check-in cho " + staff.getFullname() + " hôm nay"));
        }

        // Kiểm tra bản ghi check-out hôm nay
        List<Attendance> checkOutRecords = attendanceRepository.findByStaffIdAndCheckInTimeBetweenAndStatus(
                staffId, startOfDay, endOfDay, Attendance.AttendanceStatus.CHECK_OUT);

        // Gửi ảnh đến DeepFace microservice
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);
        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("image", new FileSystemResource(tempFile));
        body.add("reference_image", new FileSystemResource(referenceFile));

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(deepfaceApiUrl, new HttpEntity<>(body, headers), Map.class);
            if (response.getStatusCode().is2xxSuccessful() && (Boolean) response.getBody().get("verified")) {
                // Lấy bản ghi check-in mới nhất
                Attendance attendance = checkInRecords.stream()
                        .max((a1, a2) -> a1.getCreatedAt().compareTo(a2.getCreatedAt()))
                        .orElse(checkInRecords.get(0));

                LocalDateTime checkInTime = attendance.getCreatedAt();
                LocalDateTime checkOutTime = now;
                Duration duration = Duration.between(checkInTime, checkOutTime);
                double workingHours = duration.toMinutes() / 60.0;

                String message = "Check-out thành công cho " + staff.getFullname();
                LocalDateTime effectiveCheckOutTime = checkOutTime;

                // Kiểm tra bản ghi check-out trước đó
                if (!checkOutRecords.isEmpty()) {
                    Attendance latestCheckOut = checkOutRecords.stream()
                            .max((a1, a2) -> a1.getUpdatedAt().compareTo(a2.getUpdatedAt()))
                            .orElse(checkOutRecords.get(0));
                    double previousWorkingHours = latestCheckOut.getWorkingHours() != null ? latestCheckOut.getWorkingHours() : 0.0;

                    if (previousWorkingHours >= 5.0) {
                        // Đã đủ 5 tiếng, xem như spam
                        message = "Cảnh báo: Check-out được xem là spam vì đã đủ 5 tiếng làm việc trước đó.";
                        effectiveCheckOutTime = checkInTime.plusHours(5); // Giữ thời gian tại 5 tiếng
                        workingHours = 5.0;
                    } else {
                        // Chưa đủ 5 tiếng trước đó, cập nhật bình thường
                        if (workingHours >= 5.0) {
                            effectiveCheckOutTime = checkInTime.plusHours(5); // Lưu tại 5 tiếng
                            workingHours = 5.0;
                            message = "Check-out thành công cho " + staff.getFullname() + ", thời gian làm việc được điều chỉnh về 5 tiếng.";
                        }
                    }
                } else {
                    // Chưa có check-out, xử lý lần đầu
                    if (workingHours >= 5.0) {
                        effectiveCheckOutTime = checkInTime.plusHours(5); // Lưu tại 5 tiếng
                        workingHours = 5.0;
                        message = "Check-out thành công cho " + staff.getFullname() + ", thời gian làm việc được điều chỉnh về 5 tiếng.";
                    }
                }

                attendance.setCheckOutTime(effectiveCheckOutTime);
                attendance.setStatus(Attendance.AttendanceStatus.CHECK_OUT);
                attendance.setUpdatedAt(now);
                attendance.setWorkingHours(workingHours);
                attendanceRepository.save(attendance);

                Files.deleteIfExists(tempFile.toPath());
                if (referencePath != null && referencePath.startsWith("http")) referenceFile.delete();
                return ResponseEntity.ok(Map.of(
                        "message", message,
                        "working_hours", workingHours,
                        "total_working_hours", staff.getTotalWorkingHours()
                ));
            } else {
                Files.deleteIfExists(tempFile.toPath());
                if (referencePath != null && referencePath.startsWith("http")) referenceFile.delete();
                return ResponseEntity.badRequest().body(Map.of("message", "Khuôn mặt không được nhận diện"));
            }
        } catch (HttpClientErrorException e) {
            System.out.println("Lỗi DeepFace: " + e.getResponseBodyAsString());
            Files.deleteIfExists(tempFile.toPath());
            if (referencePath != null && referencePath.startsWith("http")) referenceFile.delete();
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(Map.of("message", "Dịch vụ xác thực khuôn mặt không khả dụng"));
        }
    }

    @PreAuthorize("hasRole('STAFF')")
    @PostMapping("/check-out-camera")
    public ResponseEntity<?> checkOutCamera(@RequestParam("image") MultipartFile image, Authentication authentication) throws IOException {
        File tempFile = File.createTempFile("face_auth_", ".jpg");
        Files.write(tempFile.toPath(), image.getBytes());

        // Phát hiện khuôn mặt bằng OpenCV
        Mat matImage = Imgcodecs.imread(tempFile.getAbsolutePath());
        MatOfRect faceDetections = new MatOfRect();
        faceDetector.detectMultiScale(matImage, faceDetections);

        if (faceDetections.toArray().length == 0) {
            Files.deleteIfExists(tempFile.toPath());
            return ResponseEntity.badRequest().body(Map.of("message", "Không phát hiện khuôn mặt"));
        }

        // Lấy staffId từ JWT
        String username = authentication.getName();
        Staff staff = staffRepository.findByUserUsername(username)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy nhân viên với tên đăng nhập: " + username));
        Integer staffId = staff.getStaffId();

        String referencePath = staff.getFaceImagePath();
        File referenceFile = getReferenceImageFile(referencePath);
        if (referenceFile == null) {
            Files.deleteIfExists(tempFile.toPath());
            return ResponseEntity.badRequest().body(Map.of("message", "Đường dẫn ảnh khuôn mặt không hợp lệ cho " + staff.getFullname()));
        }

        // Kiểm tra bản ghi check-in hôm nay
        LocalDate today = LocalDate.now();
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime startOfDay = today.atStartOfDay();
        LocalDateTime endOfDay = today.atTime(23, 59, 59);

        List<Attendance> checkInRecords = attendanceRepository.findByStaffIdAndCheckInTimeBetweenAndStatus(
                staffId, startOfDay, endOfDay, Attendance.AttendanceStatus.CHECK_IN);
        if (checkInRecords.isEmpty()) {
            Files.deleteIfExists(tempFile.toPath());
            if (referencePath != null && referencePath.startsWith("http")) referenceFile.delete();
            return ResponseEntity.badRequest().body(Map.of("message", "Không tìm thấy bản ghi check-in cho " + staff.getFullname() + " hôm nay"));
        }

        // Kiểm tra bản ghi check-out hôm nay
        List<Attendance> checkOutRecords = attendanceRepository.findByStaffIdAndCheckInTimeBetweenAndStatus(
                staffId, startOfDay, endOfDay, Attendance.AttendanceStatus.CHECK_OUT);

        // Gửi ảnh đến DeepFace microservice
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);
        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("image", new FileSystemResource(tempFile));
        body.add("reference_image", new FileSystemResource(referenceFile));

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(deepfaceApiUrl, new HttpEntity<>(body, headers), Map.class);
            if (response.getStatusCode().is2xxSuccessful() && (Boolean) response.getBody().get("verified")) {
                // Lấy bản ghi check-in mới nhất
                Attendance attendance = checkInRecords.stream()
                        .max((a1, a2) -> a1.getCreatedAt().compareTo(a2.getCreatedAt()))
                        .orElse(checkInRecords.get(0));

                LocalDateTime checkInTime = attendance.getCreatedAt();
                LocalDateTime checkOutTime = now;
                Duration duration = Duration.between(checkInTime, checkOutTime);
                double workingHours = duration.toMinutes() / 60.0;

                String message = "Check-out thành công cho " + staff.getFullname();
                LocalDateTime effectiveCheckOutTime = checkOutTime;

                // Kiểm tra bản ghi check-out trước đó
                if (!checkOutRecords.isEmpty()) {
                    Attendance latestCheckOut = checkOutRecords.stream()
                            .max((a1, a2) -> a1.getUpdatedAt().compareTo(a2.getUpdatedAt()))
                            .orElse(checkOutRecords.get(0));
                    double previousWorkingHours = latestCheckOut.getWorkingHours() != null ? latestCheckOut.getWorkingHours() : 0.0;

                    if (previousWorkingHours >= 5.0) {
                        // Đã đủ 5 tiếng, xem như spam
                        message = "Cảnh báo: Check-out được xem là spam vì đã đủ 5 tiếng làm việc trước đó.";
                        effectiveCheckOutTime = checkInTime.plusHours(5); // Giữ thời gian tại 5 tiếng
                        workingHours = 5.0;
                    } else {
                        // Chưa đủ 5 tiếng trước đó, cập nhật bình thường
                        if (workingHours >= 5.0) {
                            effectiveCheckOutTime = checkInTime.plusHours(5); // Lưu tại 5 tiếng
                            workingHours = 5.0;
                            message = "Check-out thành công cho " + staff.getFullname() + ", thời gian làm việc được điều chỉnh về 5 tiếng.";
                        }
                    }
                } else {
                    // Chưa có check-out, xử lý lần đầu
                    if (workingHours >= 5.0) {
                        effectiveCheckOutTime = checkInTime.plusHours(5); // Lưu tại 5 tiếng
                        workingHours = 5.0;
                        message = "Check-out thành công cho " + staff.getFullname() + ", thời gian làm việc được điều chỉnh về 5 tiếng.";
                    }
                }

                attendance.setCheckOutTime(effectiveCheckOutTime);
                attendance.setStatus(Attendance.AttendanceStatus.CHECK_OUT);
                attendance.setUpdatedAt(now);
                attendance.setWorkingHours(workingHours);
                attendanceRepository.save(attendance);

                Files.deleteIfExists(tempFile.toPath());
                if (referencePath != null && referencePath.startsWith("http")) referenceFile.delete();
                return ResponseEntity.ok(Map.of(
                        "message", message,
                        "working_hours", workingHours,
                        "total_working_hours", staff.getTotalWorkingHours()
                ));
            } else {
                Files.deleteIfExists(tempFile.toPath());
                if (referencePath != null && referencePath.startsWith("http")) referenceFile.delete();
                return ResponseEntity.badRequest().body(Map.of("message", "Khuôn mặt không được nhận diện"));
            }
        } catch (HttpClientErrorException e) {
            System.out.println("Lỗi DeepFace: " + e.getResponseBodyAsString());
            Files.deleteIfExists(tempFile.toPath());
            if (referencePath != null && referencePath.startsWith("http")) referenceFile.delete();
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(Map.of("message", "Dịch vụ xác thực khuôn mặt không khả dụng"));
        }
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

        Staff staff = staffRepository.findById(staffId).orElseThrow(() -> new RuntimeException("Staff not found"));
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