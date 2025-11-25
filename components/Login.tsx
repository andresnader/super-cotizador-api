import React, { useState, useEffect } from 'react';
import { initGapi, initGis, requestAccessToken, setAccessToken, getUserInfo } from '../services/googleAuth';

interface LoginProps {
  onLogin: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  console.log('Login component rendering');
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    console.log('Login useEffect running');
    const initialize = async () => {
      try {
        console.log('Initializing Google APIs...');
        // Initialize Google APIs
        await initGapi();
        console.log('GAPI initialized');
        await initGis(handleTokenResponse);
        console.log('GIS initialized');
        setIsInitializing(false);
      } catch (err) {
        console.error('Failed to initialize Google APIs:', err);
        setError('Error al inicializar Google APIs. Por favor recarga la página.');
        setIsInitializing(false);
      }
    };

    initialize();
  }, []);

  const handleTokenResponse = async (tokenResponse: any) => {
    if (tokenResponse.error) {
      setError('Error de autenticación: ' + tokenResponse.error);
      return;
    }

    try {
      // Set the access token
      setAccessToken(tokenResponse);

      // Get user info
      const userInfo = await getUserInfo();
      setUserEmail(userInfo.email);

      // Call the onLogin callback
      onLogin();
    } catch (err) {
      console.error('Error during authentication:', err);
      setError('Error al obtener información del usuario.');
    }
  };

  const handleGoogleLogin = () => {
    setError(null);
    try {
      requestAccessToken('consent');
    } catch (err) {
      console.error('Error requesting access token:', err);
      setError('Error al solicitar acceso. Por favor intenta de nuevo.');
    }
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">QuoteTool Pro</h1>
          <p className="text-gray-600">Sistema de Cotizaciones</p>
        </div>

        {isInitializing ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            <p className="mt-4 text-gray-600">Inicializando...</p>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <p className="text-sm text-gray-600 text-center mb-4">
                Inicia sesión con tu cuenta de Google para acceder al sistema
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {userEmail && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-700 text-sm">
                  <i className="fas fa-check-circle mr-2"></i>
                  Conectado como: {userEmail}
                </p>
              </div>
            )}

            <button
              onClick={handleGoogleLogin}
              disabled={isInitializing}
              className="w-full bg-white border-2 border-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-50 transition duration-300 font-semibold flex items-center justify-center shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Iniciar sesión con Google
            </button>

            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500">
                <i className="fas fa-shield-alt mr-1"></i>
                Conexión segura con Google OAuth 2.0
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Login;
