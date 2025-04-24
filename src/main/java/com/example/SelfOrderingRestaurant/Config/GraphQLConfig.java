package com.example.SelfOrderingRestaurant.Config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.graphql.execution.RuntimeWiringConfigurer;

@Configuration
public class GraphQLConfig {

    @Bean
    public RuntimeWiringConfigurer runtimeWiringConfigurer() {
        return wiringBuilder -> wiringBuilder
                .scalar(graphql.scalars.ExtendedScalars.Date)
                .scalar(graphql.scalars.ExtendedScalars.DateTime);
    }
}