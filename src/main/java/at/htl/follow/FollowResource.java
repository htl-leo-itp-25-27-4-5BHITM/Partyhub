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
@Path("/follow")
public class FollowResource {
    @Inject
    FollowRepository followRepository;
    @Inject
    Logger logger;

    @GET
    @Path("/follower/{id}/count")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getFollowerCount(@PathParam("id") long id) {
        long count = followRepository.getFollowerCount(id);

        return Response.ok(count).build();
    }

    @GET
    @Path("/following/{id}/cout")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getFollowingCount (@PathParam("id") long id){
        long count = followRepository.getFollowingCount(id);
        return Response.ok(count).build();
    }
    @GET
    @Path("followers/{id}")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getFollowers(@PathParam("id") long id) {
        List<User> followers = followRepository.getFollowers(id);
        return Response.ok(followers).build();
    }
    @GET
    @Path("followings/{id}")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getFollowings(@PathParam("id") long id){
        List<User> followings = followRepository.getFollowing(id);
        return Response.ok(followings).build();
    }
    @GET
    @Path("pending/{id}")
    public Response getPendingRequests(@PathParam("id") long id) {
        List<User> pending = followRepository.getPendingFollowerRequests(id);
        return Response.ok(pending).build();
    }
    @GET
    @Path("is-following/{id1}/{id2}")
    @Produces(MediaType.APPLICATION_JSON)
    public Response isFollowing(@PathParam("id1") long user1Id,
                                @PathParam("id2") long user2Id) {
        boolean following = followRepository.isFollowing(user1Id, user2Id);
        return Response.ok(following).build();
    }

    @POST
    @Path("request/{id1}/{id2}")
    @Produces(MediaType.APPLICATION_JSON)
    public Response createFollowRequest(@PathParam("id1") long user1Id,
                                        @PathParam("id2") long user2Id) {
        return followRepository.createFollowRequest(user1Id, user2Id);
    }

    @PUT
    @Path("accept/{id1}/{id2}")
    @Produces(MediaType.APPLICATION_JSON)
    public Response acceptFollowRequest(@PathParam("id1") long user1Id,
                                        @PathParam("id2") long user2Id) {
        return followRepository.acceptFollowRequest(user1Id, user2Id);
    }
    @DELETE
    @Path("remove/{id1}/{id2}")
    @Produces(MediaType.APPLICATION_JSON)
    public Response removeFollow(@PathParam("id1") long user1Id,
                                 @PathParam("id2") long user2Id) {
        return followRepository.removeFollow(user1Id, user2Id);
    }
}

