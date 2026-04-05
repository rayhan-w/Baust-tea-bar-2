import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface CartItem {
  menuItemId: number;
  name: string;
  price: number;
  quantity: number;
  restaurantId: number;
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'customer';
  designation?: string;
  department?: string;
  phone?: string;
  restaurantId?: number;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, designation: string, department: string, phone?: string) => Promise<void>;
  logout: () => Promise<void>;
  cart: CartItem[];
  addToCart: (item: Omit<CartItem, 'quantity'>) => void;
  removeFromCart: (menuItemId: number) => void;
  updateCartQuantity: (menuItemId: number, quantity: number) => void;
  clearCart: () => void;
  cartTotal: number;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>(() => {
    const stored = localStorage.getItem('baust-cart');
    return stored ? JSON.parse(stored) : [];
  });

  useEffect(() => {
    localStorage.setItem('baust-cart', JSON.stringify(cart));
  }, [cart]);

  const fetchProfile = async (supabaseUser: SupabaseUser): Promise<UserProfile> => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', supabaseUser.id)
      .single();

    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', supabaseUser.id);

    const role = roles?.some(r => r.role === 'admin') ? 'admin' : 'customer';

    return {
      id: supabaseUser.id,
      name: profile?.name || (supabaseUser.user_metadata?.name as string) || '',
      email: profile?.email || supabaseUser.email || '',
      role,
      designation: profile?.designation ?? undefined,
      department: profile?.department ?? undefined,
      restaurantId: profile?.restaurant_id ?? undefined,
    };
  };

  useEffect(() => {
    let isMounted = true;

    const syncUser = async (sessionUser: SupabaseUser | null) => {
      if (!isMounted) return;

      if (!sessionUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      const profile = await fetchProfile(sessionUser);

      if (!isMounted) return;
      setUser(profile);
      setLoading(false);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      void syncUser(session?.user ?? null);
    });

    void supabase.auth.getSession().then(({ data: { session } }) => {
      void syncUser(session?.user ?? null);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const register = async (name: string, email: string, password: string, designation: string, department: string, phone?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    if (error) throw error;

    if (data.user) {
      await supabase.from('profiles').update({
        name,
        designation,
        department,
        phone: phone || null,
      }).eq('user_id', data.user.id);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setCart([]);
    localStorage.removeItem('baust-cart');
  };

  const addToCart = (item: Omit<CartItem, 'quantity'>) => {
    setCart(prev => {
      const existing = prev.find(i => i.menuItemId === item.menuItemId);
      if (existing) {
        return prev.map(i => i.menuItemId === item.menuItemId ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (menuItemId: number) => {
    setCart(prev => prev.filter(i => i.menuItemId !== menuItemId));
  };

  const updateCartQuantity = (menuItemId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(menuItemId);
    } else {
      setCart(prev => prev.map(i => i.menuItemId === menuItemId ? { ...i, quantity } : i));
    }
  };

  const clearCart = () => setCart([]);

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, cart, addToCart, removeFromCart, updateCartQuantity, clearCart, cartTotal }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
