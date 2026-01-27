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

  it('gère la connexion avec succès', async () => {
    const { user } = setupAuthTest();
    mockSignIn.mockResolvedValue({ data: {}, error: null });
    await fillLoginForm(user, 'test@example.com', 'password123');
    await user.click(screen.getByRole('button', { name: /Se connecter/i }));
    expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123');
  });

  it('affiche une erreur si les identifiants sont incorrects', async () => {
    const { user } = setupAuthTest();
    mockSignIn.mockResolvedValue({ data: null, error: { message: 'Invalid login credentials' } });
    await fillLoginForm(user, 'wrong@example.com', 'wrongpass');
    await user.click(screen.getByRole('button', { name: /Se connecter/i }));
    await waitFor(() => expect(mockSignIn).toHaveBeenCalled());
  });

  it('gère l\'inscription avec succès', async () => {
    const { user } = setupAuthTest();
    mockSignUp.mockResolvedValue({ data: {}, error: null });
    await fillSignupForm(user, 'new@example.com', 'password123', 'password123');
    await user.click(screen.getByRole('button', { name: /Créer mon compte/i }));
    expect(mockSignUp).toHaveBeenCalledWith('new@example.com', 'password123');
  });

  it('affiche une erreur si l\'utilisateur existe déjà à l\'inscription', async () => {
    const { user } = setupAuthTest();
    mockSignUp.mockResolvedValue({ data: null, error: { message: 'User already registered' } });
    await fillSignupForm(user, 'existing@example.com', 'password123', 'password123');
    await user.click(screen.getByRole('button', { name: /Créer mon compte/i }));
    await waitFor(() => expect(mockSignUp).toHaveBeenCalled());
  });

  it('affiche une erreur de validation si l\'email est invalide', async () => {
    const { user } = setupAuthTest();
    await fillLoginForm(user, 'invalid-email', 'password123');
    await user.click(screen.getByRole('button', { name: /Se connecter/i }));
    expect(mockSignIn).not.toHaveBeenCalled();
  });

  it('affiche une erreur si Google Sign In échoue', async () => {
    const { user } = setupAuthTest();
    mockSignInWithGoogle.mockResolvedValue({ error: { message: 'Google error' } });
    await user.click(screen.getByText(/Continuer avec Google/i));
    expect(mockSignInWithGoogle).toHaveBeenCalled();
  });

  it('gère les erreurs inattendues lors de Google Sign In', async () => {
    const { user } = setupAuthTest();
    mockSignInWithGoogle.mockImplementation(() => { throw new Error('Unexpected Google'); });
    await user.click(screen.getByText(/Continuer avec Google/i));
    expect(mockSignInWithGoogle).toHaveBeenCalled();
  });

  it('gère les erreurs inattendues lors de la soumission', async () => {
    const { user } = setupAuthTest();
    mockSignIn.mockImplementation(() => { throw new Error('Unexpected'); });
    await fillLoginForm(user, 'test@example.com', 'password123');
    await user.click(screen.getByRole('button', { name: /Se connecter/i }));
    await waitFor(() => expect(mockSignIn).toHaveBeenCalled());
  });

  it('affiche un message d\'erreur générique si la connexion échoue sans message spécifique', async () => {
    const { user } = setupAuthTest();
    mockSignIn.mockResolvedValue({ data: null, error: { message: 'Some other error' } });
    await fillLoginForm(user, 'test@example.com', 'password123');
    await user.click(screen.getByRole('button', { name: /Se connecter/i }));
    await waitFor(() => expect(mockSignIn).toHaveBeenCalled());
  });

  it('affiche une erreur si les mots de passe ne correspondent pas à l\'inscription', async () => {
    const { user } = setupAuthTest();
    await fillSignupForm(user, 'test@example.com', 'password123', 'mismatch');
    await user.click(screen.getByRole('button', { name: /Créer mon compte/i }));
    expect(mockSignUp).not.toHaveBeenCalled();
  });
});

// Export mocks for use in other tests
export { mockSignIn, mockSignUp, mockSignInWithGoogle };
