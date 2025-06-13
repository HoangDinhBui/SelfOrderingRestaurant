package com.example.SelfOrderingRestaurant.Controller;
import com.example.SelfOrderingRestaurant.Entity.Attendance;
import com.example.SelfOrderingRestaurant.Entity.Staff;
import com.example.SelfOrderingRestaurant.Repository.AttendanceRepository;
import com.example.SelfOrderingRestaurant.Repository.StaffRepository;
import lombok.RequiredArgsConstructor;
import org.opencv.core.Mat;
import org.opencv.core.MatOfRect;
import org.opencv.imgcodecs.Imgcodecs;
import org.opencv.objdetect.CascadeClassifier;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.FileSystemResource;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;
import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.*;
import java.nio.file.Files;
import java.nio.file.Paths;
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
    private RestTemplate restTemplate;

    private final CascadeClassifier faceDetector;

    public AttendanceController() {
        // Tải Haar Cascade để phát hiện khuôn mặt
        faceDetector = new CascadeClassifier("D://Download/haarcascade_frontalface_default.xml");
    }

    @PreAuthorize("hasRole('STAFF')")
    @PostMapping("/check-in")
    public ResponseEntity<?> checkIn(@RequestBody Map<String, String> payload) throws IOException {
        // Giải mã ảnh từ base64
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
        for (Staff staff : staffList) {
            String referencePath = staff.getFaceImagePath();
            if (referencePath == null) {
                System.out.println("Skipping staff ID " + staff.getStaffId() + ": No face image path");
                continue;
            }

            if (!Files.exists(Paths.get(referencePath))) {
                System.out.println("Reference path does not exist: " + referencePath);
                continue;
            }

            body.add("reference_path", referencePath);
            try {
                ResponseEntity<Map> response = restTemplate.postForEntity("http://localhost:5000/verify", new HttpEntity<>(body, headers), Map.class);
                if (response.getStatusCode().is2xxSuccessful() && (Boolean) response.getBody().get("verified")) {
                    Attendance attendance = new Attendance();
                    attendance.setStaffId(staff.getStaffId());
                    attendance.setCheckInTime(LocalDateTime.now());
                    attendance.setStatus(Attendance.AttendanceStatus.CHECK_IN);
                    attendance.setFaceImagePath(tempFile.getAbsolutePath());
                    attendanceRepository.save(attendance);

                    Files.deleteIfExists(tempFile.toPath());
                    return ResponseEntity.ok(Map.of("message", "Check-in successful for " + staff.getFullname()));
                }
            } catch (HttpClientErrorException e) {
                System.out.println("DeepFace error: " + e.getResponseBodyAsString());
                Files.deleteIfExists(tempFile.toPath());
                return ResponseEntity.badRequest().body(Map.of("message", "Face recognition failed: " + e.getResponseBodyAsString()));
            }
        }

        Files.deleteIfExists(tempFile.toPath());
        return ResponseEntity.badRequest().body(Map.of("message", "Face not recognized"));
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

    @PreAuthorize("hasRole('STAFF')")
    @PostMapping("/check-in-camera")
    public ResponseEntity<?> checkInCamera(@RequestParam("image") MultipartFile image) throws IOException {
        // Lưu ảnh tạm
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
        for (Staff staff : staffList) {
            String referencePath = staff.getFaceImagePath();
            if (referencePath == null) {
                System.out.println("Skipping staff ID " + staff.getStaffId() + ": No face image path");
                continue;
            }

            if (!Files.exists(Paths.get(referencePath))) {
                System.out.println("Reference path does not exist: " + referencePath);
                continue;
            }

            body.set("reference_path", referencePath);
            try {
                ResponseEntity<Map> response = restTemplate.postForEntity("http://localhost:5000/verify", new HttpEntity<>(body, headers), Map.class);
                if (response.getStatusCode().is2xxSuccessful() && (Boolean) response.getBody().get("verified")) {
                    Attendance attendance = new Attendance();
                    attendance.setStaffId(staff.getStaffId());
                    attendance.setCheckInTime(LocalDateTime.now());
                    attendance.setStatus(Attendance.AttendanceStatus.CHECK_IN);
                    attendance.setFaceImagePath(tempFile.getAbsolutePath());
                    attendanceRepository.save(attendance);

                    Files.deleteIfExists(tempFile.toPath());
                    return ResponseEntity.ok(Map.of("message", "Check-in successful for " + staff.getFullname()));
                }
            } catch (HttpClientErrorException e) {
                System.out.println("DeepFace error: " + e.getResponseBodyAsString());
                Files.deleteIfExists(tempFile.toPath());
                return ResponseEntity.badRequest().body(Map.of("message", "Face recognition failed: " + e.getResponseBodyAsString()));
            }
        }

        Files.deleteIfExists(tempFile.toPath());
        return ResponseEntity.badRequest().body(Map.of("message", "Face not recognized"));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/history")
    public List<Attendance> getAttendanceHistory() {
        return attendanceRepository.findAll();
    }
}