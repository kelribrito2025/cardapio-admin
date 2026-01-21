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
