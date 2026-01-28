package at.ac.htl.leonding.demo.features.hello;

import java.time.LocalDateTime;

public record Hello(
    String greeting,
    LocalDateTime created_at
) {
}
