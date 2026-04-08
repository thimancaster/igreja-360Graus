import { useTheme } from "@/hooks/useTheme";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "dark" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="top-center"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background/60 group-[.toaster]:backdrop-blur-2xl group-[.toaster]:text-foreground group-[.toaster]:border-white/10 group-[.toaster]:shadow-[0_10px_40px_rgb(0,0,0,0.2)] rounded-[24px] mx-auto min-w-[280px] max-w-[360px] flex items-center justify-center tracking-tight",
          description: "group-[.toast]:text-muted-foreground text-xs",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground rounded-full font-bold",
          cancelButton: "group-[.toast]:bg-white/10 group-[.toast]:text-muted-foreground rounded-full",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
