# Google Drive Backup — Developer Setup Guide

This POS application includes a production-ready Google Drive cloud backup system. End users simply click "Connect Google Drive" and sign in with their Gmail — no technical knowledge required.

However, **you (the developer/shop owner) must configure Google OAuth credentials ONCE** before distributing the app. Here's how:

## Step 1: Create a Google Cloud Project

1. Go to https://console.cloud.google.com/
2. Click the project dropdown → "New Project"
3. Name it "Shop POS System" → Create

## Step 2: Enable Google Drive API

1. In the project, go to "APIs & Services" → "Library"
2. Search for "Google Drive API"
3. Click it → "Enable"

## Step 3: Configure OAuth Consent Screen

1. Go to "APIs & Services" → "OAuth consent screen"
2. Choose "External" → Create
3. Fill in:
   - App name: "Shop POS System"
   - User support email: your email
   - Developer contact: your email
4. Save → Add Scope → select `drive.file` (View and manage Google Drive files you created)
5. Add yourself as a Test User (your Gmail)
6. Save

## Step 4: Create OAuth Client ID

1. Go to "APIs & Services" → "Credentials"
2. "Create Credentials" → "OAuth client ID"
3. Application type: **Desktop app**
4. Name: "Shop POS Desktop"
5. Create → copy the **Client ID** and **Client Secret**

## Step 5: Configure the App

Open `google-oauth.config.json` and replace the placeholders:

```json
{
  "clientId": "123456789-xxxxx.apps.googleusercontent.com",
  "clientSecret": "GOCSPX-xxxxxxxxxxxxxx",
  "redirectUri": "http://localhost:4784",
  "scopes": ["https://www.googleapis.com/auth/drive.file"],
  "backupFolderName": "POS Backups",
  "backupScheduleHours": 4
}
```

## Step 6: Rebuild

Run the build process again. The app now has the OAuth credentials embedded.

## How It Works (End User Experience)

1. User opens Settings → Cloud Backup
2. Clicks "Connect Google Drive"
3. Google login window opens
4. User signs in with Gmail → grants permission
5. App creates "POS Backups" folder in their Drive
6. Done! Backups auto-upload every 4 hours

## Security

- OAuth Client ID/Secret are embedded in the app config (not visible to end users in the UI)
- Access + refresh tokens are encrypted using OS-level encryption (Windows DPAPI, macOS Keychain)
- Only `drive.file` scope is requested (app can only access files it creates)
- User can disconnect at any time → tokens are deleted
