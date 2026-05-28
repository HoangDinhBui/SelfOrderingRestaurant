package com.example.SelfOrderingRestaurant.Service;

import com.example.SelfOrderingRestaurant.Dto.Request.UserRequestDTO.RegisterRequestDto;
import com.example.SelfOrderingRestaurant.Dto.Request.UserRequestDTO.*;
import com.example.SelfOrderingRestaurant.Dto.Response.UserResponseDTO.AuthResponseDto;
import com.example.SelfOrderingRestaurant.Entity.Customer;
import com.example.SelfOrderingRestaurant.Entity.Staff;
import com.example.SelfOrderingRestaurant.Entity.User;
import com.example.SelfOrderingRestaurant.Enum.UserStatus;
import com.example.SelfOrderingRestaurant.Enum.UserType;
import com.example.SelfOrderingRestaurant.Repository.CustomerRepository;
import com.example.SelfOrderingRestaurant.Repository.StaffRepository;
import com.example.SelfOrderingRestaurant.Repository.UserRepository;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import lombok.RequiredArgsConstructor;
import org.apache.tomcat.websocket.AuthenticationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.security.GeneralSecurityException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class AuthService {
    private final UserRepository userRepository;
    private final StaffRepository staffRepository;
    private final CustomerRepository customerRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenService jwtTokenService;
    private final AuthenticationManager authenticationManager;
    private final EmailService emailService;

    @Value("${google.client-id}")
    private String googleClientId;

    private final Logger log = LoggerFactory.getLogger(AuthService.class);

    @Transactional
    public AuthResponseDto registerCustomer(CustomerRegisterRequestDto request) {
        // Check if username already exists
        Optional<User> existingUserByUsername = userRepository.findByUsername(request.getUsername());
        if (existingUserByUsername.isPresent()) {
            User u = existingUserByUsername.get();
            if (u.getUserStatus() == UserStatus.ACTIVE) {
                throw new RuntimeException("Username already exists");
            }
        }

        // Check if email already exists
        Optional<User> existingUserByEmail = userRepository.findByEmail(request.getEmail());
        if (existingUserByEmail.isPresent()) {
            User u = existingUserByEmail.get();
            if (u.getUserStatus() == UserStatus.ACTIVE) {
                throw new RuntimeException("Email already exists");
            }
        }

        // Create or update inactive user
        User user;
        if (existingUserByEmail.isPresent()) {
            user = existingUserByEmail.get();
        } else if (existingUserByUsername.isPresent()) {
            user = existingUserByUsername.get();
        } else {
            user = new User();
        }

        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setPhone(request.getPhone());
        user.setUserType(UserType.CUSTOMER);
        user.setUserStatus(UserStatus.INACTIVE);
        user.setCreatedAt(LocalDateTime.now());

        // Generate 6-digit random OTP
        String otp = String.format("%06d", new Random().nextInt(999999));
        user.setVerificationToken(otp);
        user.setVerificationTokenExpiry(LocalDateTime.now().plusMinutes(10));

        User savedUser = userRepository.save(user);

        // Create or update customer profile
        Customer customer = customerRepository.findByUser(savedUser).orElse(new Customer());
        customer.setUser(savedUser);
        customer.setFullname(request.getFullname());
        customer.setJoinDate(new Date());
        customer.setPoints(0);

        customerRepository.save(customer);

        // Send registration OTP email
        try {
            emailService.sendRegistrationOtpEmail(savedUser.getEmail(), otp);
        } catch (Exception e) {
            log.error("Failed to send registration OTP email to {}: {}. OTP is: {}", savedUser.getEmail(), e.getMessage(), otp);
            System.out.println("====== [TEST / DEV ONLY] REGISTRATION OTP FOR " + savedUser.getEmail() + " IS: " + otp + " ======");
        }

        // Return response indicating OTP is sent
        AuthResponseDto response = new AuthResponseDto();
        response.setUsername(savedUser.getUsername());
        response.setEmail(savedUser.getEmail());
        response.setUserType(savedUser.getUserType().name());
        response.setMessage("OTP_SENT_TO_EMAIL");

        return response;
    }

    @Transactional
    public AuthResponseDto verifyRegisterOtp(VerifyOtpRequestDto request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found with email: " + request.getEmail()));

        if (user.getUserStatus() == UserStatus.ACTIVE) {
            throw new RuntimeException("Account is already verified");
        }

        if (user.getVerificationToken() == null || !user.getVerificationToken().equals(request.getOtp())) {
            throw new RuntimeException("Invalid OTP");
        }

        if (user.getVerificationTokenExpiry().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("OTP has expired");
        }

        // Activate user
        user.setUserStatus(UserStatus.ACTIVE);
        user.setVerificationToken(null);
        user.setVerificationTokenExpiry(null);
        User savedUser = userRepository.save(user);

        // Find customer profile
        Customer customer = customerRepository.findByUser(savedUser)
                .orElseThrow(() -> new RuntimeException("Customer profile not found"));

        // Generate tokens
        String accessToken = jwtTokenService.generateAccessToken(savedUser);
        String refreshToken = jwtTokenService.generateRefreshToken(savedUser);

        // Return successful authentication response
        AuthResponseDto response = new AuthResponseDto();
        response.setAccessToken(accessToken);
        response.setRefreshToken(refreshToken);
        response.setUsername(savedUser.getUsername());
        response.setEmail(savedUser.getEmail());
        response.setUserType(savedUser.getUserType().name());
        response.setCustomerId(customer.getCustomerId());
        response.setFullname(customer.getFullname());
        response.setPoints(customer.getPoints());
        response.setMessage("VERIFICATION_SUCCESSFUL");

        return response;
    }

    @Transactional
    public void resendRegisterOtp(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + email));

        if (user.getUserStatus() == UserStatus.ACTIVE) {
            throw new RuntimeException("Account is already verified");
        }

        // Generate new OTP
        String otp = String.format("%06d", new Random().nextInt(999999));
        user.setVerificationToken(otp);
        user.setVerificationTokenExpiry(LocalDateTime.now().plusMinutes(10));
        userRepository.save(user);

        try {
            emailService.sendRegistrationOtpEmail(user.getEmail(), otp);
        } catch (Exception e) {
            log.error("Failed to resend registration OTP email to {}: {}. OTP is: {}", user.getEmail(), e.getMessage(), otp);
            System.out.println("====== [TEST / DEV ONLY] RESEND REGISTRATION OTP FOR " + user.getEmail() + " IS: " + otp + " ======");
        }
    }

    @Transactional
    public AuthResponseDto registerStaff(RegisterRequestDto request, MultipartFile image) {
        // Check if username or email already exists
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("Username already exists");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already exists");
        }

        // Create new user
        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setPhone(request.getPhone());
        user.setUserType(UserType.STAFF);
        user.setUserStatus(UserStatus.ACTIVE);
        user.setCreatedAt(LocalDateTime.now());

        User savedUser = userRepository.save(user);

        // Create staff profile
        Staff staff = new Staff();
        staff.setUser(savedUser);
        staff.setFullname(request.getFullname());
        staff.setHireDate(LocalDate.now());
        staff.setPosition("New Staff");
        staff.setSalary(BigDecimal.ZERO);
        staff.setStatus(UserStatus.ACTIVE);

        // Handle image if provided
        if (image != null && !image.isEmpty()) {
            String filePath = "src/main/resources/static/staff_faces/" + savedUser.getUserId() + ".jpg";
            try {
                Files.write(Paths.get(filePath), image.getBytes());
                staff.setFaceImagePath(filePath);
            } catch (IOException e) {
                throw new RuntimeException("Failed to save image: " + e.getMessage());
            }
        }

        Staff savedStaff = staffRepository.save(staff);

        // Generate tokens
        String accessToken = jwtTokenService.generateAccessToken(savedUser);
        String refreshToken = jwtTokenService.generateRefreshToken(savedUser);

        // Return response
        AuthResponseDto response = new AuthResponseDto();
        response.setAccessToken(accessToken);
        response.setRefreshToken(refreshToken);
        response.setUsername(savedUser.getUsername());
        response.setEmail(savedUser.getEmail());
        response.setUserType(savedUser.getUserType().name());
        response.setStaffId(savedStaff.getStaffId());

        return response;
    }

    public AuthResponseDto login(LoginRequestDto request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getLogin(),
                        request.getPassword()
                )
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);

        User user = userRepository.findByUsernameOrEmail(
                request.getLogin(),
                request.getLogin()
        ).orElseThrow(() -> new RuntimeException("User not found"));

        // Update last login
        user.setLastLogin(new Date());
        userRepository.save(user);

        // Generate tokens
        String accessToken = jwtTokenService.generateAccessToken(user);
        String refreshToken = jwtTokenService.generateRefreshToken(user);

        // Return response
        AuthResponseDto response = new AuthResponseDto();
        response.setAccessToken(accessToken);
        response.setRefreshToken(refreshToken);
        response.setUsername(user.getUsername());
        response.setEmail(user.getEmail());
        response.setUserType(user.getUserType().name());

        // Set customer/staff specific details
        if (user.getUserType() == UserType.CUSTOMER) {
            customerRepository.findByUser(user).ifPresent(customer -> {
                response.setCustomerId(customer.getCustomerId());
                response.setFullname(customer.getFullname());
                response.setPoints(customer.getPoints());
            });
        } else if (user.getUserType() == UserType.STAFF || user.getUserType() == UserType.ADMIN) {
            Optional.ofNullable(staffRepository.findByUser(user)).ifPresent(staff -> {
                response.setStaffId(staff.getStaffId());
                response.setFullname(staff.getFullname());
            });
        }

        return response;
    }

    @Transactional
    public AuthResponseDto staffGoogleLogin(GoogleLoginRequestDto request) throws GeneralSecurityException, IOException {
        GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(
                new NetHttpTransport(),
                new GsonFactory()
        )
                .setAudience(Collections.singletonList(googleClientId))
                .setIssuer("https://accounts.google.com")
                .build();

        GoogleIdToken idToken = verifier.verify(request.getIdToken());

        if (idToken == null) {
            throw new RuntimeException("Token verification failed");
        }

        GoogleIdToken.Payload payload = idToken.getPayload();
        String email = payload.getEmail();
        String googleId = payload.getSubject();

        // Only accept email Gmail
        if (!email.endsWith("@gmail.com")) {
            throw new RuntimeException("Only Gmail accounts are allowed");
        }

        Optional<User> existingUser = userRepository.findByGoogleId(googleId);

        User user = existingUser.orElseGet(() -> {
            User newUser = new User();
            newUser.setGoogleId(googleId);
            newUser.setEmail(email);
            newUser.setUsername(email.split("@")[0]);
            newUser.setUserType(UserType.STAFF); // Default staff
            newUser.setUserStatus(UserStatus.ACTIVE);
            newUser.setCreatedAt(LocalDateTime.now());
            newUser.setLastLogin(new Date());

            return userRepository.save(newUser);
        });

        // Tạo token
        String accessToken = jwtTokenService.generateAccessToken(user);
        String refreshToken = jwtTokenService.generateRefreshToken(user);

        AuthResponseDto response = new AuthResponseDto();
        response.setAccessToken(accessToken);
        response.setRefreshToken(refreshToken);
        response.setUsername(user.getUsername());
        response.setEmail(user.getEmail());
        response.setUserType(user.getUserType().name());

        return response;
    }

    private void validateTokenPayload(GoogleIdToken.Payload payload) {
        if (payload == null) {
            throw new AuthenticationException("Invalid token payload");
        }

        // Additional checks
        if (!payload.getEmail().endsWith("@gmail.com")) {
            throw new AuthenticationException("Invalid email domain");
        }

        // Optional: Add more specific validation rules
        if (payload.getExpirationTimeSeconds() != null &&
                payload.getExpirationTimeSeconds() < System.currentTimeMillis() / 1000) {
            throw new AuthenticationException("Token has expired");
        }
    }

    public class AuthenticationException extends RuntimeException {
        public AuthenticationException(String message) {
            super(message);
        }
    }

    public void logout() {
        // Clear security context
        SecurityContextHolder.clearContext();
    }

    public AuthResponseDto refreshToken(RefreshTokenRequestDto request) {
        // Validate refresh token
        String username = jwtTokenService.extractUsername(request.getRefreshToken());
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Verify refresh token
        if (!jwtTokenService.validateRefreshToken(request.getRefreshToken(), user)) {
            throw new RuntimeException("Invalid refresh token");
        }

        // Generate new tokens
        String newAccessToken = jwtTokenService.generateAccessToken(user);
        String newRefreshToken = jwtTokenService.generateRefreshToken(user);

        // Return response
        AuthResponseDto response = new AuthResponseDto();
        response.setAccessToken(newAccessToken);
        response.setRefreshToken(newRefreshToken);
        response.setUsername(user.getUsername());
        response.setEmail(user.getEmail());
        response.setUserType(user.getUserType().name());

        return response;
    }

    @Transactional
    public void forgotPassword(ForgotPasswordRequestDto request) {
        // Validate email input
        if (request.getEmail() == null || request.getEmail().trim().isEmpty()) {
            throw new IllegalArgumentException("Email must not be empty");
        }

        if (request.getUsername() == null || request.getUsername().trim().isEmpty()) {
            throw new IllegalArgumentException("Username must not be empty");
        }

        // Optional: Add email format validation
        if (!isValidEmail(request.getEmail())) {
            throw new IllegalArgumentException("Invalid email format");
        }

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found with email: " + request.getEmail()));

        // Generate reset token
        String otp = String.format("%06d", new Random().nextInt(999999));

        // Set reset token with explicit null checks
        user.setResetPasswordToken(otp);
        user.setResetPasswordExpiry(LocalDateTime.now().plusHours(10));

        try {
            userRepository.save(user);
            emailService.sendPasswordResetEmail(user.getEmail(), otp);
        } catch (Exception e) {
            // Log the actual exception
            throw new RuntimeException("Failed to process password reset", e);
        }
    }

    // Optional email validation method
    private boolean isValidEmail(String email) {
        String emailRegex = "^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$";
        return email != null && email.matches(emailRegex);
    }

    @Transactional
    public void resetPassword(ResetPasswordRequestDto request) {
        User user = userRepository.findByResetPasswordToken(request.getOtp())
                .orElseThrow(() -> new RuntimeException("Invalid reset token"));

        // Check token expiry
        if (user.getResetPasswordExpiry().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("OTP has expired");
        }

        // Update password
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setResetPasswordToken(null);
        user.setResetPasswordExpiry(null);
        userRepository.save(user);
    }
}
