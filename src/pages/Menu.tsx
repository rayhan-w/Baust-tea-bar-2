import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Coffee, ShoppingCart, Clock, LogOut } from 'lucide-react';
import { QROrderDialog } from '@/components/QROrderDialog';
import { toast } from 'sonner';
import baustLogo from '@/assets/baust-logo.jpg';
import { format, addDays } from 'date-fns';

interface MenuItem {
  id: number;
  name: string;
  description: string | null;
  category: string;
  price: number;
  image: string | null;
  is_available: boolean;
  restaurant_id: number;
  available_days: string[];
}

type MainTab = 'order' | 'cart' | 'history';

export default function MenuPage() {
  const navigate = useNavigate();
  const { user, logout, cart, addToCart, removeFromCart, updateCartQuantity, clearCart, cartTotal, loading } = useAuth();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [activeTab, setActiveTab] = useState<MainTab>('order');
  const [selectedDay, setSelectedDay] = useState(0);
  const [showQR, setShowQR] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!user) { navigate('/login'); return; }
    if (user.role === 'admin') { navigate('/admin'); return; }
    fetchMenuItems();
  }, [user, loading, navigate]);

  const fetchMenuItems = async () => {
    setIsLoading(true);
    const { data, error } = await supabase.from('menu_items').select('*').eq('is_available', true);
    if (!error && data) setMenuItems(data);
    setIsLoading(false);
  };

  const handleAddToCart = (item: MenuItem) => {
    addToCart({ menuItemId: item.id, name: item.name, price: item.price, restaurantId: item.restaurant_id });
    toast.success(`${item.name} added to cart!`, { description: `৳${item.price}`, duration: 2000 });
  };

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Generate day pills
  const days = Array.from({ length: 5 }, (_, i) => {
    const date = addDays(new Date(), i);
    const dayName = format(date, 'EEEE').toUpperCase();
    if (i === 0) return { label: 'TODAY', sub: dayName };
    if (i === 1) return { label: 'TOMORROW', sub: dayName };
    return { label: format(date, 'EEE, MMM d').toUpperCase(), sub: dayName };
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <Coffee className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-primary leading-tight">BAUST TEA BAR</h1>
              <p className="text-xs text-primary font-medium uppercase">{user?.name}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="text-muted-foreground font-semibold uppercase tracking-wider text-xs gap-2" onClick={logout}>
            <LogOut className="h-4 w-4" />Logout
          </Button>
        </div>

        {/* Tabs */}
        <div className="max-w-7xl mx-auto grid grid-cols-3 border-b border-border">
          <button
            onClick={() => setActiveTab('order')}
            className={`py-3 text-xs sm:text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'order' ? 'border-destructive text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          >
            <Coffee className="h-4 w-4" />Order Now
          </button>
          <button
            onClick={() => { setActiveTab('cart'); navigate('/cart'); }}
            className={`py-3 text-xs sm:text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'cart' ? 'border-destructive text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          >
            <ShoppingCart className="h-4 w-4" />My Cart
            {cartItemCount > 0 && <span className="bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">{cartItemCount}</span>}
          </button>
          <button
            onClick={() => { setActiveTab('history'); navigate('/orders'); }}
            className={`py-3 text-xs sm:text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'history' ? 'border-destructive text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          >
            <Clock className="h-4 w-4" />History
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6 safe-bottom">
        {/* Day selector */}
        <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-3 sm:pb-4 mb-4 sm:mb-6 scrollbar-hide">
          {days.map((day, i) => (
            <button
              key={i}
              onClick={() => setSelectedDay(i)}
              className={`flex-shrink-0 px-3 sm:px-5 py-2 sm:py-3 rounded-xl text-center transition-all ${
                selectedDay === i
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'bg-card border border-border text-foreground hover:border-primary'
              }`}
            >
              <div className="text-[10px] font-medium tracking-wider">{day.label}</div>
              <div className="text-sm font-bold">{day.sub}</div>
            </button>
          ))}
        </div>

        {/* Menu items grid */}
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Loading menu...</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
            {menuItems.filter(item => {
              const dayName = format(addDays(new Date(), selectedDay), 'EEEE');
              return !item.available_days || item.available_days.includes(dayName);
            }).map(item => (
              <Card key={item.id} className="overflow-hidden border border-border">
                {item.image && (
                  <div className="aspect-[4/3] overflow-hidden">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" loading="lazy" />
                  </div>
                )}
                <CardContent className="p-3 sm:p-4">
                  <h3 className="font-bold text-sm sm:text-lg text-foreground line-clamp-1">{item.name}</h3>
                  <p className="text-primary font-bold text-base sm:text-xl mt-1">৳{item.price}</p>
                  <Button
                    variant="dark"
                    size="sm"
                    className="w-full mt-2 sm:mt-3 py-2 sm:py-5 text-xs sm:text-sm uppercase tracking-wider font-bold rounded-lg"
                    onClick={() => handleAddToCart(item)}
                  >
                    Add to Cart
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <QROrderDialog open={showQR} onOpenChange={setShowQR} />
    </div>
  );
}
