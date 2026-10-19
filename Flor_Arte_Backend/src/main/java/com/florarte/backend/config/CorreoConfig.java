package com.florarte.backend.config;

import java.time.Clock;
import java.util.Properties;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.*;
import org.springframework.mail.javamail.*;
import org.springframework.scheduling.annotation.*;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

@Configuration
@PropertySource("classpath:auth-mail.properties")
@EnableAsync
@EnableScheduling
public class CorreoConfig {
  @Bean
  public Clock relojAutenticacion() {
    return Clock.systemUTC();
  }

  @Bean
  public JavaMailSender javaMailSender(
      @Value("${spring.mail.username}") String usuario,
      @Value("${spring.mail.password}") String password) {
    var sender = new JavaMailSenderImpl();
    sender.setHost("smtp.gmail.com");
    sender.setPort(587);
    sender.setUsername(usuario);
    sender.setPassword(password);
    sender.setDefaultEncoding("UTF-8");
    var p = new Properties();
    p.setProperty("mail.smtp.auth", "true");
    p.setProperty("mail.smtp.starttls.enable", "true");
    p.setProperty("mail.smtp.starttls.required", "true");
    p.setProperty("mail.smtp.ssl.checkserveridentity", "true");
    for (String k : new String[] {"connectiontimeout", "timeout", "writetimeout"})
      p.setProperty("mail.smtp." + k, "5000");
    sender.setJavaMailProperties(p);
    return sender;
  }

  @Bean(name = "correoExecutor")
  public ThreadPoolTaskExecutor correoExecutor() {
    var executor = new ThreadPoolTaskExecutor();
    executor.setCorePoolSize(2);
    executor.setMaxPoolSize(2);
    executor.setQueueCapacity(100);
    executor.setThreadNamePrefix("florarte-correo-");
    return executor;
  }
}
