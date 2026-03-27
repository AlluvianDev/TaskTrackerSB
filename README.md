# ✅ TaskTracker

A full-stack task management application built with **Spring Boot 4** and a modern **vanilla JavaScript** frontend. Organize work into task lists, create tasks with priorities and due dates, and track progress — all through a sleek, responsive UI.

---

## Features

- **Task Lists** — Group related tasks into organized lists
- **Full CRUD** — Create, read, update, and delete both task lists and tasks
- **Priority Levels** — Assign `LOW`, `MEDIUM`, or `HIGH` priority to tasks
- **Status Tracking** — Mark tasks as `OPEN` or `CLOSED`
- **Due Dates** — Set deadlines with date-time precision
- **Modern UI** — Glassmorphism design, smooth animations, responsive sidebar layout
- **RESTful API** — Clean REST endpoints for programmatic access

---

## Tech Stack

| Layer       | Technology                        |
|-------------|-----------------------------------|
| Backend     | Java 24, Spring Boot 4.0.4        |
| Database    | PostgreSQL                        |
| ORM         | Spring Data JPA / Hibernate       |
| Frontend    | HTML5, CSS3, Vanilla JavaScript   |
| Build       | Maven                             |

---

## Project Structure

```
src/main/java/com/devtiro/tasks/
├── config/              # CORS configuration
├── controllers/         # REST controllers (TaskList, Task)
├── domain/
│   ├── dto/             # Data Transfer Objects
│   └── entities/        # JPA entities (Task, TaskList, enums)
├── mappers/             # Entity ↔ DTO mappers
├── repositories/        # Spring Data JPA repositories
├── services/            # Business logic layer
└── TasksApplication.java

src/main/resources/
├── static/              # Frontend (index.html, app.js, index.css)
└── application.properties
```

---

## Getting Started

### Prerequisites

- **Java 24** or later
- **PostgreSQL** running locally (or remote)
- **Maven 3.9+** (or use the included Maven wrapper)

### 1. Clone the Repository

```bash
git clone https://github.com/<your-username>/task-tracker.git
cd task-tracker
```

### 2. Configure the Database

Create a PostgreSQL database:

```sql
CREATE DATABASE tasklist;
```

Create a `.env` file in the project root with your database credentials:

```env
DB_URL=jdbc:postgresql://localhost:5432/tasklist
DB_USERNAME=postgres
DB_PASSWORD=your_password
```

> **Note:** The `.env` file is excluded from version control via `.gitignore`.

### 3. Run the Application

Using the Maven wrapper:

```bash
# Linux / macOS
./mvnw spring-boot:run

# Windows
mvnw.cmd spring-boot:run
```

The application starts at **http://localhost:8080**.

---

## API Reference

### Task Lists

| Method   | Endpoint                     | Description              |
|----------|------------------------------|--------------------------|
| `GET`    | `/task-lists`                | List all task lists      |
| `POST`   | `/task-lists`                | Create a new task list   |
| `GET`    | `/task-lists/{id}`           | Get a task list by ID    |
| `PUT`    | `/task-lists/{id}`           | Update a task list       |
| `DELETE` | `/task-lists/{id}`           | Delete a task list       |

### Tasks

| Method   | Endpoint                                    | Description           |
|----------|---------------------------------------------|-----------------------|
| `GET`    | `/task-lists/{listId}/tasks`                | List tasks in a list  |
| `POST`   | `/task-lists/{listId}/tasks`                | Create a new task     |
| `GET`    | `/task-lists/{listId}/tasks/{taskId}`       | Get a task by ID      |
| `PUT`    | `/task-lists/{listId}/tasks/{taskId}`       | Update a task         |
| `DELETE` | `/task-lists/{listId}/tasks/{taskId}`       | Delete a task         |

### Example Request

```bash
# Create a task list
curl -X POST http://localhost:8080/task-lists \
  -H "Content-Type: application/json" \
  -d '{"title": "Sprint 1", "description": "First sprint tasks"}'

# Add a task to the list
curl -X POST http://localhost:8080/task-lists/{listId}/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Set up CI/CD",
    "description": "Configure GitHub Actions pipeline",
    "priority": "HIGH",
    "status": "OPEN"
  }'
```

---

## Data Model

```
TaskList                          Task
┌──────────────┐                  ┌──────────────────┐
│ id (UUID)    │──── 1:N ────────▶│ id (UUID)        │
│ title        │                  │ title            │
│ description  │                  │ description      │
│ created      │                  │ dueDate          │
│ updated      │                  │ status (enum)    │
└──────────────┘                  │ priority (enum)  │
                                  │ taskListId (FK)  │
                                  │ created          │
                                  │ updated          │
                                  └──────────────────┘
```

**TaskStatus:** `OPEN` | `CLOSED`  
**TaskPriority:** `LOW` | `MEDIUM` | `HIGH`

---

