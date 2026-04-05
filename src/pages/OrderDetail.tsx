import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, CheckCircle, Clock, Package } from 'lucide-react';

export default function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [order, setOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const showSuccess = searchParams.get('success') === 'true';

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    fetchOrder();
    const interval = setInterval(fetchOrder, 5000);
    return () => clearInterval(interval);
  }, [user, id]);

  const fetchOrder = async () => {
    const { data } = await supabase.from('orders').select('*').eq('id', Number(id)).single();
    if (data) setOrder(data);
    setIsLoading(false);
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!order) return (
    <div className="min-h-screen flex items-center justify-center">
      <Card><CardContent className="py-12 text-center">
        <p className="text-xl text-muted-foreground">Order not found</p>
        <Button className="mt-4" onClick={() => navigate('/orders')}>Back to Orders</Button>
      </CardContent></Card>
    </div>
  );

  const items = Array.isArray(order.items) ? order.items : [];

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card shadow-sm">
        <div className="max-w-7xl mx-auto px-3 py-3">
          <Button variant="ghost" onClick={() => navigate('/orders')} size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />Back to Orders
          </Button>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-3 py-4">
        {showSuccess && (
          <Alert className="mb-4 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">Order placed successfully! Track your order status here.</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Order #{order.id}</CardTitle>
              <Badge>{order.status}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {new Date(order.order_date).toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' })}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Items</h3>
              {items.map((item: any, i: number) => (
                <div key={i} className="flex justify-between text-sm py-1">
                  <span>{item.name} x{item.quantity}</span>
                  <span>৳{item.price * item.quantity}</span>
                </div>
              ))}
              <div className="border-t pt-2 mt-2 flex justify-between font-bold">
                <span>Total</span><span className="text-primary">৳{order.total_amount}</span>
              </div>
            </div>

            <div className="text-sm space-y-1">
            </div>

            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              {order.status === 'completed' ? <CheckCircle className="h-5 w-5 text-green-600" /> :
               order.status === 'preparing' ? <Package className="h-5 w-5 text-purple-600" /> :
               <Clock className="h-5 w-5 text-yellow-600" />}
              <span className="text-sm font-medium capitalize">{order.status}</span>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
