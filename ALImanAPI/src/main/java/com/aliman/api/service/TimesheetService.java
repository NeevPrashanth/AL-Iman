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
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static org.springframework.http.HttpStatus.CONFLICT;

@Service
@RequiredArgsConstructor
public class TimesheetService {
    private final ContractorRepository contractorRepository;
    private final UserRepository userRepository;
    private final TimesheetRepository timesheetRepository;
    private final TimesheetReleaseRepository releaseRepository;
    private final TimesheetEntryHistoryRepository historyRepository;
    private final EmailService emailService;

    @Transactional
    public Timesheet submit(TimesheetSubmitRequest request, Long submitterUserId, String submitterEmail) {
        Contractor contractor = resolveContractor(request.getContractorId(), submitterUserId, submitterEmail);
        TimesheetRelease release = releaseRepository.findById(request.getReleaseId())
                .orElseThrow(() -> new EntityNotFoundException("Release not found"));

        java.util.Optional<Timesheet> existing = timesheetRepository.findByContractorAndRelease(contractor, release);
        Timesheet timesheet = existing
                .orElseGet(() -> {
                    Timesheet t = new Timesheet();
                    t.setContractor(contractor);
                    t.setRelease(release);
                    return t;
                });

        if (existing.isPresent() && timesheet.getStatus() == Timesheet.Status.APPROVED) {
            throw new ResponseStatusException(CONFLICT, "Timesheet is already approved and cannot be overwritten");
        }

        // For re-submit before approval, remove existing managed children and flush deletes first.
        if (timesheet.getEntries() != null && !timesheet.getEntries().isEmpty()) {
            timesheet.getEntries().clear();
            timesheetRepository.flush();
        }

        // If the same date appears multiple times in request, keep the latest submitted row for that date.
        Map<java.time.LocalDate, TimesheetEntryRequest> latestByDate = new LinkedHashMap<>();
        for (TimesheetEntryRequest er : request.getEntries()) {
            latestByDate.put(er.getWorkDate(), er);
        }

        List<TimesheetEntry> entries = timesheet.getEntries() != null ? timesheet.getEntries() : new ArrayList<>();
        for (TimesheetEntryRequest er : latestByDate.values()) {
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

    private Contractor resolveContractor(Long contractorId, Long submitterUserId, String submitterEmail) {
        if (contractorId != null) {
            java.util.Optional<Contractor> byRequestId = contractorRepository.findById(contractorId);
            if (byRequestId.isPresent()) {
                return byRequestId.get();
            }
        }

        if (submitterUserId == null && (submitterEmail == null || submitterEmail.isBlank())) {
            throw new EntityNotFoundException("Contractor not found");
        }

        User submitter;
        if (submitterUserId != null) {
            submitter = userRepository.findById(submitterUserId)
                    .orElseThrow(() -> new EntityNotFoundException("User not found"));
        } else {
            submitter = userRepository.findByEmail(submitterEmail)
                    .orElseThrow(() -> new EntityNotFoundException("User not found"));
        }
        if (submitter.getContractor() == null || submitter.getContractor().getId() == null) {
            throw new EntityNotFoundException("No contractor is linked to this user");
        }
        return contractorRepository.findById(submitter.getContractor().getId())
                .orElseThrow(() -> new EntityNotFoundException("Contractor not found"));
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
        if (contractorId == null) {
            return java.util.Collections.emptyList();
        }

        if (contractorRepository.existsById(contractorId)) {
            return timesheetRepository.findByContractorId(contractorId);
        }

        // Backward-compatible: UI may send userId instead of contractorId.
        return userRepository.findById(contractorId)
                .map(User::getContractor)
                .map(Contractor::getId)
                .map(timesheetRepository::findByContractorId)
                .orElseGet(java.util.Collections::emptyList);
    }
}
