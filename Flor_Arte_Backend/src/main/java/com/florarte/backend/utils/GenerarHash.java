package com.florarte.backend.utils;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class GenerarHash {

    public static void main(String[] args) {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

        String password = "2327";
        System.out.println(encoder.encode(password));
    }
}
