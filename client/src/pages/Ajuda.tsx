import { useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { PageHeader } from "@/components/shared";
import {
  MessageCircle,
  Mail,
  Phone,
  Play,
  ChevronDown,
  ChevronUp,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Contact Card Component
interface ContactCardProps {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  subtitle: string;
  href: string;
}

function ContactCard({ icon, iconBg, title, subtitle, href }: ContactCardProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex flex-col items-center p-6 bg-card rounded-2xl border border-border/50 shadow-soft hover:shadow-elevated hover:-translate-y-1 transition-all duration-300 cursor-pointer"
    >
      <div
        className={cn(
          "w-14 h-14 rounded-full flex items-center justify-center mb-4",
          iconBg
        )}
      >
        {icon}
      </div>
      <h3 className="text-base font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground text-center">{subtitle}</p>
    </a>
  );
}

// Video Chapter Component
interface VideoChapterProps {
  time: string;
  title: string;
  onClick?: () => void;
}

function VideoChapter({ time, title, onClick }: VideoChapterProps) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 w-full py-3 px-4 text-left hover:bg-muted/50 rounded-lg transition-colors group"
    >
      <Clock className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
      <span className="text-sm text-muted-foreground font-medium">{time}</span>
      <span className="text-sm text-foreground">– {title}</span>
    </button>
  );
}

// FAQ Accordion Item Component
interface FAQItemProps {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
}

function FAQItem({ question, answer, isOpen, onToggle }: FAQItemProps) {
  return (
    <div className="border-b border-border/50 last:border-b-0">
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full py-4 px-4 text-left hover:bg-muted/30 transition-colors rounded-lg"
      >
        <span className="text-sm font-medium text-foreground pr-4">{question}</span>
        {isOpen ? (
          <ChevronUp className="h-5 w-5 text-muted-foreground flex-shrink-0" />
        ) : (
          <ChevronDown className="h-5 w-5 text-muted-foreground flex-shrink-0" />
        )}
      </button>
      <div
        className={cn(
          "overflow-hidden transition-all duration-300 ease-in-out",
          isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <p className="px-4 pb-4 text-sm text-muted-foreground leading-relaxed">
          {answer}
        </p>
      </div>
    </div>
  );
}

// FAQ Data
const faqData = [
  {
    question: "Como faço para conectar minha conta bancária?",
    answer:
      "Vá em Contas Bancárias → Conectar nova conta → procure seu banco e faça o login de forma segura via Open Banking. Nunca armazenamos suas credenciais.",
  },
  {
    question: "Meus dados estão seguros e são privados?",
    answer:
      "Sim. Utilizamos criptografia e seguimos boas práticas de segurança para proteger seus dados.",
  },
  {
    question: "Posso cancelar minha assinatura a qualquer momento?",
    answer:
      "Sim. Você pode cancelar sua assinatura a qualquer momento diretamente pelo painel, sem multas.",
  },
  {
    question: "Como funciona o bot do WhatsApp?",
    answer:
      "Nosso bot permite consultar informações, receber alertas e interagir com sua conta diretamente pelo WhatsApp.",
  },
];

// Video Chapters Data
const videoChapters = [
  { time: "0:00", title: "Introdução" },
  { time: "1:05", title: "Visão Geral do Painel" },
  { time: "3:00", title: "Conectando Contas Bancárias" },
  { time: "6:00", title: "Entendendo os Gráficos" },
  { time: "10:00", title: "Definindo Metas" },
];

export default function Ajuda() {
  const [openFAQ, setOpenFAQ] = useState<number | null>(0);

  const toggleFAQ = (index: number) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

  return (
    <AdminLayout>
      <PageHeader
        title="Ajuda e Suporte"
        description="Encontre respostas e entre em contato conosco"
      />

      {/* Block 1 - Contact Channels */}
      <div className="mt-6 mb-8">
        <h2 className="text-lg font-semibold text-foreground mb-5">
          Como podemos ajudar?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ContactCard
            icon={<MessageCircle className="h-6 w-6 text-white" />}
            iconBg="bg-green-500"
            title="Suporte via WhatsApp"
            subtitle="Fale conosco instantaneamente"
            href="https://wa.me/5511999999999"
          />
          <ContactCard
            icon={<Mail className="h-6 w-6 text-white" />}
            iconBg="bg-amber-500"
            title="Envie um e-mail"
            subtitle="suporte@seudominio.com"
            href="mailto:suporte@seudominio.com"
          />
          <ContactCard
            icon={<Phone className="h-6 w-6 text-white" />}
            iconBg="bg-blue-500"
            title="Suporte por Telefone"
            subtitle="+55 (11) 99999-9999"
            href="tel:+5511999999999"
          />
        </div>
      </div>

      {/* Block 2 - Video Tutorial */}
      <div className="bg-card rounded-2xl border border-border/50 shadow-soft p-6 mb-8">
        <h2 className="text-lg font-semibold text-foreground mb-5">Tutorial</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Video Player */}
          <div>
            <div className="relative aspect-video bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl overflow-hidden group cursor-pointer">
              {/* Placeholder for video thumbnail */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <Play className="h-7 w-7 text-white ml-1" />
                </div>
              </div>
              {/* Video title overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                <h3 className="text-white font-bold text-lg leading-tight">
                  Tutorial do Painel Financeiro
                  <br />
                  (2025) – Guia Completo
                </h3>
              </div>
            </div>
            <p className="mt-3 text-sm font-medium text-foreground">
              Tutorial do Painel Financeiro (2025) – Guia Completo
            </p>
          </div>

          {/* Video Chapters */}
          <div>
            <h3 className="text-base font-semibold text-foreground mb-3">
              Capítulos do Vídeo
            </h3>
            <div className="space-y-1">
              {videoChapters.map((chapter, index) => (
                <VideoChapter
                  key={index}
                  time={chapter.time}
                  title={chapter.title}
                  onClick={() => {
                    // Future: implement video seek functionality
                    console.log(`Seek to ${chapter.time}`);
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Block 3 - FAQ */}
      <div className="bg-card rounded-2xl border border-border/50 shadow-soft p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Perguntas Frequentes
        </h2>
        <div className="divide-y divide-border/50">
          {faqData.map((faq, index) => (
            <FAQItem
              key={index}
              question={faq.question}
              answer={faq.answer}
              isOpen={openFAQ === index}
              onToggle={() => toggleFAQ(index)}
            />
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
