package com.taskbridge.taskservice.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import com.fasterxml.jackson.databind.ObjectMapper;

@Component
public class EventPublisher {

    private static final Logger log = LoggerFactory.getLogger(EventPublisher.class);

    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;

    public EventPublisher(StringRedisTemplate redisTemplate, ObjectMapper objectMapper) {
        this.redisTemplate = redisTemplate;
        this.objectMapper = objectMapper;
    }

    public void publish(String eventName, Object payload) {
        try {
            String json = objectMapper.writeValueAsString(payload);
            String channel = "events." + eventName;
            redisTemplate.convertAndSend(channel, json);
            log.info("Published event [{}]: {}", eventName, json);
        } catch (Exception e) {
            log.error("Failed to publish event [{}]: {}", eventName, e.getMessage(), e);
        }
    }
}