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

## Complementos no X-Tudo e Correção do Carrinho
- [x] Adicionar grupos de complementos ao produto X-Tudo (Adicionais, Ponto da carne, Bebida)
- [x] Corrigir exibição da sacola para mostrar itens adicionados dinamicamente
- [x] Corrigir cálculo de subtotal e total na sacola
- [x] Corrigir botão "Adicionar" para adicionar item ao carrinho corretamente

## Funcionalidade de Remover Itens da Sacola
- [ ] Adicionar botão de remover item na sacola
- [ ] Implementar função para remover item do carrinho
- [ ] Atualizar totais após remoção


## Funcionalidade de Remover Itens da Sacola
- [x] Adicionar botão de remover item na sacola
- [x] Implementar função para remover item do carrinho
- [x] Atualizar totais após remoção


## Ajuste Visual da Sacola
- [x] Remover fotos dos itens na sacola


## Modal de Cupom no Menu Público
- [x] Criar modal de cupom ao clicar em "Tem um cupom?"
- [x] Adicionar campo de texto para digitar o cupom
- [x] Adicionar botão "Aplicar cupom" ao lado do campo
- [x] Validar se sacola está vazia e exibir mensagem de feedback
- [x] Manter modal aberto após validação


## Ajuste Altura Modal de Adicionar Item
- [x] Reduzir altura máxima do modal em 20%
- [x] Garantir responsividade para várias telas (mobile, tablet, desktop)


## Correção Botão Adicionar Cortado
- [x] Garantir que o footer do modal fique sempre visível
- [x] Ajustar estrutura do modal para não cortar o botão


## Borda Lateral nos Cards de Produtos
- [x] Adicionar borda esquerda vermelha nos cards de produtos

- [x] Mudar borda vermelha da lateral esquerda para a parte inferior dos cards

- [x] Reverter borda para lateral esquerda com 3px de espessura


## Fluxo de Finalização de Pedido
- [x] Modal 1: Resumo dos itens, complementos, subtotal, taxa, total e observações
- [x] Modal 2: Forma de entrega (retirar/entrega) e forma de pagamento (dinheiro/cartão/pix)
- [x] Modal 2: Campos de endereço condicionais para entrega
- [x] Modal 2: Campo de troco condicional para pagamento em dinheiro
- [x] Modal 3: Resumo final completo do pedido
- [x] Modal 4: Identificação do cliente (nome e telefone com máscara)
- [x] Modal 5: Confirmação final com mensagem e botões Voltar/Enviar pedido
- [x] Navegação sequencial entre modais com botão voltar
- [x] Responsividade em todos os modais


## Melhorias no Fluxo de Finalização
- [x] Adicionar indicador de progresso no topo dos modais (5 etapas)
- [x] Implementar salvamento de endereço do cliente no localStorage
- [x] Criar feedback de carregamento no botão enviar pedido (3 segundos)


## Ajuste Largura Menu Público Desktop
- [x] Aumentar largura do container do menu público em 20% na versão desktop


## Correção Visual do Modal de Checkout
- [x] Integrar indicador de progresso ao modal de resumo do pedido em um único bloco


## Confirmação de Pedido e Acompanhamento
- [x] Exibir mensagem "Pedido enviado com sucesso!" no mesmo modal após clicar em Enviar
- [x] Adicionar botão "Acompanhar pedido" abaixo da mensagem de sucesso
- [x] Criar modal de acompanhamento com timeline de status
- [x] Implementar status: Enviado, Aceito, Saiu para entrega, Entregue
- [x] Status atual em cor primária, futuros em cinza, concluídos em verde
- [x] Modal responsivo e reutilizável


## Ajuste Sacola no Mobile
- [x] Substituir ícone de perfil pelo ícone de sacola no menu mobile
- [x] Ao clicar, abrir o modal/drawer da sacola
- [x] Manter comportamento do desktop inalterado


## Menu de Pedidos no Cardápio Público
- [x] Criar estrutura de armazenamento de pedidos no localStorage
- [x] Salvar pedido enviado com todos os dados (itens, endereço, pagamento, status)
- [x] Implementar modal de Pedidos com histórico e pedidos atuais
- [x] Exibir pedidos em andamento com status atual
- [x] Exibir histórico de pedidos anteriores
- [x] Integrar botão Pedidos do menu mobile com a nova funcionalidade
- [x] Permitir abrir modal de acompanhamento a partir de um pedido


## Ajuste Visual Modal Resumo do Pedido
- [x] Remover fotos dos itens no modal de resumo do pedido


## Substituir Perfil por Sacola no Desktop
- [x] Substituir botão Perfil pelo botão Sacola no header desktop
- [x] Adicionar badge de quantidade de itens no carrinho


## Correção Posição Campo de Troco
- [x] Mover campo "Precisa de troco" para logo abaixo do card Dinheiro


## Correção Modal Sacola Desktop
- [x] Corrigir modal da sacola para aparecer na versão desktop


## Integração Backend Pedidos
- [ ] Criar tabelas orders e orderItems no banco de dados
- [ ] Criar rotas tRPC para criar pedido (público) e listar/atualizar pedidos (admin)
- [ ] Atualizar cardápio público para enviar pedidos ao backend
- [ ] Remover dados mockados da página de pedidos do admin
- [ ] Implementar listagem de pedidos em tempo real no admin
- [ ] Implementar atualização de status do pedido pelo admin


## Integração de Pedidos com Backend
- [x] Criar campo changeAmount no schema de orders para troco
- [x] Criar funções de banco de dados para pedidos públicos (createPublicOrder, getPublicOrderByNumber, getOrdersByPhone, getAllOrdersByEstablishment, getActiveOrdersByEstablishment)
- [x] Criar rotas tRPC para criar pedido público (publicMenu.createOrder)
- [x] Criar rotas tRPC para buscar pedido por número (publicMenu.getOrderByNumber)
- [x] Criar rotas tRPC para buscar pedidos por telefone (publicMenu.getOrdersByPhone)
- [x] Criar router orders para admin (list, get, getActive, updateStatus)
- [x] Atualizar PublicMenu.tsx para enviar pedidos via API em vez de localStorage
- [x] Atualizar página Pedidos.tsx do admin para usar as novas rotas
- [x] Implementar polling de 10 segundos para atualização automática de pedidos
- [x] Criar testes unitários para as funções de pedidos


## Integração de Pedidos com Backend (Solicitação do Usuário)

- [x] Criar rotas públicas para criar pedidos via API
- [x] Integrar cardápio público com backend para salvar pedidos
- [x] Remover dados mockados da página de pedidos do admin
- [x] Implementar atualização em tempo real dos pedidos (polling a cada 30s)
- [x] Permitir que o restaurante atualize status dos pedidos


## Migração de Polling para SSE (Server-Sent Events)

- [x] Criar endpoint SSE no backend para streaming de pedidos por estabelecimento
- [x] Implementar sistema de emissão de eventos quando pedidos são criados
- [x] Implementar sistema de emissão de eventos quando status de pedidos são atualizados
- [x] Atualizar página de pedidos do admin para usar SSE
- [x] Manter polling como fallback caso conexão SSE falhe
- [x] Testar latência e funcionamento em tempo real


## Página de Gerenciamento de Cupons

### Backend
- [x] Criar tabela coupons no schema do banco de dados
- [x] Adicionar campos: code, type, value, maxDiscount, minOrderValue, quantity, usedCount
- [x] Adicionar campos de disponibilidade: startDate, endDate, activeDays, validOrigins, startTime, endTime
- [x] Criar endpoints tRPC: list, create, update, delete, toggleStatus

### Listagem de Cupons
- [x] Criar página /cupons com tabela de cupons
- [x] Exibir colunas: código, tipo, valor, valor máximo, mínimo pedido, validade, dias ativos, origem, status, quantidade, ações
- [x] Adicionar botão "Criar novo cupom"
- [x] Adicionar campo de busca por código
- [x] Implementar ações: Editar, Desativar, Excluir

### Formulário Criar/Editar Cupom
- [x] Campo código do cupom (máx 15 caracteres)
- [x] Toggle tipo de desconto (Percentual / Valor Fixo)
- [x] Campo valor do desconto (dinâmico conforme tipo)
- [x] Campo valor máximo do desconto
- [x] Campo valor mínimo do pedido
- [x] Campo quantidade total de cupons
- [x] Seção Disponibilidade: período de validade (data inicial/final)
- [x] Checkboxes dias da semana (Dom-Sáb)
- [x] Checkboxes origem válida (Retirada, Delivery, Autoatendimento)
- [x] Campos horário disponível (início/fim)
- [x] Botão Criar/Salvar com validações
- [x] Feedbacks de erro e sucesso

### Responsividade e UX
- [x] Garantir responsividade desktop/mobile
- [x] Seguir padrão visual do Mindi (inputs, botões, cards, espaçamentos)


## Integração de Cupons no Checkout do Cardápio Público

- [x] Criar rota pública para validar cupom (publicMenu.validateCoupon)
- [x] Atualizar modal de cupom no PublicMenu para validar via API
- [x] Exibir desconto aplicado na sacola após validação
- [x] Integrar desconto do cupom no cálculo do total
- [x] Atualizar criação de pedido para incluir cupom e desconto
- [x] Incrementar usedCount do cupom ao criar pedido
- [x] Testar fluxo completo de aplicação de cupom


## Correção Visual dos Cards de Cupons

- [x] Ajustar cards da página de cupons para seguir o mesmo padrão da página de estoque


## Bug: Cupom SEG10 retornando "Cupom inválido"

- [x] Investigar causa do erro na validação do cupom (problema na comparação de datas - endDate era comparado com meia-noite em vez do final do dia)
- [x] Corrigir o bug identificado (ajustado endDate para 23:59:59 antes da comparação)


## Erros na Página de Pedidos

- [x] Corrigir erro de establishmentId null na query de pedidos (já estava tratado com enabled: !!establishmentId)
- [x] Corrigir erro de conexão SSE (cookie name estava errado: manus_session -> app_session_id)


## Ajuste Mobile - Página de Catálogo

- [x] Ocultar fotos dos itens na versão mobile da página /catalogo

- [x] Substituir ícones de duplicar e lixeira por menu dropdown (três pontinhos) na versão mobile


## Ajuste Visual - Página de Estoque

- [x] Ajustar lista de itens da página de estoque para seguir o mesmo visual da página de cupons


## Bug: Cupom SEG10 retornando "Cupom inválido" no checkout

- [x] Verificar dados do cupom SEG10 no banco de dados
- [x] Analisar lógica de validação e identificar o problema (formato do input tRPC estava incorreto - faltava a chave "json")
- [x] Corrigir o bug identificado (adicionada chave "json" no input e extração do resultado)


## Ajuste Mobile - Ocultar Descrição no Catálogo

- [x] Ocultar descrição dos itens na versão mobile da página /catalogo


## Bug: Modal de Acompanhamento não atualiza status em tempo real

- [x] Analisar como o modal de acompanhamento busca o status do pedido
- [x] Implementar atualização em tempo real do status no modal (polling a cada 5s com getOrderByNumber)


## Ajuste Visual - Badge de Pedidos no Cardápio Público

- [x] Ajustar posição do badge de pedidos para não sobrepor a letra 's'


## Ajuste Visual - Badge da Sacola no Cardápio Público

- [x] Aplicar o mesmo ajuste de posicionamento do badge no ícone da sacola


## Badge de Contagem de Pedidos Novos no Menu Admin

- [x] Criar contexto global para gerenciar contagem de pedidos novos (NewOrdersContext)
- [x] Integrar contagem com SSE para atualização em tempo real
- [x] Adicionar badge no menu Pedidos do AdminLayout
- [x] Implementar lógica de zerar badge ao entrar na página de pedidos
- [x] Badge deve aparecer apenas quando houver pedidos com status "new"


## Bug: Modal de Acompanhar Pedido reseta status ao reabrir

- [x] Corrigir modal para buscar status atual do banco ao abrir (adicionado refetchOnMount e staleTime: 0)
- [x] Não usar estado local/cache para o status do pedido (removido setOrderStatus no onClick)
- [x] Modal deve sempre exibir o status real do pedido (força refetch ao abrir modal)


## Bloquear Pedidos com Loja Fechada

- [x] Verificar horário de funcionamento no cardápio público
- [x] Bloquear botão de adicionar quando loja fechada
- [x] Exibir mensagem "Restaurante fechado" no botão
- [x] Bloquear botão "Finalizar pedido" na sacola quando loja fechada
- [x] Bloquear botão "Enviar pedido" no checkout quando loja fechada


## Botão Avaliar Restaurante no Modal de Acompanhar Pedido

- [x] Adicionar botão "Avaliar restaurante" no modal de acompanhamento
- [x] Botão só aparece quando status for "entregue"
- [x] Criar modal simples de avaliação (preparado para campos futuros)
- [x] Seguir estilo visual dos botões do cardápio público


## Badge de Contagem de Pedidos - Mostrar apenas não entregues

- [x] Ajustar badge para contar apenas pedidos não entregues
- [x] Badge deve diminuir quando pedido mudar para status "entregue"


## Sistema de Avaliação por Estrelas

- [x] Adicionar seletor de estrelas de 1 a 5 no modal de avaliação
- [x] Adicionar campo de comentário/texto para avaliação
- [x] Estrelas devem ser clicáveis e mostrar seleção visual


## Sistema Completo de Avaliações

- [x] Criar tabela de reviews no banco de dados
- [x] Criar endpoint para salvar avaliação (createReview)
- [x] Criar endpoint para listar avaliações (getReviews)
- [x] Criar modal de avaliações que abre ao clicar na estrela/nota
- [x] Exibir nome do cliente, estrelas, comentário e data
- [x] Integrar botão "Enviar avaliação" com o backend


## Bug: Envio de Avaliação não Funciona

- [x] Investigar e corrigir problema no envio de avaliação
- [x] Adicionar tela de confirmação de sucesso após envio


## Bug: Erro ao Enviar Avaliação

- [x] Investigar erro no envio de avaliação
- [x] Corrigir problema identificado (tratamento de valores null no cálculo de média)


## Correção da Média de Avaliações e Estrelas Parciais

- [x] Corrigir exibição da média de avaliações (MySQL retornava string)
- [x] Implementar estrelas parciais (ex: 4,5 = 4 cheias + 1 meia)


## Reorganizar Modal do Fluxo do Pedido

- [x] Mover título para acima das etapas (1, 2, 3, 4, 5)
- [x] Etapas devem ficar abaixo do título
- [x] Remover headers duplicados dos modais 2, 3, 4 e 5


## Motivo de Cancelamento de Pedido

- [x] Adicionar campo cancellationReason na tabela orders
- [x] Adicionar campo de texto no modal de cancelar pedido (admin)
- [x] Atualizar endpoint de cancelamento para salvar o motivo
- [x] Exibir status "Cancelado" e motivo no modal de Acompanhar Pedido (público)


## Botão Ver Menu na Versão Mobile

- [x] Adicionar botão "Ver menu" na topbar mobile do painel admin


## Texto "Ver menu" na Versão Mobile

- [x] Adicionar texto "Ver menu" junto com o ícone na versão mobile (igual desktop)


## Edição do Status "Aceito" no Modal de Acompanhar Pedido

- [x] Alterar título de "Aceito" para "Pedido aceito"
- [x] Alterar descrição de "O restaurante aceitou seu pedido" para "Iniciamos o preparo do seu pedido."


## Ícone de Moto no Status "Saiu para entrega"

- [x] Trocar ícone do carro para ícone de moto no status "Saiu para entrega"


## Chave Pix no Checkout

- [x] Adicionar campo pixKey no schema de establishments
- [x] Criar campo para inserir chave Pix na página de Configurações (Formas de pagamento)
- [x] Exibir chave Pix com botão copiar quando Pix for selecionado no modal de checkout


## Status Condicional para Retirada no Local

- [x] Alterar status "Saiu para entrega" para "Pedido Finalizado" quando tipo de entrega for retirada
- [x] Alterar descrição para "Tudo certo! Seu pedido já está disponível para retirada."


## Badge Condicional no Modal Meus Pedidos

- [x] Corrigir badge para exibir "Pedido Finalizado" em vez de "Saiu para entrega" quando for retirada no local


## Navegação de Voltar no Fluxo de Pedido

- [x] Adicionar seta de voltar no título do modal (a partir da etapa 2)
- [x] Permitir clicar nas etapas anteriores já concluídas para voltar


## Loading no Botão Enviar Pedido

- [x] Adicionar estado de loading com delay de 3 segundos no botão Enviar pedido
- [x] Exibir ícone de loading enquanto o pedido está sendo processado


## Validação Obrigatória de Endereço para Entrega

- [x] Tornar campos Rua, Número e Bairro obrigatórios quando tipo de entrega for Entrega
- [x] Bloquear botão Próximo se campos obrigatórios não estiverem preenchidos
- [x] Exibir indicador visual de campos obrigatórios


## Sistema de Avaliação do Restaurante

- [ ] Criar tabela de avaliações no banco de dados (ratings)
- [ ] Criar endpoint para verificar se cliente pode avaliar (última avaliação > 30 dias)
- [ ] Criar endpoint para enviar avaliação
- [ ] Implementar modal de avaliação no frontend
- [ ] Exibir modal apenas quando pedido atingir status "entregue" e cliente puder avaliar
- [ ] Armazenar avaliação com data para controle de 30 dias


## Sistema de Avaliação do Restaurante (30 dias)

- [x] Criar tabela de avaliações com campo customerPhone para identificar cliente
- [x] Criar endpoint para verificar se cliente pode avaliar (30 dias)
- [x] Criar endpoint para criar avaliação com validação de 30 dias
- [x] Exibir modal de avaliação apenas quando pedido atingir status "entregue" E última avaliação > 30 dias
- [x] Ocultar botão de avaliar se cliente já avaliou nos últimos 30 dias


## Tratamento de Erro Detalhado no Envio de Pedidos

- [x] Adicionar logs detalhados no backend ao criar pedido
- [x] Melhorar mensagem de erro no frontend com detalhes do problema
- [x] Adicionar try-catch com tratamento específico de erros



## Bug de Login - Duas Tentativas

- [x] Investigar fluxo de autenticação na página /login
- [x] Identificar problema de sincronização de estado ou redirecionamento
- [x] Corrigir o bug para login funcionar na primeira tentativa



## Balão de Nota Temporária no Cardápio Público

- [x] Adicionar campos public_note e public_note_created_at no schema
- [x] Criar endpoints para salvar e remover nota
- [x] Adicionar seção de configuração com campo de texto e sugestões
- [x] Implementar botões Salvar Nota e Remover Nota
- [x] Exibir balão de nota no cardápio público acima da foto de perfil
- [x] Implementar lógica de expiração automática de 24h



## Ajustes no Balão de Nota

- [x] Posicionar balão corretamente acima da foto de perfil (canto superior esquerdo)
- [x] Adicionar quebra de linha para textos longos
- [x] Reduzir tamanho do balão e texto em 20%
- [x] Mudar modelo do balão para estilo com seta no canto inferior esquerdo



## Efeito de Animação no Balão de Nota

- [x] Adicionar efeito de animação suave no balão (float/pulse)

- [x] Balão de nota com bico em formato de gota arredondada (estilo imagem de referência)
- [x] Adicionar segundo círculo menor ao balão para efeito de balão de pensamento
- [x] Ajustar posição dos círculos do balão para ficarem centralizados na parte inferior
- [x] Mover círculos do balão para o lado esquerdo
- [x] Inverter posição dos círculos: maior à esquerda, menor à direita
- [x] Atualizar preview do perfil público nas configurações para incluir balão de nota
- [x] Adicionar dropdown de Redes Sociais com separador no preview das configurações
- [x] Adicionar menu dropdown completo com ícones de WhatsApp e Instagram no preview
- [x] Corrigir dropdown de Redes Sociais cortado - abrir para cima
- [x] Diminuir altura do campo de observações em 25%
- [x] Diminuir altura do campo de observação no modal de Resumo do Pedido em 25%
- [x] Remover espaço vazio grande abaixo do botão Acompanhar pedido no modal de Enviar Pedido
- [x] Mover botão Acompanhar pedido para o footer do modal de Enviar Pedido
- [x] Alterar cor do botão Acompanhar pedido para vermelho
- [x] Verificar e corrigir o fluxo de modais de checkout - modal de Confirmação
- [x] Remodelar card de pedidos no modal Meus Pedidos com dropdown expansível para itens
- [x] Corrigir clique no card de pedidos para fazer dropdown em vez de ir para Acompanhar Pedido
- [x] Implementar atualização automática do status dos pedidos no modal Meus Pedidos
- [x] Corrigir lógica de avaliação: não exibir botão quando já avaliou nos últimos 30 dias e corrigir erro ao enviar
- [x] Corrigir erro 'Cannot access data before initialization' no PublicMenu
- [x] Reorganizar modal Confirmar Endereço com ícones em círculos coloridos e cards com fundo claro
- [x] Implementar SSE única por usuário para atualização em tempo real do status no modal Meus Pedidos


## Correção SSE - Usar IDs de Pedidos em vez de Telefone

- [x] Alterar formato do número do pedido para #P00000 (5 dígitos)
- [x] Modificar endpoint SSE para aceitar lista de IDs de pedidos
- [x] Atualizar funções de notificação SSE para usar orderNumber
- [x] Refatorar conexão SSE no frontend para usar IDs de pedidos do localStorage
- [x] Garantir atualização automática do modal Meus Pedidos sem clique
- [x] Testar fluxo completo de atualização em tempo real


## Bug Fix - establishmentId null na página /pedidos

- [x] Corrigir erro onde establishmentId é passado como null na query de pedidos


## Bug Fix - Cardápio não encontrado no menu público

- [x] Investigar e corrigir erro "Cardápio não encontrado" após últimas alterações
- [x] Corrigir erro de establishmentId null nas queries de Pedidos.tsx


## Bug Fix - Versão publicada fora do ar

- [x] Investigar e corrigir problema na versão publicada (mindi.manus.space)
- [x] Corrigir erro de Rate Limiting (429) no SSE do menu público - SSE desabilitado temporariamente


## SSE Singleton - Conexão única por cliente

- [x] Criar singleton SSE global para gerenciar conexão única
- [x] SSE deve iniciar somente após criação do pedido (não antes)
- [x] Tratamento silencioso de erro 429 com reconexão (backoff exponencial: 3s, 6s, 12s...)
- [x] Reutilizar conexão existente em vez de abrir nova


## Bug Fix - canReview causando ERR_INSUFFICIENT_RESOURCES

- [x] Corrigir chamadas excessivas de publicMenu.canReview (usar chave única para evitar duplicação)
- [x] Esconder botão de avaliar quando usuário já avaliou (lógica já existia, corrigido para não chamar múltiplas vezes)


## Bug Fix - Erro 400 na API publicMenu e status não atualiza

- [x] Investigar e corrigir erro 400 na API publicMenu (adicionado polling a cada 10s)
- [x] Garantir atualização do status no modal Meus Pedidos (sincronização automática)


## Bug Fix - ERR_INSUFFICIENT_RESOURCES persistente no canReview

- [x] Eliminar todas as chamadas duplicadas de canReview (removido userOrders das dependências)
- [x] Garantir que canReview seja chamado apenas UMA vez por pedido (usando ref em vez de estado)


## Bug Fix - Botão de avaliar aparecendo quando já avaliou

- [x] Corrigir verificação de canReview para esconder botão quando já avaliou nos últimos 30 dias (adicionado orderStatus como dependência)


## Bug Fix - Rate Exceeded ao enviar pedido

- [x] Investigar e corrigir erro de Rate Exceeded ao enviar pedido (removido polling de 5s, aumentado intervalo de sync para 30s)


## Bug Fix - SSE múltiplas conexões na página /pedidos

- [x] Criar conexão SSE única por estabelecimento (singleton global com globalSSE)
- [x] Inicializar SSE apenas uma vez (useEffect com dependências mínimas)
- [x] Cancelar SSE ao sair da página (cleanup automático quando não há listeners)
- [x] Remover reconexões agressivas (só reconecta quando CLOSED, backoff exponencial)
- [x] SSE por establishmentId (passado como parâmetro do hook)


## SSE Multi-Tab - Compartilhar conexão entre abas

- [x] Implementar sistema de líder/seguidor com BroadcastChannel
- [x] Aba líder mantém a conexão SSE real
- [x] Outras abas recebem eventos via BroadcastChannel
- [x] Eleição automática de novo líder quando aba líder fecha (timeout 5s)
- [x] Garantir apenas 1 conexão SSE por restaurante por navegador


## Correção Completa SSE - Checklist

### A - Controle de Conexão SSE (líder/seguidor)
- [x] Verificar no mount se há líder ativo via BroadcastChannel
- [x] Apenas aba líder pode criar EventSource
- [x] Abas seguidoras NUNCA chamam /api/orders/stream
- [x] Quando líder fecha, outra aba assume em 5s (leader-closed broadcast)
- [x] Evitar múltiplas criações de SSE quando React remonta (mountedRef)
- [x] Criar singleton para conexão SSE (variáveis globais)

### B - Controle de Requisições TRPC
- [x] Garantir orders.list execute UMA vez no mount (initialFetchDone ref)
- [x] Verificar StrictMode não duplica effects (mountedRef)
- [x] Adicionar throttle/debounce se houver polling (staleTime: 30000)
- [x] Não chamar orders.list após SSE reconectar (removido do NewOrdersContext)
- [x] Remover refetchInterval de hooks (refetchInterval: false)

### C - Tratamento de Erros 429
- [x] Se "Rate exceeded" não dar retry imediato
- [x] Backoff exponencial: 1s, 2s, 5s, 10s, 20s (BACKOFF_DELAYS)
- [x] Tratar resposta de erro como texto, não JSON
- [x] Logar com tags [SSE-Error], [SSE-Leader], [SSE-Tab], [SSE-BC]

### D - Prevenção de Race Conditions
- [x] Garantir apenas 1 instância SSE por navegador (BroadcastChannel)
- [x] Reconexões só quando CLOSED + líder + retry habilitado
- [x] Broadcast ao trocar líder (leader-exists, leader-closed)


## Bug Fix - Erro 400 no Menu Público e SSE

### Investigação
- [x] Verificar payload enviado pelo menu público (establishmentId, items, price, etc)
- [x] Verificar endpoint TRPC publicMenu.createOrder e validação Zod (logs já existem)
- [x] Verificar formato dos IDs de pedidos (#P00006 - formato correto)

### Correções
- [x] Corrigir SSE singleton no menu público para evitar múltiplas conexões
- [x] Não abrir SSE se criação do pedido falhar (já implementado no onSuccess)
- [x] Adicionar logs no backend para diagnóstico (já existem)

### Validação
- [ ] Testar criação de 10 pedidos seguidos sem recarregar página


## Bug Fix - Erro 400 em TRPC publicMenu após primeiro pedido

- [x] Identificar qual query TRPC está causando erro 400 (URL contém tId%22%3A30001)
  - Problema: chamada fetch direta para API TRPC com JSON mal formatado na URL
  - Local: PublicMenu.tsx, função syncOrderStatuses (linha 418)
- [x] Corrigir parâmetros inválidos na query
  - Solução: substituir fetch direto por trpcUtils.client.publicMenu.getOrderByNumber.query()
  - Adicionado trpcUtils = trpc.useUtils() para chamadas imperativas


## Bug Fix - Erro de Inserção de Pedido no Banco de Dados

- [x] Analisar erro "Failed query: insert into orders" ao enviar pedido
  - Problema: campo changeAmount estava sendo enviado com formato brasileiro (vírgula como separador decimal: 100,00)
  - O banco de dados espera formato numérico com ponto (100.00)
- [x] Verificar schema da tabela orders e tipos de dados
  - changeAmount é decimal(10,2) que requer formato com ponto decimal
- [x] Corrigir código de criação de pedidos no frontend
  - Adicionado .replace(/\\./g, '').replace(',', '.') para converter formato brasileiro para numérico


## Validação de Valor de Troco

- [x] Validar que o valor do troco seja maior que o total do pedido
  - Validação em tempo real no onChange do campo
  - Validação adicional ao clicar no botão de enviar
- [x] Exibir mensagem de erro clara se o valor for menor que o total
  - Mensagem: "O valor do troco deve ser maior que o total do pedido (R$ X,XX)"
  - Ícone de alerta junto à mensagem
- [x] Adicionar feedback visual (borda vermelha, ícone de erro)
  - Borda vermelha no campo de input
  - Fundo vermelho claro (bg-red-50)
  - Ícone de erro dentro do campo
- [x] Bloquear envio do pedido se a validação falhar
  - Botão desabilitado quando há erro
  - Botão fica cinza para indicar estado desabilitado
- [x] Adicionar dica "Deixe em branco se não precisar de troco"


## Bug Fix - Limpar Sacola Após Enviar Pedido

- [x] Limpar sacola automaticamente após pedido ser enviado com sucesso
  - Adicionado setCart([]) no onSuccess da mutation createOrder
- [x] Resetar estados relacionados (cupom aplicado, observação, etc.)
  - setOrderObservation("")
  - setAppliedCoupon(null)
  - setChangeAmount("")
  - setChangeAmountError(null)
  - setCheckoutStep(0)


## Bug Fix - Segundo Pedido Pula Direto para Modal de Sucesso

- [x] Identificar estados que não estão sendo resetados após primeiro pedido
  - Problema: orderSent permanecia true após primeiro pedido
  - Quando usuário iniciava novo checkout, step 5 mostrava "Pedido enviado" direto
- [x] Resetar orderSent para false quando iniciar novo pedido
  - Adicionado setOrderSent(false) no botão "Finalizar pedido" (desktop)
  - Adicionado setOrderSent(false) no botão "Finalizar pedido" (mobile)
- [x] Garantir que o fluxo de checkout funcione corretamente para múltiplos pedidos
  - Agora cada novo checkout começa com orderSent=false


## Integração SMS DisparoPro

- [x] Acessar documentação da API DisparoPro
  - Endpoint: POST https://apihttp.disparopro.com.br:8433/mt
  - Autenticação: Bearer Token no header Authorization
- [x] Criar função utilitária para envio de SMS (server/_core/sms.ts)
  - sendSMS(): função genérica para envio
  - sendOrderReadySMS(): função específica para pedido pronto
  - normalizePhoneNumber(): normaliza telefone para formato 55DDDNNNNNNNNN
  - isValidPhoneNumber(): valida se telefone é válido
- [x] Normalizar telefone (DDD + número) antes de enviar
  - Remove caracteres especiais
  - Adiciona código do país 55 se necessário
  - Valida tamanho (12-13 dígitos)
- [x] Integrar envio de SMS no fluxo de atualização de status "ready"
  - Integrado em db.ts na função updateOrderStatus()
  - Busca nome do restaurante para mensagem personalizada
- [x] Garantir que SMS só seja enviado uma vez (quando status muda para "ready")
  - Condição: status === "ready"
- [x] Tratar erros silenciosamente (logar, não quebrar fluxo)
  - Envio assíncrono com .then().catch()
  - Logs de sucesso e erro no console
- [x] Ignorar envio se telefone não for válido
  - Validação com isValidPhoneNumber() antes de enviar
- [x] Solicitar token/config da DisparoPro via webdev_request_secrets
  - DISPAROPRO_TOKEN: Token de autenticação
  - DISPAROPRO_PARCEIRO_ID: ID do parceiro
- [x] Testes unitários criados (sms.test.ts, sms-credentials.test.ts)
  - 119 testes passando


## Bug Fix - Modal de Pedido Enviado Não Aparece

- [x] Investigar por que o modal de "Pedido enviado" não aparece após clicar em enviar
  - Problema: setCheckoutStep(0) estava sendo chamado no onSuccess
  - Isso fechava o modal antes do usuário ver a mensagem de sucesso
- [x] Verificar se orderSent está sendo setado corretamente
  - orderSent estava sendo setado para true corretamente
- [x] Corrigir o fluxo de exibição do modal
  - Removido setCheckoutStep(0) do onSuccess
  - Agora o modal permanece aberto mostrando "Pedido enviado com sucesso!"
  - checkoutStep só é resetado quando usuário clica em "Acompanhar pedido"


## Bug Fix - SMS Não Está Sendo Recebido

- [x] Verificar se o DDI +55 está sendo adicionado corretamente ao telefone
  - Confirmação: DDI 55 está sendo adicionado automaticamente
  - Exemplo: 88999290000 -> 5588999290000
- [x] Verificar logs do servidor para ver se o SMS está sendo enviado
  - Teste manual de envio de SMS funcionou corretamente
  - API DisparoPro retornou status "ACCEPTED" e "Message Sent"
- [x] Corrigir normalização do telefone se necessário
  - Não foi necessário - normalização já estava correta
- [x] Usuário confirmou recebimento do SMS de teste


## Configuração de Ativação/Desativação de SMS

- [x] Adicionar campo smsEnabled (boolean) no schema do estabelecimento
  - Campo adicionado em drizzle/schema.ts com default false
- [x] Executar migração do banco de dados
  - Coluna adicionada via ALTER TABLE
- [x] Criar seção de configuração de SMS na página de configurações
  - Nova seção "Notificações SMS" na tab Atendimento
- [x] Adicionar toggle para ativar/desativar SMS
  - Toggle switch com preview da mensagem quando ativado
- [x] Modificar lógica de envio de SMS para verificar se está habilitado
  - Verifica smsEnabled antes de enviar
  - Log informativo quando SMS está desativado
- [x] Testar ativação e desativação do SMS
  - 119 testes passando


## Bug Fix - Badge de Contagem de Pedidos Não Aparece

- [x] Investigar código do badge de contagem de pedidos na barra lateral
  - Problema: initialFetchDone.current impedia recalculação da contagem
  - O SSE só incrementava se não estivesse na página de pedidos
- [x] Verificar se a query de contagem de pedidos novos está funcionando
  - Query estava funcionando, mas a lógica de contagem estava incorreta
- [x] Corrigir o problema de exibição do badge
  - Removido initialFetchDone.current que bloqueava atualizações
  - SSE agora sempre incrementa a contagem quando novo pedido chega
  - Contagem inicial recalculada quando dados mudam
  - Logs de debug adicionados para acompanhamento

## Mensagem SMS Diferenciada por Tipo de Entrega

- [x] Modificar função sendOrderReadySMS para aceitar parâmetro deliveryType
  - Parâmetro opcional com default "delivery"
- [x] Mensagem para entrega: "{Nome}: Seu pedido está saindo para entrega."
- [x] Mensagem para retirada: "{Nome}: Seu pedido já está disponível para retirada."
- [x] Atualizar chamada de SMS no db.ts para passar o deliveryType do pedido
  - order.deliveryType passado como terceiro parâmetro
  - Log atualizado para mostrar tipo de entrega


## Simplificar Formato do Número do Pedido

- [x] Identificar onde o número do pedido é gerado (db.ts ou routers.ts)
  - Localizado em server/db.ts, função createPublicOrder, linha 1027
- [x] Mudar formato de #P00024 para #P24 (sem zeros à esquerda)
  - Removido .padStart(5, '0') da geração do número
  - Agora usa formato simples: `#P${nextNumber}`
- [x] Primeiro pedido de novo restaurante deve ser #P1
  - Lógica mantida: nextNumber começa em 1 se não houver pedidos anteriores
- [x] Testar criação de novos pedidos com formato simplificado
  - 119 testes passando

## Exibir Número do Pedido no Modal de Sucesso

- [x] Identificar onde o modal de "Pedido enviado com sucesso" é renderizado
  - Localizado em PublicMenu.tsx, linha 2364-2381
- [x] Adicionar exibição do número do pedido (ex: #P25) no modal
  - Adicionado parágrafo com "Número do pedido: {currentOrderNumber}"
  - Estilo destacado com cor primária
- [x] Garantir que o número do pedido seja obtido da resposta da mutation
  - Já existia currentOrderNumber sendo setado no onSuccess

## Bug Fix - Badge Invisível Quando Item Pedidos Está Selecionado

- [x] Identificar onde o badge de pedidos é renderizado na sidebar
  - Localizado em AdminLayout.tsx, linhas 230-249
- [x] Modificar estilo do badge para fundo branco e número vermelho quando selecionado
  - Quando isActive: bg-white text-primary
  - Quando não ativo: bg-red-500 text-white
- [x] Garantir contraste adequado em ambos os estados (selecionado e não selecionado)
  - Aplicado para ambos os badges (sidebar colapsada e expandida)

## Personalização de Cores Degradê para Balão de Nota

- [ ] Adicionar campo noteStyle no schema do estabelecimento
- [ ] Criar opções de estilos degradê pré-definidos
- [ ] Criar interface de seleção de estilos nas configurações
- [ ] Aplicar estilo selecionado no balão de nota do menu público
- [ ] Testar a personalização de cores


## Personalização de Cores Degradê para Balão de Nota

- [x] Adicionar campo noteStyle (string) no schema do estabelecimento
  - Campo adicionado em drizzle/schema.ts com default "default"
- [x] Executar migração do banco de dados para adicionar coluna
  - Coluna noteStyle adicionada via ALTER TABLE
- [x] Criar interface de seleção de estilos degradê nas configurações
  - 12 estilos disponíveis: Padrão, Pôr do Sol, Oceano, Floresta, Roxo, Fogo, Dourado, Noite, Doce, Menta, Pêssego, Real
  - Grid responsivo com preview de cada estilo
- [x] Implementar preview do balão com estilo selecionado
  - Preview atualiza em tempo real ao selecionar estilo
- [x] Aplicar estilo selecionado no balão de nota do menu público
  - Balão e bicos aplicam o estilo salvo
  - Texto ajusta cor automaticamente para contraste
- [x] Testar personalização de cores
  - 119 testes passando


## Validade da Nota do Restaurante (1-7 dias)

- [x] Adicionar campo noteExpiresAt (datetime) no schema do estabelecimento
  - Campo adicionado em drizzle/schema.ts como timestamp
- [x] Executar migração do banco de dados
  - Coluna noteExpiresAt já existe na tabela establishments
- [x] Criar interface de seleção de validade (1-7 dias) nas configurações
  - Botões de 1 a 7 dias com visual destacado para seleção
  - Texto informativo sobre duração da exibição
- [x] Calcular data de expiração ao salvar a nota
  - Função savePublicNote calcula expiresAt baseado nos dias selecionados
- [x] Atualizar lógica de exibição no menu público para verificar validade
  - Verifica noteExpiresAt se disponível, senão fallback para 24h
- [x] Ocultar nota automaticamente quando expirada
  - Nota não é exibida se data atual > noteExpiresAt
- [x] Todos os 119 testes passando


## Bugs Mobile - Menu Público

- [x] Corrigir pontos extras (.....) aparecendo no endereço na versão mobile
  - Adicionado truncate com max-width para cortar texto longo com elipsis (...)
  - Adicionado bairro e cidade na exibição do endereço
- [x] Corrigir placeholder do campo de busca cortado
  - Alterado placeholder de "Buscar no cardápio" para "Buscar..." (mais curto)
  - Adicionado min-w-0 para permitir que o campo encolha corretamente


## Sistema de Crop para Imagens (Perfil e Capa)

- [x] Instalar biblioteca react-easy-crop
- [x] Criar componente ImageCropModal reutilizável
- [x] Implementar modal de crop com zoom e movimentação
- [x] Integrar crop para foto de perfil (proporção 1:1, máscara circular)
- [x] Integrar crop para foto de capa (proporção 16:9)
- [x] Adicionar validação de tamanho máximo (8MB)
- [x] Adicionar validação de largura mínima (1200px para capa)
- [x] Comprimir imagem após recorte (JPEG 90%)
- [x] Atualizar preview imediatamente após confirmar
- [x] Testar funcionalidade completa - 130 testes passando


## Bug Desktop - Endereço Truncado

- [x] Corrigir endereço truncado na versão desktop do menu público
  - Aumentado max-width progressivo: 180px (mobile) → 400px (sm) → 500px (md) → sem limite (lg+)

## Campos de Endereço Obrigatórios

- [x] Tornar campos de endereço obrigatórios (exceto complemento)
  - Rua (obrigatório)
  - Número (obrigatório)
  - Bairro (obrigatório)
  - Cidade (obrigatório)
  - Estado (obrigatório)
  - CEP (obrigatório)
  - Complemento (opcional)
- [x] Adicionar indicador visual de campo obrigatório (*)
- [x] Validar antes de salvar com mensagem de erro listando campos faltantes


## Link do Endereço para Google Maps

- [x] Tornar endereço clicável no menu público para abrir no Google Maps
  - Endereço agora é um link que abre no Google Maps em nova aba
  - Efeito hover com underline e mudança de cor
  - Tooltip "Abrir no Google Maps"


## Bug - Badge de Pedidos Não Atualiza

- [x] Corrigir badge de pedidos que só conta o primeiro pedido via SSE
  - Problema: stale closure no callback do useOrdersSSE
  - Solução: usar useRef para manter contagem atualizada
- [x] Badge deve incrementar para cada novo pedido recebido
  - countRef.current mantém valor atualizado entre renders
- [x] Atualmente só atualiza após F5 (refresh da página)
  - Corrigido: agora atualiza em tempo real via SSE


## Bug - Status Cancelado Aparece como Entregue

- [x] Corrigir pedido cancelado que aparece como "entregue" no modal Meus Pedidos
  - Filtro de "Em andamento" agora exclui pedidos cancelados
  - Pedidos cancelados vão para o Histórico junto com entregues
- [x] Status deve mostrar "Cancelado" corretamente sem precisar clicar em "Acompanhar"
  - Texto "Cancelado" em vermelho
  - Borda lateral vermelha para pedidos cancelados


## Modais do Fluxo de Pedido - Não Fechar ao Tocar Fora

- [x] Impedir que modais do fluxo de pedido fechem ao tocar fora do modal
  - Modal de Informações
  - Modal de Cupom
  - Modal de Meus Pedidos
  - Modal de Acompanhar Pedido
  - Modal de Avaliações
- [x] Modais devem fechar apenas pelo botão X


## Bug - Placeholder do Campo de Busca Mobile

- [x] Corrigir placeholder do campo de busca no mobile para mostrar "Buscar no cardápio" completo


## Bug - Largura do Campo de Busca Mobile

- [x] Aumentar largura do campo de busca no mobile para mostrar placeholder "Buscar no cardápio" completo
  - Adicionado min-w-[180px] para garantir largura mínima
  - Removido truncate do placeholder
  - Spacer escondido no mobile para dar mais espaço ao campo


## Dropdown de Pré-visualização na Busca

- [x] Implementar dropdown com resultados da busca enquanto usuário digita
  - Mostra até 6 resultados com link "+ X outros resultados"
  - Ao clicar no item, abre o modal do produto
- [x] Exibir título, descrição e preço de cada item
  - Título em negrito, descrição em cinza abaixo
- [x] Preço na lateral direita, centralizado verticalmente
  - Preço em vermelho, fonte semibold
- [x] Botão X para limpar a busca
- [x] Mensagem "Nenhum produto encontrado" quando sem resultados


## Bug - Badge Conta Pedidos Cancelados

- [x] Corrigir badge de pedidos para não contar pedidos cancelados
  - Filtro atualizado para excluir status 'delivered' E 'cancelled'
- [x] Badge deve mostrar apenas pedidos em andamento (não entregues e não cancelados)
  - Corrigido no desktop e mobile


## Novo Comportamento da Sacola Mobile

- [x] Abrir sacola automaticamente apenas quando primeiro item é adicionado (sacola vazia)
  - Estado bagAutoOpenEnabled controla se auto-open está habilitado
- [x] Adicionar botão "Adicionar mais itens" no modal da sacola
  - Botão com borda vermelha e ícone de +
- [x] Ao clicar em "Adicionar mais itens", fechar modal e desativar auto-open
  - setBagAutoOpenEnabled(false) ao clicar
- [x] Sacola só abre manualmente após o primeiro item
  - Auto-open só funciona quando bagAutoOpenEnabled é true


## Alterar Exibição de Estrelas no Menu Público

- [x] Substituir 5 estrelas por apenas 1 ícone de estrela na exibição de avaliações
  - Removida lógica de estrelas cheias/vazias/meia
  - Agora exibe apenas 1 estrela amarela + nota numérica


## Modais de Checkout - Não Fechar ao Clicar Fora

- [x] Impedir que modais do fluxo de checkout fechem ao clicar fora
  - Resumo do Pedido
  - Tipo de Entrega
  - Confirmar Endereço
  - Seus Dados
  - Confirmação
  - Removido onClick do backdrop do modal unificado de checkout


## Modais de Checkout - Estilo Bottom Sheet

- [x] Alterar modais de checkout para estilo bottom sheet (de baixo para cima)
  - Container com items-end no mobile, items-center no desktop
  - Animação slide-in-from-bottom
  - Bordas arredondadas apenas no topo no mobile
- [x] Aplicar mesmo estilo do modal da sacola mobile


## Modal Acompanhar Pedido - Estilo Bottom Sheet

- [x] Alterar modal de acompanhar pedido para estilo bottom sheet
  - Container com items-end no mobile, items-center no desktop
  - Animação slide-in-from-bottom
  - Bordas arredondadas apenas no topo no mobile


## Modal Meus Pedidos - Estilo Bottom Sheet

- [x] Alterar modal de Meus Pedidos para estilo bottom sheet

## Texto Avaliações no Mobile

- [x] Restaurar texto "Avaliações" no botão de avaliações na versão mobile

## Bug: Scroll no Modal Meus Pedidos

- [x] Corrigir scroll do modal Meus Pedidos que está rolando a página de fundo em vez do conteúdo do modal

## Modal de Produto - Estilo Bottom Sheet

- [x] Alterar modal de detalhes do produto para estilo bottom sheet no mobile

## Ícone Loading no Modal Meus Pedidos

- [x] Adicionar ícone de loading animado ao lado do título "Em andamento"

## Altura da Foto no Modal de Produto

- [x] Aumentar altura da foto do produto em 40% no modal de detalhes do item

## Ajuste Adicional da Altura da Foto

- [x] Aumentar altura da foto do produto em 50% (do valor original)

## Visualização em Tela Cheia da Foto do Produto

- [x] Adicionar ícone de olho com transparência na foto do produto
- [x] Implementar modal de visualização em tela cheia ao clicar na foto

## Ajuste Altura da Foto Mobile

- [x] Aumentar altura da foto do produto em 40% apenas na versão mobile

## Bug: Categoria não selecionada ao editar item

- [x] Corrigir bug onde a categoria não fica selecionada ao editar item do cardápio, fazendo o item ir para "Sem categoria"

## Bug: Categoria ainda não selecionada ao editar item (continuação)

- [x] Investigar por que a categoria não está sendo selecionada ao editar item
- [x] Corrigir definitivamente o bug de categoria

## Arrastar Produtos Entre Categorias

- [x] Implementar drag-and-drop de produtos entre categorias diferentes
- [x] Atualizar categoryId do produto ao soltar em outra categoria
- [x] Adicionar feedback visual durante o arraste entre categorias

## Modal de Informações - Estilo Bottom Sheet

- [x] Alterar modal de informações do menu público para estilo bottom sheet no mobile

## Modais Bottom Sheet - Avaliações e Cupom

- [x] Alterar modal de avaliações para estilo bottom sheet no mobile
- [x] Alterar modal de cupom para estilo bottom sheet no mobile

## Bug: Scroll no Modal de Detalhes do Produto

- [x] Corrigir scroll do modal de detalhes do produto que está movendo a página de fundo

## Fechar Modal ao Clicar Fora

- [x] Adicionar funcionalidade de fechar modal de detalhes do item ao clicar no backdrop

## Bug: Badge de Pedidos não Atualiza em Tempo Real

- [x] Investigar por que o badge de contagem de pedidos não atualiza quando novo pedido chega
- [x] Corrigir a atualização em tempo real do badge de pedidos
- [x] Adicionar SSE ao Dashboard para atualizar pedidos recentes em tempo real

## Bug: Badge no Menu Lateral não Aparece

- [x] Investigar por que o badge no menu lateral não aparece quando novos pedidos chegam via SSE
- [x] Corrigir a atualização do badge no menu lateral em tempo real
- [x] Garantir que o badge apareça imediatamente quando um novo pedido chega

## Atualização em Tempo Real do Modal Acompanhar Pedido
- [x] Implementar listener SSE no modal de acompanhamento para receber atualizações de status
- [x] Atualizar status visual do pedido automaticamente sem fechar/abrir modal
- [x] Usar conexão SSE existente (sem criar novas conexões)

## Correção da Observação no Modal da Sacola
- [x] Exibir observação do item imediatamente no modal "Sua Sacola" após adicionar
- [x] Garantir que a observação apareça junto com o item na sacola

## Remover Botão Voltar do Modal de Confirmação
- [x] Remover botão "Voltar" do step 5 (Enviar) do modal de checkout
- [x] Manter apenas o botão "Enviar pedido"

## Correção do Erro de Validação ao Enviar Pedido
- [x] Investigar erro "The string did not match the expected pattern"
- [x] Corrigir validação que está causando o erro (removido type=tel que causava validação nativa do navegador)

## Correção do Sistema de Avaliação
- [x] Ocultar botão de avaliação quando cliente já avaliou nos últimos 30 dias
- [x] Corrigir verificação de avaliação existente antes de exibir formulário
- [x] Adicionar estado de loading enquanto verifica se pode avaliar
- [x] Melhorar tratamento de erro quando já avaliou

## Alteração da Cor do Drop Zone no Catálogo
- [x] Mudar cor da área de drop de vermelho para verde quando item estiver pronto para soltar
- [x] Manter vermelho apenas para estado inicial "Solte aqui para mover"

## Ícone Animado para Status "Saiu para Entrega"
- [x] Alterar ícone do status 'out_for_delivery' para Bike com animação bounce e ping
- [x] Usar cor violet-600 para o ícone principal e violet-400 para o ping
- [x] Alterar cor do texto do status para violet-600 quando estiver em entrega

## Verificação da Atualização em Tempo Real do Modal Acompanhar Pedido
- [x] Verificar implementação atual dos useEffects para atualização de status
- [x] Corrigir lógica de sincronização do orderStatus quando SSE atualiza userOrders
- [x] Adicionar ref para showTrackingModal para evitar problemas de closure
- [x] Usar callback no setOrderStatus para evitar stale closure

## Correção do Badge de Novos Pedidos no Menu Lateral
- [x] Investigar hook useOrdersSSE que bloqueia registro de múltiplos listeners
- [x] Permitir que cada componente (NewOrdersContext, Dashboard, Pedidos) registre seu próprio listener
- [x] Garantir que badge atualize imediatamente quando novo pedido chega via SSE

## Garantir Funcionamento Simultâneo de Badge e Modal Acompanhar Pedido
- [x] Verificar se refs showTrackingModalRef e currentOrderNumberRef estão implementadas
- [x] Garantir que atualização em tempo real do modal funcione junto com badge
- [x] Adicionar método updateCallback no orderSSE para substituir callbacks existentes
- [x] Adicionar useEffect para atualizar callbacks quando modal abre/fecha

## Correção Final do Badge de Novos Pedidos
- [ ] Investigar por que o badge não aparece após correções do modal
- [ ] Garantir que ambas funcionalidades (badge e modal) funcionem simultaneamente

## Correção do Modal Acompanhar Pedido (Atualização em Tempo Real)
- [x] Investigar por que o modal não atualiza quando status muda via página de pedidos
- [x] Corrigir lógica de atualização do modal via SSE
- [x] Separar useEffect de inicialização SSE do useEffect de atualização de callbacks
- [x] Garantir que cleanup só ocorra quando componente desmonta, não quando userOrders muda
- [x] Testado e verificado: SSE mantém conexão ativa e atualiza status em tempo real

## Correção Definitiva do SSE no Modal Acompanhar Pedido
- [ ] Analisar implementação atual do listener SSE no modal
- [ ] Garantir que o modal registre seu próprio listener no SSE
- [ ] Manter listener ativo enquanto modal está aberto
- [ ] Atualizar estado interno do modal sem depender de navegação
- [ ] Cleanup só deve rodar ao fechar o modal, não ao atualizar estado
- [ ] Testar com modal aberto enquanto status muda em outra máquina/aba

## Correção Definitiva do SSE no Modal Acompanhar Pedido (CONCLUÍDO)
- [x] O modal registra seu próprio listener no SSE via addCallback
- [x] O modal mantém o listener ativo enquanto está aberto
- [x] O listener atualiza o estado interno do modal sem depender de navegação
- [x] Cleanup só roda ao fechar o modal (não ao atualizar estado)
- [x] Testado com sucesso: modal atualiza em tempo real quando status muda em outra máquina

## Correção SSE após Refresh da Página (Em Progresso)
- [x] Identificado problema: addCallback não iniciava conexão SSE após refresh
- [x] Corrigido addCallback para sempre verificar e reconectar se necessário
- [ ] Testar correção com usuário

## Correção SSE - Modal Aberto Depois do Envio do Pedido
- [ ] Buscar status atual do pedido no backend ao abrir o modal
- [ ] Registrar listener SSE dedicado sempre que o modal abrir
- [ ] Garantir que SSE funcione independente de quando o pedido foi criado
- [ ] Testar fluxo: enviar pedido → não abrir modal → restaurante muda status → abrir modal depois

## Correção SSE - Modal Aberto Depois (Atualização em Tempo Real)
- [x] Servidor envia status atual de cada pedido quando cliente se conecta ao SSE
- [x] Modal mostra status correto mesmo quando aberto muito tempo depois do pedido
- [x] Atualização em tempo real quando status muda enquanto modal está aberto

## Bug: SSE para de funcionar após primeiros pedidos
- [x] Corrigir acúmulo de callbacks no orderSSE.ts
- [x] Garantir cleanup correto de listeners antigos quando modal fecha
- [x] Garantir que callbacks sejam associados ao pedido correto
- [x] Testar com múltiplos pedidos sequenciais

## Bug: Badge de pedidos novos não atualiza na sidebar
- [x] Badge não atualiza quando status do pedido muda de "Novo" para "Em preparo"
- [x] Invalidar query de contagem quando status do pedido é atualizado

## Bug: Regressão no SSE do modal de acompanhar pedido
- [ ] Modal de acompanhar pedido parou de atualizar em tempo real após correção do badge
- [ ] Investigar causa da regressão

## Ajuste visual: Cores do modal de acompanhar pedido
- [x] Status "Pedido Finalizado" deve ser verde (não roxo)
- [x] Ícone de check do "Pedido Finalizado" deve ser verde (não cinza)

## Bug: Sistema de avaliação não aparece para novos clientes
- [x] Botão "Avaliar restaurante" não aparece quando pedido é entregue para novos clientes
- [x] Investigar lógica de canReview e canReviewChecked
- [x] Melhorar tratamento de resposta da API canReview com fallback para permitir avaliar

## Bug: Erro 400 na API canReview por caracteres especiais no telefone
- [x] Normalizar telefone removendo caracteres especiais antes de enviar para API canReview
- [x] Corrigir formato do input para tRPC (wrapper json)
- [x] Corrigir parsing da resposta para formato tRPC com superjson
- [x] Buscar reviews tanto por telefone normalizado quanto original (compatibilidade)
- [x] Corrigir frontend para enviar telefone original (não normalizado) para API canReview

## Feature: Notificação sonora para novos pedidos
- [x] Adicionar arquivo de áudio de notificação
- [x] Implementar lógica para tocar som quando novo pedido chegar
- [x] Integrar com sistema SSE de novos pedidos
- [x] Adicionar opção para ativar/desativar som nas configurações
- [x] Corrigir notificação sonora no mobile (autoplay bloqueado)
- [x] Adicionar botão de ativação de som no header do admin

## Bug: Ícone de som não atualiza corretamente
- [x] Mobile: ícone permanece o mesmo ao ativar/desativar
- [x] Desktop: ícone de som ligado permanece após desativar
- [x] Solução: Adicionado estado local isSoundEnabled sincronizado com localStorage

## Bug: Container "Tem um cupom?" não aparece no mobile
- [x] Verificar classes de visibilidade do container de cupom
- [x] Corrigir para aparecer em todas as resoluções
- [x] Adicionar seção de cupom no modal da sacola mobile (showMobileBag)

## Bug: Som de notificação tocando no menu público
- [x] Som deve tocar apenas no painel administrativo
- [x] Remover/desabilitar som no menu público quando pedido é enviado
- [x] Solução: Verificar locationRef antes de tocar som (ignora rotas /menu/*)

## Bug: Modal de cupom aparece atrás do modal da sacola
- [x] Aumentar z-index do modal de cupom para aparecer na frente da sacola
- [x] Solução: Alterado z-index de z-[100] para z-[110]

## Feature: Botão "Pedir novamente" no modal de pedidos
- [x] Adicionar botão "Pedir novamente" no modal de detalhes do pedido
- [x] Ao clicar, adicionar itens do pedido à sacola
- [x] Abrir modal de resumo do pedido automaticamente
- [x] Botão adicionado em pedidos em andamento (ao lado de "Acompanhar")
- [x] Botão adicionado no histórico (exceto pedidos cancelados)

## Melhoria: Preencher dados do pedido anterior ao clicar em "Pedir novamente"
- [x] Preencher tipo de entrega (pickup/delivery)
- [x] Preencher forma de pagamento (cash/card/pix)
- [x] Preencher nome e telefone do cliente
- [x] Preencher endereço de entrega (se delivery)
- [x] Preencher observação do pedido

## Ajuste: Botão "Pedir novamente" apenas em pedidos finalizados
- [x] Remover botão dos pedidos em andamento
- [x] Manter botão apenas em pedidos entregues ou cancelados
- [x] Pedidos em andamento agora mostram apenas "Acompanhar pedido"

## Bug: Botão "Pedir novamente" não aparece em pedidos cancelados
- [x] Verificar condição que oculta o botão em pedidos cancelados
- [x] Corrigir para exibir botão em pedidos cancelados também
- [x] Removida condição order.status !== 'cancelled' do histórico

## Bug: Modal de Meus Pedidos ocupa tela toda no mobile
- [x] Adicionar altura máxima ao modal (max-h-[85vh])
- [x] Adicionar botão de fechar (X) no header do modal (já existia)
- [x] Garantir que área de clique para fechar fique visível
- [x] Solução: Adicionado padding p-4 pt-16 no container para deixar espaço no topo
- [x] Backdrop agora fecha o modal ao clicar

## Ajuste: Modal de Meus Pedidos como bottom sheet
- [x] Manter modal ancorado na parte inferior (bottom sheet)
- [x] Adicionar espaço no topo para área clicável de fechar (max-h-[80vh])
- [x] Manter altura máxima para não ocupar tela toda
- [x] Cantos arredondados apenas no topo no mobile (rounded-t-2xl)

## Bug: Observação do item não aparece no modal de Confirmar Endereço
- [x] Exibir observação do item (item.observation) na seção Itens do checkoutStep 3
- [x] Mostrar abaixo do nome do item, como no modal de Resumo
- [x] Adicionado "Obs: {item.observation}" em texto cinza claro

## Bug: Som toca mesmo quando ícone está desativado
- [x] Investigar sincronização entre estado visual e lógica de reprodução
- [x] Verificar se localStorage está sendo lido corretamente
- [x] Corrigir para respeitar a preferência do usuário
- [x] Solução: Adicionado método isSoundEnabled() no NotificationAudioManager
- [x] Verificação do localStorage antes de tocar pendingPlay
- [x] Limpa pendingPlay mesmo quando som está desabilitado

## Bug persistente: Som ainda toca quando desativado
- [x] Investigar todos os pontos onde playNotificationSound é chamado
- [x] Verificar se há outro lugar tocando o som além do NotificationAudioManager
- [x] Corrigir definitivamente
- [x] Causa: Pedidos.tsx tinha código duplicado tocando som diretamente sem verificar preferência
- [x] Solução: Removido código duplicado em Pedidos.tsx, som agora é gerenciado apenas pelo NewOrdersContext

## Ajuste: Modal de Detalhes do Pedido desktop igual ao mobile
- [x] Reduzir largura do modal no desktop (sm:max-w-md)
- [x] Reorganizar cards em layout vertical (um abaixo do outro)
- [x] Ordem: Info Cliente > Detalhes Pagamento > Info Entrega > Itens > Preço > Status

## Ajuste: Botões Imprimir e WhatsApp no modal de Detalhes do Pedido
- [x] Fixar footer na parte inferior do modal
- [x] Botões devem ficar sempre visíveis na parte de baixo
- [x] Solução: flex flex-col no SheetContent, flex-1 no conteúdo, mt-auto no footer

## Bug: Impressão do pedido imprime página toda
- [x] Criar função de impressão específica para o pedido
- [x] Imprimir apenas: número do pedido, itens, preços, total, dados do cliente
- [x] Formato de cupom/recibo para impressora térmica (300px largura, fonte Courier)

## Melhoria: Novo layout do recibo de impressão
- [x] Logo do estabelecimento no topo (Cardápio - Sistema de Pedidos)
- [x] Pedido # com data/hora
- [x] Itens com adicionais e observações individuais
- [x] Valores: subtotal, desconto, taxa entrega, total
- [x] Seção Observações gerais
- [x] Seção Entrega com endereço completo
- [x] Seção Forma de pagamento
- [x] Seção Cliente com nome e telefone
- [x] Footer com nome do sistema (manus.space)

## Bug: Cliente consegue fazer pedido com restaurante fechado
- [x] Adicionar validação no backend (orders.create) para verificar se restaurante está aberto
- [x] Adicionar validação no frontend para bloquear botão de finalizar quando fechado (já existia)
- [x] Mostrar mensagem clara para o cliente quando restaurante está fechado
- [x] Criar função getEstablishmentById no db.ts
- [x] Invalidar cache do estabelecimento quando erro de "fechado" ocorrer

## Ajuste: Nome do restaurante no topo do recibo
- [x] Substituir "Cardápio" pelo nome do estabelecimento no recibo de impressão

## Melhoria: Mensagem de restaurante fechado no modal
- [x] Substituir alert() por estado de erro no modal de confirmação
- [x] Exibir mensagem de "restaurante fechado" dentro do modal
- [x] Mostrar botão para voltar ao carrinho
- [x] Ícone XCircle vermelho para indicar erro
<<<<<<< Updated upstream

- [x] Corrigir bug do ícone de som que ativa automaticamente ao navegar entre páginas no painel administrativo
- [x] Corrigir exibição do número do pedido com dois ## (##P235 → #P235) no card e modal de detalhes
- [x] Ocultar card de pedidos cancelados na versão mobile (exibir apenas no desktop)
- [x] Adicionar ícone de lápis ao lado direito do nome das categorias na página de Catálogo
- [x] Adicionar funcionalidade de excluir categorias na página de Catálogo
- [x] Usar imagem placeholder igual à do perfil do restaurante para itens do catálogo sem foto
- [x] Aplicar mesmo estilo de placeholder de imagem do catálogo aos produtos sem foto no cardápio público
- [x] Aplicar placeholder de imagem no modal de detalhes do produto no cardápio público
- [x] Adicionar animação de pulso suave ao ícone do placeholder de produtos sem foto
- [x] Corrigir barra lateral minimizada para mostrar apenas ícone de abrir, sem a foto do restaurante
- [x] Adicionar animação de transição suave ao expandir e recolher a barra lateral
- [x] Corrigir exibição dos itens de complementos na página de edição do produto (itens não aparecem dentro dos grupos)
- [x] Corrigir salvamento de novos grupos de complementos ao editar produto (complementos não são persistidos)
- [x] Adicionar visualização dos grupos de complementos no container de Preview do ProductForm em tempo real
- [x] Remover container extra do preview do item para ocupar toda a largura
- [x] Implementar interação no preview para simular seleção de itens como o cliente
- [x] Calcular total dinâmico no preview conforme itens são selecionados
- [x] Adicionar scroll automático no preview quando o conteúdo for muito longo
- [x] Corrigir preço do produto no preview mostrando R$ 0,00 em vez do valor digitado
- [x] Implementar formatação automática de preço em centavos no campo de preço dos itens de complemento (500 → 5,00)

## Bug - Complementos não aparecem nos detalhes do pedido
- [x] Investigar estrutura de dados do pedido e complementos
- [x] Verificar salvamento dos complementos ao criar pedido no cardápio público
- [x] Corrigir exibição dos complementos nos detalhes do pedido (modal/sheet)
- [x] Confirmado: Novos pedidos exibem complementos corretamente (pedidos antigos não tinham dados salvos)

## Ocultar preço R$ 0,00
- [x] Ocultar preço quando for R$ 0,00 na lista de produtos do catálogo administrativo
- [x] Ocultar preço quando for R$ 0,00 no cardápio público


## Ocultar preço R$ 0,00 na sacola
- [x] Ocultar preço quando for R$ 0,00 na lista de itens da sacola do cardápio público


## Ocultar preço R$ 0,00 no modal de resumo do pedido
- [x] Ocultar preço quando for R$ 0,00 na lista de itens do modal de resumo do pedido
- [x] Ocultar preço quando for R$ 0,00 na lista de pedidos ativos e histórico


## Ocultar preço R$ 0,00 no modal Meus Pedidos
- [x] Ocultar preço quando for R$ 0,00 na lista de itens do modal Meus Pedidos
- [x] Ocultar preço quando for R$ 0,00 na etapa de confirmação do pedido (step 5)


## Exibir complementos no modal Meus Pedidos
- [x] Adicionar exibição dos complementos selecionados na lista de itens do modal Meus Pedidos (em andamento e histórico)


## Bloquear adição à sacola quando item tem preço zero sem complemento
- [x] Desabilitar botão "Adicionar" quando item tem preço zero e nenhum complemento foi selecionado
- [x] Exibir mensagem "Selecione uma opção" no botão quando bloqueado


## Incluir complementos na impressão do pedido
- [x] Adicionar complementos selecionados no recibo impresso do pedido


## Exibir preço dos complementos na impressão
- [x] Mostrar preço individual de cada complemento no recibo impresso


## Reorganizar modal de detalhes do pedido
- [x] Mover container "Itens do Pedido" para cima do container "Detalhes do Pagamento"


## Reorganizar modal de detalhes do pedido (v2)
- [x] Mover container "Itens do Pedido" para cima do container "Informações de Entrega"


## Ocultar preço unitário zero no modal de detalhes do pedido
- [x] Ocultar linha "R$ 0,00 x 1" quando o preço unitário do item for zero


## Adicionar cores aos containers do modal de detalhes do pedido
- [x] Informações do Cliente - cor azul clara (bg-blue-50/50)
- [x] Itens do Pedido - cor amarela/laranja clara (bg-amber-50/50)
- [x] Informações de Entrega - cor verde clara (bg-emerald-50/50)
- [x] Detalhes do Pagamento - cor roxa clara (bg-purple-50/50)
- [x] Status do Pedido - manter neutro


## Adicionar preços dos complementos no modal Meus Pedidos
- [x] Exibir valor unitário de cada complemento no modal Meus Pedidos do cardápio público (em andamento e histórico)


## Ocultar preço zero no modal de Preview da edição do item
- [x] Ocultar preço quando for R$ 0,00 no modal de Preview da página de edição do item


## Duplicar item com grupos e complementos
- [x] Modificar função de duplicação para copiar grupos de complementos
- [x] Modificar função de duplicação para copiar itens dos complementos


## Bug: Complementos desaparecem ao serem adicionados a um item
- [x] Corrigir bug onde complementos desapareciam ao serem adicionados a um item
- [x] Modificar função getComplementGroupsByProduct para incluir itens diretamente na resposta
- [x] Resolver conflito de merge no ProductForm.tsx


## Drag & Drop para Itens de Complemento
- [x] Implementar funcionalidade de arrastar e soltar para reordenar itens de complemento
- [x] Adicionar campo sortOrder na tabela complementItems (ordem baseada na posição do array)
- [x] Persistir ordem no banco de dados ao salvar

## Bug: Drag & Drop não mantém nova posição
- [x] Corrigir bug onde itens voltam para posição original após soltar

## Bug: Novos complementos adicionados no meio da lista
- [x] Corrigir para que novos complementos sejam adicionados no final da lista

## Melhoria: Permanecer na página de edição após salvar
- [x] Remover redirecionamento para /catalogo após salvar alterações de um produto

## Melhoria: Tooltip de informação no campo de Preço
- [x] Adicionar ícone de informação (i) ao lado do campo de Preço
- [x] Implementar tooltip com texto explicativo sobre itens com preço R$ 0,00

## Melhoria: Validação do campo Máx em complementos
- [x] Limitar campo Máx para não ser maior que a quantidade de itens no grupo

## Melhoria: Prefixo R$ no campo de preço dos complementos
- [x] Adicionar prefixo R$ ao campo de preço dos itens de complemento

#### Melhoria: Modal de visualização de fotos do item
- [x] Adicionar indicadores visuais de navegação (setas ou pontos) para mostrar que há mais fotos
- [x] Adicionar contador de fotos no canto inferior direito (ex: "1/3")
- [x] Adicionar suporte para arrastar/deslizar entre as fotos

## Foto nos Itens de Complemento
- [x] Adicionar campo imageUrl no schema de complementItems
- [x] Implementar upload de foto no formulário de complementos (admin)
- [x] Adicionar indicador minimalista na lista de complementos (check se tem foto, placeholder se não)
- [x] Exibir foto do complemento selecionado no modal do menu público
- [x] Fallback para foto do produto quando complemento não tiver foto


## Ajuste: Remover indicadores visuais de foto do complemento no menu público
- [x] Remover badge "Foto do complemento" da imagem do produto
- [x] Remover ícone de foto ao lado do item de complemento na seleção


## Bug: Nova categoria aparece no início da lista
- [x] Corrigir para que novas categorias sejam adicionadas no final da lista
- [x] Calcular sortOrder baseado na última categoria existente

## Ajuste: Aumentar tamanho dos títulos das categorias no menu público
- [x] Aumentar tamanho dos títulos das categorias na lista vertical em 20%

## Bug: Grupos de complementos duplicados ao salvar produto
- [x] Investigar duplicação de grupos no produto 120102
- [x] Corrigir lógica de salvamento para evitar duplicação
- [x] Atualizar estado local com IDs dos novos grupos após criação
- [x] Invalidar query para recarregar dados do servidor
- [x] Remover grupos duplicados do banco de dados


## Melhoria: Busca ignorando acentos no menu público
- [x] Implementar normalização de acentos na busca de produtos
- [x] Buscar "agua" deve encontrar "água" e vice-versa


## Ajuste: Botão de adicionar responsivo em telas pequenas
- [x] Ocultar texto "Adicionar" em telas pequenas (< 360px)
- [x] Manter apenas símbolo "+" e preço em dispositivos móveis


## Melhoria: Priorizar resultados de busca por início do nome
- [x] Priorizar itens cujo nome começa com o termo buscado
- [x] Ordenar: 1º nomes que começam com termo, 2º nomes que contém termo, 3º descrições que contém termo


## Bug: Avaliações aparecem mesmo após exclusão + formato da nota
- [x] Investigar por que nota e quantidade de avaliações continuam aparecendo após exclusão (dados cacheados na tabela establishments)
- [x] Atualizar rating e reviewCount para 0 no estabelecimento 30001
- [x] Mudar formato da nota de vírgula (5,0) para ponto (5.0)


## Restaurar modal bottom sheet ao clicar no endereço
- [x] Restaurar comportamento anterior com modal estilo bottom sheet
- [x] Exibir opções de navegação (Google Maps, Waze, Apple Maps) no modal
- [x] Adicionar botão para copiar endereço


## Seleção de endereço via Google Maps nas configurações
- [x] Adicionar campos latitude e longitude no schema de establishments
- [x] Criar componente AddressMapPicker com Google Maps
- [x] Integrar Places Autocomplete para busca de endereços
- [x] Preencher campos de endereço automaticamente ao selecionar no mapa
- [x] Salvar coordenadas para navegação precisa
- [x] Atualizar modal de navegação no menu público para usar coordenadas


## Bug: Scroll do modal de navegação afeta conteúdo de fundo
- [x] Bloquear scroll do body quando modal de navegação estiver aberto
- [x] Permitir scroll apenas dentro do modal


## Melhoria: Ícones oficiais no modal de navegação
- [ ] Adicionar ícone oficial do Google Maps
- [ ] Adicionar ícone oficial do Waze
- [ ] Adicionar ícone oficial do Apple Maps

## Ícones do Modal de Navegação
- [x] Substituir ícones genéricos pelos ícones oficiais do Google Maps, Waze e Apple Maps no modal de navegação

## Layout do Cabeçalho do Menu Público
- [x] Corrigir layout para que estrela/avaliações e ícone de compartilhar fiquem na mesma linha do nome do restaurante em telas menores (só quebrar linha quando nome for muito grande)

## Badge de Entrega e Retirada
- [x] Reposicionar badge "Entrega e Retirada" para o canto superior direito do card de informações no mobile, como destaque flutuante na borda
- [x] Redesenhar badge "Entrega e Retirada" como etiqueta/ribbon encaixada na borda direita do card no mobile (estilo tag parcialmente para fora)
- [x] Ajustar badge "Entrega e Retirada" para ficar como aba de pasta no topo direito do card (estilo folder tab)
- [x] Ajustar z-index do badge para parecer estar atrás do card (efeito de aba de pasta saindo por trás)
- [x] Ajustar posição vertical da aba para ficar perfeitamente alinhada com o topo do card
- [x] Ajustes visuais finos na aba de Entrega/Retirada (tamanho, padding, posição) via editor visual
- [x] Alterar texto "Entrega" para "Delivery" na aba de serviços
- [x] Ajustes finos de posicionamento da aba (marginTop: -29px, marginRight: -2px) via editor visual
- [x] Adicionar ícone de motocicleta ao lado esquerdo do texto "Delivery e Retirada" na aba do menu público
- [x] Adicionar animação sutil no ícone de motocicleta para chamar mais atenção
- [x] Ajustar posição do texto e ícone para ficarem mais para cima dentro do container da aba (paddingTop: 0px, paddingBottom: 10px)
- [x] Implementar lógica para exibir texto e ícone corretos baseado nas opções de atendimento (Somente Delivery com moto, Somente Retirada com caixa, ou ambos com moto)
- [x] Ajustes visuais no badge desktop (borderRadius: 8px, height: 21px) via editor visual
- [x] Alterar a foto ao lado do campo de busca para usar placeholder padrão (reservado para logo do restaurante)
- [x] Ajustes visuais no header: logo placeholder 37x37px e input de busca altura 37px via editor visual
- [x] Alterar texto "Loja fechada no momento" para "Fechado no momento" via editor visual

## Sistema de Horários de Funcionamento
- [x] Criar tabela no banco de dados para horários de funcionamento por dia da semana (businessHours)
- [x] Criar procedures no backend para salvar e buscar horários
- [x] Adicionar seção de horários na página de Configurações (aba Atendimento) com toggles e campos de horário
- [x] Implementar lógica dinâmica de mensagem no menu público (Aberto agora / Fechado - Abriremos hoje às X / Fechado hoje - Abriremos amanhã às X)

## Bug: establishmentId undefined ao salvar horários
- [x] Corrigir erro de establishmentId undefined ao salvar horários de funcionamento na página de configurações
- [x] Corrigir erro de query de horários de funcionamento (Invalid input: expected object, received undefined)
- [x] Corrigir lógica de verificação de status aberto/fechado no menu público (tabela business_hours não existia no banco de dados)

## Correção: Sistema de horários de funcionamento
- [x] Implementar lógica automática de verificação de horários no menu público (isCurrentlyOpen)
- [x] Substituir uso de establishment.isOpen por cálculo dinâmico baseado nos horários configurados

## Efeito Visual no Container Delivery/Retirada
- [x] Adicionar efeito pulsante no container de Delivery/Retirada no menu público (apenas versão mobile)

## Padronização de Ícones
- [x] Padronizar ícones de garfo e faca (UtensilsCrossed) em todo o menu público (header, placeholder de produtos, etc.)

## Correção de Z-Index
- [x] Corrigir z-index do dropdown de Redes Sociais para aparecer na frente do menu de categorias (mobile)

## Correção do Toggle de Status no Perfil
- [x] Modificar toggle de status no perfil para refletir automaticamente os horários de funcionamento configurados
- [x] Remover o switch manual e substituir por indicação "Automático" com tooltip explicativo

## Toggle de Fechamento Manual Forçado
- [x] Manter toggle no menu do usuário para forçar fechamento manual mesmo dentro do horário de funcionamento
- [x] Combinar lógica: se toggle desligado OU fora do horário = Fechado; se toggle ligado E dentro do horário = Aberto
- [x] Adicionar indicação "Fechado manualmente" quando forçado
- [x] Adicionar tooltip explicativo no toggle

## Card Tempo de Entrega (Configurações → Atendimento)
- [x] Adicionar campos no schema: deliveryTimeEnabled, deliveryTimeMin, deliveryTimeMax, minOrderEnabled, minOrderValue
- [x] Criar card com toggle ON/OFF e campos "De" e "Até" em minutos
- [x] Criar toggle de Pedido mínimo com campo de valor
- [x] Exibir no menu público: ícone relógio + tempo (ex: 20 - 60min) ao lado de "Aberto agora"
- [x] Exibir no menu público: ícone + "Pedi. Mínimo R$ X" ao lado do tempo de entrega

## Card Taxa de Entrega (Configurações → Atendimento)
- [x] Adicionar campos no schema: deliveryFeeType (free/fixed/byNeighborhood), deliveryFeeFixed
- [x] Criar tabela para bairros com taxas: neighborhoodFees (establishmentId, neighborhood, fee)
- [x] Criar card com 3 opções: Grátis, Fixa, Por Bairros
- [x] Opção Grátis: apenas exibir "Entrega grátis" no menu público
- [x] Opção Fixa: campo para digitar valor único
- [x] Opção Por Bairros: permitir adicionar vários bairros com preços


## Lógica Completa do Toggle Aberto/Fechado
- [ ] Adicionar campo manuallyClosed (boolean) no schema para indicar fechamento manual
- [ ] Adicionar campo manuallyClosedAt (timestamp) para saber quando foi fechado manualmente
- [ ] Implementar função para calcular próximo horário de abertura baseado nos horários conf## Lógica Completa do Toggle Aberto/Fechado
- [x] Toggle tem prioridade sobre horário automático
- [x] Fechado manualmente permanece até abrir manualmente OU até próximo horário de abertura
- [x] Reabertura automática quando chegar o próximo horário de funcionamento
- [x] Exibir mensagem "Fechado agora – Abriremos amanhã às XX:XX" no menu público
- [x] Atualizar AdminLayout com nova lógica do toggle
- [x] Adicionar campos manuallyClosed e manuallyClosedAt no schema
- [x] Criar mutation setManualClose no backend

## Ajustes Layout Mobile do Menu Público
- [x] Simplificar badge de pedido mínimo: remover texto "Min.", deixar só ícone + valor (ex: 🛒 R$30)
- [x] Mover avaliações para mesma linha do nome do restaurante (só quebrar se nome for muito longo)
- [x] Truncar nome do restaurante em telas pequenas (max-w-[180px])


## Ajustes na Sacola - Pedido Mínimo
- [x] Esconder botão "Adicionar mais itens" (vermelho vazado) quando pedido mínimo não for atingido
- [x] Mudar botão inferior para vermelho vazado quando pedido mínimo não for atingido
- [x] Mudar container de alerta de pedido mínimo para cor vermelha (combinar com botão)


## Validação de Pedido Mínimo na Sacola Desktop
- [ ] Adicionar alerta vermelho de pedido mínimo na sacola desktop
- [ ] Esconder botão "Adicionar mais itens" quando abaixo do mínimo
- [ ] Mudar botão inferior para vermelho vazado quando abaixo do mínimo


## Validação de Pedido Mínimo na Sacola Desktop
- [x] Adicionar alerta vermelho de pedido mínimo na sacola desktop
- [x] Mostrar apenas botão "Adicionar mais itens" vermelho vazado quando abaixo do mínimo
- [x] Bloquear botão "Finalizar pedido" quando abaixo do mínimo


## Sistema de Cartão Fidelidade
- [x] Criar tabela loyalty_cards no banco de dados
- [x] Criar tabela loyalty_stamps no banco de dados
- [x] Adicionar campos de fidelidade na tabela establishments
- [x] Criar endpoints tRPC para fidelidade (login, cadastro, progresso, histórico)
- [x] Criar card de configuração do Cartão Fidelidade no painel admin (Configurações)
- [x] Renomear menu "Início" para "Fidelidade" no menu público
- [x] Implementar modal bottom sheet de login/cadastro de fidelidade
- [x] Criar tela do Cartão Fidelidade com progresso visual (carimbos)
- [x] Exibir histórico de tickets ganhos
- [x] Exibir cupom disponível quando atingir meta
- [x] Integrar contagem automática de tickets ao finalizar pedido (status entregue)
- [x] Liberar cupom automaticamente ao atingir quantidade necessária


## Bug: Carimbo de Fidelidade Não Adicionado
- [ ] Investigar por que o carimbo não está sendo adicionado quando pedido é concluído
- [ ] Verificar a lógica de integração no updateOrderStatus
- [ ] Corrigir o bug e testar


## Bug: Carimbo de Fidelidade Não Aparecendo
- [x] Investigar por que o carimbo não estava sendo adicionado quando o pedido é concluído
- [x] Verificar a lógica de updateOrderStatus
- [x] Corrigir o bug (normalização de telefone e autocomplete)
- [x] Unificar cartões de fidelidade duplicados no banco de dados
- [x] Adicionar autocomplete="new-password" nos campos de senha


## Ajuste Visual do Card de Fidelidade
- [x] Mover texto "Faltam X pedidos" para dentro do card verde
- [x] Aplicar degradê no fundo do card de fidelidade
- [x] Unificar layout conforme imagem de referência


## Animações de Gamificação no Cartão Fidelidade
- [x] Adicionar efeito de pop no carimbo ao ganhar
- [x] Animar barra de progresso preenchendo
- [x] Implementar vibração suave no mobile
- [x] Criar sensação de conquista/dopamina


## Regulamento do Cartão Fidelidade
- [x] Adicionar link "Ver regulamento" discreto no card
- [x] Criar modal com regras do programa
- [x] Incluir: quantidade de carimbos necessários
- [x] Incluir: o que gera carimbo (pedidos concluídos)
- [x] Incluir: pedidos cancelados não contam
- [x] Incluir: validade do cupom


## Bug: Animações do Cartão Fidelidade
- [x] Animações só aparecem no primeiro login
- [x] Corrigir para aparecer sempre que o modal for aberto
- [x] Resetar estado de animação ao abrir modal


## Melhorias Visuais do Cartão Fidelidade
- [ ] Carimbos ativos com verde brilhante e check minimalista
- [ ] Animação de expansão + fade nos carimbos
- [ ] Layout especial de CUPOM LIBERADO com confetti
- [ ] Botões "Copiar código" e "Usar agora"
- [ ] Exibir validade do cupom


## Melhorias Visuais do Cartão Fidelidade (Carimbos)
- [x] Carimbos ativos com verde brilhante e check minimalista
- [x] Animação de expansão + fade nos carimbos
- [x] Confetti colorido ao redor dos carimbos ativos
- [x] Layout de CUPOM LIBERADO com confetti animado
- [x] Botões "Copiar código" e "Usar agora" no cupom


## Badge Verde Pulsante no Cartão Fidelidade
- [x] Adicionar ícone verde pulsante antes de "Fidelidade ativa"
- [x] Usar animação pulse do Tailwind


## Bug: Modal de CUPOM LIBERADO Não Aparece
- [x] Investigar estado do cartão e cupom no banco de dados
- [x] Verificar lógica de exibição do modal de cupom liberado
- [x] Corrigir bug para exibir modal com confetti quando completar carimbos
- [x] Criar cupom automaticamente ao completar cartão
- [x] Vincular cupom ao cartão via activeCouponId


## Redesign do Card de Cupom Liberado
- [x] Separar card de cupom do cartão de fidelidade
- [x] Aplicar visual laranja/dourado conforme referência
- [x] Header com "Parabéns! Cupom Liberado"
- [x] Código em destaque com borda tracejada laranja
- [x] Badge de presente no canto
- [x] Botões "Copiar Código" e "Usar Agora" em laranja
- [x] Texto "Válido para o seu próximo pedido"


## Ajuste de Altura do Card de Cupom
- [x] Reduzir altura do card de cupom liberado
- [x] Deixar mesma altura do cartão de fidelidade


## Ajuste de Tamanho dos Carimbos
- [x] Reduzir tamanho dos ícones de carimbo
- [x] Garantir que 10 carimbos caibam na mesma linha horizontal


## Efeito de Flip no Cartão de Fidelidade
- [ ] Implementar estrutura CSS de flip card com duas faces
- [ ] Adicionar botão "Ver cupom ganho" quando completar 100% dos carimbos
- [ ] Criar face traseira do card com código, descrição e validade do cupom
- [ ] Implementar animação de flip horizontal de 180° (300-400ms)
- [ ] Adicionar botões "Copiar código" e "Usar agora" na face traseira
- [ ] Adicionar botão/ícone para virar o cartão de volta
- [ ] Remover modal separado de "Parabéns! Cupom Liberado"
- [ ] Manter consistência visual (bordas arredondadas, sombras)

## Efeito Flip no Cartão de Fidelidade
- [x] Implementar animação de flip horizontal 180° (transform rotateY)
- [x] Adicionar botão "Ver cupom ganho" quando carimbos completos
- [x] Face frontal: carimbos e progresso
- [x] Face traseira: cupom com código, descrição, validade, botões "Copiar código" e "Usar agora"
- [x] Adicionar botão para voltar à face dos carimbos
- [x] Remover card laranja separado (cupom integrado no flip)
- [x] Animação suave de 300-400ms

## Ajuste de Altura do Modal de Fidelidade (Mobile)
- [x] Reduzir altura do cartão de fidelidade na versão mobile
- [x] Garantir que o modal não ocupe toda a altura da tela
- [x] Permitir que o usuário consiga fechar o modal facilmente

## Integração do Cupom de Fidelidade no Checkout
- [ ] Criar estado para armazenar cupom aplicado na sacola
- [ ] Implementar funcionalidade do botão "Usar agora" para aplicar cupom
- [ ] Calcular desconto baseado no tipo de cupom (percentual, fixo, frete grátis)
- [ ] Exibir cupom aplicado na sacola com opção de remover
- [ ] Validar cupom antes de aplicar (verificar se ainda é válido)
- [ ] Atualizar total do pedido com desconto aplicado

## Integração do Cupom de Fidelidade no Checkout
- [x] Conectar botão "Usar agora" com o sistema de cupons
- [x] Aplicar cupom automaticamente na sacola de compras
- [x] Fechar modal de fidelidade após aplicar cupom
- [x] Mostrar feedback visual de cupom aplicado

## Modal Bottom Sheet de Confirmação de Cupom Aplicado
- [x] Criar modal bottom sheet ao clicar em "Usar agora"
- [x] Exibir confirmação visual de cupom aplicado
- [x] Adicionar animação de entrada do bottom sheet
- [x] Fechar automaticamente após alguns segundos ou ao clicar

## Modal de Regulamento como Bottom Sheet
- [x] Converter modal de regulamento para estilo bottom sheet
- [x] Adicionar animação de entrada suave
- [x] Manter consistência visual com modal de cupom aplicado

## Correção do Scroll no Modal de Fidelidade
- [x] Bloquear scroll da página quando o modal está aberto
- [x] Evitar que a página de trás role ao rolar dentro do modal

## Correção Visual do Cartão de Fidelidade
- [x] Remover borda verde inferior do cartão
- [x] Restaurar visual original do card (sem tarja verde embaixo)

## Unificar Card de Fidelidade
- [x] Mover mensagem "Faltam X pedidos" para dentro do card principal
- [x] Remover card branco separado da mensagem
- [x] Manter visual igual à imagem de referência (card único com área cinza na parte inferior)

## Atualizar Estilo do Histórico no Cartão Fidelidade
- [x] Adicionar ícone de check verde ao lado esquerdo de cada item
- [x] Substituir o preço por "+1" (carimbo) no lado direito
- [x] Aplicar fundo cinza claro em cada item do histórico
- [x] Manter layout igual à imagem de referência

## Correção do Posicionamento da Área "Faltam X pedidos"
- [x] Mover a área cinza "Faltam X pedidos" para a parte inferior do card
- [x] Remover a área cinza de dentro do card verde
- [x] Criar estrutura de card único com duas seções (verde em cima, cinza embaixo)
- [x] Garantir que a área cinza fique colada aos carimbos, não no meio

## Consumo Automático do Cupom de Fidelidade
- [x] Adicionar parâmetro loyaltyCardId ao createOrder no backend
- [x] Implementar lógica para limpar activeCouponId do cartão após uso
- [x] Resetar os carimbos (stamps) do cartão para iniciar novo ciclo
- [x] Atualizar frontend para passar loyaltyCardId ao criar pedido
- [x] Testar fluxo completo de uso do cupom

## Ajuste de Espaçamento no Modal de Fidelidade
- [x] Reduzir espaço entre o card de fidelidade e o card de histórico

## Ajuste de Altura do Container do Card de Fidelidade
- [x] Reduzir altura fixa do container do card para eliminar espaço vazio
- [x] Garantir que o histórico fique próximo ao card de fidelidade

## Redesign do Cupom de Desconto (Estilo Voucher)
- [ ] Criar visual de voucher com duas seções (amarelo e escuro)
- [ ] Adicionar bordas serrilhadas estilo ticket
- [ ] Incluir ícones de talheres no centro
- [ ] Exibir porcentagem de desconto em destaque
- [ ] Mostrar data de validade

## Nome do Restaurante no Cupom de Desconto
- [x] Substituir "DESCONTO" pelo nome do restaurante no cupom
- [x] Dividir nome em duas linhas se for muito grande
- [x] Reduzir tamanho da fonte para nomes muito longos

## Correção das Bolinhas no Cupom
- [x] Mover recortes circulares para o lado esquerdo da seção escura

## Correção das Bolinhas no Cupom v2
- [x] Mover recortes circulares para o lado esquerdo da seção AMARELA (não da seção escura)

## Ícone de Talheres no Cupom
- [x] Substituir ícones de garfo e colher pelo ícone de talheres cruzados (garfo e faca) usado no placeholder de itens sem foto
- [x] Aplicar efeito marca d'água (transparência 20%) com animação pulsante

## Correção das Bolinhas no Cupom v3
- [x] Ajustar cor das bolinhas para a mesma cor do fundo do modal (branco) para criar efeito de recorte real

## Correção das Bolinhas no Cupom v4
- [x] Ajustar bolinhas para cor branca (cor do fundo do modal) para criar efeito visual de recorte

## Correção das Bolinhas no Cupom v5
- [x] Remover completamente as bolinhas brancas - cupom agora sem recortes circulares

## Borda Serrilhada no Cupom
- [x] Adicionar efeito de borda serrilhada ao voucher para simular cupom destacável (10 círculos brancos em cada lateral)

## Bolinhas Serrilhadas Transparentes
- [x] Ajustar bolinhas serrilhadas para serem transparentes usando técnica de máscara CSS (radial-gradient)

## Altura do Card do Cupom
- [x] Reduzir a altura do card do cupom em 16% (243px -> 204px, 280px -> 235px)

## Altura Separada para Cards de Fidelidade e Cupom
- [x] Aumentar altura do card de fidelidade (carimbos) em 16% mantendo cupom com altura atual
  - Card de carimbos: 237px/273px (mobile/desktop)
  - Card de cupom: 204px/235px (mobile/desktop)
  - Transição animada de 400ms entre os dois estados

## Ocultar Código do Cupom
- [x] Ocultar o código do cupom mantendo o espaço vazio no lugar (sem mover outros elementos)

## Serrilhado Central do Cupom
- [x] Aumentar quantidade de serrilhados na linha central do cupom (12 círculos brancos)
- [x] Remover cor verde - substituída linha tracejada por círculos brancos sólidos

## Reverter Linha Central do Cupom
- [x] Reverter para linha tracejada original (remover círculos brancos)

## Remover Efeito Verde do Cupom
- [x] Identificar e remover o efeito verde que aparece atrás do cartão de cupom (adicionado bg-white na face traseira)

## Cor das Bordas Serrilhadas do Cupom
- [x] Ajustar bordas serrilhadas (parte amarela e escura) para ficarem com a mesma cor do fundo do modal (bg-gray-100)

## Tamanho do Texto OFF no Cupom
- [x] Ajustar tamanho do texto OFF para ser igual ao tamanho do texto R$10 (text-3xl md:text-4xl)

## Bug: Botão Ver Cupom Ganho
- [x] Investigado: comportamento está CORRETO - o cliente tem 1/2 carimbos no ciclo ATUAL, mas possui um cupom ativo de um ciclo ANTERIOR que ainda não foi usado (activeCouponId = 60001)
- [x] O botão aparece corretamente porque o cliente TEM um cupom disponível para usar

## Navegação entre Múltiplos Cupons
- [x] Modificar schema para suportar múltiplos cupons ativos por cliente (coluna activeCouponIds JSON array)
- [x] Atualizar backend para retornar lista de cupons ativos (activeCoupons array)
- [x] Criar cupons adicionais para cliente de teste (88999290000) - 2 cupons: R$10 OFF e 15% OFF
- [x] Implementar setas de navegação (esquerda/direita) no modal de cupom
- [x] Mostrar indicador de quantidade de cupons (bolinhas de posição)

## Stack Visual de Cupons (Estilo Apple Wallet/Tinder)
- [x] Exibir "camadas" de cupons quando houver 2+ cupons (borda lateral direita discreta)
- [x] Implementar estrutura CouponsStack com CupomAtivo (z-index maior) e CupomSecundário (z-index menor com offset)
- [x] Animação de troca estilo card stack:
  - Cupom atual vai para trás com scale (1 → 0.92) e fade (1 → 0.7)
  - Próximo cupom vem para frente com animação inversa
  - Duração 220ms com ease-in-out
- [x] Suporte a swipe/arrastar para trocar cupons (touch events)
- [x] Apenas 1 cupom = visual limpo sem bordas ou stack


## Bugs no Modal de Cartão Fidelidade
- [x] Mover "Ver regulamento" para ficar abaixo do cartão de fidelidade (antes do histórico)
- [x] Corrigir número do pedido duplicado (##P261 → #P261) - lógica para verificar se já começa com #

## Stack Visual de Cupons v2 (Bordas Empilhadas)
- [x] Exibir bordas dos cupons atrás quando houver 2+ cupons
- [x] Deslocamento no eixo X (10px e 16px) para cada cupom atrás
- [x] Z-index menor e opacity 0.7/0.5 para cupons de trás
- [x] Mostrar 1-2 bordas atrás do cupom principal (2ª e 3ª camada)
- [x] Com 1 cupom = sem bordas atrás (stack desativado)
- [x] Com 2+ cupons = sempre mostrar bordas independente da posição atual


## Bug: Container Externo Visível na Animação do Cupom
- [x] Remover container externo (bg-gray-100) que aparece durante a animação de troca de cupons
- [x] Deixar cupom renderizado diretamente sobre o fundo do modal bottom sheet (overflow-visible)


## Remover Botões de Seta Externos do Modal de Cupons
- [x] Remover botões de seta laterais externos (fora do cupom)
- [x] Manter apenas as setas internas dentro do cupom (esquerda no lado amarelo, direita no lado escuro)


## Bug: Botão 'Ver cupom ganho' Aparece Durante Troca de Cupons
- [x] Ocultar botão 'Ver cupom ganho' quando já está visualizando os cupons (isFlipped=true)
- [x] Botão só deve aparecer quando mostrando o cartão de carimbos


## Ajuste na Pilha de Cupons - Stack Vertical
- [x] Remover borda lateral direita dos cupons atrás
- [x] Mostrar apenas borda superior (~8px) dos cupons atrás
- [x] Criar efeito de "stack" vertical indicando cupons extras
- [x] Manter animação de troca funcionando corretamente


## Remover Bordas dos Cupons Atrás
- [x] Remover completamente as bordas/tabs dos cupons que estão atrás
- [x] Manter apenas o cupom principal visível sem indicação de pilha


## Corrigir Recortes Circulares Transparentes do Voucher (v2)
- [x] Analisar toda a hierarquia de containers do cupom
- [x] Alterar fundo do modal para bg-gray-200 para melhor contraste
- [x] Implementar recortes usando círculos sobrepostos com cor do fundo (bg-gray-200)
- [x] Adicionar sombra interna nos círculos para dar profundidade
- [x] Testar e confirmar que os recortes funcionam corretamente


## Adicionar Mais Recortes Circulares ao Cupom
- [x] Aumentar de 1 para 9 recortes circulares de cada lado do cupom
- [x] Distribuir os recortes verticalmente ao longo de toda a altura do cupom (6% a 94%)
- [x] Criar efeito de borda serrilhada estilo ticket


## Remover Botão de Voltar do Cupom
- [x] Remover o botão de seta esquerda (voltar) do cupom
- [x] Manter apenas o botão de próximo (seta direita) para navegação


## Adicionar Borda no Cabeçalho do Modal de Fidelidade
- [x] Adicionar borda inferior no cabeçalho do modal (abaixo de "Cartão Fidelidade")
- [x] Separar visualmente o título do conteúdo do modal (border-gray-300)


## Mover Botão de Voltar ao Cartão Fidelidade
- [x] Mover o ícone de voltar (RotateCcw) do canto superior esquerdo para o lado esquerdo do cupom
- [x] Posicionar centralizado verticalmente (top-1/2 -translate-y-1/2)


## Padronizar Modais Bottom Sheet do Sistema
- [x] Adicionar borda inferior (border-gray-300) no cabeçalho de todos os modais
- [x] Adicionar ícone com container redondo em todos os modais (estilo do Cartão Fidelidade)
- [x] Diferenciar background do body (bg-gray-200) do header (bg-white)
- [x] Aplicar em: Informações, Cupom, Acompanhar Pedido, Avaliações, Como Chegar, Fidelidade


## Padronizar Modal Meus Pedidos
- [x] Aplicar cabeçalho branco com borda inferior (border-gray-300)
- [x] Adicionar ícone com container redondo roxo (ClipboardList purple)
- [x] Diferenciar background do body (bg-gray-200) do header (bg-white)


## Padronizar Modal de Sacola
- [x] Aplicar cabeçalho branco com borda inferior (border-gray-300)
- [x] Adicionar ícone com container redondo vermelho (ShoppingBag red)
- [x] Diferenciar background do body (#f5f5f5) do header (bg-white)


## Corrigir Modal Meus Pedidos no Desktop
- [x] Modal bottom sheet no mobile, centralizado no desktop (já estava correto com md:items-center md:justify-center)
- [x] Aplicar background #f5f5f5 consistente com outros modais
- [x] Ajustar rounded-t-2xl md:rounded-t-2xl no header


## Corrigir Modal Meus Pedidos Desktop (v2)
- [x] Modal já está centralizado corretamente no desktop (md:items-center md:justify-center)
- [x] Aplicar rounded-2xl completo no desktop (md:rounded-2xl)
- [x] Modal funcionando como modal normal no desktop com ícone e cabeçalho padronizado


## Corrigir Modal Meus Pedidos Desktop (v3)
- [ ] Modal ainda está com estilo bottom sheet no desktop (rounded apenas no topo)
- [ ] Aplicar rounded-2xl completo em todos os cantos no desktop
- [ ] Verificar se o header também precisa de rounded completo no desktop

## Correção de Modal Desktop
- [x] Corrigir modal "Meus Pedidos" para ter rounded-2xl completo no desktop (estava apenas rounded-t)

## Correção Modal Meus Pedidos Desktop
- [x] Corrigir modal "Meus Pedidos" para ter arredondamento completo (rounded-2xl) no desktop igual ao modal Cartão Fidelidade

## Padronização Visual dos Modais
- [x] Verificar modal Informações - OK (header branco, arredondamento, shadow-2xl)
- [x] Verificar modal Cartão Fidelidade - OK (header branco, fundo cinza #f5f5f5)
- [x] Verificar modal Meus Pedidos - OK (header branco, fundo cinza #f5f5f5)
- [x] Verificar modal Aplicar Cupom - OK (header branco, arredondamento)
- [x] Verificar modal Acompanhamento de Pedido - OK (sticky header, shadow-2xl)
- [x] Verificar modal Avaliação - OK (fundo cinza #f5f5f5)

## Padronização Visual dos Modais do Menu Público
- [ ] Verificar modal Sacola
- [ ] Verificar modal Detalhes do Pedido
- [ ] Verificar modal Informações
- [ ] Verificar modal Cartão Fidelidade
- [ ] Verificar modal Cupom
- [ ] Verificar modal Avaliações
- [ ] Padronizar cabeçalhos (altura, cores, ícones)
- [ ] Padronizar arredondamento (rounded-t-2xl mobile, rounded-2xl desktop)
- [ ] Padronizar cor de fundo do body (#f5f5f5 ou bg-gray-200)


## Padronização Final dos Modais do Menu Público
- [x] Verificar modal Informações - cor de fundo branca no body
- [x] Verificar modal Cartão Fidelidade - cor de fundo branca no body
- [x] Verificar modal Aplicar Cupom - cor de fundo branca no body
- [x] Verificar modal Acompanhamento de Pedido - cor de fundo branca no body
- [x] Verificar modal Avaliação - cor de fundo branca no body
- [x] Verificar modal Meus Pedidos - cor de fundo branca no body (já estava correto)


## Verificação de Modais Adicionais
- [x] Verificar modal Sacola (sua sacola) - corrigido: bg branco, shadow-2xl, fundo body #ffffff
- [x] Verificar modal Checkout - corrigido: ícone colorido no header, shadow-2xl, estrutura padronizada
- [x] Verificar modal Acompanhar Pedido - já estava correto


## Ajustes no Modal Cartão Fidelidade
- [x] Ocultar botão "Sair do cartão" no modal de Cartão Fidelidade


## Ajustes no Cupom de Desconto
- [x] Ajustar cor das bolinhas (recortes circulares) do cupom para #ffffff (branco) igual ao fundo do modal


## Indicador de Paginação dos Cupons
- [x] Adicionar números dentro dos dots de paginação dos cupons (revertido a pedido do usuário)


## Bug - Atualização do Cartão Fidelidade
- [x] Corrigir: cartão fidelidade não atualiza automaticamente quando pedido é entregue (adicionado refetch automático via SSE)


## Alteração do Fluxo de Reset de Carimbos
- [x] Carimbos só devem ser resetados quando usuário clicar em "Ver cupom ganho"
- [x] Não resetar carimbos automaticamente ao completar o cartão
- [x] Criar endpoint para resetar carimbos ao visualizar cupom (loyalty.viewCouponAndResetStamps)
- [x] Atualizar frontend para chamar reset ao clicar em Ver cupom ganho


## Bug - Reset de Carimbos não Funciona Corretamente
- [x] Corrigir: carimbos não estão sendo resetados ao clicar em "Ver cupom ganho" - mostrando 3/2 em vez de 1/2 (corrigido: processLoyaltyStampOnDelivery não reseta mais automaticamente)


## Bug Persistente - Reset de Carimbos
- [x] Investigar: carimbos ainda mostram 3/2 após clicar em "Ver cupom ganho" - corrigido: não adicionar carimbo se cartão já tem cupom ativo


## Alteração de Fluxo - Carimbos com Cupom Ativo
- [x] Novos pedidos devem adicionar carimbos mesmo quando cliente tem cupom ativo
- [x] Carimbos só resetam quando usuário clica em "Ver cupom ganho"


## Novo Fluxo - Reset Automático de Carimbos
- [x] Carimbos resetam automaticamente quando novo pedido é entregue após completar o cartão
- [x] "Ver cupom ganho" apenas mostra o cupom, não reseta carimbos
- [x] Fluxo: 1/2 → 2/2 (cupom criado) → novo pedido entregue → reset + 1/2
- [x] Corrigir: histórico de carimbos não deve ser deletado no reset automático
- [x] Corrigir: exibir múltiplos cupons de fidelidade quando cliente completa cartão mais de uma vez
- [x] Exibir numeração do voucher (Voucher 1, Voucher 2, etc) quando há múltiplos cupons
- [x] Corrigir bug: cabeçalho do modal Cartão Fidelidade com fundo cinza e título sumindo
- [x] Exibir cupom aplicado no modal de detalhes do pedido
- [x] Exibir cupom aplicado na versão de impressão do pedido
- [x] Corrigir arredondamento do modal Sua Sacola na versão desktop
- [x] Implementar optimistic update na mudança de status dos pedidos para atualização instantânea
- [x] Mover pedido instantaneamente para o card correto após mudança de status
- [x] Ajustar espaçamento do container de taxa de entrega na versão desktop
- [x] Exibir taxa de entrega configurada no container (grátis ou valor fixo)
- [x] Exibir taxa de entrega configurada no modal de Resumo do Pedido
- [x] Redesenhar container de taxa de entrega com borda lateral verde
- [x] Atualizar container de taxa de entrega com ícone de caminhão e badge Grátis
- [x] Adicionar borda lateral esquerda verde no container de entrega grátis
- [x] Corrigir borda lateral do container de entrega grátis para ficar igual aos itens
- [x] Padronizar cor verde do container de entrega grátis com a cor do sistema
- [x] Corrigir cor verde do container de entrega grátis que não está aparecendo
- [x] Alterar cores do container de taxa de entrega de verde para vermelho (cor primária do sistema)
- [x] Implementar botão Selecionar com dropdown para taxa por bairro
- [x] Reduzir tamanho do botão Selecionar em 33%
- [x] Corrigir salvamento das taxas por bairro no painel admin
- [ ] Adicionar fechamento do dropdown ao clicar fora
- [ ] Validar seleção de bairro antes de finalizar pedido
- [ ] Aplicar seletor de bairro no checkout mobile
- [ ] Adicionar estimativa de tempo de entrega
- [x] Corrigir erro ao salvar taxas por bairro (bairros agora persistem corretamente)
- [x] Corrigir dropdown de seleção de bairros no cardápio público (não mostra os bairros cadastrados)
- [x] Bug: Bairros não aparecem no dropdown do menu público para cliente 30001 (tabela criada no banco)
- [x] Bug persistente: Bairros não aparecem no dropdown do menu público para o usuário (verificado - funciona corretamente)
- [x] Bug: Dropdown de bairros não abre ao clicar em Selecionar (corrigido removendo overflow-hidden)
- [x] Fechar dropdown de bairros ao clicar fora dele
- [x] Criar modal estilizado para seleção de bairros no desktop (mesmo estilo do modal de Meus Pedidos)
- [ ] Adicionar coração como marca d'água no cartão de fidelidade
- [x] Adicionar coração vazado como marca d'água no cartão de fidelidade
- [ ] Aumentar modal de seleção de bairro em 20% no desktop
- [ ] Adicionar campo de busca no modal de seleção de bairro
- [ ] Validar seleção de bairro no checkout (impedir finalização sem selecionar bairro)

## Modal de Seleção de Bairro (Melhorias)
- [x] Aumentar modal de seleção de bairro em 20% no desktop
- [x] Adicionar campo de busca para filtrar bairros por nome
- [x] Validar seleção de bairro no checkout (impede finalizar sem selecionar bairro quando taxa é por bairro)
- [x] Ordenar lista de bairros em ordem alfabética no modal de seleção
- [x] Adicionar mensagem de "nenhum bairro encontrado" quando a busca não retornar resultados (já implementado)
- [x] Refletir a taxa de entrega na sacola ao selecionar bairro
- [x] Implementar novo modelo do cartão de fidelidade com dois corações e container semi-transparente
- [ ] Bug: Cartão de fidelidade aparece por trás do cupom na versão mobile quando virado
- [x] Bug: Cartão de fidelidade aparece por trás do cupom na versão mobile quando virado (corrigido com z-index)
- [ ] Alterar botão de bairro: mostrar "Selecionado" com check quando selecionado, "Alterar" no hover

## Botão de Seleção de Bairro - Comportamento Melhorado
- [x] Mostrar "Alterar" diretamente quando bairro selecionado (sem hover)
- [x] Manter "Selecionar" quando nenhum bairro estiver selecionado

## Cupons de Fidelidade - Uso Único
- [x] Garantir que cupons ganhos pelo cartão fidelidade só podem ser usados uma única vez
- [x] Invalidar cupom após primeiro uso (independente do cliente)
- [x] Adicionar validação no backend para verificar se cupom já foi usado
- [x] Mensagem específica para cupom de fidelidade já utilizado

## Formato do Código de Cupom de Fidelidade
- [x] Alterar formato do código para máximo 8 caracteres (ex: FIDM7F9K)
- [x] Incluir números no código alfanumérico
- [x] Remover caracteres confusos (I, O, 0, 1) para evitar erros de digitação

## Verificação de Unicidade do Código de Cupom
- [x] Verificar se código já existe antes de criar cupom
- [x] Regenerar código automaticamente em caso de colisão
- [x] Limitar tentativas de geração para evitar loop infinito (max 10 tentativas)
- [x] Fallback com timestamp caso todas as tentativas falhem

## Novo Visual do Card de Cupom
- [x] Implementar novo design do card de cupom com efeito de voucher
- [x] Manter as mesmas proporções (altura e largura)
- [x] Adicionar efeito de recorte nas bordas (perfurado) usando CSS mask
- [x] Lado esquerdo amarelo/dourado com nome do estabelecimento e validade
- [x] Lado direito azul escuro (slate-900) com valor do desconto e botões
- [x] Ícone de talheres como marca d'água no lado esquerdo
- [x] Sombra drop-shadow para efeito de profundidade

## Variações de Cor para Cupons
- [x] Primeiro cupom mantém cor amarela/dourada atual
- [x] Cupons seguintes têm cores distintas no lado esquerdo (emerald, sky, violet, rose, orange, teal, pink)
- [x] Lado direito permanece azul escuro/preto em todos os cupons
- [x] Cores mudam ao navegar entre cupons para dar percepção de troca
- [x] Transição suave de 300ms entre cores

## Ajuste de Cores do Lado Direito do Cupom
- [x] Mudar cor do texto R$10 OFF para corresponder ao lado esquerdo
- [x] Mudar cor do botão Copiar para corresponder ao lado esquerdo
- [x] Mudar cor do botão Usar agora para corresponder ao lado esquerdo
- [x] Mudar cor do botão próximo para corresponder ao lado esquerdo

## Padronização dos Modais Mobile
- [x] Igualar altura do cabeçalho do modal de seleção de bairro com o de Meus Pedidos (68px)
- [x] Igualar tamanho do ícone e padding do modal de seleção de bairro (h-5 w-5, p-2)
- [x] Igualar tamanho do título do modal de seleção de bairro (text-lg)
- [x] Igualar tamanho do botão X de fechar (h-5 w-5, p-2)

## Correção do Scroll do Modal de Seleção de Bairro (Mobile)
- [x] Impedir que o fundo role quando o modal está aberto (adicionado showNeighborhoodModal ao useEffect)
- [x] Garantir que apenas o conteúdo do modal seja rolável (touch-action: pan-y)

## Link Alterar Bairro no Modal da Sacola
- [x] Adicionar texto "Alterar bairro" ao lado de "Taxa de entrega" quando bairro estiver selecionado
- [x] Ao clicar em "Alterar bairro", abrir o modal de seleção de bairro (fecha a sacola e abre o modal)

## Bug: Cabeçalho do Modal de Fidelidade Sumindo (Mobile)
- [x] Investigar por que o cabeçalho do modal de fidelidade some em algumas situações
- [x] Identificar o cenário que causa o bug (z-index dos elementos do card flip sobrepondo o header sticky)
- [x] Corrigir o problema (aumentado z-index do header para z-[50] e ajustado z-index dos elementos internos)

## Bug: Link Alterar Bairro não aparece no Modal da Sacola (Mobile)
- [ ] Verificar por que o link "Alterar bairro" não está aparecendo
- [ ] Corrigir o problema

## Bug: Link Alterar Bairro não aparece no Modal da Sacola (Mobile) - CORRIGIDO
- [x] Verificar por que o link "Alterar bairro" não está aparecendo (condição usava "neighborhood" ao invés de "byNeighborhood")
- [x] Corrigir o problema (atualizada condição para usar valor correto do schema)

## Reabrir Modal da Sacola após Alterar Bairro
- [x] Ao clicar em "Alterar bairro" no modal da sacola, fechar sacola e abrir modal de bairro
- [x] Após selecionar um bairro, reabrir automaticamente o modal da sacola (com setTimeout de 100ms)

## Reabrir Modal da Sacola após Selecionar Bairro (Fluxo Finalizar Pedido)
- [x] Quando usuário clica em "Finalizar pedido" sem bairro selecionado, abrir modal de bairro
- [x] Após selecionar o bairro, reabrir automaticamente o modal da sacola (mobile e desktop)

## Validação do Campo Número no Modal de Entrega
- [x] Permitir apenas números no campo "Número" (regex remove caracteres não numéricos)
- [x] Limitar a 6 caracteres máximo
- [x] Adicionado inputMode="numeric" para teclado numérico no mobile

## Persistência da Sacola no LocalStorage
- [x] Salvar sacola no localStorage ao adicionar/remover itens
- [x] Carregar sacola do localStorage ao iniciar a página
- [x] Manter sacola ao atualizar página, fechar navegador ou navegar para outra página
- [x] Limpar sacola apenas ao finalizar pedido ou limpar manualmente
- [x] Associar sacola ao estabelecimento (slug) para não misturar itens de diferentes lojas

## Campo Bairro no Modal de Entrega - Somente Leitura
- [x] Quando bairro já estiver selecionado (taxa de entrega), campo fica somente leitura
- [x] Exibir botão "Alterar bairro" ao lado do campo
- [x] Ao clicar em "Alterar bairro", abrir modal de seleção de bairro
- [x] Após selecionar novo bairro, retornar ao modal de tipo de entrega (checkout step 2)

## Bug: Sacola não limpa após envio do pedido
- [x] Limpar sacola do localStorage após envio bem-sucedido do pedido (onSuccess do createOrderMutation)
- [x] Garantir que o modal da sacola mostre estado vazio após envio
- [x] Resetar todos os estados relacionados à sacola (também no botão Fechar do modal de acompanhamento)

## Seleção Automática de Entrega ao Selecionar Bairro
- [x] Quando usuário selecionar um bairro, definir deliveryType como "delivery" automaticamente
- [x] Manter a opção de retirar no local disponível para alteração manual

## Exibir Taxa de Entrega no Modal de Confirmação
- [x] Adicionar linha de "Taxa de entrega" entre Subtotal e Total no modal de confirmação
- [x] Exibir o valor da taxa do bairro selecionado (apenas quando deliveryType === 'delivery')

## Bug: Som de Novo Pedido Tocando no Menu Público
- [x] Investigar onde o som de novo pedido está sendo disparado no menu público
- [x] Garantir que o som só toque no painel administrativo (adicionado isInPublicMenu() no NotificationAudioManager)
- [x] Bloquear som no método play() e no pendingPlay quando estiver no menu público

## Investigação Profunda: Som no Menu Público
- [x] Verificar se NewOrdersProvider está sendo carregado no menu público (SIM - estava envolvendo toda a app)
- [x] Verificar se o hook useOrdersSSE está ativo no menu público (SIM - era carregado pelo provider)
- [x] Verificar se há BroadcastChannel ou listener global de eventos (NÃO - problema era o provider)
- [x] Isolar o módulo de áudio para carregar apenas no painel admin (reestruturado App.tsx)
- [x] Garantir que o NotificationAudioManager não seja instanciado no menu público (NewOrdersProvider agora só envolve rotas admin)

## Bug: Scroll do Modal de Seleção de Bairro (v2)
- [x] Impedir que a página de fundo role quando o modal está aberto (onTouchMove com preventDefault)
- [x] Garantir que apenas o conteúdo do modal seja rolável (data-neighborhood-scrollable)
- [x] Adicionado overscroll-contain e WebkitOverflowScrolling para melhor suporte mobile


## Bug: Carimbo do Cartão Fidelidade não atualiza automaticamente
- [x] Investigar por que o carimbo não aparece ao abrir o modal após fazer pedido
- [x] Verificar se a query do cartão fidelidade está sendo invalidada corretamente
- [x] Garantir que o modal sempre busque dados atualizados ao abrir (adicionado refetch ao clicar no botão Fidelidade)
- [x] Correção aplicada tanto no desktop quanto no mobile


## Ajuste: Altura do Modal de Seleção de Bairro no Mobile
- [x] Limitar altura do modal para mostrar no máximo 4 bairros (maxHeight: 280px no mobile)
- [x] Garantir que o scroll funcione para ver os demais bairros
- [x] Manter comportamento normal no desktop (maxHeight: 400px)


## Bug: Preço dos complementos não aparece nos modais
- [x] Adicionar preço dos complementos no modal "Sua Sacola" (desktop e mobile)
- [x] Adicionar preço dos complementos no modal de resumo do pedido (checkout)
- [x] Adicionar preço dos complementos no modal de confirmação de endereço
- [x] Formato: "+ Complemento (R$ X,XX)"


## Ajuste: Estilo do preço dos complementos
- [x] Preço dos complementos em vermelho (igual ao preço do item)
- [x] Preço alinhado à direita do container
- [x] Aplicar em todos os modais (sacola desktop/mobile, resumo, confirmação)


## Bug: Modal de Cupom cortado em telas pequenas
- [x] Ajustar layout do campo de texto e botão para não serem cortados
- [x] Colocar campo e botão em linhas separadas em telas pequenas (flex-col no mobile, flex-row no desktop)
- [x] Garantir que o botão "Aplicar cupom" apareça completo (w-full no mobile)


## Ajuste: Texto do botão de complementos
- [x] Alterar "Selecione uma opção" para "Escolha uma opção" para evitar quebra de linha


## Ajuste: Altura da foto no modal de detalhes do item
- [x] Diminuir altura da foto em 20% para telas menores (mobile) - de 268px para 215px


## Verificação: Consistência de estilo entre modais
- [x] Comparar modal "Como chegar" com modal "Meus pedidos"
- [x] Ajustar cabeçalho, fundo e estilos para ficarem consistentes
  - Adicionado sticky top-0 no header
  - Ajustado max-h para 85vh, overflow-y-auto e overscroll-contain
  - Adicionado animações md:slide-in-from-bottom-0 md:zoom-in-95
  - Fundo branco (#ffffff) em todas as seções (endereço, opções, footer)


## Feature: Sistema de Impressão Automática de Pedidos

### Fase 1: Backend - Schema e Rotas
- [x] Criar tabela `printers` no schema (nome, IP, porta, ativo, estabelecimento)
- [x] Criar tabela `printer_settings` para configurações de impressão
- [x] Criar rotas tRPC para CRUD de impressoras (list, get, create, update, delete, getSettings, saveSettings, getDefault, printOrder)
- [ ] Criar rota para testar conexão com impressora (pendente - requer cliente de impressão)

### Fase 2: Evento SSE para Impressão
- [x] Adicionar evento SSE `new_order_to_print` no sistema de notificações (notifyPrintOrder)
- [x] Disparar evento quando pedido for criado (createPublicOrder)
- [x] Incluir dados completos do pedido no evento

### Fase 3: Interface de Configuração no Admin
- [x] Criar página de configuração de impressoras (/impressoras)
- [x] Formulário para adicionar/editar impressora (nome, IP, porta)
- [x] Toggle para ativar/desativar impressão automática
- [x] Botão para testar impressão (abre window.print)

### Fase 4: Impressão Manual
- [x] Adicionar botão "Imprimir" nos detalhes do pedido (já existia)
- [x] Criar layout de impressão formatado para cupom 80mm
- [x] Usar window.print() com @media print CSS
- [x] Criar rota printer.printOrder para impressão via impressora térmica

### Próximos Passos (Cliente de Impressão)
- [ ] Cliente local (app desktop) para receber eventos SSE e enviar para impressora térmica
- [ ] Testar conexão com impressora via TCP/IP


## Feature: Botão de Teste de Conexão com Impressora
- [x] Criar rota no backend para testar conexão TCP com a impressora (printer.testConnection)
- [x] Adicionar botão "Testar Conexão" no modal de adicionar/editar impressora
- [x] Mostrar feedback visual do resultado do teste (sucesso/falha) com cores verde/vermelho


## Bug: printer.getSettings retorna undefined
- [x] Corrigir rota para retornar objeto padrão quando não há configurações salvas


## Ajuste: Mover Impressoras para Configurações
- [x] Adicionar aba "Impressoras" na página de Configurações
- [x] Mover conteúdo da página Impressoras.tsx para a nova aba
- [x] Remover item "Impressoras" do menu lateral
- [x] Remover rota /impressoras do App.tsx
- [x] Deletar arquivo Impressoras.tsx


## Ajuste: Taxa de Entrega na Impressão do Pedido
- [x] Adicionar taxa de entrega no layout de impressão do pedido
- [x] Mostrar "Grátis" quando taxa for zero


## Feature: Botão de Impressão no Card do Pedido
- [x] Adicionar botão com ícone de impressora no card do pedido
- [x] Ao clicar, abrir diretamente a janela de impressão do pedido
- [x] Criar função handlePrintOrderDirect que busca dados do pedido e abre impressão


## Feature: Tooltip no Botão de Impressora
- [x] Adicionar tooltip informativo ao botão de impressora no card do pedido


## Ajuste: Posição e estilo do botão de impressão
- [x] Mover botão de impressão para o lado esquerdo do botão "Ver detalhes"
- [x] Ajustar estilo para ficar como botão outline com apenas o ícone


## Feature: PWA (Progressive Web App) para o Admin
### Fase 1: Configuração básica do PWA
- [x] Criar manifest.json com nome, ícones, cores e configurações do app
- [x] Adicionar meta tags necessárias no index.html
- [x] Criar ícones do app em diferentes tamanhos (192x192, 512x512)

### Fase 2: Service Worker
- [x] Criar service worker para cache de assets
- [x] Implementar estratégia de cache (network-first para API, cache-first para assets)
- [x] Registrar service worker no app

### Fase 3: Notificações Push
- [x] Implementar Web Push API no service worker
- [x] Criar rota no backend para registrar subscriptions de push
- [x] Enviar notificação push quando novo pedido chegar
- [x] Tocar som na notificação mesmo com tela desligada

### Fase 4: Experiência de instalação
- [x] Adicionar botão/prompt para instalar o PWA
- [x] Detectar se o app já está instalado
- [x] Mostrar instruções de instalação para iOS (Add to Home Screen)

### Fase 5: Interface de Configuração
- [x] Criar aba de Notificações na página de Configurações
- [x] Criar componente NotificationsTab com gerenciamento de subscriptions
- [x] Mostrar status das notificações (ativadas/desativadas)
- [x] Mostrar lista de dispositivos cadastrados
- [x] Permitir enviar notificação de teste
- [x] Mostrar instruções de instalação do PWA


## Layout Compacto do Card de Pedido (Mobile)
- [x] Reorganizar informações do card de pedido em uma única linha no mobile
- [x] Formato: Nome - Ícone pagamento - Método - Tag entrega - Valor
- [x] Remover linha separada de "Total" no mobile
- [x] Manter layout atual no desktop


## Bug: Notificações Push não funcionando após instalação PWA
- [ ] Verificar se o Service Worker está registrado corretamente
- [ ] Verificar se a subscription está sendo salva no banco
- [ ] Verificar se as chaves VAPID estão configuradas
- [ ] Testar envio de notificação de teste


## Bug: Número do pedido com ## duplicado na notificação push
- [x] Corrigir formato do número do pedido na notificação (##P345 → #P345)


## Bug: Botões sem nomes na versão mobile da página Cardápio
- [x] Adicionar Tooltips aos botões "Reorganizar", "Nova Categoria" e "Novo Item" no mobile


## Melhoria: Layout horizontal para informações do cliente no modal de pedido
- [x] Colocar Nome e Telefone na mesma linha horizontal no card de informações do cliente


## Melhoria: Unificar cards de entrega e pagamento no modal de pedido
- [x] Remover card "Detalhes do Pagamento" separado
- [x] Adicionar método de pagamento no card de "Informações de Entrega"
- [x] Renomear para apenas "Entrega" com Tipo e Método


## Bug: Erro ao imprimir direto do card no PWA
- [x] Corrigir erro ao abrir janela de impressão quando clica no botão de imprimir do card do pedido
- [x] Abrir janela ANTES do fetch para manter contexto de evento do usuário


## Bug: Nomes dos botões não aparecem no mobile na página Catálogo
- [x] Mostrar nomes "Reordenar", "Categoria" e "Item" nos botões no mobile


## Melhoria: Scroll horizontal nos campos de complementos (mobile)
- [x] Adicionar scroll horizontal nos itens de complemento para ver texto completo no mobile


## Melhoria: Scroll horizontal no card de Complementos/Adicionais
- [x] Adicionar scroll horizontal no card inteiro para ver nomes completos dos complementos
- [x] Adicionar min-width de 400px nos itens para garantir espaço


## Melhoria: Ocultar badge de tempo real no mobile (Pedidos)
- [x] Ocultar o badge de tempo real na versão mobile da página de Pedidos


## Melhoria: Layout horizontal no card de pedido (desktop)
- [x] Mostrar nome, forma de pagamento e tipo de entrega na mesma linha no desktop (igual mobile)
- [x] Aumentar tamanhos de fonte e espaçamentos para desktop


## Melhoria: Botão de cancelar vermelho por padrão
- [x] Deixar o botão de cancelar já vermelho (sem precisar de hover)


## Feature: Integração com WhatsApp via UAZAPI
### Fase 1: Análise da documentação
- [x] Ler documentação da UAZAPI
- [x] Identificar endpoints necessários (criar instância, QR code, enviar mensagem)

### Fase 2: Backend
- [x] Criar tabela para armazenar configuração do WhatsApp por estabelecimento
- [x] Implementar rotas tRPC para gerenciar conexão WhatsApp
- [x] Implementar função de envio de mensagens

### Fase 3: Frontend
- [x] Criar interface de conexão WhatsApp na página de Configurações
- [x] Mostrar QR Code para conexão
- [x] Mostrar status da conexão

### Fase 4: Integração
- [x] Enviar mensagem automática quando status do pedido mudar
- [x] Personalizar mensagens por tipo de status


## Melhoria: Configuração automática do WhatsApp via UAZAPI
- [ ] Configurar credenciais UAZAPI como variáveis de ambiente centralizadas
- [ ] Criar instância automaticamente por estabelecimento (usando ID do estabelecimento)
- [ ] Simplificar interface - dono do restaurante só precisa escanear QR Code
- [ ] Remover campos de subdomínio e token da interface

## Integração WhatsApp Simplificada (UAZAPI)
- [x] Configurar credenciais UAZAPI centralizadas (UAZAPI_BASE_URL, UAZAPI_ADMIN_TOKEN)
- [x] Criar módulo uazapi.ts com funções para criar instâncias automaticamente
- [x] Atualizar schema do banco para usar instanceId e instanceToken em vez de subdomain/token
- [x] Simplificar interface do WhatsApp - apenas QR Code para conectar (sem campos de credenciais)
- [x] Criar instância automaticamente ao clicar em Conectar
- [x] Atualizar rotas tRPC para usar credenciais centralizadas
- [x] Manter configurações de notificações e templates personalizáveis
- [x] Testar fluxo completo de conexão via QR Code
- [x] Corrigir exibição do status de conexão (mostrava desconectado mesmo conectado)
- [ ] Testar envio de notificações automáticas ao mudar status do pedido
- [x] Preencher templates de mensagem com valores padrão (sem precisar preencher manualmente)
- [x] Bug: ao aceitar pedido deve enviar mensagem de "Novo Pedido", não "Preparando" - Corrigido: agora envia notificação de novo pedido quando o pedido é criado
- [x] Adicionar templates diferentes para status "Pronto" baseado no tipo de entrega (retirada vs delivery)
- [x] Adicionar variável {{cancellationReason}} no template de cancelamento para enviar o motivo ao cliente
- [x] Limitar campo de telefone no modal "Seus Dados" para máximo de 13 caracteres
- [x] Adicionar máscara visual (DDD) 9 9999-9999 no campo de telefone com formatação automática
- [x] Criar variável {{greeting}} para saudação automática baseada no horário (Bom dia/Boa tarde/Boa noite)
- [x] Permitir underscore (_), ponto (.) e números no campo "Link do Cardápio"
- [x] Bug: ao avançar de "Seus Dados" para "Confirmação" mostra mensagem de erro "Não foi possível enviar o pedido" incorretamente - Corrigido: agora limpa o erro anterior ao iniciar novo checkout
- [x] Atualizar templates padrão de WhatsApp para novos estabelecimentos (incluindo template de fidelidade)

## App Android de Impressão Local
- [x] Pesquisar soluções de impressão ESC/POS para Android
- [x] Criar endpoint de API para gerar HTML do recibo (/api/print/receipt/:orderId)
- [x] Integrar com app ESC POS Wifi Print Service (via app-links print://)
- [x] Adicionar dropdown de impressão com opção térmica no painel de pedidos
- [x] Criar testes unitários para o endpoint de recibo


## Melhorias no Sistema de Impressão Térmica
- [x] Impressão automática de novos pedidos
- [x] Múltiplas impressoras (cozinha/balcão) com tipo e categorias
- [x] Personalizar recibo com logo, mensagem de cabeçalho e rodapé
- [x] Configuração de largura do papel (58mm/80mm)
- [x] Adicionar campo de tipo de impressora no modal (Todos, Cozinha, Balcão, Bar)
- [x] Atualizar endpoint de recibo para usar configurações personalizadas


## App Android de Impressão Automática
- [ ] Criar tabela de fila de impressão no banco de dados
- [ ] Criar endpoints de API para polling (buscar pedidos pendentes, marcar como impresso)
- [ ] Desenvolver app Android com Kotlin/Jetpack Compose
- [ ] Implementar polling a cada X segundos
- [ ] Integrar com impressora ESC/POS via socket TCP
- [ ] Gerar APK para instalação
- [ ] Documentar configuração e uso do app


## PWA de Impressão Automática
- [x] Criar tabela de fila de impressão (printQueue)
- [x] Criar endpoints de API para polling (pending, getJob, markPrinted, markFailed)
- [x] Desenvolver página PWA de impressão (/printer-app)
- [x] Integrar com app ESC POS via print://
- [x] Configurações de intervalo de polling (3s a 30s)
- [x] Som de notificação para novos pedidos
- [x] Histórico de impressões recentes
- [x] Criar testes unitários


## Bug: Pedidos não aparecem na fila de impressão
- [x] Adicionar chamada para addToPrintQueue após criar pedido
- [x] Verificar se printerSettings.autoPrintEnabled está ativado
- [ ] Testar fluxo completo de impressão automática


## Bug: Tela branca ao abrir link print://
- [x] Corrigir método de abertura do link print:// para não criar aba em branco no Android


## Melhoria: Botão de impressão visível na PWA
- [x] Garantir que o botão "IMPRIMIR AGORA" apareça quando há pedidos pendentes
- [x] Adicionar lista de pedidos pendentes para impressão manual
- [x] Melhorar feedback visual quando pedido chega
- [x] Não marcar como impresso automaticamente - usuário deve confirmar


## Bug: Botão IMPRIMIR PEDIDO não funciona na PWA
- [x] Investigar por que o link print:// não abre o app ESC POS
- [x] Corrigir formato do link para usar o formato correto do ESC POS Wifi Print Service
- [x] Usar window.location.href como na página de Pedidos

## Impressão Automática na PWA
- [x] Implementar impressão automática quando novos pedidos chegarem
- [x] Contornar limitações de segurança do navegador para abrir links automaticamente
- [x] Testar funcionamento no Android com app ESC POS
- [x] Decisão: criar app Android nativo para contornar limitações do navegador

## App Android Nativo para Impressão Automática
- [x] Configurar ambiente Android e criar estrutura do projeto
- [x] Implementar serviço de polling para verificar novos pedidos
- [x] Integrar com API do backend (endpoint /api/print/queue/pending)
- [x] Implementar abertura automática do app ESC POS via Intent
- [x] Adicionar notificação persistente para serviço em segundo plano
- [x] Adicionar som e vibração quando chegar pedido
- [x] Criar projeto completo com código fonte para compilação no Android Studio

## Impressão Semi-Automática ao Aceitar Pedido
- [x] Modificar botão "Aceitar" para enviar impressão automaticamente após aceitar
- [x] Manter botão de impressora independente funcionando
- [x] Testar fluxo completo

## Notificação Visual ao Aceitar Pedido
- [x] Adicionar toast de "Pedido aceito e enviado para impressão"

## Melhorar Legibilidade do Recibo Térmico
- [x] Aumentar tamanho da fonte para melhor leitura
- [x] Ajustar espaçamento e margens
- [x] Otimizar layout para impressoras 58mm/80mm

## Integração POSPrinterDriver - Impressão Automática via Servidor
- [x] Adicionar campos no banco para linkcode e configurações
- [x] Criar função de impressão via API POSPrinterDriver
- [x] Integrar impressão automática quando chegar pedido novo
- [x] Criar interface de configuração no painel admin
- [x] Testar impressão automática

## Impressão Direta via Rede Local (Socket TCP)
- [x] Criar módulo de impressão ESC/POS via socket TCP
- [x] Gerar comandos ESC/POS para formatação do recibo
- [x] Integrar impressão automática quando chegar pedido novo
- [x] Adicionar toggle para ativar/desativar impressão direta
- [x] Adicionar interface de configuração no painel admin
- [x] Adicionar botão de teste de conexão

## Melhorar Visibilidade do Recibo Térmico
- [x] Colocar todos os textos em negrito para melhor legibilidade

## Corrigir Impressão Térmica Android
- [x] Fazer botão "Impressora Térmica (Android)" usar o mesmo estilo do botão "Impressão Normal"

## Ajustar Tamanho e Peso das Fontes do Recibo
- [x] Diminuir tamanho das fontes do recibo térmico
- [x] Ajustar pesos: corpo (500), itens (700), observações (500), cliente (500), data/hora (700)

## Bug: Impressão Térmica Android não funciona
- [x] Investigar problema no botão de impressão térmica Android
- [x] Corrigir o código para funcionar corretamente (usar URL HTTP em vez de blob)

## Página de Teste e Configuração de Impressão
- [ ] Criar página com preview do recibo em tempo real
- [ ] Adicionar controles para tamanho de fonte (pequeno, médio, grande)
- [ ] Adicionar controles para peso de fonte (normal, semi-negrito, negrito)
- [ ] Adicionar controles para largura do papel (58mm, 80mm)
- [ ] Botão para testar impressão com configurações atuais
- [ ] Salvar configurações no banco de dados
- [ ] Aplicar configurações salvas no recibo térmico


## Página de Teste de Impressão
- [x] Criar página TesteImpressao.tsx com preview em tempo real
- [x] Adicionar controles de ajuste de fonte (tamanho e peso) para texto geral, títulos, itens e observações
- [x] Adicionar controles de layout (largura do papel, divisores)
- [x] Implementar preview do recibo com dados de exemplo
- [x] Adicionar botão de teste de impressão normal (navegador)
- [x] Adicionar botão de teste de impressão térmica (Android ESC POS)
- [x] Adicionar botão de restaurar configurações padrão
- [x] Adicionar link "Teste Impressão" no menu lateral
- [x] Adicionar campos de configuração de fonte no schema printerSettings
- [x] Implementar salvamento das configurações no banco de dados
- [x] Integrar configurações salvas com o endpoint de impressão de recibos
- [x] Carregar configurações salvas ao abrir a página


## Bugs - Teste de Impressão
- [x] Corrigir botão "Testar Impressão Normal" que não abre janela de impressão
- [x] Corrigir botão "Testar Impressora Térmica (Android)" que não funciona

- [x] Corrigir recibo de teste que não mostra todas as informações do Preview

- [x] Alterar modelo do recibo de teste para usar o mesmo layout do Preview (sem logo, mesmo formato)

- [x] Corrigir salvamento das configurações de fonte que não persiste no banco de dados

- [x] Adicionar card de preview com campo de texto personalizado e botão de teste de impressão térmica

- [x] Atualizar estilos do endpoint de teste para usar os mesmos estilos otimizados da função generateReceiptHTML

- [x] Ajustar layout do teste de impressão para alinhar Pedido e data à esquerda (igual foto do recibo)

- [x] Adicionar badge de ENTREGA/RETIRADA no recibo de teste (fundo preto, texto branco, centralizado)

- [x] Mover badge de ENTREGA/RETIRADA para o lado direito do número do pedido (mesma linha)

- [x] Centralizar badge de ENTREGA verticalmente entre as linhas Pedido e Realizado em (à direita)

- [x] Adicionar badge no Total com fundo escuro e texto branco (TOTAL à esquerda, valor à direita)

- [x] Trocar texto "Realizado em:" por ícone de calendário 📅 antes da data

- [x] Adicionar estilo de caixa com bordas redondas na seção de Endereço

- [x] Pagamento: caixa com bordas redondas, título PAGAMENTO e forma de pagamento em badge na mesma linha
- [x] Cliente: mesmo estilo de caixa com bordas redondas igual ao Endereço

- [x] Cliente: nome e telefone na mesma linha horizontal

- [x] Cliente: título e dados na mesma linha (Cliente: Nome - Telefone)

- [x] Itens do pedido: adicionar caixa com bordas redondas em cada item

- [x] Aumentar espessura das bordas de 1px para 2px em todas as caixas (agora 2px solid #000)

- [x] Aplicar o mesmo estilo do preview de teste na função generateReceiptHTML dos pedidos reais

- [x] Forma de pagamento: remover badge preto e deixar apenas texto em negrito

- [x] Garantir que a impressão dos pedidos reais use exatamente o mesmo estilo da página de teste (sem logo)

- [x] Pagamento: "Pagamento" à esquerda e forma de pagamento (PIX) à direita na mesma linha

- [x] Adicionar campo para upload de imagem QR Code na página de Teste de Impressão (após seção Cliente)

- [x] QR Code PIX: aumentar tamanho em 20% (de 120px para 144px) e remover borda redonda

- [x] Adicionar slider para controlar espaçamento interno (padding) das caixas com bordas redondas no card de Configurações de Fonte

- [x] Bug: Espaçamento interno das caixas (boxPadding) não está salvando no banco de dados

- [x] Bug: Lógica de horário não suporta horários que atravessam meia-noite (ex: 08:00 - 02:00)

- [x] Verificar e garantir que configurações de Teste de Impressão sejam aplicadas na impressão de pedidos aceitos

- [ ] Criar variável de template WhatsApp {itens_pedido} com todos os itens do pedido (produtos, complementos, observações)

- [x] Criar variável de template WhatsApp {{itensPedido}} com todos os itens do pedido (produtos, complementos, observações)

- [x] Ajustar variável {{itensPedido}} para não mostrar preço individual dos itens, apenas o total do pedido

- [x] Remover quebra de linha extra entre os itens na variável {{itensPedido}}

- [x] Bug: Horário 8h-2h ainda mostra fechado - corrigido para usar timezone de Brasília

- [x] Bug: Menu público ainda mostra fechado após correção de timezone - corrigido frontend para usar timezone de Brasília

- [x] Bug: Erro de login - Failed query na tabela users (coluna loginMethod adicionada)

- [x] Adicionar opção para alternar entre bordas redondas e linhas tracejadas nos itens do pedido

- [x] Substituir emoji de data (📅) pelo ícone de calendário no preview do recibo

- [x] Adicionar ícone de pagamento ao lado esquerdo do título Pagamento no card de pagamento

- [x] Adicionar ícone de estrela ao lado esquerdo do título Cliente no card de cliente

- [x] Bug: Nome do cliente foi para baixo - corrigir layout inline

- [x] Bug: Ícone de estrela no card de cliente aparecia em linha separada - corrigido usando display flex

- [x] Ajustar card de Cliente para mesmo layout do card de Pagamento: ícone + "Cliente" à esquerda, nome + telefone à direita, sem dois pontos

- [x] Aumentar tamanho do ícone de estrela no card de Cliente para ficar igual ao ícone de pagamento

## Impressão Simultânea em Múltiplas Impressoras (via IP)
- [x] Usar tabela printers existente para cadastrar múltiplas impressoras com IP
- [x] Criar função getActivePrinters para buscar impressoras ativas
- [x] Implementar função printOrderToMultiplePrinters para envio simultâneo
- [x] Modificar fluxo de criar pedido para imprimir em todas as impressoras ativas
- [x] Cadastrar as duas impressoras: 192.168.123.100 e 192.168.68.101
- [ ] Testar impressão simultânea com pedido real

## Integração ESC/POS Multi Printer Network Print Service
- [x] Criar endpoint público para gerar HTML do recibo acessível via URL
- [x] Implementar geração de deep link para o app Multi Printer com fila de impressão
- [x] Usar impressoras já cadastradas no banco (192.168.123.100 e 192.168.68.101)
- [x] Adicionar opção "Múltiplas Impressoras" no menu de impressão dos pedidos
- [ ] Testar impressão simultânea nas duas impressoras via app Multi Printer

- [x] Bug: Impressão Multi Printer não executa automaticamente - corrigido usando printerName (KOT-1, KOT-2) em vez de IP

- [x] Bug: Multi Printer mostra "please set the ip address" - corrigido usando printerIpAddr + printerPort

- [x] Impressão automática ao aceitar pedido - abrir deep link do Multi Printer automaticamente

## Sistema de Separação de Itens por Setor de Impressão
- [x] Adicionar campo printerId na tabela de produtos
- [x] Adicionar campo "Setor de Preparo" no formulário de cadastro de produtos
- [x] Criar página de gerenciamento de impressoras (/impressoras)
- [x] Modificar lógica de impressão para separar itens por setor
- [x] Gerar recibo separado para cada setor com apenas os itens daquele setor
- [x] Endpoint /api/print/multiprinter-sectors para impressão separada por setor

- [x] Bug: Impressão por setor imprime todos os itens em todas as impressoras - corrigido: alterado endpoint para multiprinter-sectors

- [x] Bug: Recibo de setor incompleto - corrigido para usar layout completo igual ao recibo normal (endereço, pagamento, QR code, total, taxa entrega), apenas filtrando itens por setor

- [x] Implementar lógica: itens sem setor (printerId = null) vão para todas as impressoras, itens com setor específico vão apenas para aquela impressora

- [x] Bug: Número do pedido aparece como ## em vez de #P35 no recibo impresso - corrigido removendo # extra do HTML


## Confirmação de Pedido via WhatsApp com Botões
- [x] Adicionar novo status "pending_confirmation" no schema de pedidos
- [x] Criar função sendButtonMessage no módulo UAZAPI para enviar mensagem com botões de resposta rápida
- [x] Modificar fluxo de criação de pedido para usar status "pending_confirmation" inicialmente
- [x] Criar endpoint webhook para receber resposta dos botões do WhatsApp
- [x] Configurar webhook na instância UAZAPI para enviar eventos de mensagens
- [x] Implementar lógica para confirmar pedido quando cliente clica em "Ok, pode fazer"
- [x] Implementar lógica para cancelar pedido quando cliente clica em "Não quero mais"
- [x] Adicionar toggle de configuração na aba WhatsApp para ativar/desativar confirmação
- [ ] Testar fluxo completo de confirmação via WhatsApp (aguardando teste do usuário)


## Configuração Automática do Webhook UAZAPI
- [x] Criar função configureWebhook no módulo UAZAPI para criar/atualizar webhook automaticamente
- [x] Integrar chamada da função ao salvar configurações de WhatsApp com confirmação via botões ativada
- [x] Testar fluxo completo de ativação automática do webhook


## Bug: Pedido não aparece após confirmação via WhatsApp
- [x] Investigar por que pedido #P441 não apareceu na página de pedidos após cliente clicar em "Ok, pode fazer"
- [x] Verificar se webhook está recebendo a resposta do botão
- [x] Corrigir fluxo de confirmação de pedido (campo correto é buttonOrListid)


## Bug: Webhook usando domínio incorreto
- [x] Corrigir URL do webhook de cardapio-admin.manus.space para mindi.manus.space
- [x] Atualizar webhook na UAZAPI para o domínio correto


## Bug: Pedido aparece como Novo sem confirmação do cliente
- [x] Investigar por que pedido está aparecendo como Novo sem aguardar confirmação no WhatsApp
- [x] Corrigir fluxo para usar status pending_confirmation quando confirmação via botões está ativada
- [x] Ajustar página de Pedidos para não mostrar pedidos com status pending_confirmation


## Remover mensagem automática de confirmação
- [x] Remover mensagem "Perfeito! Seu pedido foi confirmado..." enviada após cliente clicar no botão


## Bug: Notificação em tempo real não funciona após confirmação via WhatsApp
- [x] Investigar por que som não toca quando pedido é confirmado
- [x] Investigar por que badge de quantidade não atualiza
- [x] Investigar por que página não atualiza em tempo real
- [x] Adicionar logs de debug para identificar problema de conexão SSE
- [ ] Testar após publicar nova versão


## Remover botão "Não quero mais" do WhatsApp
- [x] Remover o botão "Não quero mais" da mensagem de confirmação, mantendo apenas "Ok, pode fazer"


## Simplificar página de login
- [x] Remover seção lateral "Bem-vindo de volta" e deixar apenas o container de login centralizado


## Ajustar estilo do modal de Avaliações
- [x] Comparar estilos dos modais de Avaliações e Meus Pedidos
- [x] Ajustar o modal de Avaliações para seguir o mesmo padrão visual do modal de Meus Pedidos
- [x] Layout Kanban na página de Pedidos com 4 colunas (Novos, Preparo, Prontos, Completos) seguindo estilo visual da referência
- [x] Restaurar visual original do card de pedido no layout Kanban (header colorido, botões impressora/ver detalhes/aceitar/cancelar)
- [x] Alterar cor de fundo do header do card para cinza fixo (#e3e3e3) apenas no status "completed"
- [x] Ajustar altura dos cards do Kanban na página de Pedidos para igualar à altura dos cards de Estoque
- [x] Padronizar cabeçalhos das páginas Catálogo, Pedidos e Cupons para ficarem iguais ao da página de Estoque
- [ ] BUG: Pedidos feitos no menu público não aparecem na página de Pedidos
- [ ] BUG: Erro "Rate exceeded" ao enviar pedido no menu público
- [x] Implementar acordeão (expandir/minimizar) nas colunas do Kanban para versão mobile
- [x] BUG: Erro "ERRO AO CONECTAR COM AS IMPRESSORAS" ao aceitar pedido
- [x] BUG: Pedidos não são impressos após clicar em Aceitar
- [x] Remover opção "Impressora Térmica (1 impressora)" do dropdown de impressão
- [x] Ajustar espaçamento entre cabeçalho e cards nas páginas Dashboard e Catálogo para ficar igual à página de Pedidos
- [x] Ajustar cards de estatísticas da página de Dashboard para ter o mesmo estilo visual dos cards do Kanban (barra colorida no topo, título uppercase, número grande, ícone no canto)
- [x] Ajustar cards de estatísticas da Dashboard para fundo branco e mesmo sombreamento do card 'Acumulado da semana'
- [x] BUG: Item configurado para KOT-1 está sendo impresso nas duas impressoras ao aceitar pedido

- [x] Alterar placeholders vazios do Kanban para serem informativos (ícone loading em Novos, textos descritivos nas outras colunas)
- [x] Transformar badge da página de Pedidos em card de status de conexão WhatsApp (conectado/desconectado, botões atualizar e desconectar)
- [x] Alterar botão do card de status WhatsApp: quando desconectado mostrar ícone de QR Code com ação "Conectar"
- [x] Criar modal de QR Code do WhatsApp que abre ao clicar em Conectar (com título "Aguardando conexão...", QR Code e instruções)
- [x] Criar modal de QR Code do WhatsApp na página de Pedidos (com título "Aguardando conexão...", QR Code e instruções)
- [x] Remover aba de WhatsApp da página de configurações (funcionalidade movida para Pedidos)
- [x] Restaurar aba de WhatsApp nas configurações, removendo apenas o card de status de conexão (manter notificações, templates e teste)
- [x] Remover mensagem hardcoded "🔔 Você será notificado por aqui em cada atualização." das notificações de WhatsApp (usar apenas o template configurado)
- [x] Ajustar altura dos placeholders vazios do Kanban para ter o mesmo tamanho dos cards de pedido
- [x] Alterar placeholders do Kanban para ter fundo branco e mesma sombra dos cards da dashboard
- [x] Reverter placeholders do Kanban para estilo anterior (com cores de fundo) e alterar os cards das colunas (área cinza) para fundo branco e sombra
- [x] Melhorar card de status WhatsApp: mostrar loading inicial, só mostrar desconectado após confirmação da API
- [x] Alterar cores do card de status WhatsApp: verde quando conectado, vermelho quando desconectado
- [x] Atualizar cards da página de Cardápio para ter bordas coloridas no topo (estilo igual à página de Pedidos)
- [x] Atualizar cards da página de Cupons para ter bordas coloridas no topo (estilo igual aos cards de métricas da Dashboard)
- [x] Atualizar cards da página de Estoque para ter bordas coloridas no topo (estilo igual aos cards de métricas da Dashboard)
- [x] Adicionar indicador de loading nos botões de ação dos cards de pedido (Aceitar, Pronto, Finalizar)
- [x] Corrigir link do WhatsApp no modal de detalhes do pedido para incluir código do país (55)
- [x] Remover texto "cerca de" dos cards do Kanban na página de Pedidos
- [x] Mover menu 'Teste Impressão' do sidebar para a página de Configurações como nova aba
- [x] Ajustar layout da aba Teste Impressão para seguir o mesmo padrão visual da aba WhatsApp
- [x] Corrigir layout da aba Teste na versão mobile para ficar igual às outras abas (Layout, Fontes)
- [x] Corrigir função de impressão térmica Android na aba de Teste Impressão (comparar com página de Pedidos)
- [x] Sincronizar estilos do recibo de teste com o recibo de pedidos reais (mesma fonte Arial, mesmos pesos, mesmos tamanhos, mesmos estilos de caixas)
- [x] Padronizar recibo de teste para usar EXATAMENTE o mesmo template do recibo real (mesma função generateReceiptHTML)
- [x] Corrigir formatação do número de telefone no recibo de impressão para o formato (88) 9 9929-0000
- [x] Corrigir recibo para mostrar troco solicitado quando pagamento for em dinheiro (formato: Dinheiro | Troco para R$X)
- [x] Limitar campo de dados do usuário no modal do menu público para máximo 15 caracteres
- [x] Implementar contador de caracteres no campo de nome do checkout (X/15)
- [x] Alterar contador de caracteres para mostrar "X restantes" em vez de "X/15"
- [x] Remover caixa com bordas redondas da tela de login na versão mobile
- [x] Corrigir exibição do valor do troco no recibo quando pagamento é em dinheiro
- [x] Alterar exibição do troco no recibo para linha separada com ícone (i), linhas tracejadas e texto Obs: Troco para R$ X
- [x] Substituir ícone (i) circular pelo ícone SVG fornecido no recibo de impressão
- [x] Substituir ícone de som pelo estilo amarelo com ondas sonoras
- [ ] Criar componente de som com ícone amarelo + toggle switch dentro de uma caixa
- [x] Substituir botão de som por componente com ícone amarelo + toggle switch em caixa arredondada
- [x] Ajustar componente de som: reduzir ícone, remover sombra, usar cor cinza claro
- [x] Ajustar toggle do som para usar o mesmo estilo do toggle de abrir/fechar restaurante
- [x] Alterar toggle de som: cor verde quando ativado e ícone de som com 3 ondas de volume
- [x] Alterar ícone de som para ter apenas 2 ondas igual à imagem de referência
- [x] Remover animação de pulso do card de som
- [x] Alterar cor do ícone de som para verde quando ativado e vermelho quando desativado
- [x] Implementar som de teste breve quando o usuário ativar o áudio
- [x] BUG: Som de teste não toca na primeira ativação do toggle de áudio (só toca a partir da segunda vez)
- [x] BUG: establishment.get retorna undefined para novos utilizadores sem estabelecimento
- [x] Adicionar borda vermelha arredondada nos cards de resultados de busca do menu público
- [x] Alterar limite de itens na pré-visualização de busca de 6 para 10
- [x] Ajustar tela de login desktop para ficar igual à versão mobile (sem container redondo)
- [x] Remover checkbox de termos de uso e política de privacidade da página de criar conta
- [x] Adicionar logo do sistema nas páginas de login e criação de conta
- [x] BUG: Logo e header sobem ao navegar para página de criar conta (devem ficar fixos)
- [x] Adicionar logo na página de Esqueci Senha
- [x] Adicionar nome "Mindi" abaixo do logo nas páginas de autenticação
- [x] Alterar campo de senha no modal de Cartão Fidelidade para 4 caixas separadas (estilo PIN)
- [x] Reverter campo de senha do Cartão Fidelidade para formato original (campo único)
- [x] Mover nome Mindi para ao lado do logo nas páginas de autenticação
- [x] Implementar animação de entrada suave para o logo e nome Mindi nas páginas de autenticação (removida a pedido do usuário)
- [x] Adicionar ícone de X para fechar as notificações toast
- [x] Permitir que novos utilizadores vejam Dashboard e Pedidos normalmente mesmo sem estabelecimento configurado
- [x] BUG: Card de WhatsApp com layout quebrado na página de Pedidos para novos utilizadores
- [x] Remover botão de atualizar status do card de WhatsApp (manter apenas desconectar)
- [x] Remover ícone de rede (WiFi) do card de WhatsApp
- [ ] Remover largura fixa do card de WhatsApp (voltar ao tamanho automático)
- [x] Remover largura fixa do card de WhatsApp (voltar ao tamanho automático)
- [x] Configurar templates de WhatsApp padrão para novos utilizadores
- [x] Ativar confirmação via botões por padrão
- [x] Ativar todas as notificações de status por padrão
- [x] Criar categoria e item de teste padrão para novos utilizadores ao criar conta
- [x] Corrigir localStorage de pedidos para isolar por establishmentId
- [x] Remover sombra da barra de menu lateral
- [x] Criar degradê vertical para sidebar - claro no topo, escuro embaixo
- [x] Aplicar degradê do sidebar ao background da página Dashboard
- [x] Remover degradê do sidebar e página principal
- [x] Implementar fluxo de onboarding após criação de conta
- [x] Badge de sucesso "Conta criada com sucesso"
- [x] Formulário de cadastro do restaurante (nome, link, whatsapp, instagram, área)
- [x] Multi-select de objetivos com a plataforma
- [x] Campo "Como conheceu a plataforma"
- [x] Campos condicionais para "Outros"
- [x] Redirecionar para dashboard após finalizar onboarding
- [x] Criar layout compartilhado para telas de autenticação (2 seções)
- [x] Redesenhar tela de Login com novo layout
- [x] Redesenhar tela de Criar Conta com novo layout
- [x] Redesenhar tela de Esqueci Senha com novo layout
- [x] Ajustar estilo dos campos de email e senha conforme referência
- [x] Ajustar posicionamento do conteúdo no lado esquerdo da tela de login
- [x] Dividir onboarding em 2 etapas com indicador de progresso
- [x] Etapa 1: nome, link público, WhatsApp, Instagram, tipo de entrega
- [x] Etapa 2: objetivos com a plataforma, como conheceu
- [x] Mover onboarding para usar AuthLayout com layout de 2 seções
- [x] Colocar campos WhatsApp e Instagram lado a lado no onboarding
- [ ] Corrigir layout do onboarding para igualar ao login

## Correção Layout Onboarding
- [x] Corrigir layout do onboarding para igualar ao login (h-14 nos inputs, pl-12, text-base, p-8 no container, mb-8 no header)
- [x] Ocultar card "Conta criada com sucesso" na segunda etapa do onboarding (Objetivos)
- [x] Remover opção "Outros" da pergunta "Como você conheceu nossa plataforma?" no onboarding

## Nova Etapa Onboarding - Configurações de Atendimento
- [x] Criar Step 2 - Configurações de Atendimento (entre Dados do estabelecimento e Objetivos)
- [x] Campo de endereço do estabelecimento
- [x] Campo de horário de atendimento (padrão 18:00 às 23:00)
- [x] Seleção múltipla de formas de pagamento (Pix, Dinheiro, Cartão)
- [x] Campos de tempo de entrega (de X min até Y min)
- [x] Toggle de pedido mínimo com campo de valor
- [x] Seleção de taxa de entrega (Grátis, Fixa, Por bairros)
- [x] Mensagem informativa quando selecionar "Por bairros"

## Salvar Dados do Onboarding Step 2 no Banco
- [x] Atualizar endpoint establishment.create para aceitar novos campos (address, openingTime, closingTime, acceptsPix, acceptsCash, acceptsCard, deliveryTimeMin, deliveryTimeMax, minimumOrderEnabled, minimumOrderValue, deliveryFeeType, deliveryFeeFixed, allowsDelivery, allowsPickup)
- [x] Atualizar Onboarding para enviar os novos dados na mutation
- [x] Criar horários de funcionamento automaticamente ao criar estabelecimento
- [x] Verificar que página de configurações já carrega os dados salvos (useEffect já implementado)
- [x] Ajustar botões de status do WhatsApp (Conectado/Desconectado) para terem o mesmo tamanho do card Verificando na página de pedidos

## Etapa de Seleção de Planos no Onboarding
- [x] Criar Step 4 - Seleção de Planos (última etapa do onboarding)
- [x] Adicionar 3 cards compactos: Gratuito (15 dias teste), Lite, Pro
- [x] Destacar principais features de cada plano
- [x] Cards um abaixo do outro (não grandes)
- [x] Ajustar botões de status do WhatsApp (Conectado/Desconectado) para terem o mesmo tamanho do card Verificando na página de pedidos
- [x] Corrigir card Preview do Perfil Público na página de configurações para ficar igual ao menu público (adicionar badges de tempo de entrega, pedido mínimo, tipo de entrega)
- [x] Padronizar 100% badges do Preview do Perfil Público no admin (cores, ícones, border-radius, estilos) para serem cópia fiel do menu público
- [x] Ajuste fino pixel perfect do Preview do Perfil Público: altura/padding do container, alinhamento vertical dos pills, espaçamento entre nome/endereço/status
- [x] Adicionar imagem de background na seção vermelha da tela de login com sobreposição vermelha de 40% de transparência
- [x] Remover ícones decorativos (marca d'água) da seção vermelha do AuthLayout
- [x] Corrigir responsividade do lado direito do onboarding para evitar barra de rolagem horizontal em telas menores


## Responsividade Completa do Onboarding
- [x] Container principal com height: 100vh e overflow: hidden
- [x] Área do formulário com overflow-y: auto e scroll interno
- [x] Remover qualquer scroll lateral/horizontal da página
- [x] Reduzir espaçamentos verticais em telas menores
- [x] Garantir que stepper, badge e botão fiquem sempre acessíveis
- [x] Layout funciona corretamente em notebooks menores e resoluções reduzidas


## Correção Scroll Interno Onboarding
- [x] Garantir que o scroll interno funcione corretamente no container do formulário
- [x] Botão Continuar deve estar sempre acessível (via scroll ou fixo)
- [x] Testar em telas com altura reduzida (notebooks menores)
- [x] Reduzir tamanhos de elementos para caber em telas menores (inputs h-10, badges menores, stepper compacto)
- [x] Usar 100dvh para altura dinâmica da viewport


## Responsividade Steps 2, 3 e 4 do Onboarding
- [x] Aplicar mesmas correções de responsividade do Step 1 para Step 2 (Atendimento)
- [x] Aplicar mesmas correções de responsividade do Step 1 para Step 3 (Objetivos)
- [x] Aplicar mesmas correções de responsividade do Step 1 para Step 4 (Plano)
- [x] Testar todos os steps em telas menores


## Consistência Layout Step 4
- [x] Ajustar Step 4 para ter título e descrição na mesma posição das etapas anteriores


## Consistência Visual Onboarding x Login
- [x] Copiar exatamente o estilo da seção lateral esquerda da tela de login para o onboarding
- [x] Incluir a mesma imagem/foto que aparece na tela de login
- [x] Manter mesma posição dos textos e elementos


## Validação Onboarding
- [x] Step 1: Botão Continuar só habilitado quando todos os campos estiverem preenchidos
- [x] Step 1: Instagram com @ automático no início
- [x] Step 2: Validação de campos obrigatórios
- [x] Step 3: Validação de campos obrigatórios
- [x] Step 4: Validação de campos obrigatórios


## Correção Link WhatsApp
- [x] Adicionar código do país 55 no link do WhatsApp no menu público
- [x] Adicionar código do país 55 no link do WhatsApp na página de Configurações
- [x] Adicionar código do país 55 no link do WhatsApp na página de Pedidos


## Verificação Disponibilidade Slug
- [x] Criar endpoint para verificar se o slug está disponível (já existia)
- [x] Adicionar ícone de check verde quando disponível
- [x] Adicionar ícone de X vermelho quando indisponível
- [x] Verificação em tempo real enquanto o usuário digita (debounce 500ms)
- [x] Mensagem de feedback abaixo do campo
- [x] Botão Continuar só habilitado quando slug disponível


## Validação Instagram Obrigatório
- [x] Adicionar campo Instagram como obrigatório na validação do Step 1


## Responsividade Onboarding Telas Grandes v2
- [x] Container do formulário com max-width responsivo e centralizado (xl:max-w-lg, 2xl:max-w-xl)
- [x] Espaçamentos laterais, superior e inferior máximos (xl:p-8, 2xl:p-10, py-4/6/8)
- [x] Tipografia responsiva com breakpoints xl/2xl (títulos até 2xl:text-3xl)
- [x] Padding e gaps proporcionais em telas grandes (space-y-5/6)
- [x] Layout equilibrado que funciona em todas as larguras de tela
- [x] StepIndicator maior em telas grandes (2xl:w-8 h-8)
- [x] Inputs maiores em telas grandes (xl:h-13, 2xl:h-14)


## Validação WhatsApp Obrigatório
- [x] Adicionar campo WhatsApp como obrigatório na validação do Step 1 (mínimo 10 dígitos)


## Link Voltar no Step 1
- [x] Adicionar link "Voltar ao login" com ícone de seta abaixo do botão Continuar no Step 1


## Navegação Suave Voltar ao Login
- [x] Alterar link "Voltar ao login" para usar Link do wouter em vez de tag <a> para evitar reload da página


## Corrigir Reload Voltar ao Login
- [x] Investigar por que a página ainda recarrega ao clicar em Voltar ao login
- [x] Usar useLocation do wouter para navegação programática via setLocation


## Reorganizar Menu Lateral
- [x] Criar seção OPERAÇÕES com Dashboard
- [x] Criar seção GESTÃO com Pedidos, Cardápio, Cupons, Estoque
- [x] Adicionar títulos de seção no menu lateral
- [x] Botão Voltar como link de texto abaixo do Continuar em todas as etapas do onboarding (Steps 2, 3 e 4)
- [x] Ajustar espaçamentos das seções do menu lateral (OPERAÇÕES, GESTÃO) para melhor hierarquia visual

## Página de Categorias
- [x] Adicionar item "Categorias" no menu lateral (seção GESTÃO, abaixo de Cardápio)
- [x] Criar página /categorias com visual similar ao modo reordenar
- [x] Implementar funcionalidade de criar nova categoria
- [x] Implementar funcionalidade de editar categoria (inline)
- [x] Implementar funcionalidade de excluir categoria
- [x] Implementar drag and drop para reordenar categorias
- [x] Remover botão "Nova Categoria" da página Catálogo
- [x] Manter apenas botões "Novo Item" e "Reordenar" na página Catálogo
- [ ] Remover botão Reordenar da página Catálogo (funcionalidade movida para página Categorias)
- [ ] Adicionar botão Reordenar na página de Categorias
- [x] Adicionar seção SISTEMA no menu lateral
- [x] Criar página de Configurações com abas: Estabelecimento, Atendimento, Impressoras, Notificações, WhatsApp, Teste Impressão
- [x] Remover aba Teste da seção WhatsApp nas configurações
- [x] Remover seção Validade da Nota do card de Nota do Restaurante
- [x] Remover sugestões rápidas específicas do card de Nota do Restaurante
- [x] Remover estilos de balão: Pêssego, Menta, Roxo, Doce, Real, Pôr do Sol
- [x] Remover card de preview do balão e mostrar preview temporário sobre a cor selecionada
- [x] Corrigir tempo de exibição (5s) e quebra de linha no preview do balão
- [x] Reorganizar aba Estabelecimento: Preview (60%) ao lado do Endereço (40%) com campos verticais
- [x] Remover validade de 24h da nota - nota fica permanente até ser removida manualmente
- [x] Reorganizar campos do Endereço: Número/Bairro/Cidade/UF juntos, Complemento/CEP juntos
- [x] Ajustar altura do card de Endereço para igualar ao Preview do Perfil Público
- [x] Alterar estilo das abas em Configurações para texto simples com aba ativa em azul
- [x] Remover sugestão rápida 'Promoção válida hoje!' do card de Nota
- [x] Remover aba Notificações da página de Configurações
- [x] Ajustar espaçamento das abas na página de Configurações para ficar na mesma altura das demais páginas
- [x] Implementar badge de status (Aberto/Fechado) abaixo do nome do restaurante no header da sidebar
- [x] Corrigir bug de vazamento de áudio ao recarregar página com som desativado
- [x] Corrigir som de notificação não tocando na versão mobile
- [x] Corrigir som de notificação não tocando em dispositivos Android
- [x] Adicionar vibração como feedback adicional em dispositivos Android
- [x] Corrigir toast e som de notificação não funcionando no Android (logs de debug adicionados)
- [x] Corrigir notificação de novo pedido para aparecer em todas as páginas do dashboard, não apenas na página de Pedidos
- [x] Ajustar modal de detalhes do pedido: remover botão WhatsApp do rodapé, estilizar botão Mensagem com verde e ícone WhatsApp, mover Imprimir para linha do título, remover X de fechar
- [x] Adicionar ícone do WhatsApp no botão de mensagem e ícone de telefone no botão de ligar no modal de detalhes do pedido
- [ ] Corrigir notificação de novo pedido não aparecendo na versão mobile fora da página de pedidos
- [x] Corrigir persistência do estado do toggle de som após refresh da página
- [ ] Corrigir erro intermitente 'The string did not match the expected pattern' no fluxo de login
- [ ] Corrigir erro intermitente 'The string did not match the expected pattern' no login
- [ ] Corrigir erro intermitente 'The string did not match the expected pattern' no login
- [x] Corrigir erro intermitente 'The string did not match the expected pattern' no login (Safari/iOS)
- [x] Adicionar estrela ao lado da nota de avaliação no menu público
- [x] Mostrar quantidade de avaliações apenas na versão desktop (ocultar no mobile)
- [x] Mostrar texto completo "(X avaliações)" na versão desktop, manter apenas número no mobile
- [x] Mostrar quantidade de avaliações no mobile apenas com número ex: (5)
- [x] Reorganizar campos WhatsApp e Instagram na mesma linha que Link do Cardápio em Configurações básicas
- [x] Remover opção de boleto do card de Formas de pagamento
- [x] Mover card de Cartão Fidelidade para a aba de Estabelecimento
- [x] Reorganizar campos do Cartão Fidelidade (tipo cupom, valor desconto, valor mínimo) na mesma linha dos carimbos
- [x] Mover campo de Carimbos necessários para a mesma linha do toggle Ativar Cartão Fidelidade
- [x] Adicionar botão "Sugestões" na mesma linha do campo de nota do restaurante que exibe as 4 sugestões ao clicar
- [x] Ajustar layout do Cartão Fidelidade - campos Tipo de cupom, Desconto e Valor mínimo na mesma linha
- [x] Corrigir layout do Cartão Fidelidade - garantir 3 campos na mesma linha em desktop sem quebra
- [x] Reorganizar Cartão Fidelidade - todos os 4 campos dentro do card Ativar (carimbos, tipo cupom, desconto, valor mínimo)
- [x] Colocar todos os 4 campos do Cartão Fidelidade na mesma linha após o toggle de ativação
- [x] Alterar texto do botão de sugestões para "Ver sugestões de notas"
- [x] Alterar botão "Ver sugestões de notas" para cor vermelha e adicionar ícone de balão
- [x] Mover tempo de entrega e pedido mínimo para card de Tipo de entrega e renomear para "Informações e entrega"
- [x] Simplificar textos descritivos de tempo de entrega e pedido mínimo
- [x] Reorganizar card Informações e entrega - colocar tempo de entrega e pedido mínimo lado a lado com seleção de entrega/retirada
- [x] Reorganizar card Formas de pagamento com opções menores e retangulares (checkbox à esquerda, texto à direita)
- [x] Mover card Notificações SMS para ficar ao lado do card Formas de pagamento
- [x] Colocar opções Dinheiro, Cartão e Pix na mesma linha no card de Formas de pagamento
- [x] Redesenhar card Informações e entrega com formato compacto (checkbox à esquerda, texto à direita)
- [x] Colocar Pedido mínimo abaixo de Tempo de entrega no card Informações e entrega
- [x] Mover card Taxa de entrega para ao lado do card Informações e entrega
- [x] Deixar card Taxa de entrega em formato compacto e retangular
- [x] Remover card "Como funciona a impressão" da aba Impressoras em Configurações

## Remoção do Card Configurações de Impressão
- [x] Remover card "Configurações de Impressão" da aba Impressoras (manter apenas "Impressoras Cadastradas")
- [x] Remover card "Texto Personalizado" da aba Teste Impressão em Configurações

## Reorganização da Aba Impressoras
- [x] Mover card "Impressoras Cadastradas" da aba Impressoras para aba Teste Impressão
- [x] Posicionar card acima de "Configurações de Layout"
- [x] Remover aba Impressoras (ficará vazia)

## Ajustes no Modal de Impressora
- [x] Remover botão "Testar Conexão" do modal de Editar Impressora
- [x] Colocar campo Porta na mesma linha do campo Endereço IP

## Renomear Aba de Impressão
- [x] Renomear aba "Teste Impressão" para "Impressora e Teste"

<<<<<<< Updated upstream
## Botão de Favorito nas Opções de Impressão
- [x] Adicionar campo de preferência de impressão padrão no banco de dados (normal ou android)
- [x] Adicionar botão de favorito (coração vermelho vazado/preenchido) ao lado de cada opção no menu Imprimir
- [x] Implementar lógica para apenas uma opção ser favorita por vez
- [x] Salvar preferência do usuário no banco de dados
- [ ] Usar opção favorita automaticamente ao aceitar pedidos

## Ajuste no Ícone de Favorito
- [x] Trocar ícone de coração por estrela no menu de impressão favorita

## Correção do Favorito de Impressão
- [ ] Corrigir comportamento de seleção exclusiva do favorito (clicar na estrela não está mudando)

## Correção da Impressão ao Aceitar Pedido
- [x] Corrigir lógica de impressão ao aceitar pedido - usar método favorito correto (normal ou android)
- [x] Quando favorito é "normal", abrir tela de impressão do navegador
- [x] Quando favorito é "android", mostrar mensagem para usar app Android

## Layout de Impressão Normal
- [x] Atualizar layout da impressão normal para ficar idêntico ao modelo Android
- [x] Adicionar badge RETIRADA/ENTREGA ao lado do número do pedido
- [x] Usar cards arredondados para Retirada, Pagamento e Cliente
- [x] Manter mesma estrutura visual: cabeçalho, itens, subtotal, total destacado, cards de info

## Impressão Normal em PDF
- [x] Usar endpoint existente /api/print/receipt/:orderId (HTML otimizado)
- [x] Ajustar função handlePrintOrderDirect para abrir recibo em nova aba
- [x] Garantir que funcione em celular (abrir em nova aba para imprimir/salvar PDF)

## Impressão Normal com Janela de Impressão Automática
- [x] Modificar endpoint de recibo para incluir window.print() automático ao carregar
- [x] Garantir que a janela de impressão abra automaticamente no celular e desktop

## Remoção do Card de Avaliação Gratuita
- [x] Remover card "Avaliação gratuita" da barra lateral

## Correção de Erro useOrdersSSE
- [x] Corrigir erro TypeError: Cannot read properties of undefined (reading 'substring') na linha 17

## Problema de Notificações SSE
- [ ] Investigar por que notificações de novos pedidos não estão sendo recebidas
- [ ] Verificar se o novo domínio v2.mindi.com.br está afetando a conexão SSE


## Correção da Lógica de Status Aberto/Fechado
- [x] Corrigir lógica para usar apenas horários configurados (sem depender do toggle isOpen)
- [x] Se estiver dentro do horário de funcionamento configurado, mostrar como Aberto
- [x] O campo manuallyClosed deve ser usado apenas para fechamento manual temporário

## Bottom Sheet para Categorias Mobile
- [x] Implementar modal estilo bottom sheet na página de categorias para versão mobile
- [x] Abrir bottom sheet ao clicar em categoria para editar
- [x] Abrir bottom sheet ao adicionar nova categoria

## Correção de Formatação de Preço
- [x] Corrigir problema onde preço 22,00 digitado no catálogo aparece como 2,200.00 no menu público

## Correção do Campo de Preço dos Complementos
- [x] Campo de preço dos complementos não aceita digitação
- [x] Erro ao salvar complementos com preço no formato brasileiro (0,00)

## Correção do Estado do Formulário ao Trocar de Aba
- [x] Estado do formulário de edição é perdido ao trocar de aba do navegador e voltar
=======
## Drag and Drop para Grupos de Opções
- [ ] Implementar arrastar e soltar para reordenar grupos de opções na tela Editar Item
- [ ] Feedback visual ao arrastar (sombra, opacity, placeholder)
- [ ] Salvar nova ordem no backend automaticamente
>>>>>>> Stashed changes

## Drag and Drop para Grupos de Opções
- [x] Implementar drag and drop para reordenar grupos de complementos na tela de Editar Item
- [x] Feedback visual ao arrastar (sombra, opacity, placeholder)
- [x] Salvar nova ordem no backend
- [x] Bug: Preços dos complementos multiplicam por 100 ao salvar (problema na conversão de formato)
- [x] Desabilitar menu Estoque na sidebar com badge 'Breve' e sem navegação
- [x] Desabilitar menu Planos no dropdown do usuário com badge 'Breve' e sem navegação
- [x] Alterar cor das abas de navegação em Configurações de azul escuro para vermelho (cor primária)
- [x] Implementar novo modelo de rodapé no menu público com gradiente e botão 'Experimente grátis'
- [x] Bug: Complementos não aparecem na impressão do pedido
- [x] Centralizar recibo na impressão normal
- [x] Adicionar tarja preta no TOTAL e badge ENTREGA na impressão normal
- [x] Forçar cores de fundo (badges pretos) na impressão normal
- [ ] Bug: Imagens dos produtos não estão carregando no admin e menu público
- [ ] Migrar imagens dos produtos do CloudFront antigo para o novo storage do Manus
- [ ] Bug: Upload de novas imagens não está funcionando
- [x] Adicionar link WhatsApp no rodapé do menu público (Bigteck e Experimente grátis) - 5588999290000
- [x] Migrar sistema de storage para S3 próprio do usuário
- [x] Mostrar quantidade de itens ao lado do nome da categoria na página /categorias

## Toggle e Exclusão de Categorias
- [x] Adicionar campo isActive no schema de categorias
- [x] Remover menu de 3 pontinhos das categorias
- [x] Adicionar toggle ativar/pausar categoria
- [x] Adicionar ícone de lixeira para excluir categoria
- [x] Implementar regra: categoria pausada não aparece no menu público
- [x] Implementar regra: categoria ativa sem itens ativos não aparece no menu público
- [x] Implementar regra: categoria ativa com pelo menos 1 item ativo aparece no menu público
- [x] Exibir confirmação ao excluir categoria
- [x] Toggle de categoria deve mostrar desativado quando todos os itens estão pausados

## Sistema de Complementos Globais
- [x] Atualizar schema: adicionar campos status, priceMode na tabela complements
- [ ] Criar tabela de vínculo produto-complemento (product_complements)
- [x] Criar endpoints CRUD para complementos globais
- [x] Criar página de gestão de Complementos no admin
- [ ] Implementar toggle ativo/pausado para complementos
- [ ] Implementar toggle preço normal/grátis para complementos
- [ ] Atualizar vinculação produto-complemento para usar IDs
- [x] Atualizar menu público para respeitar status e priceMode dos complementos
- [ ] Migrar dados existentes de complementos para o novo modelo
- [ ] Corrigir página de Complementos para mostrar itens de complemento, não produtos
- [x] Adicionar edição de preço na página de Complementos Globais

## Controle de Quantidade por Complemento
- [ ] Atualizar schema do banco para quantidade de complemento no pedido
- [ ] Atualizar UI do modal de detalhes do item com controle de quantidade (+/-)
- [x] Atualizar cálculo de preço dos complementos (preço × quantidade)
- [ ] Atualizar exibição dos complementos nos detalhes do pedido (admin)
- [x] Atualizar impressão do pedido com quantidade (ex: 3x Bacon R$ 16,50)
- [x] Corrigir exibição de quantidade de complemento no Modal Sua Sacola
- [x] Corrigir exibição de quantidade de complemento no Modal Resumo do Pedido
- [x] Corrigir exibição de quantidade de complemento no Modal Confirmar Endereço
- [x] Corrigir exibição de quantidade de complemento na Impressão
- [x] Corrigir exibição de quantidade de complemento na Notificação WhatsApp

## Bugs de Impressão
- [x] Bug: Quantidade de complementos não aparece na impressão normal (ex: "+ 4x Dose de Vodka Orloff")
- [x] Bug: Impressão múltiplas impressoras está saindo em branco (era problema de URL dev vs produção)

## Limpeza de Banco de Dados
- [x] Excluir tabela business_hours duplicada (usar apenas businessHours)

## Bug Toggle Status Restaurante
- [x] Corrigir toggle de status no perfil para refletir estado real (verde=aberto, vermelho=fechado baseado nos horários)

## Bug Acumulado da Semana
- [x] Corrigir erro de timezone no cálculo do card Acumulado da Semana (pedidos sendo atribuídos ao dia errado)

## Disponibilidade de Complementos por Dias/Horários
- [x] Atualizar schema do banco de dados para armazenar disponibilidade de complementos
- [x] Implementar lógica de validação de disponibilidade no backend
- [x] Criar UI de configuração de disponibilidade no admin (dropdown)
- [x] Filtrar complementos indisponíveis no menu público
- [x] Validar disponibilidade antes de adicionar ao carrinho

## Ajuste de Layout - Complementos
- [x] Colocar nome, preço e "Usado em X produtos" na mesma linha

## Opção "Consumir no local"
- [x] Atualizar schema do banco para suportar deliveryType 'dine_in'
- [x] Adicionar opção "Consumir no local" na UI do menu público
- [x] Atualizar lógica de fluxo para pular endereço quando dine_in
- [x] Atualizar exibição em sacola, resumo, admin, impressão e notificações

## Configuração "Consumir no local" por Estabelecimento
- [x] Adicionar campo dineInEnabled no schema do estabelecimento
- [x] Adicionar toggle no card de Informações e Entrega nas configurações
- [x] Filtrar opção no menu público baseado na configuração

## Bug Hooks PublicMenu
- [x] Corrigir erro "Rendered more hooks than during the previous render" - mover useEffect para antes dos early returns

## Remover Taxa de Entrega dos Modais
- [x] Remover taxa de entrega do modal "Sua Sacola"
- [x] Remover taxa de entrega do modal "Resumo do Pedido"

## Bug Taxa de Entrega nos Modais Seguintes
- [x] Verificar e corrigir exibição da taxa de entrega nos modais após selecionar "Entrega"

## Bug Sidebar Detalhes do Pedido - Consumo no local
- [x] Remover "Taxa de Entrega" do container "Itens do Pedido" quando for consumo no local
- [x] Alterar título "Entrega e Pagamento" para "Consumo no local e Pagamento" quando for dine_in

## Bug Taxa de Entrega no Modal Sua Sacola
- [x] Remover completamente a taxa de entrega do modal Sua Sacola (mesmo com taxa fixa)

## Ajuste Badge Impressão
- [x] Alterar badge de "CONSUMO LOCAL" para "CONSUMO" no modelo de impressão normal
- [x] Verificar e ajustar modelo de múltiplas impressoras para usar "CONSUMO"

## Tooltip nas Estrelas de Impressão
- [x] Adicionar tooltip informativo nas estrelas de favoritar das opções de impressão (Impressão Normal e Múltiplas Impressoras)

## Correção Texto Tipo Pedido na Impressão
- [x] Corrigir texto de "Retirada: Cliente irá retirar no estabelecimento" para "Consumo: Cliente irá consumir no local" quando tipo é dine_in
- [x] Verificar e corrigir no modelo de múltiplas impressoras Android (não possui esse campo, usa apenas badge)

## Mensagem Informativa Consumir no Local
- [x] Adicionar mensagem de aviso quando usuário selecionar "Consumir no local" no menu público

## Link WhatsApp na Mensagem de Consumo Local
- [x] Adicionar link clicável no texto "WhatsApp" para abrir conversa com número do restaurante

## Dropdown Card Complementos
- [x] Fazer dropdown abrir ao clicar em qualquer parte do card de complemento

## Bug Fix - Dropdown Card Complementos
- [x] Corrigir dropdown que não abre ao clicar no card de complemento

## Dropdown Único Complementos
- [x] Fechar dropdown anterior ao abrir outro card de complemento


## Integração iFood via Webhook
- [x] Configurar credenciais iFood como variáveis de ambiente
- [x] Implementar autenticação OAuth2 com iFood (obter e renovar tokens)
- [x] Criar endpoint de Webhook para receber eventos do iFood
- [x] Atualizar schema do banco para suportar pedidos externos (source, externalId, etc)
- [x] Implementar processamento de pedidos do iFood (converter para formato interno)
- [x] Implementar envio de acknowledgment para eventos recebidos
- [x] Implementar sincronização de status (confirmar, despachar, cancelar)
- [x] Adicionar badge visual "iFood" nos cards de pedidos
- [ ] Adicionar filtro por origem do pedido na página de Pedidos
- [ ] Testar integração com pedidos de teste do iFood

## Aba de Integrações nas Configurações
- [x] Criar tabela no banco para armazenar credenciais de integração por estabelecimento
- [x] Criar endpoints tRPC para gerenciar integrações (salvar, buscar, testar conexão)
- [x] Criar página de Integrações nas Configurações com formulário para iFood
- [x] Atualizar lógica do webhook para usar credenciais por estabelecimento
- [x] Adicionar toggle para ativar/desativar integração iFood

## Fluxo OAuth Distribuído iFood (Simplificado para Cliente)
- [x] Atualizar backend com endpoints para fluxo OAuth distribuído (getUserCode, exchangeAuthCode)
- [x] Atualizar tabela ifoodConfig para armazenar tokens OAuth por estabelecimento
- [x] Remover campos Client ID e Client Secret da tela de Integrações
- [x] Adicionar botão "Conectar iFood" que inicia o fluxo OAuth
- [x] Adicionar campo para colar código de autorização do Partner Portal
- [x] Implementar renovação automática de tokens (refresh token)
- [x] Mostrar status de conexão (Conectado/Desconectado) na tela

## Som Específico para Pedidos iFood
- [x] Copiar arquivo de som do iFood para o projeto (client/public)
- [x] Atualizar lógica de notificação para tocar som diferente quando pedido for do iFood

## Bug Fix - Erro Grant Type iFood
- [ ] Corrigir erro "Grant type not authorized for client" na integração iFood


## Modelo Centralizado iFood (Apenas Merchant ID)
- [x] Simplificar tela de Integrações para pedir apenas Merchant ID
- [x] Remover fluxo OAuth distribuído (não suporta webhook)
- [x] Usar credenciais globais do sistema para autenticação

## Validação do Merchant ID iFood
- [x] Implementar função de validação do Merchant ID com a API do iFood
- [x] Validar Merchant ID antes de salvar e marcar como conectado
- [x] Mostrar mensagem de erro se Merchant ID for inválido
- [x] Mostrar feedback de carregamento durante validação

## Correção Som de Notificação Pedidos iFood
- [x] Identificar onde o som é tocado para pedidos normais
- [x] Adicionar campo source ao objeto SSE para identificar origem do pedido
- [x] Garantir que o source seja enviado em createPublicOrder e confirmOrderByNumber
- [x] Implementar diferenciação de som para pedidos iFood vs interno

## Remoção Card Outras Integrações
- [x] Remover card "Outras Integrações" da aba Integrações em Configurações

## Bug: Som do iFood não está tocando
- [x] Investigar por que o som específico do iFood não está sendo tocado
- [x] Verificar se o campo source está sendo enviado corretamente via SSE
- [x] Corrigir o problema identificado

## Alteração Rodapé Impressões
- [x] Alterar "Pedido realizado via Cardapio Admin manus.space" para "Pedido realizado via v2.mindi.com.br"
- [x] Aplicar nos dois modelos: impressão normal e Android

## Bug: Webhook iFood processa pedidos de merchants desconectados
- [x] Verificar se o merchant está conectado antes de processar pedido no webhook
- [x] Ignorar pedidos de merchants que não estão conectados no sistema

## Bug: Faturamento Hoje mostrando valores de ontem
- [x] Investigar o filtro de data no cálculo do faturamento
- [x] Corrigir para mostrar apenas pedidos do dia atual (timezone Brasil)

## Bug: Notificação automática com Confirmação via Botões desativada
- [x] Quando desativado, enviar template NOVO PEDIDO sem texto "Clique para confirmar"
- [x] Remover botão "Sim, confirmar pedido" quando confirmação está desativada

## Bug: Taxa de entrega aplicada em pedidos de retirada (pickup)
- [x] Corrigir cálculo da taxa de entrega para zerar quando deliveryType é pickup ou dine_in
- [x] Verificar todos os locais onde deliveryFee é calculado no PublicMenu.tsx

## Opção Retirar no Local no Modal de Bairro
- [x] Adicionar opção fixa "Retirar no local" no topo do modal de seleção de bairro
- [x] Destacar visualmente a opção (cor verde, texto "Grátis")
- [x] Ao selecionar, definir deliveryType como pickup automaticamente
- [x] Zerar taxa de entrega ao selecionar retirada

## Opção Consumir no Local no Modal de Bairro
- [x] Adicionar opção "Consumir no local" no modal de seleção de bairro
- [x] Destacar visualmente similar à opção de retirada (azul)
- [x] Ao selecionar, definir deliveryType como dine_in automaticamente

## Layout Opções Retirar/Consumir no Modal de Bairro
- [x] Colocar opções lado a lado no desktop (md:flex-row)
- [x] Reduzir altura em 30% (py-2.5 em vez de py-4)
- [x] Manter empilhadas no mobile (flex-col)

## Bug: Taxa de entrega não exibida corretamente na sacola desktop
- [x] Corrigir exibição da taxa de entrega na sacola desktop quando bairro é selecionado
- [x] Adicionar taxa de entrega no resumo do modal de confirmação (step 3)
- [x] Garantir que a taxa de entrega seja exibida corretamente para pickup/dine_in (R$ 0,00)

## Bug: Texto incorreto na sacola para Consumir/Retirar no local
- [x] Alterar "Taxa de entrega Grátis" para "Consumir no local Grátis" quando dine_in selecionado
- [x] Alterar "Taxa de entrega Grátis" para "Retirar no local Grátis" quando pickup selecionado

## Bug: Modal de tipo de entrega mostra opções incorretas
- [x] No modal de confirmação (step 2), mostrar apenas a opção de entrega já selecionada
- [x] Adicionar botão "Alterar" dentro da opção selecionada para voltar ao modal de seleção de bairro
- [x] Remover as outras opções de entrega do modal de confirmação

## Ajuste: Remover nome do bairro do modal de tipo de entrega
- [x] Alterar "Entrega - Bairro X" para apenas "Entrega" no modal de tipo de entrega (step 2)

## Bug: Erro de permissão ao inserir merchant ID do iFood
- [ ] Investigar código de integração iFood que valida merchant ID
- [ ] Identificar causa do erro "Sem permissão para acessar este merchant"
- [ ] Corrigir validação ou mensagem de erro

## Validação de Critérios de Homologação iFood
- [x] Analisar código atual da integração iFood
- [x] Criar checklist de critérios obrigatórios
- [ ] Testar recebimento de eventos via polling/webhook
- [ ] Testar processamento de pedidos delivery (IMMEDIATE e SCHEDULED)
- [ ] Testar processamento de pedidos para retirar (TAKEOUT)
- [ ] Testar cancelamento de pedidos com motivos
- [ ] Testar exibição de informações de pagamento
- [ ] Testar exibição de observações dos itens
- [ ] Testar sincronização de status com outros sistemas
- [ ] Documentar gaps e correções necessárias

## Implementar informações do iFood no modal de detalhes do pedido
- [x] Exibir data/hora de entrega para pedidos agendados (SCHEDULED)
- [x] Exibir bandeira do cartão quando pagamento em cartão
- [x] Exibir valor do troco quando pagamento em dinheiro
- [x] Exibir CPF/CNPJ do cliente quando informado
- [x] Destacar código de coleta do iFood (displayId)
- [x] Exibir responsável pelo desconto (iFood/Loja)
- [x] Exibir observações de entrega (delivery.observations)

## Bug: '0' solto na seção de informações do iFood
- [x] Identificar causa do bug (condição && renderizando 0 quando benefits.length é 0)
- [x] Corrigir condição para usar optional chaining (benefits?.length > 0)

## Validação Final de Critérios de Homologação iFood
- [x] Verificar exibição de data/hora de pedidos agendados (SCHEDULED)
- [x] Verificar exibição de bandeira do cartão
- [x] Verificar exibição de valor do troco
- [x] Verificar exibição de CPF/CNPJ do cliente
- [x] Verificar destaque do código de coleta (displayId)
- [x] Verificar exibição de responsável pelo desconto (iFood/Loja)
- [ ] Implementar Plataforma de Negociação (verificar se obrigatório)
- [ ] Implementar verificação de duplicação de eventos
- [x] Preparar documentação para sessão de homologação

## Refatoração Visual da Página de Templates
- [ ] Criar sistema de abas para navegação entre templates (Novo Pedido, Preparando, Pronto, Finalizado, Cancelado)
- [ ] Layout em duas colunas: editor à esquerda, preview à direita
- [ ] Mover variáveis para card separado com tags clicáveis
- [ ] Preview estilo WhatsApp real (bolha verde, horário, checkmarks ✓✓)
- [ ] Reduzir texto técnico visível na tela principal
- [ ] Manter toda a lógica de salvamento e carregamento atual

## Refatoração Visual da Página de Templates
- [x] Criar tabs horizontais com nomes dos modelos (Novo Pedido, Preparando, Pronto, Finalizado, Cancelado)
- [x] Mover variáveis para card separado com tags clicáveis
- [x] Layout em duas colunas: editor à esquerda, preview à direita
- [x] Preview estilo WhatsApp (bolha verde, horário, checkmarks)
- [x] Reduzir texto técnico visível
- [x] Manter lógica atual de salvamento

## Redesign dos 3 Cards da Página de Templates
- [ ] Criar novo modelo visual para o card de Variáveis disponíveis
- [ ] Criar novo modelo visual para o card do Editor de texto
- [ ] Criar novo modelo visual para o card de Preview WhatsApp
- [ ] Manter botões de navegação (Novo Pedido, Preparando, etc.) no lugar atual

## Correção do Preview WhatsApp
- [x] Mover balão de mensagem para o lado esquerdo (mensagem recebida pelo cliente)
- [x] Usar cor branca no balão (mensagem recebida) em vez de verde
- [x] Adicionar nome do restaurante no header do preview

## Preview WhatsApp no Editor de Templates
- [x] Buscar dinamicamente o nome do restaurante do banco de dados para exibir no header do preview WhatsApp

## Card de Visualizações do Cardápio no Dashboard
- [x] Criar tabela menu_sessions no schema do banco de dados
- [x] Executar migração (pnpm db:push)
- [x] Implementar procedure pública para registrar sessão do cardápio
- [x] Implementar procedure protegida para contar visualizações ativas
- [x] Implementar procedure para buscar histórico de visualizações (últimos 7 dias)
- [x] Implementar hook no cardápio público para registrar sessões
- [x] Criar componente ViewsCard com sparkline e estados de cores
- [x] Integrar card no Dashboard ao lado do card de Acumulados da Semana
- [x] Implementar estados visuais: alta (verde), queda (vermelho), neutro (cinza)
- [x] Implementar tratamento de edge cases (poucas visualizações, sem dados)

- [x] Ajustar a fonte do card de Visualizações para usar a mesma fonte do sistema admin
- [x] Ajustar a altura do card de Visualizações para ser igual ao card de Acumulado da Semana

## Mapa de Calor de Visualizações
- [x] Criar tabela menu_views_hourly no schema para armazenar visualizações por hora
- [x] Implementar procedure para buscar dados do mapa de calor (7 dias x 24 horas)
- [x] Atualizar registro de sessão para incluir hora
- [x] Criar componente HeatmapCard com grid de dias x horas
- [x] Implementar escala de cores (azul claro a azul escuro)
- [x] Adicionar legenda "Menos" a "Mais"
- [x] Integrar HeatmapCard no Dashboard substituindo o ViewsCard simples

- [x] Mover HeatmapCard para ao lado do card de Acumulado da Semana (40% do espaço)
- [x] Alterar informação de hover para tooltip flutuante acima da célula
- [x] Ajustar altura do card de Acumulado da Semana para ser igual ao card de Mapa de Calor
- [x] Ajustar header do card de Acumulado da Semana para ter ícone à esquerda, título e descrição breve (mesmo modelo do Mapa de Calor)
- [x] Adicionar ícone de informação (ⓘ) no card de Mapa de Calor com tooltip explicativo


## Página de Disparo de SMS (Campanhas)
- [x] Adicionar seção "Marketing" na sidebar
- [x] Adicionar menu "Campanhas" dentro da seção Marketing
- [x] Criar rota /campanhas no App.tsx
- [x] Criar página de Campanhas com 4 cards informativos (Saldo, Custo por SMS, Quantidade possível, Último disparo)
- [x] Implementar layout em duas colunas (editor à esquerda, preview à direita)
- [x] Criar editor de mensagem SMS com limite de 152 caracteres e contador em tempo real
- [x] Criar bloco de seleção de destinatários com 3 abas (Base de clientes, Importar CSV, Adicionar manualmente)
- [x] Mostrar total de destinatários selecionados
- [x] Adicionar botão "Disparar SMS"
- [x] Criar preview visual do SMS no formato de celular
- [x] Ajustar os 4 cards informativos da página de Campanhas SMS para seguir o mesmo modelo visual dos cards do Dashboard
- [x] Mover ícone de informação (i) para o final da linha "Mensagem SMS"
- [x] Mover contador de caracteres para dentro do campo de texto no canto inferior direito
- [x] Ajustar campo de mensagem SMS para ter apenas uma área de texto sem quebras de linha extras
- [x] Posicionar contador de caracteres no canto inferior direito na mesma linha do placeholder

## Melhorias na Página de Campanhas SMS
- [x] Formatar número de telefone automaticamente com +55 e máscara (XX) X XXXX-XXXX na aba Adicionar Manual
- [x] Buscar clientes reais do banco de dados na aba Base de Clientes (clientes que fizeram pedidos)

## Correção de Timezone no Heatmap
- [x] Corrigir timezone do registro de visualizações do cardápio para usar horário de São Paulo (UTC-3) em vez de UTC

## Ajuste do Campo de Mensagem SMS
- [x] Campo de mensagem deve ter apenas uma linha inicialmente (altura mínima)
- [x] Contador de caracteres deve ficar na mesma linha do placeholder (à direita)
- [x] Campo só deve expandir quando a mensagem for grande

## Ajuste do Preview SMS
- [x] Remover modelo de celular do preview SMS
- [x] Usar estilo de card similar ao preview de WhatsApp da página de templates

## Ajuste do Estilo do Preview SMS (iOS Style)
- [x] Mudar preview para estilo iOS com header "< Mensagens" e fundo cinza claro

## Investigação do Envio SMS
- [x] Verificar logs do servidor para identificar erro no envio SMS via Disparo Pro
- [x] Corrigir integração com API Disparo Pro se necessário

## Sistema de Saldo SMS
- [x] Criar tabela sms_balance no banco de dados para armazenar saldo de cada estabelecimento
- [x] Criar tabela sms_transactions para histórico de transações (créditos e débitos)
- [x] Implementar procedure para buscar saldo atual do estabelecimento
- [x] Implementar débito automático do saldo ao enviar SMS com sucesso
- [x] Bloquear envio se saldo insuficiente
- [x] Atualizar frontend para usar saldo real em vez de dados mockados


## Ajustes de UX - Campanhas SMS
- [x] Alterar custo padrão por SMS de R$ 0,08 para R$ 0,10
- [x] Mascarar números de telefone na lista de destinatários (ex: +55 11 9 9929-00**)
- [x] Definir saldo inicial de R$ 0,10 para novos usuários (1 SMS de teste)


## Menu Campanhas - Badge Breve
- [x] Adicionar badge "Breve" no menu de Campanhas igual ao menu de Estoque


## Reorganização do Menu
- [x] Mover menu de Cupons para a seção de Marketing

## Badge Breve no Menu Cupons
- [x] Adicionar badge "Breve" ao menu de Cupons igual aos outros menus


## Est## Estilo de Seleção do Menu
- [x] Alterar estilo de seleção do menu para barra vermelha clara à esquerda e fundo vermelho escuro

## Página PDV (Ponto de Venda)
- [x] Criar página PDV.tsx com layout de duas colunas
- [x] Coluna esquerda: grade de produtos com categorias no topo
- [x] Coluna direita: sacola estilo menu público (mais alta)
- [x] Topo da sacola: seletor de tipo de pedido (Mesa, Retirada, Entrega)
- [x] Cards de produto com foto, título, descrição e botão adicionar
- [x] Modal de detalhes do item (reutilizar modelo do menu público)
- [x] Adicionar rota /pdv no App.tsx
- [x] Adicionar menu PDV na seção Operações da sidebar
- [x] Manter identidade visual do sistema (bordas coloridas, estilo de cards)

## Ajustes de Layout no PDV
- [x] Remover título "PDV" e descrição do topo da página
- [x] Ajustar categorias para ficarem em uma única linha com scroll horizontal
- [x] Evitar quebra de linha automática nas categorias

## Correção dos botões de categorias no PDV
- [x] Corrigir texto cortado nos botões de categorias
- [x] Garantir que o texto completo apareça em cada botão

## Otimização da sacola no PDV
- [x] Remover fotos dos itens na lista do pedido para ganhar espaço

## Correção de overflow na página PDV
- [x] Corrigir barra de rolagem externa na página PDV
- [x] Garantir que o botão Finalizar Pedido apareça completo

## Correção de overflow na página Dashboard
- [x] Corrigir barra de rolagem externa na página Dashboard

## Correção do modal de detalhes no PDV
- [ ] Abrir modal de detalhes quando clicar em Adicionar em item com complementos
- [ ] Replicar estilo do modal do menu público no PDV (bordas arredondadas, grupos de complementos)
- [ ] Adicionar seleção de complementos no modal do PDV
- [ ] Botão "Escolha uma opção" quando há complementos obrigatórios

## Ajuste dos cards de itens no PDV
- [x] Adicionar sombra igual aos cards da Dashboard
- [x] Adicionar borda colorida no topo dos cards (estilo "Pedidos Hoje")

## Correção do placeholder de foto no PDV
- [x] Ajustar placeholder de foto nos cards de itens quando produto não tem imagem

## Correção do alinhamento nos cards do PDV
- [x] Fixar posição do preço e botão Adicionar independente do tamanho da descrição

## Alteração do comportamento do botão Adicionar no PDV
- [x] Botão Adicionar: adiciona item direto à lista sem abrir modal
- [x] Clicar no card: abre modal de detalhes do item

## Minimizar menu automaticamente no PDV
- [x] Menu lateral deve minimizar automaticamente ao acessar a página PDV

## Correção de preço duplicado na lista do PDV
- [x] Remover o preço vermelho duplicado na lista de itens do PDV

## Ícone de menu de categorias no PDV
- [x] Adicionar ícone de menu (três linhas) ao lado do botão "Todos"
- [x] Criar modal com lista de todas as categorias para seleção rápida

## Ajustes na barra de categorias do PDV
- [x] Remover emojis das categorias, exibindo apenas o texto
- [x] Mover contagem de itens para badge no canto superior direito do botão

## Botão Adicionar responsivo nos cards do PDV
- [x] Quando espaço for limitado, mostrar apenas ícone + sem texto "Adicionar"
- [x] Mostrar texto "Adicionar" em telas maiores (2-3 cards) e apenas ícone + em 4+ cards por linha

## Melhorias na barra de categorias do PDV
- [x] Remover barra de rolagem horizontal das categorias
- [x] Adicionar ícone de menu no final da lista para ver mais categorias

## Ícone de ver mais categorias fixo
- [x] Fixar ícone na borda direita, fora do overflow
- [x] Adicionar gradiente/fade antes do ícone para indicar mais categorias
- [x] Garantir que o botão esteja sempre visível e clicável

## Drag horizontal na barra de categorias do PDV
- [x] Permitir arrastar com mouse para navegar entre categorias
- [x] Cursor muda para grab/grabbing durante arrasto
- [x] Sem scrollbar visível

## Botão de menu fixo na barra de categorias
- [x] Mover botão de menu (3 linhas) para fora da área de arrasto

## Ajustar botão Ver mais da barra de categorias
- [x] Manter apenas setinha (ChevronsRight) com efeito visual, remover texto e gradiente

## Setinha de categorias condicional
- [x] Mostrar setinha apenas quando houver overflow na lista de categorias

## Filtrar categorias pausadas no PDV
- [x] Exibir apenas categorias ativas (isActive = true) no PDV

## Borda vermelha nos cards do carrinho do PDV
- [x] Adicionar borda vermelha na lateral esquerda dos cards de itens no carrinho

## Melhorar drag de categorias
- [x] Continuar drag mesmo quando mouse sair da área horizontal das categorias

## Dropdown WhatsApp na página de configurações
- [ ] Transformar menu WhatsApp em dropdown expansível
- [ ] Adicionar sub-abas Notificações e Templates dentro do dropdown

## Dropdown WhatsApp nas Configurações
- [x] Converter botões "Notificações" e "Templates" do WhatsApp em um dropdown
- [x] Adicionar ícone de seta (ChevronDown) que rotaciona ao abrir/fechar
- [x] Implementar menu dropdown com opções "Notificações" e "Templates"
- [x] Manter destaque visual quando uma das opções está selecionada
- [x] Fechar dropdown automaticamente ao selecionar uma opção

## Barra Lateral Secundária nas Configurações
- [x] Criar componente de barra lateral secundária para Configurações
- [x] Adicionar menus verticais: Estabelecimento, Atendimento, WhatsApp, Impressora e Teste, Integrações
- [x] Exibir conteúdo à direita da segunda barra lateral
- [x] Remover abas horizontais atuais
- [x] Manter destaque visual no item selecionado
- [x] Garantir responsividade no mobile

## Ajuste do Cabeçalho nas Configurações
- [x] Mover cabeçalho (título e descrição) para dentro da área de conteúdo principal
- [x] Cabeçalho deve ficar ao lado direito do menu secundário, não acima dele

## Fixar Barra Lateral Secundária
- [x] Fixar a segunda barra de menu lateral para não deslizar com a página
- [x] Manter apenas o conteúdo da direita com scroll

## Ajustes na Barra Lateral Secundária
- [x] Remover espaço acima da barra de menu secundária (alinhar com topo)
- [x] Minimizar barra lateral principal automaticamente ao clicar em Configurações

## Corrigir Barra Lateral Secundária Fixa
- [x] Fixar a barra de menu secundária para não rolar junto com a página
- [x] Apenas o conteúdo à direita deve ter scroll

## Borda Vermelha no Menu Secundário
- [x] Adicionar borda vermelha no lado direito do item ativo na barra de menu secundária

## Transição Suave no Menu Configurações
- [x] Adicionar transição suave ao recolher o menu primário ao clicar em Configurações
- [x] Adicionar efeito do menu secundário deslizando de trás do menu primário

## Ajustar Borda do Menu Secundário
- [x] Ajustar a borda vermelha do lado direito do item ativo no menu secundário para ficar igual ao menu primário (arredondada)

## Corrigir Efeito de Recolher no Menu Configurações
- [x] Verificar e corrigir o efeito de recolher do menu ao clicar em Configurações para ficar igual ao PDV

## Menu Sanfona Mobile nas Configurações
- [x] Transformar barra lateral secundária em menu sanfona (accordion) no mobile
- [x] Menu deve expandir/recolher ao clicar no título da seção
- [x] Mostrar ícone de seta indicando estado expandido/recolhido
- [x] Manter comportamento normal em desktop (barra lateral fixa)
- [x] Adicionar transição suave na expansão/recolhimento

## Redesign do Card de Item no PDV
- [ ] Mostrar apenas título e preço na mesma linha no card do item
- [ ] Adicionar dropdown com controles (menos/mais/editar) ao hover ou clique
- [ ] Ícone de editar na mesma linha dos botões menos/mais
- [ ] Ao clicar no ícone de editar, abrir modal de detalhes do item
- [ ] Manter funcionalidade de remover item

## Correção do Modal de Edição no PDV
- [ ] Ao clicar em editar item do carrinho, abrir o mesmo modal de detalhes do produto
- [ ] Preencher o modal com os complementos já selecionados do item
- [ ] Remover o modal separado de edição de item

## Redesign do Card de Item no PDV
- [x] Mostrar apenas título e preço na mesma linha no card do item
- [x] Adicionar dropdown com controles (menos/mais/editar) ao hover ou clique
- [x] Botão de editar deve abrir o modal de detalhes do produto
- [x] Modal de edição deve mostrar os complementos já selecionados
- [x] Reutilizar o modal de detalhes do produto para edição
- [x] Remover modal de edição separado

## Correção: Restaurar Complementos ao Editar Item no PDV
- [x] Corrigir mapeamento de complementos salvos para grupos de complementos do produto
- [x] Garantir que complementos já selecionados apareçam marcados no modal ao editar

## Sidebar de Entrega no PDV
- [ ] Criar sidebar de entrega na lateral direita do PDV (mesma largura do card Pedido Atual)
- [ ] Adicionar campos de endereço: Rua, Número, Bairro, Complemento, Ponto de referência
- [ ] Adicionar seleção de forma de entrega com preço
- [ ] Adicionar formas de pagamento: Dinheiro, Cartão, Pix (com chave do restaurante)
- [ ] Mostrar sidebar apenas quando tipo de pedido for "Entrega"
- [ ] Manter mesmo estilo visual do modal de entrega do menu público
- [ ] Implementar seleção de bairro na sidebar de entrega do PDV quando restaurante estiver configurado para entrega por bairro

- [x] Modificar sidebar de entrega para seleção de bairro ocupar toda a sidebar inicialmente, e após selecionar mostrar campos de endereço e pagamento

- [x] Exibir tipo de pedido (Consumo, Retirada, Entrega) no card de Pedido Atual
- [x] Mostrar taxa de entrega quando aplicável no card de Pedido Atual
- [x] Adicionar ícone de cupom ao lado esquerdo do botão de cupom no card de Pedido Atual

- [x] Modificar botão de cupom para ser apenas um ícone ao lado esquerdo do botão Limpar

## Fluxo de Retirada no PDV
- [ ] Implementar sidebar de pagamento para Retirada (mesmo padrão visual da sidebar de Entrega)
- [ ] Botão "Finalizar Pedido" muda para "Pagamento" quando tipo é Retirada e não há forma de pagamento selecionada
- [ ] Ao clicar em "Pagamento", abrir sidebar com formas de pagamento do restaurante
- [ ] Ao selecionar forma de pagamento, fechar sidebar automaticamente
- [ ] Após selecionar pagamento, botão volta para "Finalizar Pedido"
- [ ] Ao clicar em "Finalizar Pedido", criar pedido com status "Preparando" e redirecionar para página de Pedidos

## Bug - Pedidos de Retirada não aparecem na página de Pedidos
- [x] Investigar por que pedidos de Retirada não aparecem no card de preparo
- [x] Corrigir a lógica de criação/exibição de pedidos de Retirada
- [x] Testar fluxo completo de Retirada
- [x] Pedidos do PDV agora têm status inicial 'preparing' (em preparação)
- [x] Número do pedido segue sequência correta (#P1, #P2, #P3...)
- [x] Notificação SSE enviada para atualizar página de Pedidos em tempo real

## Bug - Botão Adicionar no PDV abrindo modal (CORRIGIDO)
- [x] Corrigir botão Adicionar para adicionar item direto ao carrinho sem abrir modal
- [x] Modal de detalhes só deve abrir ao clicar no card do item

## Correção Modal de Detalhes do Item no PDV
- [ ] Corrigir modal para seguir exatamente o layout do menu público
- [ ] Foto grande no topo com botão X
- [ ] Nome, descrição e preço em vermelho
- [ ] Grupos de complementos com botão + vermelho circular
- [ ] Controle de quantidade (-/+) e botão "Adicionar" no rodapé

## Comparação Modal PDV vs Menu Público
- [ ] Comparar layout, ícones, alturas e larguras dos modais
- [ ] Ajustar modal do PDV para ficar idêntico ao menu público

## Comparação Modal PDV vs Menu Público
- [x] Comparar layout, ícones, alturas e larguras dos modais
- [x] Ajustar modal do PDV para ficar idêntico ao menu público
- [x] Placeholder sem imagem ajustado (h-[180px] sm:h-48 md:h-56)
- [x] Área de conteúdo com overscroll-contain e padding responsivo
- [x] Ordem título/preço/descrição corrigida
- [x] Campo de observações com rounded-xl
- [x] Footer com controles rounded-xl

## Ajuste Controle de Quantidade no Footer do Modal
- [x] Restaurar estilo do controle de quantidade no PDV (botões circulares em fundo cinza arredondado)
- [x] Aplicar mesmo estilo no modal do menu público

## Correção Comportamento de Interação no PDV
- [x] Botão "Adicionar" deve adicionar item diretamente ao carrinho (sem abrir modal)
- [x] Card do item (imagem, título, área) deve abrir o modal de detalhes

## Correção Layout Sidebar Dados da Entrega
- [x] Seleção de bairro em uma única linha (ícone + "Entrega" + taxa + "Alterar")
- [x] Campo Número ao lado do Complemento (20% largura)
- [x] Campo Complemento com 80% da largura

## Impressão Automática no PDV
- [x] Analisar código de impressão existente na página de Pedidos
- [x] Implementar impressão automática após finalizar pedido no PDV
- [x] Usar opção de impressão configurada como favorita

## Melhoria Impressão Normal
- [x] Alterar impressão normal para usar iframe oculto com window.print()
- [x] Evitar abertura de nova aba ao imprimir
- [x] Aplicado tanto no PDV quanto na página de Pedidos

## Bug - Janela de Impressão Abrindo Duas Vezes
- [x] Corrigir conflito entre iframe.print() e auto-print da página de recibo

## Campo de Cupom no PDV
- [x] Ao clicar no ícone de cupom, mostrar campo de texto abaixo dos botões
- [x] Campo de texto para inserir código do cupom
- [x] Botão "Aplicar" ao lado do campo

## Lógica Real de Cupons no PDV
- [x] Criar tabela de cupons no banco de dados (código, tipo desconto, valor, validade, uso máximo) - já existia
- [x] Criar endpoint para validar cupom - já existia (coupon.validate)
- [x] Criar endpoint para listar cupons - já existia (coupon.list)
- [x] Integrar validação de cupom no PDV
- [x] Aplicar desconto real no total do pedido
- [x] Salvar cupom aplicado no pedido (couponCode, couponId, incrementCouponUsage)

## Badge Breve no Menu PDV
- [x] Adicionar badge "Breve" no item PDV da sidebar igual ao Estoque

## Bug - Cupom OFF10 retornando inválido no PDV
- [x] Investigar e corrigir validação de cupom no PDV (formato JSON do tRPC)

## Exibir Desconto no Resumo do PDV
- [x] Adicionar linha de desconto entre Subtotal e Total quando cupom aplicado

## Modal de Categorias no Menu Público
- [x] Mobile: Bottom Sheet subindo da parte inferior (80% da tela)
- [x] Desktop: Modal centralizado padrão
- [x] Campo de busca para filtrar categorias em ambos
- [x] Lista de todas as categorias navegáveis

## Modal de Forma de Pagamento no PDV - Dinheiro
- [x] Ao selecionar Dinheiro, exibir campos: Valor total (somente leitura), Valor recebido (editável)
- [x] Exibir texto "Troco a devolver: R$ XX,XX" destacado e calculado automaticamente
- [x] Substituir botão Cancelar por botão Continuar
- [x] Ao clicar em Continuar, confirmar pagamento e fechar modal

## Campos Nome e Telefone na Sidebar de Entrega
- [x] Adicionar campo Nome acima do Endereço de Entrega
- [x] Adicionar campo Telefone abaixo do Nome

## Máscara de Telefone no PDV
- [x] Adicionar formatação automática (00) 00000-0000 no campo de telefone

## Padronização Visual da Sidebar de Entrega no PDV
- [x] Aplicar fundo branco na sidebar
- [x] Container com fundo cinza claro para campos de input
- [x] Bordas arredondadas e cores iguais ao modal do menu público

## Padronização Visual do Modal de Pagamento no PDV
- [x] Aplicar fundo branco no modal
- [x] Container com fundo cinza claro para opções de pagamento
- [x] Bordas arredondadas e cores consistentes com sidebar de entrega

## Efeito Pulse no Botão Criar Menu
- [x] Adicionar animação pulse/glow no botão "Criar Menu" do rodapé

## Ajuste Estilo Modal Pagamento PDV
- [x] Remover container cinza das opções de pagamento
- [x] Ajustar campos de troco para estilo do menu público

## Atalhos de Valores no Campo de Troco - Menu Público
- [ ] Adicionar botões R$ 20, R$ 50, R$ 100 abaixo do campo de troco

## Atalhos de Valores no Campo de Troco - Menu Público
- [x] Adicionar botões R$ 20, R$ 50, R$ 100 abaixo do campo de troco

## Estilo do Botão de Troco Selecionado
- [x] Fazer botão de valor de troco selecionado ficar vermelho

## Tooltips Mobile - Card de Visualizações do Cardápio
- [x] Corrigir tooltip dos quadradinhos do heatmap para funcionar com touch/tap em mobile
- [x] Corrigir tooltip do ícone de informação (i) para funcionar com touch/tap em mobile

## PDV - Campo de Valor Recebido
- [x] Alterar texto "Precisa de troco para quanto?" para "Qual valor recebido?"
- [x] Implementar formatação automática de moeda (ex: 050 = 0,50, 2 = 0,02)

## HeatmapCard - Dias da Semana Fixos
- [x] Fixar coluna dos dias da semana (Dom, Seg, Ter, etc.) durante scroll horizontal no heatmap

## PDV - Troco em Destaque
- [x] Exibir troco a devolver em destaque quando valor recebido for digitado

## Pedidos - Card de Cancelados Mobile
- [x] Voltar a exibir o card de cancelados na versão mobile

## Pedidos - Card de Cancelados Apenas Mobile
- [x] Ocultar card de Cancelados no desktop e manter apenas no mobile

## Impressão do Recibo - Correções
- [x] Remover janela/aba que abre no navegador ao clicar em imprimir
- [x] Corrigir modelo de impressão para usar o modelo correto da aba do recibo

## WhatsApp - Mensagem Completa do Pedido
- [x] Incluir número do pedido, itens com complementos e valor total na mensagem do WhatsApp

## HeatmapCard - Tooltips Desktop vs Mobile
- [x] Corrigir tooltips para usar hover no desktop e click no mobile

## WhatsApp - Remover Texto Extra
- [x] Remover "Como posso ajudar?" da mensagem do WhatsApp

## Dashboard - Comportamento dos Cards com Sidebar
- [x] Reverter HeatmapCard para versão 005e5bf7

## HeatmapCard - Tooltips Touch/Tap
- [x] Reimplementar suporte a touch/tap nos tooltips sem afetar layout dos cards

## HeatmapCard - Coluna de Dias Fixa
- [x] Adicionar coluna de dias da semana fixa durante scroll horizontal usando CSS sticky

## PDV - Nome do Cliente e Telefone
- [x] Tornar campo de telefone não obrigatório na sidebar de dados de entrega
- [x] Usar nome do cliente digitado no card do pedido em vez de "Cliente PDV"
- [x] Usar nome do cliente digitado na impressão do recibo

## Sidebar Mobile - Ícone de Fechar
- [x] Substituir ícone de X por ícone de minimizar/maximizar na sidebar mobile

## Sidebar - Minimizar ao Clicar em Pedidos
- [x] Minimizar sidebar automaticamente ao clicar no menu Pedidos (igual ao PDV)

## Configurações - Impressão de Teste
- [x] Corrigir botão Teste Normal para não abrir nova aba ao imprimir

## Conta e Segurança - Nova Página
- [x] Criar/atualizar schema do banco para campos de conta e 2FA
- [x] Criar procedures tRPC para dados da conta
- [x] Criar procedure para alteração de senha
- [x] Criar procedure para toggle 2FA por e-mail
- [x] Criar página AccountSecurity.tsx com seções:
  - [x] Card Dados da Conta (estabelecimento + responsável)
  - [x] Card Alterar Senha
  - [x] Card Verificação em duas etapas (2FA)
- [x] Adicionar rota /conta-seguranca no App.tsx
- [x] Adicionar link no menu secundário (AdminLayout)

## Conta e Segurança - Correção de Posição no Menu
- [x] Mover link do menu primário para o menu secundário (abaixo do WhatsApp)

## Impressora e Teste - Configuração de Impressão HTML
- [x] Adicionar campo htmlPrintEnabled no schema do banco
- [x] Criar/atualizar procedure para salvar configuração
- [x] Adicionar toggle no card de layout da aba Impressora e Teste

## Conta e Segurança - Ajustes de E-mail e Nome
- [x] Campo e-mail deve mostrar o e-mail cadastrado na plataforma (do usuário)
- [x] Nome do responsável ao ser alterado deve refletir no nome do perfil do usuário

## Conta e Segurança - Ajustes de E-mail e Nome do Responsável
- [x] Campo e-mail deve mostrar o e-mail cadastrado na plataforma (do usuário)
- [x] Nome do responsável deve refletir no nome do perfil do usuário ao ser alterado

## Conta e Segurança - Atualização do Nome do Perfil em Tempo Real
- [x] Invalidar cache do auth.me após salvar nome do responsável para atualizar perfil sem recarregar página

## PDV - Remover Redirecionamento Após Finalizar Pedido
- [x] Remover redirecionamento automático para /pedidos após finalizar pedido no PDV

## PDV - Remover Título Pedido Atual
- [x] Remover o título "Pedido Atual" da página do PDV

## PDV - Corrigir Notificações Duplicadas
- [x] Corrigir notificações duplicadas ao adicionar item ao carrinho


## Remodelação da Página de Planos (Billing & Subscription)
- [x] Criar estrutura base da página com 3 seções (Seleção de Planos, Plano Atual, Billing History)
- [x] Implementar toggle Monthly/Annual Plan no cabeçalho
- [x] Criar card do Plano Free (R$ 0, funcionalidades limitadas)
- [x] Criar card do Plano Basic (R$ 29/mês, funcionalidades intermediárias)
- [x] Criar card do Plano Pro com destaque visual (Most Popular, gradiente, sombra)
- [x] Implementar seção Plano Atual do Usuário (Your Plan + Next Payment)
- [x] Implementar seção Billing History com tabela e filtros
- [x] Adicionar botão Export no histórico de faturas
- [x] Garantir responsividade completa da página
- [x] Preparar layout para integração futura com Pix/Cartão

## Ajustes no Menu do Perfil
- [x] Alterar "Configurações" para "Ajuda e suporte" no dropdown do perfil


## Página de Ajuda e Suporte
- [x] Criar estrutura base da página com 3 blocos (Canais de Ajuda, Tutorial, FAQ)
- [x] Implementar bloco "Como podemos ajudar?" com 3 cards de contato (WhatsApp, Email, Telefone)
- [x] Implementar bloco Tutorial em Vídeo com player e lista de capítulos
- [x] Implementar bloco FAQ com accordion expansível
- [x] Garantir responsividade completa da página
- [x] Registrar rota /ajuda no App.tsx


## Remodelação da Página de Planos v2
- [x] Redesenhar com 2 cards de planos (Basic e Pro) lado a lado
- [x] Remover card Free, manter apenas Basic ($29/mês) e Pro ($120/ano)
- [x] Adicionar badge "Most Popular" no card Pro com borda azul
- [x] Redesenhar seção Your Plan com botão Cancel Plan
- [x] Adicionar informação de renovação (Renews date)
- [x] Redesenhar Billing History com paginação
- [x] Adicionar checkbox de seleção nas linhas da tabela
- [x] Melhorar visual dos badges de status (Success, Processing)

## Ajuste na Página de Planos
- [x] Adicionar card do plano gratuito à esquerda do card Basic


## Remodelação da Página de Ajuda
- [x] Remodelar página de Ajuda com novo design baseado na referência
- [x] Cards de contato (WhatsApp, Email, Telefone) com ícones coloridos
- [x] Seção Tutorial com player de vídeo e lista de capítulos
- [x] Seção FAQ com accordion expansível

## Tradução da Página de Ajuda
- [x] Traduzir todo o conteúdo da página de Ajuda para português brasileiro

## Atualização do WhatsApp na Página de Ajuda
- [x] Atualizar link do WhatsApp para número 5534998807793 com mensagem pré-definida

## Atualização do Email na Página de Ajuda
- [x] Atualizar email de contato para contato@mindi.com.br

## Atualização do Telefone na Página de Ajuda
- [x] Atualizar número de telefone de suporte para 5534998807793

## Verificação de Cabeçalho - Ajuda vs Dashboard
- [x] Verificar e ajustar cabeçalho da página de Ajuda para usar o mesmo padrão do Dashboard

## Efeito Blur no Card Pro - Página de Planos
- [x] Adicionar efeito blur/gradiente azul no canto superior direito do card Pro

## Tradução e Ajuste da Página de Planos
- [x] Traduzir todos os textos da página de Planos para português brasileiro
- [x] Ajustar cabeçalho para usar o componente PageHeader igual ao Dashboard

## Ajuste de Sombra nos Cards do Catálogo
- [x] Aplicar o mesmo estilo de sombra dos cards de Categorias nos cards de Catálogo

## Ajuste de Sombra nos Cards do Dashboard
- [x] Remover shadow-soft dos cards da página de Dashboard para ficar igual à página de Categorias

## Restaurar Efeito Hover nos Cards
- [x] Restaurar efeito de hover com elevação suave nos StatCards do Dashboard

## Ajuste de Sombra nos Cards Acumulado e Heatmap
- [x] Remover shadow-soft dos cards WeeklyRevenueCard e HeatmapCard

## Ajuste de Tamanho dos Cards de Tipo de Pedido
- [x] Reduzir tamanho dos cards Consumo, Retirada e Entrega em 20%

## Ajuste de Largura da Sidebar de Entrega
- [x] Reduzir largura da sidebar "Dados da Entrega" em 15%

## Ajuste do Card Troco a Devolver
- [x] Reduzir tamanho do card "Troco a devolver" no modal de Forma de Pagamento em 17%

## Implementação de Impressão ESC/POS
- [x] Criar utilitário de geração de comandos ESC/POS
- [x] Integrar ESC/POS com sistema de impressão quando toggle HTML estiver desativado

## Ajuste de Sombra nos Cards de Estoque
- [x] Remover shadow-soft dos cards da página de Estoque para ficar igual à página de Categorias

## Ajuste de Sombra nos Cards de Cupons
- [x] Remover shadow-soft dos cards de status (ativos, inativos, expirados, esgotados) e lista de cupons

## Ajuste de Sombra no Card de Lista de Estoque
- [x] Remover sombra do card de lista de itens de estoque

## Ajuste de Sombra no Card de Lista de Cupons
- [x] Remover sombra do card de lista de cupons

## Ajuste de Sombra nos Cards de Campanhas
- [x] Remover sombra de todos os cards da página de Campanhas

## Atualização de Placeholder SMS
- [x] Atualizar placeholder do campo de mensagem SMS na página de Campanhas
- [x] Atualizar texto padrão do card de preview

## Ajuste de Estilo na Aba Conta e Segurança
- [x] Remover sombra dos cards na aba Conta e Segurança
- [x] Ajustar estilo igual à página de Planos

## Ajuste de Sombra nas Abas de Impressora/Teste e WhatsApp
- [x] Remover sombra dos cards na aba de Impressora e Teste
- [x] Remover sombra dos cards na aba de WhatsApp

## Ajuste de Sombra na Aba Templates do WhatsApp
- [x] Remover sombra dos cards na aba Templates

## Reorganização de Campos na Aba Dados da Conta
- [x] Mover campo CNPJ para ao lado do campo nome do estabelecimento

## Reorganização dos Campos de Senha
- [x] Colocar campos de senha atual, nova e confirmar na mesma linha horizontal

## Reposicionamento do Botão Salvar
- [x] Mover botão Salvar alterações para a mesma linha do título Dados da Conta

## Layout Responsivo do Botão Salvar
- [x] Botão no header em desktop, na posição original em mobile

## Layout Responsivo do Botão Salvar no Card de Segurança
- [x] Botão no header em desktop, na posição original em mobile no card Alterar Senha

## Correção do Campo de Troco no PDV
- [x] Aplicar formatação padrão do sistema no campo de troco
- [x] Garantir que observação do troco apareça no recibo

## Observação de Não Precisa de Troco
- [x] Adicionar observação no recibo quando pagamento em dinheiro não precisar de troco

## Validação de Forma de Pagamento no Modal de Entrega
- [x] Impedir confirmação de dados sem selecionar forma de pagamento

## Pré-seleção de Forma de Pagamento
- [x] Pré-selecionar dinheiro como forma de pagamento padrão no PDV

## Pré-seleção de Dinheiro nos Modais do PDV
- [x] Garantir pré-seleção de dinheiro no modal de entrega
- [x] Garantir pré-seleção de dinheiro no modal de pagamento (retirada)

## Forma de Pagamento Favorita no PDV
- [x] Adicionar ícone de estrela ao lado de cada forma de pagamento
- [x] Implementar lógica de favorito com salvamento no localStorage
- [x] Pré-selecionar forma favorita ao abrir o modal
- [x] Garantir apenas uma forma favorita por vez

## Favoritar Forma de Pagamento no Sidebar de Entrega
- [x] Adicionar ícone de estrela nas formas de pagamento do sidebar de entrega

## Nova Página: Mesas e Comandas
- [ ] Criar estrutura base da página MesasComandas.tsx
- [ ] Implementar cards de resumo no topo (Livres, Ocupadas, Reservadas, Ticket Médio, Tempo Médio, Faturamento)
- [ ] Implementar filtros por status e busca por número da mesa
- [ ] Implementar grid de mesas com cards visuais (barra lateral colorida por status)
- [ ] Implementar sidebar lateral com detalhes da comanda
- [ ] Adicionar rota no App.tsx e menu no DashboardLayout


## Nova Página: Mesas e Comandas
- [x] Criar estrutura base da página MesasComandas.tsx
- [x] Implementar cards de resumo no topo (Livres, Ocupadas, Reservadas, Pedindo Conta, Ticket Médio, Faturamento)
- [x] Implementar filtros por status e busca por número da mesa
- [x] Implementar grid de mesas com cards visuais (barra lateral colorida por status)
- [x] Implementar sidebar lateral com detalhes da comanda
- [x] Adicionar rota no App.tsx e menu no AdminLayout

- [x] Corrigir layout da página Mesas e Comandas para usar AdminLayout em vez de DashboardLayout

- [x] Remover badge "Breve" do menu Mesas e Comandas para habilitar a página

- [x] Ajustar espaçamentos da página Mesas e Comandas para consistência com outras páginas
- [x] Alterar bordas dos cards de mesa para modelo Dashboard (borda superior colorida em vez de lateral)
- [x] Minimizar sidebar automaticamente ao acessar página de Mesas

- [x] Cards de mesa: voltar borda colorida para lado esquerdo
- [x] Remover cards de Livres/Ocupadas/Reservadas/Pedindo Conta (manter apenas Ticket Médio e Faturamento)
- [x] Cards de Ticket Médio e Faturamento: adicionar borda superior colorida
- [x] Filtros de status: adicionar badges de contagem ao lado direito

## Slidebar PDV na página de Mesas e Comandas
- [ ] Criar slidebar lateral (59% largura) que abre da esquerda para direita
- [ ] Reutilizar PDV existente dentro da slidebar com mesmo visual
- [ ] Tipo de pedido "Consumo" pré-selecionado automaticamente
- [ ] Número da mesa preenchido e bloqueado automaticamente
- [ ] Grade de produtos com máximo 3 itens por linha
- [ ] Cards de produto com tamanho reduzido em 20%
- [ ] Modal de detalhes do item igual ao PDV/menu público


## Slidebar PDV na Página de Mesas
- [x] Criar componente PDVSlidebar reutilizando o PDV existente
- [x] Slidebar entra da esquerda para direita com 59% da largura
- [x] Tipo de pedido "Consumo" pré-selecionado automaticamente
- [x] Número da mesa preenchido e bloqueado automaticamente
- [x] Grid de produtos com máximo 3 colunas e cards 20% menores
- [x] Modal de detalhes do produto igual ao PDV/menu público
- [x] Integrar PDVSlidebar na página MesasComandas


## Correções e Melhorias na Página de Mesas
- [x] Corrigir direção da slidebar PDV (da direita para esquerda)
- [x] Criar tabelas de mesas e comandas no schema do banco de dados
- [x] Criar endpoints tRPC para CRUD de mesas e comandas
- [x] Integrar página MesasComandas com dados reais do banco
- [x] Sincronizar comanda com mesa ao criar pedido pela slidebar
- [x] Adicionar botão de impressão de comanda na slidebar


## Aba Fixa (Handle) para Slidebar PDV
- [x] Criar aba vertical fixa na borda da slidebar do PDV
- [x] Aba sempre visível (fechada ou aberta)
- [x] Suporte a clique para abrir/fechar
- [x] Suporte a arrastar (drag) para abrir/fechar
- [x] Visual com cor vermelha, bordas arredondadas e sombra
- [x] Animação suave ao abrir/fechar (ease-in-out)
- [x] Ícone de seta indicando direção


## Melhorias na Slidebar PDV - Mesas e Comandas
- [x] Feedback visual no drag: animação de "puxar" mostrando a slidebar seguindo o dedo
- [x] Persistir mesa selecionada: manter a última mesa selecionada para a aba continuar visível
- [x] Aumentar largura da slidebar em 19% (de 59% para 78%)
- [x] Adicionar ícone de configuração (⚙️) na aba abaixo da seta
- [x] Modal de configuração: ajustar altura vertical da aba (posição Y)
- [x] Modal de configuração: ajustar tamanho da aba (altura/largura)
- [x] Preview em tempo real das alterações no modal
- [x] Persistir configurações no localStorage


## Efeito de Movimento na Aba da Slidebar
- [x] Adicionar animação de movimento/pulsação na aba (handle) da slidebar PDV para dar destaque visual


## Configuração Padrão da Aba da Slidebar
- [x] Alterar valores padrão: posição vertical 15%, altura 76px, largura 32px


## Preview ao Vivo da Configuração da Aba
- [x] Modificar modal para aplicar alterações em tempo real na aba real da tela
- [x] Remover preview estático do modal
- [x] Aba real deve refletir as mudanças enquanto o usuário ajusta os sliders


## Aba Acima do Overlay do Modal
- [x] Aumentar z-index da aba quando o modal de configuração estiver aberto para ficar acima do overlay escuro


## Aba Fixa em Todas as Páginas
- [ ] Adicionar opção no modal de configuração para aba fixa em todas as páginas (exceto PDV)
- [ ] Criar componente global da aba que aparece em todas as páginas quando ativado
- [ ] Persistir configuração no localStorage
- [ ] Ao clicar na aba de qualquer página, abrir a slidebar do PDV de mesas


## Aba Fixa em Todas as Páginas (Exceto PDV)
- [x] Adicionar opção no modal de configuração para aba fixa em todas as páginas
- [x] Criar componente GlobalPDVHandle para mostrar a aba globalmente
- [x] Excluir páginas de PDV e Mesas da exibição global
- [x] Persistir configuração no localStorage


## Ajuste na Aba Global
- [x] Remover indicador "M1" (número da mesa) da aba, deixando apenas as setas


## Atalhos de Teclado para Slidebar PDV
- [x] Implementar tecla F2 para abrir a slidebar
- [x] Implementar tecla ESC para fechar a slidebar
- [x] Atalhos funcionando em todas as páginas (exceto PDV)


## Padronização do Ícone da Aba
- [x] Usar o mesmo ícone de seta na aba quando aberta e fechada
- [x] Padronizar ícone nas demais páginas (GlobalPDVHandle)


## Ajustes na Slidebar PDV
- [x] Corrigir badges cortados nas categorias
- [x] Aumentar tamanho dos botões de categoria em 10%
- [x] Aumentar largura do carrinho em 17%
- [x] Mudar de 3 para 4 itens por linha no grid de produtos


## Animação Suave na Slidebar PDV
- [x] Adicionar transição mais suave na abertura (direita para esquerda)
- [x] Adicionar transição mais suave no fechamento (esquerda para direita)
- [x] Manter responsividade e fluidez


## Ajustes nos Cards de Produtos da Slidebar PDV
- [x] Adicionar texto "Adicionar" no botão junto com o ícone +
- [x] Aumentar tamanho dos cards em 10%


## Otimização da Animação da Slidebar PDV
- [x] Ajustar duração para 250-350ms (atualmente 400ms)
- [x] Usar ease-in-out em vez de cubic-bezier
- [x] Manter responsividade e fluidez


## Padronização do Modal de Detalhes do Item
- [ ] Identificar o modal de detalhes da página de Mesas
- [ ] Padronizar layout e tamanhos para ficar igual ao modal do PDV
- [ ] Usar checkbox quadrado com nome e preço na mesma linha


## Padronização do Modal de Detalhes do Item
- [x] Padronizar modal de Mesas para ficar igual ao modal do PDV
- [x] Usar mesmos tamanhos de fonte e espaçamentos
- [x] Usar mesmo estilo de checkbox/radio


## Cor dos Badges nos Filtros da Página de Mesas
- [x] Alterar cor dos badges (Todas, Livres, Ocupadas, Pedindo conta, Reservadas) para vermelho
- [x] Manter posição atual dos badges


## Largura dos Cards na Página de Mesas
- [x] Aumentar largura dos cards de Ticket Médio e Faturamento em 17%


## Correção da Aba do PDV na Página de Mesas
- [x] Fazer a aba do PDV aparecer automaticamente ao acessar a página de Mesas
- [x] Remover dependência do clique em uma mesa para exibir a aba


## Animação da Slidebar do PDV igual à de Configurações
- [x] Analisar o efeito de animação da slidebar de configurações
- [x] Aplicar o mesmo efeito na slidebar do PDV na página de Mesas


## Correção do Card Seu Plano na Página de Plano
- [x] Ajustar layout do card para duas colunas (Business Plan | Next Payment)
- [x] Adicionar data de renovação no cabeçalho
- [x] Adicionar botão Cancel Plan no canto superior direito
- [x] Adicionar link Upgrade Plan no rodapé


## Atualização do Título da Página de Mesas
- [x] Alterar título de "Mesas e Comandas" para "Mapa de mesas"
- [x] Alterar subtítulo para refletir o novo nome


## Ajustes de Espaçamento no PDVSlidebar
- [x] Aplicar marginRight: -3px no div (linha 606)
- [x] Aplicar ajustes de padding/margin no botão (linha 625)


## Ajuste de marginRight no PDVSlidebar
- [x] Alterar marginRight de -3px para -4px no div do handle


## Sistema de Espaços para Mesas
- [x] Atualizar schema do banco para incluir tabela de espaços (table_spaces)
- [x] Adicionar campo 'Nome do espaço' no modal de criar mesa
- [x] Transformar filtros de status em seletor de espaços
- [x] Manter filtro 'Todas' para ver todas as mesas
- [x] Tornar legenda de status clicável para filtrar mesas
- [x] Criar modal de gerenciamento de espaços (adicionar, editar, excluir)
- [x] Mostrar contagem de mesas por espaço nos botões de filtro


## Ajuste no Modal de Gerenciar Espaços
- [x] Remover campo "Adicionar novo espaço" do modal de Gerenciar Espaços


## Ajuste no Botão de Adicionar Mesa/Espaço
- [x] Mover botão + para o lado esquerdo do botão de gerenciar espaços
- [x] Aplicar mesmo estilo visual do botão de gerenciar espaços no botão +


## Melhorias na Interface de Mesas
- [x] Adicionar tooltips nos botões + e gerenciar espaços
- [x] Implementar funcionalidade de vincular mesas aos espaços


## Ajuste Visual do Botão de Adicionar Mesas
- [x] Alterar cor do botão + para vermelho (igual ao botão Todas selecionado)


## Remoção de Funcionalidade
- [x] Remover funcionalidade de vincular mesas aos espaços (seletor de espaço no Sheet)


## Ajuste Visual na Legenda de Status
- [x] Substituir texto "Status:" por ícone de filtro


## Ajuste Layout PDV Slidebar
- [x] Colocar cards Consumo e Mesa lado a lado com 50% cada


## Bug no Filtro de Busca do Cardápio
- [ ] Corrigir filtro de busca na página de Cardápio para filtrar itens corretamente


## Remover Validação de Tamanho da Imagem de Capa
- [x] Remover validação de tamanho mínimo de 1200px para imagem de capa do menu público


## Importação de Cardápio - Palácio do Açaí
- [x] Acessar cardápio público do Palácio do Açaí
- [x] Extrair categorias, produtos, complementos e grupos
- [x] Importar dados para o estabelecimento ID 90001


## Valor Padrão da Notificação Finalizado
- [x] Alterar valor padrão da notificação "Finalizado" para ativada (true) quando nova conta for criada


## Importação de Taxas por Bairro - Palácio do Açaí
- [x] Importar 25 bairros com taxas de entrega para o estabelecimento ID 90001


## Nova Cor no Card de Nota do Restaurante
- [x] Adicionar opção de cor "Açaí" no card de nota do restaurante nas configurações


## Badge Breve no Menu Mapa de Mesas
- [x] Adicionar badge "Breve" no menu lateral para Mapa de Mesas


## Tooltip nos Itens com Badge Breve
- [x] Adicionar tooltip explicativo nos itens do menu com badge "Breve"


## Melhorar Visibilidade do Tooltip
- [x] Alterar cor da descrição do tooltip para laranja para melhor visibilidade


## Badge Breve no Menu Ajuda e Suporte
- [x] Adicionar badge "Breve" no menu Ajuda e Suporte


## Valor Padrão da Opção Mostrar Divisores
- [x] Alterar valor padrão de "Mostrar divisores" para false quando nova conta for criada


## Badge Breve no Menu Integrações
- [x] Adicionar badge "Breve" no menu Integrações nas configurações


## Remover Texto de Prazo de Entrega no Modal de Confirmação
- [x] Remover o texto "O prazo de entrega está entre 30 a 45 minutos" do modal de confirmação no menu público


## Botão de Cupom e Limpar/Desfazer nas Páginas de Mesas e PDV
- [x] Adicionar botão de cupom na sidebar da página de Mesas (ao lado esquerdo do botão Finalizar Pedido)
- [x] Adicionar botão Limpar na sidebar da página de Mesas com funcionalidade de Desfazer
- [x] Implementar funcionalidade de Limpar/Desfazer na página de PDV


## Alteração de Status de Mesas
- [x] Trocar a cor do status "Ocupada" para vermelho (cor atual de "Pedindo conta")
- [x] Remover o status "Pedindo conta" dos filtros e do sistema


## Bug: Complementos não aparecem no hover do item do carrinho (PDVSlidebar)
- [x] Corrigir exibição dos complementos quando passa o hover no item do carrinho na slidebar do PDV


## Bug: Cor do balão da nota não aplica no preview do perfil público
- [x] Corrigir a aplicação da cor selecionada do balão no preview do perfil público na página de configurações


## Bug: Taxa de entrega fixa não exibe valor correto no menu público
- [x] Corrigir exibição da taxa de entrega fixa - mostra R$ 0,00 em vez do valor configurado (R$ 3,00)
- [x] Corrigir label "Retirar no local" - deve mostrar "Taxa de entrega" quando é delivery


## Correção da cor dos badges "Breve" em Configurações
- [x] Mudar cor do badge "Breve" no menu Ajuda e Suporte de vermelho para amarelo
- [x] Mudar cor do badge "Breve" no menu Integrações de vermelho para amarelo


## Alterar texto do card de seleção de entrega
- [x] Mudar "Entrega" para "Taxa de entrega" no card de seleção do modal de tipo de entrega


## Destaque visual para entrega grátis
- [x] Criar selo verde destacado para entrega grátis no card de taxa de entrega (sidebar)
- [x] Criar selo verde destacado para entrega grátis no modal de tipo de entrega
- [x] Criar selo verde destacado para entrega grátis na área de totais da sacola


## Reverter estilo do botão Grátis
- [x] Reverter botão Grátis para estilo vermelho com pulsação normal (sem ponto amarelo e sem gradiente verde)


## Adicionar ícone de check ao botão Grátis
- [x] Adicionar ícone de check ao botão Grátis mantendo cor vermelha e pulsação


## Aumentar tamanho da sidebar e cards do PDV
- [x] Aumentar largura da sidebar do PDV em 10%
- [x] Aumentar tamanho dos cards da lista de itens em 10%
- [x] Aumentar tamanho dos textos da lista de itens em 10%


## Atalhos de mesas na barra vermelha do PDVSlidebar
- [x] Adicionar atalhos de navegação entre mesas na barra vermelha da sidebar do PDV


## Ajustar layout dos atalhos de mesas na barra vermelha
- [x] Mover atalhos de mesas para a mesma linha que o título e descrição, centralizados


## Estilo de abas para atalhos de mesas
- [x] Alterar estilo dos atalhos de mesas para formato de abas (aba selecionada em verde, outras em cinza)
- [x] Ajustar estilo dos botões de números das mesas para seguir o mesmo padrão dos botões de categorias
- [x] Adicionar ícone de mesa ao lado do número na barra de atalhos de mesas
- [x] Trocar ícone de mesa (Armchair) pelo ícone de garfo e faca (UtensilsCrossed)
- [x] Adicionar botão de troca para inverter posição das barras de mesas e categorias
- [x] Corrigir alinhamento do botão de troca com botão de categorias
- [x] Aplicar mesma borda do botão de categorias no botão de troca
- [x] Botão de troca deve acompanhar as mesas quando barras são invertidas
- [x] Bug crítico: Isolar carrinho por mesa (cada mesa com sua própria comanda)
- [ ] Implementar status automático: mesa com itens = Ocupada, mesa sem itens = Livre
- [ ] Atualizar feedback visual no PDV (vermelho/verde baseado em itens)
- [ ] Atualizar feedback visual na página de Mesas (borda vermelha/verde)
- [x] Remover textos de status (Livre, Ocupada, Reservada) dos cards das mesas
- [x] Ajustar botões de mesas na barra PDV: usar cores de fundo (vermelho/verde claro) em vez de badge redondo
- [x] Bug: Status das mesas não atualiza em tempo real ao adicionar/remover itens da comanda (requer F5)
- [ ] Corrigir agrupamento de itens iguais no carrinho (ex: 5x em vez de 5 cards separados)
- [x] Implementar drag scroll na lista de mesas igual ao da lista de categorias
- [ ] Bug: Botão Desfazer/Limpar não reseta ao trocar de mesa no PDVSlidebar

## Bug Fix: Botão Limpar/Desfazer no PDV Slidebar
- [x] Corrigir bug onde o botão Limpar/Desfazer não resetava ao trocar de mesa

## Alterações na Sidebar do PDV - Labels e Botões
- [x] Trocar label "Consumo" para número da mesa selecionada (ex: "Mesa 3")
- [x] Trocar label "Mesa X" para "Comanda" com ícone de recibo
- [x] Exibir botão "Imprimir" entre "Limpar" e "Fechar conta" ao selecionar Comanda
- [x] Renomear "Finalizar Pedido" para "Fechar conta"

## Separação de visualização entre aba Mesa e aba Comanda
- [x] Aba Mesa: mostrar apenas itens no carrinho (pendentes de envio)
- [x] Aba Comanda: mostrar apenas itens já enviados para preparo (pedidos confirmados)
- [x] Buscar itens da comanda da mesa via API (tabItems)

## Bug: Itens enviados não aparecem na aba Comanda
- [ ] Investigar por que itens enviados para preparo não aparecem na aba Comanda
- [ ] Corrigir a lógica de busca/exibição dos itens da comanda

## Bug: Sidebar fecha após enviar pedido e texto do botão incorreto
- [x] Sidebar não deve fechar após enviar pedido
- [x] Texto do botão deve ser "Enviar pedido" e não "Adicionar à comanda"

## Bug: Pedido não chega na página de pedidos após enviar
- [x] Pedido deve ser enviado tanto para a comanda quanto para a página de pedidos
- [x] Corrigir a lógica de handleFinishOrder para criar o pedido na tabela orders

## Bug: Card da mesa zera itens e valor após enviar pedido
- [x] Card da mesa deve exibir os itens e valor da comanda (tabItems) após enviar o pedido
- [x] Não deve mostrar 0 itens e R$ 0,00 quando há itens na comanda

## Funcionalidade: Excluir mesas no modal Gerenciar Espaços
- [x] Adicionar botão de excluir mesa no modal de Gerenciar Espaços
- [x] Ao excluir mesa, excluir também todos os itens da comanda associados
- [x] Adicionar confirmação antes de excluir

## Bug: Mesa volta a ficar verde após enviar pedido
- [ ] Mesa deve permanecer vermelha (ocupada) enquanto houver itens na comanda
- [ ] Corrigir lógica de status para considerar itens da comanda (tabItems)

## Bug: Mesa volta a ficar verde após enviar pedido
- [x] Mesa deve permanecer vermelha (ocupada) enquanto houver itens na comanda
- [x] Corrigir a lógica de statusCounts para considerar itens da comanda (tabItems)

## Bugs - PDV Slidebar
- [x] Corrigir botões de mesas na barra de atalhos do PDV Slidebar para mostrar status correto (vermelho para mesas com itens na comanda, verde para mesas livres)
- [x] Desabilitar botão Comanda quando mesa estiver livre (sem itens na comanda)
- [x] Corrigir botão Fechar conta na aba Comanda - está desabilitado mesmo com itens na comanda
- [x] Corrigir cálculo do Subtotal/Total na aba Comanda - mostra R$ 0,00 ao invés do valor correto dos itens
- [x] Botão de impressão na aba Comanda deve mostrar opções (impressão normal e múltiplas impressoras Android)
- [x] Reposicionar ícone de impressora ao lado direito do botão de cupom
- [x] Alterar texto do botão de "Fechar conta" para "Fechar Mesa X" na aba Comanda
- [x] Atualizar dropdown de impressão do PDV Slidebar para ter o mesmo formato da página de Pedidos (título "Imprimir" e estrelinhas para favoritar)
- [x] Corrigir botão Comanda que não fica clicável após enviar o pedido
- [x] Corrigir erro 404 na impressão do recibo da comanda no PDV Slidebar
- [x] Atualizar layout do recibo da comanda no PDV Slidebar para usar o mesmo formato profissional da página de Pedidos
- [x] Alterar badge do recibo da comanda de "CONSUMO" para "Mesa X" no PDV Slidebar
- [x] Corrigir botão Fechar Mesa na aba Comanda - mostra "Adicione itens ao pedido" mesmo com itens na comanda

## Modal de Conferência ao Fechar Mesa
- [x] Criar modal de conferência do pedido ao clicar em "Fechar Mesa"
- [x] Usar layout exato do recibo no modal
- [x] Adicionar botão "Confirmar e fechar mesa"
- [x] Adicionar botão "Voltar / Cancelar"
- [x] Implementar impressão automática do recibo ao confirmar (usando impressora favoritada)

## Correção Visual Itens da Comanda
- [x] Remover badge "Pendente" dos itens da comanda no PDV Slidebar
- [x] Restaurar borda vermelha nos itens da comanda como estava antes

## Ícone no Botão Enviar Pedido
- [x] Adicionar ícone da página de pedidos no botão "Enviar pedido" do PDV Slidebar

## Remoção Cabeçalho PDV Slidebar
- [x] Remover cabeçalho vermelho com nome da mesa e descrição "Adicionar itens à comanda"

## Botão Desfazer Temporário
- [x] Implementar botão Desfazer por 10 segundos após clicar em Limpar
- [x] Usar apenas estado local e setTimeout (sem backend)
- [x] Após 10 segundos, voltar automaticamente para Limpar

## Contador Regressivo no Botão Desfazer
- [x] Exibir contador regressivo no texto do botão: Desfazer (10) → Desfazer (1)

## Remoção Linha Consumo no Local
- [x] Remover linha "Consumo no local - Grátis" da slidebar do PDV

## Delay na Abertura do Dropdown de Itens
- [x] Adicionar delay/efeito mais lento na abertura do dropdown dos itens do carrinho

## Correção Impressão Mesa no Pedido
- [x] Corrigir impressão de pedidos da slidebar para mostrar "Mesa X" em vez de "Consumo"
- [x] Corrigir badge preto no topo do recibo para mostrar "MESA X" em vez de "CONSUMO"

## Correção Modal Conferência - Divisores
- [x] Respeitar configuração de "mostrar divisores" no modal de conferência de pedido

## Remoção Card Observações no Recibo de Mesa
- [x] Remover card "OBSERVAÇÕES: Comanda da Mesa X" do recibo de fechamento de mesa

## Correção Botão Desfazer após Enviar Pedido
- [x] Corrigir botão Desfazer que aparece incorretamente após enviar pedido (só deve aparecer ao clicar em Limpar)

## Remoção Campo Número da Mesa no PDV
- [x] Remover campo "Número da mesa" da página de PDV

## Unificação Slidebar PDV em Todas as Páginas
- [x] Verificar diferenças entre a slidebar da página de Mesas e a slidebar das demais páginas
- [x] Unificar para que sejam exatamente iguais (exceto na página /pdv)

## Modal de Conferência no PDV
- [x] Adicionar modal de Conferência do Pedido na página de PDV para Consumo, Entrega e Retirada
- [x] Exibir recibo completo antes de finalizar o pedido
- [x] Botões de Confirmar e Cancelar no modal

## Contador de Tempo nas Mesas Ocupadas
- [ ] Adicionar contador de tempo no canto superior direito do card de mesa
- [ ] Tempo só conta quando mesa está ocupada
- [ ] Formato: 1Min, 1h, 2h40
- [ ] Timer local no frontend baseado no timestamp de ocupação
- [ ] Zerar ao liberar a mesa
- [ ] Manter tempo correto ao recarregar página

## Timer de Ocupação nas Mesas
- [x] Adicionar contador de tempo no canto superior direito dos cards de mesa ocupada
- [x] Formato do timer: 1Min, 1h, 2h40
- [x] Timer só aparece quando mesa tem itens (carrinho ou comanda)
- [x] Timer calcula tempo desde occupiedAt do banco de dados
- [x] Timer atualiza automaticamente a cada minuto no frontend
- [x] Mostrar "—" para mesas sem timestamp de ocupação

## Juntar Mesas (Arrastar e Soltar)
- [ ] Atualizar schema do banco para suportar mesas combinadas (campo mergedWith ou similar)
- [ ] Criar procedure tRPC para juntar mesas (mergeTables)
- [ ] Criar procedure tRPC para separar mesas (splitTables)
- [ ] Implementar drag and drop na lista de mesas (MesasComandas.tsx)
- [ ] Destacar visualmente mesa de destino ao arrastar
- [ ] Unificar itens das mesas ao juntar (carrinho local + comanda do banco)
- [ ] Exibir nome combinado no formato menor-maior (ex: 1-3, 2-5)
- [ ] Ocultar mesas originais após junção, exibir apenas mesa combinada
- [ ] Atualizar sidebar do PDV para mostrar mesa combinada
- [ ] Atualizar atalhos rápidos para mostrar mesa combinada
- [ ] Mesa combinada funciona como mesa normal (adicionar/remover itens, fechar, imprimir)
- [ ] Recibo mostra "Mesa: 1-3" para mesas combinadas
- [ ] Persistir junção após refresh da página
- [ ] Testar cenário: mesa vazia + mesa vazia
- [ ] Testar cenário: mesa vazia + mesa com itens
- [ ] Testar cenário: mesa com itens + mesa com itens


## Juntar Mesas (Arrastar e Soltar) - CONCLUÍDO
- [x] Schema do banco de dados atualizado (mergedIntoId, mergedTableIds, displayNumber)
- [x] Procedures tRPC criadas (merge e split)
- [x] Drag and drop implementado na lista de mesas
- [x] Sidebar e atalhos atualizados para mesas combinadas
- [x] Mesas juntadas ocultadas da lista (só aparece a mesa principal)
- [x] Nome no formato menor-maior (ex: 3-4-5)
- [x] Itens unificados em uma única comanda
- [x] Indicador visual "Mesas unidas" no card


## Bug: Título da Mesa Combinada no PDVSlidebar
- [x] Corrigir título "Mesa 3" para mostrar "Mesa 3-4-5" quando for mesa combinada


## Desfazer Junção de Mesas
- [x] Adicionar botão para separar mesas combinadas
- [x] Restaurar mesas originais ao separar


## Bug: Número da Mesa Combinada nos Pedidos
- [x] Corrigir card do pedido para mostrar "Mesa 2-3-5" em vez de apenas "Mesa 2" para mesas combinadas


## Modal de Conferência de Pedido na Sidebar de Mesas
- [x] Replicar visual do modal de conferência de pedido da página /pdv na sidebar de mesas


## Botão Finalizar Pedido no PDV
- [x] Alterar texto do botão de "Finalizar Pedido" para "Avançar" quando tipo de pedido for Entrega


## Fluxo de Pagamento no Consumo (Mesa) no PDV
- [x] Adicionar etapa de seleção de forma de pagamento antes de finalizar pedido no tipo Consumo (mesa)
- [x] Seguir o mesmo fluxo do tipo Retirada: botão Pagamento → selecionar forma → Finalizar Pedido


## Bug: Modal de Configuração da Aba Duplicado
- [x] Corrigir modal de Configuração da Aba que aparece duplicado (aba atrás da aba)
- [x] PDV: mover botões Mesa e Comanda para a linha do campo de busca, liberando espaço para categorias/atalhos
- [x] PDV: atalhos de mesa full-width acima das duas colunas, descer botões Mesa/Comanda no carrinho
- [x] Mesas: cards de mesa só devem mostrar itens após envio do pedido, não quando adicionados no carrinho do PDV
- [ ] Bug: Cannot update MesasComandas while rendering PDVSlidebar - setState durante render via cartsPerTableUpdated event
- [ ] Impressão: remover info de mesa/comanda, pagamento, obs e cliente da impressão de pedidos de mesa (normal e multi-impressora android)
- [x] Bug: Cannot update MesasComandas while rendering PDVSlidebar - setState durante render (queueMicrotask fix)
- [x] Impressão: remover info de mesa/comanda, pagamento, obs e cliente da impressão de pedidos de mesa (HTML, setor, ESC/POS e texto puro)
- [x] Remover badge "Breve" do menu "Mapa de mesas" na sidebar

## Reserva de Mesas
- [x] Adicionar campo isReserved no schema de tables
- [x] Criar procedure tRPC para reservar/liberar mesa
- [x] Adicionar ícone ⋮ no canto superior direito dos cards de mesa
- [x] Menu dropdown com opção "Reservar mesa" / "Liberar reserva"
- [x] Card reservado: borda azul, badge "Reservada"
- [x] Atualizar filtro de status com contagem de reservadas

## Bug: Atalhos de Mesa no PDV não mostram cor azul para mesas reservadas
- [x] Corrigir atalhos de mesa no PDV Slidebar para exibir cor azul quando mesa está reservada

## Campo Quantidade de Pessoas na Reserva
- [x] Adicionar campo reservedGuests no schema de tables
- [x] Atualizar backend (db.ts e routers.ts) para aceitar reservedGuests
- [x] Adicionar campo "Quantidade de pessoas" no modal de reserva no frontend
- [x] Exibir quantidade de pessoas no card de mesa reservada

## Ajustes Visuais na Reserva de Mesa
- [x] Botão "Mesa X" no PDV Slidebar deve ficar azul quando mesa está reservada
- [x] Mover horário da reserva para o topo do card (ao lado do ⋮) com ícone de relógio, igual ao timer de mesa ocupada

## WhatsApp na Reserva de Mesa
- [x] Criar template padrão "Reserva de Mesa – Confirmação" com variáveis {{mesa}}, {{cliente}}, {{horario}}, {{pessoas}}
- [x] Adicionar template na UI de Configurações → WhatsApp → Templates
- [x] Adicionar toggle "Enviar confirmação de reserva por WhatsApp" em Configurações → Notificações
- [x] Implementar lógica de envio automático no backend ao reservar mesa (se telefone preenchido e toggle ativo)
- [x] Mensagem deve conter aviso sobre atraso e liberação da mesa

## Formatação do Telefone na Reserva
- [x] Alterar campo de telefone no modal de reserva para formato 88 9 9929-0000 (sem parênteses no DDD)

## Bug: Ordenação das Mesas
- [x] Corrigir ordenação das mesas para que novas mesas apareçam na posição correta (ordem numérica crescente) em vez de ficarem no meio das existentes

## Bug: Taxa de Entrega "Grátis" na Sacola Desktop
- [x] Quando taxa é por bairro, não mostrar "Grátis!" na sacola até o bairro ser selecionado (mostrar "A calcular" ou ocultar a linha)

## Badge Grátis para Retirar/Consumir no Local
- [x] Alterar "Retirar no local" e "Consumir no local" na sacola para usar o mesmo badge verde com check do Grátis

## Padronizar Visual de Complementos Globais
- [x] Remover container/card de fundo das listas de complementos
- [x] Usar lista limpa, largura total, igual à página de Categorias
- [x] Mesmo espaçamento, tipografia e hierarquia visual
- [x] Manter ações (editar, preço, toggle) alinhadas à direita

## Borda Vermelha Lateral nos Cards
- [x] Adicionar borda vermelha na lateral esquerda dos cards de Categorias
- [x] Adicionar borda vermelha na lateral esquerda dos cards de Complementos

## Cores Diferentes na Borda de Categorias
- [x] Implementar borda dinâmica por status: verde para ativo, vermelha para pausado

## Borda Dinâmica nos Complementos
- [x] Aplicar borda dinâmica por status nos cards de Complementos (verde=ativo, vermelho=pausado)

## Layout Responsivo da Página de Cupons
- [x] Exibir cupons em grade (grid) no desktop
- [x] Exibir cupons em lista no mobile

## Correções Visuais dos Cards de Cupons
- [x] Remover ícone % duplicado no card de cupom (manter apenas "10% Percentual")
- [x] Tornar detalhes do cupom colapsáveis (dropdown ao clicar no card)

## Filtro de Cupons na Página de Cupons
- [x] Exibir apenas cupons criados manualmente na página de Cupons (excluir cupons de fidelidade)

## Ajuste de Largura dos Cards de Cupons
- [x] Diminuir largura dos cards de cupom no desktop em 25%

## Menu Sidebar
- [x] Remover badge "Breve" do item Cupons no menu lateral

## Página de Campanhas
- [x] Trocar placeholder do campo de telefone para número genérico (11) 9 1234-5678

## Filtros Rápidos de Clientes - Campanhas SMS
- [x] Filtro: clientes que não compram há X dias (campo numérico, baseado no último pedido)
- [x] Filtro: clientes com mais de N pedidos concluídos (campo numérico)
- [x] Filtro: clientes que já usaram cupom (checkbox)
- [x] Filtros combináveis entre si com atualização automática da lista
- [x] Exibir quantidade de clientes filtrados

## Reposicionar Botão Filtros
- [x] Mover botão Filtros para a linha do título Destinatários (final do card header)

## Modelos Sugeridos de SMS
- [x] Botão "Modelos Sugeridos" no card de Mensagem SMS
- [x] Modal com 7 templates pré-definidos de SMS
- [x] Botão "Usar template" em cada card que insere o texto no campo de mensagem

## Ajuste Modal Modelos Sugeridos
- [x] Remover contagem de caracteres do modal de modelos sugeridos
- [x] Mover botão "Usar template" para a linha do título (ao final)

## Correção Template SMS
- [x] Substituir quebras de linha por espaços ao inserir template no campo de mensagem SMS

## Restrição de Emojis no SMS
- [x] Remover emojis de todos os templates de SMS
- [x] Bloquear inserção de emojis no campo de mensagem SMS

## Agendamento de Campanhas SMS
- [x] Criar tabela scheduledCampaigns no schema (data/hora, mensagem, destinatários, status, establishmentId)
- [x] Criar db helpers para CRUD de campanhas agendadas
- [x] Criar procedures tRPC para agendar, listar e cancelar campanhas
- [x] Implementar job periódico no servidor para disparar campanhas no horário agendado
- [x] Botão "Agendar campanha" ao lado do "Disparar SMS" na UI
- [x] Modal de agendamento com seletor de data/hora
- [x] Listagem de campanhas agendadas com status (pendente, enviada, cancelada)

## Filtro de Caracteres GSM 7-bit no SMS
- [x] Restringir campo de mensagem SMS para aceitar apenas caracteres GSM 7-bit (letras sem acento, números, espaço e especiais: !@"#$%&'()*+,-./:;<=>?_)

## Atualização Custo SMS
- [x] Alterar custo por SMS de R$ 0,10 para R$ 0,097

## Remoção Badge Breve - Campanhas
- [x] Remover badge "Breve" e estado disabled do item Campanhas no menu lateral

## Renomear Botão Campanhas
- [x] Alterar texto do botão "Disparar SMS" para "Enviar campanha"

## Renomear Botão Agendar
- [x] Alterar texto do botão "Agendar campanha" para "Agendar"

## Atualização Automática do Saldo SMS
- [x] Atualizar saldo automaticamente na UI após envio imediato de campanha (sem precisar recarregar a página)
- [x] Melhorar feedback visual: toast mostra custo debitado no envio imediato e informa que saldo será debitado no envio para agendamentos

## Recarga de Saldo SMS via Stripe
- [x] Adicionar feature Stripe ao projeto (webdev_add_feature)
- [x] Configurar credenciais Stripe (API keys)
- [x] Criar procedures tRPC para criar sessão de checkout Stripe
- [x] Criar webhook para processar pagamento confirmado e creditar saldo
- [x] Criar modal de recarga na página de Campanhas com opções de valor
- [x] Criar página de callback sucesso/cancelamento
- [x] Atualizar saldo em tempo real via SSE após pagamento confirmado
- [x] Escrever testes

## Correção Webhook Stripe
- [x] Corrigir endpoint /api/stripe/webhook que retorna timeout
- [x] Garantir express.raw() ANTES de express.json()
- [x] Retornar HTTP 200 com { verified: true } para todos os cenários

## UI Card Saldo - Recarregar
- [x] Remover botão "Recarregar" separado do card de saldo
- [x] Transformar ícone de carteira em botão clicável com texto "Recarregar"

## Remover Pacote 50 SMS
- [x] Remover pacote de 50 créditos SMS do modal de recarga

## Correção Modal Recarga SMS
- [x] Corrigir caracteres Unicode escapados (créditos, confirmação, Cartão, etc.)
- [x] Corrigir cor do texto de segurança de azul para emerald (verde)

## Recarga Personalizada SMS
- [x] Criar procedure backend para checkout com valor personalizado
- [x] Adicionar opção de valor personalizado no modal de recarga (input de valor em R$)
- [x] Calcular quantidade de SMS automaticamente com base no valor inserido
- [x] Validar valor mínimo (R$ 1,00) e máximo (R$ 1.000,00)

## Formatação Moeda no Campo Personalizado
- [x] Implementar formatação de moeda brasileira no input (digitar 100 = 1,00, digitar 1000 = 10,00)

## Dados do Cliente na Retirada (PDV)
- [x] Adicionar campo "Nome do cliente" (obrigatório) na sidebar de pagamento para retirada
- [x] Adicionar campo "Telefone" (opcional) com máscara (00) 00000-0000
- [x] Validar que nome é obrigatório antes de finalizar pedido de retirada

## Placeholder Grupo Complementos
- [x] Alterar placeholder do nome do grupo para "Nome do grupo, ou pergunta (ex: Adicionais ou Deseja colher?)"

## Bug: Valor de débito SMS incorreto no toast
- [x] Verificar se o valor debitado por SMS é R$ 0,10 ou R$ 0,097
- [x] Corrigir cálculo e/ou exibição do toast para mostrar valor correto (R$ 0,097)

## Stripe Connect - Pagamento Online no Menu Público
- [x] Adicionar campo stripeAccountId no schema de establishments
- [x] Adicionar campo onlinePaymentEnabled no schema de establishments
- [x] Criar endpoint para criar connected account (Stripe Connect V2)
- [x] Criar endpoint para gerar account link (onboarding)
- [x] Criar endpoint para verificar status da connected account
- [x] Criar endpoint para checkout session com destination charge (1,5% taxa)
- [x] Expandir webhook para processar pagamentos de pedidos online
- [x] Adicionar UI de ativação de pagamento online nas Configurações do restaurante
- [x] Adicionar opção de pagamento com cartão no menu público (apenas Entrega)
- [x] Criar pedido automaticamente após pagamento confirmado via webhook
- [x] Testes unitários para Stripe Connect

## Taxa da plataforma Stripe Connect
- [x] Alterar taxa da plataforma de 1,5% para 4,6%
- [x] Alterar taxa da plataforma de 4,6% para 4,3%
- [x] Alterar taxa da plataforma de 4,3% para 3,99% + R$ 1,00 fixo por transação
- [x] Alterar taxa fixa da plataforma de R$ 1,00 para R$ 0,89 por transação
- [x] Exibir banner de taxas destacado no topo da seção Pagamento Online
- [x] Adicionar reforço de taxa próximo ao toggle de ativar/desativar
- [x] Incluir mini exemplo de cálculo (R$ 100 → R$ 4,88)
- [x] Atualizar card 'Como funciona' com taxa correta
- [x] Renomear botão "Abrir Dashboard Stripe" para "Gestão de Pagamentos"
- [x] Remover texto extra e exemplos do card de taxas
- [x] Remover card "Como funciona"
- [x] Renomear título do card de taxas para "Pagamento online | Cartão"
- [x] Remover bullet "Não se aplica a pagamentos em dinheiro, Pix ou cartão presencial"
- [x] Remover banner amarelo de taxas de pagamento online
- [x] Ajustar layout de "Cobranças ativas" e "Repasses ativos" para ficarem lado a lado próximos
- [x] Dropdown no botão Cartão do menu público com "Trazer maquininha" e "Pagar online" quando Pagamento Online ativado
- [x] Manter comportamento atual do botão Cartão quando Pagamento Online desativado
- [x] Card "Pagar online" com ícone de segurança Stripe como já existe
- [x] Remover container "Pagamento online seguro" ao selecionar Pagar online
- [x] Alterar exibição de card_online nos recibos para "Pagamento confirmado – Cartão online" (impressão normal e múltiplas impressoras Android)
- [x] Alterar exibição de card_online nos recibos para "Pagamento confirmado – Cartão online" (impressão normal e múltiplas impressoras Android)
- [x] Reestruturar fluxo: não enviar pedido até pagamento online ser confirmado
- [x] Modal "Aguardando pagamento" com polling de status
- [x] Opção de tentar pagar novamente ou mudar forma de pagamento no estado aguardando
- [x] Pedido só é criado após confirmação do webhook de pagamento
- [x] Bug: Pedido não é criado após pagamento online confirmado (sem notificação WhatsApp e sem aparecer na página de pedidos)
- [x] Criar tabela pending_online_orders para salvar dados do pedido antes do checkout
- [x] Salvar dados do pedido no banco ao criar checkout session (em vez de metadata)
- [x] Webhook busca dados do pedido no banco por session_id (em vez de metadata)
- [x] Frontend polling retorna número do pedido após confirmação
- [x] Bug: Botão "Escolher outra forma de pagamento" volta para Confirmar Endereço em vez de Tipo de Entrega (fluxo 2)

## Reestruturação do Fluxo de Checkout (5 → 4 steps)
- [x] Remover step 1 (Resumo do Pedido) do fluxo de checkout
- [x] Mover conteúdo do resumo (itens, observação) para o step de Confirmar Endereço (agora step 2 - Resumo do Pedido)
- [x] Atualizar indicador de progresso de 5 para 4 steps
- [x] Atualizar labels dos steps: 1-Entrega, 2-Resumo, 3-Dados, 4-Enviar
- [x] Atualizar títulos dos modais para novo fluxo
- [x] Remapear todas as referências de setCheckoutStep para novos números
- [x] Ajustar botão Voltar no header do modal
- [x] Testar fluxo completo de checkout com 4 steps
- [x] Bug: Botão "Alterar" forma de entrega fecha o modal quando taxa é grátis (free) - impede trocar para retirada/consumo no local
- [x] Bug: Quando taxa é byNeighborhood e nenhum bairro selecionado, "Selecionar bairro" deve aparecer dentro do campo Bairro (não como botão separado)
- [x] Bug: Campo telefone no step Seus Dados permite avançar com apenas 2 dígitos - deve formatar como (XX) X XXXX-XXXX e só avançar quando completo
- [x] Bug: Após enviar pedido, novo pedido mostra tela de confirmação do pedido anterior (orderSent não é resetado ao iniciar novo checkout)
- [x] Remover delay de 3 segundos no envio do pedido no step Confirmação
- [x] Mostrar card "Aceitar pagamento online" sempre visível abaixo do Stripe Connect, com toggle desativado/não clicável quando Stripe não configurado
- [x] Mostrar número do pedido no título do modal de Acompanhar Pedido (ex: Acompanhar Pedido #P32)
- [x] Remover cards de Consumo e Cliente do modelo do recibo ao fechar mesa
- [x] Adicionar controles de edição nos itens da comanda: aumentar/diminuir quantidade, editar, excluir com confirmação (estilo dropdown expandível)
- [ ] Substituir ícone do card Suporte via WhatsApp na página /ajuda pelo ícone WhatsApp fornecido (manter círculo verde) — CANCELADO pelo usuário, revertido ao ícone original
- [x] Reduzir tamanho dos botões de controle (+/-/lixeira) nos itens da comanda de 32px para 25px
- [x] Ocultar cards de Ticket Médio e Faturamento na versão mobile da página de Mesas (exibir apenas no desktop)
- [x] [Mobile Mesas] Criar componente MobilePDVModal (bottom sheet 90vh) com cabeçalho Mesa X, resumo (itens, tempo, valor total)
- [x] [Mobile Mesas] Implementar busca de produtos com pré-visualização no modal mobile
- [x] [Mobile Mesas] Implementar modal bottom sheet de detalhes do item com complementos (mesmo estilo menu público)
- [x] [Mobile Mesas] Implementar lista de itens da mesa com controles de quantidade e remoção
- [x] [Mobile Mesas] Integrar: no mobile abrir MobilePDVModal ao clicar no card da mesa, no desktop manter PDVSlidebar
- [x] [Mobile Mesas] Remover no mobile: lista de categorias horizontal, atalho rápido de mesas, layout grade desktop
- [x] [Mobile Mesas] Implementar ações: enviar pedido, limpar, fechar mesa no modal mobile
- [x] [Mobile Mesas] Corrigir altura do MobilePDVModal para max-height 90vh (estava ocupando 100% da tela)
- [x] [Mobile Mesas] Ajustar estilo do MobilePDVModal para ficar igual aos bottom sheets do menu público (cantos, sombra, header com ícone)
- [x] [Mobile Mesas] Copiar exatamente o modal de detalhes do item do menu público para o MobilePDVModal (mesmo footer com botões quantidade e Adicionar)
- [x] [Mobile Mesas] Remover fotos dos itens na lista de resultados da busca (exibir foto apenas no modal de detalhes)
- [x] [Mobile Mesas] Botão + na busca: adicionar item direto ao carrinho sem modal de detalhes. Só abrir modal se item tiver complementos.
- [x] [Mobile Mesas] Mover botões de criar mesa (+) e gerenciar espaços (engrenagem) para ao lado do campo de busca no mobile
- [x] [Mobile Mesas] Melhorar busca no MobilePDVModal: usar dropdown/overlay flutuante igual menu público, ocultar footer quando buscando, maximizar espaço para resultados com teclado aberto
- [x] [Mobile Mesas] Alterar MobilePDVModal para tela cheia (100vh) ao invés de bottom sheet 90vh, manter botão de fechar
- [x] [Mobile Mesas] Simplificar header do MobilePDVModal: remover resumo (itens, tempo, valor) e exibir apenas "Mesa X | R$ XX,XX" no título
- [x] [Mobile Mesas] Remover fotos dos itens na lista do carrinho/comanda e usar estilo desktop: card com borda vermelha, badge quantidade (ex: 1x), nome e preço
- [x] [Mobile Mesas] Na aba Consumo, itens do carrinho devem aparecer no mesmo estilo da aba Comanda (card com borda vermelha, badge quantidade, nome e preço) em vez de misturar com resultados de busca
- [x] [Mobile Mesas] Busca no MobilePDVModal deve ignorar acentos (ex: digitar "agua" deve encontrar "Água")
- [x] [Mobile Mesas] Botões de espaços devem ficar em linha horizontal com scroll lateral (arrastar) no mobile, sem quebra de linha
- [x] [Menu Público] Cabeçalho do modal Meus Pedidos deve ficar igual ao da Conferência do Pedido (fundo vermelho gradiente, ícone, texto branco, botão X)
- [x] [Menu Público] Aplicar cabeçalho vermelho gradiente no modal Sua Sacola
- [x] [Menu Público] Aplicar cabeçalho vermelho gradiente no modal Selecione seu Bairro
- [x] [Menu Público] Aplicar cabeçalho vermelho gradiente no modal Categorias
- [x] [Menu Público] Aplicar cabeçalho vermelho gradiente no modal Entrega e Pagamento
- [x] [Menu Público] Aplicar cabeçalho vermelho gradiente no modal Resumo do Pedido
- [x] [Menu Público] Aplicar cabeçalho vermelho gradiente no modal Seus Dados
- [x] [Menu Público] Aplicar cabeçalho vermelho gradiente no modal Confirmação
- [x] [Menu Público] Aplicar cabeçalho vermelho gradiente no modal Aplicar Cupom
- [x] [Menu Público] Aplicar cabeçalho vermelho gradiente no modal Acompanhar Pedido
- [x] [Menu Público] Aplicar cabeçalho vermelho gradiente no modal Informações
- [x] [Menu Público] Aplicar cabeçalho vermelho gradiente no modal Como Chegar
- [x] [Menu Público] Aplicar cabeçalho vermelho gradiente no modal Avaliações
- [x] [Menu Público] Itens do carrinho no modal Sua Sacola devem ter borda vermelha na lateral esquerda igual aos itens do menu público
- [x] [Menu Público] Aplicar borda vermelha na lateral esquerda dos itens no Resumo do Pedido (step 2 do checkout)
- [x] [Menu Público] Botão de pagar online no modal de confirmação deve ser na cor vermelha
- [x] [SMS] Remover pacote de 1000 SMS do modal de recarregar saldo SMS
- [x] [Menu Público] Sugestões de troco dinâmicas baseadas no valor do pedido (arredondar para cima ao múltiplo de 10)
- [x] [Trial] Adicionar campo trialStartDate no schema do banco de dados
- [x] [Trial] Migrar banco de dados com pnpm db:push
- [x] [Trial] Implementar lógica de cálculo de dias restantes no backend
- [x] [Trial] Expor dados de trial via tRPC (dias restantes, se está em trial)
- [x] [Trial] Badge no dashboard ao lado de "Ver menu" mostrando dias restantes do trial
- [x] [Trial] Popover ao clicar no badge com texto e botão "Fazer upgrade agora"
- [x] [Trial] Badge visível apenas para usuários em trial
- [x] [Trial Expirado] Modal obrigatório de upgrade quando trial expira (sem fechar com ESC ou clique fora)
- [x] [Trial Expirado] Guard de rotas: bloquear todas as páginas exceto /planos quando trial expirado
- [x] [Trial Expirado] Fechar menu público automaticamente quando trial expira
- [x] [Trial Expirado] Reabrir menu público automaticamente após pagamento
- [x] [Trial Expirado] Liberar todas as ações e remover bloqueio após pagamento
- [x] [Trial Expirado] Testes vitest para bloqueio de trial expirado
- [x] [Trial Expirado] Redesign do modal com estilo degradê vermelho da marca (glassmorphism)
- [x] [Admin] Schema: tabela admin_users com role, email, password hash
- [x] [Admin] Seed: criar admin inicial (admin@admin.com)
- [x] [Admin] Backend: autenticação admin (login/logout/me) com JWT separado
- [x] [Admin] Backend: router admin dashboard (stats: novos cadastros, trials, pagos, expirados)
- [x] [Admin] Backend: router admin restaurantes (listar, detalhes, alterar plano, bloquear, reabrir menu, resetar trial)
- [x] [Admin] Backend: router admin planos (CRUD de planos)
- [x] [Admin] Backend: router admin trials (listar ativos, vencendo, expirados, ações)
- [x] [Admin] Frontend: página login admin (/admin/login)
- [x] [Admin] Frontend: layout admin com sidebar (mesmo estilo dashboard restaurante)
- [x] [Admin] Frontend: dashboard admin com 4 cards clicáveis
- [x] [Admin] Frontend: página Restaurantes (listagem + detalhes + ações)
- [x] [Admin] Frontend: página Planos (CRUD)
- [x] [Admin] Frontend: página Trials (visão rápida + ações)
- [x] [Admin] Rotas no App.tsx e guard de autenticação admin
- [x] [Admin] Testes vitest para routers admin
- [x] [Bug] Admin login não redireciona para dashboard - fica na página de login após logar
- [x] [Admin] Backend: endpoint de relatórios (total restaurantes, receita mensal, taxa conversão, ativos, distribuição status, receita anual, ticket médio, churn rate)
- [x] [Admin] Frontend: página Relatórios com 4 KPI cards no topo
- [x] [Admin] Frontend: gráfico donut Distribuição por Status (Ativos vs Em Teste)
- [x] [Admin] Frontend: cards Receita Anual Projetada, Ticket Médio, Churn Rate
- [x] [Admin] Rota /admin/relatorios e link na sidebar
- [x] [Bug] Página Relatórios admin sem sidebar (AdminPanelLayout)
- [x] [Dashboard] Backend: atualizar endpoints de métricas para aceitar parâmetro de período (today, week, month)
- [x] [Dashboard] Frontend: adicionar filtro de período (Hoje, Esta semana, Este mês) no topo da Dashboard
- [x] [Dashboard] Conectar filtro aos endpoints para atualizar todos os cards e métricas
- [x] [Dashboard] Backend: calcular dados do período anterior para comparação
- [x] [Dashboard] Backend: retornar variação percentual (ordersChange, revenueChange, avgTicketChange)
- [x] [Dashboard] Frontend: exibir indicador de variação % em cada card com seta e cor (verde/vermelho)
- [x] [Dashboard] StatCard: indicador % ao lado do valor (não abaixo), apenas seta + %, tooltip com info completa
- [x] [Dashboard] Indicador neutro com traço (—) quando variação é 0%
- [x] [Dashboard] Animação fade-in nos valores dos cards ao trocar filtro de período
- [x] [Bug] Cards Acumulado da semana e Visualizações do Cardápio não respondem ao filtro de período
- [x] [Dashboard] Card Acumulado: Hoje/Semana mostra dias (Seg-Dom), Mês mostra últimos 6 meses
- [x] [Dashboard] Visualizações do Cardápio responde a todos os filtros de período
- [x] [Bug] Card Visualizações do Cardápio mostra 0 quando filtro Hoje está selecionado
- [x] [Schema] Adicionar campo timezone (IANA) à tabela establishments com default America/Sao_Paulo
- [x] [Backend] Criar helper centralizado de timezone que lê do estabelecimento
- [x] [Backend] Refatorar todos os locais com timezone hardcoded (America/Sao_Paulo, -03:00) para usar timezone do restaurante
- [x] [UI] Adicionar campo "Fuso horário do restaurante" no card Horários de funcionamento em Configurações
- [x] [Backend] Procedure para atualizar timezone do estabelecimento
- [x] [Testes] Escrever testes para o helper de timezone e procedures

## Detecção Automática de Fuso Horário
- [x] [Frontend] Detectar timezone do navegador via Intl.DateTimeFormat ao criar conta
- [x] [Backend] Aceitar timezone como parâmetro na criação do estabelecimento
- [x] [Backend] Mapear timezone IANA do navegador para o timezone mais próximo suportado
- [x] [Testes] Escrever testes para o mapeamento de timezone
- [x] [Mesas] Remover cards de Ticket Médio e Faturamento da página de Mesas
- [x] [Dashboard] Adicionar card "Taxa de conversão" (pedidos/visualizações × 100) com filtro de período
- [x] [Dashboard] Card deve exibir % principal, subtexto "X pedidos / Y visualizações", e variação vs período anterior
- [x] [Dashboard] Posicionar card ao lado do card Itens em Falta e reduzir largura deste em 25%
- [x] [Backend] Criar endpoint para calcular taxa de conversão por período
- [x] [Testes] Escrever testes para o endpoint de taxa de conversão
- [x] [Dashboard] Mover subtexto do card Taxa de Conversão para tooltip no hover
- [x] [Dashboard] Diminuir largura do card Itens em Falta em 25%
- [x] [Dashboard] Adicionar ícone (i) ao lado do título Taxa de Conversão com tooltip no hover
- [x] [Bug] Tooltip do card Taxa de Conversão cortado pelo overflow-hidden do card
- [x] [Admin] Alterar senha do /admin/login para 290819943
- [x] [Login] Alterar placeholder do campo de senha de pontinhos para "Sua senha"
- [x] [Bug] Lembrar-me no login não salva email/senha no localStorage
- [x] [Criar Conta] Alterar placeholders dos campos de senha de pontinhos para texto
- [x] [Dashboard] Adicionar ícone da sidebar ao lado do título da página Dashboard

- [x] Cor do ícone Dashboard deve ser azul (não vermelho)
- [x] Adicionar ícone azul no título da página Pedidos
- [x] Adicionar ícone azul no título da página Mapa de Mesas
- [x] Adicionar ícone azul no título da página Cardápio
- [x] Adicionar ícone azul no título da página Categorias
- [x] Adicionar ícone azul no título da página Complementos
- [x] Adicionar ícone azul no título da página Cupons
- [x] Adicionar ícone azul no título da página Campanhas
- [x] [Bug] Fechamento de mesa não reflete no card Faturamento Hoje e Ticket Médio da Dashboard
- [x] Modal informativo WhatsApp na página de Pedidos (conectar WhatsApp para notificações automáticas)
- [x] Substituir 3 cards do modal WhatsApp por card visual de conversa WhatsApp
- [x] Botão Conectar WhatsApp do modal deve abrir modal QR Code em vez de redirecionar
- [x] Carrossel animado no balão do modal WhatsApp alternando entre modelos de notificação (recebido, preparo, entrega)
- [x] Notificação "Finalizado" (entregue/retirado) deve vir ativada por padrão ao criar conta
- [x] Notificação "Confirmação de Reserva" deve vir ativada por padrão ao criar conta
- [x] Alterar template padrão do pedido finalizado para novo texto com emojis
- [x] Mostrar divisores deve vir desativado por padrão ao criar conta (configurações de layout impressora)
- [x] Adicionar informação de Apple Pay na seção de Pagamento Online das Configurações
- [x] [Bug] Abertura manual da loja no admin não reflete no menu público (continua mostrando Fechado)
- [x] [Bug] Toggle de abrir/fechar loja sem cor visual (deve ser verde quando aberto, vermelho quando fechado)
- [x] [Bug] Validação do campo WhatsApp no Step 1 do onboarding permite continuar com número incompleto

## Badge Customizável nos Complementos
- [x] Adicionar campo badgeText no schema de complements
- [x] Atualizar backend (db.ts e routers.ts) para suportar badgeText
- [x] Adicionar campo de texto no catálogo admin para definir badge do complemento
- [x] Exibir badge vermelho pulsante no menu público ao lado do nome do complemento
- [x] Testes unitários para badge de complementos

## Edição de Nome de Complemento
- [x] Criar função no backend para renomear complemento em todos os grupos/produtos
- [x] Adicionar campo editável de nome na página /complementos
- [x] Propagar renomeação para todos os produtos que usam o complemento
- [x] Testes unitários para renomeação de complemento

## Bugs Layout Menu Público
- [x] [Bug] Botão Adicionar e controles +/- ficam muito para baixo quando item tem muitos complementos no modal de detalhes
- [x] [Bug] Backend rejeita pedido dizendo "fechado" mesmo quando menu público e admin mostram "aberto" (estabelecimento 871095)

## Endereço do Estabelecimento
- [x] Remover obrigatoriedade dos campos Nº, Bairro, Cidade, UF e CEP (apenas Rua obrigatório)
- [x] [Bug] Ao salvar endereço com campos vazios, os valores antigos voltam a preencher os campos
- [x] [Bug] Alterações de preço dos complementos na página /complementos não são salvas no banco de dados
- [x] [Bug] Corrigir preços errados dos complementos no banco (200.00 → 2.00, 300.00 → 3.00, 400.00 → 4.00) no estabelecimento 150004

## Dark Mode
- [x] Configurar variáveis CSS do tema escuro no index.css (tokens de cor)
- [x] Implementar toggle de tema (light/dark) alternável
- [x] Ajustar cores hardcoded nos componentes da Dashboard (cards, gráficos, badges)
- [x] Ajustar sidebar e topbar para dark mode
- [x] Ajustar gráficos (gridlines, cores) para boa leitura em fundo escuro
- [x] Garantir contraste adequado e estados (hover, ativo, desabilitado, loading/skeleton)
- [x] Testar em todas as páginas principais

## Toggle de Tema no Menu de Perfil
- [x] Remover botão de toggle de tema da topbar
- [x] Adicionar seção "Tema" no menu dropdown do perfil (abaixo de Planos)
- [x] Exibir "Modo Escuro" ou "Modo Claro" com ícone e indicador "Ativado"

## Bugs - Templates de Mensagem
- [x] [Bug] Mensagem de novo pedido (com saudação e itens) não é enviada ao cliente - apenas a mensagem de 'preparing' é recebida (logs detalhados adicionados para monitorar)

## Variáveis de Template WhatsApp - Pronto
- [x] Separar {{deliveryMessage}} para ser exclusivamente delivery (entregador a caminho)
- [x] Criar nova variável {{pickupMessage}} para retirada e consumo no local
- [x] Adicionar novo campo de template na seção "Pronto" para mensagem de retirada/consumo no local
- [x] Atualizar lógica de substituição no uazapi.ts

## PDV - Salvar e Reaproveitar Dados de Clientes
- [x] Criar tabela pdvCustomers no banco (telefone como chave, vinculado ao estabelecimento)
- [x] Criar endpoint tRPC para buscar cliente por telefone
- [x] Criar endpoint tRPC para salvar/atualizar cliente
- [x] Integrar busca automática no campo telefone do PDV (entrega e retirada)
- [x] Preencher automaticamente nome e endereço quando cliente encontrado
- [x] Salvar/atualizar dados do cliente ao finalizar pedido no PDV
- [x] Campos permanecem editáveis após preenchimento automático
- [x] [Bug] Máscara de telefone na retirada do PDV formata incorretamente (88) 9 99290-000 em vez de (88) 9 9929-0000 (corrigido também no campo de entrega)
- [x] [Bug] Filtro de busca na página /catalogo (Cardápio) não filtra pelo nome dos produtos/itens
- [x] Ocultar templates de notificações WhatsApp desativadas na aba de Templates (ex: se "Preparando" está desativado, não exibir o template de "Preparando")
- [x] Card "Completos" na página /pedidos deve mostrar apenas pedidos do dia atual (limpeza automática à 00:00 respeitando timezone do restaurante)
- [x] Busca global na topbar: filtrar conteúdo relevante em cada página (mesas, catálogo, categorias, complementos, pedidos, cupons, campanhas)
- [x] Remover auto-minimização da sidebar ao clicar em PDV, Mapa de Mesas e Pedidos
- [x] [Bug] Corrigir tema escuro na sacola/painel direito da página PDV (fundo branco no modo dark)

## Isolamento de Tema - Menu Público vs Admin
- [x] Isolar tema do menu público do tema do admin (modo escuro do admin não deve afetar menu público)
- [x] Menu público deve manter tema claro padrão sempre, independente do modo escuro do admin
- [x] Não compartilhar variáveis/tokens de tema entre admin e menu público

## Bug - Tema Escuro na Página de Mesas
- [x] Corrigir tema escuro no painel central de produtos da página de Mesas (fundo branco no modo dark)
- [x] Corrigir tema escuro na sacola/painel direito da página de Mesas
- [x] Corrigir tema escuro nos cards de produtos, barra de categorias e campo de busca

## Bug - Tema Escuro no PDV Embutido nas Mesas
- [x] Corrigir tema escuro na sidebar do PDV embutido na página de Mesas (painel de produtos, categorias, busca e sacola)

## Transição Suave ao Alternar Tema
- [x] Aplicar transition-colors no <html> para mudança de tema mais fluida

## Auditoria Tema Escuro - Páginas Restantes
- [x] Corrigir cores hardcoded na página de Pedidos
- [x] Corrigir cores hardcoded na página de Categorias
- [x] Corrigir cores hardcoded na página de Cupons
- [x] Corrigir cores hardcoded na página de Campanhas
- [x] Corrigir cores hardcoded na página de Configurações
- [x] Auditoria global em massa: 462+ substituições em 30+ ficheiros (páginas, componentes, admin)

## Bug - Estilo Seleção Configurações no Modo Escuro
- [x] Corrigir estilo de seleção na barra secundária de Configurações para ficar igual ao estilo da sidebar principal no modo escuro

## Bug - Tema Escuro nos Templates WhatsApp
- [x] Corrigir tema escuro na secção de WhatsApp Templates (Editor de Mensagens) - cards, variáveis, textarea e botões de status

## Bug - Tema Escuro no Card de Entrega do PDV
- [x] Corrigir tema escuro no card de endereço de entrega (fundo claro/bege no modo dark)
- [x] Adicionar dark variants a todos os bg-red-50, bg-blue-50, bg-amber-50, hover:bg-red-50 no PDV

## Bug - Tema Escuro nos Cards de Estado Vazio dos Pedidos
- [x] Corrigir tema escuro nos cards de estado vazio (Novos, Preparo, Prontos) na página de Pedidos - fundos claros no modo dark
- [x] Adicionar dark variants a todos os bg-*-50, bg-*-100, border-*-200 e text-*-700/800 nos Pedidos

## Bug - Tema Escuro nos Cupons (ícones e badges)
- [x] Corrigir tema escuro nos ícones de status, badges e elementos restantes na página de Cupons

## Bug - Tema Escuro nos Cards de Pagamento Online (Configurações)
- [x] Corrigir tema escuro nos cards de Stripe Connect e Aceitar Pagamento Online na secção Pagamento Online das Configurações
## Bug - Tema Escuro na Página de Campanhas
- [x] Corrigir tema escuro no modal de Recarregar Saldo SMS e outros elementos com cores claras na página de Campanhas

## Ajustes de UI
- [x] Remover badge "Breve" do menu Ajuda e Suporte na sidebar
- [x] Ajustar botões Mensal/Anual na página de Planos para seguir o mesmo estilo dos filtros da Dashboard (Hoje/Esta semana/Este mês)
- [x] Igualar a cor de fundo da sidebar principal do menu à cor da sidebar de Configurações
- [x] Corrigir tooltips dos cards Visualizações do Cardápio e Acumulado da semana no dark mode da Dashboard
- [x] Renomear plano Básico para Essencial (R$ 79,90) e colocar preço do Pro como R$ --,-- em todos os locais
- [x] Limpar dados mockados do Histórico de Pagamentos na página de Planos
- [x] Atualizar textos das features dos planos Gratuito e Essencial na página de Planos
- [x] Remover badge do menu Planos no dropdown do perfil
- [x] Adicionar ícone no cabeçalho da página Ajuda e Suporte (igual às demais páginas)
- [x] Adicionar ícone no cabeçalho da página Planos (igual às demais páginas)
- [x] Adicionar features "Campanhas SMS" e "Cupons de desconto" ao plano Essencial
- [x] Adicionar feature "Programa de fidelidade" ao plano Pro
- [x] Corrigir menu público herdando dark mode do admin quando aberto na mesma aba do navegador
- [x] Corrigir card de Confirmação via Botões na secção WhatsApp das Configurações no dark mode
- [x] Corrigir toggle do Programa de Fidelidade quase invisível no dark mode
- [x] Corrigir badge de Avaliação gratuita: 15 dias com cores claras no dark mode
- [x] Toggle de som deve ficar vermelho quando desativado no dark mode
- [x] Forçar tema light nas telas públicas (Login, Cadastro, Onboarding) - nunca herdar dark mode do admin
- [x] Corrigir checkout de planos para usar mode: subscription com renovação automática mensal/anual

## Bug: Herança indevida de tema no /admin
- [x] Forçar tema LIGHT fixo em todas as rotas /admin (AdminPanelLayout + AdminLogin)
- [x] Garantir que /admin nunca herda dark mode do restaurante, menu público ou localStorage

## Limpeza automática de pedidos finalizados
- [x] Verificar se a limpeza automática às 00:00 (timezone do restaurante) está ativa no código
- [x] Confirmar que a lógica é exclusivamente visual (front-end), sem remover dados do banco
- [x] Não foi necessário reimplementar - funcionalidade está ativa

## Limpeza diária de pedidos cancelados
- [x] Aplicar mesma lógica de limpeza diária (00:00 timezone do restaurante) à coluna de Cancelados

## WhatsApp com submenus nas Configurações
- [x] Transformar WhatsApp em menu pai com submenus: Notificações e Templates
- [x] Submenu Notificações: conteúdo atual de notificações automáticas
- [x] Submenu Templates: nova aba para templates de mensagens

## Limpeza manual de pedidos via ícone do card
- [x] Ao clicar no ícone do card Completos, limpar visualmente os pedidos da coluna
- [x] Ao clicar no ícone do card Cancelados, limpar visualmente os pedidos da coluna
- [x] Limpeza apenas visual (front-end), sem apagar dados do banco

## Card de avaliação gratuita - versão mobile compacta
- [x] No mobile: mostrar apenas ícone de relógio + quantidade de dias restantes
- [x] Ao clicar no card no mobile: expandir e mostrar texto completo
- [x] Desktop: manter comportamento atual

## Bug: Limpeza manual de pedidos não persiste após refresh
- [x] Persistir limpeza manual no localStorage para sobreviver ao refresh da página
- [x] Reset automático à meia-noite (timezone do restaurante)

## Animação pulse no badge de trial
- [x] Adicionar animação pulse no badge quando restarem menos de 3 dias de trial

## Bug: Pedido finalizado não aparece no card Completos após limpeza manual
- [x] Ao finalizar pedido, resetar limpeza manual do card Completos para que o novo pedido apareça
- [x] Mesma lógica para Cancelados: ao cancelar pedido, resetar limpeza manual do card Cancelados

## Página de Avaliações do Restaurante
- [x] Schema: adicionar campo de resposta (responseText, responseDate) na tabela de avaliações
- [x] Backend: procedures tRPC para listar avaliações, métricas e responder
- [x] Frontend: página de Avaliações com cards de métricas no topo
- [x] Frontend: lista de avaliações com nota, nome, comentário, data, status
- [x] Frontend: botão Responder com campo de texto inline/modal
- [x] Frontend: resposta pública visível junto da avaliação
- [x] Sidebar: reorganizar Cardápio como submenu de Menu (Menu > Cardápio, Avaliações)
- [x] Badge: contador de avaliações pendentes no menu lateral
- [x] Destaque visual para avaliações negativas (1-2 estrelas)

## Controle de Avaliações (Toggle Ativar/Desativar)
- [x] Schema: adicionar campo reviewsEnabled (boolean) e fakeReviewCount na tabela establishments
- [x] Configurações > Estabelecimento: card "Avaliações do Restaurante" com toggle
- [x] Menu público (desativado): nota fixa 5.0, quantidade fake, sem modal de avaliações
- [x] Menu público (desativado): ocultar modal de avaliação pós-pedido entregue
- [x] Admin (desativado): ocultar menu Avaliações no sidebar e badge
- [x] Admin (desativado): bloquear acesso à página /avaliacoes com mensagem
- [x] Backend: impedir criação de avaliações quando desativado

## Resposta do restaurante no modal de avaliações do menu público
- [x] Exibir resposta do restaurante junto da avaliação no modal do menu público
- [x] Visual da resposta: nome do restaurante, texto da resposta, data

## Ajuste visual dos cards de Avaliações
- [x] Ajustar cards de métricas da página Avaliações para seguir mesmo estilo do Dashboard (borda colorida topo, sem sombra)

## Redesign do card de avaliação na página Avaliações
- [x] Redesenhar ReviewCard: pedido+data no topo, nota+estrelas, comentário do cliente com nome+data, área de resposta
- [x] Remover seção "O que pode melhorar"
- [x] Implementar tabela em lista de avaliações (Pedido, Data, Nota, Comentário, Status) conforme design de referência
- [x] Implementar sidebar direita (Sheet) com detalhes da avaliação ao clicar em "Mostrar detalhes"
- [x] Backend: incluir orderNumber no resultado de reviews (join com orders)
- [x] Remover sombra dos cards da lista de pedidos para igualar estilo dos cards de gráficos da Dashboard
- [x] Redesenhar sidebar de avaliação conforme modelo iFood: título "Detalhes da avaliação", card cinza com pedido+data, nota grande com estrelas, comentário do cliente com nome+data, área de resposta com textarea e botão vermelho
- [x] Redesenhar sidebar de avaliação com cabeçalho vermelho (estilo Forma de Pagamento) e 15% mais larga
- [x] Remover sombra do card da lista de avaliações na página de Avaliações
- [x] Sidebar avaliação: mostrar resposta em container de leitura quando já respondida, com botão "Editar resposta" para modo de edição
- [x] Paginação backend: adicionar limit/offset e contagem total na query de avaliações
- [x] Paginação frontend: controles Primeira, Anterior, campo de página, Próxima, Última (15 por página)
- [x] Redesenhar layout interno da sidebar de avaliação estilo iFood: nota destaque, estrelas, check verde cliente, seção resposta com estados sem/com resposta, layout limpo e responsivo
- [x] Remover badge "Verificada" da nota na sidebar de avaliação
- [x] Substituir ícone check verde do cliente por avatar vermelho com inicial do nome
- [x] Substituir ícone check verde da resposta por avatar com inicial do restaurante
- [x] Corrigir erro acessibilidade: adicionar SheetTitle ao SheetContent da sidebar de avaliação
- [x] Página de planos: alterar seleção padrão de anual para mensal
- [x] Corrigir card "Seu Plano" na página de planos: remover dados hardcoded e mostrar plano real do utilizador
- [x] Utilizadores sem assinatura devem ver "Plano Gratuito" no card "Seu Plano"
- [ ] Adicionar campo ownerDisplayName (varchar 11) no schema de establishments
- [ ] Adicionar campo "Nome do responsável" no onboarding passo 1 ao lado do nome do estabelecimento
- [ ] Limite de 11 caracteres no campo Nome do responsável
- [ ] Exibir ownerDisplayName no perfil do utilizador na topbar (dropdown e header)

## Campo Nome do Responsável no Onboarding
- [x] Adicionar campo "Nome do responsável" ao Step 1 do onboarding (ao lado de "Nome do estabelecimento")
- [x] Limitar campo a 11 caracteres com contador visual
- [x] Salvar ownerDisplayName na base de dados via backend (endpoint create)
- [x] Exibir ownerDisplayName no topbar/perfil do AdminLayout (avatar + nome + dropdown)
- [x] Fallback para user.name quando ownerDisplayName não está definido
- [x] Testes unitários para validação e lógica de fallback

## Subtítulo do Card Heatmap
- [x] Alterar subtítulo do card de heatmap para "Dias e horários com mais acessos ao seu cardápio"

## Tooltip do Heatmap
- [x] Substituir "visualizações" por "acesso" (1) ou "acessos" (2+) no tooltip das células do heatmap

## Legenda do Heatmap
- [x] Atualizar "Total acumulado" para "Total de acessos" na legenda inferior do heatmap

## Página de Estoque
- [x] Remover coluna "Custo unitário" da tabela de itens de estoque
- [x] Remover coluna "Valor total" da tabela de itens de estoque
- [x] Implementar busca por nome do item na página de estoque

## Formulário de Estoque - Layout e Formatação
- [x] Mover seleção de categoria para ao lado do campo nome do item
- [x] Formatar quantidade mínima como inteiro (1, 2, 3) sem vírgula para unidade/pacote/caixa/dúzia
- [x] Formatar custo por unidade com vírgula (ex: 100 → 1,00 / 050 → 0,50)
- [x] Remover campo "Custo por unidade (R$)" do modal de editar item de estoque

## Editar Produto - Controle de Estoque
- [x] Ao ativar controle de estoque e salvar, criar automaticamente o item na página de estoque (sem redirecionar)
- [x] Reverter redirecionamento incorreto para /estoque no ProductForm

## Bug Fix e Vinculação Estoque-Produto
- [x] Corrigir criação automática de item de estoque (item 120100 não foi criado)
- [x] Adicionar campo linkedProductId ao stockItems para vincular produto ao estoque
- [x] Descontar estoque automaticamente ao vender/confirmar pedido

## Remoção do Botão Novo Item no Estoque
- [x] Remover botão "Novo Item" da página de estoque (itens são criados via catálogo)

## Badge Breve no Menu Estoque
- [x] Remover badge "Breve" do item Estoque na sidebar

## Cor do Badge de Avaliações
- [x] Alterar cor dos badges de novas avaliações (e do menu pai) para vermelho, igual ao badge de novos pedidos

## Estado Vazio do Estoque
- [x] Remover botão "Adicionar primeiro item" do estado vazio e orientar utilizador a usar o catálogo

## Bloqueio de Produto sem Estoque no Menu Público
- [x] Bloquear produto no menu público quando estoque vinculado chegar a zero
- [x] Mostrar badge "Indisponível" no produto sem estoque no menu público

## Bug: Estoque não desconta ao comprar
- [x] Corrigir: estoque não é descontado ao realizar compra/confirmar pedido
- [x] Corrigir: menu público não mostra "Indisponível" após estoque chegar a zero

## Badge de Estoque sem Produto na Sidebar
- [x] Criar endpoint para contar itens de estoque com quantidade zero
- [x] Adicionar badge vermelho no menu Estoque na sidebar com contagem de itens sem estoque

## Bug: Entrada de estoque não atualiza quantidade
- [x] Corrigir: movimentação de entrada não atualiza currentQuantity do item de estoque (tabela stockMovements não existia)
- [x] Corrigir: badge de sem estoque continua após entrada de estoque (tabela stockMovements não existia)

## Sincronização stockQuantity do produto com currentQuantity do stockItem
- [x] Criar função syncProductStockQuantity que atualiza stockQuantity do produto vinculado
- [x] Chamar sincronização em addStockMovement (entrada/saída/ajuste)
- [x] Chamar sincronização em deductStockForOrder (desconto automático) - via addStockMovement
- [x] Chamar sincronização em updateStockItem (quando currentQuantity é alterado)

## Controle de estoque desativado por padrão
- [x] Garantir que ao adicionar novo produto no catálogo, a opção de controle de estoque esteja desativada por padrão

## Desativar controle de estoque em estabelecimentos específicos
- [x] Desativar hasStock de todos os produtos dos estabelecimentos 30001, 60018, 90001 e 150004

## Bug: Produtos não aparecem no menu público quando hasStock=false
- [x] Corrigir lógica no backend: outOfStock só deve ser true quando hasStock=true E stockQuantity=0 (backend já estava correto)
- [x] Corrigir lógica no frontend (MenuPublico): produtos com hasStock=false devem aparecer normalmente
- [x] Badge "Indisponível" só aparece quando hasStock=true E quantidade=0 (corrigido em PublicMenu, PDVSlidebar e MobilePDVModal)

## Bug: Menu público não atualiza disponibilidade após pedido
- [x] Invalidar cache do menu público após criação de pedido para refletir estoque atualizado em tempo real

## Restauração automática de estoque ao cancelar pedido
- [x] Criar função restoreStockForOrder que devolve estoque dos itens do pedido cancelado
- [x] Integrar restauração no fluxo de cancelamento (updateOrderStatus → cancelled)
- [x] Registrar movimentação de entrada com motivo "Pedido cancelado"
- [x] Sincronizar stockQuantity do produto após restauração (via addStockMovement que já chama syncProductStockQuantity)

## Bug: Quantidade de estoque não atualiza em tempo real na edição do produto
- [x] Corrigir campo stockQuantity na página de editar produto para refletir valor atualizado sem refresh

## Validação completa de estoque em todos os fluxos
- [x] Backend: validar estoque antes de criar pedido público (createPublicOrder)
- [x] Backend: validar estoque antes de criar pedido interno (createOrder - PDV/mesas)
- [x] Frontend Menu Público: limitar quantidade no carrinho ao estoque disponível
- [x] Frontend Menu Público: mostrar quantidade disponível ao cliente
- [x] Frontend PDV: limitar quantidade ao estoque disponível
- [x] Frontend Mesas/Comandas: limitar quantidade ao estoque disponível
- [x] Nenhum fluxo pode ignorar o estoque

## Validação de estoque no carrinho/sacola (incremento de quantidade)
- [x] Menu Público: impedir incremento de quantidade na sacola além do estoque disponível
- [x] Menu Público: mostrar indicador visual quando limite de estoque é atingido na sacola
- [x] PDV: impedir incremento de quantidade no carrinho além do estoque disponível (via updateCartItem)
- [x] Mesas/Comandas: impedir incremento de quantidade no carrinho além do estoque disponível (via updateCartItem)

## Redesign barra inferior mobile - Menu Público
- [x] Mover menu "Pedidos" para o menu hamburger (3 barrinhas)
- [x] Barra inferior fixa oculta até cliente adicionar item à sacola
- [x] Efeito slide-up ao aparecer a barra
- [x] Lado esquerdo: valor total + quantidade de itens
- [x] Lado direito: botão "Ver sacola"
- [x] Info de entrega: grátis / taxa fixa com valor / "total sem entrega" (por bairro)
- [x] Alterações apenas na versão mobile, desktop permanece igual

## Bug: botões de quantidade e adicionar desaparecem no modal do produto
- [x] Investigar e corrigir: após esvaziar sacola e abrir modal do produto novamente, botões +/- e "Adicionar" não aparecem (corrigido: auto-fechar sacola quando vazia + remover sticky/z-index conflitante do footer)

## Bug: borda colorida dos cards na página de Pedidos mais fina que na Dashboard
- [x] Corrigir espessura da borda superior colorida dos cards na página de Pedidos para ficar igual à Dashboard (ordem das classes CSS corrigida)

## Remover sombra do card Conectado/Desconectado na página de Pedidos
- [x] Remover shadow do card de status de conexão na página de Pedidos

## Ocultar botão Sacola no desktop quando carrinho vazio
- [x] Ocultar botão Sacola no header desktop quando carrinho estiver vazio, mostrar apenas Pedidos
- [x] Quando houver itens no carrinho, exibir Sacola junto com Pedidos no desktop
- [x] Nenhuma alteração na versão mobile

## Bug: PDV mostrando itens como Indisponível com controle de estoque desativado
- [x] Corrigir lógica no PDV: itens com hasStock=false não devem aparecer como Indisponível
- [x] Indisponível só quando hasStock=true E stockQuantity=0
- [x] Corrigido em PDV.tsx, PDVSlidebar.tsx e MobilePDVModal.tsx
- [x] Adicionado stockQuantity ao tipo Product no PDV.tsx

## Bug: Busca no PDV não funciona sem acentos
- [x] Implementar normalização de acentos na busca de produtos do PDV (ex: "agua" deve encontrar "Água mineral")
- [x] Aplicar em PDV.tsx, PDVSlidebar.tsx e MobilePDVModal.tsx (MobilePDVModal já tinha normalização)

## Limitação de avaliações quando opção desativada
- [x] Quando a opção de Avaliações do Restaurante estiver desativada, limitar o campo de quantidade a no máximo 250 avaliações
- [x] Validar no frontend (input max) e backend (zod schema)

## Tooltip no campo de quantidade de avaliações
- [x] Adicionar tooltip ou texto de ajuda explicando o motivo do limite de 250 avaliações

## Bug: Perda de dados digitados ao mudar de aba do navegador
- [x] Corrigir re-fetch automático que sobrescreve estado local em Configurações
- [x] Corrigir re-fetch automático que sobrescreve estado local em Atendimento
- [x] Corrigir re-fetch automático que sobrescreve estado local em Estabelecimento
- [x] Desabilitar refetchOnWindowFocus globalmente no QueryClient
- [x] Adicionar flags initialDataLoaded em Configuracoes.tsx (establishment, businessHours, neighborhoodFees, printerSettings)
- [x] Adicionar initialDataLoaded em CouponForm.tsx
- [x] Reset de flags após save (onSuccess das mutations)

## Migração do cardápio Sr. Macarrão para estabelecimento 210001
- [x] Acessar e extrair dados completos do cardápio via API Mindi (categorias, produtos, preços, descrições, complementos, fotos)
- [x] Migrar 8 categorias para o estabelecimento 210001
- [x] Migrar 55 produtos com 54 fotos para o estabelecimento 210001
- [x] Migrar 73 grupos e 500 itens de complementos
- [x] Validar migração completa no banco de dados

## Remover fotos placeholder dos produtos migrados (estabelecimento 210001)
- [ ] Identificar produtos com fotos placeholder/geradas automaticamente pelo Mindi
- [ ] Remover imagens e deixar apenas o placeholder padrão do sistema

## Melhorar fotos dos produtos do estabelecimento 210001
- [x] Melhorar fotos: Esfirras (Variadas), Pizza (Grande, Média, Pequena), Macarrão (Médio, Grande, Prato Econômico, Alho e Óleo Grande), Oferta do dia (Combo 1-4), Novidades (Batata recheada) - 13 fotos melhoradas e enviadas para CDN

## Remover item Informações do menu lateral do menu público
- [x] Remover o item "Informações" do menu lateral, deixando apenas "Meus Pedidos"

## Corrigir emoji no template de mensagem de entrega
- [x] Trocar emoji de barco pelo emoji de moto 🛵 no template de pedido pronto/entrega

## Corrigir limites min/max dos complementos do estabelecimento 210001
- [x] Comparar dados originais do Mindi com o banco para identificar discrepâncias nos limites de seleção
- [x] Corrigir min/max de todos os 73 grupos de complementos conforme o cardápio original (66 correções aplicadas)

## Bug: Toggles de categorias aparecem todos desativados
- [x] Investigar por que os toggles de ativação das categorias aparecem como desativados na página de Categorias
- [x] Corrigir toggle para refletir o estado real (isActive) da categoria
- [x] Corrigir toggle para atualizar visualmente ao clicar (toast mostra "Categoria ativada" mas toggle não muda)

## Campo de busca mobile na página de Catálogo
- [x] Adicionar campo de busca visível na versão mobile da página de Catálogo para filtrar produtos
- [x] Filtrar produtos em tempo real conforme o usuário digita (busca por nome, sem acentos)

## Layout mobile Catálogo: botão nova categoria + campo de busca na mesma linha
- [x] Colocar campo de busca à esquerda e botão nova categoria à direita na mesma linha (versão mobile)

## Ajuste botão mobile Catálogo
- [x] Remover botão vermelho "+ item" acima do campo de busca no mobile
- [x] Botão ao lado do campo de busca deve adicionar novo produto (não nova categoria)
- [x] Botão ao lado do campo de busca na cor vermelha #db262f

## Bug: Dashboard mostra "Itens em Falta" mesmo sem controle de estoque ativado
- [x] Investigar lógica de cálculo dos itens em falta na dashboard
- [x] Corrigir para não contar itens em falta quando controle de estoque não está ativado (hasStock=false)

## Bug: Preços de complementos voltam ao valor antigo após salvar (produtos 300057 e 300002)
- [x] Investigar dados dos complementos dos produtos 300057 e 300002 no banco
- [x] Investigar lógica de salvamento/atualização de complementos no backend
- [x] Corrigir preços em centavos no banco (31 complementos divididos por 100)
- [x] Corrigir bug na função parsePriceInput que multiplicava preços por 100 ao salvar sem editar (tratava ponto decimal como separador de milhar)

## Bug RECORRENTE: Preços de complementos do estabelecimento 210001 voltam a valores errados
- [x] Verificar estado atual dos preços no banco (6 complementos do produto 300002 com 1000.00)
- [x] Investigar se a correção do parsePriceInput foi deployada corretamente (sim, estava no código)
- [x] Investigar causa raiz: usuário salvou produto antes do deploy da correção
- [x] Corrigir os 6 preços no banco (1000.00 -> 10.00)
- [x] Adicionar normalização de preço ao carregar complementos do banco (formato americano -> brasileiro)
- [x] Validar com teste de ciclo completo (5 ciclos salvar/recarregar sem alteração de preço)

## Sidebar: Submenu "Menu" não deve recolher ao navegar
- [x] Fazer com que o submenu "Menu" só recolha ao clicar novamente no próprio "Menu", não ao navegar para outra página (persistido no localStorage)

## Bug: Excluir foto do produto não funciona
- [x] Investigar por que ao excluir a foto de um produto e salvar, a foto não é removida (enviava undefined em vez de [] quando sem fotos)
- [x] Corrigir para que a foto seja removida e o placeholder apareça (enviar [] ao backend)

## Redesign header de categoria no Catálogo
- [x] Remover ícone de lixeira da linha do título da categoria
- [x] Mover contagem de itens para ao lado direito do nome da categoria
- [x] Adicionar botão Pausar/Play para pausar/ativar a categoria
- [x] Adicionar botão 3 pontinhos com menu: Duplicar categoria e Remover categoria
- [x] Adicionar botão setinha (chevron) para minimizar/expandir itens da categoria
- [x] Implementar lógica de duplicar categoria no backend

## Ícone de arrastar nas categorias + auto-minimizar ao arrastar
- [x] Adicionar ícone de arrastar (GripVertical) ao lado esquerdo do título da categoria
- [x] Ao iniciar arraste de categoria, minimizar automaticamente todos os itens de todas as categorias
- [x] Ao soltar a categoria, restaurar o estado anterior de colapso

## Ajuste botões de ação dos itens no Catálogo
- [x] Remover botões de Duplicar e Excluir visíveis diretamente na linha do item
- [x] Adicionar ícone de 3 pontinhos (MoreVertical) sem estilo de botão, apenas o ícone
- [x] Ao clicar nos 3 pontinhos, abrir menu dropdown com opções "Duplicar" e "Excluir"
- [x] Manter Switch (toggle) para pausar/ativar o item

## Substituir Switch por botão Pausar/Play nos itens do Catálogo
- [x] Remover Switch/toggle vermelho dos itens
- [x] Adicionar botão Pausar/Play (ícone Pause/Play) igual ao da categoria

## Funcionalidade: Criar Combo (Catálogo)
- [x] Schema de banco: tabelas comboGroups e comboGroupItems
- [x] Procedures tRPC: CRUD de combos (criar, listar, deletar)
- [x] Botão "Criar combo" no header da categoria (à esquerda do botão Pausar)
- [x] Slidebar lateral direita (Sheet) com padrão visual da plataforma
- [x] Etapa 1: Seleção de produtos com busca debounce (300ms), limite 10 resultados
- [x] Etapa 1: Preview com foto, nome, categoria disponível e checkbox
- [x] Etapa 1: Botão "Agrupar produtos" e seção "Adicionados" com drag icon e remover
- [x] Etapa 1: Botão "Continuar" habilitado com ao menos 1 item agrupado
- [x] Etapa 2: Configuração do grupo (nome, tipo obrigatório/opcional, quantidade máxima)
- [x] Etapa 2: Validação - nome obrigatório e ao menos 1 item
- [x] Etapa 2: Botões Voltar e Concluir
- [x] Upsell: Seção para adicionar grupos adicionais após concluir primeiro grupo
- [x] Salvar combo como novo tipo de produto com estrutura de grupos

## Ajuste limite busca Criar Combo
- [x] Alterar limite de resultados da busca de 10 para 7 itens

## Adicionar foto e descrição no Criar Combo
- [x] Upload de foto do combo acima do campo Nome na tela de overview
- [x] Campo de descrição do combo abaixo do campo Nome
- [x] Enviar descrição e imagem ao criar o combo

## Ajuste botão Criar Combo no header da categoria
- [x] Mudar botão para exibir apenas texto "Criar Combo" sem ícone

## Ajuste mobile: botões da categoria no Catálogo
- [x] Esconder botões "Criar Combo" e "Pausar/Play" na versão mobile
- [x] Adicionar opções "Pausar/Ativar categoria" e "Criar Combo" no menu de 3 pontinhos acima de Duplicar e Remover

## Bug: Drag & Drop de categorias no Catálogo não está fluido
- [x] Comparar implementação de drag entre /categorias e /catalogo
- [x] Corrigir drag para ficar fluido como na página /categorias
  - Usar CSS.Translate em vez de CSS.Transform (sem scale)
  - Remover transition-all duration-200 conflitante
  - Esconder CategoryDropZone durante drag de categoria
  - Usar startTransition para batch collapse update
  - Adicionar position relative durante drag

## Ajuste badge Pausado dos itens e botão Criar Categoria
- [x] Igualar badge "Pausado" dos itens ao badge "Pausada" da categoria (mesmo tamanho, cor e estilo)
- [x] Adicionar botão "Criar Categoria" na página Catálogo
- [x] Scroll automático para o final da lista ao criar nova categoria

## Remover página /categorias e badge Pausado dos itens
- [x] Remover página /categorias (componente, rota e link no sidebar)
- [x] Remover badge "Pausado" dos itens na lista do catálogo (manter apenas badge da categoria)

## Ajuste mobile: preço abaixo do nome do item no Catálogo
- [x] Mover preço para abaixo do nome do item na versão mobile em tamanho menor

## Imagens placeholder estilo iFood para itens sem foto
- [ ] Criar 5 modelos de imagens placeholder com padrões de comida estilo iFood
- [ ] Upload para S3 e integrar no sistema como fallback para itens sem foto

## Remover itens pré-visualizados na slidebar Criar Combo
- [x] Não exibir itens pré-carregados - mostrar resultados apenas quando o usuário digitar na busca

## Ajuste botões Agrupar/Continuar na slidebar Criar Combo
- [x] Quando há itens selecionados: mostrar apenas botão "Agrupar X produtos"
- [x] Quando não há itens selecionados e já tem agrupados: mostrar apenas botão "C- [x] Bug: Complementos/grupos dos combos não aparecem no menu público
- [ ] Investigar como os combos são salvos no banco (comboGroups, comboGroupItems)
- [ ] Investigar como o menu público carrega dados dos combos
- [ ] Corrigir exibição dos grupos/complementos no menu público
- [x] Bug: Complementos/grupos não aparecem na página de edição do produto
- [x] Bug: BATATA FRITA aparece como GRÁTIS no combo quando deveria mostrar o preço correto
- [x] Bug: Ao criar combo e adicionar item que já possui complementos próprios, esses complementos não são importados/exibidos no combo
- [x] UX: Sidebar Criar Combo - lista de resultados da busca precisa de scroll próprio para manter busca e botões visíveis
- [x] Feature: Botão "Complementos" por item na página de catálogo com dropdown expansível inline
- [x] Feature: Dropdown mostra grupos de complementos com tags (Obrigatório/Opcional/Reutilizado), pausar, drag-and-drop
- [x] Feature: Itens dentro do grupo com nome, preço editável inline, pausar, deletar, drag-and-drop
- [x] Feature: Versão mobile com ícone de seta para expandir complementos
- [x] Feature: Estado vazio "Nenhum complemento configurado" com botão "Adicionar complemento"
- [x] Feature: Campos editáveis Mín, Máx e checkbox Obrigatório em cada grupo no dropdown de complementos do catálogo
- [x] Feature: Editar nome do grupo e do item inline no dropdown de complementos do catálogo (texto "Editar" em vermelho)
- [x] Feature: Toggle grátis/normal para complementos no dropdown do catálogo
- [x] Feature: Dropdown expandível ao clicar no item com badge/destaque e disponibilidade
- [x] Remover ícone do botão "Complementos" na página de catálogo (manter apenas texto + seta)
- [x] Adicionar badge de contagem de complementos no botão "Complementos" do catálogo
- [x] Bug: Itens não aparecem na página de catálogo do estabelecimento Big Norte (mas aparecem no menu público)
- [x] Remover badge "GRÁTIS" redundante ao lado do botão Editar quando item já está marcado como grátis no dropdown de complementos do catálogo
- [x] Mobile: Consolidar botões de ação dos complementos (editar, pausar/ativar, excluir) em menu de 3 pontinhos no dropdown do catálogo
- [x] Mobile: Mover toggle Grátis/Normal para dentro do menu de 3 pontinhos no dropdown de complementos do catálogo
- [x] Catálogo: Adicionar visual cinza/esmaecido nos itens pausados na lista (estilo iFood) para diferenciar visualmente de itens ativos
- [x] Catálogo: Botão de ativar (Play) não deve ficar com efeito de opacidade/cinza quando item está pausado
- [x] Aplicar visual esmaecido (cinza + opacidade) nos itens de complemento pausados dentro do dropdown, mantendo botão ativar normal
- [x] Bug: Erro de estoque insuficiente ao fazer pedido mesmo quando estoque não está ativado (itens 120063 e 300067, estabelecimento 30001)
- [x] Bug: PDV perde lista de itens do carrinho ao navegar para outra página e voltar - deve persistir os itens
- [x] PDV: Persistir dados de entrega (nome, telefone, endereço) e retirada (nome, telefone) no sessionStorage
- [x] Catálogo: Reduzir largura do campo de edição do nome do complemento e adicionar botões salvar/cancelar
- [x] Catálogo: Botões de ação (Normal, preço, pausar, lixeira, dropdown) não devem se mover quando campo de edição do nome é ativado
- [x] Catálogo: Remover sombras dos botões na lista de itens e header do catálogo
- [x] Bug: Erro de validação no catálogo - availableDays e availableHours enviados como null em vez de array
- [x] Pedidos: Mover tipo de entrega (Retirada/Entrega/Mesa) para abaixo do número do pedido no card, em vez da linha do preço
- [x] Pedidos: Estilizar tipo de entrega abaixo do número do pedido como badge escuro (fundo preto, texto branco, arredondado)
- [x] Fix catálogo: ao voltar da edição de produto, rolar para a categoria que estava sendo editada em vez de voltar ao topo
- [x] Fix campos Mín/Máx dos adicionais no catálogo: permitir apagar completamente (sem ficar preso no zero), aceitar apenas inteiros, limitar a 999
- [x] Bug: Maximum call stack size exceeded na página /pedidos - recursão infinita em useMemo / Tooltip nesting no editor visual
- [x] Pedidos: Alterar cor do badge de tipo de entrega para combinar com a cor da coluna do kanban (em vez de vermelho fixo)
- [x] Pedidos: Modo lista compacta - adicionar toggle para alternar entre visualização kanban e lista compacta
- [x] Templates WhatsApp: Adicionar método de pagamento na variável {{itensPedido}} abaixo do total (ex: 💰 Pagamento via: *PIX*)
- [x] Reset diário automático da numeração de pedidos (#P1) à 00:00, respeitando fuso horário do estabelecimento
- [x] Pedidos: Alterar cores dos botões de ação (Aceitar, Pronto, Finalizar) para combinar com a cor da coluna do kanban
- [x] Pedidos: Alterar cor do card de Preparo de dourado/âmbar para vermelho
- [x] Bug crítico: Acompanhamento de pedido retorna pedido antigo após reset diário da numeração - usar ID único em vez de número visual
- [x] Bug: Badge de contagem de complementos no catálogo não atualiza ao excluir todos os complementos de um item - só some ao atualizar a página
- [x] Catálogo: Campo de edição do nome do complemento deve ter largura proporcional ao texto, não largura total
- [x] Catálogo: Adicionar textos "Salvar" e "Cancelar" ao lado dos ícones check e X no campo de edição do complemento
- [x] Catálogo: Manter botões de ação (Normal, preço, pausar, lixeira) fixos à direita quando campo de edição do nome do complemento está ativo
- [x] Catálogo: Aumentar largura do campo de edição do nome do complemento para ~1.5x-2x o tamanho do texto
- [x] Refatorar criação de produto: substituir modal central por slidebar lateral direita (padrão Combo)
- [x] Slidebar Etapa 1: Informações básicas (imagem, nome, descrição, categoria, status, estoque)
- [x] Slidebar Etapa 2: Grupos de complementos (criar/copiar grupo, criar/copiar complemento)
- [x] Slidebar Etapa 3: Disponibilidade e preço final (preço, categorias, horários)
- [x] Progress bar no topo da slidebar (Passo 1 de 3)
- [x] Não impactar botão de Complementos existente no catálogo
- [x] Alinhar estilo visual da slidebar de criar produto com a slidebar de criar combo (background branco, mesmo padrão)
- [x] Passo 2 da slidebar de criar produto: adicionar 3 abas/cards antes de criar/copiar grupo — Ingredientes, Especificações, Descartáveis
- [x] Cada aba leva ao mesmo fluxo de criar/copiar grupos (mudança visual, sem alterar lógica)
- [x] Remover link "Voltar às categorias" do topo do conteúdo no Passo 2 da slidebar de criar produto
- [x] Remover título com ícone da categoria do conteúdo no Passo 2
- [x] Adicionar botão "Voltar" ao lado esquerdo do botão "Avançar" no footer do Passo 2
- [x] Remover botão de seta voltar do header vermelho do Passo 2 (já tem Voltar no footer)
- [x] Remover botão de seta voltar do header vermelho de TODOS os passos e sub-passos da slidebar de criar produto
- [x] Adicionar placeholder contextual no campo "Nome do grupo" baseado na categoria selecionada (ex: "Deseja descartáveis?" para Descartáveis)
- [x] Trocar foto da página de Criar Conta pela imagem do homem no restaurante com burger e tablet
- [x] Alterar cor de fundo do tab selecionado na lista de pedidos: de preto para cor clara do badge do status (azul claro para Novos, vermelho claro para Preparo, etc.)
- [x] Aumentar tamanho dos textos, botões e elementos da visualização em lista de Pedidos para ficar no padrão do Kanban e demais páginas
- [x] Corrigir badges de tipo de entrega (Entrega, Retirada, Consumo) no modo lista de Pedidos para ter o mesmo visual do modo Kanban
- [x] Exibir nome completo do status no badge da coluna STATUS no modo lista de Pedidos (em vez de abreviado)
- [x] Criar coluna separada TEMPO no modo lista de Pedidos e remover o tempo da coluna PEDIDO
- [x] Trocar foto da página de Login pela imagem dos dois bartenders com tablet
- [ ] Adicionar campo de Estoque editável inline ao lado esquerdo do preço na versão desktop do cardápio
- [ ] Tornar campo de Preço editável inline na versão desktop do cardápio
- [x] Auto-salvar estoque e preço ao clicar fora do campo (onBlur)
- [x] Adicionar campo de Estoque editável inline ao lado esquerdo do preço na versão desktop da página de Catálogo
- [x] Tornar campo de Preço editável inline na versão desktop da página de Catálogo
- [x] Auto-salvar estoque e preço ao clicar fora do campo (onBlur)
- [ ] Corrigir formato do campo de preço inline no Catálogo para padrão brasileiro (R$ 0,00)
- [x] Implementar máscara de moeda brasileira no campo de preço inline do Catálogo (digitar 500 = 5,00)
- [x] Aplicar campo de preço editável inline com máscara de moeda nos complementos da página de Catálogo (sem cor vermelha)
- [x] Aplicar máscara de moeda brasileira nos campos de preço do CreateProductSheet
- [x] Aplicar máscara de moeda brasileira no campo de preço do CreateComboSheet
- [x] Remover campo "Nome do grupo" e botão "Adicionar grupo" inline do dropdown de complementos no Catálogo
- [x] Adicionar botão "Adicionar grupo" que abre slidebar com seleção de categoria (Ingredientes, Especificações, Descartáveis) reutilizando fluxo do CreateProductSheet step 2
- [x] Adicionar tela intermediária "Criar novo grupo / Copiar grupo existente" no AddGroupSheet após seleção de categoria
- [x] Centralizar botões "Adicionar item" e "Adicionar grupo" no dropdown de complementos, "Adicionar grupo" vermelho e "Adicionar item" com destaque
- [x] Bug: Ao limpar campo de estoque no Catálogo (deixar vazio), o item deve desaparecer da página de Estoque

## Redesign da Página de Complementos - Gestão Global de Grupos
- [x] Nível 1: Lista de grupos com nome, qtd complementos, qtd produtos vinculados
- [x] Nível 1: Botão pausar grupo inteiro (todos complementos ficam indisponíveis)
- [x] Nível 1: Botão excluir grupo inteiro
- [x] Nível 2: Expandir grupo mostra complementos (igual Catálogo)
- [x] Nível 2: Editar mín/máx/obrigatório globalmente (altera para todos os produtos)
- [x] Nível 2: Pausar/reativar complemento individual
- [x] Nível 2: Editar preço, tipo (Normal/Grátis), reordenar complementos
- [x] Nível 2: Adicionar novo complemento ao grupo
- [x] Nível 2: Excluir complemento individual
- [ ] Backend: Endpoints para listar grupos globais com contagem de produtos
- [ ] Backend: Endpoint para pausar/reativar grupo inteiro
- [ ] Backend: Endpoint para excluir grupo inteiro
- [ ] Backend: Endpoint para alterar regras (mín/máx/obrigatório) globalmente
- [x] Bug: Pausar grupo na página de Complementos não reflete na página de Catálogo (grupo continua visível/ativo)
- [x] Mover item "Grupos" para dentro do submenu "Menu", abaixo de "Cardápio"

## Página de Entregadores
- [ ] Schema: tabela drivers (nome, email, whatsapp, status, estratégia repasse, valor fixo, percentual)
- [ ] Schema: tabela deliveries (pedido, entregador, valor taxa, valor repasse, status pago/pendente)
- [ ] DB helpers: CRUD de entregadores
- [ ] DB helpers: métricas de entregadores (cadastrados, ativos, inativos, repasses 7 dias)
- [ ] DB helpers: lista de entregas por entregador
- [ ] tRPC procedures: CRUD entregadores + métricas + entregas
- [ ] Página /entregadores: cards de métricas (cadastrados, ativos, inativos, repasses 7 dias)
- [ ] Página /entregadores: tabela de entregadores com nome, whatsapp, status, estratégia, entregas, total a receber
- [ ] Slidebar criar/editar entregador com campos: nome, email, whatsapp, status, estratégia repasse
- [ ] Página detalhes do entregador: métricas individuais + lista de entregas
- [ ] Botão marcar entrega como paga
- [ ] Integração UAZAPI: envio automático WhatsApp ao marcar pedido como "Saiu para entrega"
- [ ] Registrar delivery_whatsapp_sent no banco para evitar duplicatas
- [ ] Menu lateral: adicionar "Entregadores" abaixo de "Pedidos"
- [ ] Testes unitários para endpoints de entregadores
- [x] Ajustar cards de métricas Entregadores: separar Repasses (7d) em valor e novo card para quantidade de entregas
- [x] Padronizar slidebar de Novo Entregador com o mesmo estilo da slidebar de Criar Combo do Catálogo
- [x] Adicionar ícone X no header da slidebar de Novo Entregador para fechar
- [x] Validação de WhatsApp em tempo real via UAZAPI antes de salvar entregador

## Fluxo inteligente de atribuição de entregadores
- [ ] Ao marcar pedido como "Pronto": verificar entregadores ativos
- [ ] Se 1 entregador ativo: atribuir automaticamente + status "Em entrega" + enviar WhatsApp
- [ ] Se 2+ entregadores ativos: abrir modal de seleção de entregador
- [ ] Se 0 entregadores ativos: não fazer nada (apenas marcar como Pronto normalmente)
- [ ] Após seleção no modal: atribuir + status "Em entrega" + enviar WhatsApp
- [ ] Backend: endpoint para auto-assign com mudança de status
- [x] Fluxo de entregadores deve se aplicar APENAS a pedidos de entrega (delivery), não para retirada (pickup) ou consumo no local (dine_in)
- [x] Bug: Modal de Notificações WhatsApp aparece mesmo quando WhatsApp já está conectado - deve aparecer apenas uma vez para novos usuários
- [x] Bug: Botão "Ver pedidos" na notificação de novo pedido faz reload completo da página em vez de navegação SPA

## Mensagem WhatsApp do Entregador - Melhorias
- [x] Atualizar formato da mensagem WhatsApp para entregador conforme modelo do usuário
- [x] Incluir informação de troco (changeAmount) quando pagamento for dinheiro
- [x] Separar endereço em linhas: rua+número, bairro, referência
- [x] Adicionar emoji de troco (💵) com texto "Vai precisar de troco?" quando for dinheiro
- [x] Aplicar mesmo formato nas 3 mensagens: markReadyAndAssign, assignDriver, resendNotification
- [x] Corrigir duplo # no orderNumber das mensagens (orderNumber já inclui #)
- [x] Remover link "Abrir no mapa" da mensagem WhatsApp do entregador

## Configuração de Momento de Acionamento do Entregador
- [x] Adicionar campo driverNotifyTiming no schema de establishments (on_accepted / on_ready, padrão: on_ready)
- [x] Adicionar campo deliveryNotified (boolean) no schema de orders para evitar duplicatas
- [x] Migrar banco de dados com os novos campos
- [x] Criar DB helpers para get/update driverNotifyTiming
- [x] Criar tRPC procedure para get/update configuração de timing
- [x] Atualizar fluxo de aceitar pedido: se timing=on_accepted, acionar entregador automaticamente
- [x] Atualizar fluxo de marcar como pronto: se timing=on_ready, acionar entregador (manter comportamento atual)
- [x] Verificar deliveryNotified antes de enviar para evitar duplicatas
- [x] Marcar deliveryNotified=true após envio bem-sucedido
- [x] Enviar apenas para pedidos com modalidade Entrega
- [x] Verificar se existe entregador ativo antes de enviar
- [x] Adicionar opção de configuração no modal de novo entregador (abaixo da estratégia de repasse)
- [x] Padrão: "Quando o pedido for marcado como pronto"
- [x] Testes unitários para a nova lógica
- [x] Bug: Ao editar entregador, campos (nome, email, WhatsApp, etc.) não ficam preenchidos com os dados existentes
- [x] Alterar título da mensagem do entregador de "Nova entrega" para "Nova entrega!"
- [x] Remover card "Média por entrega" da página de detalhes do entregador
- [x] Bug: Estabelecimento 60018 mostra "fechado" ao enviar pedido no menu público - corrigido: frontend agora usa computedIsOpen do servidor como fonte de verdade
- [x] Bug: Toggle "Aberto agora" no admin mostra "Aberto" mas banco de dados tem manuallyClosed=true - corrigido: admin agora usa computedIsOpen do servidor como fonte de verdade
- [x] Quando sidebar minimizada e usuário clicar em "Menu" (com submenu), a barra deve expandir em vez de mostrar tooltip/popover

## Auto-scroll Complementos no Menu Público
- [x] Auto-scroll suave para próximo grupo de complementos quando cliente atingir quantidade máxima no menu público
- [x] Bug: Auto-scroll dos complementos mostra parte do grupo anterior após completar seleção - próximo grupo deve ficar no topo da área visível
- [x] Bug: Clicar no texto do complemento não seleciona o item - só funciona clicando na área vazia do complemento
- [x] Alterar cor do estado "Completo" dos complementos de verde para vermelho (bordas, header, badge, ícone, subtítulo)
- [x] Bug: Botão de ativar/pausar da categoria no catálogo não reflete estado pausado quando todos os itens da categoria estão pausados
- [x] Bug: Botão de ativar/pausar da categoria no catálogo não reflete estado pausado quando todos os itens da categoria estão pausados
- [x] Bug: Itens dentro de categoria pausada não aparecem visualmente como pausados (devem ter opacidade reduzida e ícone de pausa)
- [x] Bug: Cards na coluna 'Pronto' do Kanban aparecem com cor laranja em vez de verde
- [x] Reduzir altura dos cards de pedido no Kanban para ficarem mais compactos
- [x] Adicionar efeito pulsante no badge "ENTREGA" dos cards de pedido no Kanban
- [x] Sistema de Agendamento: Schema DB (scheduledAt, isScheduled, movedToQueue nos pedidos + configurações de agendamento)
- [x] Sistema de Agendamento: Helpers DB e procedures tRPC (CRUD agendados, configurações, job automático)
- [x] Sistema de Agendamento: Menu público - botão "Agendar" no resumo + step de agendamento (data/hora)
- [x] Sistema de Agendamento: Painel admin - página "Agendados" com calendário mensal + lista de pedidos
- [x] Sistema de Agendamento: Configurações do restaurante - seção Agendamento (toggle, antecedência, intervalo, etc.)
- [x] Sistema de Agendamento: Integração WhatsApp para pedidos agendados
- [x] Sistema de Agendamento: Testes unitários (50 testes passando)
- [x] Sistema de Agendamento: Job automático para mover pedidos agendados para fila (intervalo 60s)

## Redesign Visual da Página Agendados (Alinhar com Dashboard)
- [x] Cards superiores: remover sombras, reutilizar mesmo componente visual da Dashboard (border-radius, borda, padding, tipografia, ícones)
- [x] Cabeçalho: mesmo tamanho de título, font-weight, espaçamento e subtítulo da Dashboard
- [x] Filtros: reutilizar mesmo componente segmentado da Dashboard (background, cor ativa, arredondamento, transição, padding)
- [x] Calendário: redesenhar estilo SaaS moderno (células maiores, hover suave, dia selecionado com bg primária, indicadores discretos, sem sombra)
- [x] Painel direita (lista do dia): sem sombra, mesmo estilo de card, padding e tipografia da Dashboard
- [x] Badges de status padronizados (Agendado=cinza, Aguardando=laranja, Aceito=verde, Na fila=azul)
- [x] Consistência global: mesmo espaçamento, tipografia, hover, botões e identidade visual

## Redesign Calendário e Painel Lateral (Modelo de Referência)
- [x] Calendário: layout tabela com células grandes, bordas finas, número no canto superior esquerdo
- [x] Calendário: mostrar nomes de pedidos/horários dentro das células (não apenas dots)
- [x] Calendário: dia selecionado com círculo azul sólido no número (hoje=primary, selecionado=highlight)
- [x] Calendário: dias de outros meses em cinza claro
- [x] Painel direita: cards de pedidos detalhados com status badge, descrição, data/hora, ações (editar/excluir)
- [x] Painel direita: cabeçalho com data formatada (ex: "Fev 15 Dom")

## Refinamento Visual Calendário e Cards de Pedidos (v3)
- [x] Calendário: usar SectionCard como wrapper para manter consistência com Dashboard
- [x] Calendário: separar visualmente do painel direita (dois cards independentes como na referência)
- [x] Calendário: bordas mais suaves, hover mais sutil, espaçamento interno melhor
- [x] Painel direita: usar SectionCard como wrapper independente
- [x] Cards de pedidos: seguir padrão visual dos cards da Dashboard (sem sombra, borda leve, padding consistente)
- [x] Empty state: mais limpo e alinhado com o padrão do sistema

## Calendário: Estilo Pill/Chip nos Pedidos
- [x] Cada pedido dentro da célula do calendário deve ter fundo arredondado verde claro (pill/chip) como na referência

## Navegação: Agendados como submenu de Pedidos
- [x] Mover Agendados para dentro do menu Pedidos como submenu (igual ao padrão do menu "Menu" com submenus)

## Fix: Menu Pedidos navegar + expandir dropdown
- [x] Clicar em Pedidos deve navegar para /pedidos E expandir o dropdown com Agendados simultaneamente

## Ajuste largura botões Agendar/Próximo no resumo do pedido
- [x] Botão Agendar deve ocupar 15% da largura (só ícone) e Próximo 85% (flex-1) no modal de resumo do pedido público

## Cor do botão Enviar Pedido no modal de confirmação
- [x] Alterar botão de enviar pedido de verde para vermelho no modal de confirmação do menu público

## Botão Ver Detalhes nos cards de Pedidos Agendados
- [x] Adicionar botão "Ver detalhes" nos cards de pedidos agendados
- [x] Reutilizar a mesma sidebar de detalhes da página de Pedidos (Sheet com mesmo estilo)
- [x] Incluir informações de agendamento (data/hora agendado) na sidebar com secção azul destacada

## Redesign Cards de Agendados para Padrão de Pedidos
- [x] Cabeçalho do card: número do pedido + badge modalidade (Entrega/Retirada) + horário agendado
- [x] Linha central: nome do cliente + método pagamento + valor em vermelho
- [x] Rodapé: botão ver detalhes + ações (aceitar/reagendar/cancelar)
- [x] Seguir mesmo estilo visual dos cards de Pedidos (header colorido, content compacto, actions)

## Botão Imprimir nos Cards de Pedidos Agendados
- [x] Adicionar botão de imprimir nos cards de pedidos agendados (substituiu ícone de olho por impressora)
- [x] Reutilizar mesma funcionalidade de impressão da página de Pedidos (normal + múltiplas impressoras)
- [x] Incluir dropdown com opções de impressão e favorito (estrela amber)

## Badge "Agendado" e Card de Agendamento no Recibo e Cards
- [x] Badge no recibo HTML: mostrar "AGENDADO" em vez de "RETIRADA/ENTREGA" quando pedido for agendado
- [x] Badge no recibo texto puro (ESC/POS): mostrar "AGENDADO" + secção com data/hora
- [x] Badge no recibo ESC/POS printer: mostrar "AGENDADO" + secção com data/hora
- [x] Badge no recibo por sector: mostrar "AGENDADO"
- [x] Adicionar card/secção de agendamento (data e hora) abaixo do card de retirada no recibo HTML
- [x] Adicionar card/secção de agendamento (data e hora) no recibo por sector

## Remover sombra dos cards de pedidos agendados
- [x] Remover shadow dos cards de pedidos na página Agendados

## Badge no Submenu Agendados e Notificação de Pedido Agendado
- [x] Adicionar badge com contagem de pedidos agendados pendentes no submenu "Agendados" na sidebar
- [x] Na notificação de novo pedido agendado, botão deve dizer "Ver pedido agendado" e navegar para /agendados

## Ocultar submenu Agendados quando agendamento desativado
- [x] Ocultar submenu "Agendados" da sidebar quando schedulingEnabled=false no estabelecimento
- [x] Submenu só aparece quando o restaurante ativa o agendamento nas configurações

## Landing Page - Hero Section
- [x] Criar página de Landing Page com rota pública (não autenticada)
- [x] Hero Section com layout duas colunas (60/40) inspirado no GranaFy
- [x] Copy otimizada para conversão: headline, subheadline, CTAs
- [x] Mockups desktop + mobile do dashboard com efeito flutuante
- [x] Mini benefícios abaixo dos CTAs (sem taxa, configuração rápida, suporte)
- [x] Micro-animações: fade-in headline, entrada lateral mockup, hover botões
- [x] Fundo claro com grid sutil
- [x] Responsividade completa (mobile: coluna única, mockup abaixo)
- [x] Navbar da landing com links: Home, Funcionalidades, Preços, FAQ, Login, Criar conta

## Landing Page - Seção 2: O Problema + A Virada
- [x] Bloco Dor: título emocional "Você está pagando para vender o que é seu?"
- [x] Simulação de perdas: slider/calculadora mostrando quanto perde no marketplace
- [x] Bloco Virada: "Com o CardápioAdmin você assume o controle" com lista visual de benefícios
- [x] Layout duas colunas (texto emocional + visual comparativo)
- [x] Cards comparativos: Marketplace (❌) vs CardápioAdmin (✅)
- [x] Micro-animações: entrada suave, contadores animados
- [x] Responsividade completa (mobile: coluna única)

## Landing Page - Seção 3: Clientes que vendem conosco
- [x] Gerar imagens de capa e logos para 6 estabelecimentos fictícios
- [x] Carrossel horizontal com scroll suave e auto-play
- [x] Cards com foto de capa, logo, nome, cidade/estado e botão "Ver cardápio"
- [x] Animação de entrada suave ao scroll
- [x] Responsividade completa (mobile: scroll horizontal touch)

## Landing Page - Seção 4: Cardápio Digital (Tablet Mockup)
- [x] Capturar screenshot do cardápio/catálogo real do sistema
- [x] Moldura de tablet à esquerda com screenshot do cardápio
- [x] Conteúdo à direita: badge, título, descrição, lista de benefícios, CTA
- [x] Animação de entrada suave ao scroll
- [x] Responsividade completa (mobile: coluna única, tablet abaixo)

## Carrossel Automático na Seção Clientes
- [x] Adicionar efeito de marquee/carrossel infinito nos cards de restaurantes

## Renomear CardápioAdmin para Mindi na Landing Page
- [x] Alterar todas as referências de "CardápioAdmin" para "Mindi" na landing page
- [x] Alterar "Cardápio Admin" para "Mindi" na landing page
- [x] Alterar "CardápioAdmin" para "Mindi" na navbar da landing

## Fix: Imagem de Background nas Páginas de Login/Registro
- [x] Resolver carregamento lento da imagem de background nas páginas de login e criação de conta

## Efeito Typewriter na Hero Section
- [x] Adicionar efeito de digitação animado no título principal da Hero Section da landing page

## Landing Page - Seção de Planos
- [x] Adicionar seção de planos na landing page baseada na página /planos existente
- [x] Manter mesmos dados, preços e features dos planos
- [x] Estilo visual consistente com o resto da landing page
- [x] Responsividade completa

## Remover Mockup Mobile da Hero
- [x] Remover o mockup mobile (celular) da Hero Section da landing page

## Landing Page - Seção FAQ
- [x] Accordion com perguntas frequentes (período grátis, cancelamento, taxas, suporte, etc.)
- [x] Animação de abertura/fechamento suave
- [x] Responsividade completa

## Landing Page - Seção CTA Final
- [x] Headline impactante de encerramento
- [x] Botão de conversão destacado
- [x] Background com gradiente ou textura diferenciada

## Landing Page - Footer
- [x] Links úteis organizados em colunas (Produto, Empresa, Suporte)
- [x] Redes sociais (Instagram, WhatsApp, etc.)
- [x] Informações legais e copyright
- [x] Responsividade completa

## Redesign Footer da Landing Page (estilo Menuz)
- [ ] Fundo claro (cinza muito claro) em vez de escuro
- [ ] Logo Mindi + descrição à esquerda com ícones sociais arredondados
- [ ] Colunas de links: Links Úteis, Segmentos, Legal
- [ ] Seção de Contato separada abaixo com email e endereço
- [ ] Barra inferior com nome da empresa, CNPJ e copyright
- [ ] Responsividade completa

## Aumentar Mockup Dashboard na Hero Section
- [x] Aumentar tamanho do container do mockup do dashboard na Hero em 15%
- [x] Reduzir scale do mockup de 1.15 para 1.10 (diminuir 5%)

## Seção Mockup Visual de Pedidos na Landing Page
- [x] Criar seção com mockup estático visual da página de pedidos (sem funcionalidade)
- [x] Layout 2 colunas: 55% mockup esquerda, 45% texto direita
- [x] Mockup com borda arredondada, sombra suave, parte cortada (estilo frame)
- [x] Badge + título + descrição + lista com checks verdes + botão CTA no lado direito
- [x] Responsivo: mockup primeiro, texto abaixo no mobile
- [x] Sem rotas, botões clicáveis, funcionalidade real ou scroll interno

## Substituir Imagem do Mockup de Pedidos na Landing
- [x] Upload da nova screenshot da página de Pedidos para S3
- [x] Substituir URL da imagem no mockup da seção Gestão de Pedidos

## Substituir Screenshot do Dashboard na Hero por Versão com Dados
- [x] Criar página estática do dashboard com dados realistas preenchidos
- [x] Capturar screenshot da página com dados
- [x] Upload para S3 e substituir DASHBOARD_MOCKUP na LandingPage

## Fix Imagem Mockup Pedidos
- [x] Ajustar imagem da screenshot de Pedidos para preencher corretamente o container do browser frame

## Remover container decorativo atrás da imagem de Pedidos
- [x] Remover sombra/gradiente decorativo atrás do mockup de pedidos

## Remover estatísticas da seção Explore Cases Reais
- [x] Remover barra de números (500+, 150k+, 27, 4.9) da seção de clientes

## Substituir Mockup da Seção Cardápio Digital
- [x] Upload da screenshot do cardápio Sushi Haruno para S3
- [x] Criar moldura de celular (phone frame) estilizada
- [x] Substituir imagem na seção Cardápio Digital com phone frame

## Ajuste Espessura da Moldura do Celular
- [x] Igualar espessura da borda de cima com a de baixo na moldura do celular (seção Cardápio Digital)

## Carrossel na Moldura do Celular (Seção Cardápio Digital)
- [x] Upload das 3 novas screenshots para S3
- [x] Implementar carrossel automático dentro da moldura do celular com 4 imagens
- [x] Indicadores de posição (dots) no carrossel
- [x] Transição suave entre imagens

## Segunda Linha de Cases Reais
- [ ] Adicionar segunda linha de cards no carrossel de Explore Cases Reais
- [ ] Efeito de scroll da esquerda para a direita (inverso da primeira linha)
- [ ] Novos restaurantes fictícios para a segunda linha
- [x] Remover pausa ao hover no carrossel de clientes (Explore Cases Reais) - animação deve ser contínua sem interrupções
- [x] Redesenhar seção calculadora de economia (Quanto você perde por mês) - remover fundo escuro, layout mais limpo e claro, alinhado com estilo Mindi
- [x] Remover seção calculadora de economia (Quanto você perde por mês) completamente da landing page
- [x] Remover 'Zero comissão por pedido' e 'Estoque sincronizado automaticamente' da seção A Solução
- [x] Redesenhar seção CTA final (Comece Agora) - remover fundo escuro, design claro alinhado com Mindi
- [x] Redesenhar cards de comparação (Usando Marketplace vs Com Mindi) na seção A Solução - novo modelo mais moderno
- [x] Remover segunda fileira do carrossel de clientes (Explore Cases Reais) - deixar apenas uma linha
- [x] Adicionar efeito fade-in/fade-out suave ao hover nos cards de cases (Explore Cases Reais)
- [x] Adicionar dados mockados na conta do restaurante xkelrix@gmail.com (pedidos, produtos, clientes, faturamento)
- [x] Remover 'Filtros por data, status e entregador' e 'Histórico completo de cada cliente' da seção Gestão de Pedidos
- [x] Adicionar dados mockados no gráfico Acumulado da Semana (todos os dias) e no card Acessos ao Cardápio para Burger House Gourmet
- [x] Redistribuir pedidos em todos os dias da semana (Seg-Dom) e preencher heatmap de Acessos com mais acessos no fim de semana
- [x] Tirar novo screenshot do dashboard com dados mockados em largura maior e substituir na seção Sistema Completo de Gestão
- [x] Remover borda amarela que aparece na foto mockup do dashboard na seção Sistema Completo de Gestão (era do preview mode, novo screenshot tirado sem borda)
- [x] Remover 3 perguntas do FAQ: 'Existe taxa por pedido?', 'Preciso de conhecimento técnico para usar?', 'Como funciona a gestão de entregadores?'
- [x] Duplicar seção Cardápio Digital na landing page - nova seção Programa de Fidelidade com layout invertido (texto à esquerda, celular à direita)
- [x] Bug: Carimbo do cartão fidelidade não é registrado após finalização do pedido (estabelecimento 30001, cliente 88999290000)

## Bug Fix: Programa de Fidelidade - Carimbos não registrados
- [x] Corrigir verificação de duplicação de carimbos: usar orderId em vez de orderNumber (orderNumber se repete entre dias)
- [x] Atualizar lógica em updateOrderStatus para verificar por orderId
- [x] Escrever teste vitest para validar a correção
- [x] Bug: Botão "Ver cupom ganho" não aparece quando cartão fidelidade atinge 12/12 carimbos (cliente 88999290000) - cupons antigos não existiam na tabela coupons, criado novo cupom FID-Y5JXL5
- [x] Adicionar 4 fotos reais do programa de fidelidade no mockup de celular da seção Programa de Fidelidade da landing page
- [x] Remover texto "Relatórios de engajamento" da seção Programa de Fidelidade na landing page
- [x] Remover texto "Funciona em qualquer dispositivo" da seção Cardápio Digital na landing page
- [x] Mover seção "Explore cases reais" para baixo da seção "Planos e Preços" na landing page
- [x] Redesenhar seção FAQ com layout 2 colunas: título/descrição/CTA à esquerda, perguntas accordion à direita
- [x] Ajustar background do footer para continuar com o mesmo degradê da seção "Comece agora" (CTAFinalSection)
- [x] Testar responsividade da seção FAQ e demais seções alteradas em dispositivos móveis
- [x] Criar nova seção "Integração com WhatsApp" na landing page: layout invertido (mockup esquerda, texto direita), conteúdo sobre notificações automáticas de status de pedidos via WhatsApp
- [x] Substituir mockup de chat simulado da seção WhatsApp pelo mesmo estilo de mockup com carrossel de imagens da seção Programa de Fidelidade
- [x] Bug: Notificação WhatsApp "saiu para entrega" não é enviada quando não há entregador cadastrado - deve enviar independente de ter entregador ou não
- [x] Adicionar foto real do WhatsApp no mockup de celular da seção Integração WhatsApp
- [x] Ajustar tamanho do mockup da seção "Gestão de Pedidos" para ficar igual ao da seção "Sistema completo de gestão"
- [x] Tirar screenshot da página de pedidos com menu minimizado e usar como imagem do mockup na seção Gestão de Pedidos

## Dados Mockados para conta admin@admin.com
- [x] Adicionar dados mockados na Dashboard (pedidos, faturamento, gráficos)
- [x] Adicionar pedidos mockados na página de Pedidos (vários status)
- [x] Adicionar pedidos agendados mockados
- [x] Adicionar entregadores mockados
- [x] Adicionar avaliações mockadas
- [x] Adicionar itens de estoque mockados

## Novo Screenshot do Dashboard para Landing Page
- [x] Tirar novo screenshot do dashboard admin@admin.com sem borda do preview e atualizar na seção Sistema Completo de Gestão (v2.mindi.com.br)

## Alternância de Imagens na Seção Sistema Completo de Gestão
- [x] Tirar screenshots das páginas (estoque, pedidos, dashboard, cardápio) sem barra de preview
- [x] Upload dos screenshots para S3
- [x] Implementar alternância de imagem do mockup sincronizada com o efeito de digitação do texto

## Seção Versátil para Diversos Segmentos
- [x] Adicionar seção "Versátil para diversos segmentos" abaixo de "Explore Cases Reais" com identidade visual Mindi

## Fotos Reais WhatsApp no Carrossel
- [x] Adicionar 3 fotos reais do WhatsApp como slides no mockup de celular da seção Integração WhatsApp

## Redesign Seção Segmentos
- [x] Redesenhar seção "Versátil para diversos segmentos" com estilo marquee/carrossel contínuo horizontal compacto (fundo branco, bordas suaves, emojis grandes passando em loop)

## Ajuste Faixa de Segmentos
- [ ] Aproximar faixa de segmentos dos cards de cases acima (reduzir espaçamento)
- [ ] Faixa de segmentos deve ocupar toda a largura disponível (full-width) igual ao carrossel de cases

## Seção Cupons + Campanhas SMS na Landing Page
- [x] Criar seção de Cupons + Campanhas SMS após seção de Integração WhatsApp

## Adicionar Docerias ao Marquee de Segmentos
- [x] Incluir "Docerias" na lista de segmentos do marquee da landing page

## Reaproveitar Seção Gestão de Pedidos para Cupons + SMS
- [x] Tirar screenshots das páginas de Campanhas SMS e Cupons via v2.mindi.com.br
- [x] Reescrever OrdersMockupSection com carrossel de screenshots, typewriter e ícones estilo Cardápio Digital
- [x] Remover MarketingBoostSection separada

## Dividir Seção Bombe suas Vendas em Duas Seções
- [x] Criar seção dedicada para Campanhas SMS com mockup, benefícios e CTA
- [x] Criar seção dedicada para Cupons de Desconto com mockup, benefícios e CTA
- [x] Remover OrdersMockupSection combinada
- [x] Atualizar LandingPage para usar as duas novas seções separadas

## Ajuste Seção Cupons de Desconto
- [x] Remover benefício "Frete grátis" da seção Cupons de Desconto na landing page

## Ajuste Seção Campanhas SMS
- [x] Remover benefício "Resultados mensuráveis" da seção Campanhas SMS na landing page

## Página Finanças (Admin)
- [x] Schema: tabela de despesas (expenses) com data, categoria, descrição, valor, forma de pagamento, observação
- [x] Schema: tabela de categorias de despesa (expense_categories) com categorias padrão
- [x] Schema: tabela de metas mensais de lucro (monthly_goals)
- [x] DB helpers: CRUD de despesas, listar categorias, calcular receita dos pedidos, resumo financeiro
- [x] tRPC procedures: finance router com todas as operações
- [x] Frontend: Header com título + botão "Novo lançamento"
- [x] Frontend: Cards resumo (Receita, Despesas, Lucro líquido, Ticket médio) com filtros de período
- [x] Frontend: Gráfico combinado (barras despesas + linha receita + linha lucro)
- [x] Frontend: Tabela de gastos com editar/excluir
- [x] Frontend: Modal "Registrar gasto" com todos os campos
- [x] Frontend: Sistema de categorias com opção de adicionar nova
- [x] Frontend: Indicador de saúde financeira (termômetro visual)
- [x] Frontend: Meta mensal de lucro
- [x] Frontend: Alerta se despesas > receita
- [x] Navegação: Adicionar "Finanças" no sidebar
- [x] Rota: Registrar /financas no App.tsx
- [x] Testes: vitest para procedures de finanças

## Dados Mockados Finanças (admin@admin.com)
- [x] Identificar establishmentId da conta admin@admin.com
- [x] Garantir categorias de despesa padrão criadas
- [x] Inserir despesas mockadas variadas (últimos 30 dias, múltiplas categorias e formas de pagamento)
- [x] Definir meta mensal de lucro
- [x] Verificar dados na página de Finanças

## Despesas Recorrentes (Extensão do Modal)
- [x] Schema: criar tabela recurring_expenses com todos os campos
- [x] DB helpers: CRUD de recorrências (criar, listar, atualizar, excluir, gerar lançamentos)
- [x] tRPC procedures: recurring router (create, list, update, delete, generatePending)
- [x] Job: geração automática de lançamentos na data programada
- [x] Modal: toggle "Tornar lançamento recorrente" abaixo do campo Valor
- [x] Modal: campos condicionais por frequência (Mensal/Semanal/Anual)
- [x] Modal: animação suave accordion ao expandir/recolher campos
- [x] Lógica: criar lançamento normal + registro recurring ao salvar com toggle ativo
- [x] Lógica: editar recorrência não altera lançamentos já gerados
- [x] Lógica: ao excluir recorrência, perguntar (só futuros / futuros + cancelar)
- [x] Lógica: não permitir duplicidade no mesmo dia
- [x] Testes vitest para procedures de recorrência

## Ajuste Gráfico Evolução Financeira
- [x] Alterar cor das barras de despesas no gráfico para vermelho

## Ajuste Cores Cards KPI Finanças
- [x] Card Despesas: alterar cor para vermelho
- [x] Card Lucro Líquido: alterar cor para azul
- [x] Card Ticket Médio: alterar cor para dourado (igual card itens em falta da Dashboard)

## Card Comparação Mensal (Finanças)
- [x] Backend: criar procedure getMonthlyComparison (receita, despesas, lucro do período atual vs anterior)
- [x] Frontend: card com 3 blocos resumo (Receita, Despesas, Lucro) com valor atual, anterior e variação %
- [x] Frontend: gráfico de barras agrupadas comparando mês atual vs anterior
- [x] Respeitar filtro de período já selecionado na página
- [x] Layout responsivo seguindo padrão visual da dashboard

## Redesign Card Comparação Mensal
- [x] Backend: alterar getMonthlyComparison para retornar últimos 4 meses (Receitas e Despesas por mês)
- [x] Frontend: redesenhar card no mesmo tamanho do Evolução Financeira (lg:col-span-2)
- [x] Frontend: barras agrupadas por mês (Receitas verde, Despesas vermelho), sem blocos de resumo
- [x] Remover os 3 blocos de resumo (Receita, Despesas, Lucro) do card

## Bug: Despesas por Categoria mostrando apenas Fornecedor
- [ ] Investigar e corrigir query getExpensesByCategory para mostrar todas as categorias com despesas

## Ajuste Visual Card Evolução Financeira
- [x] Atualizar card Evolução Financeira para seguir exatamente o visual do card Acumulado da semana da Dashboard

## Ajuste Visual Evolução Financeira (v2)
- [x] Manter ícone header e tags de legenda (dots coloridos)
- [x] Reverter gráfico para recharts ComposedChart (barras + linhas) estilo anterior

## Bug: Espaço em branco abaixo do gráfico Evolução Financeira
- [x] Remover espaço em branco extra abaixo do gráfico no card de Evolução Financeira

## Progresso da Meta no Botão
- [x] Remover seção separada "Meta mensal" com barra de progresso do card Indicadores
- [x] Integrar progresso da meta diretamente no botão "Meta" com preenchimento gradual
- [x] Degradê de cores: vermelho (<10%), laranja (<30%), amarelo (<70%), verde (>=70-100%)

## Ajuste visual KPI
- [x] Encurtar título "Lucro Líquido" para "L. Líquido" no card KPI

## Unificar estilo dos cards na página Finanças
- [x] Aplicar mesmo estilo do card Evolução Financeira no card Indicadores (ícone header, tipografia)
- [x] Aplicar mesmo estilo do card Evolução Financeira no card Comparação Mensal (ícone header, legend dots)
- [x] Aplicar mesmo estilo no card Despesas recorrentes (ícone header roxo)
- [x] Aplicar mesmo estilo no card Gastos registrados (ícone header vermelho)

## Card Faturamento por canal
- [x] Analisar schema de pedidos para identificar campo de canal (PDV, Menu público, Mesas)
- [x] Criar endpoint tRPC para faturamento por canal com filtro de período
- [x] Criar card UI com donut chart + lista detalhada (mesmo padrão visual dos outros cards)
- [x] Respeitar filtro global da página (Hoje / 7 dias / Este mês)
- [x] Estado vazio: "Sem faturamento registrado neste período"
- [x] Escrever testes vitest para o endpoint

## Redesign card Faturamento por canal
- [x] Remover donut chart do card
- [x] Mover card para dentro do grid, mesma coluna do Indicadores (abaixo dele)
- [x] Manter apenas lista de canais com barras de progresso

## Fix barras de progresso Faturamento por canal
- [x] Igualar estilo das barras de progresso do card Faturamento por canal ao card Indicadores

## Redesign Faturamento por canal - estilo meia lua
- [x] Implementar gráfico semi-circle (meia lua) com segmentos por canal
- [x] Lista abaixo com barra vertical colorida + nome + valor + percentual

## Dados mockados para admin@admin.com
- [ ] Identificar estabelecimento e IDs da conta admin
- [ ] Inserir pedidos mockados (PDV, Menu público, Mesas) com datas variadas
- [ ] Inserir despesas mockadas com categorias variadas
- [ ] Verificar dados na página de Finanças

## Redesign Faturamento por canal - Barras verticais
- [x] Substituir meia lua por mini barras verticais arredondadas com gradiente sutil
- [x] 3 barras (PDV, Menu público, Mesas) com alturas proporcionais ao faturamento

## Redesign Faturamento por canal - Barras horizontais
- [ ] Substituir barras verticais por 3 barras horizontais empilhadas (uma por canal)
- [ ] Estilo igual à barra de Saúde Financeira do card Indicadores

## Tooltip interativo nas barras de Faturamento por canal
- [x] Adicionar dados de período anterior no endpoint revenueByChannel (variação %)
- [x] Implementar tooltip ao hover nas barras com valor exato, pedidos e variação

## Fix tamanho mockups landing page
- [x] Igualar tamanho dos mockups das seções Campanhas SMS e Cupons de Desconto ao mockup da seção Sistema completo de gestão

## Card Formas de Pagamento
- [x] Analisar schema de pedidos para campo de forma de pagamento
- [x] Criar endpoint tRPC para faturamento por forma de pagamento com filtro de período
- [x] Criar componente Activity Rings (anéis concêntricos estilo Apple Watch)
- [x] Criar card UI com Activity Rings + lista detalhada (Pix, Cartão, Dinheiro)
- [x] Respeitar filtro global da página (Hoje / 7 dias / Este mês)
- [x] Estado vazio: "Nenhuma venda registrada neste período"
- [x] Escrever testes vitest para o endpoint

## Redesign Formas de Pagamento - Mini Area Charts
- [ ] Criar endpoint backend para breakdown diário por método de pagamento
- [ ] Substituir Activity Rings por 3 mini area charts (sparklines) lado a lado
- [ ] Cada sparkline mostra evolução diária do método (Pix, Cartão, Dinheiro)
- [ ] Manter valor total e percentual em cada mini card
- [ ] Verificar visual e rodar testes

## Restyle Formas de Pagamento
- [x] Substituir sparklines por barras horizontais com tooltip (mesmo estilo do Faturamento por canal)

## Mover Comparação Mensal para coluna esquerda
- [x] Mover card Comparação Mensal para dentro do grid, abaixo de Evolução Financeira (coluna esquerda)

## Fix altura das colunas no grid de Finanças
- [x] Fazer as duas colunas do grid terem a mesma altura (esticar cards da esquerda para alinhar com Formas de Pagamento)

## Fix SQL error paymentMethodDaily
- [x] Corrigir erro CONVERT_TZ na query getPaymentMethodDailyBreakdown (TiDB não suporta timezone strings)

## Fix espaçamento cards Faturamento e Formas de Pagamento
- [x] Igualar padding/espaçamento dos cards Faturamento por canal e Formas de Pagamento ao card Indicadores

## Distribuir altura igualmente entre Evolução Financeira e Comparação Mensal
- [x] Fazer os cards Evolução Financeira e Comparação Mensal dividirem o espaço igualmente na coluna esquerda (ambos com flex-1) em vez de Comparação Mensal crescer desproporcionalmente

## Fix alinhamento grid Finanças entre períodos
- [x] Corrigir grid para que Comparação Mensal e Formas de Pagamento se alinhem na parte inferior independentemente do período selecionado (evitar esticamento excessivo quando coluna direita tem menos conteúdo)

## Padronizar lista de Avaliações com lista de Entregadores
- [ ] Atualizar o visual da lista de avaliações para seguir o mesmo padrão visual da lista de entregadores (manter consistência entre páginas)

## Padronizar lista de Estoque
- [x] Padronizar a lista da página de Estoque para seguir o mesmo modelo visual das páginas de Entregadores e Avaliações (wrapper bg-card rounded-xl, tabela nativa HTML, DropdownMenu, layout mobile responsivo, TableSkeleton, EmptyState)

## Reestruturar grid Evolução Financeira + Comparação Mensal
- [x] Usar flex-col com flex-1 para que ambos os cards dividam a altura igualmente (empilhados verticalmente)
- [x] Remover alturas fixas e usar flex-grow (flex-1 min-h-[250px]) no gráfico
- [x] Garantir align-items: stretch via grid outer container
- [x] Cards usam flex flex-col flex-1
- [x] Sem hacks de margin, solução puramente estrutural com flex

## Fix esticamento desproporcional dos cards ao trocar período
- [x] Remover flex-1 dos cards Evolução Financeira e Comparação Mensal para que não estiquem além do conteúdo natural
- [x] Usar h-[300px] fixo nos containers de gráfico para garantir tamanho consistente sem esticamento
- [x] Garantir que ao trocar de "Este mês" para "7 dias" ou "Hoje", os cards não mantenham a altura expandida (items-start no grid)

## Fix definitivo: cards esquerda devem preencher altura da coluna direita
- [x] Remover items-start do grid (voltar ao stretch padrão) para colunas terem mesma altura
- [x] Restaurar flex-1 nos cards para dividir igualmente a altura da coluna esquerda
- [x] Usar min-h-[300px] (não h fixo) nos gráficos para garantir tamanho mínimo mas permitir crescimento
- [x] Testar em todos os períodos: cards devem sempre preencher sem espaço vazio

## Fix definitivo v2: cards com tamanho fixo e consistente
- [x] Remover flex-1 dos cards de gráfico (Evolução Financeira e Comparação Mensal)
- [x] Usar h-[300px] fixo nos containers de gráfico
- [x] Usar items-start no grid para que colunas não estiquem
- [x] Cards devem ter sempre o mesmo tamanho independente do período selecionado

## Fix final: grid stretch + flex-1 nos cards + flex-1 nos gráficos
- [x] Grid sem items-start (stretch padrão) para colunas terem mesma altura
- [x] flex-1 em ambos os cards (Evolução Financeira e Comparação Mensal) para dividir altura igualmente
- [x] flex-1 min-h-[250px] nos containers de gráfico para crescerem com o card
- [x] Testado: Este mês → 7 dias → Hoje - cards se ajustam corretamente em todas as transições

## Reestruturar grid Finanças - align-items:start + height:auto
- [x] Grid principal: align-items: start (não stretch)
- [x] Remover flex-1 dos cards Evolução Financeira e Comparação Mensal
- [x] Remover min-height dos containers de gráfico (usando h-[300px] fixo)
- [x] Cards com height: auto, crescendo apenas com conteúdo
- [x] Cada coluna: flex flex-col gap-6, ajustando-se ao conteúdo
- [x] Testar em todos os períodos: Hoje, 7 dias, Este mês

## Reestruturar grid Finanças - Remover wrappers de coluna
- [ ] Remover div wrapper "coluna esquerda" e "coluna direita"
- [ ] Colocar todos os 5 cards (Evolução, Indicadores, Comparação, Faturamento, Formas) diretamente no grid
- [ ] Grid: display:grid, grid-template-columns: repeat(2, minmax(0, 1fr)), gap:24px, align-items:start
- [ ] Sem flex-1, sem height fixa, sem min-height forçado
- [ ] Cada card independente, grid decide organização por linha
- [ ] Testar em todos os períodos: Hoje, 7 dias, Este mês

## Reestruturar grid Finanças - estrutura definitiva com 2 colunas fixas
- [x] Grid principal: grid-template-columns: 1.5fr 1fr, gap: 24px, align-items: start
- [x] Coluna esquerda (wrapper): flex flex-col gap-6 com Evolução Financeira + Comparação Mensal
- [x] Coluna direita (wrapper): flex flex-col gap-6 com Indicadores + Faturamento por canal + Formas de Pagamento
- [x] Sem flex-1 nos cards
- [x] Sem height fixa nos cards
- [x] Cada coluna cresce independente da outra

## Fix: Cards esquerda devem acompanhar altura da coluna direita dinamicamente
- [x] Grid com stretch (não start) para colunas terem mesma altura
- [x] flex-1 nos cards Evolução Financeira e Comparação Mensal para dividir espaço igualmente
- [x] flex-1 nos containers de gráfico para crescerem com o card
- [x] Ao trocar período (Hoje/7 dias/Este mês), cards da esquerda se adaptam à nova altura da direita
- [x] Testar: Este mês (direita alta) → 7 dias (direita baixa) → Hoje - altura se adapta em tempo real

## Bug: ResponsiveContainer não recalcula altura ao trocar período
- [x] Diagnosticar: Recharts ResponsiveContainer mantém altura anterior quando grid encolhe
- [x] Forçar remount dos gráficos ao trocar período (key baseada no período)
- [x] Testar: Este mês → 7 dias → Hoje - cards devem encolher ao voltar para período menor

## Seletor de abas na seção Gastos registrados (Gastos / Receitas / Recorrentes)
- [x] Adicionar botões de aba estilo período (Gastos / Receitas / Recorrentes) na seção Gastos registrados
- [x] Filtrar tabela por tipo: Gastos mostra despesas, Receitas mostra receita diária consolidada dos pedidos, Recorrentes mostra lançamentos recorrentes
- [x] Backend: criar endpoint para listar receitas diárias (faturamento por dia dos pedidos finalizados)
- [x] Atualizar título e contagem conforme aba selecionada
- [x] Manter mesmo estilo visual dos botões de seleção de período

## Card "Lançamentos futuros" - Timeline horizontal de despesas recorrentes
- [x] Backend: criar endpoint para gerar próximas ocorrências de lançamentos recorrentes
- [x] Calcular próximas datas de vencimento baseado na frequência (semanal/mensal/anual)
- [x] Ordenar por data mais próxima, mostrar pelo menos 6 lançamentos
- [x] Somar valor comprometido no mês selecionado
- [x] UI: Card com título "Lançamentos futuros" e subtítulo dinâmico com total do mês
- [x] UI: Mini cards horizontais com ícone, nome, valor e data de vencimento
- [x] UI: Setas entre cada mini card indicando sequência
- [x] UI: Scroll horizontal suave com scrollbar discreta
- [x] Badges de urgência: "Próximo" (< 3 dias), "Hoje", "Atrasado" (já passou)
- [x] Estado vazio: "Nenhum lançamento recorrente programado."
- [x] Testes para o novo endpoint

## Ajustes de layout na seção Finanças
- [x] Adicionar espaçamento entre card "Lançamentos futuros" e card "Gastos registrados"
- [x] Mover abas (Gastos / Receitas / Recorrentes) para fora do card, acima dele

## Alinhamento do header Gastos registrados
- [x] Alinhar header "Gastos registrados" com header "Lançamentos futuros" (mesmo padding horizontal)

## Visual dos mini cards Lançamentos futuros
- [x] Substituir emojis por ícones Lucide (Users, Home, Zap, Droplets, Globe, etc.)
- [x] Usar fundo colorido no padrão do sistema (bg com cor da categoria + baixa opacidade)
- [x] Trocar bg-muted/50 por bg-card para consistência visual
- [x] Adicionar hover effect (shadow-md + translate-y) igual aos StatCards

## Mini cards Lançamentos futuros - Borda lateral colorida
- [x] Remover ícones Lucide dos mini cards
- [x] Adicionar borda colorida na lateral esquerda (vermelha para despesas, verde para receitas)
- [x] Ajustar layout sem ícone (texto direto)

## Lista de Recorrentes - Formato tabela igual Gastos
- [x] Alterar aba Recorrentes para usar formato de tabela (DATA, CATEGORIA, DESCRIÇÃO, VALOR, PAGAMENTO, AÇÕES)
- [x] Manter mesma estrutura visual da aba Gastos (header, linhas, cores, espaçamentos)
- [x] Adaptar dados recorrentes para colunas (frequência como info adicional)

## StatCards - Mover indicador % para ao lado do título
- [x] Mover indicador de porcentagem (↓100%, ↑100%) para ao lado do título (ex: "RECEITA HOJE ↓100%")
- [x] Remover indicador de % de ao lado do valor

## Fix: Reverter StatCard da Dashboard
- [x] Reverter StatCard compartilhado ao formato original (% ao lado do valor)
- [x] Aplicar indicador % ao lado do título apenas nos StatCards da página de Finanças

## Mobile: Botão Período de Avaliação
- [x] Ocultar texto "X dias" no mobile, mostrar apenas ícone de relógio

## Trial: Urgência visual nos últimos 3 dias
- [x] Mudar cor do ícone para vermelho quando faltar 3 dias ou menos
- [x] Adicionar animação pulse no ícone quando faltar 3 dias ou menos

## Menu: Trocar ícone de Finanças
- [x] Substituir ícone Wallet por BadgeDollarSign para Finanças

## Header Finanças: Trocar ícone
- [x] Substituir ícone do header da página de Finanças para BadgeDollarSign

## Header Finanças: Cor do ícone
- [x] Trocar cor do ícone de emerald para azul

## Entregadores: Badge Pago e integração Finanças
- [x] Mostrar badge "Pago" com visual adequado quando entrega já foi paga (similar ao Pagar mas com status concluído)
- [x] Registrar pagamento de taxa de entrega como gasto na lista de gastos registrados em Finanças

## Landing: Aumentar mockups em 5%
- [x] Aumentar tamanho dos mockups em 5% nas seções: Sistema completo de gestão, Campanhas SMS, Cupons de Desconto

## Landing: Efeito zoom ao hover nos mockups
- [x] Adicionar efeito de zoom ao hover nos mockups das seções: Sistema completo de gestão, Campanhas SMS, Cupons de Desconto

## Landing: Texto do botão hero
- [x] Alterar texto do botão principal de "Criar conta grátis" para "Teste agora!"

## Landing: Texto CTA seção Sistema completo
- [x] Alterar texto do CTA de "Começar agora — é grátis" para "Teste grátis por 15 dias"

## Landing: Texto CTA menu mobile
- [x] Alterar texto do botão menu mobile de "Criar conta grátis" para "Teste 15 dias grátis"

## Finanças: Paginação igual Avaliações
- [x] Analisar modelo de paginação da página de Avaliações
- [x] Aplicar mesmo modelo de paginação nas listas de Gastos e Receitas (Recorrentes não tem paginação server-side)

## Finanças: Editar despesas recorrentes
- [x] Adicionar botão de editar na coluna AÇÕES da aba Recorrentes
- [x] Criar modal/dialog de edição de despesa recorrente (valor, descrição, categoria, frequência, pagamento)
- [x] Criar mutation backend para atualizar despesa recorrente (já existia)

## Lançamentos futuros: Incluir despesas avulsas com data futura
- [x] Analisar como o card de Lançamentos futuros busca dados atualmente
- [x] Ajustar para incluir despesas avulsas registradas com data futura no card
- [x] Total comprometido já inclui tanto recorrentes quanto avulsas futuras (calculado no frontend)

## Histórico de alterações em despesas recorrentes
- [x] Criar tabela recurringExpenseHistory no schema (campo alterado, valor anterior, valor novo, data)
- [x] Rodar migration (pnpm db:push)
- [x] Criar funções no db.ts para inserir e listar histórico
- [x] Integrar registro de histórico na mutation updateRecurring
- [x] Criar procedure para listar histórico de uma despesa recorrente
- [x] Criar UI para visualizar histórico (modal com botão History)
- [x] Múltiplas metas financeiras no card de Indicadores
- [x] Tabela financialGoals no schema para metas personalizadas
- [x] Funções CRUD no db.ts (create, list, update, delete)
- [x] Procedures tRPC (listGoals, createGoalCustom, updateGoalCustom, deleteGoalCustom)
- [x] UI: lista de metas customizadas com barra de progresso abaixo da meta principal
- [x] UI: botão "+ Nova meta" com borda tracejada para criar novas metas
- [x] UI: modal de criação/edição de meta (nome + valor alvo)
- [x] UI: botão de excluir meta ao passar o mouse
- [x] Testes vitest para CRUD de metas financeiras (6 testes passando)
- [x] Corrigir badges cortados no card Lançamentos Futuros (adicionar pt-3 ao container)
- [x] Alterar cor do badge "Hoje" de laranja para verde (bg-emerald-500)
- [x] Ajustar largura dos mini cards de Lançamentos Futuros de 150px para 165px
- [x] Clique nos cards de lançamento futuro abre edição da despesa recorrente correspondente
- [x] Tooltip nos cards truncados de Lançamentos Futuros (exibir nome completo ao hover)
- [x] Botões Nova meta e Gerenciar categorias lado a lado no card de Indicadores
- [x] Barra de rolagem horizontal do card Lançamentos Futuros só aparece ao hover
- [x] Marcar lançamento futuro (recorrente ou avulso) como pago diretamente do card
- [x] Indicador visual de "já pago" nos cards de Lançamentos Futuros (fundo verde claro ou badge Pago)
- [x] Desfazer pagamento via botão no toast de sucesso
- [x] Diálogo de confirmação antes de marcar como pago (com opção de ajustar valor/data)
- [x] Ocultar cards pagos do carrossel de Lançamentos Futuros (não exibir após marcar como pago)
- [x] Alterar cor do badge "Hoje" para amarelo (mesma cor do ícone do card)
- [x] Cards pagos devem permanecer visíveis com badge Pago no dia, e só ocultar após meia-noite (próximo dia)
- [x] Permitir editar lançamentos avulsos ao clicar nos cards de Lançamentos Futuros
- [x] Badge Pago não aparece em lançamentos avulsos marcados como pagos no carrossel
- [x] Gráfico de Comparação Mensal deve exibir últimos 6 meses em vez de 4
- [x] Remover fundo escuro do hover no gráfico de Comparação Mensal (manter apenas tooltip)
- [x] Card de Indicadores: mostrar mensagem neutra (ex: "Sem movimentação") em vez de "Prejuízo" quando não há registros no período
- [x] Restaurar fundo do hover no gráfico Comparação Mensal com 60% de transparência
- [x] Modernizar estilo do gráfico interno no card de Evolução Financeira
- [x] Uniformizar cor verde nos gráficos (Comparação Mensal + Evolução Financeira) com o verde da barra Menu Público
- [x] Uniformizar cor vermelha nos gráficos (Comparação Mensal + Evolução Financeira) com o vermelho da borda dos cards Lançamentos Futuros
- [x] Aplicar gradiente (degradê de baixo para cima) nas barras do gráfico de Comparação Mensal igual ao de Evolução Financeira
- [x] Substituir window.confirm por modal do sistema ao excluir gastos registrados
- [x] Alterar rótulo 'Lucro máximo' para 'Excelente' na barra de saúde financeira do card Indicadores
- [x] Adicionar indicador 'Boa' no meio da barra de saúde financeira
- [x] Adicionar cores distintas aos rótulos da barra de saúde financeira (Prejuízo=vermelho, Boa=âmbar, Excelente=verde)
- [x] Animação suave de preenchimento na barra de saúde financeira ao carregar o card de Indicadores
- [x] Schema DB: tabela cashback_config (percentual, modo aplicação, uso parcial, categorias)
- [x] Schema DB: tabela cashback_transactions (tipo geração/uso, pedido_id, valor, saldo)
- [x] Schema DB: campo reward_program_type no estabelecimento (fidelidade ou cashback)
- [x] Schema DB: campos valor_cashback_utilizado e valor_original nos pedidos (usando cashbackTransactions)
- [x] Backend: routers de configuração cashback (get/update config)
- [x] Backend: routers de saldo e movimentações cashback (consulta saldo, histórico)
- [x] Backend: validação de saldo no backend ao aplicar cashback no pedido
- [x] Backend: geração automática de cashback ao concluir pedido
- [x] Admin: seção Programa de Recompensas com radio button exclusivo (Fidelidade/Cashback)
- [x] Admin: configuração do cashback (percentual, categorias, uso parcial)
- [x] Menu Público: badge de cashback nos produtos (+X% de cashback)
- [x] Menu Público: Minha Carteira (saldo, histórico acumulado, histórico utilizado)
- [x] Menu Público: lógica de login para visualizar saldo cashback
- [x] Modal Pagamento: opção usar cashback com cálculo em tempo real
- [x] Modal Pagamento: regras de aplicação (parcial, total, excedente)
- [x] Testes vitest para cashback
- [x] Reduzir tamanho do container de cashback no modal de entrega/pagamento
- [x] Mover cashback do modal de entrega para bottom sheet separado acionado por ícone de carteira ao lado do botão Próximo
- [x] Corrigir texto unicode quebrado 'Saldo disponível' no bottom sheet de cashback
- [x] Trocar cores azuis do cashback para vermelho (mesma cor do modal de entrega)
- [x] Alterar cabeçalho do bottom sheet de cashback para mesmo padrão do 'Meus Pedidos' (fundo vermelho, texto branco)
- [x] Adicionar variáveis cashbackEarned e cashbackTotal ao template de mensagem de pedido finalizado
- [x] Lógica de envio: só incluir bloco de cashback se cashback ativo e valor > 0
- [x] Garantir saldo atualizado antes do envio da mensagem (transação no banco)
- [x] Formatar valores com 2 casas decimais e vírgula como separador (padrão BR)
- [x] Testes vitest para notificação de cashback
- [x] Alterar modal de cashback: dialog centralizado no desktop, bottom sheet apenas no mobile
- [x] Adicionar variáveis {{cashbackEarned}} e {{cashbackTotal}} ao editor de templates WhatsApp
- [x] Corrigir preview das variáveis cashback no template: exibir 'Cashback ganho: R$X,XX' e 'Cashback acumulado: R$X,XX'
- [x] Corrigir substituição das variáveis cashback no backend: incluir rótulos 'Cashback ganho:' e 'Cashback acumulado:' na mensagem WhatsApp
- [x] Remover opção de uso parcial do cashback: manter apenas uso total do saldo (config admin, backend, frontend)
- [x] Corrigir espaço em branco na mensagem WhatsApp de pedido finalizado quando cashback está desativado
- [x] Bug: menu público mostra quantidade de complementos como máximo do grupo em vez do maxQuantity configurado no admin
- [x] Bug: dessincronização do maxQuantity entre página de Complementos (fonte da verdade) e edição individual do produto
- [x] Bug: dados existentes dessincronizados - página de Complementos mostra 50 mas produtos individuais continuam com 18
- [x] Bug: preços de complementos multiplicados por 100 na edição do produto (ex: R$3,00 aparece como R$300,00) e no menu público
- [x] Filtro interativo nos cards de status do estoque (OK, Baixo, Crítico, Em Falta) com toggle e sincronização com select
- [x] Criar nova variável de template WhatsApp para exibir apenas Total + Forma de pagamento
- [x] Adicionar barra lateral vermelha nos submenus do menu 'Menu' igual ao WhatsApp
- [x] Bug: template configurado de 'Novo Pedido' não está sendo usado na notificação WhatsApp - sistema envia template padrão com itens (não era bug: print antigo do cliente)
- [x] Bug: borda colorida nos submenus do Menu está do lado esquerdo em vez do direito
- [x] Bug: borda não aparece no menu Pedidos quando selecionado
- [x] Bug: scroll da sidebar volta ao topo ao clicar num menu
- [x] Exibir "Troco a devolver" no card Entrega e Pagamento do modal de detalhes do pedido
- [x] Exibir "Troco a devolver" nos recibos de impressão abaixo da observação do troco
