import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Star, Trophy, MessageSquare, Users } from "lucide-react";
import { useAddEvaluation } from "@/hooks/useChildrenMinistry";
import { toast } from "sonner";
import { motion } from "framer-motion";

type ChildEvaluationDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  childId: string;
  childName: string;
  checkInId?: string;
  onSuccess?: () => void;
};

export function ChildEvaluationDialog({
  open,
  onOpenChange,
  childId,
  childName,
  checkInId,
  onSuccess,
}: ChildEvaluationDialogProps) {
  const [behavior, setBehavior] = useState(5);
  const [participation, setParticipation] = useState(5);
  const [interaction, setInteraction] = useState(5);
  const [notes, setNotes] = useState("");
  
  const addEvaluation = useAddEvaluation();

  const handleSave = async () => {
    try {
      await addEvaluation.mutateAsync({
        child_id: childId,
        check_in_id: checkInId || null,
        behavior_score: behavior,
        participation_score: participation,
        interaction_score: interaction,
        notes: notes || null,
      });
      
      if (onSuccess) onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (error) {
      // Error handled in hook
    }
  };

  const resetForm = () => {
    setBehavior(5);
    setParticipation(5);
    setInteraction(5);
    setNotes("");
  };

  const RatingStars = ({ value, onChange, label, icon: Icon }: any) => (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary" />
        <span className="font-medium text-sm">{label}</span>
      </div>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <motion.button
            key={star}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onChange(star)}
            className={`h-10 w-10 rounded-full flex items-center justify-center transition-all ${
              star <= value 
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            <Star className={`h-5 w-5 ${star <= value ? "fill-current" : ""}`} />
          </motion.button>
        ))}
      </div>
    </div>
  );

  const totalPoints = (behavior + participation + interaction) * 2;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
          <Trophy className="h-24 w-24 text-primary rotate-12" />
        </div>
        
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Avaliar: {childName}
          </DialogTitle>
          <DialogDescription>
            Como foi a participação da criança hoje?
          </DialogDescription>
        </DialogHeader>

        <div className="py-6 space-y-6">
          <RatingStars 
            label="Comportamento" 
            value={behavior} 
            onChange={setBehavior} 
            icon={Star}
          />
          <RatingStars 
            label="Participação na Aula" 
            value={participation} 
            onChange={setParticipation} 
            icon={Trophy}
          />
          <RatingStars 
            label="Interação com Colegas" 
            value={interaction} 
            onChange={setInteraction} 
            icon={Users}
          />

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              Observações (opcional)
            </Label>
            <Textarea
              placeholder="Destaque algo especial ou algo para melhorar..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="resize-none h-24"
            />
          </div>

          <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Trophy className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium">Pontos Gerados</p>
                <p className="text-xs text-muted-foreground">Baseado na avaliação</p>
              </div>
            </div>
            <div className="text-2xl font-bold text-primary">+{totalPoints}</div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Pular
          </Button>
          <Button onClick={handleSave} disabled={addEvaluation.isPending}>
            Confirmar e Enviar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
