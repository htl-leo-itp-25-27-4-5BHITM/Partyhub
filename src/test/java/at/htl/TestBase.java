package at.htl;

import io.quarkus.test.junit.QuarkusTest;
import io.restassured.RestAssured;
import org.junit.jupiter.api.BeforeAll;

@QuarkusTest
public class TestBase {

    @BeforeAll
    public static void setup() {
        RestAssured.baseURI = "http://localhost:8081";
    }
}
