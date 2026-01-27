import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Auth from '../Auth';
import { BrowserRouter } from 'react-router-dom';

// Mock de useAuth
const mockSignIn = vi.fn();
const mockSignUp = vi.fn();
const mockSignInWithGoogle = vi.fn();

// Mock de auth-utils pour éviter l'erreur "must be used within an AuthProvider"
vi.mock('@/hooks/auth-utils', () => ({
  useAuth: () => ({
    signIn: mockSignIn,
    signUp: mockSignUp,
    signInWithGoogle: mockSignInWithGoogle,
    user: null,
    loading: false,
  }),
}));

// Mock de AuthProvider
vi.mock('@/hooks/auth-provider', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const renderWithProviders = (component: React.ReactNode) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

const setupAuthTest = () => {
  const user = userEvent.setup();
  renderWithProviders(<Auth />);
  return { user };
};

const fillLoginForm = async (user: ReturnType<typeof userEvent.setup>, email: string, pass: string) => {
  await user.type(screen.getByLabelText(/Email/i), email);
  await user.type(screen.getByLabelText(/Mot de passe/i), pass);
};

const fillSignupForm = async (user: ReturnType<typeof userEvent.setup>, email: string, pass: string, confirm: string) => {
  await user.click(screen.getByRole('tab', { name: /Inscription/i }));
  await user.type(screen.getByLabelText(/Email/i, { selector: '#email-signup' }), email);
  await user.type(screen.getByLabelText(/Mot de passe/i, { selector: '#password-signup' }), pass);
  await user.type(screen.getByLabelText(/Confirmer le mot de passe/i), confirm);
};

describe('Page Auth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('affiche le bouton Google', () => {
    setupAuthTest();
    expect(screen.getByText(/Continuer avec Google/i)).toBeInTheDocument();
  });

  it('affiche le champ de confirmation de mot de passe dans l\'onglet inscription', async () => {
    const { user } = setupAuthTest();
    await user.click(screen.getByRole('tab', { name: /Inscription/i }));
    await waitFor(() => {
      expect(screen.getByLabelText(/Confirmer le mot de passe/i)).toBeInTheDocument();
    });
  });

  it('gère la connexion (succès et erreur)', async () => {
    const { user } = setupAuthTest();
    
    // Succès
    mockSignIn.mockResolvedValueOnce({ data: {}, error: null });
    await fillLoginForm(user, 'test@example.com', 'password123');
    await user.click(screen.getByRole('button', { name: /Se connecter/i }));
    expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123');

    // Erreur
    mockSignIn.mockResolvedValueOnce({ data: null, error: { message: 'Invalid' } });
    await fillLoginForm(user, 'wrong@example.com', 'wrongpass');
    await user.click(screen.getByRole('button', { name: /Se connecter/i }));
    await waitFor(() => expect(mockSignIn).toHaveBeenCalledTimes(2));
  });

  it('gère l\'inscription (succès et erreur)', async () => {
    const { user } = setupAuthTest();
    
    // Succès
    mockSignUp.mockResolvedValueOnce({ data: {}, error: null });
    await fillSignupForm(user, 'new@example.com', 'password123', 'password123');
    await user.click(screen.getByRole('button', { name: /Créer mon compte/i }));
    expect(mockSignUp).toHaveBeenCalledWith('new@example.com', 'password123');

    // Erreur (déjà inscrit)
    mockSignUp.mockResolvedValueOnce({ data: null, error: { message: 'Exists' } });
    await fillSignupForm(user, 'existing@example.com', 'password123', 'password123');
    await user.click(screen.getByRole('button', { name: /Créer mon compte/i }));
    await waitFor(() => expect(mockSignUp).toHaveBeenCalledTimes(2));
  });

  it('valide les entrées et gère les erreurs (Email, Google, Mismatch)', async () => {
    const { user } = setupAuthTest();
    
    // Email invalide
    await fillLoginForm(user, 'invalid-email', 'pass');
    await user.click(screen.getByRole('button', { name: /Se connecter/i }));
    expect(mockSignIn).not.toHaveBeenCalled();

    // Google Sign In (API Error & Exception)
    mockSignInWithGoogle.mockResolvedValueOnce({ error: { message: 'Err' } });
    await user.click(screen.getByText(/Continuer avec Google/i));
    mockSignInWithGoogle.mockImplementationOnce(() => { throw new Error('Google Fail'); });
    await user.click(screen.getByText(/Continuer avec Google/i));
    expect(mockSignInWithGoogle).toHaveBeenCalledTimes(2);

    // Erreurs de soumission (Exception & Générique)
    mockSignIn.mockImplementationOnce(() => { throw new Error('Submit Fail'); });
    await fillLoginForm(user, 't@t.com', 'p');
    await user.click(screen.getByRole('button', { name: /Se connecter/i }));
    mockSignIn.mockResolvedValueOnce({ data: null, error: { message: 'Err' } });
    await user.click(screen.getByRole('button', { name: /Se connecter/i }));
    await waitFor(() => expect(mockSignIn).toHaveBeenCalledTimes(2));

    // Mismatch mot de passe
    await fillSignupForm(user, 't@t.com', 'p1', 'p2');
    await user.click(screen.getByRole('button', { name: /Créer mon compte/i }));
    expect(mockSignUp).not.toHaveBeenCalled();
  });
});

// Export mocks for use in other tests
export { mockSignIn, mockSignUp, mockSignInWithGoogle };
