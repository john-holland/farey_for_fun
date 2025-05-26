package com.fareyfs.frontend.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class FrontendController {
    
    @GetMapping("/")
    public String index() {
        return "index";
    }
    
    @GetMapping("/browser")
    public String browser() {
        return "browser";
    }
    
    @GetMapping("/search")
    public String search() {
        return "search";
    }
    
    @GetMapping("/visualizer")
    public String visualizer() {
        return "visualizer";
    }
} 