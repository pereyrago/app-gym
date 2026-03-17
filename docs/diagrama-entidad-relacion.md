# Diagrama Entidad-Relación — App Gym

Diagrama completo del modelo de datos (Supabase/PostgreSQL).

## Diagrama (Mermaid)

```mermaid
erDiagram
  auth_users ||--|| profiles : "id"
  profiles ||--o| teachers : "profile_id"
  teachers ||--o{ students : "teacher_id"
  teachers ||--o{ classes : "teacher_id"
  periods ||--o{ classes : "period_id"
  class_types ||--o{ classes : "class_type_id"
  classes ||--o{ class_attendances : "class_id"
  students ||--o{ class_attendances : "student_id"

  auth_users {
    uuid id PK "auth.users (Supabase)"
  }

  profiles {
    uuid id PK "FK auth.users"
    text email "NOT NULL"
    text full_name
    app_role role "admin | profesor, DEFAULT profesor"
    timestamptz created_at
    timestamptz updated_at
  }

  teachers {
    uuid id PK
    uuid profile_id UK "FK profiles, UNIQUE"
    text public_slug "UNIQUE, QR/slug público"
    timestamptz created_at
    timestamptz updated_at
  }

  periods {
    uuid id PK
    text name "NOT NULL"
    date start_date "NOT NULL"
    date end_date "NOT NULL, end >= start"
    timestamptz created_at
    timestamptz updated_at
  }

  students {
    uuid id PK
    uuid teacher_id "FK teachers"
    text full_name "NOT NULL"
    text email
    text dni "UNIQUE por teacher_id"
    text phone
    text emergency_contact_phone
    boolean apto_fisico
    text status "active | to_confirm | rejected"
    timestamptz deleted_at "soft delete"
    timestamptz created_at
    timestamptz updated_at
  }

  class_types {
    uuid id PK
    text name "NOT NULL"
    timestamptz created_at
    timestamptz updated_at
  }

  classes {
    uuid id PK
    uuid teacher_id "FK teachers"
    uuid period_id "FK periods"
    uuid class_type_id "FK class_types"
    date class_date "NOT NULL"
    time start_time "DEFAULT 09:00"
    int duration_minutes "DEFAULT 60"
    timestamptz created_at "regla 24h edición"
    timestamptz updated_at
  }

  class_attendances {
    uuid id PK
    uuid class_id "FK classes"
    uuid student_id "FK students"
    timestamptz created_at
    UNIQUE "class_id, student_id"
  }
```

## Resumen de relaciones

| Entidad origen  | Entidad destino   | Cardinalidad | Descripción                                         |
| --------------- | ----------------- | ------------ | --------------------------------------------------- |
| **auth.users**  | profiles          | 1:1          | Un usuario de auth tiene un perfil (id = auth.uid). |
| **profiles**    | teachers          | 1:0..1       | Un perfil puede ser profesor (profile_id UNIQUE).   |
| **teachers**    | students          | 1:N          | Un profesor tiene muchos alumnos.                   |
| **teachers**    | classes           | 1:N          | Un profesor dicta muchas clases.                    |
| **periods**     | classes           | 1:N          | Un período agrupa muchas clases.                    |
| **class_types** | classes           | 1:N          | Un tipo de clase se usa en muchas clases.           |
| **classes**     | class_attendances | 1:N          | Una clase tiene muchas asistencias.                 |
| **students**    | class_attendances | 1:N          | Un alumno puede tener muchas asistencias.           |

La tabla **class_attendances** es la tabla de enlace entre **classes** y **students** (N:M: un alumno asiste a muchas clases, una clase tiene muchos alumnos). Restricción UNIQUE (class_id, student_id).

## Índices relevantes

- `profiles`: PK en `id`.
- `teachers`: `profile_id`, UNIQUE en `public_slug`.
- `students`: `teacher_id`, (teacher_id, status), UNIQUE (teacher_id, dni) WHERE dni IS NOT NULL, (teacher_id, deleted_at).
- `classes`: `teacher_id`, `period_id`, `created_at`.
- `class_attendances`: `class_id`, `student_id`, UNIQUE (class_id, student_id).

## Notas

- **app_role**: ENUM `'admin' | 'profesor'`.
- **Regla de negocio**: Las clases solo pueden editarse/eliminarse dentro de las 24 horas posteriores a `created_at` (función `class_can_edit`).
- **Soft delete**: Alumnos con `deleted_at` no null se consideran borrados (no se listan en vistas normales).
- **RLS**: Todas las tablas tienen Row Level Security; el acceso depende de `get_user_role()`, `is_admin()` y `get_my_teacher_id()`.
