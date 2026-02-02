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
| Pedidos delivery agendados (DELIVERY/SCHEDULED) | ⚠️ Parcial | Recebe mas NÃO exibe data/hora agendada na tela |
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
| Exibir bandeira do cartão | ⚠️ Parcial | Dados recebidos mas NÃO exibidos na tela |
| Exibir valor do troco (pagamento em dinheiro) | ⚠️ Parcial | Campo `changeAmount` salvo mas NÃO exibido na tela |
| Exibir cupons de desconto | ⚠️ Parcial | Campo `discount` salvo mas NÃO exibe responsável (iFood/Loja) |

### 5. Informações do Pedido

| Critério | Status | Observações |
|----------|--------|-------------|
| Exibir observações dos itens | ✅ Implementado | Campo `notes` nos itens |
| Exibir CPF/CNPJ quando obrigatório | ⚠️ Parcial | Campo recebido mas NÃO exibido na tela |
| Exibir código de coleta do pedido | ⚠️ Parcial | `displayId` salvo mas NÃO destacado na tela |

### 6. Sincronização de Status

| Critério | Status | Observações |
|----------|--------|-------------|
| Atualizar status de pedido cancelado | ✅ Implementado | Evento CAN tratado |
| Sincronizar com outros apps (Gestor de Pedidos) | ✅ Implementado | Eventos CFM, DSP, CON tratados |
| Descartar eventos duplicados | ⚠️ Verificar | Não há verificação explícita de duplicação |

### 7. Plataforma de Negociação

| Critério | Status | Observações |
|----------|--------|-------------|
| Receber eventos da Plataforma de Negociação | ❌ Não implementado | Eventos de negociação não tratados |

### 8. Observações de Entrega

| Critério | Status | Observações |
|----------|--------|-------------|
| Exibir observações sobre entrega (delivery.observations) | ⚠️ Parcial | Campo salvo em `notes` mas não destacado |

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
| Tipos de Pedido | 2 | 1 | 0 |
| Cancelamentos | 2 | 0 | 0 |
| Informações de Pagamento | 1 | 3 | 0 |
| Informações do Pedido | 1 | 3 | 0 |
| Sincronização de Status | 2 | 1 | 0 |
| Plataforma de Negociação | 0 | 0 | 1 |
| Observações de Entrega | 0 | 1 | 0 |
| Requisitos Não Funcionais | 2 | 0 | 0 |
| **TOTAL** | **12** | **9** | **1** |

---

## Itens Prioritários para Correção

1. **Exibir data/hora de pedidos agendados (SCHEDULED)** - Obrigatório
2. **Exibir bandeira do cartão** - Obrigatório
3. **Exibir valor do troco** - Obrigatório
4. **Exibir CPF/CNPJ do cliente** - Obrigatório
5. **Destacar código de coleta (displayId)** - Obrigatório
6. **Exibir responsável pelo desconto (iFood/Loja)** - Obrigatório
7. **Implementar Plataforma de Negociação** - Obrigatório
8. **Verificar duplicação de eventos** - Desejável
