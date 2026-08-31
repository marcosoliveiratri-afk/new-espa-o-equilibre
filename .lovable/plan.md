# Corrigir prévia que não atualiza

## Problema

O servidor de prévia está no ar (responde HTTP 200), mas a página falha ao renderizar com o erro:

```text
Error in renderToReadableStream: Error: Cannot find module '@supabase/supabase-js'
imported from '/dev-server/src/integrations/supabase/client.ts'
```

O projeto está conectado ao Supabase e contém os arquivos gerados de integração (`src/integrations/supabase/client.ts`), mas o pacote `@supabase/supabase-js` não consta em `package.json` / `node_modules`. Sem ele, qualquer página que importe o cliente Supabase quebra no servidor — e a prévia parece "travada".

## O que será feito

1. Instalar o pacote faltante: `bun add @supabase/supabase-js` (o servidor de prévia reinicia automaticamente após a instalação).
2. Verificar que a prévia volta a renderizar sem erros (checar resposta HTTP e ausência do erro nos logs).

## Detalhes técnicos

- Nenhum arquivo de código precisa ser alterado — `src/integrations/supabase/client.ts` é gerado e está correto; falta apenas a dependência.
- Nenhuma mudança no banco de dados é necessária.
