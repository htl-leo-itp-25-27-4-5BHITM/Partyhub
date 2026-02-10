package at.htl.follow;

import at.htl.user.User;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.jboss.logging.Logger;

import java.util.List;

@ApplicationScoped
@Path("/api/users")
public class FollowResource {

    @Inject
    FollowRepository followRepository;

    @Inject
    Logger logger;

    @GET
    @Path("/{id}/followers")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getFollowers(@PathParam("id") long id) {
        List<User> followers = followRepository.getFollowers(id);
        return Response.ok(followers).build();
    }

    @GET
    @Path("/{id}/following")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getFollowing(@PathParam("id") long id) {
        List<User> following = followRepository.getFollowing(id);
        return Response.ok(following).build();
    }

    @GET
    @Path("/{id}/relationship")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getRelationship(@PathParam("id") long id, @QueryParam("from") long fromUserId) {
        boolean isFollowing = followRepository.isFollowing(fromUserId, id);
        return Response.ok()
                .entity("{\"isFollowing\": " + isFollowing + "}")
                .build();
    }

    @POST
    @Path("/{id}/followers")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public Response followUser(@PathParam("id") long id, FollowRequestDto dto) {
        if (dto == null || dto.userId() == null) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity("{\"message\": \"userId is required\"}")
                    .build();
        }
        return followRepository.createFollowRequest(dto.userId(), id);
    }

    @DELETE
    @Path("/{id}/followers/{followerId}")
    @Produces(MediaType.APPLICATION_JSON)
    public Response unfollowUser(@PathParam("id") long id, @PathParam("followerId") long followerId) {
        return followRepository.removeFollow(followerId, id);
    }

    @POST
    @Path("/{id}/followers/{followerId}/accept")
    @Produces(MediaType.APPLICATION_JSON)
    public Response acceptFollowRequest(@PathParam("id") long id, @PathParam("followerId") long followerId) {
        return followRepository.acceptFollowRequest(followerId, id);
    }
}
