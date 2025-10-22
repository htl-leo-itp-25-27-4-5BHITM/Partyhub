package at.htl;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

public class DatabaseConnection {
    public static Connection connect() {
        Connection connection = null;
        String url = "jdbc:postgresql://localhost:5432/demo";
        String user = "demo";
        String password = "demo";

        try {
            connection = DriverManager.getConnection(url, user, password);
            System.out.println("Connected to the database successfully.");
        } catch (SQLException e) {
            System.out.println("Connection failed: " + e.getMessage());
        }

        return connection;
    }
}