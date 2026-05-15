# Parts Seekr - Project Setup Guide

This guide will help you set up and run the Parts Seekr project on your local machine (Windows or Mac).

## Prerequisites

Before starting, ensure you have the following installed:

1.  **Node.js (v18 or newer)**: [Download from nodejs.org](https://nodejs.org/)
2.  **Git**: [Download from git-scm.com](https://git-scm.com/) (Optional, but recommended)
3.  **A Database**:
    *   Connected with supabase and the necessary credentials are in .env file

---

## 1. Extract the Project

1.  Extract the `PartsSeekr-Project.zip` file to a folder of your choice.
2.  Open your terminal (Command Prompt/PowerShell on Windows, or Terminal on Mac).
3.  Navigate to the project folder:
    ```bash
    cd path/to/extracted/folder
    ```

## 2. Install Dependencies

Run the following command to install all necessary packages:

```bash
npm install
```

## 3. Environment Configuration

The project includes a `.env` file with the current configuration. If you need to update any keys (e.g., eBay credentials, Database URL, or Supabase keys), edit this file.

Key variables to check:
*   `DATABASE_URL`: Your PostgreSQL connection string.
*   `EBAY_CLIENT_ID` / `EBAY_CLIENT_SECRET`: Your eBay API credentials.
*   `SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase project details.


## 5. Running the Application

### Development Mode (Recommended for testing)
To start the app with live-reloading:
```bash
npm run dev
```
The app will be available at: **http://localhost:3000**

### Production Build
To test the optimized production version:
```bash
npm run build
npm run start
```

---

## Troubleshooting

*   **Node Version**: If you encounter errors during `npm install`, double-check that your Node.js version is 18.x or higher (`node -v`).
*   **eBay Search**: If eBay results don't appear, ensure your `EBAY_CLIENT_ID` and `SECRET` are valid and have not expired.

---
*Support: If you have any questions during setup, please contact Farhan.*
