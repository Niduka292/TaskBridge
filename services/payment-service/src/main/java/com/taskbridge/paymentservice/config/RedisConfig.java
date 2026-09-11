package com.taskbridge.paymentservice.config;

import com.taskbridge.paymentservice.event.BidAcceptedEventConsumer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.listener.ChannelTopic;
import org.springframework.data.redis.listener.RedisMessageListenerContainer;
import org.springframework.data.redis.listener.adapter.MessageListenerAdapter;

@Configuration
public class RedisConfig {

    @Bean
    public MessageListenerAdapter bidAcceptedListenerAdapter(
            BidAcceptedEventConsumer consumer
    ) {
        return new MessageListenerAdapter(
                consumer,
                "handleMessage"
        );
    }

    @Bean
    public RedisMessageListenerContainer redisMessageListenerContainer(
            RedisConnectionFactory connectionFactory,
            MessageListenerAdapter bidAcceptedListenerAdapter
    ) {
        RedisMessageListenerContainer container =
                new RedisMessageListenerContainer();

        container.setConnectionFactory(connectionFactory);

        container.addMessageListener(
                bidAcceptedListenerAdapter,
                new ChannelTopic("events.BID_ACCEPTED")
        );

        return container;
    }
}