# Relatório de Validação Pós-Correção — Complementos com Preço Independente por Grupo

## 1. Página /complementos (gestão global): Altera templates ou instâncias vinculadas?

**Resposta: Altera instâncias vinculadas diretamente (não são templates).**

A página `/complementos` opera com funções "ByName" que propagam alterações para **todas as instâncias reais** de complementos/grupos com o mesmo nome em todos os produtos do estabelecimento. Não existe conceito de "template" — as operações são diretas no banco de dados.

| Operação na página /complementos | O que acontece | Escopo |
|---|---|---|
| Editar preço de um complemento (`updateGlobal`) | Atualiza **todos** os itens com esse nome em **todos** os grupos/produtos | Estabelecimento inteiro |
| Editar regras do grupo (`updateGroupRules`) | Atualiza min/max/obrigatório em **todos** os grupos com esse nome | Estabelecimento inteiro |
| Excluir grupo (`deleteGroupByName`) | Remove **todos** os grupos com esse nome e seus itens | Estabelecimento inteiro |
| Excluir complemento (`deleteItemByName`) | Remove **todos** os itens com esse nome de **todos** os grupos | Estabelecimento inteiro |
| Adicionar item ao grupo (`addItemToGroupByName`) | Adiciona o item em **todos** os grupos com esse nome | Estabelecimento inteiro |
| Pausar/ativar grupo (`toggleGroupActive`) | Altera isActive em **todos** os grupos com esse nome | Estabelecimento inteiro |

**Importante**: Isso é o comportamento esperado e desejado para a gestão global. Quando o usuário edita na página `/complementos`, ele quer propagar para todos os produtos.

**Já no catálogo** (por produto), cada grupo é independente — alterar preço/nome/regras no Grupo X do Produto A **não afeta** o Grupo K do Produto B.

---

## 2. Pedidos antigos preservam o preço do momento da compra?

**Resposta: Sim, os pedidos são 100% imutáveis em relação a preços.**

A tabela `orderItems` armazena um **snapshot completo** no momento da compra:

| Campo | Tipo | Descrição |
|---|---|---|
| `productName` | varchar | Nome do produto no momento da compra |
| `unitPrice` | decimal | Preço unitário no momento da compra |
| `totalPrice` | decimal | Preço total (unitário × quantidade) |
| `complements` | JSON | Array com `{ name, price, quantity }` — snapshot dos complementos |

Os complementos são salvos como **JSON serializado** dentro do campo `complements`, com nome, preço e quantidade fixos. Não há referência (foreign key) ao `complementItems.id` — ou seja, mesmo que o complemento seja excluído, renomeado ou tenha o preço alterado, o pedido antigo permanece intacto.

**Teste do cenário proposto:**
1. Criar Grupo A → Y = R$1 ✅
2. Criar Grupo B → Y = R$2 ✅
3. Fazer pedido no Grupo A → pedido salva `{ name: "Y", price: 1.00, quantity: 1 }` ✅
4. Alterar preço do Grupo A → Y = R$5 ✅
5. Pedido antigo mantém R$1 → **SIM**, o JSON do pedido não é afetado ✅

---

## 3. Exclusão de complemento de um grupo: impacta outros?

**Resposta: Depende do contexto (catálogo vs. gestão global).**

| Contexto | Função | Comportamento |
|---|---|---|
| **Catálogo** (por produto) | `deleteComplementItem(id)` | Remove **apenas** o item específico pelo ID. Não afeta outros grupos. |
| **Catálogo** (por produto) | `deleteComplementGroup(id)` | Remove **apenas** o grupo específico e seus itens. Não afeta outros produtos. |
| **Gestão global** (/complementos) | `deleteComplementItemByName(estId, name)` | Remove **todos** os itens com esse nome em **todos** os grupos do estabelecimento. |
| **Gestão global** (/complementos) | `deleteComplementGroupByName(estId, name)` | Remove **todos** os grupos com esse nome e seus itens em **todos** os produtos. |

**Conclusão**: No catálogo, a exclusão é isolada por grupo/produto. Na gestão global, é intencional que propague.

---

## 4. Risco de duplicação descontrolada?

**Resposta: Existe um risco moderado, mas é gerenciável.**

Como cada grupo agora é independente, é possível que:
- O mesmo complemento "Queijo extra" exista em 20 grupos com preços diferentes
- Não há constraint de unicidade por nome no banco de dados

**Mitigações existentes:**
- A página `/complementos` agrupa por nome para visualização, permitindo gestão em massa
- A funcionalidade "Copiar grupo existente" copia grupos inteiros, mantendo consistência
- O usuário pode usar a gestão global para padronizar preços quando necessário

**Risco real**: O risco é baixo porque a duplicação acontece por decisão do usuário (copiar grupo, criar grupo manualmente). Não há duplicação automática ou descontrolada.

---

## Resumo Final

| Pergunta | Status | Detalhes |
|---|---|---|
| /complementos altera instâncias reais? | ✅ Sim, intencionalmente | Operações "ByName" propagam para todos os produtos |
| Pedidos preservam preço da compra? | ✅ Sim, 100% | Snapshot JSON imutável em `orderItems.complements` |
| Exclusão no catálogo é isolada? | ✅ Sim | `deleteComplementItem(id)` e `deleteComplementGroup(id)` por ID |
| Exclusão na gestão global propaga? | ✅ Sim, intencionalmente | `deleteItemByName` e `deleteGroupByName` afetam todo o estabelecimento |
| Risco de duplicação descontrolada? | ⚠️ Baixo | Sem constraint de unicidade, mas duplicação é por decisão do usuário |
