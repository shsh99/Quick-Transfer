package com.quicktransfer.notification.config;

import com.quicktransfer.notification.service.NotificationRedisSubscriber;
import com.quicktransfer.notification.service.RedisNotificationFanoutPublisher;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.listener.ChannelTopic;
import org.springframework.data.redis.listener.RedisMessageListenerContainer;
import org.springframework.data.redis.listener.adapter.MessageListenerAdapter;

@Configuration
@RequiredArgsConstructor
public class RedisPubSubConfig {

    private final RedisConnectionFactory redisConnectionFactory;
    private final NotificationRedisSubscriber notificationRedisSubscriber;

    @Bean
    public ChannelTopic notificationChannelTopic() {
        return new ChannelTopic(RedisNotificationFanoutPublisher.CHANNEL_NAME);
    }

    @Bean
    public MessageListenerAdapter messageListenerAdapter() {
        return new MessageListenerAdapter(notificationRedisSubscriber, "onMessage");
    }

    @Bean
    public RedisMessageListenerContainer redisMessageListenerContainer(
            MessageListenerAdapter listenerAdapter,
            ChannelTopic notificationChannelTopic) {
        RedisMessageListenerContainer container = new RedisMessageListenerContainer();
        container.setConnectionFactory(redisConnectionFactory);
        container.addMessageListener(listenerAdapter, notificationChannelTopic);
        return container;
    }
}
