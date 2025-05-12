import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Modal, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getUserProfile, auth, getBulletinPosts, createBulletinPost } from '@/services/firebase'; // Adjusted path
import { useRouter, useFocusEffect } from 'expo-router';

const BarberBulletinScreen = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [posts, setPosts] = useState([]);
  const [profile, setProfile] = useState(null);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postCategory, setPostCategory] = useState('general');
  const [posting, setPosting] = useState(false);

  const fetchProfileAndPosts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const user = auth.currentUser;
      if (!user) {
        router.replace('/(auth)/login');
        setLoading(false);
        return;
      }
      const userProfile = await getUserProfile(user.uid);
      setProfile(userProfile);

      const postsData = await getBulletinPosts();
      postsData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setPosts(postsData);

    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load bulletin board data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [router]);

  useFocusEffect(
    useCallback(() => {
      fetchProfileAndPosts();
    }, [fetchProfileAndPosts])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    fetchProfileAndPosts();
  };

  const handleCreatePost = async () => {
    if (!postTitle.trim() || !postContent.trim()) {
      Alert.alert('Validation Error', 'Please enter both title and content for your post.');
      return;
    }
    if (!profile || !profile.name) {
        Alert.alert('Error', 'User profile not loaded. Cannot create post.');
        return;
    }

    try {
      setPosting(true);
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Authentication Error', 'You must be logged in to create a post.');
        setPosting(false);
        router.replace('/(auth)/login');
        return;
      }
      
      const postData = {
        title: postTitle,
        content: postContent,
        category: postCategory,
        authorId: user.uid,
        authorName: profile.name, // Ensure profile and profile.name are available
        createdAt: new Date().toISOString(),
        comments: [], // Initialize with empty comments array
      };
      
      await createBulletinPost(postData);
      
      setPostTitle('');
      setPostContent('');
      setPostCategory('general');
      setModalVisible(false);
      fetchProfileAndPosts(); // Refresh posts
      Alert.alert('Success', 'Your post has been published!');
    } catch (err) {
      console.error('Error creating post:', err);
      Alert.alert('Post Creation Failed', err.message || 'An error occurred while creating the post.');
    } finally {
      setPosting(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    try {
        return new Date(dateString).toLocaleDateString(undefined, options);
    } catch (e) {
        return 'Invalid Date';
    }
  };

  const getCategoryIcon = (category) => {
    switch (category?.toLowerCase()) {
      case 'general': return 'information-circle-outline';
      case 'question': return 'help-circle-outline';
      case 'event': return 'calendar-outline';
      case 'tip': return 'bulb-outline';
      case 'job': return 'briefcase-outline';
      default: return 'chatbox-ellipses-outline';
    }
  };

  const renderPostItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.postCard}
      onPress={() => router.push({
        pathname: '/(app)/(barber)/bulletin-post-details',
        params: { postId: item.id }
      })}
    >
      <View style={styles.postHeader}>
        <View style={styles.categoryBadge}>
          <Ionicons name={getCategoryIcon(item.category)} size={16} color="#fff" />
          <Text style={styles.categoryText}>
            {item.category ? item.category.charAt(0).toUpperCase() + item.category.slice(1) : 'General'}
          </Text>
        </View>
        <Text style={styles.postDate}>{formatDate(item.createdAt)}</Text>
      </View>
      <Text style={styles.postTitle}>{item.title}</Text>
      <Text style={styles.postContent} numberOfLines={3}>{item.content}</Text>
      <View style={styles.postFooter}>
        <Text style={styles.authorName}>Posted by {item.authorName || 'Unknown'}</Text>
        <View style={styles.commentsIndicator}>
          <Ionicons name="chatbubble-outline" size={16} color="#666" />
          <Text style={styles.commentsCount}>{item.comments?.length || 0}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading bulletin board...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Barber Bulletin Board</Text>
        <Text style={styles.subtitle}>Connect, share tips, and stay informed.</Text>
      </View>

      {error ? (
          <View style={styles.centeredError}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
                <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
      ) : null}

      <FlatList
        data={posts}
        renderItem={renderPostItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListEmptyComponent={
          !loading && (
            <View style={styles.emptyContainer}>
              <Ionicons name="newspaper-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>No posts yet.</Text>
              <Text style={styles.emptySubtext}>Be the first to share something!</Text>
            </View>
          )
        }
      />
      
      <TouchableOpacity 
        style={styles.floatingButton}
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>
      
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create New Bulletin Post</Text>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Category</Text>
              <View style={styles.categoryOptions}>
                {['general', 'question', 'event', 'tip', 'job'].map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.categoryOption, postCategory === cat && styles.selectedCategoryOption]}
                    onPress={() => setPostCategory(cat)}
                  >
                    <Ionicons name={getCategoryIcon(cat)} size={16} color={postCategory === cat ? '#fff' : '#2196F3'} />
                    <Text style={[styles.categoryOptionText, postCategory === cat && styles.selectedCategoryOptionText]}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Title</Text>
              <TextInput
                style={styles.input}
                value={postTitle}
                onChangeText={setPostTitle}
                placeholder="Enter post title"
                placeholderTextColor="#999"
              />
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Content</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={postContent}
                onChangeText={setPostContent}
                placeholder="Share your thoughts..."
                placeholderTextColor="#999"
                multiline
                numberOfLines={5}
              />
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.postButton, posting && styles.disabledButton]}
                onPress={handleCreatePost}
                disabled={posting}
              >
                {posting ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.postButtonText}>Post</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f0f2f5',
  },
  centeredError: {
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    padding: 20,
    paddingTop: 30, // More space at top
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    alignItems: 'center', // Center header content
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
  },
  errorText: {
    color: '#f44336',
    padding: 16,
    textAlign: 'center',
    fontSize: 15,
  },
  retryButton: {
    marginTop: 10,
    backgroundColor: '#2196F3',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  listContainer: {
    padding: 12,
    paddingBottom: 80, // For floating button
  },
  emptyContainer: {
    flex: 1, // Make it take available space if list is short
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50, // More padding
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
    fontWeight: '500',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  postCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2196F3',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  categoryText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
    marginLeft: 5,
    textTransform: 'capitalize',
  },
  postDate: {
    fontSize: 11,
    color: '#777',
  },
  postTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 6,
  },
  postContent: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
    marginBottom: 10,
  },
  postFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 10,
    marginTop: 5,
  },
  authorName: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  commentsIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentsCount: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  floatingButton: {
    position: 'absolute',
    bottom: 25,
    right: 25,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  inputContainer: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
    color: '#444',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    backgroundColor: '#f9f9f9',
  },
  textArea: {
    minHeight: 100, // Adjusted height
    textAlignVertical: 'top',
  },
  categoryOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 5, // Add some bottom margin
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0e0e0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  selectedCategoryOption: {
    backgroundColor: '#2196F3',
    borderColor: '#1976D2',
  },
  categoryOptionText: {
    fontSize: 13,
    color: '#333',
    marginLeft: 5,
    fontWeight: '500',
  },
  selectedCategoryOptionText: {
    color: '#fff',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#e0e0e0',
    marginRight: 8,
  },
  cancelButtonText: {
    color: '#333',
    fontWeight: 'bold',
    fontSize: 15,
  },
  postButton: {
    backgroundColor: '#2196F3',
    marginLeft: 8,
  },
  postButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  disabledButton: {
    backgroundColor: '#cccccc',
  },
});

export default BarberBulletinScreen;

