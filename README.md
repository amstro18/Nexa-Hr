This project was built with [Lovable](https://lovable.dev).

**Live app**: https://happy-storage-spot.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/c6899fbc-6f1b-4ac1-acef-cd3b9d691b5c).

# NexaHR

### AI-Powered, Role-Aware HR Intelligence Platform

NexaHR is an AI-powered HR assistant that enables employees and HR teams to access reliable, policy-grounded information through a conversational interface.

Instead of relying on a generic AI model, NexaHR retrieves relevant information from an organization's approved HR policies and uses the authenticated user's role to provide context-aware responses.

---

## Overview

HR information is often scattered across documents, policies, and internal resources. Finding a simple answer can require unnecessary time from both employees and HR teams.

NexaHR provides a single interface for accessing this information through natural-language conversations while maintaining organizational context and policy boundaries.

### Core capabilities

* **Policy-grounded AI responses** — Answers are generated using approved HR information.
* **Role-aware responses** — Context is adapted based on the authenticated user's role.
* **Controlled knowledge access** — The assistant is instructed not to fabricate unsupported policies.
* **Policy references** — Responses can be traced back to relevant HR information.
* **Secure authentication** — User identity and access are managed through Supabase.
* **Conversational interface** — Employees can interact with HR policies using natural language.

---

## Architecture

```text
User
 │
 ▼
Authentication
 │
 ▼
Role Identification
 │
 ▼
Policy Retrieval
 │
 ▼
Relevant HR Context
 │
 ▼
AI Generation
 │
 ▼
Grounded Response
```

The system combines authentication, role-based context, policy retrieval, and generative AI to produce responses that are both useful and constrained by organizational policy.

---

## Role-Based Access

NexaHR supports multiple organizational roles:

| Role     | Access                         |
| -------- | ------------------------------ |
| Employee | Employee-facing HR policies    |
| Intern   | Intern-specific HR information |
| HR       | HR and organizational policies |
| CEO      | Executive-level information    |

The user's role is obtained from the authenticated session and incorporated into the AI request.

This allows the platform to provide different responses to the same question depending on the user's organizational authority.

---

## AI & RAG

The assistant follows a policy-grounded approach rather than treating the language model as the source of truth.

For each request:

1. The user is authenticated.
2. The user's role is identified.
3. Relevant HR policies are retrieved.
4. The retrieved information is provided as context to the AI.
5. The AI generates a response based on that approved context.
6. Unsupported information is not presented as company policy.

This approach is designed to reduce hallucinations and improve reliability in an HR environment.

---

## Example

**Employee asks:**

> Can I approve a company-wide compensation policy change?

NexaHR considers the user's authenticated role and available HR policies before responding.

A different user with executive authorization may receive a different response to the same question.

The system can also decline questions when the requested information is not available in the approved knowledge base.

---

## Technology

**Frontend**

* React
* TypeScript
* Vite
* Tailwind CSS
* Radix UI

**Backend & Data**

* Supabase
* PostgreSQL
* Server-side API routes

**AI**

* AI SDK
* Lovable AI Gateway
* OpenAI

**Testing**

* Vitest

---

## Getting Started

### Prerequisites

* Node.js
* npm
* Supabase project
* Required AI/API credentials

### Installation

```bash
git clone https://github.com/amstro18/happy-storage-spot.git
cd happy-storage-spot
npm install
```

Create a local `.env` file containing the required environment variables.

> Do not commit `.env` or other credentials to the reposit

Screenshots of the working model - <img width="1917" height="922" alt="image" src="https://github.com/user-attachments/assets/f2873def-3074-46e9-a586-a3310072cec1" />
<img width="1917" height="930" alt="image" src="https://github.com/user-attachments/assets/8cd91da0-eedd-43e8-9784-778a0c8cebf9" />
<img width="1917" height="923" alt="image" src="https://github.com/user-attachments/assets/3a49904c-4c8a-47f8-a9b0-510d86a1e69b" />

