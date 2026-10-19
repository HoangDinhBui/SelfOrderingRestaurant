package com.example.SelfOrderingRestaurant.Config;

import com.example.SelfOrderingRestaurant.Entity.Staff;
import com.example.SelfOrderingRestaurant.Entity.User;
import com.example.SelfOrderingRestaurant.Enum.UserType;
import com.example.SelfOrderingRestaurant.Repository.StaffRepository;
import com.example.SelfOrderingRestaurant.Repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class AdminBootstrapTest {

    private UserRepository users;
    private StaffRepository staff;
    private PasswordEncoder encoder;

    @BeforeEach
    void setUp() {
        users = mock(UserRepository.class);
        staff = mock(StaffRepository.class);
        encoder = mock(PasswordEncoder.class);
        when(encoder.encode(any())).thenAnswer(inv -> "hashed:" + inv.getArgument(0));
        when(users.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
        when(users.findByUsername(any())).thenReturn(Optional.empty());
    }

    private AdminBootstrap bootstrap(String username, String password) {
        return new AdminBootstrap(users, staff, encoder, username, password, "");
    }

    @Test
    void createsAdminWithHashedPasswordOnFreshDatabase() {
        when(users.existsByUserType(UserType.ADMIN)).thenReturn(false);

        bootstrap("owner", "S3cure-pass").run();

        ArgumentCaptor<User> user = ArgumentCaptor.forClass(User.class);
        verify(users).save(user.capture());
        assertEquals("owner", user.getValue().getUsername());
        assertEquals(UserType.ADMIN, user.getValue().getUserType());
        assertEquals("hashed:S3cure-pass", user.getValue().getPassword());
        verify(staff).save(any(Staff.class));
    }

    @Test
    void doesNothingWhenAnAdminAlreadyExists() {
        when(users.existsByUserType(UserType.ADMIN)).thenReturn(true);

        bootstrap("owner", "S3cure-pass").run();

        verify(users, never()).save(any());
    }

    @Test
    void neverFallsBackToADefaultPassword() {
        when(users.existsByUserType(UserType.ADMIN)).thenReturn(false);

        bootstrap("", "").run();
        bootstrap("owner", "short").run();

        verify(users, never()).save(any());
    }

    @Test
    void doesNotHijackAnExistingNonAdminUsername() {
        when(users.existsByUserType(UserType.ADMIN)).thenReturn(false);
        when(users.findByUsername("staff1")).thenReturn(Optional.of(new User()));

        bootstrap("staff1", "S3cure-pass").run();

        verify(users, never()).save(any());
    }
}
