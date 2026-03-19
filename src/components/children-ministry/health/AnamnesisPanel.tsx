import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { FileHeart, Search, ClipboardList } from "lucide-react";
import { useChildrenMinistry } from "@/hooks/useChildrenMinistry";
import { AnamnesisDialog } from "./AnamnesisDialog";

export function AnamnesisPanel() {
  const { children, isLoading } = useChildrenMinistry();
  const [search, setSearch] = useState("");
  const [selectedChild, setSelectedChild] = useState<{ id: string; name: string } | null>(null);

  const filtered = children?.filter((c) =>
    c.full_name.toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileHeart className="h-5 w-5" />
            Fichas de Anamnese
          </CardTitle>
          <CardDescription>
            Ficha médica e autorizações de cada criança
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar criança..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {isLoading ? (
            <div className="text-center py-6 text-muted-foreground">Carregando...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">Nenhuma criança encontrada.</div>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((child) => (
                <button
                  key={child.id}
                  onClick={() => setSelectedChild({ id: child.id, name: child.full_name })}
                  className="flex items-center gap-3 p-3 rounded-lg border text-left hover:bg-accent/50 transition-colors"
                >
                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <ClipboardList className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{child.full_name}</p>
                    <Badge variant="outline" className="text-xs mt-0.5">{child.classroom}</Badge>
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedChild && (
        <AnamnesisDialog
          open={!!selectedChild}
          onOpenChange={(open) => !open && setSelectedChild(null)}
          childId={selectedChild.id}
          childName={selectedChild.name}
        />
      )}
    </>
  );
}
