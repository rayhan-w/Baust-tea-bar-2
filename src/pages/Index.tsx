import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import { Coffee, Settings, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import baustLogo from "@/assets/baust-logo.jpg";

const Index = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading || !user) return;
    navigate(user.role === 'admin' ? '/admin' : '/menu');
  }, [user, loading, navigate]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="flex w-full max-w-md flex-col items-center gap-6">
        <img src={baustLogo} alt="BAUST Tea Bar Logo" width={180} height={180} className="rounded-full shadow-md" />

        <div className="text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-primary md:text-5xl" style={{ fontFamily: 'Georgia, serif' }}>BAUST TEA BAR</h1>
          <p className="mt-3 text-muted-foreground">Order delicious snacks, beverages, and sweets from BAUST Tea Bar.</p>
        </div>

        <div className="mt-4 flex w-full flex-col gap-3">
          <Button variant="tea" size="lg" className="w-full py-6 text-base rounded-xl" onClick={() => navigate('/login')}>
            <Coffee className="mr-2 h-5 w-5" />Teachers & Officers Login
          </Button>
          <Button variant="dark" size="lg" className="w-full py-6 text-base rounded-xl" onClick={() => navigate('/login?mode=admin')}>
            <Settings className="mr-2 h-5 w-5" />Management Section
          </Button>
          <Button variant="brown" size="lg" className="w-full py-6 text-base rounded-xl" onClick={() => navigate('/menu')}>
            <QrCode className="mr-2 h-5 w-5" />Scan to View Menu
          </Button>
        </div>

        <p className="mt-8 text-xs tracking-widest text-muted-foreground">BAUST • E&ME CANTONMENT • SAIDPUR</p>
      </div>
    </div>
  );
};

export default Index;
