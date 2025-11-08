<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Play Board with Tencent CloudBase

This is a fun, collaborative playground to share ideas and create images with virtual sticky notes. This version is powered by **Tencent CloudBase** for real-time data synchronization and **Tencent Hunyuan** for AI image generation, ensuring a smooth experience for users in all regions.

## Setup Instructions

To run this application, you need a Tencent Cloud account. The setup involves configuring a CloudBase environment, a database collection, and a cloud function.

### 1. Create a Tencent CloudBase Environment

- Go to the [Tencent CloudBase Console](https://console.cloud.tencent.com/tcb/env/index).
- Create a new environment. Choose the **Pay-As-You-Go** plan (it has a generous free tier).
- Once the environment is created, copy the **Environment ID**.

### 2. Configure the Application

- Open the `tcbConfig.ts` file in the project.
- Replace the placeholder `"YOUR_TCB_ENVIRONMENT_ID"` with the Environment ID you copied.

### 3. Set Up the Database

- In your CloudBase environment console, navigate to **Database**.
- Click **Create Collection** and name it `notes`.
- You don't need to set any specific permissions; the default settings are fine for this app.

### 4. Set Up the AI Cloud Function

This is the most critical step. The app uses a cloud function to securely call the Hunyuan AI API.

- In your CloudBase environment console, navigate to **Functions**.
- Click **Create Function**.
- **Function Name**: `hunyuan`
- **Runtime Environment**: `Node.js 16` (or a recent version)
- Click **Next**. Leave the function code empty for now and click **Done**.

- Once the function is created, go to its details page:
    - **A. Function Code**:
        - Copy the entire content of the `cloudfunctions/hunyuan/index.js` file from this project.
        - Paste it into the `index.js` file in the code editor in the console.
        - Click **Save and Install Dependencies**.
    - **B. Dependencies**:
        - Go to the `package.json` tab for the function.
        - Add the following dependency:
          ```json
          {
            "dependencies": {
              "tencentcloud-sdk-nodejs": "^4.0.819"
            }
          }
          ```
        - Click **Save and Install Dependencies**. This will automatically install the required SDK. `@cloudbase/node-sdk` is included by default.
    - **C. Environment Variables (Very Important!)**:
        - Go to the **Function Configuration** tab and click **Edit**.
        - Scroll down to the **Environment Variables** section.
        - You need to provide your Tencent Cloud API keys to allow the function to call the AI service. Get your keys from [Tencent Cloud API Key Management](https://console.cloud.tencent.com/cam/capi).
        - Add two variables:
            - `TENCENT_SECRET_ID`: Your Secret ID (e.g., `AKID...`)
            - `TENCENT_SECRET_KEY`: Your Secret Key
        - Click **Save**.

### 5. Run Locally

**Prerequisites:** Node.js

1.  Install dependencies:
    `npm install`
2.  Run the app:
    `npm run dev`

Your Play Board should now be running locally, connected to your Tencent CloudBase backend!
