import { AdminLayout } from "@/components/AdminLayout";
import { PageHeader, SectionCard } from "@/components/shared";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Store,
  MapPin,
  Settings2,
  Link as LinkIcon,
  Phone,
  CreditCard,
  ImagePlus,
  Save,
  Copy,
  ExternalLink,
  UtensilsCrossed,
  Info,
  Camera,
  Pencil,
  Check,
  X,
  MessageCircle,
  Trash2,
  MessageSquare,
  Clock,
  Gift,
  Printer,
  Plus,
  Wifi,
  WifiOff,
  Star,
  TestTube,
  Bell,
  BellRing,
  Smartphone,
  Download,
  Loader2,
  CheckCircle,
  XCircle,
  Bike,
  Package,
  ShoppingBag,
  ChevronDown,
  FileText,
  Globe,
  Eye,
  MapPinned,
  StickyNote,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ImageCropModal } from "@/components/ImageCropModal";
import { AddressMapPicker } from "@/components/AddressMapPicker";

import { WhatsAppTab } from "@/components/WhatsAppTab";
import { PrintTestTab } from "@/components/PrintTestTab";
import { IntegrationsTab } from "@/components/IntegrationsTab";
import { SettingsSidebar, SettingsSection } from "@/components/SettingsSidebar";
import { SchedulingSettings } from "@/components/SchedulingSettings";
import { AccountSecuritySection } from "@/components/AccountSecuritySection";
import { OnlinePaymentTab } from "@/components/OnlinePaymentTab";
import { SUPPORTED_TIMEZONES } from "../../../shared/const";

export default function Configuracoes() {
  const utils = trpc.useUtils();
  const { data: establishment, refetch } = trpc.establishment.get.useQuery();
  const { data: businessHoursData, refetch: refetchBusinessHours } = trpc.establishment.getBusinessHours.useQuery(
    { establishmentId: establishment?.id || 0 },
    { enabled: !!establishment?.id }
  );
  const { data: neighborhoodFeesData, refetch: refetchNeighborhoodFees } = trpc.neighborhoodFees.list.useQuery(
    { establishmentId: establishment?.id || 0 },
    { enabled: !!establishment?.id }
  );
  
  // Printer queries
  const { data: printers, refetch: refetchPrinters } = trpc.printer.list.useQuery(
    { establishmentId: establishment?.id || 0 },
    { enabled: !!establishment?.id }
  );
  const { data: printerSettings, refetch: refetchPrinterSettings } = trpc.printer.getSettings.useQuery(
    { establishmentId: establishment?.id || 0 },
    { enabled: !!establishment?.id }
  );
  
  const [activeSection, setActiveSection] = useState<SettingsSection>(() => {
    // Suporte a deep linking via query param ?section=whatsapp
    const params = new URLSearchParams(window.location.search);
    const section = params.get('section');
    const validSections: SettingsSection[] = ['estabelecimento', 'atendimento', 'agendamento', 'whatsapp', 'whatsapp-notificacoes', 'whatsapp-templates', 'impressora', 'pagamento-online', 'integracoes', 'conta-seguranca'];
    if (section && validSections.includes(section as SettingsSection)) {
      // Redirecionar 'whatsapp' para 'whatsapp-notificacoes' (submenu padrão)
      if (section === 'whatsapp') return 'whatsapp-notificacoes';
      return section as SettingsSection;
    }
    return 'estabelecimento';
  });

  // Ouvir evento de abrir seção WhatsApp (vindo do banner de desconectado)
  useEffect(() => {
    const handleOpenWhatsApp = () => {
      setActiveSection('whatsapp-notificacoes');
    };
    window.addEventListener('open-whatsapp-settings', handleOpenWhatsApp);
    return () => window.removeEventListener('open-whatsapp-settings', handleOpenWhatsApp);
  }, []);

  // Reagir a mudanças na URL (deep linking dinâmico)
  const [currentLocation] = useLocation();
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const section = params.get('section');
    if (section === 'whatsapp') {
      setActiveSection('whatsapp-notificacoes');
    } else if (section) {
      const validSections: SettingsSection[] = ['estabelecimento', 'atendimento', 'agendamento', 'whatsapp-notificacoes', 'whatsapp-templates', 'impressora', 'pagamento-online', 'integracoes', 'conta-seguranca'];
      if (validSections.includes(section as SettingsSection)) {
        setActiveSection(section as SettingsSection);
      }
    }
  }, [currentLocation]);

  // Scroll automático para o card de horários quando vem do onboarding
  useEffect(() => {
    if (activeSection === 'atendimento') {
      const params = new URLSearchParams(window.location.search);
      const scrollTo = params.get('scrollTo');
      
      if (scrollTo === 'formas-pagamento' && paymentMethodsCardRef.current) {
        // Scroll para o card de formas de pagamento
        const timer = setTimeout(() => {
          paymentMethodsCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Highlight visual temporário
          paymentMethodsCardRef.current?.classList.add('ring-2', 'ring-primary/50', 'ring-offset-2');
          setTimeout(() => {
            paymentMethodsCardRef.current?.classList.remove('ring-2', 'ring-primary/50', 'ring-offset-2');
          }, 3000);
        }, 400);
        return () => clearTimeout(timer);
      } else if (params.get('section') === 'atendimento' && businessHoursCardRef.current) {
        // Scroll para o card de horários
        const timer = setTimeout(() => {
          businessHoursCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300);
        return () => clearTimeout(timer);
      }
    }
  }, [activeSection]);

  // Establishment form state
  const [name, setName] = useState("");
  const [logo, setLogo] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [complement, setComplement] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [latitude, setLatitude] = useState<string | null>(null);
  const [longitude, setLongitude] = useState<string | null>(null);
  const [showMapPicker, setShowMapPicker] = useState(false);

  // Service settings form state
  const [menuSlug, setMenuSlug] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [instagram, setInstagram] = useState("");
  const [acceptsCash, setAcceptsCash] = useState(true);
  const [acceptsCard, setAcceptsCard] = useState(true);
  const [acceptsPix, setAcceptsPix] = useState(false);
  const [pixKey, setPixKey] = useState("");
  const [acceptsBoleto, setAcceptsBoleto] = useState(false);
  const [allowsDelivery, setAllowsDelivery] = useState(true);
  const [allowsPickup, setAllowsPickup] = useState(true);
  const [allowsDineIn, setAllowsDineIn] = useState(false);
  
  // Public note state
  const [publicNote, setPublicNote] = useState("");
  const [publicNoteCreatedAt, setPublicNoteCreatedAt] = useState<Date | null>(null);
  const [noteValidityDays, setNoteValidityDays] = useState(7);
  
  // SMS settings state
  const [smsEnabled, setSmsEnabled] = useState(false);
  
  // Auto-accept orders state
  const [autoAcceptOrders, setAutoAcceptOrders] = useState(false);
  
  // Note style state
  const [noteStyle, setNoteStyle] = useState("default");
  const [showPreviewForStyle, setShowPreviewForStyle] = useState<string | null>(null);
  const previewTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // Delivery time state
  const [deliveryTimeEnabled, setDeliveryTimeEnabled] = useState(false);
  const [deliveryTimeMin, setDeliveryTimeMin] = useState(20);
  const [deliveryTimeMax, setDeliveryTimeMax] = useState(60);
  
  // Minimum order state
  const [minimumOrderEnabled, setMinimumOrderEnabled] = useState(false);
  const [minimumOrderValue, setMinimumOrderValue] = useState("0");
  
  // Delivery fee state
  const [deliveryFeeType, setDeliveryFeeType] = useState<"free" | "fixed" | "byNeighborhood">("free");
  const [deliveryFeeFixed, setDeliveryFeeFixed] = useState("0");
  const [neighborhoodFees, setNeighborhoodFees] = useState<{id?: number; neighborhood: string; fee: string}[]>([]);
  
  // Timezone state
  const [timezone, setTimezone] = useState('America/Sao_Paulo');
  
  // Reviews settings state
  const [reviewsEnabled, setReviewsEnabled] = useState(true);
  const [fakeReviewCount, setFakeReviewCount] = useState(250);
  
  // Business hours state
  type BusinessHourDay = {
    dayOfWeek: number;
    isActive: boolean;
    openTime: string;
    closeTime: string;
  };
  const [businessHours, setBusinessHours] = useState<BusinessHourDay[]>([
    { dayOfWeek: 0, isActive: false, openTime: "", closeTime: "" }, // Domingo
    { dayOfWeek: 1, isActive: false, openTime: "", closeTime: "" }, // Segunda
    { dayOfWeek: 2, isActive: false, openTime: "", closeTime: "" }, // Terça
    { dayOfWeek: 3, isActive: false, openTime: "", closeTime: "" }, // Quarta
    { dayOfWeek: 4, isActive: false, openTime: "", closeTime: "" }, // Quinta
    { dayOfWeek: 5, isActive: false, openTime: "", closeTime: "" }, // Sexta
    { dayOfWeek: 6, isActive: false, openTime: "", closeTime: "" }, // Sábado
  ]);
  
  // Printer state
  type PrinterData = {
    id: number;
    name: string;
    ipAddress: string;
    port: number;
    isActive: boolean;
    isDefault: boolean;
  };
  const [isPrinterModalOpen, setIsPrinterModalOpen] = useState(false);
  const [editingPrinter, setEditingPrinter] = useState<PrinterData | null>(null);
  const [printerDeleteConfirmOpen, setPrinterDeleteConfirmOpen] = useState(false);
  const [printerToDelete, setPrinterToDelete] = useState<PrinterData | null>(null);
  const [printerName, setPrinterName] = useState("");
  const [printerIpAddress, setPrinterIpAddress] = useState("");
  const [printerPort, setPrinterPort] = useState(9100);
  const [printerType, setPrinterType] = useState<'all' | 'kitchen' | 'counter' | 'bar'>('all');
  const [printerCategoryIds, setPrinterCategoryIds] = useState<number[]>([]);
  const [printerIsActive, setPrinterIsActive] = useState(true);
  const [printerIsDefault, setPrinterIsDefault] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [testConnectionResult, setTestConnectionResult] = useState<{ success: boolean; message: string } | null>(null);
  
  // Printer settings state
  const [autoPrintEnabled, setAutoPrintEnabled] = useState(false);
  const [printOnNewOrder, setPrintOnNewOrder] = useState(true);
  const [printOnStatusChange, setPrintOnStatusChange] = useState(false);
  const [printCopies, setPrintCopies] = useState(1);
  const [printShowLogo, setPrintShowLogo] = useState(true);
  const [printLogoUrl, setPrintLogoUrl] = useState("");
  const [printShowQrCode, setPrintShowQrCode] = useState(false);
  const [printHeaderMessage, setPrintHeaderMessage] = useState("");
  const [printFooterMessage, setPrintFooterMessage] = useState("");
  const [printPaperWidth, setPrintPaperWidth] = useState<'58mm' | '80mm'>('80mm');
  
  // POSPrinterDriver state
  const [posPrinterEnabled, setPosPrinterEnabled] = useState(false);
  const [posPrinterLinkcode, setPosPrinterLinkcode] = useState("");
  const [posPrinterNumber, setPosPrinterNumber] = useState(1);
  const [isTestingPosPrinter, setIsTestingPosPrinter] = useState(false);
  const [posPrinterTestResult, setPosPrinterTestResult] = useState<{ success: boolean; message: string } | null>(null);
  
  // Impressão Direta via Rede state
  const [directPrintEnabled, setDirectPrintEnabled] = useState(false);
  const [directPrintIp, setDirectPrintIp] = useState("");
  const [directPrintPort, setDirectPrintPort] = useState(9100);
  const [isTestingDirectPrint, setIsTestingDirectPrint] = useState(false);
  const [directPrintTestResult, setDirectPrintTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Image crop modal state
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState("");
  const [cropType, setCropType] = useState<"logo" | "cover">("logo");

  // File input refs
  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Inline editing state
  const [isEditingName, setIsEditingName] = useState(false);
  const [originalName, setOriginalName] = useState("");
  
  // Flags para carregar dados do servidor apenas uma vez (evita sobrescrever edições ao voltar à aba)
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);
  const [initialBusinessHoursLoaded, setInitialBusinessHoursLoaded] = useState(false);
  const [initialNeighborhoodFeesLoaded, setInitialNeighborhoodFeesLoaded] = useState(false);
  const [initialPrinterSettingsLoaded, setInitialPrinterSettingsLoaded] = useState(false);
  
  // Social dropdown state for preview
  const [showSocialDropdown, setShowSocialDropdown] = useState(false);
  const socialDropdownRef = useRef<HTMLDivElement>(null);
  const businessHoursCardRef = useRef<HTMLDivElement>(null);
  const paymentMethodsCardRef = useRef<HTMLDivElement>(null);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (socialDropdownRef.current && !socialDropdownRef.current.contains(event.target as Node)) {
        setShowSocialDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load establishment data (apenas no carregamento inicial)
  useEffect(() => {
    if (establishment && !initialDataLoaded) {
      setName(establishment.name || "");
      setLogo(establishment.logo || "");
      setCoverImage(establishment.coverImage || "");
      setStreet(establishment.street || "");
      setNumber(establishment.number || "");
      setComplement(establishment.complement || "");
      setNeighborhood(establishment.neighborhood || "");
      setCity(establishment.city || "");
      setState(establishment.state || "");
      setZipCode(establishment.zipCode || "");
      setLatitude(establishment.latitude || null);
      setLongitude(establishment.longitude || null);
      setMenuSlug(establishment.menuSlug || "");
      setWhatsapp(establishment.whatsapp || "");
      setInstagram(establishment.instagram || "");
      setAcceptsCash(establishment.acceptsCash);
      setAcceptsCard(establishment.acceptsCard);
      setAcceptsPix(establishment.acceptsPix);
      setPixKey(establishment.pixKey || "");
      setAcceptsBoleto(establishment.acceptsBoleto);
      setAllowsDelivery(establishment.allowsDelivery);
      setAllowsPickup(establishment.allowsPickup);
      setAllowsDineIn(establishment.allowsDineIn);
      setPublicNote(establishment.publicNote || "");
      setPublicNoteCreatedAt(establishment.publicNoteCreatedAt ? new Date(establishment.publicNoteCreatedAt) : null);
      // Calcular dias de validade baseado na data de expiração
      if (establishment.noteExpiresAt && establishment.publicNoteCreatedAt) {
        const createdAt = new Date(establishment.publicNoteCreatedAt);
        const expiresAt = new Date(establishment.noteExpiresAt);
        const diffDays = Math.round((expiresAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
        setNoteValidityDays(Math.min(7, Math.max(1, diffDays)));
      }
      setSmsEnabled(establishment.smsEnabled || false);
      setNoteStyle(establishment.noteStyle || "default");
      // Delivery time settings
      setDeliveryTimeEnabled(establishment.deliveryTimeEnabled || false);
      setDeliveryTimeMin(establishment.deliveryTimeMin || 20);
      setDeliveryTimeMax(establishment.deliveryTimeMax || 60);
      // Minimum order settings
      setMinimumOrderEnabled(establishment.minimumOrderEnabled || false);
      setMinimumOrderValue(establishment.minimumOrderValue || "0");
      // Delivery fee settings
      setDeliveryFeeType(establishment.deliveryFeeType || "free");
      setDeliveryFeeFixed(establishment.deliveryFeeFixed || "0");
      setTimezone(establishment.timezone || 'America/Sao_Paulo');
      setAutoAcceptOrders(establishment.autoAcceptOrders || false);
      setReviewsEnabled(establishment.reviewsEnabled ?? true);
      setFakeReviewCount(Math.min(establishment.fakeReviewCount ?? 250, 250));
      setInitialDataLoaded(true);
    }
  }, [establishment, initialDataLoaded]);
  
  // Load business hours when data is available
  useEffect(() => {
    if (businessHoursData && businessHoursData.length > 0 && !initialBusinessHoursLoaded) {
      const hoursMap = new Map(businessHoursData.map(h => [h.dayOfWeek, h]));
      setBusinessHours(prev => prev.map(day => {
        const savedHour = hoursMap.get(day.dayOfWeek);
        if (savedHour) {
          return {
            dayOfWeek: day.dayOfWeek,
            isActive: savedHour.isActive,
            openTime: savedHour.openTime || "",
            closeTime: savedHour.closeTime || "",
          };
        }
        return day;
      }));
      setInitialBusinessHoursLoaded(true);
    }
  }, [businessHoursData, initialBusinessHoursLoaded]);
  
  // Load neighborhood fees when data is available
  useEffect(() => {
    if (neighborhoodFeesData && !initialNeighborhoodFeesLoaded) {
      setNeighborhoodFees(neighborhoodFeesData.map(fee => ({
        id: fee.id,
        neighborhood: fee.neighborhood,
        fee: fee.fee,
      })));
      setInitialNeighborhoodFeesLoaded(true);
    }
  }, [neighborhoodFeesData, initialNeighborhoodFeesLoaded]);
  
  // Load printer settings when data is available
  useEffect(() => {
    if (printerSettings && !initialPrinterSettingsLoaded) {
      setAutoPrintEnabled(printerSettings.autoPrintEnabled);
      setPrintOnNewOrder(printerSettings.printOnNewOrder);
      setPrintOnStatusChange(printerSettings.printOnStatusChange);
      setPrintCopies(printerSettings.copies);
      setPrintShowLogo(printerSettings.showLogo);
      setPrintLogoUrl((printerSettings as any).logoUrl || "");
      setPrintShowQrCode(printerSettings.showQrCode);
      setPrintHeaderMessage((printerSettings as any).headerMessage || "");
      setPrintFooterMessage(printerSettings.footerMessage || "");
      setPrintPaperWidth((printerSettings as any).paperWidth || '80mm');
      // POSPrinterDriver
      setPosPrinterEnabled((printerSettings as any).posPrinterEnabled || false);
      setPosPrinterLinkcode((printerSettings as any).posPrinterLinkcode || "");
      setPosPrinterNumber((printerSettings as any).posPrinterNumber || 1);
      // Impressão Direta via Rede
      setDirectPrintEnabled((printerSettings as any).directPrintEnabled || false);
      setDirectPrintIp((printerSettings as any).directPrintIp || "");
      setDirectPrintPort((printerSettings as any).directPrintPort || 9100);
      setInitialPrinterSettingsLoaded(true);
    }
  }, [printerSettings, initialPrinterSettingsLoaded]);

  // Upload mutation
  const uploadMutation = trpc.upload.image.useMutation();

  // Mutations
  const createMutation = trpc.establishment.create.useMutation({
    onSuccess: () => {
      setInitialDataLoaded(false);
      utils.establishment.get.invalidate();
      toast.success("Estabelecimento criado com sucesso");
    },
    onError: () => toast.error("Erro ao criar estabelecimento"),
  });

  const updateMutation = trpc.establishment.update.useMutation({
    onSuccess: (_data, variables) => {
      // Invalidar checklist do onboarding (para passos como foto/capa)
      utils.dashboard.onboardingChecklist.invalidate();
      // Optimistic cache update: merge the sent variables into the cached establishment data
      // This avoids the race condition of setInitialDataLoaded(false) + refetch() where
      // the useEffect would run with stale data before refetch completes
      utils.establishment.get.setData(undefined, (old) => {
        if (!old) return old;
        return { ...old, ...variables };
      });
      // Also refetch in background to ensure full server sync
      refetch();
      toast.success("Configurações salvas com sucesso");
    },
    onError: (error) => {
      if (error.message.includes("link já está em uso")) {
        toast.error("Este link já está em uso por outro restaurante. Escolha outro.");
      } else {
        toast.error("Erro ao salvar configurações");
      }
    },
  });
  
  const saveNoteMutation = trpc.establishment.savePublicNote.useMutation({
    onSuccess: () => {
      setInitialDataLoaded(false);
      utils.establishment.get.invalidate();
      toast.success("Nota salva com sucesso! Ela ficará visível por 24 horas.");
    },
    onError: () => toast.error("Erro ao salvar nota"),
  });
  
  const removeNoteMutation = trpc.establishment.removePublicNote.useMutation({
    onSuccess: () => {
      setInitialDataLoaded(false);
      utils.establishment.get.invalidate();
      setPublicNote("");
      setPublicNoteCreatedAt(null);
      toast.success("Nota removida com sucesso");
    },
    onError: () => toast.error("Erro ao remover nota"),
  });
  
  const saveBusinessHoursMutation = trpc.establishment.saveBusinessHours.useMutation({
    onSuccess: () => {
      setInitialBusinessHoursLoaded(false);
      refetchBusinessHours();
      utils.dashboard.onboardingChecklist.invalidate();
      toast.success("Horários de funcionamento salvos com sucesso");
    },
    onError: () => toast.error("Erro ao salvar horários de funcionamento"),
  });
  
  // Neighborhood fees mutations (individual - kept for backwards compatibility)
  const createNeighborhoodFeeMutation = trpc.neighborhoodFees.create.useMutation({
    onSuccess: () => {
      setInitialNeighborhoodFeesLoaded(false);
      refetchNeighborhoodFees();
    },
    onError: () => toast.error("Erro ao salvar taxa por bairro"),
  });
  
  const updateNeighborhoodFeeMutation = trpc.neighborhoodFees.update.useMutation({
    onSuccess: () => {
      setInitialNeighborhoodFeesLoaded(false);
      refetchNeighborhoodFees();
    },
    onError: () => toast.error("Erro ao atualizar taxa por bairro"),
  });
  
  const deleteNeighborhoodFeeMutation = trpc.neighborhoodFees.delete.useMutation({
    onSuccess: () => {
      setInitialNeighborhoodFeesLoaded(false);
      refetchNeighborhoodFees();
    },
    onError: () => toast.error("Erro ao remover taxa por bairro"),
  });

  // Batch sync mutation - saves all neighborhood fees in a single request
  const syncNeighborhoodFeesMutation = trpc.neighborhoodFees.sync.useMutation({
    onSuccess: (updatedFees) => {
      // Update local state with the server response directly
      setNeighborhoodFees(updatedFees.map(f => ({
        id: f.id,
        neighborhood: f.neighborhood,
        fee: f.fee,
      })));
      setInitialNeighborhoodFeesLoaded(true);
    },
    onError: () => toast.error("Erro ao salvar taxas por bairro"),
  });
  
  // Printer mutations
  const createPrinterMutation = trpc.printer.create.useMutation({
    onSuccess: () => {
      refetchPrinters();
      setIsPrinterModalOpen(false);
      resetPrinterForm();
      toast.success("Impressora adicionada com sucesso");
    },
    onError: () => toast.error("Erro ao adicionar impressora"),
  });

  const updatePrinterMutation = trpc.printer.update.useMutation({
    onSuccess: () => {
      refetchPrinters();
      setIsPrinterModalOpen(false);
      resetPrinterForm();
      toast.success("Impressora atualizada com sucesso");
    },
    onError: () => toast.error("Erro ao atualizar impressora"),
  });

  const deletePrinterMutation = trpc.printer.delete.useMutation({
    onSuccess: () => {
      refetchPrinters();
      setPrinterDeleteConfirmOpen(false);
      setPrinterToDelete(null);
      toast.success("Impressora removida com sucesso");
    },
    onError: () => toast.error("Erro ao remover impressora"),
  });

  const savePrinterSettingsMutation = trpc.printer.saveSettings.useMutation({
    onSuccess: () => {
      setInitialPrinterSettingsLoaded(false);
      refetchPrinterSettings();
      toast.success("Configurações de impressão salvas com sucesso");
    },
    onError: () => toast.error("Erro ao salvar configurações de impressão"),
  });

  const testConnectionMutation = trpc.printer.testConnection.useMutation({
    onSuccess: (result) => {
      setTestConnectionResult(result);
      setIsTestingConnection(false);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    },
    onError: () => {
      setIsTestingConnection(false);
      setTestConnectionResult({ success: false, message: "Erro ao testar conexão" });
      toast.error("Erro ao testar conexão");
    },
  });
  
  const testPosPrinterMutation = trpc.printer.testPOSPrinter.useMutation({
    onSuccess: (result) => {
      setPosPrinterTestResult(result);
      setIsTestingPosPrinter(false);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    },
    onError: () => {
      setIsTestingPosPrinter(false);
      setPosPrinterTestResult({ success: false, message: "Erro ao testar conexão" });
      toast.error("Erro ao testar conexão com POSPrinterDriver");
    },
  });
  
  const testDirectPrintMutation = trpc.printer.testDirectPrint.useMutation({
    onSuccess: (result) => {
      setDirectPrintTestResult(result);
      setIsTestingDirectPrint(false);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    },
    onError: () => {
      setIsTestingDirectPrint(false);
      setDirectPrintTestResult({ success: false, message: "Erro ao testar conexão" });
      toast.error("Erro ao testar conexão com a impressora");
    },
  });

  // Printer helper functions
  const resetPrinterForm = () => {
    setPrinterName("");
    setPrinterIpAddress("");
    setPrinterPort(9100);
    setPrinterType('all');
    setPrinterCategoryIds([]);
    setPrinterIsActive(true);
    setPrinterIsDefault(false);
    setEditingPrinter(null);
    setTestConnectionResult(null);
  };

  const handleTestConnection = () => {
    if (!printerIpAddress.trim()) {
      toast.error("Informe o endereço IP para testar a conexão");
      return;
    }
    setIsTestingConnection(true);
    setTestConnectionResult(null);
    testConnectionMutation.mutate({ ipAddress: printerIpAddress, port: printerPort });
  };

  const openAddPrinterModal = () => {
    resetPrinterForm();
    setIsPrinterModalOpen(true);
  };

  const openEditPrinterModal = (printer: PrinterData) => {
    setEditingPrinter(printer);
    setPrinterName(printer.name);
    setPrinterIpAddress(printer.ipAddress);
    setPrinterPort(printer.port);
    setPrinterType((printer as any).printerType || 'all');
    setPrinterCategoryIds((printer as any).categoryIds ? JSON.parse((printer as any).categoryIds) : []);
    setPrinterIsActive(printer.isActive);
    setPrinterIsDefault(printer.isDefault);
    setIsPrinterModalOpen(true);
  };

  const handleSavePrinter = () => {
    if (!printerName.trim()) {
      toast.error("Nome da impressora é obrigatório");
      return;
    }
    if (!printerIpAddress.trim()) {
      toast.error("Endereço IP é obrigatório");
      return;
    }

    if (editingPrinter) {
      updatePrinterMutation.mutate({
        id: editingPrinter.id,
        name: printerName,
        ipAddress: printerIpAddress,
        port: printerPort,
        printerType,
        categoryIds: printerCategoryIds.length > 0 ? JSON.stringify(printerCategoryIds) : undefined,
        isActive: printerIsActive,
        isDefault: printerIsDefault,
      });
    } else {
      createPrinterMutation.mutate({
        establishmentId: establishment?.id || 0,
        name: printerName,
        ipAddress: printerIpAddress,
        port: printerPort,
        printerType,
        categoryIds: printerCategoryIds.length > 0 ? JSON.stringify(printerCategoryIds) : undefined,
        isActive: printerIsActive,
        isDefault: printerIsDefault,
      });
    }
  };

  const handleDeletePrinter = (printer: PrinterData) => {
    setPrinterToDelete(printer);
    setPrinterDeleteConfirmOpen(true);
  };

  const confirmDeletePrinter = () => {
    if (printerToDelete) {
      deletePrinterMutation.mutate({ id: printerToDelete.id });
    }
  };

  const handleSavePrinterSettings = () => {
    savePrinterSettingsMutation.mutate({
      establishmentId: establishment?.id || 0,
      autoPrintEnabled,
      printOnNewOrder,
      printOnStatusChange,
      copies: printCopies,
      showLogo: printShowLogo,
      logoUrl: printLogoUrl || null,
      showQrCode: printShowQrCode,
      headerMessage: printHeaderMessage || null,
      footerMessage: printFooterMessage || null,
      paperWidth: printPaperWidth,
      posPrinterEnabled,
      posPrinterLinkcode: posPrinterLinkcode || null,
      posPrinterNumber,
      directPrintEnabled,
      directPrintIp: directPrintIp || null,
      directPrintPort,
    });
  };
  
  const handleTestPosPrinter = () => {
    if (!posPrinterLinkcode.trim()) {
      toast.error("Informe o Linkcode do POSPrinterDriver");
      return;
    }
    setIsTestingPosPrinter(true);
    setPosPrinterTestResult(null);
    testPosPrinterMutation.mutate({ linkcode: posPrinterLinkcode, printerNumber: posPrinterNumber });
  };
  
  const handleTestDirectPrint = () => {
    if (!directPrintIp.trim()) {
      toast.error("Informe o IP da impressora");
      return;
    }
    setIsTestingDirectPrint(true);
    setDirectPrintTestResult(null);
    testDirectPrintMutation.mutate({ ip: directPrintIp, port: directPrintPort });
  };

  const handleSaveEstablishment = () => {
    if (!name.trim()) {
      toast.error("Nome do estabelecimento é obrigatório");
      return;
    }

    // Validar campos obrigatórios de endereço (apenas Rua é obrigatório)
    if (!street.trim()) {
      toast.error("Preencha o campo obrigatório: Rua");
      return;
    }

    if (establishment) {
      // Para update, enviar null explicitamente para limpar campos vazios no banco
      updateMutation.mutate({
        id: establishment.id,
        name: name.trim(),
        logo: logo || null,
        coverImage: coverImage || null,
        street: street.trim() || null,
        number: number.trim() || null,
        complement: complement.trim() || null,
        neighborhood: neighborhood.trim() || null,
        city: city.trim() || null,
        state: state.trim() || null,
        zipCode: zipCode.trim() || null,
        latitude: latitude || null,
        longitude: longitude || null,
      });
    } else {
      // Para create, enviar undefined para campos vazios (serão ignorados)
      createMutation.mutate({
        name: name.trim(),
        logo: logo || undefined,
        coverImage: coverImage || undefined,
        street: street.trim() || undefined,
        number: number.trim() || undefined,
        complement: complement.trim() || undefined,
        neighborhood: neighborhood.trim() || undefined,
        city: city.trim() || undefined,
        state: state.trim() || undefined,
        zipCode: zipCode.trim() || undefined,
        latitude: latitude || undefined,
        longitude: longitude || undefined,
      });
    }
  };

  const handleSaveServiceSettings = async () => {
    if (!establishment) {
      toast.error("Crie o estabelecimento primeiro");
      return;
    }

    // Salvar configurações do estabelecimento
    updateMutation.mutate({
      id: establishment.id,
      menuSlug: menuSlug || null,
      whatsapp: whatsapp || null,
      instagram: instagram || null,
      acceptsCash,
      acceptsCard,
      acceptsPix,
      pixKey: pixKey || null,
      acceptsBoleto,
      allowsDelivery,
      allowsPickup,
      allowsDineIn,
      smsEnabled,
      deliveryTimeEnabled,
      deliveryTimeMin,
      deliveryTimeMax,
      minimumOrderEnabled,
      minimumOrderValue,
      deliveryFeeType,
      deliveryFeeFixed,
      autoAcceptOrders,
    });
    
    // Salvar taxas por bairro se o tipo for byNeighborhood (batch sync)
    if (deliveryFeeType === "byNeighborhood") {
      syncNeighborhoodFeesMutation.mutate({
        establishmentId: establishment.id,
        fees: neighborhoodFees
          .filter(f => f.neighborhood.trim()) // Ignorar bairros sem nome
          .map(f => ({
            id: f.id,
            neighborhood: f.neighborhood,
            fee: f.fee,
          })),
      });
    }
  };

  // Abrir modal de crop ao selecionar arquivo
  const handleFileSelect = (file: File, type: "logo" | "cover") => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, selecione uma imagem válida");
      return;
    }

    // Validate file size (max 8MB)
    if (file.size > 8 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 8MB");
      return;
    }

    // Abrir modal de crop para qualquer imagem
    const reader = new FileReader();
    reader.onload = () => {
      setCropImageSrc(reader.result as string);
      setCropType(type);
      setCropModalOpen(true);
    };
    reader.readAsDataURL(file);
  };

  // Processar imagem recortada e enviar para o servidor
  const handleCroppedImage = async (croppedBlob: Blob) => {
    try {
      toast.loading("Enviando imagem...", { id: "upload" });

      // Converter blob para base64
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(",")[1];
        
        const result = await uploadMutation.mutateAsync({
          base64,
          mimeType: "image/webp",
          folder: "establishments",
          singleVersion: true,
        });

        toast.dismiss("upload");
        toast.success("Imagem enviada com sucesso!");

        if (cropType === "logo") {
          setLogo(result.url);
          // Auto-save after logo upload with blur placeholder
          if (establishment) {
            updateMutation.mutate({ id: establishment.id, logo: result.url, logoBlur: result.blurDataUrl || null });
          }
        } else {
          setCoverImage(result.url);
          // Auto-save after cover upload with blur placeholder
          if (establishment) {
            updateMutation.mutate({ id: establishment.id, coverImage: result.url, coverBlur: result.blurDataUrl || null });
          }
        }
      };
      reader.readAsDataURL(croppedBlob);
    } catch (error) {
      toast.dismiss("upload");
      toast.error("Erro ao enviar imagem");
    }
  };

  const copyMenuLink = () => {
    const link = `https://mindi.manus.space/menu/${menuSlug}`;
    navigator.clipboard.writeText(link);
    toast.success("Link copiado!");
  };

  const openMenuPreview = () => {
    if (menuSlug) {
      window.open(`/menu/${menuSlug}`, "_blank");
    } else {
      toast.error("Configure o link do cardápio primeiro");
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  // Get full address
  const fullAddress = [street, number].filter(Boolean).join(", ");

  // Get delivery types
  const deliveryTypes = [];
  if (allowsDelivery) deliveryTypes.push("Entrega");
  if (allowsPickup) deliveryTypes.push("Retirada");

  return (
    <AdminLayout>
      {/* Layout com Barra Lateral Secundária */}
      <div data-settings-page className="flex flex-col md:flex-row h-[calc(100vh-58px)] overflow-hidden">
        {/* Barra Lateral Secundária - Desktop: Fixa / Mobile: Accordion no topo */}
        <div className="md:w-64 shrink-0 bg-card md:border-r border-border/50 pt-3 pb-4 px-3 md:h-full md:overflow-y-auto animate-slide-in-from-left">
          <SettingsSidebar 
            activeSection={activeSection} 
            onSectionChange={setActiveSection} 
          />
        </div>
        
        {/* Conteúdo Principal - Com Scroll */}
        <div className="flex-1 p-4 md:p-6 bg-muted/30 h-full overflow-y-auto">
          {/* Cabeçalho */}
          <div className="mb-4 md:mb-6">
            <PageHeader
              title="Configurações"
              description="Gerencie as configurações do seu estabelecimento"
              icon={<Settings2 className="h-6 w-6 text-blue-600" />}
            />
          </div>
          
          {/* Estabelecimento Section */}
          {activeSection === "estabelecimento" && (
          <div className="flex flex-col lg:flex-row gap-5 items-start">
            {/* Preview do Perfil Público + Configurações básicas - 40% */}
            <div className="w-full lg:w-[40%] lg:sticky lg:top-4 shrink-0 space-y-5">
              <SectionCard title="Preview do Perfil Público" description="Visualize como seu perfil aparece para os clientes" icon={<Eye className="h-5 w-5 text-blue-600 dark:text-blue-400" />} iconBg="bg-blue-100 dark:bg-blue-500/15" className="h-full">
              {/* Cover Image */}
              <div className="relative h-48 bg-gradient-to-br from-red-100 to-red-50 group/cover">
                {coverImage ? (
                  <img 
                    src={coverImage} 
                    alt="Capa" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <UtensilsCrossed className="h-16 w-16 text-red-200" />
                  </div>
                )}
                
                {/* Hover overlay para remover capa */}
                {coverImage && (
                  <button
                    onClick={() => {
                      setCoverImage("");
                      if (establishment) {
                        updateMutation.mutate({ id: establishment.id, coverImage: null, coverBlur: null });
                      }
                    }}
                    className="absolute inset-0 bg-black/0 group-hover/cover:bg-black/50 flex items-center justify-center opacity-0 group-hover/cover:opacity-100 transition-all duration-300 cursor-pointer"
                  >
                    <span className="text-white font-medium text-sm bg-red-500/90 px-4 py-2 rounded-full shadow-lg">Remover capa</span>
                  </button>
                )}

                {/* Edit Cover Button */}
                <button
                  onClick={(e) => { e.stopPropagation(); coverInputRef.current?.click(); }}
                  className="absolute top-3 right-3 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors z-10"
                  title="Alterar capa"
                >
                  <Camera className="h-4 w-4" />
                </button>
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelect(file, "cover");
                  }}
                />
              </div>

              {/* Profile Info Section - PIXEL PERFECT igual ao menu público */}
              <div className="relative px-6" style={{paddingBottom: '4px'}}>
                {/* Logo - positioned to overlap cover */}
                <div className="absolute -top-16 left-6">
                  <div className="relative">
                    {/* Balão de Nota - exibe sempre que existir nota ativa */}
                    {publicNote && publicNoteCreatedAt && (() => {
                      // Obter estilos do balão baseado no noteStyle selecionado
                      const balloonStyles: Record<string, { bg: string; text: string; border: string; arrowBg: string }> = {
                        default: { bg: "bg-white", text: "text-gray-700", border: "border-gray-200", arrowBg: "bg-white border border-gray-200" },
                        ocean: { bg: "bg-gradient-to-r from-cyan-400 to-blue-500", text: "text-white", border: "border-transparent", arrowBg: "bg-blue-500" },
                        forest: { bg: "bg-gradient-to-r from-green-400 to-emerald-500", text: "text-white", border: "border-transparent", arrowBg: "bg-emerald-500" },
                        fire: { bg: "bg-gradient-to-r from-red-500 to-orange-500", text: "text-white", border: "border-transparent", arrowBg: "bg-orange-500" },
                        gold: { bg: "bg-gradient-to-r from-yellow-400 to-amber-500", text: "text-white", border: "border-transparent", arrowBg: "bg-amber-500" },
                        night: { bg: "bg-gradient-to-r from-gray-700 to-gray-900", text: "text-white", border: "border-transparent", arrowBg: "bg-gray-900" },
                        acai: { bg: "bg-gradient-to-r from-purple-600 to-purple-900", text: "text-white", border: "border-transparent", arrowBg: "bg-purple-900" },
                      };
                      const currentStyle = balloonStyles[noteStyle] || balloonStyles.default;
                      return (
                        <div className="absolute -top-14 left-0 z-20 animate-float-balloon">
                          <div className="relative">
                            {/* Balão estilo bolha */}
                            <div className={cn(
                              "rounded-[20px] px-3 py-1.5 shadow-md max-w-[140px]",
                              currentStyle.bg,
                              currentStyle.border !== "border-transparent" && "border " + currentStyle.border
                            )}>
                              <p className={cn("text-xs text-center leading-tight break-words", currentStyle.text)}>{publicNote}</p>
                            </div>
                            {/* Bico do balão em formato de balão de pensamento - círculo maior à esquerda, menor à direita */}
                            <div className={cn("absolute -bottom-2.5 left-4 w-3.5 h-3.5 rounded-full shadow-sm", currentStyle.arrowBg)}></div>
                            <div className={cn("absolute -bottom-5 left-7 w-2 h-2 rounded-full shadow-sm", currentStyle.arrowBg)}></div>
                          </div>
                        </div>
                      );
                    })()}
                    <div className={cn(
                      "w-32 h-32 rounded-full border-4 border-white shadow-lg overflow-hidden",
                      "bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center"
                    )}>
                      {logo ? (
                        <img src={logo} alt="Logo" className="w-full h-full object-cover" />
                      ) : (
                        <UtensilsCrossed className="h-12 w-12 text-white" />
                      )}
                    </div>
                    
                    {/* Hover overlay para remover logo */}
                    {logo && (
                      <button
                        onClick={() => {
                          setLogo("");
                          if (establishment) {
                            updateMutation.mutate({ id: establishment.id, logo: null, logoBlur: null });
                          }
                        }}
                        className="absolute inset-0 rounded-full bg-black/0 hover:bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-all duration-300 cursor-pointer z-10"
                      >
                        <span className="text-white font-medium text-[10px] leading-tight text-center">Remover<br/>foto</span>
                      </button>
                    )}
                    
                    {/* Edit Logo Button */}
                    <button
                      onClick={() => logoInputRef.current?.click()}
                      className="absolute bottom-1 right-1 p-2 bg-black/50 hover:bg-black/70 rounded-full shadow-md transition-colors z-20 text-white"
                      title="Alterar logo"
                    >
                      <Camera className="h-3.5 w-3.5" />
                    </button>
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileSelect(file, "logo");
                      }}
                    />
                  </div>
                </div>

                {/* Restaurant Info - PIXEL PERFECT igual ao menu público */}
                <div className="pt-20 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 overflow-hidden">
                  <div className="flex-1 min-w-0">
                    {/* Restaurant Name and Rating */}
                    <div className="flex items-center gap-1 flex-wrap min-w-0">
                      {isEditingName ? (
                        <div className="flex items-center gap-1.5">
                          <Input
                            ref={nameInputRef}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="h-8 w-56 font-bold text-lg"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && name.trim()) {
                                setIsEditingName(false);
                                // Auto-save name
                                if (establishment && name.trim() !== originalName) {
                                  updateMutation.mutate({ id: establishment.id, name: name.trim() });
                                }
                              } else if (e.key === "Escape") {
                                setName(originalName);
                                setIsEditingName(false);
                              }
                            }}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100"
                            onClick={() => {
                              if (name.trim()) {
                                setIsEditingName(false);
                                // Auto-save name
                                if (establishment && name.trim() !== originalName) {
                                  updateMutation.mutate({ id: establishment.id, name: name.trim() });
                                }
                              }
                            }}
                            disabled={!name.trim()}
                          >
                            <Check className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-red-600 hover:text-red-700 hover:bg-red-100"
                            onClick={() => {
                              setName(originalName);
                              setIsEditingName(false);
                            }}
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ) : (
                        <div
                          className="group flex items-center gap-1.5 px-2 py-1 -mx-2 -my-1 rounded-md cursor-pointer hover:bg-muted/50 transition-all duration-200"
                          onClick={() => {
                            setOriginalName(name);
                            setIsEditingName(true);
                            setTimeout(() => nameInputRef.current?.focus(), 0);
                          }}
                        >
                          <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors truncate">
                            {name || "Nome do Restaurante"}
                          </h3>
                          <Pencil className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors duration-200" />
                        </div>
                      )}
                      {/* Rating */}
                      <div className="flex items-center gap-1">
                        <svg className="h-4 w-4 text-yellow-400 fill-yellow-400" viewBox="0 0 24 24">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                        <span className="text-sm font-semibold text-foreground">
                          {establishment?.rating ? Number(establishment.rating).toFixed(1).replace('.', ',') : '0,0'}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          ({establishment?.reviewCount || 0} avaliações)
                        </span>
                      </div>
                    </div>

                    {/* Address and More Info - PIXEL PERFECT igual ao menu público */}
                    <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground min-w-0 flex-wrap">
                      {fullAddress && (
                        <>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="flex items-center gap-1 min-w-0 truncate cursor-default">
                                <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                <span className="truncate">{fullAddress.length > 35 ? fullAddress.slice(0, 35) + '...' : fullAddress}</span>
                              </span>
                            </TooltipTrigger>
                            {fullAddress.length > 35 && (
                              <TooltipContent side="bottom" className="max-w-xs text-xs">
                                {fullAddress}
                              </TooltipContent>
                            )}
                          </Tooltip>
                          <span className="text-muted-foreground shrink-0">•</span>
                        </>
                      )}
                      <button className="flex items-center gap-1 text-muted-foreground hover:text-red-500 font-medium transition-colors">
                        <Info className="h-3.5 w-3.5" />
                        Informações
                      </button>
                    </div>
                    
                    {/* Status and Delivery Types - PIXEL PERFECT igual ao menu público */}
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      {/* Open Status with Pulsing Icon - igual ao menu público */}
                      <span className="flex items-center gap-1.5 text-green-600 font-medium text-sm">
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                        </span>
                        Aberto
                      </span>
                      
                      {/* Tempo de Entrega Badge - CÓPIA FIEL do menu público */}
                      {deliveryTimeEnabled && (
                        <span 
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full border border-blue-200" 
                          style={{paddingRight: '9px', paddingLeft: '8px', paddingTop: '3px', paddingBottom: '3px', height: '21px', borderRadius: '8px'}}
                        >
                          <Clock className="h-3 w-3" />
                          {deliveryTimeMin} - {deliveryTimeMax} min
                        </span>
                      )}
                      
                      {/* Pedido Mínimo Badge - CÓPIA FIEL do menu público */}
                      {minimumOrderEnabled && Number(minimumOrderValue) > 0 && (
                        <span 
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-700 text-xs font-medium rounded-full border border-amber-200" 
                          style={{paddingRight: '9px', paddingLeft: '8px', paddingTop: '3px', paddingBottom: '3px', height: '21px', borderRadius: '8px'}}
                        >
                          <ShoppingBag className="h-3 w-3" />
                          R$ {Number(minimumOrderValue).toFixed(2).replace('.', ',')}
                        </span>
                      )}
                      
                      {/* Tipo de Entrega Badge - CÓPIA FIEL do menu público */}
                      {deliveryTypes.length > 0 && (
                        <span 
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-muted text-foreground text-xs font-medium rounded-full border border-border" 
                          style={{paddingRight: '9px', paddingLeft: '8px', paddingTop: '3px', paddingBottom: '3px', height: '21px', borderRadius: '8px'}}
                        >
                          {deliveryTypes.includes("Entrega") ? (
                            <Bike className="h-3 w-3" />
                          ) : (
                            <Package className="h-3 w-3" />
                          )}
                          {deliveryTypes.includes("Entrega") && deliveryTypes.includes("Retirada") 
                            ? "Delivery e Retirada" 
                            : deliveryTypes.includes("Entrega") 
                              ? "Delivery" 
                              : "Retirada"}
                        </span>
                      )}
                    </div>

                    {/* Dropdown de Redes Sociais - igual ao perfil público */}
                    {(whatsapp || instagram) && (
                    <div className="relative mt-3 pt-3 border-t border-border/50" style={{paddingTop: '0px'}} ref={socialDropdownRef}>
                      <button
                        onClick={() => setShowSocialDropdown(!showSocialDropdown)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                      >
                        <span>Redes Sociais</span>
                        <svg className={`h-4 w-4 transition-transform ${showSocialDropdown ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                      </button>
                      
                      {/* Dropdown Menu - abre para cima */}
                      {showSocialDropdown && (
                        <div className="absolute left-0 bottom-full mb-1 bg-card rounded-lg shadow-lg border border-border py-1 z-50 min-w-[160px]">
                          {whatsapp && (
                            <a 
                              href={`https://wa.me/55${whatsapp.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted transition-colors"
                              onClick={() => setShowSocialDropdown(false)}
                            >
                              <svg className="h-5 w-5 text-green-500" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                              </svg>
                              <span className="text-sm text-foreground">WhatsApp</span>
                            </a>
                          )}
                          {instagram && (
                            <a 
                              href={`https://instagram.com/${instagram.replace('@', '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted transition-colors"
                              onClick={() => setShowSocialDropdown(false)}
                            >
                              <svg className="h-5 w-5 text-pink-500" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                              </svg>
                              <span className="text-sm text-foreground">Instagram</span>
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                    )}
                  </div>

                  {/* Botão Compartilhar - canto superior direito */}
                  <div className="flex items-center gap-1">
                    <button 
                      className="p-2 hover:bg-muted rounded-full transition-colors"
                      title="Compartilhar"
                    >
                      <svg className="h-5 w-5 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="18" cy="5" r="3"/>
                        <circle cx="6" cy="12" r="3"/>
                        <circle cx="18" cy="19" r="3"/>
                        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
              </SectionCard>

              {/* Configurações básicas - Link, WhatsApp, Instagram */}
              <SectionCard title="Configurações básicas" description="Link do cardápio e redes sociais" icon={<Settings2 className="h-5 w-5 text-slate-600 dark:text-slate-400" />} iconBg="bg-slate-100 dark:bg-slate-500/15">
                <div className="space-y-4">
                  {/* Link do cardápio */}
                  <div>
                    <Label htmlFor="menuSlugEstab" className="text-xs font-semibold">Link do cardápio</Label>
                    <div className="flex items-center gap-2 mt-1.5">
                      <div className="p-2 bg-blue-50 rounded-xl flex-shrink-0">
                        <LinkIcon className="h-3.5 w-3.5 text-blue-600" />
                      </div>
                      <div className="flex items-center px-2 bg-muted/50 rounded-l-xl border border-r-0 border-border/50 text-xs text-muted-foreground font-medium whitespace-nowrap h-9">
                        v2.mindi.com.br/menu/
                      </div>
                      <Input
                        id="menuSlugEstab"
                        value={menuSlug}
                        onChange={(e) => setMenuSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_\.\-]/g, ""))}
                        placeholder="seu_restaurante"
                        className="rounded-l-none flex-1 h-9 rounded-r-xl border-border/50 focus:ring-2 focus:ring-primary/20 min-w-0"
                      />
                      <Button variant="outline" size="icon" onClick={copyMenuLink} title="Copiar link" className="h-9 w-9 rounded-xl border-border/50 hover:bg-accent flex-shrink-0" disabled={!menuSlug}>
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="outline" size="icon" onClick={openMenuPreview} title="Visualizar cardápio" className="h-9 w-9 rounded-xl border-border/50 hover:bg-accent flex-shrink-0" disabled={!menuSlug}>
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* WhatsApp e Instagram na mesma linha */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="whatsappEstab" className="text-xs font-semibold">WhatsApp</Label>
                      <div className="flex items-center gap-2 mt-1.5">
                        <div className="p-2 bg-emerald-50 rounded-xl flex-shrink-0">
                          <Phone className="h-3.5 w-3.5 text-emerald-600" />
                        </div>
                        <Input
                          id="whatsappEstab"
                          value={whatsapp}
                          onChange={(e) => setWhatsapp(e.target.value)}
                          placeholder="+55 00 00000-0000"
                          className="flex-1 h-9 rounded-xl border-border/50 focus:ring-2 focus:ring-primary/20 min-w-0"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="instagramEstab" className="text-xs font-semibold">Instagram</Label>
                      <div className="flex items-center gap-2 mt-1.5">
                        <div className="p-2 bg-pink-50 rounded-xl flex-shrink-0">
                          <svg className="h-3.5 w-3.5 text-pink-600" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                          </svg>
                        </div>
                        <Input
                          id="instagramEstab"
                          value={instagram}
                          onChange={(e) => setInstagram(e.target.value)}
                          placeholder="@seurestaurante"
                          className="flex-1 h-9 rounded-xl border-border/50 focus:ring-2 focus:ring-primary/20 min-w-0"
                        />
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    O link do cardápio será público. Use apenas letras minúsculas, números, hífens, underscores e pontos.
                  </p>

                  <Button onClick={handleSaveServiceSettings} disabled={isPending} className="w-full rounded-xl shadow-sm h-9">
                    <Save className="h-3.5 w-3.5 mr-2" />
                    {isPending ? "Salvando..." : "Salvar"}
                  </Button>
                </div>
              </SectionCard>
            </div>

            {/* Coluna direita - 60% */}
            <div className="w-full lg:flex-1 space-y-5">
            <div>
              <SectionCard title="Endereço do Estabelecimento" description="Localização exibida no cardápio público" icon={<MapPinned className="h-5 w-5 text-red-600 dark:text-red-400" />} iconBg="bg-red-100 dark:bg-red-500/15" className="h-full">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">Campos com <span className="text-red-500">*</span> são obrigatórios</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowMapPicker(true)}
                      className="rounded-xl gap-2"
                    >
                      <MapPin className="h-4 w-4" />
                      {latitude && longitude ? "Mapa" : "Mapa"}
                    </Button>
                  </div>

                  {latitude && longitude && (
                    <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-xl">
                      <Check className="h-3 w-3 text-green-600" />
                      <span className="text-xs text-green-700">Localização definida</span>
                    </div>
                  )}
                  
                  {/* Rua */}
                  <div>
                    <Label htmlFor="street" className="text-sm font-semibold">Rua <span className="text-red-500">*</span></Label>
                    <Input
                      id="street"
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      placeholder="Nome da rua"
                      required
                      className={cn(
                        "mt-2 h-10 rounded-xl border-border/50 focus:ring-2 focus:ring-primary/20",
                        !street.trim() && "border-red-300 focus:border-red-500"
                      )}
                    />
                  </div>

                  {/* Número, Bairro, Cidade e UF */}
                  <div className="grid grid-cols-12 gap-2">
                    <div className="col-span-3">
                      <Label htmlFor="number" className="text-xs font-semibold">Nº <span className="text-muted-foreground text-xs font-normal">(opcional)</span></Label>
                      <Input
                        id="number"
                        value={number}
                        onChange={(e) => setNumber(e.target.value)}
                        placeholder="123"
                        className="mt-1 h-9 rounded-xl border-border/50 focus:ring-2 focus:ring-primary/20 text-sm"
                      />
                    </div>
                    <div className="col-span-3">
                      <Label htmlFor="neighborhood" className="text-xs font-semibold">Bairro <span className="text-muted-foreground text-xs font-normal">(opcional)</span></Label>
                      <Input
                        id="neighborhood"
                        value={neighborhood}
                        onChange={(e) => setNeighborhood(e.target.value)}
                        placeholder="Bairro"
                        className="mt-1 h-9 rounded-xl border-border/50 focus:ring-2 focus:ring-primary/20 text-sm"
                      />
                    </div>
                    <div className="col-span-4">
                      <Label htmlFor="city" className="text-xs font-semibold">Cidade <span className="text-muted-foreground text-xs font-normal">(opcional)</span></Label>
                      <Input
                        id="city"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="Cidade"
                        className="mt-1 h-9 rounded-xl border-border/50 focus:ring-2 focus:ring-primary/20 text-sm"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="state" className="text-xs font-semibold">UF <span className="text-muted-foreground text-xs font-normal">(opcional)</span></Label>
                      <Input
                        id="state"
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        placeholder="UF"
                        className="mt-1 h-9 rounded-xl border-border/50 focus:ring-2 focus:ring-primary/20 text-sm"
                      />
                    </div>
                  </div>

                  {/* Complemento e CEP */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="complement" className="text-xs font-semibold">Complemento <span className="text-muted-foreground text-xs font-normal">(opcional)</span></Label>
                      <Input
                        id="complement"
                        value={complement}
                        onChange={(e) => setComplement(e.target.value)}
                        placeholder="Sala, Bloco, etc."
                        className="mt-1 h-9 rounded-xl border-border/50 focus:ring-2 focus:ring-primary/20 text-sm"
                      />
                    </div>
                    <div>
                      <Label htmlFor="zipCode" className="text-xs font-semibold">CEP <span className="text-muted-foreground text-xs font-normal">(opcional)</span></Label>
                      <Input
                        id="zipCode"
                        value={zipCode}
                        onChange={(e) => setZipCode(e.target.value)}
                        placeholder="00000-000"
                        className="mt-1 h-9 rounded-xl border-border/50 focus:ring-2 focus:ring-primary/20 text-sm"
                      />
                    </div>
                  </div>

                  <Button onClick={handleSaveEstablishment} disabled={isPending} className="w-full rounded-xl shadow-sm">
                    <Save className="h-4 w-4 mr-2" />
                    {isPending ? "Salvando..." : "Salvar Endereço"}
                  </Button>
                </div>
              </SectionCard>
            </div>

          {/* Nota do Restaurante */}
          <div>
          <SectionCard title="Nota do Restaurante" description="Adicione uma nota que aparecerá como um balão acima da foto no seu Menu digital." icon={<StickyNote className="h-5 w-5 text-amber-600 dark:text-amber-400" />} iconBg="bg-amber-100 dark:bg-amber-500/15">
            <div className="space-y-4">

              
              {/* Campo de texto + Botão Sugestões */}
              <div className="space-y-2">
                <Label htmlFor="publicNote" className="text-sm font-semibold flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-primary" />
                  Nota do Restaurante (opcional)
                </Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="publicNote"
                      value={publicNote}
                      onChange={(e) => setPublicNote(e.target.value.slice(0, 80))}
                      placeholder="Deixe uma nota temporária para seus clientes..."
                      maxLength={80}
                      className="h-11 rounded-xl border-border/50 focus:ring-2 focus:ring-primary/20 pr-16"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                      {publicNote.length}/80
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowSuggestions(!showSuggestions)}
                    className="h-11 rounded-xl border-red-500 text-red-500 hover:bg-red-50 hover:text-red-600 hover:border-red-600"
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Ver sugestões de notas
                  </Button>
                </div>
              </div>
              
              {/* Sugestões rápidas - exibidas ao clicar no botão */}
              {showSuggestions && (
                <div className="flex flex-wrap gap-2 p-3 bg-muted/30 rounded-xl border border-border/50 animate-in fade-in slide-in-from-top-2 duration-200">
                  {[
                    "Temos novidades no cardápio 👀",
                    "Hoje o tempo de entrega está reduzido 🚀",
                    "Obrigado por pedir com a gente ❤️",
                    "Estamos com alta demanda, pedimos paciência 🙏",
                  ].map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => {
                        setPublicNote(suggestion);
                        setShowSuggestions(false);
                      }}
                      className="px-3 py-1.5 text-xs bg-card hover:bg-primary/10 hover:text-primary rounded-full transition-colors border border-border hover:border-primary/30 shadow-sm"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
              
              {/* Seleção de Estilo do Balão */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Estilo do Balão</Label>
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                  {[
                    { id: "default", name: "Padrão", bg: "bg-white", text: "text-gray-700", border: "border-gray-200", arrowBg: "bg-white border-r border-b border-gray-200" },
                    { id: "ocean", name: "Oceano", bg: "bg-gradient-to-r from-cyan-400 to-blue-500", text: "text-white", border: "border-transparent", arrowBg: "bg-blue-500" },
                    { id: "forest", name: "Floresta", bg: "bg-gradient-to-r from-green-400 to-emerald-500", text: "text-white", border: "border-transparent", arrowBg: "bg-emerald-500" },
                    { id: "fire", name: "Fogo", bg: "bg-gradient-to-r from-red-500 to-orange-500", text: "text-white", border: "border-transparent", arrowBg: "bg-orange-500" },
                    { id: "gold", name: "Dourado", bg: "bg-gradient-to-r from-yellow-400 to-amber-500", text: "text-white", border: "border-transparent", arrowBg: "bg-amber-500" },
                    { id: "night", name: "Noite", bg: "bg-gradient-to-r from-gray-700 to-gray-900", text: "text-white", border: "border-transparent", arrowBg: "bg-gray-900" },
                    { id: "acai", name: "Açaí", bg: "bg-gradient-to-r from-purple-600 to-purple-900", text: "text-white", border: "border-transparent", arrowBg: "bg-purple-900" },
                  ].map((style) => (
                    <button
                      key={style.id}
                      type="button"
                      onClick={() => {
                        setNoteStyle(style.id);
                        if (publicNote) {
                          // Limpar timeout anterior se existir
                          if (previewTimeoutRef.current) {
                            clearTimeout(previewTimeoutRef.current);
                          }
                          setShowPreviewForStyle(style.id);
                          // Definir novo timeout de 5 segundos
                          previewTimeoutRef.current = setTimeout(() => {
                            setShowPreviewForStyle(null);
                            previewTimeoutRef.current = null;
                          }, 5000);
                        }
                      }}
                      className={cn(
                        "relative p-2 rounded-xl transition-all duration-200 border-2",
                        noteStyle === style.id 
                          ? "border-primary ring-2 ring-primary/20" 
                          : "border-border hover:border-border/80"
                      )}
                    >
                      <div className={cn(
                        "h-8 rounded-lg",
                        style.bg,
                        style.border !== "border-transparent" && "border " + style.border
                      )} />
                      <span className="text-[10px] mt-1 block text-center text-muted-foreground">{style.name}</span>
                      {noteStyle === style.id && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                          <Check className="h-2.5 w-2.5 text-white" />
                        </div>
                      )}
                      {/* Preview temporário do balão */}
                      {showPreviewForStyle === style.id && publicNote && (
                        <div className="absolute -top-24 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-2 duration-300">
                          <div className="relative">
                            <div className={cn(
                              "rounded-[20px] px-3 py-2 shadow-lg w-[160px]",
                              style.bg,
                              style.border !== "border-transparent" && "border " + style.border
                            )}>
                              <p className={cn(
                                "text-xs text-center leading-tight break-words",
                                style.text
                              )}>{publicNote}</p>
                            </div>
                            <div className={cn(
                              "absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 transform rotate-45",
                              style.arrowBg
                            )}></div>
                          </div>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Botões */}
              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    if (!publicNote.trim()) {
                      toast.error("Digite uma nota para salvar");
                      return;
                    }
                    if (!establishment) return;
                    saveNoteMutation.mutate({ id: establishment.id, note: publicNote.trim(), noteStyle, validityDays: noteValidityDays });
                  }}
                  disabled={!publicNote.trim() || saveNoteMutation.isPending}
                  className="flex-1 h-11 rounded-xl bg-primary hover:bg-primary/90"
                >
                  {saveNoteMutation.isPending ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      Salvando...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Save className="h-4 w-4" />
                      Salvar Nota
                    </span>
                  )}
                </Button>
                
                {publicNoteCreatedAt && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (!establishment) return;
                      removeNoteMutation.mutate({ id: establishment.id });
                    }}
                    disabled={removeNoteMutation.isPending}
                    className="h-11 rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                  >
                    {removeNoteMutation.isPending ? (
                      <span className="h-4 w-4 border-2 border-red-300 border-t-red-600 rounded-full animate-spin"></span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Trash2 className="h-4 w-4" />
                        Remover Nota
                      </span>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </SectionCard>
          </div>

            </div>
          </div>
          )}

          {/* Atendimento Section */}
          {activeSection === "atendimento" && (
            <div className="max-w-3xl mx-auto space-y-5">


          {/* Modalidades de atendimento + Tempo + Pedido mínimo */}
          <SectionCard title="Modalidades e entrega" description="Tipos de atendimento e configurações de entrega" icon={<Bike className="h-5 w-5 text-orange-600 dark:text-orange-400" />} iconBg="bg-orange-100 dark:bg-orange-500/15">
            <div className="space-y-5">
              {/* Modalidades */}
              <div>
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Modalidades disponíveis</Label>
                <div className="grid grid-cols-3 gap-3 mt-2">
                  <button
                    type="button"
                    onClick={() => setAllowsDelivery(!allowsDelivery)}
                    className={cn(
                      "flex items-center gap-2 p-3 rounded-xl border-2 transition-all cursor-pointer",
                      allowsDelivery
                        ? "border-orange-500 bg-orange-50 shadow-sm"
                        : "border-border/50 bg-muted/20 hover:bg-muted/40"
                    )}
                  >
                    <div className={cn(
                      "p-2 rounded-lg transition-colors",
                      allowsDelivery ? "bg-orange-100" : "bg-muted/50"
                    )}>
                      <Bike className={cn("h-4 w-4", allowsDelivery ? "text-orange-600" : "text-muted-foreground")} />
                    </div>
                    <span className={cn("font-semibold text-sm", allowsDelivery ? "text-orange-700" : "text-muted-foreground")}>Entrega</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAllowsPickup(!allowsPickup)}
                    className={cn(
                      "flex items-center gap-2 p-3 rounded-xl border-2 transition-all cursor-pointer",
                      allowsPickup
                        ? "border-blue-500 bg-blue-50 shadow-sm"
                        : "border-border/50 bg-muted/20 hover:bg-muted/40"
                    )}
                  >
                    <div className={cn(
                      "p-2 rounded-lg transition-colors",
                      allowsPickup ? "bg-blue-100" : "bg-muted/50"
                    )}>
                      <Store className={cn("h-4 w-4", allowsPickup ? "text-blue-600" : "text-muted-foreground")} />
                    </div>
                    <span className={cn("font-semibold text-sm", allowsPickup ? "text-blue-700" : "text-muted-foreground")}>Retirada</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAllowsDineIn(!allowsDineIn)}
                    className={cn(
                      "flex items-center gap-2 p-3 rounded-xl border-2 transition-all cursor-pointer",
                      allowsDineIn
                        ? "border-violet-500 bg-violet-50 shadow-sm"
                        : "border-border/50 bg-muted/20 hover:bg-muted/40"
                    )}
                  >
                    <div className={cn(
                      "p-2 rounded-lg transition-colors",
                      allowsDineIn ? "bg-violet-100" : "bg-muted/50"
                    )}>
                      <UtensilsCrossed className={cn("h-4 w-4", allowsDineIn ? "text-violet-600" : "text-muted-foreground")} />
                    </div>
                    <span className={cn("font-semibold text-sm", allowsDineIn ? "text-violet-700" : "text-muted-foreground")}>No local</span>
                  </button>
                </div>
              </div>

              {/* Tempo de entrega e Pedido mínimo lado a lado */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Tempo de entrega */}
                <div className="p-4 rounded-xl border border-border/40 bg-muted/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-cyan-50 rounded-lg">
                        <Clock className="h-4 w-4 text-cyan-600" />
                      </div>
                      <Label className="text-sm font-semibold">Tempo de entrega</Label>
                    </div>
                    <Checkbox
                      checked={deliveryTimeEnabled}
                      onCheckedChange={(checked) => setDeliveryTimeEnabled(checked as boolean)}
                      className="h-4 w-4 rounded data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                  </div>
                  {deliveryTimeEnabled && (
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={deliveryTimeMin}
                        onChange={(e) => setDeliveryTimeMin(parseInt(e.target.value) || 0)}
                        className="flex-1 h-9 rounded-xl text-sm text-center"
                        min={0}
                      />
                      <span className="text-sm text-muted-foreground font-medium">a</span>
                      <Input
                        type="number"
                        value={deliveryTimeMax}
                        onChange={(e) => setDeliveryTimeMax(parseInt(e.target.value) || 0)}
                        className="flex-1 h-9 rounded-xl text-sm text-center"
                        min={0}
                      />
                      <span className="text-sm text-muted-foreground font-medium">min</span>
                    </div>
                  )}
                </div>

                {/* Pedido mínimo */}
                <div className="p-4 rounded-xl border border-border/40 bg-muted/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-amber-50 rounded-lg">
                        <CreditCard className="h-4 w-4 text-amber-600" />
                      </div>
                      <Label className="text-sm font-semibold">Pedido mínimo</Label>
                    </div>
                    <Checkbox
                      checked={minimumOrderEnabled}
                      onCheckedChange={(checked) => setMinimumOrderEnabled(checked as boolean)}
                      className="h-4 w-4 rounded data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                  </div>
                  {minimumOrderEnabled && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-muted-foreground">R$</span>
                      <Input
                        type="number"
                        value={minimumOrderValue}
                        onChange={(e) => setMinimumOrderValue(e.target.value)}
                        className="flex-1 h-9 rounded-xl text-sm"
                        min={0}
                        step="0.01"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </SectionCard>

          {/* Formas de pagamento */}
          <div ref={paymentMethodsCardRef} className="transition-all duration-300">
          <SectionCard title="Formas de pagamento" description="Métodos aceitos no estabelecimento" icon={<CreditCard className="h-5 w-5 text-violet-600 dark:text-violet-400" />} iconBg="bg-violet-100 dark:bg-violet-500/15">
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setAcceptsCash(!acceptsCash)}
                  className={cn(
                    "flex items-center gap-2 p-3 rounded-xl border-2 transition-all cursor-pointer",
                    acceptsCash
                      ? "border-emerald-500 bg-emerald-50 shadow-sm"
                      : "border-border/50 bg-muted/20 hover:bg-muted/40"
                  )}
                >
                  <div className={cn(
                    "p-2 rounded-lg transition-colors",
                    acceptsCash ? "bg-emerald-100" : "bg-muted/50"
                  )}>
                    <svg className={cn("h-4 w-4", acceptsCash ? "text-emerald-600" : "text-muted-foreground")} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                  </div>
                  <span className={cn("font-semibold text-sm", acceptsCash ? "text-emerald-700" : "text-muted-foreground")}>Dinheiro</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAcceptsCard(!acceptsCard)}
                  className={cn(
                    "flex items-center gap-2 p-3 rounded-xl border-2 transition-all cursor-pointer",
                    acceptsCard
                      ? "border-blue-500 bg-blue-50 shadow-sm"
                      : "border-border/50 bg-muted/20 hover:bg-muted/40"
                  )}
                >
                  <div className={cn(
                    "p-2 rounded-lg transition-colors",
                    acceptsCard ? "bg-blue-100" : "bg-muted/50"
                  )}>
                    <CreditCard className={cn("h-4 w-4", acceptsCard ? "text-blue-600" : "text-muted-foreground")} />
                  </div>
                  <span className={cn("font-semibold text-sm", acceptsCard ? "text-blue-700" : "text-muted-foreground")}>Cartão</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAcceptsPix(!acceptsPix)}
                  className={cn(
                    "flex items-center gap-2 p-3 rounded-xl border-2 transition-all cursor-pointer",
                    acceptsPix
                      ? "border-violet-500 bg-violet-50 shadow-sm"
                      : "border-border/50 bg-muted/20 hover:bg-muted/40"
                  )}
                >
                  <div className={cn(
                    "p-2 rounded-lg transition-colors",
                    acceptsPix ? "bg-violet-100" : "bg-muted/50"
                  )}>
                    <svg className={cn("h-4 w-4", acceptsPix ? "text-violet-600" : "text-muted-foreground")} viewBox="0 0 24 24" fill="currentColor"><path d="M13.59 4.41l2.83 2.83a2 2 0 0 1 0 2.83l-2.83 2.83a2 2 0 0 1-2.83 0L7.93 10.07a2 2 0 0 1 0-2.83l2.83-2.83a2 2 0 0 1 2.83 0zm-5.66 8.49l2.83 2.83a2 2 0 0 1 0 2.83L7.93 21.39a2 2 0 0 1-2.83 0L2.27 18.56a2 2 0 0 1 0-2.83l2.83-2.83a2 2 0 0 1 2.83 0zm11.31 0l2.83 2.83a2 2 0 0 1 0 2.83l-2.83 2.83a2 2 0 0 1-2.83 0l-2.83-2.83a2 2 0 0 1 0-2.83l2.83-2.83a2 2 0 0 1 2.83 0z"/></svg>
                  </div>
                  <span className={cn("font-semibold text-sm", acceptsPix ? "text-violet-700" : "text-muted-foreground")}>Pix</span>
                </button>
              </div>

              {/* Campo de Chave Pix */}
              {acceptsPix && (
                <div className="p-4 rounded-xl border border-violet-200 bg-violet-50/50 space-y-2">
                  <Label htmlFor="pixKey" className="text-sm font-semibold">Chave Pix</Label>
                  <Input
                    id="pixKey"
                    value={pixKey}
                    onChange={(e) => setPixKey(e.target.value)}
                    placeholder="CPF, CNPJ, email, telefone ou chave aleatória"
                    className="rounded-xl h-9"
                  />
                  <p className="text-xs text-muted-foreground">Esta chave será exibida para o cliente copiar.</p>
                </div>
              )}
            </div>
          </SectionCard>
          </div>

          {/* Taxa de Entrega */}
          <SectionCard title="Taxa de entrega" description="Defina como cobrar a entrega" icon={<MapPin className="h-5 w-5 text-rose-600 dark:text-rose-400" />} iconBg="bg-rose-100 dark:bg-rose-500/15">
            <div className="space-y-4">
              {/* Opções de taxa - cards selecionáveis */}
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setDeliveryFeeType("free")}
                  className={cn(
                    "flex items-center gap-2 p-3 rounded-xl border-2 transition-all cursor-pointer",
                    deliveryFeeType === "free"
                      ? "border-emerald-500 bg-emerald-50 shadow-sm"
                      : "border-border/50 bg-muted/20 hover:bg-muted/40"
                  )}
                >
                  <div className={cn(
                    "p-2 rounded-lg transition-colors",
                    deliveryFeeType === "free" ? "bg-emerald-100" : "bg-muted/50"
                  )}>
                    <Bike className={cn("h-4 w-4", deliveryFeeType === "free" ? "text-emerald-600" : "text-muted-foreground")} />
                  </div>
                  <span className={cn("font-semibold text-sm", deliveryFeeType === "free" ? "text-emerald-700" : "text-muted-foreground")}>Grátis</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDeliveryFeeType("fixed")}
                  className={cn(
                    "flex items-center gap-2 p-3 rounded-xl border-2 transition-all cursor-pointer",
                    deliveryFeeType === "fixed"
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border/50 bg-muted/20 hover:bg-muted/40"
                  )}
                >
                  <div className={cn(
                    "p-2 rounded-lg transition-colors",
                    deliveryFeeType === "fixed" ? "bg-primary/10" : "bg-muted/50"
                  )}>
                    <CreditCard className={cn("h-4 w-4", deliveryFeeType === "fixed" ? "text-primary" : "text-muted-foreground")} />
                  </div>
                  <span className={cn("font-semibold text-sm", deliveryFeeType === "fixed" ? "text-primary" : "text-muted-foreground")}>Fixa</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDeliveryFeeType("byNeighborhood")}
                  className={cn(
                    "flex items-center gap-2 p-3 rounded-xl border-2 transition-all cursor-pointer",
                    deliveryFeeType === "byNeighborhood"
                      ? "border-blue-500 bg-blue-50 shadow-sm"
                      : "border-border/50 bg-muted/20 hover:bg-muted/40"
                  )}
                >
                  <div className={cn(
                    "p-2 rounded-lg transition-colors",
                    deliveryFeeType === "byNeighborhood" ? "bg-blue-100" : "bg-muted/50"
                  )}>
                    <MapPin className={cn("h-4 w-4", deliveryFeeType === "byNeighborhood" ? "text-blue-600" : "text-muted-foreground")} />
                  </div>
                  <span className={cn("font-semibold text-sm", deliveryFeeType === "byNeighborhood" ? "text-blue-700" : "text-muted-foreground")}>Por Bairros</span>
                </button>
              </div>

              {/* Campo de valor fixo */}
              {deliveryFeeType === "fixed" && (
                <div className="p-4 rounded-xl border border-border/40 bg-muted/20">
                  <div className="flex items-center gap-3">
                    <Label className="text-sm font-semibold">Valor da taxa:</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-muted-foreground">R$</span>
                      <Input
                        type="number"
                        value={deliveryFeeFixed}
                        onChange={(e) => setDeliveryFeeFixed(e.target.value)}
                        className="w-24 h-9 rounded-xl text-sm"
                        min={0}
                        step="0.01"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Lista de bairros */}
              {deliveryFeeType === "byNeighborhood" && (
                <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold">Bairros e taxas</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setNeighborhoodFees([...neighborhoodFees, { neighborhood: "", fee: "0" }])}
                      className="rounded-xl h-8 text-xs gap-1"
                    >
                      + Adicionar bairro
                    </Button>
                  </div>
                  
                  {neighborhoodFees.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-3">
                      Nenhum bairro cadastrado. Clique em "+ Adicionar bairro" para começar.
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {neighborhoodFees.map((item, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-white/60 rounded-lg border border-border/30">
                          <Input
                            placeholder="Nome do bairro"
                            value={item.neighborhood}
                            onChange={(e) => {
                              const updated = [...neighborhoodFees];
                              updated[index].neighborhood = e.target.value;
                              setNeighborhoodFees(updated);
                            }}
                            className="flex-1 h-8 rounded-lg text-sm"
                          />
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-muted-foreground font-medium">R$</span>
                            <Input
                              type="number"
                              placeholder="0"
                              value={item.fee}
                              onChange={(e) => {
                                const updated = [...neighborhoodFees];
                                updated[index].fee = e.target.value;
                                setNeighborhoodFees(updated);
                              }}
                              className="w-20 h-8 rounded-lg text-sm"
                              min={0}
                              step="0.01"
                            />
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setNeighborhoodFees(neighborhoodFees.filter((_, i) => i !== index));
                            }}
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-lg"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </SectionCard>

          {/* Horários de Funcionamento */}
          <div ref={businessHoursCardRef}>
          <SectionCard title="Horários de funcionamento" description="Defina quando seu estabelecimento está aberto" icon={<Clock className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />} iconBg="bg-cyan-100 dark:bg-cyan-500/15">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                O menu público exibirá automaticamente se o restaurante está aberto ou fechado.
              </p>
              
              {/* Fuso horário */}
              <div className="flex items-center gap-3 p-4 rounded-xl border border-border/40 bg-muted/20">
                <div className="p-2 bg-cyan-50 rounded-lg">
                  <Globe className="h-4 w-4 text-cyan-600" />
                </div>
                <div className="flex-1">
                  <Label className="text-sm font-semibold">Fuso horário</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">Todos os horários serão baseados neste fuso.</p>
                </div>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="h-9 rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {Object.entries(
                    SUPPORTED_TIMEZONES.reduce((acc, tz) => {
                      if (!acc[tz.group]) acc[tz.group] = [];
                      acc[tz.group].push(tz);
                      return acc;
                    }, {} as Record<string, typeof SUPPORTED_TIMEZONES[number][]>)
                  ).map(([group, tzs]) => (
                    <optgroup key={group} label={group}>
                      {tzs.map(tz => (
                        <option key={tz.value} value={tz.value}>{tz.label}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
              
              <div className="space-y-2">
                {[
                  { day: 0, name: "Domingo" },
                  { day: 1, name: "Segunda-feira" },
                  { day: 2, name: "Terça-feira" },
                  { day: 3, name: "Quarta-feira" },
                  { day: 4, name: "Quinta-feira" },
                  { day: 5, name: "Sexta-feira" },
                  { day: 6, name: "Sábado" },
                ].map(({ day, name }) => {
                  const hourData = businessHours.find(h => h.dayOfWeek === day);
                  return (
                    <div
                      key={day}
                      className={cn(
                        "flex items-center gap-4 p-3.5 rounded-xl border transition-all",
                        hourData?.isActive
                          ? "border-primary/30 bg-primary/5"
                          : "border-border/40 bg-muted/20"
                      )}
                    >
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={hourData?.isActive || false}
                          onChange={(e) => {
                            setBusinessHours(prev => prev.map(h =>
                              h.dayOfWeek === day ? { ...h, isActive: e.target.checked } : h
                            ));
                          }}
                          className="sr-only peer"
                        />
                        <div className="w-10 h-5.5 bg-muted rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                      
                      <span className={cn(
                        "font-medium text-sm min-w-[120px]",
                        hourData?.isActive ? "text-foreground" : "text-muted-foreground"
                      )}>
                        {name}
                      </span>
                      
                      {hourData?.isActive && (
                        <div className="flex items-center gap-2 ml-auto">
                          <Input
                            type="time"
                            value={hourData.openTime}
                            onChange={(e) => {
                              setBusinessHours(prev => prev.map(h =>
                                h.dayOfWeek === day ? { ...h, openTime: e.target.value } : h
                              ));
                            }}
                            className="w-[100px] h-8 rounded-lg text-sm"
                          />
                          <span className="text-xs text-muted-foreground font-medium">até</span>
                          <Input
                            type="time"
                            value={hourData.closeTime}
                            onChange={(e) => {
                              setBusinessHours(prev => prev.map(h =>
                                h.dayOfWeek === day ? { ...h, closeTime: e.target.value } : h
                              ));
                            }}
                            className="w-[100px] h-8 rounded-lg text-sm"
                          />
                        </div>
                      )}
                      
                      {!hourData?.isActive && (
                        <span className="text-xs text-muted-foreground ml-auto">Fechado</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </SectionCard>
          </div>

          {/* Botão único Salvar tudo */}
          <div className="flex gap-3 pt-2">
            <Button
              onClick={() => {
                handleSaveServiceSettings();
                if (establishment?.id) {
                  updateMutation.mutate({
                    id: establishment.id,
                    timezone,
                  });
                }
                saveBusinessHoursMutation.mutate({
                  establishmentId: establishment?.id || 0,
                  hours: businessHours.map(h => ({
                    dayOfWeek: h.dayOfWeek,
                    isActive: h.isActive,
                    openTime: h.openTime,
                    closeTime: h.closeTime,
                  })),
                });
              }}
              disabled={isPending || saveBusinessHoursMutation.isPending}
              className="flex-1 rounded-xl shadow-sm h-11 text-base font-semibold"
            >
              <Save className="h-4 w-4 mr-2" />
              {isPending || saveBusinessHoursMutation.isPending ? "Salvando..." : "Salvar todas as configurações"}
            </Button>
          </div>

            </div>
          )}

          {/* Agendamento */}
          {activeSection === "agendamento" && (
            <SchedulingSettings />
          )}

          {/* WhatsApp - Notificações */}
          {activeSection === "whatsapp-notificacoes" && (
            <div className="space-y-5">
              <WhatsAppTab hideConnectionCard activeSubTab="notifications" showOnlyContent />
            </div>
          )}

          {/* WhatsApp - Templates */}
          {activeSection === "whatsapp-templates" && (
            <div className="space-y-5">
              <WhatsAppTab hideConnectionCard activeSubTab="templates" showOnlyContent />
            </div>
          )}

          {/* Impressora e Teste Section */}
          {activeSection === "impressora" && (
            <div className="space-y-5">
              <PrintTestTab 
                establishmentId={establishment?.id || 0}
                printers={printers}
                onAddPrinter={openAddPrinterModal}
                onEditPrinter={openEditPrinterModal}
                onDeletePrinter={handleDeletePrinter}
              />
            </div>
          )}

          {/* Integrações Section */}
          {activeSection === "integracoes" && (
            <div className="space-y-5">
              <IntegrationsTab />
            </div>
          )}

          {/* Pagamento Online Section */}
          {activeSection === "pagamento-online" && (
            <div className="space-y-5">
              <OnlinePaymentTab />
            </div>
          )}

          {/* Conta e Segurança Section */}
          {activeSection === "conta-seguranca" && (
            <div className="space-y-5">
              <AccountSecuritySection establishmentId={establishment?.id || 0} />
            </div>
          )}
        </div>
      </div>

      {/* Modal de Adicionar/Editar Impressora */}
      <Dialog open={isPrinterModalOpen} onOpenChange={setIsPrinterModalOpen}>
        <DialogContent
          className="sm:max-w-[425px] p-0 overflow-hidden border-t-4 border-t-primary"
          style={{ borderRadius: '16px' }}
        >
          <DialogTitle className="sr-only">{editingPrinter ? "Editar Impressora" : "Adicionar Impressora"}</DialogTitle>
          <div className="px-6 pt-5 pb-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2.5 rounded-xl flex-shrink-0 bg-red-100 dark:bg-red-950/50">
                <Printer className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">{editingPrinter ? "Editar Impressora" : "Adicionar Impressora"}</h3>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                  {editingPrinter ? "Atualize as informações da impressora" : "Cadastre uma nova impressora térmica"}
                </p>
              </div>
            </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="printerName">Nome da Impressora</Label>
              <Input
                id="printerName"
                value={printerName}
                onChange={(e) => setPrinterName(e.target.value)}
                placeholder="Ex: Cozinha, Caixa, Bar"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 space-y-2">
                <Label htmlFor="ipAddress">Endereço IP</Label>
                <Input
                  id="ipAddress"
                  value={printerIpAddress}
                  onChange={(e) => setPrinterIpAddress(e.target.value)}
                  placeholder="Ex: 192.168.1.100"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="port">Porta</Label>
                <Input
                  id="port"
                  type="number"
                  value={printerPort}
                  onChange={(e) => setPrinterPort(parseInt(e.target.value) || 9100)}
                  placeholder="9100"
                />
              </div>
            </div>

            {/* Tipo de Impressora */}
            <div className="space-y-2">
              <Label>Tipo de Impressora</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={printerType === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPrinterType('all')}
                >
                  Todos os Itens
                </Button>
                <Button
                  type="button"
                  variant={printerType === 'kitchen' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPrinterType('kitchen')}
                >
                  Cozinha
                </Button>
                <Button
                  type="button"
                  variant={printerType === 'counter' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPrinterType('counter')}
                >
                  Balcão
                </Button>
                <Button
                  type="button"
                  variant={printerType === 'bar' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPrinterType('bar')}
                >
                  Bar
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Defina o tipo para filtrar quais itens serão impressos nesta impressora
              </p>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="printerIsActive">Impressora Ativa</Label>
              <Switch
                id="printerIsActive"
                checked={printerIsActive}
                onCheckedChange={setPrinterIsActive}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="printerIsDefault">Impressora Padrão</Label>
              <Switch
                id="printerIsDefault"
                checked={printerIsDefault}
                onCheckedChange={setPrinterIsDefault}
              />
            </div>


          </div>

            <Button
              className="w-full rounded-xl h-10 font-semibold bg-red-700 hover:bg-red-800 text-white mt-4"
              onClick={handleSavePrinter}
              disabled={createPrinterMutation.isPending || updatePrinterMutation.isPending}
            >
              {createPrinterMutation.isPending || updatePrinterMutation.isPending
                ? "Salvando..."
                : "Salvar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Exclusão de Impressora */}
      <AlertDialog open={printerDeleteConfirmOpen} onOpenChange={setPrinterDeleteConfirmOpen}>
        <AlertDialogContent
          className="p-0 overflow-hidden border-t-4 border-t-red-500"
          style={{ borderRadius: '16px' }}
        >
          <AlertDialogTitle className="sr-only">Remover Impressora</AlertDialogTitle>
          <AlertDialogDescription className="sr-only">Confirmar remoção da impressora</AlertDialogDescription>
          <div className="px-6 pt-5 pb-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2.5 rounded-xl flex-shrink-0 bg-red-100 dark:bg-red-950/50">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Remover Impressora</h3>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                  Tem certeza que deseja remover a impressora "{printerToDelete?.name}"? Esta ação não pode ser desfeita.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <AlertDialogCancel className="flex-1 rounded-xl h-10 font-semibold">Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDeletePrinter}
                className="flex-1 rounded-xl h-10 font-semibold bg-red-600 hover:bg-red-700 text-white"
              >
                Remover
              </AlertDialogAction>
            </div>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de Seleção de Endereço no Mapa */}
      {showMapPicker && (
        <AddressMapPicker
          initialAddress={{
            street,
            number,
            neighborhood,
            city,
            state,
            zipCode,
            latitude: latitude || undefined,
            longitude: longitude || undefined,
          }}
          onAddressSelect={(address) => {
            setStreet(address.street);
            setNumber(address.number);
            setNeighborhood(address.neighborhood);
            setCity(address.city);
            setState(address.state);
            setZipCode(address.zipCode);
            setLatitude(address.latitude);
            setLongitude(address.longitude);
            setShowMapPicker(false);
            toast.success("Endereço atualizado com sucesso!");
          }}
          onClose={() => setShowMapPicker(false)}
        />
      )}

      {/* Modal de Crop de Imagem */}
      <ImageCropModal
        isOpen={cropModalOpen}
        onClose={() => {
          setCropModalOpen(false);
          setCropImageSrc("");
        }}
        imageSrc={cropImageSrc}
        onCropComplete={handleCroppedImage}
        aspectRatio={cropType === "logo" ? 1 : 16 / 9}
        cropShape={cropType === "logo" ? "round" : "rect"}
        title={cropType === "logo" ? "Recortar Logo" : "Recortar Capa"}
      />
    </AdminLayout>
  );
}
