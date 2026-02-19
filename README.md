<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1by-0Qj4wCymjFqJM1eo0nCYFbfi9W9Zp

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## iOS app (Capacitor)

The same web app can run as a native iOS app via Capacitor (one codebase, one UI).

**Prerequisites:** Xcode and CocoaPods (for iOS simulator or device).

1. Build the web app and sync to the iOS project:
   `npm run ios`
   (This runs `npm run build`, `npx cap sync ios`, and opens the project in Xcode.)
2. Or step by step: `npm run build`, then `npm run cap:sync`, then open `ios/App/App.xcworkspace` in Xcode.
3. In Xcode, select a simulator or device, configure signing if needed, and run.

Auth session is stored with Capacitor Preferences on iOS and localStorage on web.
