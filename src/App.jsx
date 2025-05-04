import React, { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebaseConfig';
import AuthPage from './pages/AuthPage';
import HomePage from './pages/HomePage';


function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    // Surveiller l'état de connexion utilisateur
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    // Nettoyer l'écouteur à la désinstallation
    return () => unsubscribe();
  }, []);

  if (authLoading) {
    // Afficher un écran de chargement pendant la vérification de l'authentification
    return <div className="h-screen flex items-center justify-center text-center">Chargement...</div>;
  }

  // Si un utilisateur est connecté, afficher l'application principale, sinon l'écran d'authentification
  return user ? <HomePage user={user} /> : <AuthPage />;
}

export default App;
