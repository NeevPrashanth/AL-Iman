package com.aliman.api.repository;

import com.aliman.api.domain.ContractorHistory;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ContractorHistoryRepository extends JpaRepository<ContractorHistory, Long> {
}
