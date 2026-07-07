import { Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export function BackToHomeButton({ className }: { className?: string }) {
  const navigate = useNavigate();

  return (
    <Button
      type="button"
      variant="ghost"
      className={className}
      onClick={() => navigate('/')}
    >
      <Home className="mr-2 h-4 w-4" />
      Volver al inicio
    </Button>
  );
}
