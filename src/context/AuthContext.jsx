import { createContext, useContext, useEffect, useState } from 'react';

/**
 * AuthContext.jsx
 * ---------------------------------------------------------------------
 * Autenticazione "finta" basata su localStorage, usata come segnaposto
 * finché non colleghiamo Firebase Authentication (piano gratuito).
 *
 * QUANDO COLLEGHERAI FIREBASE:
 *  - Importa `getAuth`, `onAuthStateChanged`, `signInWithEmailAndPassword`,
 *    `createUserWithEmailAndPassword`, `signOut` da "firebase/auth".
 *  - Sostituisci il corpo di login/register/logout con le rispettive
 *    chiamate Firebase e aggiorna `user` dentro onAuthStateChanged.
 *  - L'oggetto `user` esposto qui usa già { uid, email } per essere
 *    compatibile con l'utente restituito da Firebase Auth.
 * ---------------------------------------------------------------------
 */

const AuthContext = createContext(null);

const USERS_KEY = 'diary:users';
const SESSION_KEY = 'diary:session';

function readUsers() {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY)) || [];
  } catch {
    return [];
  }
}

function writeUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const session = localStorage.getItem(SESSION_KEY);
    if (session) {
      try {
        setUser(JSON.parse(session));
      } catch {
        /* ignore corrupt session */
      }
    }
    setReady(true);
  }, []);

  function login(email, password) {
    const users = readUsers();
    const found = users.find((u) => u.email === email && u.password === password);
    if (!found) {
      throw new Error('Email o password non corretti.');
    }
    const session = { uid: found.uid, email: found.email };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    setUser(session);
    return session;
  }

  function register(email, password) {
    const users = readUsers();
    if (users.some((u) => u.email === email)) {
      throw new Error('Esiste già un account con questa email.');
    }
    const newUser = { uid: 'u_' + Date.now().toString(36), email, password };
    writeUsers([...users, newUser]);
    const session = { uid: newUser.uid, email: newUser.email };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    setUser(session);
    return session;
  }

  function logout() {
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, ready, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve essere usato dentro <AuthProvider>');
  return ctx;
}
