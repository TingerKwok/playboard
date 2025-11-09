<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Play Board with Supabase & SiliconFlow (Secure Backend Version)

This is a fun, collaborative playground to share ideas and create images with virtual sticky notes. This version is powered by **Supabase** for real-time data synchronization and uses a secure **Cloudflare Worker** to handle **SiliconFlow (硅基流动) API** requests, ensuring your API key is never exposed to the public.

## Setup Instructions

To run this application, you need a Supabase account and a SiliconFlow API key, both configured securely.

### 1. Set Up Supabase (Database)

*(If you have already done this, you can skip to Step 2)*

- **A. Create a Supabase Project:**
    - Go to [supabase.com](https://supabase.com/), sign up, and create a new project.

- **B. Create the `notes` Table:**
    - In your project dashboard, go to the **Table Editor**.
    - Click **Create a new table**, name it `notes`.
    - Make sure **Enable Row Level Security (RLS)** is checked.
    - Add the required columns: `content` (text), `type` (text), `x` (float8), `y` (float8), `color` (text), `rotation` (text), `zIndex` (int8).
    - Click **Save**.

- **C. Enable Realtime & Set Security Policies:**
    - Go to **Database** -> **Replication** and enable realtime for the `notes` table.
    - Go to **Authentication** -> **Policies** and add new policies from a template for your `notes` table to allow `SELECT`, `INSERT`, `UPDATE`, and `DELETE` for public access. *For a real app, you would make these more secure.*

- **D. Configure the Application:**
    - Go to **Project Settings** -> **API**.
    - Copy your **Project URL** and your **`anon` public key**.
    - Open the `supabaseClient.ts` file in this project and replace the placeholder values.

### 2. Set Up Secure API Key with Cloudflare Worker

Instead of exposing your API key in the frontend code, we will use a Cloudflare Worker as a secure backend proxy.

- **A. Get Your SiliconFlow API Key:**
    - Go to [SiliconFlow's Website](https://www.siliconflow.cn/) and get your API key.

- **B. Deploy to Cloudflare Pages:**
    - Connect your GitHub repository to Cloudflare Pages.
    - During the setup, choose your desired framework preset (e.g., Vite).
    - The code in this repository is already set up to use Cloudflare Pages Functions. The backend worker code is located in the `/functions/api/proxy.ts` file.

- **C. Add Your API Key as a Secret Environment Variable:**
    - In your Cloudflare Pages project dashboard, go to **Settings** -> **Environment variables**.
    - Under "Production" and "Preview", click **Add variable**.
    - **Variable name**: `SILICONFLOW_API_KEY`
    - **Value**: Paste your secret key from SiliconFlow here.
    - Click **Encrypt** to ensure your key is stored securely.
    - **Save** the changes.

- **D. Redeploy Your Project:**
    - Go to the "Deployments" tab in your Cloudflare project and trigger a new deployment to apply the environment variable changes.

Your application is now securely configured. The frontend will call the function at `/api/proxy`, which then securely uses your API key on the backend to communicate with SiliconFlow.

### 3. Run Locally (for Development)

If you need to test the full functionality locally, you will need to use Cloudflare's `wrangler` CLI, which can simulate the Pages environment and your secret keys.

1.  Install Wrangler: `npm install -g wrangler`
2.  Authenticate: `wrangler login`
3.  Create a `.dev.vars` file in your project root.
4.  Add your secret to `.dev.vars`: `SILICONFLOW_API_KEY="sk-..."`
5.  Run the local dev server: `wrangler pages dev -- npm run dev`

This command starts your Vite development server while also running the functions proxy, giving you the full backend functionality on your local machine.
