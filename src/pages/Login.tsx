import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, ArrowLeft, UserPlus } from 'lucide-react';
import baustLogo from '@/assets/baust-logo.jpg';

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isAdminMode = searchParams.get('mode') === 'admin';
  const { login, register, user, loading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    const formData = new FormData(e.currentTarget);
    try {
      const email = formData.get('email') as string;
      await login(email, formData.get('password') as string);
      if (email === 'topmanagement@baustteabar.com') {
        localStorage.setItem('isTopManagement', 'true');
      } else {
        localStorage.removeItem('isTopManagement');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (loading || !user) return;
    navigate(user.role === 'admin' ? '/admin' : '/menu');
  }, [user, loading, navigate]);

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    const formData = new FormData(e.currentTarget);
    try {
      await register(
        formData.get('name') as string,
        formData.get('email') as string,
        formData.get('password') as string,
        formData.get('designation') as string,
        formData.get('department') as string,
        formData.get('phone') as string,
      );
      navigate('/menu');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-3">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center relative pt-8">
          <Button variant="ghost" size="sm" className="absolute top-3 left-3" onClick={() => navigate('/')}>
            <ArrowLeft className="mr-1 h-4 w-4" /><span className="text-sm">Back</span>
          </Button>
          <div className="flex justify-center mb-3">
            <img src={baustLogo} alt="BAUST Tea Bar Logo" className="rounded-full w-20 h-20" />
          </div>
          <CardTitle className="text-2xl font-extrabold text-primary">BAUST TEA BAR</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            {!isAdminMode && (
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>
            )}
            {isAdminMode && (
              <h2 className="text-center text-lg font-bold text-foreground mb-3">Management Login</h2>
            )}

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-3">
                {error && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input id="login-email" name="email" type="email" placeholder="your.email@example.com" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <Input id="login-password" name="password" type="password" placeholder="••••••••" required />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Logging in...' : 'Login'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4">
                <h2 className="text-2xl font-extrabold text-primary text-center" style={{ fontFamily: 'Georgia, serif' }}>REGISTRATION</h2>
                {error && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}
                <div className="space-y-1">
                  <Label htmlFor="register-name" className="text-xs font-bold tracking-wider uppercase text-foreground">Full Name</Label>
                  <Input id="register-name" name="name" type="text" required className="h-12 rounded-lg border-border" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="register-designation" className="text-xs font-bold tracking-wider uppercase text-foreground">Designation</Label>
                  <Input id="register-designation" name="designation" type="text" required className="h-12 rounded-lg border-border" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="register-department" className="text-xs font-bold tracking-wider uppercase text-foreground">Department</Label>
                  <Input id="register-department" name="department" type="text" required className="h-12 rounded-lg border-border" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="register-phone" className="text-xs font-bold tracking-wider uppercase text-foreground">Mobile Number</Label>
                  <Input id="register-phone" name="phone" type="tel" className="h-12 rounded-lg border-border" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="register-email" className="text-xs font-bold tracking-wider uppercase text-foreground">Email Address</Label>
                  <Input id="register-email" name="email" type="email" required className="h-12 rounded-lg border-border" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="register-password" className="text-xs font-bold tracking-wider uppercase text-foreground">Password</Label>
                  <Input id="register-password" name="password" type="password" required minLength={6} className="h-12 rounded-lg border-border" />
                </div>
                <Button type="submit" variant="dark" size="lg" className="w-full py-6 text-base rounded-xl uppercase tracking-wider" disabled={isLoading}>
                  <UserPlus className="mr-2 h-5 w-5" />
                  {isLoading ? 'Creating account...' : 'Create Account'}
                </Button>
                <p className="text-center text-sm text-muted-foreground">
                  Already have an account?{' '}
                  <button type="button" className="text-primary font-semibold hover:underline" onClick={() => document.querySelector<HTMLButtonElement>('[data-state="inactive"][value="login"]')?.click()}>
                    Login
                  </button>
                </p>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
