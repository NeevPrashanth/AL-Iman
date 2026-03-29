package com.aliman.api.repository;

import com.aliman.api.domain.Contractor;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ContractorRepository extends JpaRepository<Contractor, Long> {
    List<Contractor> findByFullNameContainingIgnoreCase(String name);
    List<Contractor> findByRoleTitleContainingIgnoreCase(String roleTitle);
    boolean existsByEmailIgnoreCase(String email);
    java.util.Optional<Contractor> findByEmailIgnoreCase(String email);
}
