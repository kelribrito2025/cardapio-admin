# Debug do Sistema de Fidelidade

## Problema Identificado
O campo de senha está mostrando "2908" mesmo após digitar "0000". Parece que o campo não está sendo limpo corretamente antes de receber o novo valor.

## Observações
1. A senha correta no banco é "0000" (verificado via bcrypt.compare)
2. O campo de senha está mostrando "2908" que é um valor antigo
3. A mensagem "Senha incorreta" aparece porque está enviando "2908" ao invés de "0000"

## Solução Necessária
Verificar se o componente de input está limpando o valor corretamente antes de inserir novo texto.
