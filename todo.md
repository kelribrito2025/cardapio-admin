# Cardápio Admin - TODO

## Layout e Navegação
- [x] Sidebar fixa com navegação (Dashboard, Catálogo, Pedidos, Estoque, Promoções/Cupons, Clientes, Relatórios, Configurações)
- [x] Topbar com busca global, toggle loja aberta/fechada, notificações e perfil
- [x] Layout responsivo (desktop, tablet, mobile)

## Dashboard
- [x] Cards KPI (pedidos hoje, faturamento, ticket médio, itens em falta)
- [x] Gráfico de pedidos/faturamento últimos 7 dias
- [x] Lista de pedidos recentes com status e tempo
- [x] Skeleton loading nos cards

## Catálogo de Produtos
- [x] Lista de produtos em tabela estilo iFood
- [x] Filtros (busca por nome, categoria, status, disponibilidade)
- [x] Ordenação (mais vendidos, nome, preço)
- [x] Ações (editar, duplicar, pausar, arquivar, excluir)
- [x] Toggle ativo/inativo direto na linha
- [x] Badges de status e estoque
- [x] Estados vazios com CTA
- [ ] Paginação

## Criar/Editar Produto
- [x] Formulário com nome, descrição, categoria, preço
- [x] Upload de fotos (via URL)
- [x] Disponibilidade (ativo/pausado)
- [x] Controle de estoque
- [x] Complementos/Adicionais com limites (mínimo/máximo)
- [x] Tempo de preparo
- [x] Preview do card do produto
- [x] Validação por campo
- [x] Botão Salvar sticky

## Categorias
- [x] Adicionar categoria
- [ ] Reordenar categorias (drag and drop)
- [ ] Editar/Excluir categoria

## Gestão de Pedidos
- [x] Tabs por status (Novos, Em preparo, Prontos, Finalizados, Cancelados)
- [x] Cards de pedido com tempo, status, itens, valor
- [x] Ações (Aceitar, Iniciar preparo, Concluir, Cancelar)
- [x] Modal de detalhes do pedido
- [ ] Atualização em tempo real (WebSocket)

## Configurações do Estabelecimento
- [x] Nome do restaurante
- [x] Upload de logotipo (via URL)
- [x] Upload de imagem de capa (via URL)
- [x] Endereço completo (rua, número, complemento, bairro, cidade, estado)

## Configurações de Atendimento
- [x] Link do cardápio personalizado
- [x] WhatsApp para receber pedidos
- [x] Formas de pagamento (Dinheiro, Cartão, Pix, Boleto)
- [x] Tipos de entrega (Entrega, Retirada)

## Funcionalidades Futuras (Placeholder)
- [ ] Estoque (página dedicada)
- [ ] Promoções/Cupons
- [ ] Clientes
- [ ] Relatórios


## Atualização de UI/Estilo (Apenas Visual)
- [x] Atualizar tema global (cores, tipografia, variáveis CSS)
- [x] Redesenhar componentes compartilhados (cards, badges, botões)
- [x] Modernizar Sidebar com visual mais limpo
- [x] Atualizar Topbar com hierarquia visual melhor
- [x] Aplicar novo estilo ao Dashboard
- [x] Aplicar novo estilo ao Catálogo
- [x] Aplicar novo estilo aos Pedidos
- [x] Aplicar novo estilo às Configurações
- [x] Aplicar novo estilo ao ProductForm


## Bugs
- [x] Corrigir erro "establishment.get data is undefined" na página /catalogo
- [x] Renomear "Catálogo" para "Cardápio" no menu lateral
- [x] Corrigir erro 404 ao clicar em editar produto
- [x] Implementar upload de imagens real (selecionar arquivos do computador em vez de URL)
- [x] Corrigir badge "Sem estoque" mostrando incorretamente quando produto tem estoque
- [x] Alterar sidebar para cor escura com estilo degradê
- [x] Ajustar sidebar para tom mais claro puxado para vermelho com degradê
- [x] Ajustar sidebar para vermelho mais vibrante e adicionar efeito de sombra
- [x] Ajustar sidebar para tom cinza claro com degradê
- [x] Redesenhar sidebar com visual elegante e cinza muito claro (quase branco)
- [x] Adicionar botão toggle minimizar/maximizar na sidebar
- [x] Implementar estado minimizado (apenas ícones, sem textos)
- [x] Adicionar tooltips nos itens quando sidebar minimizada
- [x] Persistir estado no localStorage
- [x] Manter comportamento responsivo (drawer no mobile)
