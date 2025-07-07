import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TextInput, Button, ScrollView, AppState } from 'react-native';
import { supabase } from './lib/supabase';

export default function App() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [session, setSession] = useState();
  const appState = useRef(AppState.currentState);

  const signInWithEmailAndPassword = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: process.env.EXPO_PUBLIC_SUPABASE_EMAIL,
      password: process.env.EXPO_PUBLIC_SUPABASE_PASSWORD,
    });
    if (error) throw new Error(error.message);
    return data;
  };

  const signOut = () => {
    supabase.auth.signOut();
  };

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
    });

    // Fetch existing messages
    fetchMessages();

    return () => {
      data.subscription.unsubscribe();
    };
  }, []);

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

  useEffect(() => {
    if (!session) return;
    const initChannel = async () => {
      console.log(session);
      await supabase.realtime.setAuth(); // Needed for Realtime Authorization

      const channel = supabase
        .channel(`topic:messages`, {
          config: { private: true },
        })
        .on('broadcast', { event: 'INSERT' }, (payload) => {
          console.log('new message received!', payload);
          setMessages((current) => [...current, payload.payload.record]);
        })
        .on('broadcast', { event: 'UPDATE' }, (payload) => console.log(payload))
        .on('broadcast', { event: 'DELETE' }, (payload) => console.log(payload))
        .subscribe();

      // store channel to remove later
      cleanupChannel = channel;
    };

    let cleanupChannel;

    initChannel();

    return () => {
      if (cleanupChannel) {
        supabase.removeChannel(cleanupChannel);
      }
    };

    /*
    supabase.realtime.setAuth(session.access_token);
    const channel = supabase
      .channel('messages_test')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'test_messages',
        },
        (payload) => {
          console.log('new message received!');
          setMessages((current) => [...current, payload.new]);
        }
      )
      .subscribe();
    

    return () => {
      supabase.removeChannel(channel);
    };*/
  }, [session]);

  const fetchMessages = async () => {
    const { data, error } = await supabase.from('test_messages').select('*').order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
    } else {
      setMessages(data);
    }
  };

  const sendMessage = async () => {
    if (newMessage.trim().length === 0) return;

    const { error } = await supabase
      .from('test_messages')
      .insert([{ content: newMessage, user_id: session?.user?.id }]);

    if (error) {
      console.error('Error sending message:', error);
    } else {
      setNewMessage('');
    }
  };

  return (
    <View style={styles.container}>
      {!!session ? (
        <>
          <Button title="Sign out" onPress={signOut} />
          <ScrollView style={styles.messagesContainer}>
            {messages.map((message) => (
              <View key={message.id} style={styles.messageBox}>
                <Text style={styles.messageText}>{message.content}</Text>
              </View>
            ))}
          </ScrollView>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={newMessage}
              onChangeText={setNewMessage}
              placeholder="Type a message..."
            />
            <Button title="Send" onPress={sendMessage} />
          </View>
        </>
      ) : (
        <Button title="Login" onPress={signInWithEmailAndPassword} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 50,
    maxHeight: '80%',
  },
  messagesContainer: {
    flex: 1,
    padding: 10,
  },
  messageBox: {
    backgroundColor: '#e6e6e6',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  messageText: {
    fontSize: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#e6e6e6',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e6e6e6',
    borderRadius: 5,
    padding: 10,
    marginRight: 10,
  },
});
