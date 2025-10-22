package at.htl;

import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;

public class PartyResource {
    public static void main(String[] args) {
        Connection connection = DatabaseConnection.connect();
        String query = "SELECT * FROM party";

        try (Statement statement = connection.createStatement();
             ResultSet resultSet = statement.executeQuery(query)) {

            while (resultSet.next()) {
                System.out.println(resultSet.getString("host_user_id"));
            }
        } catch (SQLException e) {
            System.out.println("Query execution failed: " + e.getMessage());
        } finally {
            try { connection.close();
            } catch (SQLException e) {
                e.printStackTrace();
            }
        }
    }
}
