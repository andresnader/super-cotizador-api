
import React, { useState } from 'react';
import { signIn } from '../services/google';
import { AuthMode } from '../types';

interface LoginProps {
  onLogin: (user: any, mode: AuthMode) => void;
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
      onLogin(user, 'google');
    } catch (err: any) {
      console.error("Login Failed", err);
      setLocalError("Error al iniciar sesión con Google. " + (err.message || err.error || ""));
    } finally {
      setIsLoading(false);
    }
  };

  const handleLocalLogin = () => {
      // Mock user for local mode
      const localUser = { name: 'Usuario Local', email: 'local@device', picture: '' };
      onLogin(localUser, 'local');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center p-4">
      <div className="bg-white p-8 md:p-12 rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col md:flex-row overflow-hidden">
        
        {/* Left Side: Intro */}
        <div className="md:w-1/2 md:pr-8 flex flex-col justify-center border-b md:border-b-0 md:border-r border-gray-200 pb-8 md:pb-0 mb-8 md:mb-0">
            <h1 className="text-4xl font-extrabold text-gray-800 mb-4">Bienvenido a <br/><span className="text-indigo-600">QuoteTool Pro</span></h1>
            <p className="text-gray-600 mb-6 text-lg leading-relaxed">
                La herramienta integral para gestionar tus cotizaciones, clientes y servicios.
            </p>
            <p className="text-gray-500 text-sm">
                Elige cómo deseas trabajar hoy. Puedes sincronizar tus datos en la nube o trabajar de forma privada en este dispositivo.
            </p>
            {(error || localError) && (
                <div className="mt-6 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                    <i className="fas fa-exclamation-circle mr-2"></i>
                    {error || localError}
                </div>
            )}
        </div>

        {/* Right Side: Options */}
        <div className="md:w-1/2 md:pl-8 flex flex-col justify-center space-y-6">
            
            {/* Option 1: Google */}
            <div className="group relative">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                <button 
                    onClick={handleGoogleLogin}
                    disabled={!isGoogleReady || isLoading}
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
                        <p className="text-sm text-gray-500">Sincroniza con Drive, Sheets y Docs. Ideal para equipos.</p>
                        {!isGoogleReady && !error && <p className="text-xs text-orange-500 mt-1">Cargando servicios...</p>}
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
      
      <div className="fixed bottom-4 text-center text-gray-400 text-xs">
        &copy; {new Date().getFullYear()} Ameizin Digital Solutions
      </div>
    </div>
  );
};

export default Login;
