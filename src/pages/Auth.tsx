import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/auth-utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Store, Mail, Lock, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
});

const signupSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
  confirmPassword: z.string().min(6, 'La confirmation est requise'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      const { error } = await signInWithGoogle();
      if (error) {
        toast.error(error.message);
      }
    } catch {
      toast.error('Une erreur est survenue avec Google');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (type: 'login' | 'signup') => {
    try {
      const schema = type === 'login' ? loginSchema : signupSchema;
      const validation = schema.safeParse({ email, password, confirmPassword });
      if (!validation.success) {
        toast.error(validation.error.errors[0].message);
        return;
      }

      setLoading(true);

      let result;
      if (type === 'login') {
        result = await signIn(email, password);
      } else {
        result = await signUp(email, password);
      }
      const { error } = result;

      if (error) {
        let message = error.message;
        if (type === 'login' && error.message.includes('Invalid login credentials')) {
          message = 'Email ou mot de passe incorrect';
        } else if (type === 'signup' && error.message.includes('User already registered')) {
          message = 'Un compte existe déjà avec cet email';
        }
        toast.error(message);
        return;
      }

      toast.success(type === 'login' ? 'Connexion réussie !' : 'Compte créé avec succès !');
      navigate('/dashboard');
    } catch {
      toast.error('Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background p-4">
      <div className="w-full max-w-md">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour à l'accueil
        </Link>

        <Card className="border-2 shadow-xl">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-16 h-16 gradient-primary rounded-2xl flex items-center justify-center mb-4 shadow-lg">
              <Store className="h-8 w-8 text-primary-foreground" />
            </div>
            <CardTitle className="text-2xl font-display">CatalogueMaroc</CardTitle>
            <CardDescription>
              Créez et partagez votre kissariya de produits
            </CardDescription>
          </CardHeader>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mx-auto max-w-[90%]">
              <TabsTrigger value="login">Connexion</TabsTrigger>
              <TabsTrigger value="signup">Inscription</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <CardContent className="space-y-4 pt-4">
                <AuthField
                  id="email-login"
                  label="Email"
                  type="email"
                  placeholder="votre@email.com"
                  value={email}
                  onChange={setEmail}
                  icon={<Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />}
                />
                <AuthField
                  id="password-login"
                  label="Mot de passe"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={setPassword}
                  icon={<Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />}
                />
              </CardContent>
              <CardFooter className="flex flex-col gap-4">
                <Button 
                  className="w-full gradient-primary text-primary-foreground shadow-lg hover:opacity-90 transition-opacity"
                  onClick={() => handleSubmit('login')}
                  disabled={loading}
                >
                  {loading ? 'Connexion...' : 'Se connecter'}
                </Button>

                <SocialAuth loading={loading} onGoogleSignIn={handleGoogleSignIn} />
              </CardFooter>
            </TabsContent>

            <TabsContent value="signup">
              <CardContent className="space-y-4 pt-4">
                <AuthField
                  id="email-signup"
                  label="Email"
                  type="email"
                  placeholder="votre@email.com"
                  value={email}
                  onChange={setEmail}
                  icon={<Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />}
                />
                <AuthField
                  id="password-signup"
                  label="Mot de passe"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={setPassword}
                  icon={<Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />}
                />
                <AuthField
                  id="confirm-password"
                  label="Confirmer le mot de passe"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  icon={<Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />}
                />
              </CardContent>
              <CardFooter className="flex flex-col gap-4">
                <Button 
                  className="w-full gradient-primary text-primary-foreground shadow-lg hover:opacity-90 transition-opacity"
                  onClick={() => handleSubmit('signup')}
                  disabled={loading}
                >
                  {loading ? 'Création...' : 'Créer mon compte'}
                </Button>

                <SocialAuth loading={loading} onGoogleSignIn={handleGoogleSignIn} />
              </CardFooter>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}

function AuthField({ 
  id, 
  label, 
  type, 
  placeholder, 
  value, 
  onChange, 
  icon 
}: Readonly<{ 
  id: string; 
  label: string; 
  type: string; 
  placeholder: string; 
  value: string; 
  onChange: (val: string) => void; 
  icon: React.ReactNode;
}>) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        {icon}
        <Input
          id={id}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="pl-10"
        />
      </div>
    </div>
  );
}

function SocialAuth({ loading, onGoogleSignIn }: Readonly<{ loading: boolean; onGoogleSignIn: () => void }>) {
  return (
    <>
      <div className="relative w-full">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Ou
          </span>
        </div>
      </div>

      <Button 
        variant="outline" 
        className="w-full" 
        onClick={onGoogleSignIn}
        disabled={loading}
      >
        <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1c-4.3 0-7.99 2.48-9.82 6.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
        Continuer avec Google
      </Button>
    </>
  );
}
