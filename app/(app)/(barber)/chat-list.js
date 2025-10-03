import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator, Button, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { auth } from '@/services/firebase';
import { getFirestore, collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { app } from '@/services/firebase';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { StyleSheet } from 'react-native';

const db = getFirestore(app);

const QuickIssueButton = ({ screen, userEmail }) => (
  <TouchableOpacity 
    onPress={() => {
      const subject = `Bug Report: ${screen}`;
      const body = `Hi Joseph,

I found an issue in the Chat List.

Screen: ${screen}
Barber: ${userEmail}

What happened:
[Describe the chat list issue]

Steps to reproduce:
1. 
2. 
3. 

Expected result:
[What should have happened]

Actual result:
[What actually happened]

Thanks!`;

      const encodedSubject = encodeURIComponent(subject);
      const encodedBody = encodeURIComponent(body);
      const mailtoURL = `mailto:joseph@wedotime.com?subject=${encodedSubject}&body=${encodedBody}`;
      
      Linking.openURL(mailtoURL);
    }}
    style={styles.quickReport}
  >
    <Ionicons name="flag-outline" size={16} color="#ff6b6b" />
    <Text style={styles.quickReportText}>Report Issue</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  quickReport: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 5,
    elevation: 2,
    position: 'absolute',
    bottom: 30,
    right: 20,
  },
  quickReportText: {
    marginLeft: 5,
    color: '#ff6b6b',
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#000',
  },
  chatName: {
    fontSize: 20,
    fontWeight: '900',
    color: '#000',
  },
  chatPreview: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },
  chatTimestamp: {
    fontSize: 14,
    fontWeight: '700',
    color: '#444',
  },
  unreadBadgeText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#fff',
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#000',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  previousChatsButton: {
    padding: 16,
    backgroundColor: '#007bff',
    borderRadius: 5,
    margin: 20,
    alignItems: 'center',
  },
  previousChatsText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default function ChatListScreen() {
  const router = useRouter();
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState({});

  useEffect(() => {
    const fetchThreads = async () => {
      try {
        const currentBarberId = auth.currentUser?.uid;
        if (!currentBarberId) {
          console.log('No user ID found');
          return;
        }

        console.log('Fetching chat threads for user:', currentBarberId);
        
        // Fixed query - participants is stored as map {userId: true}, not array
        const threadsRef = collection(db, 'chatThreads');
        const q = query(
          threadsRef,
          where(`participants.${currentBarberId}`, '==', true)
        );
        
        const snapshot = await getDocs(q);
        console.log(`Found ${snapshot.docs.length} chat threads`);
        
        const threadsData = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
          };
        });
        
        setThreads(threadsData);
        
        // Fetch user info for all participants
        const userIds = new Set();
        threadsData.forEach(thread => {
          if (thread.participants) {
            Object.keys(thread.participants).forEach(uid => {
              if (uid !== currentBarberId) {
                userIds.add(uid);
              }
            });
          }
        });
        
        const userInfo = {};
        for (const uid of userIds) {
          try {
            const userDoc = await getDoc(doc(db, 'users', uid));
            if (userDoc.exists()) {
              userInfo[uid] = userDoc.data();
            }
          } catch (err) {
            console.error(`Error fetching user ${uid}:`, err);
          }
        }
        
        setUsers(userInfo);
      } catch (error) {
        console.error('Error fetching chat threads:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchThreads();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <Text style={[styles.headerTitle, { margin: 20 }]}>CHATS</Text>
      {/* Replace Button with a bold, styled touchable title */}
      <TouchableOpacity
        onPress={() => router.push('/(app)/(barber)/network')}
        style={styles.previousChatsButton}
        accessibilityRole="button"
      >
        <Text style={styles.previousChatsText}>PREVIOUS BARBER CHATS</Text>
      </TouchableOpacity>
      <FlatList
        data={threads}
        keyExtractor={item => item.id}
        renderItem={({ item }) => {
          // Find the other barber's ID
          const otherBarberIds = Object.keys(item.participants || {})
            .filter(id => id !== auth.currentUser?.uid);
          const otherBarberId = otherBarberIds[0] || '';
          const otherBarber = users[otherBarberId];

          return (
            <TouchableOpacity
              style={{
                padding: 16,
                borderBottomWidth: 1,
                borderBottomColor: '#eee',
              }}
              onPress={() =>
                router.push({
                  pathname: '/(app)/(barber)/chat',
                  params: { threadId: item.id },
                })
              }
            >
              <Text style={styles.chatName}>
                {otherBarber?.displayName || 
                 otherBarber?.name || 
                 (otherBarberId ? otherBarberId.substring(0, 8) : 'Chat')}
              </Text>
              <Text style={styles.chatPreview} numberOfLines={1}>
                {item.lastMessage || 'No messages yet'}
              </Text>
              <Text style={styles.chatTimestamp}>
                {item.lastMessageTime 
                  ? new Date(item.lastMessageTime.seconds * 1000).toLocaleString()
                  : ''}
              </Text>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={{ padding: 20, alignItems: 'center' }}>
            <Text style={styles.emptyTitle}>
              No chats yet. Connect with other barbers to start chatting!
            </Text>
            <Button 
              title="Find Barbers"
              onPress={() => router.push('/(app)/(barber)/network')}
            />
          </View>
        }
      />
      {/* Debug button removed */}
    </View>
  );
}

