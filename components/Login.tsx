
import React, { useState } from 'react';
import { signInWithGoogle } from '../services/firebaseAuth';
import { AuthMode } from '../types';

interface LoginProps {
  onLogin: (user: any, mode: AuthMode) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleFirebaseLogin = async () => {
    setIsLoading(true);
    setLocalError(null);
    try {
      const { userInfo } = await signInWithGoogle();
      onLogin(userInfo, 'firebase');
    } catch (err: any) {
      console.error("Login Failed", err);
      if (err.code === 'auth/popup-closed-by-user') {
        setLocalError("Se cerró la ventana de inicio de sesión.");
      } else if (err.code === 'auth/network-request-failed') {
        setLocalError("Error de red. Verifica tu conexión a internet.");
      } else {
        setLocalError("Error al iniciar sesión con Google. " + (err.message || ""));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLocalLogin = () => {
    const localUser = { name: 'Usuario Local', email: 'local@device', picture: '' };
    onLogin(localUser, 'local');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center p-4">
      <div className="bg-white p-8 md:p-12 rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col md:flex-row overflow-hidden">

        {/* Left Side: Intro */}
        <div className="md:w-1/2 md:pr-8 flex flex-col justify-center border-b md:border-b-0 md:border-r border-gray-200 pb-8 md:pb-0 mb-8 md:mb-0">
          <div className="flex items-start mb-4">
            <img
              src={import.meta.env.BASE_URL + 'ameizin-img.png'}
              alt="Ameizin Logo"
              className="w-10 h-10 rounded mr-3 flex-shrink-0"
            />
            <h1 className="text-2xl font-bold text-gray-800">Cotizador integral para emprendedores</h1>
          </div>
          <p className="text-gray-600 text-base leading-relaxed">
            He diseñado esta herramienta pensando en nuestras necesidades para poder salir adelante. He dedicado horas a culminar este cotizador con sistema de gestión de tu emprendimiento, los datos son únicamente tuyos, eres más que bienvenido a usarla siempre que la necesites.
          </p>
          {localError && (
            <div className="mt-6 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              <i className="fas fa-exclamation-circle mr-2"></i>
              {localError}
            </div>
          )}
        </div>

        {/* Right Side: Options */}
        <div className="md:w-1/2 md:pl-8 flex flex-col justify-center space-y-6">

          {/* Option 1: Firebase (Google) */}
          <div className="group relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
            <button
              onClick={handleFirebaseLogin}
              disabled={isLoading}
              className="relative w-full bg-white p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all text-left disabled:opacity-70 disabled:cursor-not-allowed flex items-center"
            >
              <div className="bg-blue-50 p-3 rounded-full mr-4">
                {isLoading ? (
                  <span className="inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <i className="fab fa-google text-2xl text-blue-600"></i>
                )}
              </div>
              <div>
                <h3 className="font-bold text-gray-800 text-lg">Modo Nube (Google)</h3>
                <p className="text-sm text-gray-500">Sincroniza tus datos en la nube. Accesible desde cualquier dispositivo.</p>
              </div>
            </button>
          </div>

          {/* Option 2: Local */}
          <div className="group relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-gray-400 to-gray-600 rounded-lg blur opacity-10 group-hover:opacity-30 transition duration-1000 group-hover:duration-200"></div>
            <button
              onClick={handleLocalLogin}
              className="relative w-full bg-white p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all text-left flex items-center"
            >
              <div className="bg-gray-100 p-3 rounded-full mr-4">
                <i className="fas fa-laptop text-2xl text-gray-600"></i>
              </div>
              <div>
                <h3 className="font-bold text-gray-800 text-lg">Modo Local</h3>
                <p className="text-sm text-gray-500">Datos privados en este dispositivo. Sin conexión a internet.</p>
              </div>
            </button>
          </div>

        </div>
      </div>

      <div className="fixed bottom-4 text-center text-gray-500 text-sm">
        Diseñado por Andrés Nader con amor para ti
      </div>
    </div>
  );
};

export default Login;
