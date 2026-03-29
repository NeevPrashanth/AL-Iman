package com.aliman.api.repository;

import com.aliman.api.domain.TimesheetEntryHistory;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TimesheetEntryHistoryRepository extends JpaRepository<TimesheetEntryHistory, Long> {
}
