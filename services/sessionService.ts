// Session Service - Gestión de sesión persistente con Google OAuth

interface SessionData {
    accessToken: string;
    expiresAt: number;
    userEmail: string;
    userName?: string;
    userPicture?: string;
    spreadsheetId: string | null;
    migrationCompleted: boolean;
}

const SESSION_KEY = 'google_session';
const MIGRATION_KEY = 'migration_completed';

export const sessionService = {
    /**
     * Guarda la sesión del usuario en localStorage
     */
    saveSession(token: string, expiresIn: number, userEmail: string, userPicture?: string, userName?: string): void {
        const expiresAt = Date.now() + (expiresIn * 1000);
        const existingData = this.getSession();

        const sessionData: SessionData = {
            accessToken: token,
            expiresAt,
            userEmail,
            userName,
            userPicture,
            spreadsheetId: existingData?.spreadsheetId || null,
            migrationCompleted: existingData?.migrationCompleted || false
        };

        localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
    },

    /**
     * Obtiene la sesión guardada
     */
    getSession(): SessionData | null {
        const data = localStorage.getItem(SESSION_KEY);
        if (!data) return null;

        try {
            return JSON.parse(data) as SessionData;
        } catch (e) {
            console.error('Error parsing session data:', e);
            return null;
        }
    },

    /**
     * Verifica si el token es válido (no expirado)
     */
    isTokenValid(): boolean {
        const session = this.getSession();
        if (!session) return false;

        // Considera el token inválido si expira en menos de 5 minutos
        const bufferTime = 5 * 60 * 1000;
        return Date.now() < (session.expiresAt - bufferTime);
    },

    /**
     * Obtiene el access token si es válido
     */
    getValidToken(): string | null {
        if (!this.isTokenValid()) return null;
        const session = this.getSession();
        return session?.accessToken || null;
    },

    /**
     * Guarda el spreadsheetId del usuario
     */
    saveSpreadsheetId(spreadsheetId: string): void {
        const session = this.getSession();
        if (!session) {
            console.warn('Cannot save spreadsheet ID without active session');
            return;
        }

        session.spreadsheetId = spreadsheetId;
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    },

    /**
     * Obtiene el spreadsheetId guardado
     */
    getSpreadsheetId(): string | null {
        const session = this.getSession();
        return session?.spreadsheetId || null;
    },

    /**
     * Verifica si es la primera sesión (no hay spreadsheetId)
     */
    isFirstSession(): boolean {
        return this.getSpreadsheetId() === null;
    },

    /**
     * Marca la migración como completada
     */
    markMigrationComplete(): void {
        const session = this.getSession();
        if (!session) return;

        session.migrationCompleted = true;
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
        localStorage.setItem(MIGRATION_KEY, 'true');
    },

    /**
     * Verifica si la migración ya fue completada
     */
    isMigrationCompleted(): boolean {
        const session = this.getSession();
        return session?.migrationCompleted || localStorage.getItem(MIGRATION_KEY) === 'true';
    },

    /**
     * Limpia la sesión (logout)
     */
    clearSession(): void {
        localStorage.removeItem(SESSION_KEY);
        // NO eliminamos MIGRATION_KEY para recordar que ya se migró
    },

    /**
     * Obtiene el email del usuario
     */
    getUserEmail(): string | null {
        const session = this.getSession();
        return session?.userEmail || null;
    }
};
