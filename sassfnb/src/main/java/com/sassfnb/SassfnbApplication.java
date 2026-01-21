package com.sassfnb;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class SassfnbApplication {

	public static void main(String[] args) {
		SpringApplication.run(SassfnbApplication.class, args);
	}

}
