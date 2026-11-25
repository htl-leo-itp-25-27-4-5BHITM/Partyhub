package at.htl.resource;

import at.htl.TestBase;
import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.junit.TestProfile;
import io.quarkus.test.junit.QuarkusTestProfile;
import io.quarkus.test.security.TestSecurity;
import org.junit.jupiter.api.Test;
import java.util.Map;
import static io.restassured.RestAssured.given;

@QuarkusTest
@TestProfile(DisabledQrResourceTest.Disabled.class)
class DisabledQrResourceTest extends TestBase {
    public static class Disabled implements QuarkusTestProfile {
        @Override public Map<String,String> getConfigOverrides(){return Map.of("partyhub.qr.enabled","false");}
    }
    @Test void prototypeLoginIsNotAvailableByDefault() {
        given().contentType("application/json").body(Map.of("mobile_token","forged-token"))
                .post("/api/qr/mobile/me").then().statusCode(404);
        given().contentType("application/json").body(Map.of("token","fake-token"))
                .post("/api/qr/exchange").then().statusCode(404);
        given().get("/api/qr/image/user/1").then().statusCode(404);
    }
    @Test @TestSecurity(user="qr-disabled") void authenticatedUsersCannotEnablePrototypeRoutes() {
        given().get("/api/qr/generate").then().statusCode(404);
    }
}
