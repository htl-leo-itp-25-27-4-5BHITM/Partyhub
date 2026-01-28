package at.ac.htl.leonding.demo.features.post;

import java.util.List;


//import org.eclipse.microprofile.jwt.Claim;
//import org.eclipse.microprofile.jwt.ClaimValue;

import at.ac.htl.leonding.demo.Mapper;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.annotation.security.RolesAllowed;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.json.JsonStructure;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;

@Entity
class TbPost {
    @Id
    @GeneratedValue(strategy=GenerationType.IDENTITY)
    Long id;

    String title;
    String body;
    boolean published;
}

@ApplicationScoped
class PostRepository implements PanacheRepository<TbPost> {}

@ApplicationScoped
class PostMapper implements Mapper<TbPost, Post> {
    public Post toResource(TbPost post) {
        return new Post(
            post.id,
            post.title,
            post.body,
            post.published);
    }
    public TbPost fromResource(Post p) {
        var post = new TbPost();

        post.id = p.id();
        post.title = p.title();
        post.body = p.body();
        post.published = p.published();
        
        return post;
    }
}

@Path("/posts")
public class PostResource {
    @Inject PostRepository postRepository;
    @Inject Mapper<TbPost, Post> mapper;

    //@Claim("realm_access")
    //ClaimValue<Map<String, List<JsonString>>> realmAccess;
/*
    @GET
    @PermitAll
    public List<Post> all() {
        return postRepository
            .listAll()
            .stream()
            .map(mapper::toResource)
            .filter(this::amIallowedToSeeThis)
            .toList();
    }
    boolean amIallowedToSeeThis(Post post) {
        var roles = realmAccess
            .getValue()
            .get("roles")
            .stream()
            .map(s -> s.getString())
            .peek(role -> Log.infof("role: %s", role))
            .collect(Collectors.toSet());

        return post.published() || roles.contains("editor");
    }
 */
    @GET
    @RolesAllowed("editor")
    public List<Post> allPosts() {
        return postRepository
            .listAll()
            .stream()
            .map(mapper::toResource)
            .toList()
            ;
    }    
}
