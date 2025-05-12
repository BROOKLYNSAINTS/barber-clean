import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getUserProfile, auth, getBulletinPostDetails, addCommentToBulletinPost } from '@/services/firebase'; // Adjusted path
import { useLocalSearchParams, useRouter } from 'expo-router';

const BulletinPostDetailsScreen = () => {
  const { postId } = useLocalSearchParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [postDetails, setPostDetails] = useState(null);
  const [profile, setProfile] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [commenting, setCommenting] = useState(false);

  useEffect(() => {
    fetchProfile();
    if (postId) { // Ensure postId is available before fetching
      fetchPostDetails();
    }
  }, [postId]); // Add postId to dependency array

  const fetchProfile = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        const userProfile = await getUserProfile(user.uid);
        setProfile(userProfile);
      } else {
        // Handle case where user is not logged in, perhaps redirect
        router.replace("/(auth)/login");
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      // Optionally set an error state for profile fetching
    }
  };

  const fetchPostDetails = async () => {
    if (!postId) {
      setError('Post ID is missing.');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError('');
      const details = await getBulletinPostDetails(postId);
      setPostDetails(details);
    } catch (error) {
      console.error('Error fetching post details:', error);
      setError('Failed to load post details. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchPostDetails();
  };

  const handleAddComment = async () => {
    if (!commentText.trim() || !profile) {
      // setError('Cannot add comment without text or if profile is not loaded.');
      return;
    }

    try {
      setCommenting(true);
      const user = auth.currentUser;
      if (!user) {
        setError('User not authenticated to comment.');
        setCommenting(false);
        return;
      }
      const commentData = {
        content: commentText,
        authorId: user.uid,
        authorName: profile.name || 'Anonymous',
        createdAt: new Date().toISOString(),
      };
      await addCommentToBulletinPost(postId, commentData);
      setCommentText('');
      fetchPostDetails(); // Refresh post details to show new comment
    } catch (error) {
      console.error('Error adding comment:', error);
      setError('Failed to add comment. Please try again.');
    } finally {
      setCommenting(false);
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

  const renderCommentItem = ({ item }) => (
    <View style={styles.commentCard}>
      <View style={styles.commentHeader}>
        <Text style={styles.commentAuthor}>{item.authorName || 'User'}</Text>
        <Text style={styles.commentDate}>{formatDate(item.createdAt)}</Text>
      </View>
      <Text style={styles.commentContent}>{item.content}</Text>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading post details...</Text>
      </View>
    );
  }

  if (error && !postDetails) { // Show error prominently if post details couldn't be loaded
    return (
      <View style={styles.centered}>
        <Ionicons name="alert-circle-outline" size={64} color="#f44336" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchPostDetails}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  if (!postDetails) {
    // Fallback if postDetails is null after loading and no specific error was set for it
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Post not found or could not be loaded.</Text>
         <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
          <Text style={styles.retryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const comments = postDetails?.comments || [];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 20} // Adjusted offset
    >
      <FlatList
        data={comments}
        renderItem={renderCommentItem}
        keyExtractor={(item, index) => item.id || `comment-${index}`}
        ListHeaderComponent={postDetails && (
          <View style={styles.postContainer}>
            <View style={styles.postHeader}>
              <View style={styles.categoryBadge}>
                <Ionicons name={getCategoryIcon(postDetails.category)} size={16} color="#fff" />
                <Text style={styles.categoryText}>{postDetails.category ? postDetails.category.charAt(0).toUpperCase() + postDetails.category.slice(1) : 'General'}</Text>
              </View>
              <Text style={styles.postDate}>{formatDate(postDetails.createdAt)}</Text>
            </View>
            <Text style={styles.postTitle}>{postDetails.title}</Text>
            <Text style={styles.postContent}>{postDetails.content}</Text>
            <View style={styles.postFooter}>
              <Text style={styles.authorName}>Posted by {postDetails.authorName || 'Unknown Author'}</Text>
            </View>
            <View style={styles.commentsHeader}>
              <Text style={styles.commentsTitle}>Comments ({comments.length})</Text>
            </View>
          </View>
        )}
        ListEmptyComponent={!loading && (
          <View style={styles.emptyCommentsContainer}>
            <Text style={styles.emptyCommentsText}>No comments yet.</Text>
            <Text style={styles.emptyCommentsSubtext}>Be the first to share your thoughts!</Text>
          </View>
        )}
        contentContainerStyle={styles.listContainer}
        refreshing={refreshing}
        onRefresh={handleRefresh}
      />

      <View style={styles.commentInputContainer}>
        <TextInput
          style={styles.commentInput}
          value={commentText}
          onChangeText={setCommentText}
          placeholder="Write a comment..."
          placeholderTextColor="#888"
          multiline
        />
        <TouchableOpacity
          style={[styles.sendButton, (!commentText.trim() || commenting) && styles.disabledButton]}
          onPress={handleAddComment}
          disabled={!commentText.trim() || commenting}
        >
          {commenting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="send" size={20} color="#fff" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

// Styles (simplified for brevity, assume they are well-defined elsewhere or add them)
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
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    marginTop: 10,
    fontSize: 16,
    color: '#f44336',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: '#2196F3',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  listContainer: {
    paddingBottom: 20, // Ensure space for comment input
  },
  postContainer: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
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
    marginLeft: 5,
    fontSize: 12,
    fontWeight: '500',
  },
  postDate: {
    fontSize: 12,
    color: '#777',
  },
  postTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  postContent: {
    fontSize: 16,
    lineHeight: 24,
    color: '#444',
    marginBottom: 12,
  },
  postFooter: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 10,
    marginTop: 10,
  },
  authorName: {
    fontSize: 13,
    fontStyle: 'italic',
    color: '#555',
  },
  commentsHeader: {
    marginTop: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  commentsTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333',
  },
  commentCard: {
    backgroundColor: '#fff',
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  commentAuthor: {
    fontWeight: 'bold',
    color: '#444',
  },
  commentDate: {
    fontSize: 11,
    color: '#888',
  },
  commentContent: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  emptyCommentsContainer: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 16,
  },
  emptyCommentsText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  emptyCommentsSubtext: {
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
    backgroundColor: '#fff',
  },
  commentInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100, // Limit multiline input height
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 10,
    fontSize: 15,
  },
  sendButton: {
    backgroundColor: '#2196F3',
    padding: 10,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#a0a0a0',
  },
});

export default BulletinPostDetailsScreen; // Corrected export

