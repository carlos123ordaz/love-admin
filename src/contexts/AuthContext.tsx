import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
    onAuthStateChanged,
    signInWithPopup,
    signOut as firebaseSignOut,
    type User as FirebaseUser,
} from 'firebase/auth';
import { auth, googleProvider } from '../utils/firebase';
import { authApi } from '../api';
import type { User } from '../types';

interface AuthState {
    firebaseUser: FirebaseUser | null;
    dbUser: (User & { isAdmin: boolean }) | null;
    loading: boolean;
    error: string | null;
}

interface AuthContextType extends AuthState {
    signInWithGoogle: () => Promise<void>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, setState] = useState<AuthState>({
        firebaseUser: null,
        dbUser: null,
        loading: true,
        error: null,
    });

    const fetchDbUser = useCallback(async () => {
        try {
            const { data } = await authApi.getMe();
            if (data.success && data.data.isAdmin) {
                setState((prev) => ({ ...prev, dbUser: data.data, error: null, loading: false }));
            } else {
                setState((prev) => ({
                    ...prev,
                    dbUser: null,
                    error: 'No tienes permisos de administrador.',
                    loading: false,
                }));
                await firebaseSignOut(auth);
            }
        } catch {
            setState((prev) => ({
                ...prev,
                dbUser: null,
                error: 'Error al verificar permisos.',
                loading: false,
            }));
            await firebaseSignOut(auth);
        }
    }, []);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                setState((prev) => ({ ...prev, firebaseUser, loading: true, error: null }));
                await fetchDbUser();
            } else {
                setState({ firebaseUser: null, dbUser: null, loading: false, error: null });
            }
        });
        return () => unsubscribe();
    }, [fetchDbUser]);

    const signInWithGoogle = async () => {
        setState((prev) => ({ ...prev, loading: true, error: null }));
        try {
            await signInWithPopup(auth, googleProvider);
        } catch {
            setState((prev) => ({ ...prev, loading: false, error: 'Error al iniciar sesión' }));
        }
    };

    const signOut = async () => {
        await firebaseSignOut(auth);
        setState({ firebaseUser: null, dbUser: null, loading: false, error: null });
    };

    return (
        <AuthContext.Provider value={{ ...state, signInWithGoogle, signOut }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
};