package com.aliman.api.controller;

import com.aliman.api.domain.Timesheet;
import com.aliman.api.dto.DecisionRequest;
import com.aliman.api.dto.TimesheetSubmitRequest;
import com.aliman.api.service.TimesheetService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/timesheets")
@RequiredArgsConstructor
public class TimesheetController {
    private final TimesheetService timesheetService;

    @PostMapping("/submit")
    public Timesheet submit(@Valid @RequestBody TimesheetSubmitRequest request) {
        return timesheetService.submit(request);
    }

    @PostMapping("/decision")
    public Timesheet decide(@Valid @RequestBody DecisionRequest request, @RequestHeader("X-User-Id") Long approverId) {
        return timesheetService.decide(request, approverId);
    }

    @GetMapping("/contractor/{id}")
    public java.util.List<Timesheet> listForContractor(@PathVariable Long id) {
        return timesheetService.listByContractor(id);
    }
}
