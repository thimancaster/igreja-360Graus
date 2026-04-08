import { useState } from 'react';
import { useEventFinance } from '@/hooks/useEventFinance';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Loader2, 
  Check, 
  X, 
  AlertCircle, 
  DollarSign, 
  Calendar,
  Filter
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function AutorizacoesEventos() {
  const [filter, setFilter] = useState<'pending' | 'authorized' | 'rejected'>('pending');
  const { 
    useAllAuthorizations, 
    useAuthorizationStats, 
    authorizeRevenue, 
    rejectAuthorization,
    canAuthorize 
  } = useEventFinance();
  
  const { data: stats } = useAuthorizationStats();
  const { data: authorizations, isLoading, refetch } = useAllAuthorizations(filter);
  const { toast } = useToast();

  if (!canAuthorize) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="py-10 text-center">
            <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold">Acesso Restrito</h2>
            <p className="text-gray-500">Você não tem permissão para acessar esta página.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

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
        description: 'A autorização foi rejeitada.',
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

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Autorizações de Receitas de Eventos</h1>
          <p className="text-gray-500">Gerencie as receitas de eventos pagos</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <AlertCircle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Pendentes</p>
                <p className="text-2xl font-bold">{stats?.pending || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Pendente</p>
                <p className="text-2xl font-bold text-green-600">
                  R$ {(stats?.totalPending || 0).toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Check className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Autorizadas</p>
                <p className="text-2xl font-bold">{stats?.authorized || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <X className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Rejeitadas</p>
                <p className="text-2xl font-bold">{stats?.rejected || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
        <TabsList>
          <TabsTrigger value="pending">
            Pendentes ({stats?.pending || 0})
          </TabsTrigger>
          <TabsTrigger value="authorized">
            Autorizadas ({stats?.authorized || 0})
          </TabsTrigger>
          <TabsTrigger value="rejected">
            Rejeitadas ({stats?.rejected || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={filter}>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {filter === 'pending' && 'Autorizações Pendentes'}
                {filter === 'authorized' && 'Autorizações Autorizadas'}
                {filter === 'rejected' && 'Autorizações Rejeitadas'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                </div>
              ) : authorizations?.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhuma autorização encontrada</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium">Evento</th>
                        <th className="text-left py-3 px-4 font-medium">Participante</th>
                        <th className="text-right py-3 px-4 font-medium">Valor</th>
                        <th className="text-left py-3 px-4 font-medium">Data</th>
                        {filter === 'authorized' && (
                          <th className="text-left py-3 px-4 font-medium">Autorizado por</th>
                        )}
                        {filter === 'rejected' && (
                          <th className="text-left py-3 px-4 font-medium">Rejeitado por</th>
                        )}
                        {filter === 'pending' && (
                          <th className="text-right py-3 px-4 font-medium">Ações</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {authorizations?.map((auth) => (
                        <tr key={auth.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <span className="font-medium">{auth.event?.title || 'Evento'}</span>
                          </td>
                          <td className="py-3 px-4 text-gray-600">
                            {auth.member?.full_name || '-'}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className="font-semibold text-green-600">
                              R$ {auth.amount?.toFixed(2)}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-gray-500 text-sm">
                            {formatDate(auth.created_at)}
                          </td>
                          {filter === 'authorized' && (
                            <td className="py-3 px-4 text-gray-500 text-sm">
                              {formatDate(auth.authorized_at)}
                            </td>
                          )}
                          {filter === 'rejected' && (
                            <td className="py-3 px-4 text-gray-500 text-sm">
                              {formatDate(auth.authorized_at)}
                            </td>
                          )}
                          {filter === 'pending' && (
                            <td className="py-3 px-4 text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-red-200 text-red-600 hover:bg-red-50"
                                  onClick={() => handleReject(auth.id)}
                                  disabled={rejectAuthorization.isPending}
                                >
                                  <X className="w-3 h-3 mr-1" />
                                  Rejeitar
                                </Button>
                                <Button
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700"
                                  onClick={() => handleAuthorize(auth.id)}
                                  disabled={authorizeRevenue.isPending}
                                >
                                  <Check className="w-3 h-3 mr-1" />
                                  Autorizar
                                </Button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}