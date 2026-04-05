import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Minus, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { user, cart, cartTotal, clearCart, updateCartQuantity } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!user) navigate('/login');
    if (cart.length === 0) navigate('/menu');
  }, [user, cart, navigate]);

  const handlePlaceOrder = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const restaurantId = cart[0]?.restaurantId || 1;
      const { data, error } = await supabase.from('orders').insert({
        user_id: user.id,
        restaurant_id: restaurantId,
        customer_name: user.name,
        customer_dept: user.department || '',
        designation: user.designation,
        items: cart.map(item => ({ menuItemId: item.menuItemId, name: item.name, price: item.price, quantity: item.quantity })),
        total_amount: cartTotal,
        payment_method: 'cod',
        table_number: '',
        order_type: 'instant',
      }).select().single();

      if (error) throw error;
      clearCart();
      toast.success('Order placed successfully!');
      navigate(`/orders/${data.id}?success=true`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to place order');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="flex-1 max-w-2xl mx-auto w-full px-3 sm:px-4 py-4 sm:py-8">
        {/* Cart Table */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-[1fr_auto_auto] gap-2 sm:gap-4 px-3 sm:px-5 py-3 border-b border-border">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">Item</span>
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground text-center w-20 sm:w-24">Qty</span>
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground text-right w-16 sm:w-20">Total</span>
          </div>

          {/* Items */}
          {cart.map(item => (
            <div key={item.menuItemId} className="grid grid-cols-[1fr_auto_auto] gap-2 sm:gap-4 px-3 sm:px-5 py-3 sm:py-4 border-b border-border items-center">
              <div>
                <p className="font-semibold text-sm sm:text-base text-foreground">{item.name}</p>
                <p className="text-xs text-muted-foreground uppercase">{format(new Date(), 'EEE, MMM d')}</p>
              </div>
              <div className="flex items-center gap-1 sm:gap-2 w-20 sm:w-24 justify-center">
                <button
                  onClick={() => updateCartQuantity(item.menuItemId, item.quantity - 1)}
                  className="w-6 h-6 sm:w-7 sm:h-7 rounded-md border border-border flex items-center justify-center text-muted-foreground hover:bg-muted"
                >
                  <Minus className="h-3 w-3" />
                </button>
                <span className="font-bold text-foreground w-5 sm:w-6 text-center text-sm">{item.quantity}</span>
                <button
                  onClick={() => updateCartQuantity(item.menuItemId, item.quantity + 1)}
                  className="w-6 h-6 sm:w-7 sm:h-7 rounded-md border border-border flex items-center justify-center text-muted-foreground hover:bg-muted"
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>
              <span className="font-bold text-primary text-right w-16 sm:w-20 text-sm sm:text-base">৳{item.price * item.quantity}</span>
            </div>
          ))}

          {/* Total */}
          <div className="grid grid-cols-[1fr_auto] gap-4 px-5 py-4">
            <span className="text-sm font-bold uppercase tracking-wider text-muted-foreground text-right">Total Payable:</span>
            <span className="font-bold text-xl text-primary text-right w-20">৳{cartTotal}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 sm:gap-4 mt-4 sm:mt-6">
          <Button
            variant="outline"
            size="lg"
            className="flex-1 py-6 uppercase tracking-widest font-bold rounded-xl"
            onClick={() => { clearCart(); navigate('/menu'); }}
          >
            Clear Cart
          </Button>
          <Button
            variant="dark"
            size="lg"
            className="flex-[1.5] py-6 uppercase tracking-widest font-bold rounded-xl"
            onClick={handlePlaceOrder}
            disabled={isLoading}
          >
            {isLoading ? 'Placing...' : 'Confirm Order'}
          </Button>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-8">
        <p className="text-xs tracking-[0.3em] text-muted-foreground">BAUST TEA BAR • SAIDPUR</p>
      </footer>
    </div>
  );
}
