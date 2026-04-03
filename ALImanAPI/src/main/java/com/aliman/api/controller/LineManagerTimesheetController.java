package com.aliman.api.controller;

import com.aliman.api.domain.Timesheet;
import com.aliman.api.dto.DecisionRequest;
import com.aliman.api.service.TimesheetService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/line-manager/timesheets")
@RequiredArgsConstructor
public class LineManagerTimesheetController {
    private final TimesheetService timesheetService;

    @GetMapping("/pending")
    public List<Timesheet> listPending(Principal principal) {
        return timesheetService.listPendingApprovals(principal.getName());
    }

    @PostMapping("/decision")
    public Timesheet decide(@Valid @RequestBody DecisionRequest request, Principal principal) {
        return timesheetService.decideAsLineManager(request, principal.getName());
    }
}
