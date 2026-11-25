package com.academy.controller;

import com.academy.dto.response.ApiResponse;
import com.academy.entity.User;
import com.academy.exception.BadRequestException;
import com.academy.security.UserPrincipal;
import com.academy.service.UserService;
import com.academy.service.impl.CampaignService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Set;

/** Admin: announcement emails (preview, test to yourself, launch, progress). Secured by /api/v1/admin/** → ADMIN. */
@RestController
@RequestMapping("/api/v1/admin/campaigns")
@RequiredArgsConstructor
@Tag(name = "Campaigns", description = "Announcement emails")
public class CampaignController {

    private static final Set<String> KEYS = Set.of(CampaignService.UPDATE, CampaignService.CHALLENGE);
    private final CampaignService campaigns;
    private final UserService users;

    private static String check(String key) {
        if (!KEYS.contains(key)) throw new BadRequestException("Unknown campaign");
        return key;
    }

    @GetMapping(value = "/{key}/preview", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> preview(@PathVariable String key, @AuthenticationPrincipal UserPrincipal p) {
        User me = users.findById(p.getId());
        return ResponseEntity.ok(campaigns.render(check(key), me.getFullName()));
    }

    @PostMapping("/{key}/test")
    public ResponseEntity<ApiResponse<String>> test(@PathVariable String key, @AuthenticationPrincipal UserPrincipal p) {
        User me = users.findById(p.getId());
        campaigns.sendTest(check(key), me.getEmail(), me.getFullName());
        return ResponseEntity.ok(ApiResponse.success("Test sent", me.getEmail()));
    }

    @PostMapping("/{key}/launch")
    public ResponseEntity<ApiResponse<Map<String, Object>>> launch(@PathVariable String key) {
        return ResponseEntity.ok(ApiResponse.success("Sending in the background", campaigns.launch(check(key))));
    }

    @GetMapping("/{key}/status")
    public ResponseEntity<ApiResponse<Map<String, Object>>> status(@PathVariable String key) {
        return ResponseEntity.ok(ApiResponse.success(campaigns.status(check(key))));
    }
}
