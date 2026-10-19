package com.example.SelfOrderingRestaurant.Config;

import com.example.SelfOrderingRestaurant.Entity.Staff;
import com.example.SelfOrderingRestaurant.Entity.User;
import com.example.SelfOrderingRestaurant.Enum.UserStatus;
import com.example.SelfOrderingRestaurant.Enum.UserType;
import com.example.SelfOrderingRestaurant.Repository.StaffRepository;
import com.example.SelfOrderingRestaurant.Repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Creates the first ADMIN account on a fresh database, from BOOTSTRAP_ADMIN_USERNAME /
 * BOOTSTRAP_ADMIN_PASSWORD. Without it there is no way to log in to a new deployment, since every
 * account-creating endpoint already requires an admin. Does nothing once any admin exists.
 */
@Component
public class AdminBootstrap implements CommandLineRunner {
    private static final Logger log = LoggerFactory.getLogger(AdminBootstrap.class);
    static final int MIN_PASSWORD_LENGTH = 8;

    private final UserRepository userRepository;
    private final StaffRepository staffRepository;
    private final PasswordEncoder passwordEncoder;
    private final String username;
    private final String password;
    private final String email;

    public AdminBootstrap(UserRepository userRepository, StaffRepository staffRepository, PasswordEncoder passwordEncoder,
                          @Value("${bootstrap.admin.username:}") String username,
                          @Value("${bootstrap.admin.password:}") String password,
                          @Value("${bootstrap.admin.email:}") String email) {
        this.userRepository = userRepository;
        this.staffRepository = staffRepository;
        this.passwordEncoder = passwordEncoder;
        this.username = username;
        this.password = password;
        this.email = email;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (userRepository.existsByUserType(UserType.ADMIN)) {
            return;
        }
        if (username.isBlank() || password.isBlank()) {
            log.warn("No ADMIN account exists. Set BOOTSTRAP_ADMIN_USERNAME and BOOTSTRAP_ADMIN_PASSWORD to create one.");
            return;
        }
        if (password.length() < MIN_PASSWORD_LENGTH) {
            log.error("BOOTSTRAP_ADMIN_PASSWORD must have at least {} characters; admin not created", MIN_PASSWORD_LENGTH);
            return;
        }
        if (userRepository.findByUsername(username).isPresent()) {
            log.error("Bootstrap admin username '{}' is already taken by a non-admin user; admin not created", username);
            return;
        }

        User user = new User();
        user.setUsername(username);
        user.setPassword(passwordEncoder.encode(password));
        user.setEmail(email.isBlank() ? null : email);
        user.setUserType(UserType.ADMIN);
        user.setUserStatus(UserStatus.ACTIVE);
        user.setCreatedAt(LocalDateTime.now());
        user = userRepository.save(user);

        Staff staff = new Staff();
        staff.setUser(user);
        staff.setFullname("Administrator");
        staff.setPosition("ADMIN");
        staff.setHireDate(LocalDate.now());
        staff.setStatus(UserStatus.ACTIVE);
        staffRepository.save(staff);

        log.info("Bootstrap admin '{}' created. Change its password after first login.", username);
    }
}
