# Plano: Projeto em branco

## Objetivo
Deixar o projeto TanStack Start vazio, sem a página placeholder padrão, mantendo apenas a estrutura mínima necessária para rodar.

## Alterações
1. **Limpar `src/routes/index.tsx`**
   - Remover o placeholder (`data-lovable-blank-page-placeholder`) e a imagem.
   - Deixar o componente da rota `/` retornando um `<div>` vazio ou `null`.

2. **Manter `src/routes/__root.tsx`**
   - Preservar o layout root obrigatório do TanStack Router (`<Outlet />`).
   - Opcionalmente simplificar metadados se ainda estiverem genéricos, mas sem adicionar conteúdo.

3. **Regeneração automática**
   - `src/routeTree.gen.ts` será atualizado automaticamente pelo plugin do TanStack Router no próximo `dev`/`build`.

## Resultado esperado
- A raiz `/` abre uma tela totalmente em branco.
- Não há páginas, componentes visuais ou conteúdo placeholder.
- O projeto continua compilando e o servidor de desenvolvimento funciona.
