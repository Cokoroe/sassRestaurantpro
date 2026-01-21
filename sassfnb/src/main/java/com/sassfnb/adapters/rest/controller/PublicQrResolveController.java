package com.sassfnb.adapters.rest.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/public/qr")
@RequiredArgsConstructor
public class PublicQrResolveController {

    /*
     * private final TableRepository tableRepo;
     * 
     * @GetMapping("/t/{code}")
     * public ResponseEntity<Void> resolveTable(@PathVariable String code) {
     * 
     * TableEntity t = tableRepo.findByQrCode(code)
     * .orElseThrow(() -> new IllegalArgumentException("Invalid QR"));
     * 
     * if (!Boolean.TRUE.equals(t.getActive()))
     * throw new IllegalStateException("Table disabled");
     * 
     * String redirect = "https://your-frontend.com/order?outletId="
     * + t.getOutletId()
     * + "&tableId=" + t.getId();
     * 
     * return ResponseEntity.status(302)
     * .header("Location", redirect)
     * .build();
     * }
     */
}
