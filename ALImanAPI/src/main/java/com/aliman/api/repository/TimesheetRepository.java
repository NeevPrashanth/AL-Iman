package com.aliman.api.repository;

import com.aliman.api.domain.Contractor;
import com.aliman.api.domain.Timesheet;
import com.aliman.api.domain.TimesheetRelease;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TimesheetRepository extends JpaRepository<Timesheet, Long> {
    Optional<Timesheet> findByContractorAndRelease(Contractor contractor, TimesheetRelease release);
    List<Timesheet> findByContractorId(Long contractorId);
    List<Timesheet> findByStatusOrderByUpdatedAtDesc(Timesheet.Status status);
    List<Timesheet> findByContractorIdAndStatusOrderByUpdatedAtDesc(Long contractorId, Timesheet.Status status);
}
