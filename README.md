# PartyHub

<p align="center">
  <img src="logo.png" alt="PartyHub Logo" width="200">
</p>
<p align="center">
  <a href="https://github.com/htl-leo-itp-25-27-4-5BHITM/Partyhub/actions/workflows/deploy.yml"><img src="https://img.shields.io/github/actions/workflow/status/htl-leo-itp-25-27-4-5BHITM/Partyhub/deploy.yml?branch=main&style=for-the-badge" alt="Deploy status"></a>
</p>


A social event platform for organizing and discovering parties, meetups, and social gatherings.

## Features

- **User Management**: Registration, profiles with pictures, biographies
- **Event Creation**: Hosts can create parties with details, categories, and locations
- **Social Features**: Follow users, send invitations, join parties
- **Media Sharing**: Upload and share media from events
- **Location-Based**: Events with geographic coordinates and addresses
- **Age Restrictions**: Set minimum and maximum age limits for events

## Tech Stack

- **Backend**: Quarkus 3.28.2 (Java 21)
- **Database**: PostgreSQL with Hibernate ORM
- **Authentication**: JWT with SmallRye
- **Documentation**: Swagger UI for API exploration

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

## Production

**Website**: https://it220274.cloud.htl-leonding.ac.at

## Project Structure

```
Partyhub/
├── src/main/
│   ├── java/at/htl/partyhub/
│   │   ├── model/          # JPA Entities
│   │   ├── repository/     # Data Access Objects
│   │   ├── resource/       # REST Endpoints
│   │   └── dto/            
│   └── resources/          # Static files
├── src/test/                
├── src/main/resources/
│   ├── application.properties # Application config
├── pom.xml                 
└── deploy-local.sh 
```

## Running Tests

```bash
mvn clean test
```

Code coverage is generated using **JaCoCo**.

After tests complete, view the HTML coverage report at:

```
target/jacoco-report/index.html
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
- **Media**: `/api/media/*` - Media upload and retrieval
- **Invitations**: `/api/invitations/*` - Invitation management
- **Follow**: `/api/follow/*` - Social connections

## Sprint Review Dates

1.  Sprint: 08.10.2025
2.  Sprint: 05.11.2025
3.  Sprint: 19.11.2025
4.  Sprint: 03.12.2025
5.  Sprint: 17.12.2025
6.  Sprint: 14.01.2026
7.  Sprint: 28.01.2026
8.  Sprint: 11.02.2026
9.  Sprint: 04.03.2026
10. Sprint: 18.03.2026
