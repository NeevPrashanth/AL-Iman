package com.aliman.api.controller;

import com.aliman.api.domain.TimesheetRelease;
import com.aliman.api.dto.ReleaseRequest;
import com.aliman.api.repository.TimesheetReleaseRepository;
import com.aliman.api.service.ReleaseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/releases")
@RequiredArgsConstructor
public class ReleaseController {
    private final ReleaseService releaseService;
    private final TimesheetReleaseRepository releaseRepository;

    @PostMapping
    public TimesheetRelease create(@Valid @RequestBody ReleaseRequest request, @RequestHeader("X-User-Id") Long userId) {
        return releaseService.createRelease(request, userId);
    }

    @GetMapping
    public java.util.List<TimesheetRelease> list() {
        return releaseRepository.findAll();
    }
}
