package com.timebank.timebank;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class TimebankBackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(TimebankBackendApplication.class, args);
	}

}
