package com.example.SelfOrderingRestaurant.Service;

import com.example.SelfOrderingRestaurant.Entity.User;
import com.example.SelfOrderingRestaurant.Enum.UserType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Instant;
import java.util.Date;

import static org.junit.jupiter.api.Assertions.*;

class JwtTokenServiceTest {

    private JwtTokenService service;
    private User user;

    @BeforeEach
    void setUp() {
        service = new JwtTokenService();
        ReflectionTestUtils.setField(service, "accessTokenExpiration", 3_600_000L);
        ReflectionTestUtils.setField(service, "refreshTokenExpiration", 604_800_000L);
        ReflectionTestUtils.setField(service, "secret", ""); // no JWT_SECRET -> random key
        service.initSigningKey();

        user = new User();
        user.setUserId(7);
        user.setUsername("staff1");
        user.setUserType(UserType.STAFF);
    }

    @Test
    void accessAndRefreshTokensAreNotInterchangeable() {
        String access = service.generateAccessToken(user);
        String refresh = service.generateRefreshToken(user);

        assertTrue(service.validateAccessToken(access, user));
        assertTrue(service.validateRefreshToken(refresh, user));
        assertFalse(service.validateAccessToken(refresh, user), "refresh token must not authenticate API calls");
        assertFalse(service.validateRefreshToken(access, user));
    }

    @Test
    void tokensIssuedBeforeLogoutAreRevoked() {
        String refresh = service.generateRefreshToken(user);
        user.setTokensValidAfter(Instant.now().plusSeconds(1)); // what logout does

        assertFalse(service.validateRefreshToken(refresh, user));
    }

    @Test
    void tokenForAnotherUserIsRejected() {
        String access = service.generateAccessToken(user);
        User other = new User();
        other.setUsername("admin");
        other.setUserType(UserType.ADMIN);

        assertFalse(service.validateAccessToken(access, other));
    }

    @Test
    void tokenSignedWithAnotherKeyIsRejected() {
        JwtTokenService forger = new JwtTokenService();
        ReflectionTestUtils.setField(forger, "accessTokenExpiration", 3_600_000L);
        ReflectionTestUtils.setField(forger, "refreshTokenExpiration", 3_600_000L);
        ReflectionTestUtils.setField(forger, "secret", "");
        forger.initSigningKey();
        String forged = forger.generateAccessToken(user);

        assertThrows(Exception.class, () -> service.validateAccessToken(forged, user));
    }

    @Test
    void isRevoked_comparesAtSecondPrecision() {
        Instant cut = Instant.parse("2026-10-19T10:00:00Z");
        assertFalse(JwtTokenService.isRevoked(Date.from(cut), null));
        assertTrue(JwtTokenService.isRevoked(Date.from(cut.minusSeconds(1)), cut));
        assertFalse(JwtTokenService.isRevoked(Date.from(cut), cut));
        assertTrue(JwtTokenService.isRevoked(null, cut));
    }
}
