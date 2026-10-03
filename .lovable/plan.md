# Estruturar o módulo Projeto Oficina

## Objetivo
Construir o fluxo operacional e financeiro próprio da Oficina, mantendo a aparência do Pilates, mas com dados, cálculos e navegação totalmente separados.

## Premissas propostas
- O módulo será identificado pela chave `projeto-oficina` em `service_modules`.
- A Oficina terá tabelas próprias, prefixadas com `oficina_`, em vez de reutilizar as tabelas financeiras do Pilates. Isso evita que gatilhos, percentuais, destinos e fechamentos do Pilates afetem a Oficina.
- O valor informado no plano será tratado como **valor de cada competência/mensalidade**. Um plano mensal gera 1 competência; um trimestral gera 3 competências mensais, preservando cada pagamento no histórico. Essa premissa pode ser ajustada antes da implementação.
- Exclusões com histórico serão substituídas por inativação/cancelamento.

## Banco e isolamento
1. Cadastrar o módulo `projeto-oficina` sem alterar o registro do Pilates.
2. Criar tabelas específicas:
   - `oficina_students`: nome, telefone e situação.
   - `oficina_student_plans`: modalidade mensal/trimestral, valor, início, vencimento, ciclo e situação.
   - `oficina_competencies`: uma linha por competência, com vencimento, valor, pago/em aberto e data de pagamento.
   - `oficina_teachers`: professoras da Oficina.
   - `oficina_teacher_rates`: histórico de valor/hora por professora e vigência, sem valor padrão inventado.
   - `oficina_classes`: turma, dia da semana, horários/duração, professora e situação.
   - `oficina_class_occurrences`: aula efetivamente realizada, data, horários/duração real, professora, situação e valor/hora aplicado.
3. Usar `module_id` obrigatório em todas as tabelas e chaves compostas para impedir vínculos entre registros de módulos diferentes.
4. Adicionar índices, grants para usuários autenticados, RLS restrita ao módulo Oficina e publicação Realtime das novas tabelas.
5. Preservar histórico: registros financeiros, planos usados e ocorrências não terão hard delete pela interface.

## Regras de negócio
- Ao cadastrar um plano, gerar as competências do ciclo: 1 para mensal e 3 para trimestral.
- Permitir marcar competência como paga ou reabrir, mantendo data e histórico do plano.
- Turmas aceitarão qualquer dia da semana e múltiplos horários no mesmo dia.
- A agenda planejada não gerará pagamento automaticamente.
- Somente ocorrências com situação “Realizada” entram no fechamento.
- O pagamento será calculado por `duração real em minutos ÷ 60 × valor/hora da professora`.
- O valor/hora aplicável será preservado na ocorrência para que alterações futuras não mudem fechamentos históricos.
- Ocorrências poderão ser corrigidas; o Dashboard e o fechamento recalcularão a partir dos registros efetivos.

## Telas da Oficina
- **Dashboard:** alunos ativos, receita recebida/em aberto, horas realizadas e valor devido no mês.
- **Alunos:** busca, filtros, cadastro, ativação/inativação e acesso ao histórico de plano/competências.
- **Turmas:** cadastro e edição de horários, dias, professora e situação.
- **Aulas realizadas:** registro/correção das ocorrências, duração real e situação.
- **Financeiro:** competências dos alunos, filtros e ação de pagamento/reabertura.
- **Fechamentos:** mês/professora, horas utilizadas, valor/hora, total devido e detalhamento das ocorrências.
- **Configurações:** professoras e histórico editável de valor/hora.

Todas usarão a navegação própria da Oficina e o padrão visual já adotado no Pilates: fundo claro, título de 30px, cards neutros, tabelas compactas, filtros e badges de status.

## Estrutura técnica
- Transformar a rota principal da Oficina em layout com `Outlet`, mantendo o Dashboard no caminho `/projeto-oficina`.
- Criar rotas filhas para cada tela, sem importar consultas ou regras financeiras do Pilates.
- Criar utilitários e componentes somente da Oficina para moeda, datas, máscaras, KPIs e sincronização das novas tabelas.
- Todas as consultas buscarão primeiro o ID de `projeto-oficina` e aplicarão `.eq("module_id", moduleId)`.
- Não alterar arquivos `pilates.*`, tabelas existentes do Pilates ou seus gatilhos.

## Validação final
- Conferir criação de aluno mensal e trimestral e suas competências.
- Conferir turma em diferentes dias e múltiplas turmas no mesmo dia.
- Conferir ocorrência planejada versus realizada e correção da duração.
- Conferir cálculo com duração fracionada e valor/hora configurado.
- Conferir Dashboard, Financeiro e Fechamento usando apenas dados da Oficina.
- Verificar navegação em desktop/mobile, erros de execução e compilação.
- Revisar a lista final de arquivos e tabelas alterados para confirmar que nenhum código ou dado do Pilates mudou.
