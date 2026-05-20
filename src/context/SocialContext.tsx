import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  getDocs, 
  onSnapshot, 
  query, 
  orderBy, 
  updateDoc, 
  increment,
  runTransaction
} from 'firebase/firestore';
import { db, isFirebaseActive, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from './AuthContext';
import { Post, Comment, Like, Follow, UserProfile } from '../types';

interface SocialContextType {
  posts: Post[];
  isLoadingPosts: boolean;
  followingIds: string[];
  commentsByPost: { [postId: string]: Comment[] };
  createPost: (caption: string, type: 'photo' | 'reel', mediaUrl: string) => Promise<void>;
  toggleLikePost: (postId: string) => Promise<void>;
  addComment: (postId: string, text: string) => Promise<void>;
  deleteComment: (postId: string, commentId: string) => Promise<void>;
  followUser: (targetUid: string) => Promise<void>;
  unfollowUser: (targetUid: string) => Promise<void>;
  getComments: (postId: string) => Promise<Comment[]>;
  postLikes: { [postId: string]: string[] }; // Users who liked this post
}

const SocialContext = createContext<SocialContextType | undefined>(undefined);

// High-quality vertical loop mp4 reels & urban dark mode photographs
const PRELOADED_REELS = [
  'https://assets.mixkit.co/videos/preview/mixkit-starry-night-sky-loop-2115-large.mp4',
  'https://assets.mixkit.co/videos/preview/mixkit-neon-light-from-a-building-at-night-loop-41712-large.mp4',
  'https://assets.mixkit.co/videos/preview/mixkit-delicious-coffee-dripping-into-a-cup-loop-41551-large.mp4',
  'https://assets.mixkit.co/videos/preview/mixkit-cyberpunk-look-of-a-man-with-futuristic-glasses-loop-42861-large.mp4'
];

const PRELOADED_PHOTOS = [
  'https://images.unsplash.com/photo-1511556532299-8f662fc26c06?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1515462277126-270d878326e5?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&h=600&fit=crop',
];

export const SocialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, allUsers } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [followingIds, setFollowingIds] = useState<string[]>([]);
  const [commentsByPost, setCommentsByPost] = useState<{ [postId: string]: Comment[] }>({});
  const [postLikes, setPostLikes] = useState<{ [postId: string]: string[] }>({});

  // Local storage lists for full sandbox mode
  const [localPosts, setLocalPosts] = useState<Post[]>(() => {
    const saved = localStorage.getItem('social_local_posts');
    if (saved) return JSON.parse(saved);

    // Initial gorgeous seeds
    const seeds: Post[] = [
      {
        id: 'post_1',
        userId: 'user_dev_mia',
        displayName: 'Mia Chen',
        userPhotoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=faces',
        mediaUrl: PRELOADED_REELS[0],
        caption: 'Under the sea of stars tonight. Infinite cosmic vibes in dark mode! ⭐🌌🔮 #stargazing #cinematography',
        type: 'reel',
        likesCount: 24,
        commentsCount: 2,
        createdAt: new Date(Date.now() - 3600000 * 3).toISOString()
      },
      {
        id: 'post_2',
        userId: 'user_dev_lucas',
        displayName: 'Lucas Vance',
        userPhotoURL: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=faces',
        mediaUrl: PRELOADED_PHOTOS[1],
        caption: 'Chasing neon shadows in Neo-Tokyo. Loving high contrast dark views. 📸🌆🎭 #tokyo #streetphotography',
        type: 'photo',
        likesCount: 89,
        commentsCount: 1,
        createdAt: new Date(Date.now() - 3600000 * 6).toISOString()
      },
      {
        id: 'post_3',
        userId: 'user_dev_alex',
        displayName: 'Alex Rivers',
        userPhotoURL: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=faces',
        mediaUrl: PRELOADED_REELS[2],
        caption: 'Late night compilation streams call for dynamic coffee drops. ☕💻✨ #coffeegeek #developerlife #reeltime',
        type: 'reel',
        likesCount: 42,
        commentsCount: 3,
        createdAt: new Date(Date.now() - 3600000 * 12).toISOString()
      },
      {
        id: 'post_4',
        userId: 'user_dev_mia',
        displayName: 'Mia Chen',
        userPhotoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=faces',
        mediaUrl: PRELOADED_PHOTOS[3],
        caption: 'Minimal mechanical setups for perfect code flows. Setup look aesthetic. ⌨️🖥️⚙️ #desksetup #minimalism',
        type: 'photo',
        likesCount: 120,
        commentsCount: 0,
        createdAt: new Date(Date.now() - 3600000 * 24).toISOString()
      }
    ];

    localStorage.setItem('social_local_posts', JSON.stringify(seeds));
    return seeds;
  });

  const [localFollows, setLocalFollows] = useState<Follow[]>(() => {
    const saved = localStorage.getItem('social_local_follows');
    if (saved) return JSON.parse(saved);
    return [];
  });

  const [localLikes, setLocalLikes] = useState<Like[]>(() => {
    const saved = localStorage.getItem('social_local_likes');
    if (saved) return JSON.parse(saved);
    return [];
  });

  const [localComments, setLocalComments] = useState<Comment[]>(() => {
    const saved = localStorage.getItem('social_local_comments');
    if (saved) return JSON.parse(saved);

    // Some matching seeded comments
    return [
      {
        id: 'c_1',
        postId: 'post_1',
        userId: 'user_dev_alex',
        displayName: 'Alex Rivers',
        userPhotoURL: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=faces',
        text: 'This video loop is incredibly calming Mia, stellar tracking!',
        createdAt: new Date(Date.now() - 3600000 * 2.5).toISOString()
      },
      {
        id: 'c_2',
        postId: 'post_1',
        userId: 'user_dev_lucas',
        displayName: 'Lucas Vance',
        userPhotoURL: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=faces',
        text: 'Absolute vibe. Colors are so rich!',
        createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
      },
      {
        id: 'c_3',
        postId: 'post_2',
        userId: 'user_dev_mia',
        displayName: 'Mia Chen',
        userPhotoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=faces',
        text: 'I love your street shots Lucas! Insane shadows.',
        createdAt: new Date(Date.now() - 3600000 * 5).toISOString()
      }
    ];
  });

  // 1. Sync Posts (Firebase vs. Local)
  useEffect(() => {
    if (isFirebaseActive && db) {
      setIsLoadingPosts(true);
      const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const postsList: Post[] = [];
        snapshot.forEach((doc) => {
          postsList.push(doc.data() as Post);
        });
        setPosts(postsList);
        setIsLoadingPosts(false);
      }, (error) => {
        console.error("Firestore loading posts failed. Falling back to local data.", error);
        setPosts(localPosts);
        setIsLoadingPosts(false);
      });
      return () => unsubscribe();
    } else {
      setPosts([...localPosts].sort((a,b) => b.createdAt.localeCompare(a.createdAt)));
      setIsLoadingPosts(false);
    }
  }, [localPosts]);

  // 2. Sync Liking user IDs for each post
  useEffect(() => {
    if (!currentUser) return;

    if (isFirebaseActive && db) {
      // For each post, we listen to its subcollection of likes
      const unsubscribes = posts.map(post => {
        const q = collection(db, 'posts', post.id, 'likes');
        return onSnapshot(q, (snap) => {
          const userIds: string[] = [];
          snap.forEach(doc => {
            userIds.push(doc.id); // likeId matches userId on create
          });
          setPostLikes(prev => ({ ...prev, [post.id]: userIds }));
        });
      });
      return () => {
        unsubscribes.forEach(unsub => unsub());
      };
    } else {
      // Map local likes to postID
      const dict: { [postId: string]: string[] } = {};
      localLikes.forEach(l => {
        if (!dict[l.postId]) dict[l.postId] = [];
        dict[l.postId].push(l.userId);
      });
      setPostLikes(dict);
    }
  }, [posts, localLikes, currentUser]);

  // 3. Sync follows of the currentUser
  useEffect(() => {
    if (!currentUser) {
      setFollowingIds([]);
      return;
    }

    if (isFirebaseActive && db) {
      const q = query(collection(db, 'follows'));
      const unsubscribe = onSnapshot(q, (snap) => {
        const ids: string[] = [];
        snap.forEach(doc => {
          const item = doc.data() as Follow;
          if (item.followerId === currentUser.uid) {
            ids.push(item.followingId);
          }
        });
        setFollowingIds(ids);
      });
      return () => unsubscribe();
    } else {
      const ids = localFollows
        .filter(f => f.followerId === currentUser.uid)
        .map(f => f.followingId);
      setFollowingIds(ids);
    }
  }, [currentUser, localFollows]);

  // 4. Sync comments loaded from Local Comments for fast state handling
  useEffect(() => {
    if (!isFirebaseActive) {
      const dict: { [postId: string]: Comment[] } = {};
      localComments.forEach(c => {
        if (!dict[c.postId]) dict[c.postId] = [];
        dict[c.postId].push(c);
      });
      // Sort comments by createdAt ascending
      Object.keys(dict).forEach(pid => {
        dict[pid].sort((a,b) => a.createdAt.localeCompare(b.createdAt));
      });
      setCommentsByPost(dict);
    }
  }, [localComments]);

  // Get comments helper for a single post (Firestore)
  const getComments = async (postId: string): Promise<Comment[]> => {
    if (isFirebaseActive && db) {
      try {
        const q = query(collection(db, 'posts', postId, 'comments'), orderBy('createdAt', 'asc'));
        const snap = await getDocs(q);
        const list: Comment[] = [];
        snap.forEach(doc => {
          list.push(doc.data() as Comment);
        });
        // Update state cache
        setCommentsByPost(prev => ({ ...prev, [postId]: list }));
        return list;
      } catch (error) {
        console.error("Firestore getComments failed:", error);
        return [];
      }
    } else {
      return commentsByPost[postId] || [];
    }
  };

  const createPost = async (caption: string, type: 'photo' | 'reel', mediaUrl: string) => {
    if (!currentUser) return;
    const postId = 'post_' + Date.now().toString(36);
    
    // Fallback links if none uploaded
    let finalUrl = mediaUrl;
    if (!finalUrl || finalUrl.trim() === '') {
      if (type === 'reel') {
        finalUrl = PRELOADED_REELS[Math.floor(Math.random() * PRELOADED_REELS.length)];
      } else {
        finalUrl = PRELOADED_PHOTOS[Math.floor(Math.random() * PRELOADED_PHOTOS.length)];
      }
    }

    const newPost: Post = {
      id: postId,
      userId: currentUser.uid,
      displayName: currentUser.displayName,
      userPhotoURL: currentUser.photoURL,
      mediaUrl: finalUrl,
      caption,
      type,
      likesCount: 0,
      commentsCount: 0,
      createdAt: new Date().toISOString()
    };

    if (isFirebaseActive && db) {
      const path = `posts/${postId}`;
      try {
        await setDoc(doc(db, 'posts', postId), newPost);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, path);
      }
    } else {
      // Local Post create
      const updated = [newPost, ...localPosts];
      setLocalPosts(updated);
      localStorage.setItem('social_local_posts', JSON.stringify(updated));
    }
  };

  const toggleLikePost = async (postId: string) => {
    if (!currentUser) return;
    const isLiked = postLikes[postId]?.includes(currentUser.uid);

    if (isFirebaseActive && db) {
      const likeDocPath = `posts/${postId}/likes/${currentUser.uid}`;
      const postDocPath = `posts/${postId}`;

      try {
        if (!isLiked) {
          // Add like record and increment count
          await setDoc(doc(db, 'posts', postId, 'likes', currentUser.uid), {
            id: currentUser.uid,
            postId,
            userId: currentUser.uid,
            createdAt: new Date().toISOString()
          });
          await updateDoc(doc(db, 'posts', postId), {
            likesCount: increment(1)
          });
        } else {
          // Remove like record and decrement count
          await deleteDoc(doc(db, 'posts', postId, 'likes', currentUser.uid));
          await updateDoc(doc(db, 'posts', postId), {
            likesCount: increment(-1)
          });
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, likeDocPath);
      }
    } else {
      // Local Liking logic
      let updatedLikes = [...localLikes];
      let updatedPosts = [...localPosts];

      if (!isLiked) {
        const newLike: Like = {
          id: `${currentUser.uid}_${postId}`,
          postId,
          userId: currentUser.uid,
          createdAt: new Date().toISOString()
        };
        updatedLikes.push(newLike);
        updatedPosts = updatedPosts.map(p => {
          if (p.id === postId) {
            return { ...p, likesCount: p.likesCount + 1 };
          }
          return p;
        });
      } else {
        updatedLikes = updatedLikes.filter(l => !(l.postId === postId && l.userId === currentUser.uid));
        updatedPosts = updatedPosts.map(p => {
          if (p.id === postId) {
            return { ...p, likesCount: Math.max(0, p.likesCount - 1) };
          }
          return p;
        });
      }

      setLocalLikes(updatedLikes);
      localStorage.setItem('social_local_likes', JSON.stringify(updatedLikes));

      setLocalPosts(updatedPosts);
      localStorage.setItem('social_local_posts', JSON.stringify(updatedPosts));
    }
  };

  const addComment = async (postId: string, text: string) => {
    if (!currentUser || !text.trim()) return;
    const cid = 'comment_' + Date.now().toString(36);

    const newComment: Comment = {
      id: cid,
      postId,
      userId: currentUser.uid,
      displayName: currentUser.displayName,
      userPhotoURL: currentUser.photoURL,
      text,
      createdAt: new Date().toISOString()
    };

    if (isFirebaseActive && db) {
      const commentPath = `posts/${postId}/comments/${cid}`;
      try {
        await setDoc(doc(db, 'posts', postId, 'comments', cid), newComment);
        await updateDoc(doc(db, 'posts', postId), {
          commentsCount: increment(1)
        });
        // Refetch comments to refresh cache
        await getComments(postId);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, commentPath);
      }
    } else {
      // Local comment create
      const updatedComments = [...localComments, newComment];
      setLocalComments(updatedComments);
      localStorage.setItem('social_local_comments', JSON.stringify(updatedComments));

      const updatedPosts = localPosts.map(p => {
        if (p.id === postId) {
          return { ...p, commentsCount: p.commentsCount + 1 };
        }
        return p;
      });
      setLocalPosts(updatedPosts);
      localStorage.setItem('social_local_posts', JSON.stringify(updatedPosts));
    }
  };

  const deleteComment = async (postId: string, commentId: string) => {
    if (!currentUser) return;

    if (isFirebaseActive && db) {
      const path = `posts/${postId}/comments/${commentId}`;
      try {
        await deleteDoc(doc(db, 'posts', postId, 'comments', commentId));
        await updateDoc(doc(db, 'posts', postId), {
          commentsCount: increment(-1)
        });
        // Refetch comments
        await getComments(postId);
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, path);
      }
    } else {
      // Local delete comment
      const updatedComments = localComments.filter(c => c.id !== commentId);
      setLocalComments(updatedComments);
      localStorage.setItem('social_local_comments', JSON.stringify(updatedComments));

      const updatedPosts = localPosts.map(p => {
        if (p.id === postId) {
          return { ...p, commentsCount: Math.max(0, p.commentsCount - 1) };
        }
        return p;
      });
      setLocalPosts(updatedPosts);
      localStorage.setItem('social_local_posts', JSON.stringify(updatedPosts));
    }
  };

  const followUser = async (targetUid: string) => {
    if (!currentUser || targetUid === currentUser.uid) return;
    const fid = `${currentUser.uid}_${targetUid}`;

    const newFollow: Follow = {
      id: fid,
      followerId: currentUser.uid,
      followingId: targetUid,
      createdAt: new Date().toISOString()
    };

    if (isFirebaseActive && db) {
      const path = `follows/${fid}`;
      try {
        await setDoc(doc(db, 'follows', fid), newFollow);
        // Standard atomicity: update metadata counts
        await updateDoc(doc(db, 'users', currentUser.uid), {
          followingCount: increment(1)
        });
        await updateDoc(doc(db, 'users', targetUid), {
          followersCount: increment(1)
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, path);
      }
    } else {
      // Local Follow create
      if (followingIds.includes(targetUid)) return; // Avoid duplicate

      const updatedFollows = [...localFollows, newFollow];
      setLocalFollows(updatedFollows);
      localStorage.setItem('social_local_follows', JSON.stringify(updatedFollows));

      // Update counters in local user array
      const savedUsers: UserProfile[] = JSON.parse(localStorage.getItem('social_local_users') || '[]');
      const updatedUsersList = savedUsers.map(user => {
        if (user.uid === currentUser.uid) {
          return { ...user, followingCount: user.followingCount + 1 };
        }
        if (user.uid === targetUid) {
          return { ...user, followersCount: user.followersCount + 1 };
        }
        return user;
      });
      localStorage.setItem('social_local_users', JSON.stringify(updatedUsersList));
      window.dispatchEvent(new Event('storage')); // Force reload user indices if active
    }
  };

  const unfollowUser = async (targetUid: string) => {
    if (!currentUser || targetUid === currentUser.uid) return;
    const fid = `${currentUser.uid}_${targetUid}`;

    if (isFirebaseActive && db) {
      const path = `follows/${fid}`;
      try {
        await deleteDoc(doc(db, 'follows', fid));
        await updateDoc(doc(db, 'users', currentUser.uid), {
          followingCount: increment(-1)
        });
        await updateDoc(doc(db, 'users', targetUid), {
          followersCount: increment(-1)
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, path);
      }
    } else {
      // Local remove follow
      if (!followingIds.includes(targetUid)) return;

      const updatedFollows = localFollows.filter(f => f.id !== fid);
      setLocalFollows(updatedFollows);
      localStorage.setItem('social_local_follows', JSON.stringify(updatedFollows));

      // Update counters in local user list
      const savedUsers: UserProfile[] = JSON.parse(localStorage.getItem('social_local_users') || '[]');
      const updatedUsersList = savedUsers.map(user => {
        if (user.uid === currentUser.uid) {
          return { ...user, followingCount: Math.max(0, user.followingCount - 1) };
        }
        if (user.uid === targetUid) {
          return { ...user, followersCount: Math.max(0, user.followersCount - 1) };
        }
        return user;
      });
      localStorage.setItem('social_local_users', JSON.stringify(updatedUsersList));
      window.dispatchEvent(new Event('storage')); // Force reload user indices if active
    }
  };

  return (
    <SocialContext.Provider value={{
      posts,
      isLoadingPosts,
      followingIds,
      commentsByPost,
      postLikes,
      createPost,
      toggleLikePost,
      addComment,
      deleteComment,
      followUser,
      unfollowUser,
      getComments
    }}>
      {children}
    </SocialContext.Provider>
  );
};

export const useSocial = () => {
  const context = useContext(SocialContext);
  if (!context) throw new Error('useSocial must be used inside SocialProvider');
  return context;
};
