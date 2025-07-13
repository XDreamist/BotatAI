package com.example.controller;

import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
public class Controller {

    @PostMapping("/submit")
    public Map<String, Object> handlePost(@RequestBody Map<String, Object> data) {
        System.out.println("Received: " + data.get("text")); // just logging
        return Map.of(
                "status", "success",
                "message", "Received: " + data.get("text")
        );
    }
}
