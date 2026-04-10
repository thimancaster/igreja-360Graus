import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Gift, Phone, Mail, Calendar, MessageCircle, Settings, Send, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useBirthdaysThisMonth } from '@/hooks/useMembers';
import { toast } from 'sonner';

const DEFAULT_MESSAGE = 'Feliz aniversário, {nome}! 🎂🎉 Que Deus te abençoe grandemente neste novo ano de vida. Com carinho, {remetente}';
const STORAGE_KEY = 'birthday_msg_config';

interface MsgConfig {
  template: string;
  senderName: string;
}

function loadConfig(): MsgConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    // skip
  }
  return { template: DEFAULT_MESSAGE, senderName: '' };
}

function saveConfig(cfg: MsgConfig) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
}

function cleanPhone(phone: string) {
  return phone.replace(/\D/g, '');
}

function buildWhatsAppUrl(phone: string, name: string, cfg: MsgConfig) {
  const msg = cfg.template
    .replace(/\{nome\}/g, name)
    .replace(/\{remetente\}/g, cfg.senderName || 'Igreja');
  return `https://wa.me/55${cleanPhone(phone)}?text=${encodeURIComponent(msg)}`;
}

type FilterType = 'today' | 'week' | 'month';

export function BirthdayCard() {
  const { data: birthdays, isLoading } = useBirthdaysThisMonth();
  const [filter, setFilter] = useState<FilterType>('today');
  const [configOpen, setConfigOpen] = useState(false);
  const [sendAllOpen, setSendAllOpen] = useState(false);
  const [config, setConfig] = useState<MsgConfig>(loadConfig);

  const currentMonth = format(new Date(), 'MMMM', { locale: ptBR });

  const filtered = useMemo(() => {
    if (!birthdays?.length) return [];
    const today = new Date();
    const todayDay = today.getDate();
    const todayMonth = today.getMonth();

    return birthdays.filter((m: any) => {
      const bd = new Date(m.birth_date);
      const bdDay = bd.getUTCDate();
      const bdMonth = bd.getUTCMonth();
      if (bdMonth !== todayMonth) return filter === 'month';

      if (filter === 'today') return bdDay === todayDay;
      if (filter === 'week') {
        const thisYearBd = new Date(today.getFullYear(), bdMonth, bdDay);
        const diff = (thisYearBd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
        return diff >= 0 && diff < 7;
      }
      return true;
    });
  }, [birthdays, filter]);

  const withPhone = filtered.filter((m: any) => m.phone);

  function handleSaveConfig() {
    saveConfig(config);
    setConfigOpen(false);
    toast.success('Mensagem salva!');
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-primary" />
            Aniversariantes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-primary" />
              Aniversariantes de {currentMonth}
            </CardTitle>
            <div className="flex items-center gap-1">
              {withPhone.length > 0 && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600" onClick={() => setSendAllOpen(true)}>
                        <Send className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Enviar parabéns para todos</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setConfigOpen(true)}>
                      <Settings className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Configurar mensagem</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
          <CardDescription>{filtered.length} aniversariante(s)</CardDescription>
          <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterType)} className="mt-2">
            <TabsList className="grid w-full grid-cols-3 h-8">
              <TabsTrigger value="today" className="text-xs">Hoje</TabsTrigger>
              <TabsTrigger value="week" className="text-xs">Semana</TabsTrigger>
              <TabsTrigger value="month" className="text-xs">Mês</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px] pr-4">
            {filtered.length > 0 ? (
              <div className="space-y-3">
                {filtered.map((member: any) => {
                  const birthDate = new Date(member.birth_date);
                  const today = new Date();
                  const thisYearBd = new Date(today.getFullYear(), birthDate.getUTCMonth(), birthDate.getUTCDate());
                  const diffTime = thisYearBd.getTime() - today.getTime();
                  const daysUntil = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

                  return (
                    <div
                      key={member.id}
                      className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent/50 transition-colors"
                    >
                      <div className="space-y-1 min-w-0 flex-1">
                        <p className="font-medium truncate">{member.full_name}</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                          {member.birth_date && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(member.birth_date), 'dd/MM', { locale: ptBR })}
                            </span>
                          )}
                          {member.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              <span className="truncate max-w-[120px]">{member.email}</span>
                            </span>
                          )}
                          {member.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {member.phone}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-2 shrink-0">
                        {member.phone && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                                  asChild
                                >
                                  <a href={buildWhatsAppUrl(member.phone, member.full_name, config)} target="_blank" rel="noopener noreferrer">
                                    <MessageCircle className="h-4 w-4" />
                                  </a>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Enviar parabéns via WhatsApp</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                        <Badge
                          variant={daysUntil === 0 ? 'default' : 'secondary'}
                          className={daysUntil === 0 ? 'bg-green-500' : ''}
                        >
                          {daysUntil === 0 ? '🎉 Hoje!' : daysUntil === 1 ? 'Amanhã' : `${daysUntil}d`}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                <Gift className="h-10 w-10 mb-2 opacity-50" />
                <p>Nenhum aniversariante {filter === 'today' ? 'hoje' : filter === 'week' ? 'esta semana' : 'este mês'}</p>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Config Dialog */}
      <Dialog open={configOpen} onOpenChange={setConfigOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configurar Mensagem de Aniversário</DialogTitle>
            <DialogDescription>Personalize a mensagem enviada via WhatsApp. Use {'{nome}'} e {'{remetente}'} como variáveis.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Remetente (quem assina)</Label>
              <Input
                placeholder="Ex: Pastor João, Liderança, Igreja..."
                value={config.senderName}
                onChange={(e) => setConfig({ ...config, senderName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Mensagem</Label>
              <Textarea
                rows={5}
                value={config.template}
                onChange={(e) => setConfig({ ...config, template: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">Variáveis: {'{nome}'}, {'{remetente}'}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfig({ template: DEFAULT_MESSAGE, senderName: config.senderName })}>Restaurar padrão</Button>
            <Button onClick={handleSaveConfig}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send All Dialog */}
      <Dialog open={sendAllOpen} onOpenChange={setSendAllOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar Parabéns para Todos</DialogTitle>
            <DialogDescription>{withPhone.length} membro(s) com telefone cadastrado</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[300px]">
            <div className="space-y-2">
              {withPhone.map((m: any) => (
                <div key={m.id} className="flex items-center justify-between rounded-md border p-2">
                  <span className="text-sm truncate">{m.full_name}</span>
                  <Button size="sm" variant="outline" className="text-green-600 shrink-0" asChild>
                    <a href={buildWhatsAppUrl(m.phone, m.full_name, config)} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3 w-3 mr-1" /> Enviar
                    </a>
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSendAllOpen(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
