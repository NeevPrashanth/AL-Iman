package com.aliman.api.service;

import com.aliman.api.domain.Event;
import com.aliman.api.domain.User;
import com.aliman.api.dto.EventRequest;
import com.aliman.api.repository.EventRepository;
import com.aliman.api.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class EventService {
    private final EventRepository eventRepository;
    private final UserRepository userRepository;

    public List<Event> list() {
        return eventRepository.findAll();
    }

    @Transactional
    public Event create(EventRequest request, Long createdBy) {
        User user = userRepository.findById(createdBy)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));
        Event e = new Event();
        e.setTitle(request.getTitle());
        e.setDescription(request.getDescription());
        e.setLocation(request.getLocation());
        e.setEventDate(request.getEventDate());
        e.setStartTime(request.getStartTime());
        e.setEndTime(request.getEndTime());
        e.setCreatedBy(user);
        return eventRepository.save(e);
    }
}
