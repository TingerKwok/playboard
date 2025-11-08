
<div align="center">
<img width="1200" height="475" alt="Play Board Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Play Board with Google Gemini

This is a fun, client-side playground to share ideas and create images with virtual sticky notes. It's powered by the **Google Gemini API** for AI-powered text and image generation and uses your browser's local storage to save your work.

This version is a refactor of the original, removing all server-side dependencies for a simpler, more robust, and offline-first experience.

## Features

- **AI Content Generation**: Type text or a simple noun (e.g., "a happy cat") and let Gemini create a sticky note for you.
- **Image & Text Notes**: The app intelligently decides whether to create a text note or generate a cartoon-style image.
- **Interactive Board**: Drag, drop, and delete notes on an infinite canvas.
- **Offline First**: All notes are saved in your browser's local storage, so your creations are safe between sessions.
- **Zero Backend Setup**: No databases or cloud functions to configure. It just works.

## Setup Instructions

To run this application, you only need a Google Gemini API key.

### 1. Get a Gemini API Key

- Go to the [Google AI for Developers](https://ai.google.dev/gemini-api/docs/api-key) page.
- Click on **"Get an API key"** and follow the instructions to create your key.

### 2. Configure the Application

- In the root directory of this project, create a new file named `.env`.
- Add your API key to the `.env` file like this:

  ```
  GEMINI_API_KEY='YOUR_API_KEY_HERE'
  ```
- Replace `YOUR_API_KEY_HERE` with the actual key you obtained.

### 3. Run Locally

**Prerequisites:** Node.js and npm.

1.  **Install dependencies:**
    ```bash
    npm install
    ```
2.  **Run the development server:**
    ```bash
    npm run dev
    ```

Your Play Board should now be running locally, connected to the Gemini API!
