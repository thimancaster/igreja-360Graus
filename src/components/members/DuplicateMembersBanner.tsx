import { useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp, Merge, Eye } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Member } from '@/hooks/useMembers';

interface DuplicateGroup {
  key: string;
  members: Member[];
  reason: string;
}

interface DuplicateMembersBannerProps {
  groups: DuplicateGroup[];
  onSelectMember: (member: Member) => void;
}

export function DuplicateMembersBanner({ groups, onSelectMember }: DuplicateMembersBannerProps) {
  const [expanded, setExpanded] = useState(false);

  if (groups.length === 0) return null;

  const totalDuplicates = groups.reduce((sum, g) => sum + g.members.length, 0);

  return (
    <Alert variant="destructive" className="border-orange-500/50 bg-orange-500/10 text-foreground">
      <AlertTriangle className="h-4 w-4 !text-orange-500" />
      <AlertTitle className="text-orange-600 dark:text-orange-400 font-semibold">
        {groups.length} possível(is) duplicação(ões) encontrada(s)
      </AlertTitle>
      <AlertDescription className="mt-2">
        <p className="text-sm text-muted-foreground mb-2">
          Encontramos {totalDuplicates} registros em {groups.length} grupo(s) com nomes semelhantes ou dados de contato idênticos. 
          Revise e unifique para manter o cadastro limpo.
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setExpanded(!expanded)}
          className="gap-1"
        >
          {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          {expanded ? 'Ocultar detalhes' : 'Ver duplicados'}
        </Button>

        {expanded && (
          <div className="mt-3 space-y-3 max-h-[300px] overflow-auto">
            {groups.map((group) => (
              <Card key={group.key} className="border-orange-500/20">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Merge className="h-4 w-4 text-orange-500" />
                    <span className="text-xs font-medium text-muted-foreground">{group.reason}</span>
                  </div>
                  <div className="space-y-1">
                    {group.members.map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center justify-between text-sm p-1.5 rounded hover:bg-muted/60 cursor-pointer transition-colors"
                        onClick={() => onSelectMember(m)}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-medium truncate">{m.full_name}</span>
                          <Badge variant={m.status === 'active' ? 'default' : 'secondary'} className="text-[10px] shrink-0">
                            {m.status === 'active' ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
                          {m.phone && <span>{m.phone}</span>}
                          {m.email && <span className="hidden md:inline">{m.email}</span>}
                          <Eye className="h-3 w-3" />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
}
