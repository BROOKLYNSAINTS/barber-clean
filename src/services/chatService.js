import { db } from './firebase';
import { 
  collection, query, where, getDocs, doc, setDoc, serverTimestamp 
} from 'firebase/firestore';

export const startOrGetChatThread = async (userId1, userId2) => {
  try {
    console.log(`Starting or getting chat thread between ${userId1} and ${userId2}`);
    
    // Check for existing thread
    const chatThreadsRef = collection(db, 'chatThreads');
    
    // We need to check if thread exists with these participants
    const q1 = query(chatThreadsRef, where(`participants.${userId1}`, '==', true));
    const snap = await getDocs(q1);
    for (const d of snap.docs) {
      const data = d.data();
      if (data?.participants?.[userId2]) return d.id;
    }

    // Create new thread with both users as participants
    console.log('Creating new chat thread');
    
    // Format participants as object with user IDs as keys
    const participants = {
      [userId1]: true,
      [userId2]: true
    };
    
    // Create new thread
    const newRef = doc(collection(db, 'chatThreads'));
    await setDoc(newRef, {
      participants,
      createdAt: serverTimestamp(),
      lastMessage: '',
      lastMessageTimestamp: serverTimestamp(),
    });
    
    console.log('Created thread with ID:', newRef.id);
    return newRef.id;
  } catch (error) {
    console.error('Error starting or fetching chat thread:', error);
    throw error;
  }
};

export const sendMessage = async (threadId, senderId, text) => {
  try {
    // Add message to thread
    const messagesRef = collection(db, 'chatThreads', threadId, 'messages');
    await addDoc(messagesRef, {
      senderId,
      text,
      createdAt: serverTimestamp()
    });
    
    // Update thread with last message
    const threadRef = doc(db, 'chatThreads', threadId);
    await updateDoc(threadRef, {
      lastMessage: text,
      lastMessageTimestamp: serverTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

export const markThreadAsRead = async (threadId, userId) => {
  try {
    const threadRef = doc(db, 'chatThreads', threadId);
    await updateDoc(threadRef, {
      [`unreadCount.${userId}`]: 0
    });
    return true;
  } catch (error) {
    console.error('Error marking thread as read:', error);
    throw error;
  }
};
