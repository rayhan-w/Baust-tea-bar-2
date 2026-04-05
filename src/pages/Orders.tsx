import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Package, Clock, CheckCircle, XCircle } from 'lucide-react';

interface Order {
  id: number;
  items: any[];
  total_amount: number;
  status: string;
  payment_method: string;
  payment_status: string;
  order_date: string;
}

const statusConfig: Record<string, { icon: any; color: string }> = {
  pending: { icon: Clock, color: 'bg-yellow-100 text-yellow-800' },
  confirmed: { icon: Package, color: 'bg-blue-100 text-blue-800' },
  preparing: { icon: Package, color: 'bg-purple-100 text-purple-800' },
  completed: { icon: CheckCircle, color: 'bg-green-100 text-green-800' },
  cancelled: { icon: XCircle, color: 'bg-red-100 text-red-800' },
};

export default function OrdersPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, [user, navigate]);

  const fetchOrders = async () => {
    const { data } = await supabase.from('orders').select('*').order('order_date', { ascending: false });
    if (data) setOrders(data as any);
    setIsLoading(false);
  };

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
          <Package className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">My Orders</h1>
        </div>

        {isLoading ? (
          <div className="text-center py-12">Loading orders...</div>
        ) : orders.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-xl text-muted-foreground mb-4">No orders yet</p>
              <Button onClick={() => navigate('/menu')}>Start Ordering</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {orders.map(order => {
              const config = statusConfig[order.status] || statusConfig.pending;
              const Icon = config.icon;
              const items = Array.isArray(order.items) ? order.items : [];
              return (
                <Card key={order.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate(`/orders/${order.id}`)}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center gap-2 text-base">
                          <Icon className="h-4 w-4" />Order #{order.id}
                        </CardTitle>
                        <CardDescription className="text-xs">
                          {new Date(order.order_date).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                        </CardDescription>
                      </div>
                      <Badge className={config.color}>{order.status}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xs text-muted-foreground mb-2">
                      {items.map((i: any) => i.name).join(', ')}
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t">
                      <span className="text-sm">Payment: {order.payment_method}</span>
                      <span className="text-lg font-bold text-primary">৳{order.total_amount}</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
