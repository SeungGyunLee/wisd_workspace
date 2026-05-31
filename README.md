Kring (크링) 🚀
"Collaboration Made Simple" - A lightweight workspace for project beginners.

[Live Demo](http://152.67.199.142:5173/)

📝 Project Overview
Kring is a zero-configuration collaborative workspace. We removed the complexity of professional tools like JIRA to help first-time project teams focus purely on their goals.

👥 Team Wisd (2026)
SeungGyun Lee (PM / Infrastructure): Cloud Architecture, Docker Orchestration, Network Security.

JiYoung (Frontend): React, Real-time UI, State Management.

DongJin (Backend): Auth System, JWT, External Cloud DB.

HwiSeo (Backend): Workspace Logic, API Development, MySQL Schema.

🛠 Tech Stack
Frontend: React (Vite), WebSocket

Backend: Node.js (Express), JWT

Database: MySQL 8.0, TiDB Cloud

Infrastructure: Oracle Cloud (Ubuntu), Docker

🔒 Key Security Features (Infra)
Network Isolation: Backend and Database are isolated within a private Docker network (wisd-network).

Access Control: Public access to Database ports (3306) is completely blocked via OCI Security Lists.

Containerization: All services are deployed as independent Docker containers for stable orchestration.

© 2026 Team Wisd. All rights reserved.
