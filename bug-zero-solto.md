# Bug do '0' Solto na Seção de Informações do iFood

## Descoberta
A busca por "Informações do Pedido" revelou o seguinte texto:
```
Rua TESTE, 999999 - Complemento TESTE - Bairro TESTE, TESTE/XX - CEP: 99999999 (Ref: TESTE). CPF/CNPJ:. FS999999. iFood. Informações do Pedido. Tipo:. Imediato. 0
```

O **"0"** aparece logo após "Tipo: Imediato", indicando que há um campo sendo renderizado que está mostrando o valor 0.

## Análise do Código (linhas 1509-1557 de Pedidos.tsx)
Analisando o código, os campos condicionais são:
1. Tipo de pedido (orderTiming) - Mostra "Imediato" ou "Agendado"
2. Entrega Agendada (schedule.deliveryDateTimeStart) - Só mostra se for SCHEDULED
3. Desconto (total.benefits) - Só mostra se benefits.length > 0
4. Observações de Entrega (delivery.observations) - Só mostra se existir

## Causa Provável
O "0" pode estar vindo de:
1. Um campo numérico que está sendo renderizado sem verificação
2. O campo `benefits.length` sendo renderizado diretamente em algum lugar
3. Algum outro campo numérico do externalData

## Próximo Passo
Verificar se há algum campo sendo renderizado sem estar dentro de uma condição ou se há algum valor numérico sendo exibido diretamente.
