# Career Guru — AI-Powered Career Preparation Platform

Career Guru is a full-stack AI-driven career preparation platform built for software engineering internship and placement preparation. It combines coding profile analytics, AI-generated study planning, resume intelligence, GitHub project analysis, and public portfolio sharing into one unified dashboard.

The goal of Career Guru is to help students track their preparation like a product: measure coding progress, identify weak topics, generate focused study tasks, analyze resumes against target roles, and share a professional public profile with recruiters.

Deployed Link- https://career-guru-eight.vercel.app

---

## Table of Contents

- [Project Overview](#project-overview)
- [Core Features](#core-features)
- [System Architecture](#system-architecture)
- [Performance and Scalability](#performance-and-scalability)
- [Tech Stack](#tech-stack)
- [Folder Structure](#folder-structure)
- [Environment Variables](#environment-variables)
- [Local Setup](#local-setup)
- [Running the Project Locally](#running-the-project-locally)
- [API Overview](#api-overview)
- [Future Improvements](#future-improvements)
- [Author](#author)

---

## Project Overview

Career Guru is designed as an AI career operating system for students preparing for SDE internships and placements.

It helps users answer questions like:

- Am I ready for software engineering interviews?
- Which DSA topics am I weak in?
- How consistent am I across coding platforms?
- What should I study today?
- Is my resume strong enough for a specific company or role?
- Can I share a clean public portfolio with recruiters?
- Are my GitHub projects visible and presentable?

Instead of keeping coding stats, resume feedback, GitHub projects, and study planning separate, Career Guru connects them into one intelligent preparation workspace.

---

## Core Features

### 1. Authentication and User Workspace

- User registration and login using JWT authentication.
- Protected dashboard routes.
- Onboarding flow after registration.
- Persistent authentication using local storage.
- Profile setup with coding platform handles.
- Public portfolio toggle.

### 2. Onboarding System

After registration, users are redirected to an onboarding page where they can:

- Enter LeetCode username.
- Enter Codeforces handle.
- Enter CodeChef handle.
- Enter GitHub username.
- Validate handles.
- Sync selected platforms.
- Skip onboarding and continue to dashboard.
- Sync platforms later from Profile Settings.

### 3. Coding Analytics Dashboard

Career Guru syncs and displays statistics from:

- LeetCode
- Codeforces
- CodeChef
- GitHub

It provides:

- Total solved problems.
- Difficulty-wise solved count.
- Topic-wise distribution.
- Heatmap-ready submission dates.
- Streak data.
- Contest rating history.
- Current and max rating.
- Platform linking status.
- GitHub repository intelligence.

### 4. AI Study Planner

The Study Plan module generates compact and connected learning tasks using AI.

It can generate:

- DSA practice plans.
- Development tasks.
- Core CS revision tasks.
- Resume improvement tasks.
- System design preparation tasks.
- Mixed internship preparation plans.

AI-generated tasks include:

- Task title.
- Description.
- Priority.
- Estimated time.
- Reason for the task.
- Success criteria.
- Resource links from LeetCode, GeeksforGeeks, Striver, CP31, Codeforces, or official docs.

### 5. Resume Intelligence

Users can upload resumes and analyze them for different roles and companies.

The system supports:

- Resume upload.
- Resume vault.
- Resume analysis page.
- ATS score.
- Readiness score.
- Role extraction.
- Skill extraction.
- Market gap analysis.
- Score breakdown.
- AI suggestions.
- Bullet rewrite suggestions.
- Company-specific improvement feedback.

### 6. Public Portfolio

Users can create and share a public portfolio at:


/u/:username

The portfolio includes:

- Profile information
- Skills
- Coding platform stats
- Platform profile links
- Contest ratings
- GitHub projects
- Topic expertise
- Difficulty distribution
- Career Guru AI-style summary
- Rating out of 10 stars
- Dark/light mode support

---
 Dark and Light Mode

The UI supports both dark and light mode using CSS variables and a global theme context.

The visual design is inspired by a clean LeetCode-style interface:

- Minimal cards
- Amber accent color
- Soft borders
- Compact layouts
- Professional dashboard appearance
- Consistent app-wide theme

---

## System Architecture

```
Career Guru
│
├── Frontend: React + Vite + Tailwind CSS
│   ├── Public home page
│   ├── Login/Register pages
│   ├── Dashboard
│   ├── Coding analytics
│   ├── Study planner
│   ├── Resume vault and analysis
│   ├── Profile settings
│   └── Public portfolio
│
├── Backend: Node.js + Express.js
│   ├── Authentication APIs
│   ├── Profile APIs
│   ├── Coding platform sync APIs
│   ├── Study plan APIs
│   ├── Resume upload and analysis APIs
│   └── Public portfolio APIs
│
├── Database: MongoDB Atlas
│   ├── Users
│   ├── Profiles
│   ├── Coding profiles
│   ├── Platform submissions
│   ├── Contest history
│   ├── Study tasks
│   ├── Study plans
│   ├── Resume analysis
│   └── Analytics snapshots
│
├── AI Engine
│   └── Groq SDK using Llama model
│
└── Storage
    └── Cloudinary for resume/document storage

```


## Performance and Scalability

To ensure the platform remains responsive during high-traffic periods, I implemented a robust caching architecture.

### Caching Strategy

* **Redis Read-Through Cache:** Implemented using `ioredis` to cache high-traffic routes (Dashboard and Public Portfolio). This bypasses intensive MongoDB aggregations, serving JSON data directly from memory.
* **Cache Invalidation:** Developed an event-driven protocol; whenever a user syncs new platform data or updates their profile, the system triggers an explicit cache purge to ensure strict data consistency.
* **Graceful Fallback:** Engineered a resiliency layer; if the Redis cache fails, the system automatically detects the error and falls back to querying the primary MongoDB database, ensuring 100% platform uptime.

### Benchmark Results

Benchmarks performed locally using [k6](https://k6.io/) simulating 50 concurrent virtual users over a 30s load test.

| Metric | Without Redis | With Redis | Improvement |
| :--- | :--- | :--- | :--- |
| **Avg Latency** | 1600ms | 742ms | **~53.6% Faster** |
| **Throughput** | 28.6 req/s | 58.5 req/s | **~104% Higher** |
| **Request Success Rate** | 100% | 100% | Stable |

---



### Tech Stack

### Frontend

| Technology | Purpose |
|---|---|
| React.js | Frontend UI framework |
| Vite | Fast React development and production build |
| Tailwind CSS | Utility-first styling |
| CSS Variables | Global theme system |
| React Router DOM | Client-side routing |
| Axios | API communication |
| Lucide React | Icons |
| Recharts | Charts and analytics visualization |
| Context API | Auth and theme state management |

### Backend

| Technology | Purpose |
|---|---|
| Node.js | Runtime environment |
| Express.js | Backend API framework |
| MongoDB | NoSQL database |
| Mongoose | MongoDB ODM |
| JWT | Authentication |
| bcryptjs | Password hashing |
| Multer | File upload handling |
| Cloudinary | Resume/document storage |
| pdf-parse | Resume PDF text extraction |
| Groq SDK | AI analysis and generation |
| Axios | External API requests |
| CORS | Frontend-backend communication |

### External Platforms

| Platform | Usage |
|---|---|
| LeetCode | Coding stats, solved problems, ratings |
| Codeforces | Submissions, topics, contests, ratings |
| CodeChef | Profile and rating data |
| GitHub | Repository and project data |
| Cloudinary | Resume file storage |
| MongoDB Atlas | Cloud database |
| Groq | AI generation and analysis |

---

## Folder Structure

```txt
career-guru/
│
├── backend/
│   ├── server.js
│   ├── package.json
│   └── src/
│       ├── config/
│       │   ├── db.js
│       │   └── cloudinary.js
│       │
│       ├── controllers/
│       │   ├── authController.js
│       │   ├── ProfileController.js
│       │   ├── statsController.js
│       │   ├── studyPlanController.js
│       │   ├── resumeController.js
│       │   └── aiController.js
│       │
│       ├── middlewares/
│       │   ├── authMiddleware.js
│       │   └── multer.js
│       │
│       ├── models/
│       │   ├── user.js
│       │   ├── Profile.js
│       │   ├── CodingProfile.js
│       │   ├── SolvedProblem.js
│       │   ├── PlatformSubmission.js
│       │   ├── ContestHistory.js
│       │   ├── UpcomingContest.js
│       │   ├── GitHubRepo.js
│       │   ├── UserAnalyticsSnapshot.js
│       │   ├── StudyPlan.js
│       │   ├── StudyTask.js
│       │   ├── StudyTopic.js
│       │   └── ResumeAnalysis.js
│       │
│       ├── routes/
│       │   ├── authRoutes.js
│       │   ├── ProfileRoutes.js
│       │   ├── statsRoutes.js
│       │   ├── studyPlanRoutes.js
│       │   ├── resumeRoutes.js
│       │   └── aiRoutes.js
│       │
│       └── services/
│           └── platforms/
│               ├── leetcodeService.js
│               ├── codeforcesService.js
│               ├── codechefService.js
│               ├── githubService.js
│               └── aiservice.js
│
└── frontend/
    ├── index.html
    ├── package.json
    ├── vercel.json
    └── src/
        ├── api/
        │   ├── axios.js
        │   ├── auth.js
        │   ├── stats.js
        │   └── resume.js
        │
        ├── context/
        │   ├── AuthContext.jsx
        │   └── ThemeContext.jsx
        │
        ├── layouts/
        │   └── MainLayout.jsx
        │
        ├── pages/
        │   ├── Home.jsx
        │   ├── Login.jsx
        │   ├── Register.jsx
        │   ├── Onboarding.jsx
        │   ├── Dashboard.jsx
        │   ├── CodingStats.jsx
        │   ├── StudyPlan.jsx
        │   ├── Resume.jsx
        │   ├── ResumeUpload.jsx
        │   ├── ResumeAnalysis.jsx
        │   ├── Profile.jsx
        │   └── PublicPortfolio.jsx
        │
        ├── routes/
        │   └── AppRoutes.jsx
        │
        ├── App.jsx
        ├── App.css
        ├── index.css
        └── main.jsx


## Environment Variables

### Backend `.env`

Create a `.env` file inside the `backend` folder.

```env
NODE_ENV=development
PORT=5000

MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_long_random_jwt_secret

GROQ_API_KEY=your_groq_api_key

CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

FRONTEND_URL=http://localhost:5173
```

### Frontend `.env.local`

Create a `.env.local` file inside the `frontend` folder.

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

For production, set:

```env
VITE_API_BASE_URL=https://your-backend-domain.com/api
```

---

## Local Setup

### Prerequisites

Make sure you have installed:

- Node.js
- npm
- Git
- MongoDB Atlas account
- Cloudinary account
- Groq API key

---

## Running the Project Locally

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/career-guru.git
cd career-guru
```

### 2. Install Backend Dependencies

```bash
cd backend
npm install
```

### 3. Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

### 4. Add Environment Variables

Create the following files:

```txt
backend/.env
frontend/.env.local
```

Use the environment variable examples given above.

### 5. Run Backend

```bash
cd backend
npm run dev
```

Backend will run on:

```txt
http://localhost:5000
```

Health check:

```txt
http://localhost:5000/health
```

### 6. Run Frontend

```bash
cd frontend
npm run dev
```

Frontend will run on:

```txt
http://localhost:5173
```

---

## API Overview

### Auth Routes

```txt
POST /api/auth/register
POST /api/auth/login
```

### Profile Routes

```txt
GET  /api/profile
POST /api/profile
GET  /api/profile/validate
GET  /api/profile/u/:username
```

### Stats Routes

```txt
GET /api/stats/dashboard
GET /api/stats/sync/all
GET /api/stats/sync/leetcode
GET /api/stats/sync/codeforces
GET /api/stats/sync/codechef
GET /api/stats/sync/github
GET /api/stats/submissions
GET /api/stats/contests/history
GET /api/stats/contests/upcoming
GET /api/stats/github/deep-repos
GET /api/stats/analytics/snapshots
```

### Study Routes

```txt
GET    /api/study/plan
GET    /api/study/command-center
GET    /api/study/weaknesses
GET    /api/study/tasks
GET    /api/study/tasks/today
POST   /api/study/tasks
PATCH  /api/study/tasks/:id
PATCH  /api/study/tasks/:id/toggle
DELETE /api/study/tasks/:id
POST   /api/study/generate-ai
POST   /api/study/generate-mission
PATCH  /api/study/tasks/missed/reschedule
GET    /api/study/progress
```

### Resume Routes

```txt
POST   /api/resume/upload-only
POST   /api/resume/analyze-only
GET    /api/resume
GET    /api/resume/:id
DELETE /api/resume/:id
```


## Future Improvements

Planned improvements:


- More accurate resume scoring engine
- Company-specific preparation templates
- Personalized weekly reports
- Email reminders
- Public portfolio themes
- Recruiter view mode
- Advanced GitHub repository quality scoring
- AI-powered project improvement suggestions
- Calendar integration for study plans




## Known Limitations

- Some coding platform data depends on unofficial APIs.
- CodeChef data availability may vary.
- AI-generated suggestions should be reviewed by the user before applying.


---

## Author

Built by **Vaibhav Rai** and **Purushottam Sharma**

Software Engineering aspirants focused on:

- MERN Stack Development
- DSA and Competitive Programming
- AI-powered developer tools


---

## License

This project is currently for educational and portfolio use.



---

## Final Note

Career Guru is not just a dashboard. It is designed as a complete AI-powered career preparation system that connects coding practice, resume improvement, study planning, GitHub projects, and public portfolio sharing into one focused platform.

