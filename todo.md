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
- [x] Reordenar categorias (drag and drop)
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
- [x] Mover botão minimizar/maximizar para a mesma linha do título Cardápio
- [x] Trocar ícone do botão toggle para algo mais adequado
## Drag & Drop no Cardápio

- [x] Adicionar campo sortOrder no schema de produtos e categorias
- [x] Criar endpoints de reordenação no backend
- [x] Implementar drag & drop para itens dentro de categorias
- [x] Adicionar drag handle (ícone grip) nos itens
- [x] Persistir ordem no banco com atualização otimista
- [x] Implementar modo "Reordenar Categorias" separado
- [x] Mostrar apenas categorias no modo de reordenação (sem produtos)
- [x] Botões Concluir/Cancelar no modo de reordenação
- [x] Desabilitar drag quando filtros ativos
- [x] Suporte para desktop e mobile (touch)


## Container Avaliação Gratuita na Sidebar
- [x] Adicionar container "Avaliação gratuita" no final da sidebar conforme design do Figma
- [x] Mover container "Avaliação gratuita" para o final da sidebar (após Estabelecimento)
- [x] Alterar gradiente do container de verde para vermelho
- [x] Fixar container "Avaliação gratuita" no fundo absoluto da sidebar (mt-auto)

## Card Acumulado da Semana na Dashboard
- [x] Criar endpoint para buscar faturamento semanal agrupado por dia
- [x] Criar componente WeeklyRevenueCard com gráfico de barras
- [x] Adicionar toggle "Esta semana / Semana passada"
- [x] Implementar tooltip ao passar o mouse nas barras
- [x] Calcular variação % vs semana anterior
- [x] Adicionar skeleton loading
- [x] Garantir responsividade no mobile
- [x] Integrar o card na Dashboard

## Dados de Teste para Gráfico Semanal
- [x] Criar e executar script SQL para inserir pedidos de teste nas últimas duas semanas

## Edição Inline de Categorias
- [x] Adicionar cursor pointer ao nome da categoria
- [x] Implementar campo editável ao clicar no nome
- [x] Adicionar botões de confirmar (✅) e cancelar (❌)
- [x] Salvar alteração ao confirmar e rollback ao cancelar

## Micro-efeito Visual na Edição de Categoria
- [x] Adicionar mudança sutil de cor de fundo ao hover no título da categoria
- [x] Adicionar ícone de lápis que aparece ao passar o mouse
- [x] Transição suave para reforçar possibilidade de edição

## Ícone de Minimizar/Maximizar Sidebar
- [x] Alterar ícone para painel lateral (PanelLeft/PanelLeftClose)

## Remoção do Container de Filtros
- [x] Remover container de filtros (busca, categoria, status, estoque, ordenação) do Catálogo

## Layout do Formulário de Produto
- [x] Colocar nome, categoria e preço na mesma linha no desktop

## Item da Lista Clicável para Edição
- [x] Tornar área do item (nome, imagem, descrição, preço) clicável para ir à página de edição
- [x] Remover botão de editar (ícone de lápis) da lista de produtos
- [x] Manter botões de toggle, duplicar e excluir

## Página de Controle de Estoque
- [x] Criar tabelas no banco: stockCategories, stockItems e stockMovements
- [x] Criar endpoints tRPC: list, create, update, delete para itens de estoque
- [x] Criar endpoints tRPC: addMovement, listMovements para histórico
- [x] Criar página de Estoque com listagem em cards/tabela
- [x] Implementar status visual (verde/amarelo/vermelho) com barras de progressão
- [x] Adicionar filtros por categoria, status e busca por nome
- [x] Criar modal para adicionar novo item
- [x] Criar modal para editar quantidade/adicionar estoque
- [x] Criar modal para ver histórico de movimentações
- [x] Implementar ação "Marcar como em falta"
- [x] Garantir responsividade (mobile/tablet/desktop)
- [x] Adicionar feedback visual após atualizações

## Bugs
- [x] Corrigir link do menu Estoque na sidebar que não carrega a página

## Estilo Visual dos Cards de Estoque
- [x] Ajustar cards da página de Estoque para seguir o mesmo estilo visual da Dashboard

## Remoção do Container de Filtros do Estoque
- [x] Remover container de filtros (busca, categorias, status) da página de Estoque

## Cards de Status na Página de Pedidos
- [x] Ajustar cards de status (Novos, Em Preparo, Pronto, Finalizado, Cancelado) para seguir estilo dos cards da página de Estoque

## Dados Mockados de Pedidos
- [x] Adicionar pedidos de teste para cada status (Novos, Em Preparo, Prontos, Finalizados, Cancelados)

## Card de Pedidos Recentes
- [x] Atualizar card de Pedidos Recentes na Dashboard com novo modelo (StatusBadge, layout compacto, ícone de relógio)

## Lista de Itens do Estoque
- [x] Implementar tabela com colunas: Item (nome+categoria), Estoque atual (qtd+min/max), Status, Custo unitário, Valor total, Última atualização, Ações

## Remoção de Páginas
- [x] Remover páginas e menus de Promoções, Clientes e Relatórios

## Redução de Tamanho do Layout
- [x] Reduzir tamanho da barra de menu lateral em 20%
- [x] Reduzir espaçamentos das páginas (Dashboard, Cardápio, Pedidos, Estoque, Configurações) em 20%

## Redução de Tamanho da Dashboard
- [x] Reduzir tamanho dos cards de métricas, gráficos, fontes e espaçamentos em 20%

## Redução de Tamanho das Páginas (Cardápio, Pedidos, Estoque)
- [x] Reduzir tamanhos na página de Cardápio em 20%
- [x] Reduzir tamanhos na página de Pedidos em 20%
- [x] Reduzir tamanhos na página de Estoque em 20%

## Redução de Tamanho da Página de Novo Produto
- [x] Reduzir tamanhos de fontes, espaçamentos, campos e botões em 20% na página /catalogo/novo

## Capitalização Automática
- [x] Criar função utilitária para capitalizar primeira letra
- [x] Aplicar capitalização em campos de nome de categoria
- [x] Aplicar capitalização em campos de nome de item/produto
- [x] Aplicar capitalização em campos de descrição
- [x] Aplicar capitalização em campos de nome de item de estoque

## Reorganização do Formulário de Produto
- [x] Mover campo "Tempo de preparo (minutos)" para o container de "Informações Básicas"

## Remoção do Menu Configurações
- [x] Remover item "Configurações" da barra lateral de navegação

## Redesenho do Modal de Detalhes do Pedido
- [x] Implementar novo layout com seções: Customer Info, Payment Details, Delivery Info, Order Items, Shipping Info
- [x] Adicionar botões de Imprimir Pedido e Mensagem no WhatsApp

## Sidebar de Detalhes do Pedido
- [x] Substituir Dialog por Sheet (sidebar) com animação de slide da direita para a esquerda

## Listagem de Estoque Compacta
- [x] Reduzir altura das linhas da tabela
- [x] Remover categoria abaixo do nome do item
- [x] Remover Min/Max da coluna de estoque atual
- [x] Aproximar nome e unidade na mesma linha

## Dados de Estoque
- [x] Adicionar 17 novos itens de estoque com diferentes categorias e quantidades

## Interação na Lista de Estoque
- [x] Fazer com que ao clicar em qualquer item da lista abra o modal de edição
- [x] Remover botão "Editar" do menu de ações

## Ajuste de Tamanho da Sidebar
- [x] Aumentar tamanho da barra de menu lateral em 15%

## Aumento de 15% nos Tamanhos das Páginas
- [x] Aumentar tamanhos na página Dashboard em 15%
- [x] Aumentar tamanhos na página Catálogo em 15%
- [x] Aumentar tamanhos na página Novo/Editar Produto em 15%
- [x] Aumentar tamanhos na página Pedidos em 15%
- [x] Aumentar tamanhos na página Estoque em 15%
- [x] Aumentar tamanhos na página Configurações em 15%

## Ajuste Adicional da Sidebar
- [x] Aumentar tamanho da barra lateral em mais 5%

## Verificação de Consistência de Tamanhos
- [x] Verificar e ajustar tamanhos da página Configurações para igualar Catálogo

## Verificação da Barra Superior (Topbar)
- [x] Verificar e restaurar tamanhos originais da topbar (busca, perfil, notificações) - CONFIRMADO: tamanhos estão iguais

## Fluxo de Autenticação (Login/Registro/Recuperação)
- [x] Criar componente AuthLayout com layout dividido (benefícios à esquerda, formulário à direita)
- [x] Criar página de Login com campos email/senha, lembrar-me, esqueceu senha
- [x] Criar página de Registro (Criar Conta) com campos nome, email, senha, confirmar senha
- [x] Criar página de Recuperação de Senha
- [x] Configurar rotas de autenticação no App.tsx
- [x] Implementar lógica de backend para registro e login com email/senha
- [x] Testar fluxo completo de autenticação

## Ajustes na Página de Criar Conta
- [x] Remover campo "Nome completo" da página de registro

## Correção do Fluxo de Login
- [x] Remover redirecionamento para autenticação Manus após login
- [x] Garantir que login redirecione diretamente para o dashboard
- [x] Testar fluxo completo: criar conta → login → dashboard

## Bug: Redirecionamento após Login
- [x] Investigar por que após login o usuário é redirecionado de volta para /login
- [x] Corrigir problema de autenticação/sessão

## Sistema de Cardápio Público
- [x] Analisar site de referência (mandinhoburgernh.saipos.com)
- [x] Adicionar campo slug ao schema de establishments com unicidade
- [x] Criar rotas públicas para buscar dados do cardápio por slug
- [x] Criar página pública do cardápio (/menu/{slug}) com categorias e produtos
- [x] Adicionar botão "Ver menu" no painel do restaurante
- [x] Atualizar página de configurações para editar slug
- [x] Validar unicidade do slug ao salvar
- [x] Testar fluxo completo

## Popular Catálogo com Dados de Hamburgueria
- [x] Criar 9 categorias de hamburgueria
- [x] Adicionar 4 produtos em cada categoria (36 produtos total)

## Popular Catálogo da conta admin@admin.com
- [x] Criar 9 categorias e 36 produtos para a conta admin@admin.com

## Redesign da Página Pública do Cardápio
- [x] Header com logo + busca + menu (Início/Pedidos/Perfil)
- [x] Foto de capa full width arredondada
- [x] Bloco de informações com foto de perfil circular sobreposta
- [x] Status aberto/fechado com horário
- [x] Barra de categorias horizontal deslizante
- [x] Lista de produtos por categoria com cards

## Correção: Categorias e Produtos para usuário 180577
- [x] Verificar establishment do usuário 180577
- [x] Criar 9 categorias de hamburgueria
- [x] Adicionar 4 produtos em cada categoria (36 produtos total)

## Adicionar Fotos aos Produtos do Usuário 180577
- [x] Buscar imagens para todos os 36 produtos
- [x] Atualizar produtos com URLs das imagens no banco de dados

## Ajustes na Seleção de Categorias do Cardápio Público
- [x] Categoria selecionada deve ficar em vermelho
- [x] Seleção dinâmica conforme o scroll (sincronização automática)
- [x] Scroll suave ao clicar na categoria
- [x] Scroll automático da barra de categorias para acompanhar categoria ativa

## Redesign da Página de Configurações - Preview do Perfil Público
- [x] Criar preview visual do perfil público na página de Configurações
- [x] Adicionar funcionalidade de upload de logo do restaurante
- [x] Adicionar funcionalidade de upload de capa do restaurante
- [x] Mostrar preview em tempo real das alterações

## Sistema de Avaliações na Página Pública
- [x] Adicionar campos de avaliação no schema do banco (rating, reviewCount)
- [x] Exibir estrela amarela, nota (0-5) e quantidade de avaliações ao lado do nome

## Bug: Efeito Fantasma no Drag and Drop de Itens
- [x] Verificar efeito de drag and drop nas categorias
- [x] Aplicar o mesmo efeito fantasma nos itens/produtos do catálogo

## Sacola no Menu Público
- [x] Seção "Calcular taxa de entrega" com ícone de localização e seta
- [x] Título "Sua sacola" com ícone de sacola vazia
- [x] Exibição de Subtotal, Taxa de entrega e Total
- [x] Seção "Tem um cupom?" com ícone e seta
- [x] Botão "Sacola vazia" (ou "Finalizar pedido" quando tiver itens)

## Modal Mais Informações no Menu Público
- [x] Criar modal ao clicar em "Mais informações"
- [x] Exibir horários de funcionamento de segunda a domingo
- [x] Destacar o dia atual (ex: Sexta-feira 18:00 às 23:00)
- [x] Exibir formas de pagamento aceitas pelo estabelecimento

## Ajuste Layout Formas de Pagamento
- [x] Colocar as 3 formas de pagamento na mesma linha (flex)

## Ícone Pulsante Status Aberto/Fechado
- [x] Adicionar ícone pulsante verde ao lado de "Aberto agora"
- [x] Adicionar ícone pulsante vermelho ao lado de "Fechado"

## Ajuste Botão Informações
- [x] Alterar "Mais informações" para "Informações"
- [x] Adicionar ícone (i) ao lado do texto

## Ícone de Alfinete no Endereço
- [x] Adicionar ícone MapPin ao lado do endereço do restaurante

## Ícones WhatsApp e Instagram no Menu Público
- [x] Adicionar ícone de WhatsApp na linha do status
- [x] Adicionar ícone de Instagram na linha do status

## Ajuste Posição Ícones Redes Sociais
- [x] Posicionar ícones WhatsApp e Instagram mais à direita no card (ml-auto)
- [x] Adicionar Instagram de teste no banco de dados

## Campo Instagram nas Configurações
- [x] Adicionar campo para cadastrar @ do Instagram no painel de configurações

## Botão Compartilhar no Menu Público
- [x] Adicionar ícone de compartilhar ao lado do WhatsApp

## Mover Ícones para Canto Superior Direito
- [x] Remover botão "Calcular taxa de entrega"
- [x] Mover ícones de compartilhar, WhatsApp e Instagram para o canto superior direito do card

## Bug: Ícone Instagram não aparece
- [x] Verificar se o campo instagram está sendo retornado na API pública (campo estava vazio no banco)

## Otimização Cards do Cardápio Público
- [x] Reduzir padding interno dos cards (p-4 para p-3)
- [x] Reduzir espaço vertical entre título, descrição e preço (mt-0.5 e mt-1.5)
- [x] Diminuir altura máxima da imagem (w-20 h-20 / w-24 h-24)
- [x] Compactar textos (text-sm, text-xs, leading-tight)
- [x] Diminuir espaço entre título da categoria e primeiro card (mb-4 para mb-2)
- [x] Ajustar margens verticais entre cards (gap-4 para gap-2, mb-8 para mb-5)
- [x] Simplificar visual (removido shadow, apenas border com hover)

## Lazy Loading Imagens do Cardápio
- [x] Adicionar loading="lazy" e decoding="async" nas imagens do ProductCard

## Correção Preview Perfil Público em Configurações
- [x] Comparar preview em /configuracoes com a página /menu/:slug original
- [x] Corrigir diferenças visuais: estrela amarela, avaliações, ícone pulsante, ícones sociais, ícone alfinete

## Mover Botão Ver Menu
- [x] Remover botão "Ver menu" da sidebar lateral
- [x] Adicionar botão "Ver menu" na topbar ao lado do botão Aberto

## Ajustes em /configuracoes
- [x] Remover container "Informações Básicas"
- [x] Adicionar ícone de editar ao lado do nome do restaurante no Preview do Perfil Público
- [x] Tornar o nome editável diretamente no Preview
- [x] Adicionar botão "Salvar Alterações" no Preview

## Bug: Ícone de Editar Distante do Nome
- [x] Ajustar posicionamento do ícone de editar para ficar próximo ao nome do restaurante (gap-1, inline-flex)

## Correção Ícone Editar Nome do Restaurante
- [x] Fazer o ícone de editar dar foco no input ao clicar (ref + onClick)
- [x] Adicionar hover vermelho no nome do restaurante (group-hover:text-primary)

## Estilo de Edição do Nome do Restaurante
- [x] Implementar hover igual às categorias do catálogo (group-hover:text-primary, hover:bg-muted/50)
- [x] Ao editar, mostrar botões check (confirmar) e X (cancelar)
- [x] Input com borda ao editar igual ao catálogo

## Ícone Editar Sempre Visível
- [x] Remover opacity-0 do ícone de editar para ficar sempre visível

## Container Aberto/Fechado no Menu do Perfil
- [x] Adicionar container de Aberto/Fechado no menu dropdown do perfil
- [x] Posicionar acima do botão de Configurações

## Remoção Container Aberto/Fechado da Topbar
- [x] Remover container de Aberto/Fechado da topbar (já está no menu do perfil)

## URL de Produção do Cardápio
- [x] Alterar link do cardápio nas configurações para usar URL de produção (mindi.manus.space)

## Layout Campos de Atendimento
- [x] Colocar campos WhatsApp e Instagram na mesma linha do link do cardápio

## Alinhamento Menus Topbar Perfil Público
- [x] Alinhar menus Início, Pedidos e Perfil no final da topbar para alinhar com o final da imagem da capa

## Layout Formulário Novo Produto
- [x] Colocar campos preço, categoria e tempo de preparo na mesma linha do nome
- [x] Fazer todos os campos ocuparem a largura disponível sem espaço em branco

## Ajuste Campo Nome do Produto
- [x] Aumentar tamanho do campo Nome do produto para ocupar espaço restante

## Remover Campo Tempo de Preparo
- [x] Remover campo tempo de preparo do formulário de produto
- [x] Remover campo prepTime do schema do banco de dados
- [x] Migrar banco de dados

## Máscara de Moeda no Campo de Preço
- [x] Implementar máscara de moeda (R$) no campo de preço do formulário de produto

## Container de Ícones Sociais no Menu Público
- [x] Criar container separado para ícones de compartilhar, WhatsApp e Instagram
- [x] Posicionar abaixo do nome, status "Aberto agora" e badges de Entrega/Retirada

## Reposicionar Ícone de Compartilhar
- [x] Mover ícone de compartilhar para a mesma linha das avaliações (no final)
- [x] Quando nome for muito grande, ícone vai para o container de WhatsApp/Instagram (via flex-wrap)

## Dropdown para Ícones Sociais
- [x] Substituir exibição direta de WhatsApp/Instagram por uma setinha
- [x] Ao clicar na setinha, mostrar dropdown com ícones de WhatsApp e Instagram

## Corrigir Quebra de Linha do Ícone de Compartilhar
- [x] Evitar que o ícone de compartilhar quebre de linha em telas menores

## Ocultar Número de Avaliações em Mobile
- [x] Remover número de avaliações ao lado da nota em mobile
- [x] Mostrar total de avaliações ao clicar na estrela/nota (tooltip)

## Reduzir Altura do Banner
- [x] Diminuir altura da capa/banner em 17% (h-48→h-40, h-64→h-52, h-72→h-60)
- [x] Diminuir altura da capa/banner em mais 5% (h-40→h-36, h-52→h-48, h-60→h-56)

## Salvamento Automático no Preview do Perfil Público
- [x] Remover botão de salvar do container de Preview do Perfil Público
- [x] Implementar salvamento automático ao alterar foto, nome ou outros campos

## Reorganizar Campos de Endereço
- [x] Linha 1: Rua, Número e Bairro
- [x] Linha 2: Complemento, Cidade, Estado e CEP

## Formas de Pagamento em Linha Horizontal
- [x] Colocar as 4 formas de pagamento em uma linha horizontal (grid 4 colunas)

## Reduzir Largura dos Campos WhatsApp e Instagram
- [x] Diminuir largura dos campos WhatsApp e Instagram em 20% (maxWidth: 80%)

## Aumentar Largura do Campo Link do Cardápio
- [x] Fazer o campo Link do cardápio ocupar todo o espaço restante (linha própria com largura total)

## Remover Descrição do Card Pedidos Recentes
- [x] Remover texto "Últimas atualizações" do card Pedidos Recentes no Dashboard

## Exibir Nome e Foto do Restaurante no Header
- [x] Substituir texto "Cardápio" pelo nome do restaurante
- [x] Substituir ícone padrão pela foto do perfil do restaurante

## Trocar Ícone de Maximizar Menu
- [x] Substituir ícone PanelLeft por ChevronRight (menor) quando menu estiver minimizado

## Corrigir Proporções das Abas de Navegação
- [x] Verificar e corrigir proporções das abas Estabelecimento e Atendimento (padding px-4 py-2, min-w-[140px])

## Remover Botão de Atualizar em /pedidos
- [x] Remover o botão de atualizar da página de pedidos

## Remover Descrições dos Cards em /configuracoes
- [x] Remover descrição "Veja como seu restaurante aparecerá para os clientes" do card Preview
- [x] Remover descrição "Usado como endereço de retirada" do card Endereço

## Ajustar Visual do Card Avaliação Gratuita
- [x] Modificar estilo do card "Avaliação gratuita" na sidebar para ficar consistente com o sistema

## Página de Planos
- [x] Criar página /planos com identidade visual do sistema
- [x] Implementar 3 cards: Gratuito, Lite, Pro
- [x] Cada card com: título, lista de recursos, preço, botão de assinatura
- [x] Destaque especial no plano Pro (cor primária, badge "Mais popular")
- [x] Adicionar item "Planos" no dropdown do perfil (abaixo de Configurações)
- [x] Adicionar rota /planos no App.tsx
- [x] Garantir responsividade da página (grid 1-3 colunas)

## Remover Container de Estabelecimento da Sidebar
- [x] Remover o container "ESTABELECIMENTO / Restaurante Doca Iracema" da barra lateral

## Modal de Adicionar Item ao Carrinho
- [x] Criar modal com foto do item em destaque no topo
- [x] Exibir título e descrição do item
- [x] Adicionar campo de observação (texto livre)
- [x] Implementar controle de quantidade (-, número, +)
- [x] Adicionar botão "Adicionar" com estilo visual padrão
- [x] Abrir modal ao clicar em qualquer item do cardápio
- [x] Quantidade mínima: 1
- [x] Atualizar sacola imediatamente ao clicar em Adicionar
- [x] Fechar modal após adicionar

## Grupos de Complementos no Modal
- [x] Buscar dados dos complementos associados ao produto
- [x] Exibir grupos de complementos no modal (nome do grupo, mínimo/máximo)
- [x] Listar itens de cada grupo com nome e preço adicional
- [x] Implementar seleção de complementos (checkbox/radio conforme regras)
- [x] Calcular preço total incluindo complementos selecionados
- [x] Incluir complementos selecionados ao adicionar à sacola
