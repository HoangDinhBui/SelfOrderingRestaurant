package com.example.SelfOrderingRestaurant.Exception;

/** Nobody is on shift right now, so a guest request (call staff, payment, order) cannot be served. */
public class NoStaffOnShiftException extends ValidationException {
    public static final String CODE = "NO_STAFF_ON_SHIFT";

    public NoStaffOnShiftException(String message) {
        super(message);
    }
}
