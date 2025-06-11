import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useAuth } from '../../../src/contexts/AuthContext';
import { getFirestore, collection, getDocs, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import { app } from '../../../src/services/firebase';
import moment from 'moment';

const db = getFirestore(app);

export default function NotificationScreen() {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!currentUser?.uid) return;

      try {
        const q = query(
          collection(db, 'users', currentUser.uid, 'notifications'),
          orderBy('timestamp', 'desc')
        );
        const snapshot = await getDocs(q);
        const list = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setNotifications(list);
        console.log('📬 Notifications fetched:', list.map(n => ({
        id: n.id,
        title: n.title,
        timestamp: n.timestamp?.toDate?.()
})));

      } catch (error) {
        console.error('Error fetching notifications:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [currentUser]);

  const markAsRead = async (id) => {
    try {
      const notifRef = doc(db, 'users', currentUser.uid, 'notifications', id);
      await updateDoc(notifRef, { read: true });
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
        <Text>Loading notifications...</Text>
      </View>
    );
  }

  if (notifications.length === 0) {

    return (
      <View style={styles.centered}>
        <Text>No notifications yet.</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={notifications}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.container}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={[styles.notification, !item.read && styles.unread]}
          onPress={() => markAsRead(item.id)}
        >
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.body}>{item.body}</Text>
          <Text style={styles.timestamp}>
            {moment(item.timestamp?.toDate()).fromNow()}
          </Text>
        </TouchableOpacity>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notification: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  unread: {
    backgroundColor: '#e8f0ff',
    borderColor: '#4285f4',
  },
  title: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  body: {
    marginTop: 4,
    fontSize: 14,
  },
  timestamp: {
    marginTop: 8,
    fontSize: 12,
    color: '#666',
  },
});
