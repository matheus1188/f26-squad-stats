import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Loader2, Trash2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { uploadImage } from "@/lib/image-upload";
import { cn } from "@/lib/utils";

type Bucket = "team-images" | "player-images";

export function ImageUpload({
  value,
  onChange,
  bucket,
  shape = "circle",
  placeholder,
  size = 96,
}: {
  value: string;
  onChange: (url: string) => void;
  bucket: Bucket;
  shape?: "circle" | "rounded";
  placeholder?: React.ReactNode;
  size?: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function handleFile(file: File) {
    setBusy(true);
    try {
      const url = await uploadImage(file, bucket);
      onChange(url);
      toast.success("Imagem enviada");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha no upload");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const radius = shape === "circle" ? "rounded-full" : "rounded-2xl";

  return (
    <div className="flex items-center gap-4">
      <div
        className={cn(
          "relative shrink-0 overflow-hidden ring-2 ring-primary/30 bg-foreground/5 grid place-items-center",
          radius
        )}
        style={{ width: size, height: size }}
      >
        {value ? (
          <img src={value} alt="" className="h-full w-full object-cover" />
        ) : (
          placeholder ?? <Upload className="size-6 text-muted-foreground" />
        )}
        {busy && (
          <div className="absolute inset-0 grid place-items-center bg-black/50">
            <Loader2 className="size-5 animate-spin text-white" />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2 min-w-0">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="rounded-xl tap gap-1.5"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
        >
          {value ? <RefreshCw className="size-3.5" /> : <Upload className="size-3.5" />}
          {value ? "Trocar foto" : "Enviar foto"}
        </Button>
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="rounded-xl text-destructive gap-1.5 justify-start"
            disabled={busy}
            onClick={() => onChange("")}
          >
            <Trash2 className="size-3.5" /> Remover
          </Button>
        )}
      </div>
    </div>
  );
}
