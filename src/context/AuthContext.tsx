import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  signInWithPopup, 
  GoogleAuthProvider,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, collection, onSnapshot, query } from 'firebase/firestore';
import { auth, db, isFirebaseActive, handleFirestoreError, OperationType } from '../firebase';
import { UserProfile } from '../types';

interface AuthContextType {
  currentUser: UserProfile | null;
  isLoading: boolean;
  isFirebaseMode: boolean;
  allUsers: UserProfile[];
  signUp: (email: string, password: string, displayName: string, bio?: string, photoURL?: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  loginGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateUserBioAndPhoto: (displayName: string, bio: string, photoURL: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Standalone default avatars for aesthetic consistency
const DEFAULT_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=faces',
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);

  // Local state fallback if Firebase is not active yet
  const [localUsers, setLocalUsers] = useState<UserProfile[]>(() => {
    const saved = localStorage.getItem('social_local_users');
    if (saved) return JSON.parse(saved);

    // Bootstrap some cool default developers/users for recommendations
    const initial: UserProfile[] = [
      {
        uid: 'user_dev_alex',
        displayName: 'Alex Rivers',
        email: 'alex@example.com',
        photoURL: DEFAULT_AVATARS[1],
        bio: 'Tech enthusiast & amateur video creator. Reels, travel, code. 💻🚘✈️',
        followersCount: 142,
        followingCount: 98,
        createdAt: new Date().toISOString(),
      },
      {
        uid: 'user_dev_mia',
        displayName: 'Mia Chen',
        email: 'mia@example.com',
        photoURL: DEFAULT_AVATARS[0],
        bio: 'Visual designer. Crafting clean interfaces and cinematic reels. 🌟📐✨',
        followersCount: 389,
        followingCount: 145,
        createdAt: new Date().toISOString(),
      },
      {
        uid: 'user_dev_lucas',
        displayName: 'Lucas Vance',
        email: 'lucas@example.com',
        photoURL: DEFAULT_AVATARS[3],
        bio: 'Street photographer. Capturing split seconds in dark-themed galleries. 📸🌌🖤',
        followersCount: 512,
        followingCount: 320,
        createdAt: new Date().toISOString(),
      }
    ];
    localStorage.setItem('social_local_users', JSON.stringify(initial));
    return initial;
  });

  const [localActiveUid, setLocalActiveUid] = useState<string | null>(() => {
    return localStorage.getItem('social_local_active_uid');
  });

  // Sync users list (handles both Firebase snapshot or local array)
  useEffect(() => {
    if (isFirebaseActive && db) {
      const q = query(collection(db, 'users'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const usersList: UserProfile[] = [];
        snapshot.forEach((doc) => {
          usersList.push(doc.data() as UserProfile);
        });
        setAllUsers(usersList);
      }, (error) => {
        console.error("Failed to load user directories:", error);
      });
      return () => unsubscribe();
    } else {
      setAllUsers(localUsers);
    }
  }, [localUsers]);

  // Handle Auth state change
  useEffect(() => {
    if (isFirebaseActive && auth && db) {
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        setIsLoading(true);
        if (firebaseUser) {
          // Fetch additional profile fields from Firestore
          const docRef = doc(db, 'users', firebaseUser.uid);
          try {
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
              setCurrentUser(docSnap.data() as UserProfile);
            } else {
              // Create default profile if missing
              const randomPhoto = DEFAULT_AVATARS[Math.floor(Math.random() * DEFAULT_AVATARS.length)];
              const newProfile: UserProfile = {
                uid: firebaseUser.uid,
                displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
                email: firebaseUser.email || '',
                photoURL: firebaseUser.photoURL || randomPhoto,
                bio: 'Hey there! I am using this social app.',
                followersCount: 0,
                followingCount: 0,
                createdAt: new Date().toISOString(),
              };
              await setDoc(docRef, newProfile);
              setCurrentUser(newProfile);
            }
          } catch (err) {
            console.error("Firestore user sync error:", err);
            // Non-blocking fallback to basics
            setCurrentUser({
              uid: firebaseUser.uid,
              displayName: firebaseUser.displayName || 'User',
              email: firebaseUser.email || '',
              photoURL: firebaseUser.photoURL || DEFAULT_AVATARS[0],
              followersCount: 0,
              followingCount: 0,
              createdAt: new Date().toISOString(),
            });
          }
        } else {
          setCurrentUser(null);
        }
        setIsLoading(false);
      });
      return () => unsubscribe();
    } else {
      // Local storage auth simulation
      setIsLoading(true);
      if (localActiveUid) {
        const matched = localUsers.find(u => u.uid === localActiveUid);
        if (matched) {
          setCurrentUser(matched);
        } else {
          setCurrentUser(null);
          localStorage.removeItem('social_local_active_uid');
        }
      } else {
        setCurrentUser(null);
      }
      setIsLoading(false);
    }
  }, [localActiveUid, localUsers]);

  // Auth Operations
  const signUp = async (email: string, password: string, displayName: string, bio?: string, photoURL?: string) => {
    const avatar = photoURL || DEFAULT_AVATARS[Math.floor(Math.random() * DEFAULT_AVATARS.length)];
    const finalBio = bio || 'Welcome to my profile!';

    if (isFirebaseActive && auth && db) {
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const uid = userCredential.user.uid;
        
        const newProfile: UserProfile = {
          uid,
          displayName,
          email,
          photoURL: avatar,
          bio: finalBio,
          followersCount: 0,
          followingCount: 0,
          createdAt: new Date().toISOString(),
        };

        await setDoc(doc(db, 'users', uid), newProfile);
        setCurrentUser(newProfile);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/signup_${email}`);
      }
    } else {
      // Local signup simulation
      const uid = 'user_' + Date.now().toString(36);
      const newProfile: UserProfile = {
        uid,
        displayName,
        email,
        photoURL: avatar,
        bio: finalBio,
        followersCount: 0,
        followingCount: 0,
        createdAt: new Date().toISOString(),
      };

      const updatedUsers = [...localUsers, newProfile];
      setLocalUsers(updatedUsers);
      localStorage.setItem('social_local_users', JSON.stringify(updatedUsers));
      
      setLocalActiveUid(uid);
      localStorage.setItem('social_local_active_uid', uid);
    }
  };

  const login = async (email: string, password: string) => {
    if (isFirebaseActive && auth) {
      try {
        await signInWithEmailAndPassword(auth, email, password);
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, `auth/login_${email}`);
      }
    } else {
      // Local login simulation
      const matched = localUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (matched) {
        setLocalActiveUid(matched.uid);
        localStorage.setItem('social_local_active_uid', matched.uid);
      } else {
        // Simple client-side error helper
        throw new Error("Invalid username/password on local sandbox. Note: Try signing up first.");
      }
    }
  };

  const loginGoogle = async () => {
    if (isFirebaseActive && auth) {
      try {
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, 'auth/google');
      }
    } else {
      // Create or log in standard developer mock
      const matched = localUsers[0];
      setLocalActiveUid(matched.uid);
      localStorage.setItem('social_local_active_uid', matched.uid);
    }
  };

  const logout = async () => {
    if (isFirebaseActive && auth) {
      try {
        await signOut(auth);
      } catch (err) {
        console.error("Log out failed:", err);
      }
    } else {
      setLocalActiveUid(null);
      localStorage.removeItem('social_local_active_uid');
      setCurrentUser(null);
    }
  };

  const updateUserBioAndPhoto = async (displayName: string, bio: string, photoURL: string) => {
    if (!currentUser) return;

    if (isFirebaseActive && db) {
      const path = `users/${currentUser.uid}`;
      try {
        await updateDoc(doc(db, 'users', currentUser.uid), {
          displayName,
          bio,
          photoURL,
        });
        setCurrentUser(prev => prev ? { ...prev, displayName, bio, photoURL } : null);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, path);
      }
    } else {
      // Local update profile
      const updatedUsers = localUsers.map((u) => {
        if (u.uid === currentUser.uid) {
          return { ...u, displayName, bio, photoURL };
        }
        return u;
      });
      setLocalUsers(updatedUsers);
      localStorage.setItem('social_local_users', JSON.stringify(updatedUsers));
      setCurrentUser(prev => prev ? { ...prev, displayName, bio, photoURL } : null);
    }
  };

  return (
    <AuthContext.Provider value={{
      currentUser,
      isLoading,
      isFirebaseMode: isFirebaseActive,
      allUsers,
      signUp,
      login,
      loginGoogle,
      logout,
      updateUserBioAndPhoto
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
};
