import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Modal,
  Alert, KeyboardAvoidingView, Platform, Keyboard,
  TouchableWithoutFeedback, ScrollView,
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
      <Text style={styles.postTitle}>{item.title}</Text>
      <Text style={styles.postMeta}>{item.category} • {item.authorName}</Text>
      <ScrollView style={styles.postScroll}>
        <Text style={styles.postContent}>{item.content}</Text>
      </ScrollView>
      {loadingComments ? (
        <Text style={styles.loadingText}>Loading comments...</Text>
      ) : comments.length > 0 ? (
        <View style={styles.commentSection}>
<View style={styles.commentSection}>
  {comments.map((comment) => {
    // If comment.text is a MAP/object with the expected fields, use them
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
        <Text style={styles.commentAuthor}>
          {authorName}:
        </Text>
        <Text style={styles.commentText}>
          {text}
        </Text>
        <Text style={styles.commentTimestamp}>
          {createdAt ? new Date(createdAt).toLocaleString() : ''}
        </Text>
      </View>
    );
  })}
</View>
        </View>
      ) : (
        <Text style={styles.noComments}>No comments yet.</Text>
      )}
      <View style={styles.commentBox}>
        <TextInput
          placeholder="Add a comment..."
          value={commentValue}
          onChangeText={onCommentChange}
          style={styles.commentInput}
        />
        <TouchableOpacity onPress={onCommentSend}>
          <Ionicons name="send" size={22} color="#007BFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
  
}

export default function BarberBulletinScreen() {
  const router = useRouter();
  const [posts, setPosts] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [profile, setProfile] = useState(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('general');
  const [loading, setLoading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [commentInputs, setCommentInputs] = useState({});

  const categories = ['general', 'question', 'event', 'tip', 'job'];

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      const user = auth.currentUser;
      if (!user) {
        router.replace('/(auth)/login');
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

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={styles.container}>
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          renderItem={renderPost}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>No posts yet</Text>}
        />

        <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>

        <Modal visible={modalVisible} transparent animationType="fade">
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalOverlay}>
              <KeyboardAvoidingView
                style={styles.modalContainer}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              >
                <View style={styles.modal}>
                  <Text style={styles.modalTitle}>Create Bulletin Post</Text>

                  <TextInput
                    placeholder="Title"
                    style={styles.input}
                    value={title}
                    onChangeText={setTitle}
                  />
                  <TextInput
                    placeholder="Content"
                    style={[styles.input, { height: 100 }]}
                    value={content}
                    onChangeText={setContent}
                    multiline
                  />

                  <View style={styles.categoryRow}>
                    {categories.map((cat) => (
                      <TouchableOpacity
                        key={cat}
                        style={[
                          styles.category,
                          category === cat && styles.categorySelected,
                        ]}
                        onPress={() => setCategory(cat)}
                      >
                        <Text
                          style={[
                            styles.categoryText,
                            category === cat && styles.categoryTextSelected,
                          ]}
                        >
                          {cat}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <View style={styles.modalActions}>
                    <TouchableOpacity onPress={() => setModalVisible(false)}>
                      <Text style={styles.cancel}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.postButton}
                      onPress={handlePost}
                      disabled={posting}
                    >
                      <Text style={styles.postButtonText}>
                        {posting ? 'Posting...' : 'Post'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </KeyboardAvoidingView>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  list: { padding: 16 },
  empty: { textAlign: 'center', color: '#888', marginTop: 20 },
  postCard: {
    backgroundColor: '#f9f9f9',
    padding: 14,
    marginBottom: 16,
    borderRadius: 8,
  },
  postScroll: {
    maxHeight: 100,
    marginBottom: 8,
  },
  postTitle: { fontWeight: 'bold', fontSize: 16, marginBottom: 4 },
  postMeta: { fontSize: 12, color: '#666', marginBottom: 4 },
  postContent: { fontSize: 14, color: '#333' },
  loadingText: { fontSize: 12, color: '#888' },
  noComments: { fontSize: 12, color: '#888' },
  commentSection: { marginTop: 8, marginBottom: 4 },
  commentText: { fontSize: 13, color: '#444', marginBottom: 2 },
  commentTimestamp: { fontSize: 11, color: '#888' },
  commentBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 8,
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#fff',
    marginRight: 8,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 30,
    backgroundColor: '#007BFF',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: '#00000088',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 6,
    marginBottom: 10,
    backgroundColor: '#f5f5f5',
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  category: {
    backgroundColor: '#e0e0e0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  categorySelected: {
    backgroundColor: '#007BFF',
  },
  categoryText: {
    fontSize: 13,
    color: '#333',
  },
  categoryTextSelected: {
    color: '#fff',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  cancel: {
    fontSize: 16,
    color: '#007BFF',
    padding: 10,
  },
  postButton: {
    backgroundColor: '#007BFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
  },
  postButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  commentContainer: {
  marginBottom: 6,
  backgroundColor: '#f1f1f1',
  padding: 8,
  borderRadius: 6,
},
commentAuthor: {
  fontWeight: 'bold',
  marginBottom: 2,
},
commentText: {
  color: '#333',
},
commentTimestamp: {
  fontSize: 10,
  color: '#888',
  marginTop: 2,
},
  postCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
});
