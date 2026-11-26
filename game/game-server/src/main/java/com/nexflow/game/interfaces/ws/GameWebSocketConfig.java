package com.nexflow.game.interfaces.ws;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.*;

/**
 * WebSocket + STOMP para comunicación en tiempo real.
 * Permite push del servidor al cliente (resultados de quest, leaderboard).
 *
 * /topic/*  → broadcast a todos los suscriptores (leaderboard público)
 * /queue/*  → mensajes privados por usuario (resultado personal de quest)
 * /app/*    → mensajes del cliente al servidor
 */
@Configuration
@EnableWebSocketMessageBroker
public class GameWebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws/game")
                .setAllowedOriginPatterns("*")
                .withSockJS(); // fallback para browsers sin WebSocket nativo
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker("/topic", "/queue");
        registry.setApplicationDestinationPrefixes("/app");
        registry.setUserDestinationPrefix("/user");
    }
}
