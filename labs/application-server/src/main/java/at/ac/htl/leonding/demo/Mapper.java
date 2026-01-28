package at.ac.htl.leonding.demo;

/**
 * @see <a href="https://mapstruct.org/">mapstruct</a>
 */
public interface Mapper<T, R> {
    R toResource(T post);
    T fromResource(R dto);
}
