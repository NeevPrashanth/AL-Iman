package com.aliman.api.repository;

import com.aliman.api.domain.TimesheetRelease;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.Optional;

public interface TimesheetReleaseRepository extends JpaRepository<TimesheetRelease, Long> {
    Optional<TimesheetRelease> findByMonthYear(LocalDate monthYear);
}
