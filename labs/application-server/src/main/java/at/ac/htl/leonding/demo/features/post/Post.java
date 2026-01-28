package at.ac.htl.leonding.demo.features.post;

public record Post(
    Long id,
    String title,
    String body,
    boolean published
) {   
}
