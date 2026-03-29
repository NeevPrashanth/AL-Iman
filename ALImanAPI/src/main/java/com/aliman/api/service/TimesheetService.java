package com.aliman.api.service;

import com.aliman.api.domain.*;
import com.aliman.api.dto.DecisionRequest;
import com.aliman.api.dto.TimesheetEntryRequest;
import com.aliman.api.dto.TimesheetSubmitRequest;
import com.aliman.api.repository.*;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TimesheetService {
    private final ContractorRepository contractorRepository;
    private final TimesheetRepository timesheetRepository;
    private final TimesheetEntryRepository entryRepository;
    private final TimesheetReleaseRepository releaseRepository;
    private final TimesheetEntryHistoryRepository historyRepository;
    private final EmailService emailService;

    @Transactional
    public Timesheet submit(TimesheetSubmitRequest request) {
        Contractor contractor = contractorRepository.findById(request.getContractorId())
                .orElseThrow(() -> new EntityNotFoundException("Contractor not found"));
        TimesheetRelease release = releaseRepository.findById(request.getReleaseId())
                .orElseThrow(() -> new EntityNotFoundException("Release not found"));

        Timesheet timesheet = timesheetRepository.findByContractorAndRelease(contractor, release)
                .orElseGet(() -> {
                    Timesheet t = new Timesheet();
                    t.setContractor(contractor);
                    t.setRelease(release);
                    return t;
                });

        List<TimesheetEntry> entries = new ArrayList<>();
        for (TimesheetEntryRequest er : request.getEntries()) {
            TimesheetEntry entry = new TimesheetEntry();
            entry.setTimesheet(timesheet);
            entry.setWorkDate(er.getWorkDate());
            entry.setHoursWorked(er.getHoursWorked());
            entry.setEntryType(er.getEntryType());
            entry.setPreviousComment(entry.getComment());
            entry.setComment(er.getComment());
            entries.add(entry);
        }
        timesheet.setEntries(entries);
        timesheet.setStatus(Timesheet.Status.SUBMITTED);
        return timesheetRepository.save(timesheet);
    }

    @Transactional
    public Timesheet decide(DecisionRequest request, Long approverId) {
        Timesheet timesheet = timesheetRepository.findById(request.getTimesheetId())
                .orElseThrow(() -> new EntityNotFoundException("Timesheet not found"));
        timesheet.getEntries().forEach(entry -> {
            TimesheetEntryHistory h = new TimesheetEntryHistory();
            h.setEntry(entry);
            h.setEntryType(entry.getEntryType());
            h.setComment(entry.getComment());
            h.setHoursWorked(entry.getHoursWorked());
            historyRepository.save(h);
        });
        if (Boolean.TRUE.equals(request.getApprove())) {
            timesheet.setStatus(Timesheet.Status.APPROVED);
            timesheet.setRejectionReason(null);
        } else {
            timesheet.setStatus(Timesheet.Status.REJECTED);
            timesheet.setRejectionReason(request.getRejectionReason());
        }
        timesheet.setApprover(new User());
        timesheet.getApprover().setId(approverId);
        Timesheet saved = timesheetRepository.save(timesheet);
        emailService.sendDecision(saved);
        return saved;
    }

    public List<Timesheet> listByContractor(Long contractorId) {
        return timesheetRepository.findByContractorId(contractorId);
    }
}
