# Prerequisites

- You need a Supabase table called "test_messages" with the following fields: id, created_at, content (text), user_id (uuid)
- You need 2 standard RLS policies for the test_messages table:
  - Enable insert for authenticated users only
  - Enable users to view their own data only
- You need a user signed up with email & password

# Instructions

- Create a .env file in the root of the project with the following ENV vars:
  - `EXPO_PUBLIC_SUPABASE_PROJECT_URL=YOUR_PROJECT_URL`
  - `EXPO_PUBLIC_SUPABASE_TOKEN=YOUR_ANON_TOKEN`
  - `EXPO_PUBLIC_SUPABASE_EMAIL=YOUR_USER_EMAIL`
  - `EXPO_PUBLIC_SUPABASE_PASSWORD=YOUR_USER_PW`
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

# Broadcasting

I also tried using Broadcasting and ran the following statements to set everything up:

```
create policy "Authenticated users can receive broadcasts"
on "realtime"."messages"
for select
to authenticated
using ( true );



create or replace function public.message_changes()
returns trigger
security definer
language plpgsql
as $$
begin
  perform realtime.broadcast_changes(
    'topic:messages',                                  -- topic - the topic to which we're broadcasting
    TG_OP,                                             -- event - the event that triggered the function
    TG_OP,                                             -- operation - the operation that triggered the function
    TG_TABLE_NAME,                                     -- table - the table that caused the trigger
    TG_TABLE_SCHEMA,                                   -- schema - the schema of the table that caused the trigger
    NEW,                                               -- new record - the record after the change
    OLD                                                -- old record - the record before the change
  );
  return null;
end;
$$;


create trigger handle_message_changes
after insert or update or delete
on public.test_messages
for each row
execute function message_changes ();
```

The issue is exactly the same.

I also tried reacting on the app coming to the foreground again like this:

```
useEffect(() => {
  const subscription = AppState.addEventListener('change', async (nextAppState) => {
    if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
      console.log('app in foreground again');
      await supabase.realtime.setAuth();
      fetchMessages();
    }
    appState.current = nextAppState;
  });

  return () => {
    subscription.remove();
  };
}, [session]);
```

I thought maybe doing await supabase.realtime.setAuth(); again solves the issue but this doesn't help either.
