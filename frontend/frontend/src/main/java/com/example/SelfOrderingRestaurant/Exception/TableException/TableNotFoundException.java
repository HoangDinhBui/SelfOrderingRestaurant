package com.example.SelfOrderingRestaurant.Exception.TableException;

public class TableNotFoundException extends RuntimeException {
    public TableNotFoundException(String message) {
        super(message);
    }
}
