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
        User user = requireUser(createdBy);
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

    @Transactional
    public Event update(Long eventId, EventRequest request, Long userId) {
        requireUser(userId);
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new EntityNotFoundException("Event not found"));
        event.setTitle(request.getTitle());
        event.setDescription(request.getDescription());
        event.setLocation(request.getLocation());
        event.setEventDate(request.getEventDate());
        event.setStartTime(request.getStartTime());
        event.setEndTime(request.getEndTime());
        return eventRepository.save(event);
    }

    @Transactional
    public void delete(Long eventId, Long userId) {
        requireUser(userId);
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new EntityNotFoundException("Event not found"));
        eventRepository.delete(event);
    }

    private User requireUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));
    }
}
