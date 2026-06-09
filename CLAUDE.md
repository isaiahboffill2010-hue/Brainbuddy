# Claude Code Instructions for BrainBuddy

## Project Owner

My name is Isaiah Boffill, and I am the creator of BrainBuddy.

BrainBuddy is a personalized AI tutoring app designed to help students learn in a way that fits them best.

## Product Overview

BrainBuddy is built around the idea that every student learns differently. The app adapts to each student based on:

* Grade level
* Learning style
* Confidence level
* Interests
* Personality
* Topics they struggle with
* How they prefer to be helped
* Parent notes and preferences

BrainBuddy should never feel like a generic chatbot. It should feel like a supportive tutor that understands the student and explains things in a personalized, encouraging way.

## Core Student Features

BrainBuddy helps students with:

* Homework help
* Studying
* Difficult subjects
* Practice questions
* Quiz prep
* AI-generated study notes
* Step-by-step help from uploaded homework images
* Remembering mastered topics
* Remembering topics the student still struggles with

The app should avoid making students feel like they are starting over every session. Memory, continuity, and personalization are important.

## Core Parent Features

Parents should be able to:

* Manage students
* View learning sessions
* Generate quizzes
* Create study notes
* Support their child’s progress
* Review how their child is learning over time

The parent experience should feel simple, useful, and supportive.

## What Makes BrainBuddy Different

BrainBuddy does not give every student the same answer. It adapts to the student.

For example, if a student likes sports, games, Minecraft, dinosaurs, music, or real-life examples, BrainBuddy should use those interests to explain lessons in a way that makes sense to that student.

The goal is to help students:

* Learn better
* Feel less stressed
* Build confidence
* Get extra support outside the classroom
* Feel understood by their tutor

## Tone and Experience

BrainBuddy should feel:

* Supportive
* Simple
* Encouraging
* Friendly
* Patient
* Personalized
* Safe for students and parents

Avoid making the app feel cold, overly technical, or generic.

## Student AI Tutor Rules

When working on AI tutor behavior:

* Keep explanations grade-appropriate.
* Use simple language for younger students.
* Give step-by-step help.
* Do not overwhelm the student.
* Be encouraging.
* Personalize examples using the student’s interests when helpful.
* Remember mastered and struggling topics when available.
* If the student gets an answer wrong, explain the correct answer clearly and kindly.
* Do not shame or pressure the student.
* Keep the tutor focused on learning.

## Technical Context

This is a Next.js app using:

* React
* TypeScript
* Tailwind CSS
* Supabase
* Node.js
* Stripe for premium plans

Important app areas may include:

* Student dashboard
* Student AI chat
* Homework upload
* Student profile
* Parent dashboard
* Parent student management
* Parent sessions
* Quiz generation
* AI study notes
* Stripe checkout, portal, and webhook routes
* Supabase authentication and storage

## Important Folders and Files

Focus on these unless I say otherwise:

* src/
* supabase/
* public/
* package.json
* next.config.ts
* tailwind.config.ts
* tsconfig.json
* middleware.ts
* app/
* components/
* lib/
* hooks/
* types/

## Do Not Inspect Unless Asked

Avoid reading or searching these folders/files because they are large, generated, or sensitive:

* node_modules/
* .next/
* dist/
* build/
* coverage/
* package-lock.json
* tsconfig.tsbuildinfo
* .env
* .env.local
* .env.production

Do not expose secrets or environment variables.

## Development Workflow

For normal feature work:

1. Investigate first.
2. Do not edit files immediately.
3. Tell me which files are related.
4. Give me a short plan.
5. Wait for my approval before editing.
6. Make minimal changes only.
7. Do not refactor unrelated code.
8. Do not change app architecture unless I approve it.

## Coding Rules

* Use TypeScript.
* Keep changes clean and focused.
* Do not modify unrelated files.
* Do not remove working features.
* Do not change database schemas or migrations unless the task requires it.
* Do not change environment variables unless I ask.
* Keep UI simple, modern, and parent/student friendly.
* Prioritize mobile-friendly design.
* Use existing components and patterns when possible.

## Testing and Checks

Use these commands when needed:

```bash
npm run lint
npm run build
```

If a command fails, explain:

* What failed
* Which file caused it
* Why it failed
* The smallest fix needed

## Preferred Agent Workflow

For bigger tasks, use this workflow:

### 1. snoop-dog-snoopin

Investigate only. Do not edit files. Find the relevant files and explain the issue or feature path.

### 2. fix-master-flex

Implement the approved plan only. Make minimal changes. Do not refactor unrelated files.

### 3. buggie-smalls

Review the diff for bugs, regressions, missing states, TypeScript issues, and possible build problems. Do not edit unless asked.

Do not run these agents in parallel for normal feature work.

## Product Goal

BrainBuddy exists to help students learn in a way that fits them best.

Every feature should support one or more of these goals:

* Better learning
* More confidence
* Less stress
* More personalization
* Clear parent support
* Safe and encouraging tutoring
