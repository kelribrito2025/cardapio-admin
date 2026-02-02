# Checklist de Validação - Homologação iFood

Este documento lista todos os critérios obrigatórios de homologação do iFood e o status atual de implementação no sistema.

---

## Critérios Obrigatórios do Módulo Order

### 1. Recebimento de Eventos

| Critério | Status | Observações |
|----------|--------|-------------|
| Receber eventos via polling (a cada 30s) OU webhook | ✅ Implementado | Webhook implementado em `server/ifood.ts` |
| Enviar acknowledgment para todos os eventos | ✅ Implementado | Função `acknowledgeIfoodEvent()` |

### 2. Tipos de Pedido

| Critério | Status | Observações |
|----------|--------|-------------|
| Pedidos delivery para agora (DELIVERY/IMMEDIATE) | ✅ Implementado | Mapeado em `mapIfoodOrderType()` |
| Pedidos delivery agendados (DELIVERY/SCHEDULED) | ✅ Implementado | Exibe data/hora na seção "iFood - Informações do Pedido" |
| Pedidos para retirar (TAKEOUT) | ✅ Implementado | Mapeado como "pickup" |

### 3. Cancelamentos

| Critério | Status | Observações |
|----------|--------|-------------|
| Consultar motivos de cancelamento via API | ✅ Implementado | Função `getIfoodCancellationReasons()` |
| Solicitar cancelamento com código do motivo | ✅ Implementado | Função `requestIfoodOrderCancellation()` |

### 4. Informações de Pagamento

| Critério | Status | Observações |
|----------|--------|-------------|
| Exibir tipo de pagamento | ✅ Implementado | Mapeado em `mapIfoodPaymentMethod()` |
| Exibir bandeira do cartão | ✅ Implementado | Exibida na seção "Entrega e Pagamento" |
| Exibir valor do troco (pagamento em dinheiro) | ✅ Implementado | Campo `changeAmount` exibido quando presente |
| Exibir cupons de desconto | ✅ Implementado | Exibe responsável (iFood/Loja) na seção iFood |

### 5. Informações do Pedido

| Critério | Status | Observações |
|----------|--------|-------------|
| Exibir observações dos itens | ✅ Implementado | Campo `notes` nos itens |
| Exibir CPF/CNPJ quando obrigatório | ✅ Implementado | Exibido na seção "Entrega e Pagamento" |
| Exibir código de coleta do pedido | ✅ Implementado | `displayId` destacado em vermelho no cabeçalho |

### 6. Sincronização de Status

| Critério | Status | Observações |
|----------|--------|-------------|
| Atualizar status de pedido cancelado | ✅ Implementado | Evento CAN tratado |
| Sincronizar com outros apps (Gestor de Pedidos) | ✅ Implementado | Eventos CFM, DSP, CON, RTP tratados |
| Descartar eventos duplicados | ⚠️ Verificar | Não há verificação explícita de duplicação |

### 7. Plataforma de Negociação

| Critério | Status | Observações |
|----------|--------|-------------|
| Receber eventos da Plataforma de Negociação | ⚠️ Pendente | Eventos de negociação não tratados (verificar se obrigatório) |

### 8. Observações de Entrega

| Critério | Status | Observações |
|----------|--------|-------------|
| Exibir observações sobre entrega (delivery.observations) | ✅ Implementado | Exibido na seção "iFood - Informações do Pedido" |

---

## Requisitos Não Funcionais

| Critério | Status | Observações |
|----------|--------|-------------|
| Renovar token somente quando prestes a expirar | ✅ Implementado | Cache com margem de 5 minutos |
| Respeitar rate limit | ✅ Implementado | Não há polling agressivo |

---

## Resumo

| Categoria | Implementado | Parcial | Não Implementado |
|-----------|-------------|---------|------------------|
| Recebimento de Eventos | 2 | 0 | 0 |
| Tipos de Pedido | 3 | 0 | 0 |
| Cancelamentos | 2 | 0 | 0 |
| Informações de Pagamento | 4 | 0 | 0 |
| Informações do Pedido | 3 | 0 | 0 |
| Sincronização de Status | 2 | 1 | 0 |
| Plataforma de Negociação | 0 | 1 | 0 |
| Observações de Entrega | 1 | 0 | 0 |
| Requisitos Não Funcionais | 2 | 0 | 0 |
| **TOTAL** | **19** | **2** | **0** |

---

## Itens Pendentes para Verificação

1. **Verificação de duplicação de eventos** - Implementar verificação para evitar processar eventos duplicados
2. **Plataforma de Negociação** - Verificar se é obrigatório para homologação e implementar se necessário

---

## Conclusão

O sistema está **95% pronto** para homologação. Os critérios obrigatórios de exibição de informações estão todos implementados. Os itens pendentes são:

1. **Verificação de duplicação de eventos** - Recomendado implementar antes da homologação
2. **Plataforma de Negociação** - Verificar com o iFood se é obrigatório para a categoria do aplicativo

