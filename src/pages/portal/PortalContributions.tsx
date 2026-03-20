import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Copy, Check, Heart, Building2, QrCode, Wallet, ChevronRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";

const stagger = {
  container: { transition: { staggerChildren: 0.09 } },
  item: {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
  },
};

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success(`${label} copiado!`);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleCopy}
      className="gap-2 rounded-xl active:scale-[0.97] transition-transform"
    >
      {copied ? <Check className="h-4 w-4 text-accent" /> : <Copy className="h-4 w-4" />}
      {copied ? "Copiado!" : `Copiar ${label}`}
    </Button>
  );
}

export default function PortalContributions() {
  const { profile } = useAuth();

  // Fetch church banking data
  const { data: church, isLoading: churchLoading } = useQuery({
    queryKey: ["portal-church-banking", profile?.church_id],
    queryFn: async () => {
      if (!profile?.church_id) return null;
      const { data, error } = await supabase
        .from("churches")
        .select("name, pix_key, pix_key_type, bank_name, bank_agency, bank_account")
        .eq("id", profile.church_id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.church_id,
  });

  // Fetch member contributions
  const { data: contributions, isLoading: contribLoading } = useQuery({
    queryKey: ["portal-my-contributions", profile?.id],
    queryFn: async () => {
      if (!profile?.id || !profile?.church_id) return [];
      // Find member by email
      const { data: user } = await supabase.auth.getUser();
      const email = user?.user?.email;
      if (!email) return [];

      const { data: member } = await supabase
        .from("members")
        .select("id")
        .eq("church_id", profile.church_id)
        .eq("email", email)
        .maybeSingle();

      if (!member) return [];

      const { data, error } = await supabase
        .from("contributions")
        .select("*")
        .eq("member_id", member.id)
        .order("contribution_date", { ascending: false })
        .limit(10);

      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.id,
  });

  if (churchLoading) {
    return (
      <div className="space-y-4 p-4 max-w-2xl mx-auto">
        <Skeleton className="h-48 w-full rounded-2xl" />
        <Skeleton className="h-32 w-full rounded-2xl" />
      </div>
    );
  }

  const hasPixKey = !!church?.pix_key;
  const hasBankInfo = !!church?.bank_name;

  const pixKeyTypeLabels: Record<string, string> = {
    cpf: "CPF",
    cnpj: "CNPJ",
    email: "E-mail",
    phone: "Telefone",
    random: "Chave Aleatória",
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex-1 space-y-5 p-4 max-w-2xl mx-auto w-full pb-24 lg:pb-8"
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-center gap-3 mb-1">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
            <Heart className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Contribuições</h1>
            <p className="text-sm text-muted-foreground">Dízimos e ofertas para {church?.name || "a igreja"}</p>
          </div>
        </div>
      </motion.div>

      <motion.div variants={stagger.container} initial="initial" animate="animate" className="space-y-4">
        {/* PIX Card */}
        {hasPixKey && (
          <motion.div variants={stagger.item}>
            <Card className="rounded-2xl border-0 shadow-md overflow-hidden bg-gradient-to-br from-primary/5 via-card to-secondary/5">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <QrCode className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-bold text-base">PIX</h2>
                    <p className="text-xs text-muted-foreground">
                      {church.pix_key_type ? pixKeyTypeLabels[church.pix_key_type] || church.pix_key_type : "Chave PIX"}
                    </p>
                  </div>
                </div>

                {/* QR Code */}
                <div className="flex justify-center">
                  <div className="bg-white p-4 rounded-2xl shadow-sm">
                    <QRCodeSVG value={church.pix_key!} size={160} level="M" />
                  </div>
                </div>

                {/* Key display */}
                <div className="bg-background/80 backdrop-blur-sm rounded-xl p-3 border">
                  <p className="text-xs text-muted-foreground mb-1">Chave PIX</p>
                  <p className="font-mono text-sm font-medium break-all">{church.pix_key}</p>
                </div>

                <CopyButton text={church.pix_key!} label="Chave PIX" />
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Bank Info Card */}
        {hasBankInfo && (
          <motion.div variants={stagger.item}>
            <Card className="rounded-2xl border-0 shadow-md">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-secondary/10 flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-secondary" />
                  </div>
                  <h2 className="font-bold text-base">Dados Bancários</h2>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {church.bank_name && (
                    <div className="bg-muted/50 rounded-xl p-3">
                      <p className="text-xs text-muted-foreground">Banco</p>
                      <p className="font-semibold text-sm">{church.bank_name}</p>
                    </div>
                  )}
                  {church.bank_agency && (
                    <div className="bg-muted/50 rounded-xl p-3">
                      <p className="text-xs text-muted-foreground">Agência</p>
                      <p className="font-semibold text-sm">{church.bank_agency}</p>
                    </div>
                  )}
                  {church.bank_account && (
                    <div className="bg-muted/50 rounded-xl p-3 col-span-2">
                      <p className="text-xs text-muted-foreground">Conta</p>
                      <p className="font-semibold text-sm">{church.bank_account}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {!hasPixKey && !hasBankInfo && (
          <motion.div variants={stagger.item}>
            <Card className="rounded-2xl border-dashed">
              <CardContent className="p-8 text-center space-y-2">
                <Wallet className="h-10 w-10 mx-auto text-muted-foreground/40" />
                <p className="text-muted-foreground text-sm">
                  Os dados de contribuição ainda não foram configurados pela igreja.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* My Contributions History */}
        <motion.div variants={stagger.item}>
          <div className="space-y-3">
            <h2 className="font-bold text-base">Minhas Contribuições</h2>
            {contribLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 rounded-xl" />
                ))}
              </div>
            ) : contributions && contributions.length > 0 ? (
              <div className="space-y-2">
                {contributions.map((c: any) => (
                  <Card key={c.id} className="rounded-xl border-0 shadow-sm">
                    <CardContent className="p-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                          <Heart className="h-4 w-4 text-accent" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{c.contribution_type}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(c.contribution_date), "dd/MM/yyyy")}
                          </p>
                        </div>
                      </div>
                      <span className="font-bold text-sm tabular-nums text-accent">
                        R$ {Number(c.amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </span>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="rounded-xl border-dashed">
                <CardContent className="p-6 text-center">
                  <p className="text-muted-foreground text-sm">Nenhuma contribuição registrada ainda.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
