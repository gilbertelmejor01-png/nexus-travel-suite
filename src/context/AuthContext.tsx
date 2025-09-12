import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  createUserWithEmailAndPassword,
  UserCredential,
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
  DocumentData,
  collection,
  addDoc,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface AuthContextType {
  currentUser: User | null;
  userData: DocumentData | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<UserCredential>;
  loginWithGoogle: () => Promise<UserCredential>;
  register: (
    email: string,
    password: string,
    name: string
  ) => Promise<UserCredential>;
  logout: () => Promise<void>;
  updateUserData: (data: Partial<DocumentData>) => Promise<void>;
  uid: string | null;
  getUid: () => string | null;
  getUserDocRef: () => ReturnType<typeof doc> | null;
  getSubcollectionRef: (
    subcollection: string
  ) => ReturnType<typeof collection> | null;
  setUserDocData: (data: Partial<DocumentData>) => Promise<void>;
  addToUserSubcollection: (
    subcollection: string,
    data: DocumentData
  ) => Promise<string>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<DocumentData | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  const ensureUserDocument = async (
    user: User,
    additionalData: { name?: string } = {}
  ) => {
    const userRef = doc(db, "users", user.uid);
    const snap = await getDoc(userRef);
    if (!snap.exists()) {
      await createUserDocument(user, additionalData);
    } else {
      await setDoc(
        userRef,
        { lastLogin: serverTimestamp(), updatedAt: serverTimestamp() },
        { merge: true }
      );
    }
  };

  const fetchUserData = async (user: User) => {
    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        setUserData(userDoc.data());
      } else {
        await createUserDocument(user);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      toast({
        title: "Error",
        description: "No se pudo cargar la información del usuario",
        variant: "destructive",
      });
    }
  };

  const createUserDocument = async (
    user: User,
    additionalData: { name?: string } = {}
  ) => {
    try {
      const userRef = doc(db, "users", user.uid);
      const baseData = {
        uid: user.uid,
        email: user.email,
        displayName:
          additionalData.name || user.displayName || user.email?.split("@")[0],
        photoURL: user.photoURL || "",
        role: "user",
        preferences: {
          language: "es",
          currency: "EUR",
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
        ...additionalData,
      };

      await setDoc(userRef, baseData, { merge: true });
      setUserData((prev) => ({ ...prev, ...baseData }));
    } catch (error) {
      console.error("Error creating user document:", error);
      throw error;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        await ensureUserDocument(user);
        await fetchUserData(user);
      } else {
        setCurrentUser(null);
        setUserData(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      await ensureUserDocument(userCredential.user);
      return userCredential;
    } catch (error: any) {
      console.error("Login error:", error);
      throw error;
    }
  };

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      await ensureUserDocument(result.user);
      return result;
    } catch (error) {
      console.error("Google login error:", error);
      throw error;
    }
  };

  const register = async (email: string, password: string, name: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      await createUserDocument(userCredential.user, { name });
      return userCredential;
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    }
  };

  const updateUserData = async (data: Partial<DocumentData>) => {
    if (!currentUser) return;
    try {
      const userRef = doc(db, "users", currentUser.uid);
      await setDoc(
        userRef,
        {
          ...data,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      setUserData((prev) => ({
        ...prev,
        ...data,
      }));
    } catch (error) {
      console.error("Error updating user data:", error);
      throw error;
    }
  };

  const uid = currentUser?.uid ?? null;
  const getUid = () => uid;
  const getUserDocRef = () =>
    currentUser ? doc(db, "users", currentUser.uid) : null;
  const getSubcollectionRef = (subcollection: string) =>
    currentUser
      ? collection(db, "users", currentUser.uid, subcollection)
      : null;

  const setUserDocData = async (data: Partial<DocumentData>) => {
    if (!currentUser) throw new Error("No hay sesión activa");
    await setDoc(
      doc(db, "users", currentUser.uid),
      { ...data, updatedAt: serverTimestamp() },
      { merge: true }
    );
    setUserData((prev) => ({ ...prev, ...data }));
  };

  const addToUserSubcollection = async (
    subcollection: string,
    data: DocumentData
  ) => {
    if (!currentUser) throw new Error("No hay sesión activa");
    const colRef = collection(db, "users", currentUser.uid, subcollection);
    const docRef = await addDoc(colRef, {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  };

  const value: AuthContextType = {
    currentUser,
    userData,
    loading,
    login,
    loginWithGoogle,
    register,
    logout,
    updateUserData,
    uid,
    getUid,
    getUserDocRef,
    getSubcollectionRef,
    setUserDocData,
    addToUserSubcollection,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
