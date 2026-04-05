import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface QROrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QROrderDialog({ open, onOpenChange }: QROrderDialogProps) {
  const menuUrl = `${window.location.origin}/menu`;

  // Generate QR code using a public API
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(menuUrl)}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Scan QR Code to Order</DialogTitle>
          <DialogDescription>
            Scan this QR code with your phone to access the BAUST Tea Bar menu.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center space-y-6 py-6">
          <div className="bg-card p-4 rounded-lg shadow-sm">
            <img src={qrImageUrl} alt="QR Code for menu" className="w-64 h-64" />
          </div>
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">Or visit directly:</p>
            <a href={menuUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline break-all">
              {menuUrl}
            </a>
          </div>
          <Button variant="outline" onClick={() => window.print()} className="w-full">
            Print QR Code
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
