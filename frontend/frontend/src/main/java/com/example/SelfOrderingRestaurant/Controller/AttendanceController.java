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
import org.springframework.beans.factory.annotation.Autowired;
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

    private final CascadeClassifier faceDetector;

    public AttendanceController() {
        // Tải Haar Cascade để phát hiện khuôn mặt
        faceDetector = new CascadeClassifier("D://Download/haarcascade_frontalface_default.xml");
    }

    @PreAuthorize("hasRole('STAFF')")
    @PostMapping("/check-in")
    public ResponseEntity<?> checkIn(@RequestBody Map<String, String> payload) throws IOException {
        String imageBase64 = payload.get("image");
        byte[] imageBytes = Base64.getDecoder().decode(imageBase64);
        File tempFile = new File("temp.jpg");
        Files.write(tempFile.toPath(), imageBytes);

        // Phát hiện khuôn mặt bằng OpenCV
        Mat image = Imgcodecs.imread(tempFile.getAbsolutePath());
        MatOfRect faceDetections = new MatOfRect();
        faceDetector.detectMultiScale(image, faceDetections);

        if (faceDetections.toArray().length == 0) {
            Files.delete(tempFile.toPath());
            return ResponseEntity.badRequest().body(Map.of("message", "No face detected"));
        }

        // Gửi ảnh đến DeepFace microservice
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);
        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("image", new FileSystemResource(tempFile));

        List<Staff> staffList = staffRepository.findAll();
        LocalDate today = LocalDate.now();
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime startOfDay = today.atStartOfDay();
        LocalDateTime endOfDay = today.atTime(23, 59, 59);

        for (Staff staff : staffList) {
            String referencePath = staff.getFaceImagePath();
            if (referencePath == null || !Files.exists(Paths.get(referencePath))) {
                System.out.println("Skipping staff ID " + staff.getStaffId() + ": Invalid face image path");
                continue;
            }

            // Kiểm tra xem nhân viên có ca làm hôm nay không
            List<StaffShift> staffShifts = staffShiftRepository.findByStaffAndDate(staff, today);
            if (staffShifts.isEmpty()) {
                System.out.println("No shift assigned for staff ID " + staff.getStaffId() + " on " + today);
                continue;
            }

            // Kiểm tra xem nhân viên đã check-in hôm nay chưa
            List<Attendance> existingCheckIns = attendanceRepository.findByStaffIdAndCheckInTimeBetweenAndStatus(
                    staff.getStaffId(), startOfDay, endOfDay, Attendance.AttendanceStatus.CHECK_IN);
            if (!existingCheckIns.isEmpty()) {
                Files.deleteIfExists(tempFile.toPath());
                return ResponseEntity.ok(Map.of("message", "Check-in already recorded for " + staff.getFullname() + " today"));
            }

            body.set("reference_path", referencePath);
            try {
                ResponseEntity<Map> response = restTemplate.postForEntity("http://localhost:5000/verify", new HttpEntity<>(body, headers), Map.class);
                if (response.getStatusCode().is2xxSuccessful() && (Boolean) response.getBody().get("verified")) {
                    Attendance attendance = new Attendance();
                    attendance.setStaffId(staff.getStaffId());
                    attendance.setCheckInTime(now);
                    attendance.setStatus(Attendance.AttendanceStatus.CHECK_IN);
                    attendance.setFaceImagePath(tempFile.getAbsolutePath());
                    attendance.setCreatedAt(now);
                    attendanceRepository.save(attendance);

                    Files.deleteIfExists(tempFile.toPath());
                    return ResponseEntity.ok(Map.of("message", "Check-in successful for " + staff.getFullname()));
                }
            } catch (HttpClientErrorException e) {
                System.out.println("DeepFace error: " + e.getResponseBodyAsString());
            }
        }

        Files.deleteIfExists(tempFile.toPath());
        return ResponseEntity.badRequest().body(Map.of("message", "Face not recognized or no shift assigned"));
    }

    @PreAuthorize("hasRole('STAFF')")
    @PostMapping("/check-in-camera")
    public ResponseEntity<?> checkInCamera(@RequestParam("image") MultipartFile image) throws IOException {
        File tempFile = new File("temp.jpg");
        Files.write(tempFile.toPath(), image.getBytes());

        // Phát hiện khuôn mặt bằng OpenCV
        Mat matImage = Imgcodecs.imread(tempFile.getAbsolutePath());
        MatOfRect faceDetections = new MatOfRect();
        faceDetector.detectMultiScale(matImage, faceDetections);

        if (faceDetections.toArray().length == 0) {
            Files.deleteIfExists(tempFile.toPath());
            return ResponseEntity.badRequest().body(Map.of("message", "No face detected"));
        }

        // Gửi ảnh đến DeepFace microservice
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);
        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("image", new FileSystemResource(tempFile));

        List<Staff> staffList = staffRepository.findAll();
        LocalDate today = LocalDate.now();
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime startOfDay = today.atStartOfDay();
        LocalDateTime endOfDay = today.atTime(23, 59, 59);

        for (Staff staff : staffList) {
            String referencePath = staff.getFaceImagePath();
            if (referencePath == null || !Files.exists(Paths.get(referencePath))) {
                System.out.println("Skipping staff ID " + staff.getStaffId() + ": Invalid face image path");
                continue;
            }

            // Kiểm tra xem nhân viên có ca làm hôm nay không
            List<StaffShift> staffShifts = staffShiftRepository.findByStaffAndDate(staff, today);
            if (staffShifts.isEmpty()) {
                System.out.println("No shift assigned for staff ID " + staff.getStaffId() + " on " + today);
                continue;
            }

            // Kiểm tra xem nhân viên đã check-in hôm nay chưa
            List<Attendance> existingCheckIns = attendanceRepository.findByStaffIdAndCheckInTimeBetweenAndStatus(
                    staff.getStaffId(), startOfDay, endOfDay, Attendance.AttendanceStatus.CHECK_IN);
            if (!existingCheckIns.isEmpty()) {
                // Nếu đã check-in, trả về thông báo thành công mà không tạo bản ghi mới
                Files.deleteIfExists(tempFile.toPath());
                return ResponseEntity.ok(Map.of("message", "Check-in already recorded for " + staff.getFullname() + " today at " + existingCheckIns.get(0).getCreatedAt()));
            }

            body.set("reference_path", referencePath);
            try {
                ResponseEntity<Map> response = restTemplate.postForEntity("http://localhost:5000/verify", new HttpEntity<>(body, headers), Map.class);
                if (response.getStatusCode().is2xxSuccessful() && (Boolean) response.getBody().get("verified")) {
                    Attendance attendance = new Attendance();
                    attendance.setStaffId(staff.getStaffId());
                    attendance.setCheckInTime(now);
                    attendance.setStatus(Attendance.AttendanceStatus.CHECK_IN);
                    attendance.setFaceImagePath(tempFile.getAbsolutePath());
                    attendance.setCreatedAt(now);
                    attendanceRepository.save(attendance);

                    Files.deleteIfExists(tempFile.toPath());
                    return ResponseEntity.ok(Map.of("message", "Check-in successful for " + staff.getFullname()));
                }
            } catch (HttpClientErrorException e) {
                System.out.println("DeepFace error: " + e.getResponseBodyAsString());
            }
        }

        Files.deleteIfExists(tempFile.toPath());
        return ResponseEntity.badRequest().body(Map.of("message", "Face not recognized or no shift assigned"));
    }

    @PreAuthorize("hasRole('STAFF')")
    @PostMapping("/check-out")
    public ResponseEntity<?> checkOut(@RequestBody Map<String, String> payload, Authentication authentication) throws IOException {
        String imageBase64 = payload.get("image");
        byte[] imageBytes = Base64.getDecoder().decode(imageBase64);
        File tempFile = new File("temp.jpg");
        Files.write(tempFile.toPath(), imageBytes);

        // Phát hiện khuôn mặt bằng OpenCV
        Mat image = Imgcodecs.imread(tempFile.getAbsolutePath());
        MatOfRect faceDetections = new MatOfRect();
        faceDetector.detectMultiScale(image, faceDetections);

        if (faceDetections.toArray().length == 0) {
            Files.delete(tempFile.toPath());
            return ResponseEntity.badRequest().body(Map.of("message", "No face detected"));
        }

        // Get userId from JWT
        String username = authentication.getName();
        Staff staff = staffRepository.findByUserUsername(username)
                .orElseThrow(() -> new RuntimeException("Staff not found for username: " + username));
        Integer staffId = staff.getStaffId();

        String referencePath = staff.getFaceImagePath();
        if (referencePath == null || !Files.exists(Paths.get(referencePath))) {
            Files.deleteIfExists(tempFile.toPath());
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid face image path for " + staff.getFullname()));
        }

        // Kiểm tra xem nhân viên có bản ghi check-in hôm nay không
        LocalDate today = LocalDate.now();
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime startOfDay = today.atStartOfDay();
        LocalDateTime endOfDay = today.atTime(23, 59, 59);

        List<Attendance> checkInRecords = attendanceRepository.findByStaffIdAndCheckInTimeBetweenAndStatus(
                staffId, startOfDay, endOfDay, Attendance.AttendanceStatus.CHECK_IN);
        if (checkInRecords.isEmpty()) {
            Files.deleteIfExists(tempFile.toPath());
            return ResponseEntity.badRequest().body(Map.of("message", "No check-in record found for " + staff.getFullname() + " today"));
        }

        // Gửi ảnh đến DeepFace microservice
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);
        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("image", new FileSystemResource(tempFile));
        body.set("reference_path", referencePath);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity("http://localhost:5000/verify", new HttpEntity<>(body, headers), Map.class);
            if (response.getStatusCode().is2xxSuccessful() && (Boolean) response.getBody().get("verified")) {
                // Lấy bản ghi check-in mới nhất
                Attendance attendance = checkInRecords.stream()
                        .max((a1, a2) -> a1.getCreatedAt().compareTo(a2.getCreatedAt()))
                        .orElse(checkInRecords.get(0));
                attendance.setCheckOutTime(now);
                attendance.setStatus(Attendance.AttendanceStatus.CHECK_OUT);
                attendance.setUpdatedAt(now);

                // Tính thời gian làm việc
                LocalDateTime checkInTime = attendance.getCreatedAt();
                LocalDateTime checkOutTime = now;
                Duration duration = Duration.between(checkInTime, checkOutTime);
                double workingHours = duration.toMinutes() / 60.0;
                attendance.setWorkingHours(workingHours);

                attendanceRepository.save(attendance);

                Files.deleteIfExists(tempFile.toPath());
                return ResponseEntity.ok(Map.of(
                        "message", "Check-out successful for " + staff.getFullname(),
                        "working_hours", workingHours,
                        "total_working_hours", staff.getTotalWorkingHours()
                ));
            } else {
                Files.deleteIfExists(tempFile.toPath());
                return ResponseEntity.badRequest().body(Map.of("message", "Face not recognized"));
            }
        } catch (HttpClientErrorException e) {
            System.out.println("DeepFace error: " + e.getResponseBodyAsString());
            Files.deleteIfExists(tempFile.toPath());
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(Map.of("message", "Face verification service is unavailable"));
        }
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/add-face")
    public ResponseEntity<?> addFace(@RequestParam("staffId") Integer staffId,
                                     @RequestParam("image") MultipartFile image) throws IOException {
        String filePath = "src/main/resources/static/staff_faces/" + staffId + ".jpg";
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