package com.aliman.api.service;

import com.aliman.api.domain.Contractor;
import com.aliman.api.domain.ContractorHistory;
import com.aliman.api.dto.ContractorRequest;
import com.aliman.api.repository.ContractorHistoryRepository;
import com.aliman.api.repository.ContractorRepository;
import com.aliman.api.repository.RoleRepository;
import com.aliman.api.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ContractorService {
    private final ContractorRepository contractorRepository;
    private final ContractorHistoryRepository historyRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    public List<Contractor> list(String nameOrRole, Boolean active) {
        List<Contractor> base = (nameOrRole == null || nameOrRole.isBlank())
                ? contractorRepository.findAll()
                : contractorRepository.findByFullNameContainingIgnoreCase(nameOrRole);
        if (active == null) return base;
        return base.stream().filter(c -> c.isActive() == active).toList();
    }

    @Transactional
    public Contractor create(ContractorRequest request) {
        validateEmailUnique(request.getEmail(), null);
        Contractor contractor = new Contractor();
        apply(contractor, request);
        Contractor saved = contractorRepository.save(contractor);
        // auto-create login with default password
        roleRepository.findByCode("CONTRACTOR").ifPresent(role -> {
            var user = new com.aliman.api.domain.User();
            user.setEmail(saved.getEmail());
            user.setFullName(saved.getFullName());
            user.setPasswordHash(passwordEncoder.encode("Welcome123"));
            user.setRole(role);
            user.setContractor(saved);
            userRepository.save(user);
        });
        return saved;
    }

    @Transactional
    public Contractor update(Long id, ContractorRequest request) {
        Contractor contractor = contractorRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Contractor not found"));
        validateEmailUnique(request.getEmail(), contractor.getId());
        backup(contractor, request.getChangeReason());
        apply(contractor, request);
        return contractorRepository.save(contractor);
    }

    private void apply(Contractor contractor, ContractorRequest req) {
        contractor.setFullName(req.getFullName());
        contractor.setEmail(req.getEmail());
        contractor.setPhone(req.getPhone());
        contractor.setAddress(req.getAddress());
        contractor.setNiNumber(req.getNiNumber());
        contractor.setHourlyRate(req.getHourlyRate());
        contractor.setRoleTitle(req.getRoleTitle());
        contractor.setStartDate(req.getStartDate());
        contractor.setEndDate(req.getEndDate());
        contractor.setActive(req.getEndDate() == null);
    }

    private void backup(Contractor contractor, String reason) {
        ContractorHistory h = new ContractorHistory();
        h.setContractor(contractor);
        h.setFullName(contractor.getFullName());
        h.setEmail(contractor.getEmail());
        h.setPhone(contractor.getPhone());
        h.setAddress(contractor.getAddress());
        h.setNiNumber(contractor.getNiNumber());
        h.setHourlyRate(contractor.getHourlyRate());
        h.setRoleTitle(contractor.getRoleTitle());
        h.setStartDate(contractor.getStartDate());
        h.setEndDate(contractor.getEndDate());
        h.setActive(contractor.isActive());
        h.setChangeReason(reason);
        historyRepository.save(h);
    }

    private void validateEmailUnique(String email, Long existingId) {
        contractorRepository.findByEmailIgnoreCase(email).ifPresent(c -> {
            if (existingId == null || !c.getId().equals(existingId)) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already exists");
            }
        });
    }
}
