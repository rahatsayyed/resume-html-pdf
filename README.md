# Automated Job Search & Application System

This guide will walk you through the process of setting up an automated job discovery and application system using n8n. No advanced technical skills are required! Follow these steps carefully to get your system up and running.

## Table of Contents
1. [Prerequisites](#1-prerequisites)
2. [Setting Up n8n](#2-setting-up-n8n)
3. [Setting Up Supabase (Database)](#3-setting-up-supabase-database)
4. [Creating External Accounts & API Keys](#4-creating-external-accounts--api-keys)
5. [Importing n8n Workflows](#5-importing-n8n-workflows)
6. [Configuring and Running Workflows](#6-configuring-and-running-workflows)

---

## 1. Prerequisites

Before starting, you need to have **Node.js** installed on your computer. 
- **[Download and Install Node.js](https://nodejs.org/en/download/)**: Choose the recommended version for your operating system and follow the standard installation setup.

---

## 2. Setting Up n8n

[n8n](https://n8n.io/) is a free and open-source workflow automation tool. We will run it locally on your machine. For more details on n8n, check out the [official n8n documentation](https://docs.n8n.io/).

**Step 2.1: Clone the Repository**
Open your terminal (Command Prompt on Windows, or Terminal on Mac/Linux) and run:
```bash
git clone https://github.com/rahatsayyed/resume-html-pdf.git
cd resume-html-pdf
```

**Step 2.2: Configure Environment Variables**
For n8n to work correctly with local files, you need to add some configurations to your terminal profile (like `.bashrc`, `.zshrc`, or `.bash_profile` on Mac/Linux).
Open your terminal profile file and add these lines at the end:

```bash
# n8n Local Settings
export NODES_EXCLUDE="[]"
export N8N_PROXY_HOPS=1
export N8N_BLOCK_FILE_ACCESS_TO_N8N_FILES=false
export N8N_RESTRICT_FILE_ACCESS_TO="/Users/copods/Documents/Projects/personal/"
```
*Note: Restart your terminal after saving the file for the changes to take effect.*

**Step 2.3: Install and Start n8n**
In your terminal, run the following commands to install and launch n8n:
```bash
npm install -g n8n
n8n start
```
Once it starts, n8n will be available in your internet browser at [http://localhost:5678](http://localhost:5678).

---

## 3. Setting Up Supabase (Database)

We use Supabase as our database to store job listings and contacts.

1. Create a free account at **[Supabase](https://supabase.com/)**.
2. Click **New Project** and follow the prompts.
3. Once the project is ready, go to **Project Settings -> API**.
4. Copy the **Project URL** and the **Service Role Key** (make sure it's the `service_role` secret, not the public one). Store these safely.
5. In the Supabase left sidebar, click on **SQL Editor**.
6. Open the file `sql/jobs-contacts-schema.sql` from the repository folder you downloaded.
7. Copy all the text from that file, paste it into the Supabase SQL Editor, and click **Run** to create the necessary database tables automatically.

---

## 4. Creating External Accounts & API Keys

You will need a few free accounts to make the automation work smoothly. Create these accounts and save their respective keys/tokens safely:

*   **Apify (For Web Scraping):**
    *   Create an account at [Apify](https://apify.com/).
    *   Go to **Settings -> Integrations** and copy your **API Token**.
    *   *(Note: The free tier allows about 10 runs. For heavier usage, a $29/mo plan is required).*
*   **Google Cloud Platform (GCP):**
    *   Create an account at [Google Cloud](https://console.cloud.google.com/).
    *   Create a new project and copy the **Project ID**.
    *   Generate and download a **Service Account Key** (this will download as a JSON file).
*   **Google AI Studio (Gemini AI):**
    *   Get an API Key from [Google AI Studio](https://aistudio.google.com/).
    *   *Recommendation: Use the model `gemini-1.5-pro` (or latest) for better rate limits and performance.*
*   **Telegram Bot (For Notifications):**
    *   Open Telegram on your phone or computer and search for the `BotFather`.
    *   Send the message `/newbot`, follow the instructions to name your bot, and copy the **HTTP Bot Token**.

---

## 5. Importing n8n Workflows

1. Open n8n in your browser at [http://localhost:5678](http://localhost:5678).
2. In the n8n dashboard, go to **Workflows**.
3. You will find 5 workflow files inside the `n8n-workflows` folder of your cloned repository.
4. For each workflow, click the **Import from File...** (or Import from URL) option in the n8n menu. Import all 5 workflows one by one.

---

## 6. Configuring and Running Workflows

Now you need to connect the workflows to the accounts you created earlier.

**Step 6.1: Add Credentials**
Depending on the workflow, you will see warning icons on nodes that require credentials (like Supabase, Apify, Gmail, and Telegram).
*   Click on each node.
*   Select **Create New Credential** and paste the specific API keys and tokens you gathered in Steps 3 & 4.
*   Save the credential.

**Step 6.2: Customize Job Search**
*   Open the workflow named **`A_Jobs Discovery`** (originally `n8n-workflows/A_ Jobs Discovery.json`).
*   Click on the **Apify** node.
*   Update the search query parameters to match the specific jobs you are searching for (e.g., job title, location).

**Step 6.3: Activate Workflows**
*   In each of the 5 workflows, review and set up the **Trigger timing** (e.g., setting it to run every day at 9 AM).
*   Toggle the switch at the top right of the screen from Inactive to **Active** to publish and start the automation.

Congratulations! Your automated job search and application system is now live.
