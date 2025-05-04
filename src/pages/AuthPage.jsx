import React, { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebaseConfig';

function AuthPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const toggleMode = () => {
    setIsRegister((prev) => !prev);
    setError('');
    setPassword('');
    setConfirmPassword('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (isRegister) {
      // Mode inscription
      if (password !== confirmPassword) {
        setError("Les mots de passe ne correspondent pas.");
        return;
      }
      try {
        await createUserWithEmailAndPassword(auth, email, password);
        // L'utilisateur est automatiquement connecté après l'inscription réussie
      } catch (err) {
        setError(err.message);
      }
    } else {
      // Mode connexion
      try {
        await signInWithEmailAndPassword(auth, email, password);
        // La redirection vers l'application se fait automatiquement via onAuthStateChanged dans App.jsx
      } catch (err) {
        setError("Échec de la connexion : " + err.message);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="w-full max-w-md bg-white p-6 rounded shadow">
        <h2 className="text-2xl font-bold mb-4 text-center">
          {isRegister ? "Inscription" : "Connexion"}
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block mb-1">Email :</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              className="w-full px-3 py-2 border rounded" 
              placeholder="Votre email" 
            />
          </div>
          <div className="mb-4">
            <label className="block mb-1">Mot de passe :</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              className="w-full px-3 py-2 border rounded" 
              placeholder="Votre mot de passe" 
            />
          </div>
          {isRegister && (
            <div className="mb-4">
              <label className="block mb-1">Confirmer le mot de passe :</label>
              <input 
                type="password" 
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)} 
                required 
                className="w-full px-3 py-2 border rounded" 
                placeholder="Confirmez le mot de passe" 
              />
            </div>
          )}
          {error && <div className="mb-4 text-red-500 text-sm">{error}</div>}
          <button 
            type="submit" 
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          >
            {isRegister ? "S'inscrire" : "Se connecter"}
          </button>
        </form>
        <div className="mt-4 text-center">
          {isRegister ? (
            <p>Déjà un compte ?{" "}
              <button type="button" onClick={toggleMode} className="text-blue-600 hover:underline">
                Connectez-vous
              </button>
            </p>
          ) : (
            <p>Pas de compte ?{" "}
              <button type="button" onClick={toggleMode} className="text-blue-600 hover:underline">
                Inscrivez-vous
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default AuthPage;
