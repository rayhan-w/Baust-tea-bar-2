import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { LogOut, Plus, Upload, X, Download, Search, Package, Clock, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import baustLogo from '@/assets/baust-logo.jpg';

interface Order {
  id: number;
  customer_name: string;
  customer_dept: string;
  customer_phone: string | null;
  designation: string | null;
  items: any[];
  total_amount: number;
  status: string;
  order_type: string;
  payment_method: string;
  payment_status: string;
  table_number: string;
  order_date: string;
}

interface MenuItem {
  id: number;
  name: string;
  description: string | null;
  category: string;
  price: number;
  image: string | null;
  is_available: boolean;
  available_days: string[];
}

const ALL_DAYS = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

const STATUS_CONFIG: Record<string, { label: string; class: string }> = {
  pending: { label: 'Pending', class: 'bg-amber-100 text-amber-800 border-amber-200' },
  confirmed: { label: 'Confirmed', class: 'bg-blue-100 text-blue-800 border-blue-200' },
  preparing: { label: 'Preparing', class: 'bg-violet-100 text-violet-800 border-violet-200' },
  completed: { label: 'Completed', class: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  cancelled: { label: 'Cancelled', class: 'bg-red-100 text-red-800 border-red-200' },
};

export default function AdminPage() {
  const navigate = useNavigate();
  const { user, logout, loading } = useAuth();
  const isTopManagement = localStorage.getItem('isTopManagement') === 'true';
  const [orders, setOrders] = useState<Order[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', description: '', category: 'snacks', price: '' });
  const [selectedDays, setSelectedDays] = useState<string[]>([...ALL_DAYS]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (loading) return;
    if (!user) { navigate('/login'); return; }
    if (user.role !== 'admin') { navigate('/menu'); return; }
    fetchOrders();
    fetchMenuItems();
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, [user, loading, navigate]);

  const fetchOrders = async () => {
    const { data } = await supabase.from('orders').select('*').order('order_date', { ascending: false });
    if (data) setOrders(data as any);
    setIsLoading(false);
  };

  const fetchMenuItems = async () => {
    const { data } = await supabase.from('menu_items').select('*');
    if (data) setMenuItems(data);
  };

  const updateOrderStatus = async (orderId: number, status: string) => {
    const updateData: any = { status };
    if (status === 'completed') updateData.completed_at = new Date().toISOString();
    const { error } = await supabase.from('orders').update(updateData).eq('id', orderId);
    if (!error) { toast.success('Order status updated'); fetchOrders(); }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleAddMenuItem = async () => {
    if (!newItem.name || !newItem.price) return;
    setIsUploading(true);
    let imageUrl: string | null = null;
    if (imageFile) {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('menu-images').upload(fileName, imageFile);
      if (uploadError) { toast.error('Image upload failed'); setIsUploading(false); return; }
      const { data: urlData } = supabase.storage.from('menu-images').getPublicUrl(fileName);
      imageUrl = urlData.publicUrl;
    }
    const { error } = await supabase.from('menu_items').insert({
      restaurant_id: 1, name: newItem.name, description: newItem.description || null,
      category: newItem.category, price: parseFloat(newItem.price), image: imageUrl, available_days: selectedDays,
    } as any);
    if (!error) {
      toast.success('Menu item added');
      setIsAddingItem(false);
      setNewItem({ name: '', description: '', category: 'snacks', price: '' });
      setSelectedDays([...ALL_DAYS]);
      setImageFile(null);
      setImagePreview(null);
      fetchMenuItems();
    }
    setIsUploading(false);
  };

  const toggleAvailability = async (item: MenuItem) => {
    const { error } = await supabase.from('menu_items').update({ is_available: !item.is_available }).eq('id', item.id);
    if (!error) fetchMenuItems();
  };

  const deleteMenuItem = async (id: number) => {
    const { error } = await supabase.from('menu_items').delete().eq('id', id);
    if (!error) { toast.success('Item deleted'); fetchMenuItems(); }
  };

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const matchesSearch = !searchQuery ||
        o.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.id.toString().includes(searchQuery) ||
        o.customer_dept.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [orders, searchQuery, statusFilter]);

  const todayOrders = orders.filter(o => o.order_date.split('T')[0] === new Date().toISOString().split('T')[0]);
  const pendingOrders = orders.filter(o => ['pending', 'confirmed', 'preparing'].includes(o.status));
  const completedToday = todayOrders.filter(o => o.status === 'completed').length;

  const downloadCSV = () => {
    const rows = filteredOrders.map(o => {
      const items = Array.isArray(o.items) ? o.items : [];
      return {
        'Order ID': o.id,
        'Date': new Date(o.order_date).toLocaleString(),
        'Customer': o.customer_name,
        'Department': o.customer_dept,
        'Phone': o.customer_phone || '',
        'Items': items.map((i: any) => `${i.name} x${i.quantity}`).join('; '),
        'Total (৳)': o.total_amount,
        'Status': o.status,
        'Payment': o.payment_method,
      };
    });
    const headers = Object.keys(rows[0] || {});
    const csv = [headers.join(','), ...rows.map(r => headers.map(h => `"${(r as any)[h]}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Orders downloaded');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-10 safe-top">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={baustLogo} alt="Logo" className="rounded-full w-9 h-9 object-cover border-2 border-primary/20" />
            <div>
              <h1 className="text-lg font-bold text-primary leading-tight">BAUST Tea Bar</h1>
              <p className="text-xs text-muted-foreground">{isTopManagement ? 'Top Management View' : 'Admin Dashboard'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:inline font-medium">{user?.name}</span>
            <Button variant="outline" size="sm" onClick={() => { localStorage.removeItem('isTopManagement'); logout(); }} className="gap-1.5">
              <LogOut className="h-4 w-4" /> Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-5 space-y-4 sm:space-y-5">
        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <Card className="border-l-4 border-l-primary">
            <CardContent className="p-2 sm:p-4">
              <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-3">
                <div className="hidden sm:block p-2 bg-primary/10 rounded-lg"><Package className="h-5 w-5 text-primary" /></div>
                <div>
                  <p className="text-xl sm:text-2xl font-bold text-center sm:text-left">{todayOrders.length}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground text-center sm:text-left">Today's Orders</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-amber-500">
            <CardContent className="p-2 sm:p-4">
              <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-3">
                <div className="hidden sm:block p-2 bg-amber-50 rounded-lg"><Clock className="h-5 w-5 text-amber-600" /></div>
                <div>
                  <p className="text-xl sm:text-2xl font-bold text-center sm:text-left">{pendingOrders.length}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground text-center sm:text-left">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-emerald-500">
            <CardContent className="p-2 sm:p-4">
              <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-3">
                <div className="hidden sm:block p-2 bg-emerald-50 rounded-lg"><CheckCircle className="h-5 w-5 text-emerald-600" /></div>
                <div>
                  <p className="text-xl sm:text-2xl font-bold text-center sm:text-left">{completedToday}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground text-center sm:text-left">Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="orders">
          {isTopManagement ? (
            <TabsList className="w-full grid grid-cols-1">
              <TabsTrigger value="orders">📋 Orders</TabsTrigger>
            </TabsList>
          ) : (
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="orders">📋 Orders</TabsTrigger>
              <TabsTrigger value="menu">🍽️ Menu Items</TabsTrigger>
            </TabsList>
          )}

          {/* Orders Tab */}
          <TabsContent value="orders" className="mt-4 space-y-4">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
              <div className="flex gap-2 flex-1 w-full sm:w-auto">
                <div className="relative flex-1 sm:max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, ID, dept..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[120px] sm:w-[140px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="preparing">Preparing</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button variant="outline" size="sm" onClick={downloadCSV} disabled={filteredOrders.length === 0} className="gap-1.5 text-xs">
                <Download className="h-4 w-4" /> <span className="hidden sm:inline">Download</span> CSV
              </Button>
            </div>

            {/* Orders Table */}
            <Card>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="w-[70px]">ID</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead className="hidden sm:table-cell">Department</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden md:table-cell">Date</TableHead>
                      {!isTopManagement && <TableHead className="text-right">Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                     <TableRow><TableCell colSpan={isTopManagement ? 6 : 7} className="text-center py-8 text-muted-foreground">Loading orders...</TableCell></TableRow>
                    ) : filteredOrders.length === 0 ? (
                     <TableRow><TableCell colSpan={isTopManagement ? 6 : 7} className="text-center py-8 text-muted-foreground">No orders found</TableCell></TableRow>
                    ) : filteredOrders.map(order => {
                      const items = Array.isArray(order.items) ? order.items : [];
                      const config = STATUS_CONFIG[order.status] || { label: order.status, class: '' };
                      return (
                        <TableRow key={order.id} className="hover:bg-muted/30">
                          <TableCell className="font-mono font-semibold text-xs">#{order.id}</TableCell>
                          <TableCell>
                            <div className="font-medium text-sm">{order.customer_name}</div>
                            <div className="text-xs text-muted-foreground sm:hidden">{order.customer_dept}</div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">{order.customer_dept}</TableCell>
                          <TableCell>
                            <div className="text-xs max-w-[200px] truncate" title={items.map((i: any) => `${i.name} x${i.quantity}`).join(', ')}>
                              {items.map((i: any) => `${i.name} x${i.quantity}`).join(', ')}
                            </div>
                          </TableCell>
                          
                          <TableCell>
                            <Badge variant="outline" className={`text-xs ${config.class}`}>{config.label}</Badge>
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                            {new Date(order.order_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })}
                            <br />
                            <span className="text-[10px]">{new Date(order.order_date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                          </TableCell>
                          {!isTopManagement && (
                          <TableCell className="text-right">
                            <div className="flex gap-1 justify-end flex-wrap">
                              {order.status === 'pending' && (
                                <>
                                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => updateOrderStatus(order.id, 'confirmed')}>Confirm</Button>
                                  <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={() => updateOrderStatus(order.id, 'cancelled')}>Cancel</Button>
                                </>
                              )}
                              {order.status === 'confirmed' && (
                                <Button size="sm" className="h-7 text-xs" onClick={() => updateOrderStatus(order.id, 'preparing')}>Prepare</Button>
                              )}
                              {order.status === 'preparing' && (
                                <Button size="sm" className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700" onClick={() => updateOrderStatus(order.id, 'completed')}>Complete</Button>
                              )}
                              {(order.status === 'completed' || order.status === 'cancelled') && (
                                <span className="text-xs text-muted-foreground italic">Done</span>
                              )}
                            </div>
                          </TableCell>
                          )}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              {filteredOrders.length > 0 && (
                <div className="px-4 py-3 border-t bg-muted/20 text-xs text-muted-foreground">
                  Showing {filteredOrders.length} of {orders.length} orders
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Menu Tab */}
          <TabsContent value="menu" className="mt-4 space-y-4">
            <div className="flex justify-end">
              <Button size="sm" onClick={() => setIsAddingItem(true)} className="gap-1.5"><Plus className="h-4 w-4" />Add Item</Button>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Add Menu Item Dialog */}
      <Dialog open={isAddingItem} onOpenChange={setIsAddingItem}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Menu Item</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Name</Label><Input value={newItem.name} onChange={e => setNewItem(p => ({ ...p, name: e.target.value }))} /></div>
            <div><Label>Description</Label><Textarea value={newItem.description} onChange={e => setNewItem(p => ({ ...p, description: e.target.value }))} /></div>
            <div><Label>Category</Label>
              <Select value={newItem.category} onValueChange={v => setNewItem(p => ({ ...p, category: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="snacks">Snacks</SelectItem>
                  <SelectItem value="beverages">Beverages</SelectItem>
                  <SelectItem value="sweets">Sweets</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Price (৳)</Label><Input type="number" value={newItem.price} onChange={e => setNewItem(p => ({ ...p, price: e.target.value }))} /></div>
            <div>
              <Label>Available Days</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {ALL_DAYS.map(day => (
                  <button key={day} type="button"
                    onClick={() => setSelectedDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day])}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                      selectedDays.includes(day) ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-muted-foreground border-border hover:border-primary'
                    }`}
                  >{day.slice(0, 3)}</button>
                ))}
              </div>
            </div>
            <div>
              <Label>Food Image</Label>
              {imagePreview ? (
                <div className="relative mt-2">
                  <img src={imagePreview} alt="Preview" className="w-full h-40 object-cover rounded-lg" />
                  <Button size="sm" variant="destructive" className="absolute top-2 right-2 h-7 w-7 p-0" onClick={() => { setImageFile(null); setImagePreview(null); }}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-32 mt-2 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary transition-colors">
                  <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground">Click to upload image</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
                </label>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsAddingItem(false); setImageFile(null); setImagePreview(null); setSelectedDays([...ALL_DAYS]); }}>Cancel</Button>
            <Button onClick={handleAddMenuItem} disabled={isUploading}>{isUploading ? 'Uploading...' : 'Add Item'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
