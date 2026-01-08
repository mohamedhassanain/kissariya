import { useCart } from '@/hooks/useCart';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from '@/components/ui/sheet';
import { ShoppingCart, Trash2, Plus, Minus, MessageCircle, Store } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

export function CartSheet() {
  const { items, totalItems, totalPrice, updateQuantity, removeFromCart, cartByShop } = useCart();

  const handleWhatsAppOrder = (shopId: string, shopItems: any[]) => {
    const shop = shopItems[0];
    const message = `Bonjour! Je souhaite commander les produits suivants sur *${shop.shop_name}* :
    
${shopItems.map(item => `• *${item.name}* (x${item.quantity}) - ${item.price * item.quantity} DH`).join('\n')}

*Total: ${shopItems.reduce((sum, item) => sum + item.price * item.quantity, 0)} DH*

Pouvez-vous confirmer la disponibilité?`;

    const whatsappUrl = `https://wa.me/${shop.whatsapp_number.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="relative rounded-full h-12 w-12 shadow-lg border-2">
          <ShoppingCart className="h-6 w-6" />
          {totalItems > 0 && (
            <Badge className="absolute -top-2 -right-2 h-6 w-6 flex items-center justify-center p-0 bg-primary text-white rounded-full border-2 border-white animate-in zoom-in">
              {totalItems}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md flex flex-col p-0">
        <SheetHeader className="p-6 border-b">
          <SheetTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Mon Panier
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="flex-1">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[60vh] text-muted-foreground p-6 text-center">
              <div className="h-20 w-20 bg-muted rounded-full flex items-center justify-center mb-4">
                <ShoppingCart className="h-10 w-10" />
              </div>
              <p className="text-lg font-medium">Votre panier est vide</p>
              <p className="text-sm">Découvrez nos produits et ajoutez-les ici !</p>
            </div>
          ) : (
            <div className="p-6 space-y-8">
              {Object.entries(cartByShop).map(([shopId, shopItems]) => (
                <div key={shopId} className="space-y-4">
                  <div className="flex items-center gap-2 text-primary font-black uppercase text-xs tracking-widest">
                    <Store className="h-4 w-4" />
                    {shopItems[0].shop_name}
                  </div>
                  <div className="space-y-4">
                    {shopItems.map((item) => (
                      <div key={item.id} className="flex gap-4">
                        <div className="h-20 w-20 rounded-xl bg-muted overflow-hidden shrink-0 border">
                          {item.image_url ? (
                            <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center">
                              <Store className="h-8 w-8 text-slate-200" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-sm truncate">{item.name}</h4>
                          <p className="text-primary font-black text-sm">{item.price} DH</p>
                          <div className="flex items-center gap-3 mt-2">
                            <div className="flex items-center border rounded-lg bg-muted/50">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-none"
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="w-8 text-center text-xs font-bold">{item.quantity}</span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-none"
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => removeFromCart(item.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button 
                    className="w-full bg-[#25D366] hover:bg-[#20ba5a] text-white rounded-xl h-10 gap-2 text-xs font-bold"
                    onClick={() => handleWhatsAppOrder(shopId, shopItems)}
                  >
                    <MessageCircle className="h-4 w-4" />
                    Commander chez {shopItems[0].shop_name}
                  </Button>
                  <Separator className="mt-6" />
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {items.length > 0 && (
          <div className="p-6 border-t bg-muted/20">
            <div className="flex items-center justify-between mb-4">
              <span className="text-muted-foreground font-medium">Total du panier</span>
              <span className="text-2xl font-black text-primary">{totalPrice} DH</span>
            </div>
            <p className="text-[10px] text-muted-foreground text-center mb-4">
              Les commandes sont envoyées séparément à chaque boutique via WhatsApp.
            </p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
