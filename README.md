# Auto-Director-ai cinematic storyboard generator

Auto-Director is an AI-powered system that takes a **single-line story idea** and transforms it into a **fully structured 3-act cinematic storyboard**. The goal is to reduce friction for storytellers and creators by turning a simple idea into something that feels much closer to a film-ready visual plan.

live link -https://auto-director-gcgl.vercel.app/
## Problem We Solved

A lot of people have strong creative ideas, but they struggle to convert them into structured cinematic elements like:
- acts
- scenes
- shots
- visual framing

Our project solves that by automatically breaking down a story idea into a cinematic feed that is much easier to understand and visualize.

## How It Works

The user enters one simple prompt, for example:
“A futuristic heist in a high-security vault.”

After clicking **Generate Feed**, the system processes the idea through a multi-step pipeline:

1. **Screenwriter stage**
   - The story is expanded into a coherent **3-act narrative**:
   - Setup
   - Conflict
   - Resolution

2. **Cinematographer stage**
   - Each act is divided into **3 scenes**
   - Each scene is further divided into **3 shots**
   - Every shot includes framing details like:
   - Wide Shot
   - Medium Shot
   - Close-Up
   - Over-the-Shoulder
   - and other cinematic compositions

3. **Visual stage**
   - Each shot is paired with a visual prompt
   - The system also fetches matching images using Unsplash to support the storyboard visually

## Output Format

Instead of showing plain JSON or raw text, we present the result as a **vertical cinematic feed UI**.

This feed shows:
- the title of the story
- logline
- all 3 acts
- 9 scenes in total
- 27 shots in total
- framing information
- shot descriptions
- visual prompts
- matching visuals

This makes the result much easier to consume and much more presentation-friendly.

## Tech Stack

This project is built using:
- **Next.js**
- **TypeScript**
- **Tailwind CSS**
- **Google Gemini API** for story generation
- **Unsplash API** for visual image matching

## Why This Matters

Auto-Director helps bridge the gap between:
- raw imagination
- and structured cinematic storytelling

It can be useful for:
- filmmakers
- writers
- animators
- content creators
- pre-visualization workflows

## closing
So in summary, Auto-Director converts a single-line idea into a structured, visually supported 3-act storyboard with scenes and shot breakdowns in a cinematic feed interface.

Thank you.
## 🎥 Demo Video

Watch here: https://drive.google.com/file/d/1jMKPqi603jPoDPJ_rpnkUWe6EJm4jcLx/view?usp=sharing
