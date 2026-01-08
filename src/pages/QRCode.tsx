import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useShop } from '@/hooks/useShop';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Download, Share2, Copy } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';

export default function QRCode() {
  const { user, loading: authLoading } = useAuth();
  const { shop, hasShop, isLoading: shopLoading } = useShop();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!authLoading && !shopLoading && user && !hasShop) {
      navigate('/setup');
    }
  }, [user, authLoading, shopLoading, hasShop, navigate]);

  const catalogUrl = shop ? `${window.location.origin}/c/${shop.slug}` : '';

  const handleDownload = () => {
    const svg = document.getElementById('qr-code-svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');
      
      const downloadLink = document.createElement('a');
      downloadLink.download = `qrcode-${shop?.slug}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
    toast.success('QR Code téléchargé !');
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(catalogUrl);
    toast.success('Lien copié !');
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: shop?.name,
        text: `Découvrez notre kissariya : ${shop?.name}`,
        url: catalogUrl,
      });
    } else {
      handleCopyLink();
    }
  };

  if (authLoading || shopLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-md mx-auto">
          <Skeleton className="h-10 w-48 mb-6" />
          <Skeleton className="h-[400px]" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <div className="max-w-md mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/dashboard">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="text-2xl font-display font-bold">QR Code</h1>
        </div>

        <Card className="border-2">
          <CardHeader className="text-center">
            <CardTitle>{shop?.name}</CardTitle>
            <CardDescription>
              Scannez ce QR code pour accéder à la kissariya
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-6">
            {/* QR Code */}
            <div className="p-6 bg-white rounded-2xl shadow-lg">
              <QRCodeSVG
                id="qr-code-svg"
                value={catalogUrl}
                size={200}
                level="H"
                includeMargin
                fgColor="#1a1a2e"
              />
            </div>

            {/* URL Display */}
            <div className="w-full p-3 bg-muted rounded-lg text-center">
              <p className="text-sm text-muted-foreground break-all">{catalogUrl}</p>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3 w-full">
              <Button 
                onClick={handleDownload}
                className="flex-1 gradient-primary text-primary-foreground"
              >
                <Download className="h-4 w-4 mr-2" />
                Télécharger
              </Button>
              <Button 
                variant="outline" 
                onClick={handleCopyLink}
                className="flex-1"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copier le lien
              </Button>
            </div>
            
            <Button 
              variant="secondary" 
              onClick={handleShare}
              className="w-full"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Partager
            </Button>
          </CardContent>
        </Card>

        {/* Tips */}
        <Card className="mt-6 border-2 bg-muted/30">
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-2">💡 Conseils</h3>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li>• Imprimez le QR code sur vos cartes de visite</li>
              <li>• Affichez-le dans votre boutique physique</li>
              <li>• Partagez-le sur vos réseaux sociaux</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
