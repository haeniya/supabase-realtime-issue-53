# Prerequisites

- You need a Supabase table called "test_messages" with the following fields: id, created_at, content (text), user_id (uuid)
- You need 2 standard RLS policies for the test_messages table:
  - Enable insert for authenticated users only
  - Enable users to view their own data only
- You need a user signed up with email & password

# Instructions

- Put your Supabase key and the project URL in /lib/supabase.ts
- Put the email and password of your user into App.js
- Install dependencies with `npm install`
- Create Expo development build (https://docs.expo.dev/build/setup/)
- Start the app on iOS or Android emulator with `npm start`
- Click Login
- Send messages, this should work as expected and you should see the new messages in the list.
- Send app to background
- Wait 1 minute
- Reopen the app
- In the app, you should still be logged in but when sending new messages, they won't appear in the list. Although they are stored in the database.

Video on YouTube: https://youtube.com/shorts/FXduFr-rqVc?feature=share
