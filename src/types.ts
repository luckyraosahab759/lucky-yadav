export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  bio?: string;
  followersCount: number;
  followingCount: number;
  createdAt: string;
}

export interface Post {
  id: string;
  userId: string;
  displayName: string;
  userPhotoURL?: string;
  mediaUrl: string;
  caption?: string;
  type: 'photo' | 'reel';
  likesCount: number;
  commentsCount: number;
  createdAt: string;
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  displayName: string;
  userPhotoURL?: string;
  text: string;
  createdAt: string;
}

export interface Like {
  id: string;
  postId: string;
  userId: string;
  createdAt: string;
}

export interface Follow {
  id: string; // `${followerId}_${followingId}`
  followerId: string;
  followingId: string;
  createdAt: string;
}

export type AppTab = 'feed' | 'reels' | 'upload' | 'profile' | 'search';
