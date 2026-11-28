package com.academy.controller;

import com.academy.dto.response.ApiResponse;
import com.academy.dto.response.MemberProfileResponse;
import com.academy.security.UserPrincipal;
import com.academy.service.member.MemberProfileService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/** Member profiles — signed-in members only (SecurityConfig: anyRequest().authenticated()). */
@RestController
@RequestMapping("/api/v1/members")
@RequiredArgsConstructor
@Tag(name = "Members", description = "Member profiles seen by other members")
public class MemberProfileController {

    private final MemberProfileService memberProfileService;

    @GetMapping("/{id}")
    @Operation(summary = "A member's profile: badge, progress, achievements (no contact details or marks)")
    public ResponseEntity<ApiResponse<MemberProfileResponse>> get(@PathVariable UUID id,
                                                                  @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.success(memberProfileService.getProfile(id, principal.getId())));
    }
}
