import { Shield, ArrowLeft, Lock, Eye, Database, UserCheck, Bell, Trash2, Mail, Globe } from "lucide-react";
import { Link } from "wouter";

export default function Privacidade() {
  const appName = "Cardápio Admin";
  const lastUpdated = "25 de fevereiro de 2026";

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/landing" className="flex items-center gap-2 text-gray-600 hover:text-red-600 transition-colors">
            <ArrowLeft className="h-5 w-5" />
            <span className="text-sm font-medium">Voltar</span>
          </Link>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-red-600" />
            <span className="font-semibold text-gray-900">{appName}</span>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-red-600 to-red-700 text-white py-16 sm:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-2xl mb-6">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-4">Política de Privacidade</h1>
          <p className="text-red-100 text-lg max-w-2xl mx-auto">
            Sua privacidade é importante para nós. Esta política descreve como coletamos, usamos e protegemos suas informações.
          </p>
          <p className="text-red-200 text-sm mt-4">Última atualização: {lastUpdated}</p>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <div className="space-y-10">

          {/* 1. Introdução */}
          <Section
            icon={<Globe className="h-5 w-5" />}
            title="1. Introdução"
          >
            <p>
              O <strong>{appName}</strong> é uma plataforma de gestão de cardápio digital e pedidos online, desenvolvida para restaurantes, 
              lanchonetes, pizzarias e demais estabelecimentos do setor alimentício. Esta Política de Privacidade tem como objetivo 
              informar aos usuários (proprietários de estabelecimentos e seus clientes finais) sobre como seus dados pessoais são 
              coletados, utilizados, armazenados e protegidos ao utilizar nossos serviços, incluindo o aplicativo móvel e a plataforma web.
            </p>
            <p>
              Ao utilizar o {appName}, você concorda com as práticas descritas nesta Política de Privacidade. Caso não concorde com 
              algum dos termos aqui apresentados, recomendamos que não utilize nossos serviços.
            </p>
          </Section>

          {/* 2. Dados Coletados */}
          <Section
            icon={<Database className="h-5 w-5" />}
            title="2. Dados que Coletamos"
          >
            <p>Coletamos diferentes tipos de informações para fornecer e melhorar nossos serviços:</p>
            
            <h4 className="font-semibold text-gray-900 mt-4 mb-2">2.1. Dados dos Proprietários de Estabelecimentos</h4>
            <ul className="list-disc list-inside space-y-1 text-gray-600 ml-2">
              <li>Nome completo e e-mail para criação e gestão da conta</li>
              <li>Nome do estabelecimento, endereço, telefone e logotipo</li>
              <li>Informações do cardápio (produtos, preços, categorias, complementos)</li>
              <li>Dados de pedidos e histórico de vendas</li>
              <li>Configurações de impressão e integrações (WhatsApp, impressoras)</li>
              <li>Informações financeiras para processamento de pagamentos via Stripe</li>
            </ul>

            <h4 className="font-semibold text-gray-900 mt-4 mb-2">2.2. Dados dos Clientes Finais (Consumidores)</h4>
            <ul className="list-disc list-inside space-y-1 text-gray-600 ml-2">
              <li>Nome e telefone para identificação do pedido</li>
              <li>Endereço de entrega (quando aplicável)</li>
              <li>Histórico de pedidos realizados</li>
              <li>Preferências de pagamento (método escolhido, sem armazenamento de dados de cartão)</li>
            </ul>

            <h4 className="font-semibold text-gray-900 mt-4 mb-2">2.3. Dados Técnicos Coletados Automaticamente</h4>
            <ul className="list-disc list-inside space-y-1 text-gray-600 ml-2">
              <li>Endereço IP e informações do navegador (user agent)</li>
              <li>Dados de uso e navegação na plataforma</li>
              <li>Cookies e tecnologias similares para manutenção de sessão</li>
              <li>Informações de geolocalização (apenas quando autorizado pelo usuário)</li>
            </ul>
          </Section>

          {/* 3. Uso dos Dados */}
          <Section
            icon={<Eye className="h-5 w-5" />}
            title="3. Como Utilizamos seus Dados"
          >
            <p>Utilizamos as informações coletadas para as seguintes finalidades:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 ml-2 mt-3">
              <li><strong>Prestação de serviços:</strong> Permitir a criação e gestão de cardápios digitais, processamento de pedidos, controle de estoque e gestão financeira.</li>
              <li><strong>Comunicação:</strong> Enviar notificações sobre pedidos, atualizações do sistema e comunicações operacionais via WhatsApp, SMS ou e-mail.</li>
              <li><strong>Processamento de pagamentos:</strong> Gerenciar assinaturas e pagamentos através do Stripe, nosso processador de pagamentos certificado PCI-DSS.</li>
              <li><strong>Melhoria dos serviços:</strong> Analisar padrões de uso para aprimorar funcionalidades, corrigir erros e desenvolver novos recursos.</li>
              <li><strong>Segurança:</strong> Proteger contra fraudes, acessos não autorizados e outras atividades maliciosas.</li>
              <li><strong>Obrigações legais:</strong> Cumprir exigências legais, regulatórias e fiscais aplicáveis.</li>
            </ul>
          </Section>

          {/* 4. Compartilhamento */}
          <Section
            icon={<UserCheck className="h-5 w-5" />}
            title="4. Compartilhamento de Dados"
          >
            <p>
              Não vendemos, alugamos ou comercializamos seus dados pessoais. Podemos compartilhar informações apenas nas seguintes situações:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 ml-2 mt-3">
              <li><strong>Processadores de pagamento:</strong> Compartilhamos dados necessários com o Stripe para processar pagamentos de forma segura.</li>
              <li><strong>Serviços de comunicação:</strong> Utilizamos APIs de WhatsApp e SMS para enviar notificações de pedidos aos clientes dos estabelecimentos.</li>
              <li><strong>Provedores de infraestrutura:</strong> Nossos dados são armazenados em servidores seguros com criptografia em trânsito e em repouso.</li>
              <li><strong>Obrigações legais:</strong> Podemos divulgar informações quando exigido por lei, ordem judicial ou autoridade competente.</li>
              <li><strong>Entre estabelecimento e cliente:</strong> Os dados do pedido (nome, endereço de entrega, telefone) são compartilhados entre o cliente e o estabelecimento para viabilizar a entrega.</li>
            </ul>
          </Section>

          {/* 5. Armazenamento e Segurança */}
          <Section
            icon={<Lock className="h-5 w-5" />}
            title="5. Armazenamento e Segurança"
          >
            <p>
              Adotamos medidas técnicas e organizacionais adequadas para proteger seus dados pessoais contra acesso não autorizado, 
              alteração, divulgação ou destruição. Entre as medidas implementadas:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 ml-2 mt-3">
              <li>Criptografia SSL/TLS para todas as comunicações entre o navegador e nossos servidores</li>
              <li>Armazenamento seguro de senhas com hash criptográfico (bcrypt)</li>
              <li>Tokens JWT para autenticação de sessão com expiração automática</li>
              <li>Acesso restrito aos dados por meio de controle de permissões baseado em funções (RBAC)</li>
              <li>Backups regulares dos dados em servidores redundantes</li>
              <li>Monitoramento contínuo de segurança e detecção de ameaças</li>
            </ul>
            <p className="mt-3">
              Os dados são armazenados em servidores localizados em data centers com certificações de segurança reconhecidas 
              internacionalmente. Mantemos seus dados pelo tempo necessário para a prestação dos serviços ou conforme exigido por lei.
            </p>
          </Section>

          {/* 6. Cookies */}
          <Section
            icon={<Bell className="h-5 w-5" />}
            title="6. Cookies e Tecnologias Similares"
          >
            <p>Utilizamos cookies e tecnologias similares para:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 ml-2 mt-3">
              <li><strong>Cookies essenciais:</strong> Necessários para o funcionamento da plataforma, como manutenção de sessão de login e preferências do usuário.</li>
              <li><strong>Cookies de desempenho:</strong> Coletam informações anônimas sobre como os usuários utilizam a plataforma para fins de melhoria.</li>
              <li><strong>Armazenamento local (localStorage):</strong> Utilizado para salvar preferências de interface, como tema (claro/escuro) e configurações de impressão.</li>
            </ul>
            <p className="mt-3">
              Você pode gerenciar as configurações de cookies através do seu navegador. No entanto, desabilitar cookies essenciais 
              pode afetar o funcionamento adequado da plataforma.
            </p>
          </Section>

          {/* 7. Direitos do Usuário */}
          <Section
            icon={<UserCheck className="h-5 w-5" />}
            title="7. Seus Direitos"
          >
            <p>
              Em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018), você possui os seguintes direitos 
              em relação aos seus dados pessoais:
            </p>
            <div className="grid sm:grid-cols-2 gap-3 mt-4">
              <RightCard title="Acesso" description="Solicitar uma cópia dos dados pessoais que mantemos sobre você." />
              <RightCard title="Correção" description="Solicitar a correção de dados incompletos, inexatos ou desatualizados." />
              <RightCard title="Exclusão" description="Solicitar a eliminação dos seus dados pessoais, ressalvadas as obrigações legais." />
              <RightCard title="Portabilidade" description="Solicitar a transferência dos seus dados para outro fornecedor de serviço." />
              <RightCard title="Revogação" description="Revogar o consentimento para o tratamento dos seus dados a qualquer momento." />
              <RightCard title="Informação" description="Ser informado sobre as entidades com as quais seus dados são compartilhados." />
            </div>
            <p className="mt-4">
              Para exercer qualquer um desses direitos, entre em contato conosco através dos canais indicados na seção de contato abaixo.
            </p>
          </Section>

          {/* 8. Dados de Menores */}
          <Section
            icon={<Shield className="h-5 w-5" />}
            title="8. Proteção de Dados de Menores"
          >
            <p>
              Nossos serviços não são direcionados a menores de 18 anos. Não coletamos intencionalmente dados pessoais de crianças 
              ou adolescentes. Caso tomemos conhecimento de que dados de um menor foram coletados sem o consentimento dos pais ou 
              responsáveis legais, tomaremos as medidas necessárias para excluí-los de nossos sistemas.
            </p>
          </Section>

          {/* 9. Retenção de Dados */}
          <Section
            icon={<Trash2 className="h-5 w-5" />}
            title="9. Retenção e Exclusão de Dados"
          >
            <p>
              Mantemos seus dados pessoais pelo tempo necessário para cumprir as finalidades descritas nesta política, incluindo 
              obrigações legais, contábeis e fiscais. Os períodos de retenção são:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 ml-2 mt-3">
              <li><strong>Dados de conta:</strong> Mantidos enquanto a conta estiver ativa. Após solicitação de exclusão, os dados são removidos em até 30 dias, exceto quando houver obrigação legal de retenção.</li>
              <li><strong>Dados de pedidos:</strong> Mantidos por 5 anos para fins fiscais e contábeis, conforme legislação brasileira.</li>
              <li><strong>Dados de pagamento:</strong> Gerenciados pelo Stripe conforme sua própria política de retenção. Não armazenamos dados de cartão de crédito.</li>
              <li><strong>Logs de acesso:</strong> Mantidos por 6 meses conforme o Marco Civil da Internet (Lei nº 12.965/2014).</li>
            </ul>
          </Section>

          {/* 10. Alterações */}
          <Section
            icon={<Bell className="h-5 w-5" />}
            title="10. Alterações nesta Política"
          >
            <p>
              Podemos atualizar esta Política de Privacidade periodicamente para refletir mudanças em nossas práticas ou em 
              requisitos legais. Quando realizarmos alterações significativas, notificaremos os usuários através da plataforma 
              ou por e-mail. A data da última atualização será sempre indicada no topo desta página.
            </p>
            <p>
              Recomendamos que você revise esta política regularmente para se manter informado sobre como protegemos seus dados.
            </p>
          </Section>

          {/* 11. Contato */}
          <Section
            icon={<Mail className="h-5 w-5" />}
            title="11. Contato"
          >
            <p>
              Se você tiver dúvidas, preocupações ou solicitações relacionadas a esta Política de Privacidade ou ao tratamento 
              dos seus dados pessoais, entre em contato conosco:
            </p>
            <div className="mt-4 bg-gray-50 rounded-xl p-6 border border-gray-100">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-red-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-500">E-mail</p>
                    <p className="font-medium text-gray-900">contato@cardapioadmin.com.br</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Globe className="h-5 w-5 text-red-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-500">Plataforma</p>
                    <p className="font-medium text-gray-900">{appName}</p>
                  </div>
                </div>
              </div>
            </div>
            <p className="mt-4 text-sm text-gray-500">
              Responderemos às suas solicitações no prazo de até 15 dias úteis, conforme previsto na LGPD.
            </p>
          </Section>

        </div>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-gray-200 text-center">
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} {appName}. Todos os direitos reservados.
          </p>
          <p className="text-xs text-gray-400 mt-2">
            Esta política está em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018).
          </p>
        </div>
      </main>
    </div>
  );
}

// Componente de Seção
function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 bg-gray-50 border-b border-gray-100">
        <div className="flex items-center justify-center w-9 h-9 bg-red-100 text-red-600 rounded-lg">
          {icon}
        </div>
        <h2 className="text-lg font-bold text-gray-900">{title}</h2>
      </div>
      <div className="px-6 py-5 space-y-3 text-gray-700 leading-relaxed text-[15px]">
        {children}
      </div>
    </section>
  );
}

// Componente de Card de Direito
function RightCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
      <h4 className="font-semibold text-gray-900 text-sm mb-1">{title}</h4>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  );
}
