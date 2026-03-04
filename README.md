# PartyHub

A social event platform for organizing and discovering parties, meetups, and social gatherings.

## Features

- **User Management**: Registration, profiles with pictures, biographies
- **Event Creation**: Hosts can create parties with details, categories, and locations
- **Social Features**: Follow users, send invitations, join parties
- **Media Sharing**: Upload and share photos from events
- **Location-Based**: Events with geographic coordinates and addresses
- **Category System**: Filter events by music, tech, sports, art, networking, food, wellness, and education
- **Age Restrictions**: Set minimum and maximum age limits for events
- **Payment Integration**: Fee-based events with online payment support

## Tech Stack

- **Backend**: Quarkus 3.28.2 (Java 21)
- **Database**: PostgreSQL with Hibernate ORM
- **API**: REST with Jackson serialization
- **Authentication**: JWT with SmallRye
- **Documentation**: Swagger UI for API exploration

## Prerequisites

- Java 21 or later
- Maven 3.8+
- PostgreSQL 12+ (for production)

## Installation

### 1. Clone the repository

```bash
git clone git@github.com:htl-leo-itp-25-27-4-5BHITM/Partyhub.git
cd Partyhub
```

### 2. Setup local development

```bash
./deploy-local.sh
```
### 3. Open the application

**Website**: http://localhost:8080

**API Documentation**: http://localhost:8080/q/swagger-ui/

## Project Structure

```
Partyhub/
├── src/main/
│   ├── java/at/htl/partyhub/
│   │   ├── model/          # JPA Entities
│   │   ├── repository/     # Data Access Objects
│   │   ├── service/        # Business Logic
│   │   ├── resource/       # REST Endpoints
│   │   └── dto/            # Data Transfer Objects
│   └── resources/          # Static files, templates
├── src/test/                # Test files
├── src/main/resources/
│   ├── application.properties # Database config
│   └── import.sql           # Sample data
├── pom.xml                 # Maven dependencies
└── deploy-local.sh         # Development setup script
```

## Database Schema

- **users**: User accounts with display names, emails, and biographies
- **profile_picture**: One-to-one relationship with users
- **category**: Event categories (music, tech, sports, etc.)
- **location**: Geographic locations with coordinates and addresses
- **party**: Event details, timing, capacity, and fees
- **party_user**: Many-to-many relationship between users and parties
- **media**: Photos uploaded by users for parties
- **invitation**: Direct invitations between users for specific parties
- **follow**: User follow relationships with status tracking
- **follow_status**: Status values (pending, accepted, blocked)

## Running Tests

```bash
mvn clean test
```

## Building the Project

```bash
mvn clean package
```

## API Reference

The application provides a comprehensive REST API with the following endpoints:

- **Authentication**: `/api/auth/*` - Login, register, token management
- **Users**: `/api/users/*` - User CRUD operations
- **Parties**: `/api/parties/*` - Event management
- **Categories**: `/api/categories/*` - Category management
- **Media**: `/api/media/*` - Photo upload and retrieval
- **Invitations**: `/api/invitations/*` - Invitation management
- **Follow**: `/api/follow/*` - Social connections

## Sprint Review Dates

1. Sprint: 08.10.2025
2. Sprint: 05.11.2025
3. Sprint: 19.11.2025
4. Sprint: 03.12.2025
5. Sprint: 17.12.2025
6. Sprint: 14.01.2026
7. Sprint: 28.01.2026
8. Sprint: 11.02.2026
9. Sprint: 04.03.2026

## License

This project is licensed under the MIT License - see the LICENSE file for details.
