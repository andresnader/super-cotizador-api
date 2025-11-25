
import React, { useState } from 'react';
import { signIn } from '../services/google';

interface LoginProps {
  onLogin: (user: any) => void;
  isGoogleReady: boolean;
  error?: string | null;
}

const Login: React.FC<LoginProps> = ({ onLogin, isGoogleReady, error }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setLocalError(null);
    try {
      const user = await signIn();
      onLogin(user);
    } catch (err: any) {
      console.error("Login Failed", err);
      setLocalError("Error al iniciar sesión. " + (err.message || err.error || ""));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-90 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-sm text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Acceso al Cotizador</h2>
        <p className="text-gray-600 mb-6">Inicia sesión con tu cuenta de Google para acceder a los datos en Drive.</p>
        
        {(error || localError) && (
            <div className="mb-4 p-2 bg-red-100 text-red-700 rounded text-sm">
                {error || localError}
            </div>
        )}

        <button 
            onClick={handleGoogleLogin}
            disabled={!isGoogleReady || isLoading}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition duration-300 font-semibold flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
        >
            {isLoading ? (
                <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
            ) : (
                <i className="fab fa-google mr-3"></i>
            )}
            {isLoading ? 'Conectando...' : 'Iniciar Sesión con Google'}
        </button>
        
        {!isGoogleReady && !error && (
            <p className="text-xs text-gray-400 mt-4 animate-pulse">Cargando APIs de Google...</p>
        )}
      </div>
    </div>
  );
};

export default Login;
