import { useEventFinance } from '@/hooks/useEventFinance';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Check, X, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function EventFinanceAuthorization() {
  const { usePendingAuthorizations, authorizeRevenue, rejectAuthorization, canAuthorize } = useEventFinance();
  const { data: authorizations, isLoading, refetch } = usePendingAuthorizations();
  const { toast } = useToast();

  if (!canAuthorize) return null;

  if (isLoading) {
    return (
      <Card className="border-amber-500 bg-amber-50/50">
        <CardContent className="py-4">
          <div className="flex items-center gap-2 text-amber-700">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Carregando autorizações...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!authorizations?.length) return null;

  const handleAuthorize = async (id: string) => {
    try {
      await authorizeRevenue.mutateAsync(id);
      toast({
        title: 'Receita autorizada',
        description: 'A receita foi registrada no financeiro com sucesso.',
        variant: 'default',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao autorizar receita',
        variant: 'destructive',
      });
    }
  };

  const handleReject = async (id: string) => {
    try {
      await rejectAuthorization.mutateAsync(id);
      toast({
        title: 'Autorização rejeitada',
        description: 'A receita foi rejeitada.',
        variant: 'default',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao rejeitar autorização',
        variant: 'destructive',
      });
    }
  };

  const totalPending = authorizations.reduce((sum, a) => sum + (a.amount || 0), 0);

  return (
    <Card className="border-amber-500 bg-amber-50/50">
      <CardHeader className="py-3 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-600" />
            <CardTitle className="text-sm font-semibold text-amber-800">
              Autorizações de Receita de Eventos
            </CardTitle>
          </div>
          <Badge variant="secondary" className="bg-amber-100 text-amber-800">
            {authorizations.length} pendente{authorizations.length !== 1 ? 's' : ''}
          </Badge>
        </div>
        <p className="text-xs text-amber-700 mt-1">
          Total pendente: R$ {totalPending.toFixed(2)}
        </p>
      </CardHeader>
      <CardContent className="py-2 px-4 space-y-2 max-h-64 overflow-y-auto">
        {authorizations.map((auth) => (
          <div 
            key={auth.id} 
            className="flex items-center justify-between bg-white border border-amber-200 p-3 rounded-lg"
          >
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-gray-900 truncate">
                {auth.event?.title || 'Evento'}
              </p>
              <p className="text-xs text-gray-500">
                {auth.member?.full_name || auth.attendee_name || 'Participante'}
              </p>
            </div>
            <div className="flex items-center gap-2 ml-2">
              <span className="text-sm font-semibold text-green-600">
                R$ {auth.amount?.toFixed(2)}
              </span>
              <div className="flex gap-1">
                <Button 
                  size="sm" 
                  variant="outline"
                  className="h-7 px-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                  onClick={() => handleReject(auth.id)}
                  disabled={rejectAuthorization.isPending}
                >
                  {rejectAuthorization.isPending ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <X className="w-3 h-3" />
                  )}
                </Button>
                <Button 
                  size="sm"
                  className="h-7 px-2 bg-green-600 hover:bg-green-700"
                  onClick={() => handleAuthorize(auth.id)}
                  disabled={authorizeRevenue.isPending}
                >
                  {authorizeRevenue.isPending ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Check className="w-3 h-3" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}