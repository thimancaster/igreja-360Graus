import { Sun, Moon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/hooks/useTheme";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="relative h-9 w-9 rounded-full text-foreground/70 hover:text-foreground hover:bg-accent/10 transition-colors"
          animate={false}
          ripple={false}
          aria-label={isDark ? "Ativar modo claro" : "Ativar modo escuro"}
        >
          <AnimatePresence mode="wait" initial={false}>
            {isDark ? (
              <motion.div
                key="moon"
                initial={{ rotate: -90, scale: 0.5, opacity: 0 }}
                animate={{ rotate: 0,   scale: 1,   opacity: 1 }}
                exit= {{ rotate:  90,  scale: 0.5, opacity: 0 }}
                transition={{ duration: 0.22, ease: "easeInOut" }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <Moon className="h-4 w-4" />
              </motion.div>
            ) : (
              <motion.div
                key="sun"
                initial={{ rotate: 90,  scale: 0.5, opacity: 0 }}
                animate={{ rotate: 0,   scale: 1,   opacity: 1 }}
                exit= {{ rotate: -90,  scale: 0.5, opacity: 0 }}
                transition={{ duration: 0.22, ease: "easeInOut" }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <Sun className="h-4 w-4" />
              </motion.div>
            )}
          </AnimatePresence>
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs">
        {isDark ? "Modo claro" : "Modo escuro"}
      </TooltipContent>
    </Tooltip>
  );
}
