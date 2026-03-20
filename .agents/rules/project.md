---
trigger: always_on
---

# Architecture Rules

## Folder Structure
- Interfaces must be placed in /src/other
- Services must be in /src/services
- Types must be in /src/types
- DTOs must be in /src/dtos

## Coding Rules
- All database access must go through service classes
- DTOs should be the object that UI should use to carries or display data 
