import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Trash2, Minus, Plus, ShoppingCart, ArrowLeft } from 'lucide-react';
import { useEffect } from 'react';

export default function CartPage() {
  const navigate = useNavigate();
  const { user, cart, removeFromCart, updateCartQuantity, cartTotal } = useAuth();

  useEffect(() => {
    if (!user) navigate('/login');
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card shadow-sm">
        <div className="max-w-7xl mx-auto px-3 py-3">
          <Button variant="ghost" onClick={() => navigate('/menu')} size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />Back to Menu
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-3 py-4">
        <div className="flex items-center gap-2 mb-4">
          <ShoppingCart className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Your Cart</h1>
        </div>

        {cart.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <ShoppingCart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-xl text-muted-foreground mb-4">Your cart is empty</p>
              <Button onClick={() => navigate('/menu')}>Browse Menu</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <Card>
              <CardHeader><CardTitle>Cart Items ({cart.length})</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {cart.map(item => (
                  <div key={item.menuItemId} className="flex items-center gap-3 p-3 border rounded-lg">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm truncate">{item.name}</h3>
                      <p className="text-xs text-muted-foreground">৳{item.price} each</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="outline" onClick={() => updateCartQuantity(item.menuItemId, item.quantity - 1)} className="h-7 w-7 p-0">
                        <Minus className="h-3 w-3" />
                      </Button>
                      <Input type="number" value={item.quantity} onChange={e => updateCartQuantity(item.menuItemId, parseInt(e.target.value) || 0)} className="w-12 text-center text-xs h-7" min="0" />
                      <Button size="sm" variant="outline" onClick={() => updateCartQuantity(item.menuItemId, item.quantity + 1)} className="h-7 w-7 p-0">
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="w-16 text-right font-semibold text-sm">৳{item.price * item.quantity}</div>
                    <Button size="sm" variant="ghost" onClick={() => removeFromCart(item.menuItemId)} className="h-7 w-7 p-0">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex justify-between text-lg font-bold mb-4">
                  <span>Total:</span>
                  <span className="text-primary">৳{cartTotal}</span>
                </div>
                <Button className="w-full" size="lg" onClick={() => navigate('/checkout')}>
                  Proceed to Checkout
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
