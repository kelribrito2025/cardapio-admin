# Análise do Toggle de Status

## Problema Identificado
O usuário menciona que existe um toggle no perfil que mostra "fechado" quando a loja deveria estar "aberta" baseado nos horários configurados.

## Observações da Página de Configurações (Aba Atendimento)
- A seção "Horários de funcionamento" mostra toggles para cada dia da semana
- Cada dia tem um toggle de ativação e campos de horário (abertura e fechamento)
- Sexta-feira está configurada com horário 01:00 até 23:00
- O toggle de Sexta-feira (elemento 31) parece estar desativado (cor mais clara)

## Problema Real
O toggle de cada dia da semana controla se o estabelecimento funciona naquele dia. Se o toggle de Sexta-feira estiver desativado, mesmo com horários configurados, o sistema considera que a loja está fechada nesse dia.

## Verificação Necessária
1. Verificar se os toggles de cada dia estão ativados
2. Verificar se o horário atual (sexta-feira) está dentro do período configurado
3. O preview do perfil público mostra "Aberto agora" - então o problema pode estar em outro lugar

## Próximos Passos
- Verificar onde está o toggle que o usuário menciona (pode ser no preview do perfil)
- Verificar se há um toggle separado de "isOpen" no estabelecimento
