import { useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import {
  MessageCircle,
  Mail,
  Phone,
  Play,
  ChevronDown,
  ChevronUp,
  Bell,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

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
      className="flex flex-col items-center p-6 bg-white rounded-xl border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
    >
      <div
        className={cn(
          "w-12 h-12 rounded-full flex items-center justify-center mb-3",
          iconBg
        )}
      >
        {icon}
      </div>
      <h3 className="text-sm font-semibold text-gray-900 mb-0.5">{title}</h3>
      <p className="text-xs text-gray-500 text-center">{subtitle}</p>
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
      className="flex items-center gap-2 w-full py-3 px-2 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
    >
      <span className="text-sm text-gray-900 font-medium">{time}</span>
      <span className="text-sm text-gray-600">– {title}</span>
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
    <div className="bg-gray-50 rounded-lg mb-2 last:mb-0">
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full py-4 px-5 text-left"
      >
        <span className="text-sm font-medium text-gray-900 pr-4">{question}</span>
        {isOpen ? (
          <ChevronUp className="h-5 w-5 text-gray-400 flex-shrink-0" />
        ) : (
          <ChevronDown className="h-5 w-5 text-gray-400 flex-shrink-0" />
        )}
      </button>
      <div
        className={cn(
          "overflow-hidden transition-all duration-300 ease-in-out",
          isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <p className="px-5 pb-4 text-sm text-gray-600 leading-relaxed">
          {answer}
        </p>
      </div>
    </div>
  );
}

// FAQ Data
const faqData = [
  {
    question: "How do I connect my bank account?",
    answer:
      "Go to Bank Accounts → \"Connect New Account\" → search for your bank → log in securely using Open Banking. We never store your credentials.",
  },
  {
    question: "Is my data safe and private?",
    answer:
      "Yes. We use encryption and follow best security practices to protect your data. Your information is never shared with third parties.",
  },
  {
    question: "Can I cancel my subscription anytime?",
    answer:
      "Yes. You can cancel your subscription at any time directly from the dashboard, without any penalties or fees.",
  },
  {
    question: "How does the WhatsApp bot work?",
    answer:
      "Our bot allows you to check information, receive alerts, and interact with your account directly through WhatsApp.",
  },
];

// Video Chapters Data
const videoChapters = [
  { time: "0:00", title: "Introduction" },
  { time: "1:05", title: "Dashboard Overview" },
  { time: "3:00", title: "Connecting Bank Accounts" },
  { time: "6:00", title: "Understanding Charts" },
  { time: "10:00", title: "Setting Goals" },
  { time: "10:00", title: "Setting Goals" },
  { time: "10:00", title: "Setting Goals" },
  { time: "10:00", title: "Setting Goals" },
];

export default function Ajuda() {
  const [openFAQ, setOpenFAQ] = useState<number | null>(0);

  const toggleFAQ = (index: number) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">Help & Support</h1>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5 text-gray-500" />
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center">
              4
            </span>
          </Button>
          <Button variant="outline" size="sm" className="gap-2 text-gray-600">
            <HelpCircle className="h-4 w-4" />
            Need help
          </Button>
        </div>
      </div>

      {/* Block 1 - Contact Channels */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
        <h2 className="text-base font-semibold text-gray-900 mb-5">
          What can we help you with?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ContactCard
            icon={<MessageCircle className="h-5 w-5 text-white" />}
            iconBg="bg-green-500"
            title="WhatsApp Support"
            subtitle="Talk to us instantly"
            href="https://wa.me/5511999999999"
          />
          <ContactCard
            icon={<Mail className="h-5 w-5 text-white" />}
            iconBg="bg-amber-400"
            title="Email Us"
            subtitle="support@grandmafy.com"
            href="mailto:support@grandmafy.com"
          />
          <ContactCard
            icon={<Phone className="h-5 w-5 text-white" />}
            iconBg="bg-cyan-500"
            title="Call Support"
            subtitle="+55 (11) 99999-9999"
            href="tel:+5511999999999"
          />
        </div>
      </div>

      {/* Block 2 - Video Tutorial */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
        <h2 className="text-base font-semibold text-gray-900 mb-5">Tutorial</h2>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Video Player - 3 columns */}
          <div className="lg:col-span-3">
            <div className="relative aspect-video bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 rounded-xl overflow-hidden group cursor-pointer">
              {/* Dashboard mockup background */}
              <div className="absolute inset-0 opacity-40">
                <div className="absolute top-4 left-4 text-white text-xs font-medium">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 bg-white/20 rounded" />
                    <span>Dashboard</span>
                  </div>
                </div>
              </div>
              
              {/* Play button */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <Play className="h-7 w-7 text-white ml-1" fill="white" />
                </div>
              </div>
              
              {/* Video title overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-5">
                <h3 className="text-white font-bold text-xl leading-tight">
                  Bank Finance Dashboard Tutorial
                  <br />
                  (2025) – Complete Guide
                </h3>
              </div>
            </div>
            <p className="mt-3 text-sm font-medium text-gray-900">
              Bank Finance Dashboard Tutorial (2025) – Complete Guide
            </p>
          </div>

          {/* Video Chapters - 2 columns */}
          <div className="lg:col-span-2">
            <h3 className="text-base font-semibold text-gray-900 mb-4">
              Video Chapters
            </h3>
            <div className="max-h-[320px] overflow-y-auto">
              {videoChapters.map((chapter, index) => (
                <VideoChapter
                  key={index}
                  time={chapter.time}
                  title={chapter.title}
                  onClick={() => {
                    console.log(`Seek to ${chapter.time}`);
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Block 3 - FAQ */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">
          Frequently Asked Questions
        </h2>
        <div>
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
