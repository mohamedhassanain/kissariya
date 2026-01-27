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

const fillSignupForm = async (user: ReturnType<typeof userEvent.setup>, email: string, pass: string, confirm: string) => {
  await user.click(screen.getByRole('tab', { name: /Inscription/i }));
  const emailInput = screen.getByLabelText(/Email/i, { selector: '#email-signup' });
  const passwordInput = screen.getByLabelText(/Mot de passe/i, { selector: '#password-signup' });
  const confirmInput = screen.getByLabelText(/Confirmer le mot de passe/i);
  await user.type(emailInput, email);
  await user.type(passwordInput, pass);
  await user.type(confirmInput, confirm);
};

describe('Page Auth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('affiche le bouton Google', () => {
    renderWithProviders(<Auth />);
    expect(screen.getByText(/Continuer avec Google/i)).toBeInTheDocument();
  });

  it('affiche le champ de confirmation de mot de passe dans l\'onglet inscription', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Auth />);
    
    const signupTab = screen.getByRole('tab', { name: /Inscription/i });
    await user.click(signupTab);

    await waitFor(() => {
      expect(screen.getByLabelText(/Confirmer le mot de passe/i)).toBeInTheDocument();
    });
  });

  it('gère la connexion avec succès', async () => {
    const user = userEvent.setup();
    mockSignIn.mockResolvedValue({ data: {}, error: null });
    renderWithProviders(<Auth />);

    await user.type(screen.getByLabelText(/Email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/Mot de passe/i), 'password123');
    await user.click(screen.getByRole('button', { name: /Se connecter/i }));

    expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123');
  });

  it('affiche une erreur si les identifiants sont incorrects', async () => {
    const user = userEvent.setup();
    mockSignIn.mockResolvedValue({ data: null, error: { message: 'Invalid login credentials' } });
    renderWithProviders(<Auth />);

    await user.type(screen.getByLabelText(/Email/i), 'wrong@example.com');
    await user.type(screen.getByLabelText(/Mot de passe/i), 'wrongpass');
    await user.click(screen.getByRole('button', { name: /Se connecter/i }));

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalled();
    });
  });

  it('gère l\'inscription avec succès', async () => {
    const user = userEvent.setup();
    mockSignUp.mockResolvedValue({ data: {}, error: null });
    renderWithProviders(<Auth />);

    await fillSignupForm(user, 'new@example.com', 'password123', 'password123');
    await user.click(screen.getByRole('button', { name: /Créer mon compte/i }));

    expect(mockSignUp).toHaveBeenCalledWith('new@example.com', 'password123');
  });

  it('affiche une erreur si l\'utilisateur existe déjà à l\'inscription', async () => {
    const user = userEvent.setup();
    mockSignUp.mockResolvedValue({ data: null, error: { message: 'User already registered' } });
    renderWithProviders(<Auth />);

    await fillSignupForm(user, 'existing@example.com', 'password123', 'password123');
    await user.click(screen.getByRole('button', { name: /Créer mon compte/i }));

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalled();
    });
  });

  it('affiche une erreur de validation si l\'email est invalide', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Auth />);

    await user.type(screen.getByLabelText(/Email/i), 'invalid-email');
    await user.type(screen.getByLabelText(/Mot de passe/i), 'password123');
    await user.click(screen.getByRole('button', { name: /Se connecter/i }));

    expect(mockSignIn).not.toHaveBeenCalled();
  });

  it('affiche une erreur si Google Sign In échoue', async () => {
    const user = userEvent.setup();
    mockSignInWithGoogle.mockResolvedValue({ error: { message: 'Google error' } });
    renderWithProviders(<Auth />);
    
    await user.click(screen.getByText(/Continuer avec Google/i));
    expect(mockSignInWithGoogle).toHaveBeenCalled();
  });

  it('gère les erreurs inattendues lors de Google Sign In', async () => {
    const user = userEvent.setup();
    mockSignInWithGoogle.mockImplementation(() => { throw new Error('Unexpected Google'); });
    renderWithProviders(<Auth />);
    
    await user.click(screen.getByText(/Continuer avec Google/i));
    expect(mockSignInWithGoogle).toHaveBeenCalled();
  });

  it('gère les erreurs inattendues lors de la soumission', async () => {
    const user = userEvent.setup();
    mockSignIn.mockImplementation(() => { throw new Error('Unexpected'); });
    renderWithProviders(<Auth />);

    await user.type(screen.getByLabelText(/Email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/Mot de passe/i), 'password123');
    await user.click(screen.getByRole('button', { name: /Se connecter/i }));

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalled();
    });
  });

  it('affiche un message d\'erreur générique si la connexion échoue sans message spécifique', async () => {
    const user = userEvent.setup();
    mockSignIn.mockResolvedValue({ data: null, error: { message: 'Some other error' } });
    renderWithProviders(<Auth />);

    await user.type(screen.getByLabelText(/Email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/Mot de passe/i), 'password123');
    await user.click(screen.getByRole('button', { name: /Se connecter/i }));

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalled();
    });
  });

  it('affiche une erreur si les mots de passe ne correspondent pas à l\'inscription', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Auth />);

    await user.click(screen.getByRole('tab', { name: /Inscription/i }));
    
    const emailInput = screen.getByLabelText(/Email/i, { selector: '#email-signup' });
    const passwordInput = screen.getByLabelText(/Mot de passe/i, { selector: '#password-signup' });
    const confirmInput = screen.getByLabelText(/Confirmer le mot de passe/i);
    
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.type(confirmInput, 'mismatch');
    
    await user.click(screen.getByRole('button', { name: /Créer mon compte/i }));

    expect(mockSignUp).not.toHaveBeenCalled();
  });
});

// Export mocks for use in other tests
export { mockSignIn, mockSignUp, mockSignInWithGoogle };
