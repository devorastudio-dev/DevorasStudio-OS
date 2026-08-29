# Testes do banco

Os testes pgTAP validam schema, integridade e políticas RLS com usuários fictícios. Cada arquivo executa em uma transação revertida ao final.

Com o Supabase local ativo, execute:

```sh
npm run supabase:db:test
```

Os testes devem falhar se uma política permitir leitura ou escrita entre organizações.
