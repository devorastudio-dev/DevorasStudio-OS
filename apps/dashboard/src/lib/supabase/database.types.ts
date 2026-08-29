// Temporario: substitua este arquivo pelo schema gerado com `npm run supabase:types`
// assim que o Supabase local estiver ativo. Nao mantenha tipos de tabelas manualmente.
export type Json =
  | boolean
  | number
  | string
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: Record<never, never>;
    Views: Record<never, never>;
    Functions: Record<never, never>;
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
};
