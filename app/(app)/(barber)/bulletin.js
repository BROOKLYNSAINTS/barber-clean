import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Modal,
  Alert, KeyboardAvoidingView, Platform, Keyboard,
  TouchableWithoutFeedback, ScrollView, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import {
  getBulletinPosts,
  createBulletinPost,
  auth,
  getUserProfile,
  addCommentToPost,
} from '@/services/firebase';
import { getDocs, collection, query, orderBy } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'; // Add this import

function BulletinPost({ item, commentValue, onCommentChange, onCommentSend }) {
  const [comments, setComments] = React.useState([]);
  const [loadingComments, setLoadingComments] = React.useState(true);

  React.useEffect(() => {
    const fetchComments = async () => {
      try {
        const q = query(collection(db, 'bulletins', item.id, 'comments'), orderBy('createdAt', 'asc'));
        const snapshot = await getDocs(q);
        const commentData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setComments(commentData);
      } catch (err) {
        console.error('Error loading comments:', err);
      } finally {
        setLoadingComments(false);
      }
    };
    fetchComments();
  }, [item.id]);

  return (
    <View style={styles.postCard}>
      <View style={styles.postHeader}>
        <Text style={styles.postTitle}>{item.title}</Text>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{item.category}</Text>
        </View>
      </View>
      <Text style={styles.postMeta}>By {item.authorName} • {new Date(item.createdAt).toLocaleDateString()}</Text>
      <ScrollView style={styles.postScroll}>
        <Text style={styles.postContent}>{item.content}</Text>
      </ScrollView>
      
      {loadingComments ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000" />
          <Text style={styles.loadingText}>Loading comments...</Text>
        </View>
      ) : comments.length > 0 ? (
        <View style={styles.commentSection}>
          <Text style={styles.commentSectionTitle}>COMMENTS ({comments.length})</Text>
          {comments.map((comment) => {
            // Handle different comment data structures
            const isMap =
              comment.text &&
              typeof comment.text === 'object' &&
              comment.text.text !== undefined &&
              comment.text.authorName !== undefined &&
              comment.text.createdAt !== undefined;

            const authorName = isMap
              ? comment.text.authorName || 'Unknown'
              : comment.authorName || 'Unknown';

            const text = isMap
              ? comment.text.text
              : typeof comment.text === 'string'
                ? comment.text
                : '';

            const createdAt = isMap
              ? comment.text.createdAt
              : comment.createdAt;

            return (
              <View key={comment.id} style={styles.commentContainer}>
                <Text style={styles.commentAuthor}>{authorName}</Text>
                <Text style={styles.commentText}>{text}</Text>
                <Text style={styles.commentTimestamp}>
                  {createdAt ? new Date(createdAt).toLocaleString() : ''}
                </Text>
              </View>
            );
          })}
        </View>
      ) : (
        <Text style={styles.noComments}>No comments yet. Be the first to comment!</Text>
      )}
      
      <View style={styles.commentBox}>
        <TextInput
          placeholder="Add a comment..."
          value={commentValue}
          onChangeText={onCommentChange}
          style={styles.commentInput}
          multiline
        />
        <TouchableOpacity onPress={onCommentSend} style={styles.sendButton}>
          <Ionicons name="send" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function BarberBulletinScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets(); // Add this hook
  const [posts, setPosts] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [profile, setProfile] = useState(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('general');
  const [loading, setLoading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [commentInputs, setCommentInputs] = useState({});

  const categories = [
    { id: 'general', name: 'General', icon: '💬' },
    { id: 'question', name: 'Question', icon: '❓' },
    { id: 'event', name: 'Event', icon: '📅' },
    { id: 'tip', name: 'Tip', icon: '💡' },
    { id: 'job', name: 'Job', icon: '💼' },
  ];

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      const user = auth.currentUser;
      if (!user) {
        router.push('/(auth)/login');
        return;
      }
      const profileData = await getUserProfile(user.uid);
      const postData = await getBulletinPosts();
      postData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setProfile(profileData);
      setPosts(postData);
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to fetch bulletin posts.');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useFocusEffect(useCallback(() => {
    fetchPosts();
  }, [fetchPosts]));

  const handlePost = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert('Missing Info', 'Please enter both a title and content.');
      return;
    }

    try {
      setPosting(true);
      const user = auth.currentUser;
      await createBulletinPost({
        title,
        content,
        category,
        authorId: user.uid,
        authorName: profile?.name || 'Unknown',
        createdAt: new Date().toISOString(),
      });
      setTitle('');
      setContent('');
      setCategory('general');
      setModalVisible(false);
      fetchPosts();
      Alert.alert('Success', 'Post created successfully!');
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to post.');
    } finally {
      setPosting(false);
    }
  };

  const handleComment = async (postId) => {
    const text = commentInputs[postId]?.trim();
    if (!text) return;

    try {
      const user = auth.currentUser;
      const userProfile = await getUserProfile(user.uid);
      await addCommentToPost(postId, {
        text,
        authorId: user.uid,
        authorName: userProfile?.name || 'Unknown',
        createdAt: new Date().toISOString(),
      });
      setCommentInputs((prev) => ({ ...prev, [postId]: '' }));
      fetchPosts();
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to post comment.');
    }
  };

  const renderPost = ({ item }) => (
    <BulletinPost
      item={item}
      commentValue={commentInputs[item.id] || ''}
      onCommentChange={(text) => setCommentInputs((prev) => ({ ...prev, [item.id]: text }))}
      onCommentSend={() => handleComment(item.id)}
    />
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color="#000" />
        <Text style={styles.loadingText}>LOADING BULLETIN...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={[styles.header, { paddingTop: insets.top > 0 ? 0 : 20 }]}>
          <Text style={styles.headerTitle}>BARBER BULLETIN</Text>
          <Text style={styles.headerSubtitle}>Connect with fellow barbers</Text>
        </View>

        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          renderItem={renderPost}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="chatbubbles-outline" size={64} color="#000" />
              <Text style={styles.emptyTitle}>NO POSTS YET</Text>
              <Text style={styles.emptyText}>Be the first to start a conversation!</Text>
            </View>
          }
        />

        <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
          <Ionicons name="add" size={32} color="#fff" />
        </TouchableOpacity>

        <Modal visible={modalVisible} transparent animationType="slide">
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalOverlay}>
              <KeyboardAvoidingView
                style={styles.modalContainer}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              >
                <View style={styles.modal}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>✍️ Create New Post</Text>
                    <TouchableOpacity onPress={() => setModalVisible(false)}>
                      <Ionicons name="close" size={24} color="#666" />
                    </TouchableOpacity>
                  </View>

                  <TextInput
                    placeholder="What's the title of your post?"
                    style={styles.input}
                    value={title}
                    onChangeText={setTitle}
                  />
                  <TextInput
                    placeholder="Share your thoughts, tips, or questions..."
                    style={[styles.input, styles.contentInput]}
                    value={content}
                    onChangeText={setContent}
                    multiline
                    textAlignVertical="top"
                  />

                  <Text style={styles.categoryLabel}>Choose a category:</Text>
                  <View style={styles.categoryRow}>
                    {categories.map((cat) => (
                      <TouchableOpacity
                        key={cat.id}
                        style={[
                          styles.category,
                          category === cat.id && styles.categorySelected,
                        ]}
                        onPress={() => setCategory(cat.id)}
                      >
                        <Text style={styles.categoryIcon}>{cat.icon}</Text>
                        <Text
                          style={[
                            styles.categoryText,
                            category === cat.id && styles.categoryTextSelected,
                          ]}
                        >
                          {cat.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <TouchableOpacity
                    style={[styles.postButton, posting && styles.postButtonDisabled]}
                    onPress={handlePost}
                    disabled={posting}
                  >
                    <Text style={styles.postButtonText}>
                      {posting ? 'Posting...' : 'Share Post'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </KeyboardAvoidingView>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f0f0f0' 
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  header: {
    backgroundColor: '#000',
    padding: 20,
    borderBottomWidth: 0,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginTop: 4,
  },
  list: { 
    padding: 16,
    paddingBottom: 100,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#000',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginTop: 8,
    textAlign: 'center',
  },
  postCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 2,
    borderColor: '#000',
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  postTitle: { 
    fontWeight: '900', 
    fontSize: 20, 
    color: '#000',
    flex: 1,
    marginRight: 12,
  },
  categoryBadge: {
    backgroundColor: '#000',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '800',
  },
  postMeta: { 
    fontSize: 14, 
    color: '#444', 
    marginBottom: 12,
    fontWeight: '600',
  },
  postScroll: {
    maxHeight: 120,
    marginBottom: 16,
  },
  postContent: { 
    fontSize: 16, 
    color: '#000',
    lineHeight: 22,
    fontWeight: '500',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  loadingText: { 
    fontSize: 18, 
    color: '#000',
    marginLeft: 8,
    fontWeight: '800',
  },
  noComments: { 
    fontSize: 16, 
    color: '#000',
    textAlign: 'center',
    paddingVertical: 12,
    fontWeight: '600',
  },
  commentSectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#000',
    marginBottom: 12,
  },
  commentSection: { 
    marginTop: 12, 
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 2,
    borderTopColor: '#000',
  },
  commentContainer: {
    marginBottom: 10,
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#000',
  },
  commentAuthor: {
    fontWeight: '900',
    fontSize: 16,
    color: '#000',
    marginBottom: 4,
  },
  commentText: {
    fontSize: 15,
    color: '#000',
    marginBottom: 6,
    fontWeight: '500',
  },
  commentTimestamp: {
    fontSize: 12,
    color: '#444',
    fontWeight: '600',
  },
  commentBox: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#000',
  },
  commentInput: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#000',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#fff',
    marginRight: 8,
    maxHeight: 80,
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: '#000',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 30,
    backgroundColor: '#000',
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '90%',
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderRightWidth: 3,
    borderColor: '#000',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#000',
  },
  input: {
    borderWidth: 2,
    borderColor: '#000',
    padding: 14,
    borderRadius: 8,
    marginBottom: 16,
    backgroundColor: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  contentInput: {
    height: 120,
    textAlignVertical: 'top',
  },
  categoryLabel: {
    fontSize: 18,
    fontWeight: '800',
    color: '#000',
    marginBottom: 12,
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  category: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#000',
  },
  categorySelected: {
    backgroundColor: '#000',
  },
  categoryIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  categoryTextSelected: {
    color: '#fff',
    fontWeight: '800',
  },
  postButton: {
    backgroundColor: '#000',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  postButtonDisabled: {
    backgroundColor: '#666',
  },
  postButtonText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 18,
  },
});
