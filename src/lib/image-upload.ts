import { supabase } from "@/integrations/supabase/client";

const TEN_YEARS = 60 * 60 * 24 * 365 * 10;

/**
 * Resize + compress an image client-side to JPEG (max 1024px on the longest
 * side, quality 0.85). Keeps uploads small and PWA-friendly on mobile.
 */
export async function compressImage(file: File, maxSize = 1024, quality = 0.85): Promise<Blob> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Selecione um arquivo de imagem válido");
  }
  const bitmap = await createImageBitmap(file).catch(async () => {
    // Fallback for browsers without createImageBitmap on certain formats
    const url = URL.createObjectURL(file);
    try {
      const img = await new Promise<HTMLImageElement>((res, rej) => {
        const i = new Image();
        i.onload = () => res(i);
        i.onerror = rej;
        i.src = url;
      });
      return img as unknown as ImageBitmap;
    } finally {
      URL.revokeObjectURL(url);
    }
  });

  const w = bitmap.width;
  const h = bitmap.height;
  const scale = Math.min(1, maxSize / Math.max(w, h));
  const tw = Math.round(w * scale);
  const th = Math.round(h * scale);

  const canvas = document.createElement("canvas");
  canvas.width = tw;
  canvas.height = th;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas indisponível");
  ctx.drawImage(bitmap as CanvasImageSource, 0, 0, tw, th);

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Falha ao processar imagem"))),
      "image/jpeg",
      quality
    );
  });
}

export async function uploadImage(file: File, bucket: "team-images" | "player-images"): Promise<string> {
  const blob = await compressImage(file);
  const path = `${crypto.randomUUID()}.jpg`;
  const { error } = await supabase.storage.from(bucket).upload(path, blob, {
    contentType: "image/jpeg",
    upsert: false,
  });
  if (error) throw error;

  // Buckets are private (workspace blocks public buckets) — use long-lived signed URL
  const { data, error: signErr } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, TEN_YEARS);
  if (signErr || !data?.signedUrl) throw signErr ?? new Error("Falha ao gerar URL");
  return data.signedUrl;
}
