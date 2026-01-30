import { AdminLayout } from "@/components/AdminLayout";
import { PageHeader, SectionCard } from "@/components/shared";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
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
  Truck,
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
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ImageCropModal } from "@/components/ImageCropModal";
import { AddressMapPicker } from "@/components/AddressMapPicker";
import { LoyaltySettingsCard } from "@/components/LoyaltySettingsCard";
import { WhatsAppTab } from "@/components/WhatsAppTab";
import { PrintTestTab } from "@/components/PrintTestTab";

export default function Configuracoes() {
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
  
  const [activeTab, setActiveTab] = useState("estabelecimento");

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
  
  // Public note state
  const [publicNote, setPublicNote] = useState("");
  const [publicNoteCreatedAt, setPublicNoteCreatedAt] = useState<Date | null>(null);
  const [noteValidityDays, setNoteValidityDays] = useState(7);
  
  // SMS settings state
  const [smsEnabled, setSmsEnabled] = useState(false);
  
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
  
  // Business hours state
  type BusinessHourDay = {
    dayOfWeek: number;
    isActive: boolean;
    openTime: string;
    closeTime: string;
  };
  const [businessHours, setBusinessHours] = useState<BusinessHourDay[]>([
    { dayOfWeek: 0, isActive: false, openTime: "18:00", closeTime: "23:00" }, // Domingo
    { dayOfWeek: 1, isActive: true, openTime: "18:00", closeTime: "23:00" }, // Segunda
    { dayOfWeek: 2, isActive: true, openTime: "18:00", closeTime: "23:00" }, // Terça
    { dayOfWeek: 3, isActive: true, openTime: "18:00", closeTime: "23:00" }, // Quarta
    { dayOfWeek: 4, isActive: true, openTime: "18:00", closeTime: "23:00" }, // Quinta
    { dayOfWeek: 5, isActive: true, openTime: "18:00", closeTime: "23:00" }, // Sexta
    { dayOfWeek: 6, isActive: true, openTime: "18:00", closeTime: "23:00" }, // Sábado
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
  
  // Social dropdown state for preview
  const [showSocialDropdown, setShowSocialDropdown] = useState(false);
  const socialDropdownRef = useRef<HTMLDivElement>(null);
  
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

  // Load establishment data
  useEffect(() => {
    if (establishment) {
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
    }
  }, [establishment]);
  
  // Load business hours when data is available
  useEffect(() => {
    if (businessHoursData && businessHoursData.length > 0) {
      const hoursMap = new Map(businessHoursData.map(h => [h.dayOfWeek, h]));
      setBusinessHours(prev => prev.map(day => {
        const savedHour = hoursMap.get(day.dayOfWeek);
        if (savedHour) {
          return {
            dayOfWeek: day.dayOfWeek,
            isActive: savedHour.isActive,
            openTime: savedHour.openTime || "18:00",
            closeTime: savedHour.closeTime || "23:00",
          };
        }
        return day;
      }));
    }
  }, [businessHoursData]);
  
  // Load neighborhood fees when data is available
  useEffect(() => {
    if (neighborhoodFeesData) {
      setNeighborhoodFees(neighborhoodFeesData.map(fee => ({
        id: fee.id,
        neighborhood: fee.neighborhood,
        fee: fee.fee,
      })));
    }
  }, [neighborhoodFeesData]);
  
  // Load printer settings when data is available
  useEffect(() => {
    if (printerSettings) {
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
    }
  }, [printerSettings]);

  // Upload mutation
  const uploadMutation = trpc.upload.image.useMutation();

  // Mutations
  const createMutation = trpc.establishment.create.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("Estabelecimento criado com sucesso");
    },
    onError: () => toast.error("Erro ao criar estabelecimento"),
  });

  const updateMutation = trpc.establishment.update.useMutation({
    onSuccess: () => {
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
      refetch();
      toast.success("Nota salva com sucesso! Ela ficará visível por 24 horas.");
    },
    onError: () => toast.error("Erro ao salvar nota"),
  });
  
  const removeNoteMutation = trpc.establishment.removePublicNote.useMutation({
    onSuccess: () => {
      refetch();
      setPublicNote("");
      setPublicNoteCreatedAt(null);
      toast.success("Nota removida com sucesso");
    },
    onError: () => toast.error("Erro ao remover nota"),
  });
  
  const saveBusinessHoursMutation = trpc.establishment.saveBusinessHours.useMutation({
    onSuccess: () => {
      refetchBusinessHours();
      toast.success("Horários de funcionamento salvos com sucesso");
    },
    onError: () => toast.error("Erro ao salvar horários de funcionamento"),
  });
  
  // Neighborhood fees mutations
  const createNeighborhoodFeeMutation = trpc.neighborhoodFees.create.useMutation({
    onSuccess: () => {
      refetchNeighborhoodFees();
    },
    onError: () => toast.error("Erro ao salvar taxa por bairro"),
  });
  
  const updateNeighborhoodFeeMutation = trpc.neighborhoodFees.update.useMutation({
    onSuccess: () => {
      refetchNeighborhoodFees();
    },
    onError: () => toast.error("Erro ao atualizar taxa por bairro"),
  });
  
  const deleteNeighborhoodFeeMutation = trpc.neighborhoodFees.delete.useMutation({
    onSuccess: () => {
      refetchNeighborhoodFees();
    },
    onError: () => toast.error("Erro ao remover taxa por bairro"),
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

    // Validar campos obrigatórios de endereço
    const missingFields = [];
    if (!street.trim()) missingFields.push("Rua");
    if (!number.trim()) missingFields.push("Número");
    if (!neighborhood.trim()) missingFields.push("Bairro");
    if (!city.trim()) missingFields.push("Cidade");
    if (!state.trim()) missingFields.push("Estado");
    if (!zipCode.trim()) missingFields.push("CEP");

    if (missingFields.length > 0) {
      toast.error(`Preencha os campos obrigatórios: ${missingFields.join(", ")}`);
      return;
    }

    const data = {
      name: name.trim(),
      logo: logo || undefined,
      coverImage: coverImage || undefined,
      street: street || undefined,
      number: number || undefined,
      complement: complement || undefined,
      neighborhood: neighborhood || undefined,
      city: city || undefined,
      state: state || undefined,
      zipCode: zipCode || undefined,
      latitude: latitude || undefined,
      longitude: longitude || undefined,
    };

    if (establishment) {
      updateMutation.mutate({ id: establishment.id, ...data });
    } else {
      createMutation.mutate(data);
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
      smsEnabled,
      deliveryTimeEnabled,
      deliveryTimeMin,
      deliveryTimeMax,
      minimumOrderEnabled,
      minimumOrderValue,
      deliveryFeeType,
      deliveryFeeFixed,
    });
    
    // Salvar taxas por bairro se o tipo for byNeighborhood
    if (deliveryFeeType === "byNeighborhood") {
      // Processar bairros: criar novos, atualizar existentes, deletar removidos
      const existingIds = neighborhoodFeesData?.map(f => f.id) || [];
      const currentIds = neighborhoodFees.filter(f => f.id).map(f => f.id!);
      
      // Deletar bairros removidos
      for (const id of existingIds) {
        if (!currentIds.includes(id)) {
          deleteNeighborhoodFeeMutation.mutate({ id });
        }
      }
      
      // Criar ou atualizar bairros
      for (const fee of neighborhoodFees) {
        if (!fee.neighborhood.trim()) continue; // Ignorar bairros sem nome
        
        if (fee.id) {
          // Atualizar existente
          updateNeighborhoodFeeMutation.mutate({
            id: fee.id,
            neighborhood: fee.neighborhood,
            fee: fee.fee,
          });
        } else {
          // Criar novo
          createNeighborhoodFeeMutation.mutate({
            establishmentId: establishment.id,
            neighborhood: fee.neighborhood,
            fee: fee.fee,
          });
        }
      }
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

    // Validar dimensões mínimas para capa
    if (type === "cover") {
      const img = new Image();
      img.onload = () => {
        if (img.width < 1200) {
          toast.error("A imagem de capa deve ter no mínimo 1200px de largura");
          return;
        }
        // Abrir modal de crop
        const reader = new FileReader();
        reader.onload = () => {
          setCropImageSrc(reader.result as string);
          setCropType(type);
          setCropModalOpen(true);
        };
        reader.readAsDataURL(file);
      };
      img.onerror = () => {
        toast.error("Erro ao carregar imagem");
      };
      img.src = URL.createObjectURL(file);
    } else {
      // Para logo, abrir direto o modal
      const reader = new FileReader();
      reader.onload = () => {
        setCropImageSrc(reader.result as string);
        setCropType(type);
        setCropModalOpen(true);
      };
      reader.readAsDataURL(file);
    }
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
          mimeType: "image/jpeg",
          folder: "establishments",
        });

        toast.dismiss("upload");
        toast.success("Imagem enviada com sucesso!");

        if (cropType === "logo") {
          setLogo(result.url);
          // Auto-save after logo upload
          if (establishment) {
            updateMutation.mutate({ id: establishment.id, logo: result.url });
          }
        } else {
          setCoverImage(result.url);
          // Auto-save after cover upload
          if (establishment) {
            updateMutation.mutate({ id: establishment.id, coverImage: result.url });
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
      <div className="mb-6">
        <PageHeader
          title="Configurações"
          description="Gerencie as configurações do seu estabelecimento"
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} style={{marginTop: '-14px'}}>
        <TabsList className="mb-6 bg-transparent border-b border-border/50 rounded-none p-0 h-auto gap-0">
          <TabsTrigger value="estabelecimento" className="relative px-6 py-3 rounded-none bg-transparent text-muted-foreground font-medium data-[state=active]:text-[#3730a3] data-[state=active]:font-semibold data-[state=active]:bg-transparent data-[state=active]:shadow-none after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-transparent data-[state=active]:after:bg-[#3730a3]">
            Estabelecimento
          </TabsTrigger>
          <TabsTrigger value="atendimento" className="relative px-6 py-3 rounded-none bg-transparent text-muted-foreground font-medium data-[state=active]:text-[#3730a3] data-[state=active]:font-semibold data-[state=active]:bg-transparent data-[state=active]:shadow-none after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-transparent data-[state=active]:after:bg-[#3730a3]">
            Atendimento
          </TabsTrigger>
          <TabsTrigger value="impressoras" className="relative px-6 py-3 rounded-none bg-transparent text-muted-foreground font-medium data-[state=active]:text-[#3730a3] data-[state=active]:font-semibold data-[state=active]:bg-transparent data-[state=active]:shadow-none after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-transparent data-[state=active]:after:bg-[#3730a3]">
            Impressoras
          </TabsTrigger>

          <TabsTrigger value="whatsapp" className="relative px-6 py-3 rounded-none bg-transparent text-muted-foreground font-medium data-[state=active]:text-[#3730a3] data-[state=active]:font-semibold data-[state=active]:bg-transparent data-[state=active]:shadow-none after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-transparent data-[state=active]:after:bg-[#3730a3]">
            WhatsApp
          </TabsTrigger>
          <TabsTrigger value="teste-impressao" className="relative px-6 py-3 rounded-none bg-transparent text-muted-foreground font-medium data-[state=active]:text-[#3730a3] data-[state=active]:font-semibold data-[state=active]:bg-transparent data-[state=active]:shadow-none after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-transparent data-[state=active]:after:bg-[#3730a3]">
            Teste Impressão
          </TabsTrigger>
        </TabsList>

        {/* Estabelecimento Tab */}
        <TabsContent value="estabelecimento" className="space-y-5">
          {/* Preview do Perfil Público + Endereço lado a lado */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 items-stretch">
            {/* Preview do Perfil Público - 60% */}
            <div className="lg:col-span-3 h-full">
              <SectionCard title="Preview do Perfil Público" className="h-full">
            <div className="bg-white rounded-2xl overflow-hidden border border-border/30 shadow-sm">
              {/* Cover Image */}
              <div className="relative h-48 bg-gradient-to-br from-red-100 to-red-50">
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
                
                {/* Edit Cover Button */}
                <button
                  onClick={() => coverInputRef.current?.click()}
                  className="absolute top-3 right-3 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
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
                    {publicNote && publicNoteCreatedAt && (
                      <div className="absolute -top-14 left-0 z-20 animate-float-balloon">
                        <div className="relative">
                          {/* Balão estilo bolha */}
                          <div className="bg-white rounded-[20px] px-3 py-1.5 shadow-md border border-gray-200 max-w-[140px]">
                            <p className="text-xs text-gray-700 text-center leading-tight break-words">{publicNote}</p>
                          </div>
                          {/* Bico do balão em formato de balão de pensamento - círculo maior à esquerda, menor à direita */}
                          <div className="absolute -bottom-2.5 left-4 w-3.5 h-3.5 bg-white rounded-full border border-gray-200 shadow-sm"></div>
                          <div className="absolute -bottom-5 left-7 w-2 h-2 bg-white rounded-full border border-gray-200 shadow-sm"></div>
                        </div>
                      </div>
                    )}
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
                    
                    {/* Edit Logo Button */}
                    <button
                      onClick={() => logoInputRef.current?.click()}
                      className="absolute bottom-1 right-1 p-2 bg-white hover:bg-gray-100 rounded-full shadow-md transition-colors"
                      title="Alterar logo"
                    >
                      <Pencil className="h-3.5 w-3.5 text-gray-600" />
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
                <div className="pt-20 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="flex-1">
                    {/* Restaurant Name and Rating */}
                    <div className="flex items-center gap-1 flex-wrap">
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
                          <h3 className="text-xl font-bold text-gray-900 group-hover:text-primary transition-colors">
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
                        <span className="text-sm font-semibold text-gray-800">
                          {establishment?.rating ? Number(establishment.rating).toFixed(1).replace('.', ',') : '0,0'}
                        </span>
                        <span className="text-sm text-gray-500">
                          ({establishment?.reviewCount || 0} avaliações)
                        </span>
                      </div>
                    </div>

                    {/* Address and More Info - PIXEL PERFECT igual ao menu público */}
                    <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                      {fullAddress && (
                        <>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5 text-gray-500" />
                            {fullAddress}
                          </span>
                          <span className="text-gray-400">•</span>
                        </>
                      )}
                      <button className="flex items-center gap-1 text-gray-600 hover:text-red-500 font-medium transition-colors">
                        <Info className="h-3.5 w-3.5" />
                        Informações
                      </button>
                    </div>
                    
                    {/* Status and Delivery Types - PIXEL PERFECT igual ao menu público */}
                    <div className="flex flex-wrap items-center gap-3 mt-2">
                      {/* Open Status with Pulsing Icon - igual ao menu público */}
                      <span className="flex items-center gap-1.5 text-green-600 font-medium text-sm">
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                        </span>
                        Aberto agora
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
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full border border-gray-200" 
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
                    <div className="relative mt-3 pt-3 border-t border-gray-100" style={{paddingTop: '0px'}} ref={socialDropdownRef}>
                      <button
                        onClick={() => setShowSocialDropdown(!showSocialDropdown)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <span>Redes Sociais</span>
                        <svg className={`h-4 w-4 transition-transform ${showSocialDropdown ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                      </button>
                      
                      {/* Dropdown Menu - abre para cima */}
                      {showSocialDropdown && (
                        <div className="absolute left-0 bottom-full mb-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 min-w-[160px]">
                          {whatsapp && (
                            <a 
                              href={`https://wa.me/55${whatsapp.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors"
                              onClick={() => setShowSocialDropdown(false)}
                            >
                              <svg className="h-5 w-5 text-green-500" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                              </svg>
                              <span className="text-sm text-gray-700">WhatsApp</span>
                            </a>
                          )}
                          {instagram && (
                            <a 
                              href={`https://instagram.com/${instagram.replace('@', '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors"
                              onClick={() => setShowSocialDropdown(false)}
                            >
                              <svg className="h-5 w-5 text-pink-500" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                              </svg>
                              <span className="text-sm text-gray-700">Instagram</span>
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
                      className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                      title="Compartilhar"
                    >
                      <svg className="h-5 w-5 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
            </div>
              </SectionCard>
            </div>

            {/* Endereço do Estabelecimento - 40% */}
            <div className="lg:col-span-2 h-full">
              <SectionCard title="Endereço do Estabelecimento" className="h-full">
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
                      <Label htmlFor="number" className="text-xs font-semibold">Nº <span className="text-red-500">*</span></Label>
                      <Input
                        id="number"
                        value={number}
                        onChange={(e) => setNumber(e.target.value)}
                        placeholder="123"
                        required
                        className={cn(
                          "mt-1 h-9 rounded-xl border-border/50 focus:ring-2 focus:ring-primary/20 text-sm",
                          !number.trim() && "border-red-300 focus:border-red-500"
                        )}
                      />
                    </div>
                    <div className="col-span-3">
                      <Label htmlFor="neighborhood" className="text-xs font-semibold">Bairro <span className="text-red-500">*</span></Label>
                      <Input
                        id="neighborhood"
                        value={neighborhood}
                        onChange={(e) => setNeighborhood(e.target.value)}
                        placeholder="Bairro"
                        required
                        className={cn(
                          "mt-1 h-9 rounded-xl border-border/50 focus:ring-2 focus:ring-primary/20 text-sm",
                          !neighborhood.trim() && "border-red-300 focus:border-red-500"
                        )}
                      />
                    </div>
                    <div className="col-span-4">
                      <Label htmlFor="city" className="text-xs font-semibold">Cidade <span className="text-red-500">*</span></Label>
                      <Input
                        id="city"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="Cidade"
                        required
                        className={cn(
                          "mt-1 h-9 rounded-xl border-border/50 focus:ring-2 focus:ring-primary/20 text-sm",
                          !city.trim() && "border-red-300 focus:border-red-500"
                        )}
                      />
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="state" className="text-xs font-semibold">UF <span className="text-red-500">*</span></Label>
                      <Input
                        id="state"
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        placeholder="UF"
                        required
                        className={cn(
                          "mt-1 h-9 rounded-xl border-border/50 focus:ring-2 focus:ring-primary/20 text-sm",
                          !state.trim() && "border-red-300 focus:border-red-500"
                        )}
                      />
                    </div>
                  </div>

                  {/* Complemento e CEP */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="complement" className="text-xs font-semibold">Complemento <span className="text-gray-400 text-xs font-normal">(opcional)</span></Label>
                      <Input
                        id="complement"
                        value={complement}
                        onChange={(e) => setComplement(e.target.value)}
                        placeholder="Sala, Bloco, etc."
                        className="mt-1 h-9 rounded-xl border-border/50 focus:ring-2 focus:ring-primary/20 text-sm"
                      />
                    </div>
                    <div>
                      <Label htmlFor="zipCode" className="text-xs font-semibold">CEP <span className="text-red-500">*</span></Label>
                      <Input
                        id="zipCode"
                        value={zipCode}
                        onChange={(e) => setZipCode(e.target.value)}
                        placeholder="00000-000"
                        required
                        className={cn(
                          "mt-1 h-9 rounded-xl border-border/50 focus:ring-2 focus:ring-primary/20 text-sm",
                          !zipCode.trim() && "border-red-300 focus:border-red-500"
                        )}
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
          </div>

          {/* Nota do Restaurante */}
          <SectionCard title="Nota do Restaurante">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Deixe uma nota temporária para seus clientes. Ela aparecerá como um balão acima da foto de perfil no cardápio público e ficará visível por 24 horas.
              </p>
              
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
                      className="px-3 py-1.5 text-xs bg-white hover:bg-primary/10 hover:text-primary rounded-full transition-colors border border-gray-200 hover:border-primary/30 shadow-sm"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
              
              {/* Seleção de Estilo do Balão */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Estilo do Balão</Label>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                  {[
                    { id: "default", name: "Padrão", bg: "bg-white", text: "text-gray-700", border: "border-gray-200", arrowBg: "bg-white border-r border-b border-gray-200" },
                    { id: "ocean", name: "Oceano", bg: "bg-gradient-to-r from-cyan-400 to-blue-500", text: "text-white", border: "border-transparent", arrowBg: "bg-blue-500" },
                    { id: "forest", name: "Floresta", bg: "bg-gradient-to-r from-green-400 to-emerald-500", text: "text-white", border: "border-transparent", arrowBg: "bg-emerald-500" },
                    { id: "fire", name: "Fogo", bg: "bg-gradient-to-r from-red-500 to-orange-500", text: "text-white", border: "border-transparent", arrowBg: "bg-orange-500" },
                    { id: "gold", name: "Dourado", bg: "bg-gradient-to-r from-yellow-400 to-amber-500", text: "text-white", border: "border-transparent", arrowBg: "bg-amber-500" },
                    { id: "night", name: "Noite", bg: "bg-gradient-to-r from-gray-700 to-gray-900", text: "text-white", border: "border-transparent", arrowBg: "bg-gray-900" },
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
                          : "border-gray-200 hover:border-gray-300"
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

          {/* Cartão Fidelidade */}
          <SectionCard title="Cartão Fidelidade">
            <LoyaltySettingsCard establishmentId={establishment?.id || 0} />
          </SectionCard>

        </TabsContent>

        {/* Atendimento Tab */}
        <TabsContent value="atendimento" className="space-y-5">
          {/* Configurações básicas */}
          <SectionCard title="Configurações básicas de atendimento">
            <div className="space-y-5">
              {/* Linha 1: Link do cardápio, WhatsApp e Instagram */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Link do cardápio */}
                <div>
                  <Label htmlFor="menuSlug" className="text-sm font-semibold">Link do cardápio</Label>
                  <div className="flex gap-2 mt-2">
                    <div className="flex items-center px-2 bg-muted/50 rounded-l-xl border border-r-0 border-border/50 text-xs text-muted-foreground font-medium whitespace-nowrap">
                      mindi.manus.space/menu/
                    </div>
                    <Input
                      id="menuSlug"
                      value={menuSlug}
                      onChange={(e) => setMenuSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_.\-]/g, ""))}
                      placeholder="seu_restaurante"
                      className="rounded-l-none flex-1 h-10 rounded-r-xl border-border/50 focus:ring-2 focus:ring-primary/20 min-w-0"
                    />
                    <Button variant="outline" size="icon" onClick={copyMenuLink} title="Copiar link" className="h-10 w-10 rounded-xl border-border/50 hover:bg-accent flex-shrink-0" disabled={!menuSlug}>
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={openMenuPreview} title="Visualizar cardápio" className="h-10 w-10 rounded-xl border-border/50 hover:bg-accent flex-shrink-0" disabled={!menuSlug}>
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* WhatsApp */}
                <div>
                  <Label htmlFor="whatsapp" className="text-sm font-semibold">WhatsApp</Label>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="p-2.5 bg-emerald-50 rounded-xl flex-shrink-0">
                      <Phone className="h-4 w-4 text-emerald-600" />
                    </div>
                    <Input
                      id="whatsapp"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      placeholder="+55 (00) 00000-0000"
                      className="flex-1 h-10 rounded-xl border-border/50 focus:ring-2 focus:ring-primary/20 min-w-0"
                    />
                  </div>
                </div>

                {/* Instagram */}
                <div>
                  <Label htmlFor="instagram" className="text-sm font-semibold">Instagram</Label>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="p-2.5 bg-pink-50 rounded-xl flex-shrink-0">
                      <svg className="h-4 w-4 text-pink-600" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                      </svg>
                    </div>
                    <Input
                      id="instagram"
                      value={instagram}
                      onChange={(e) => setInstagram(e.target.value)}
                      placeholder="@seurestaurante"
                      className="flex-1 h-10 rounded-xl border-border/50 focus:ring-2 focus:ring-primary/20 min-w-0"
                    />
                  </div>
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                O link do cardápio será público. Use apenas letras minúsculas, números, hífens (-), underscores (_) e pontos (.).
              </p>

              <Button onClick={handleSaveServiceSettings} disabled={isPending} className="rounded-xl shadow-sm">
                <Save className="h-4 w-4 mr-2" />
                {isPending ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </SectionCard>

          {/* Formas de pagamento */}
          <SectionCard title="Formas de pagamento">
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <label className="flex flex-col items-center gap-2 p-4 border border-border/50 rounded-xl hover:bg-muted/30 cursor-pointer transition-colors">
                  <Checkbox
                    checked={acceptsCash}
                    onCheckedChange={(checked) => setAcceptsCash(checked as boolean)}
                    className="h-5 w-5 rounded-md data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                  <span className="font-semibold text-sm">Dinheiro</span>
                </label>
                <label className="flex flex-col items-center gap-2 p-4 border border-border/50 rounded-xl hover:bg-muted/30 cursor-pointer transition-colors">
                  <Checkbox
                    checked={acceptsCard}
                    onCheckedChange={(checked) => setAcceptsCard(checked as boolean)}
                    className="h-5 w-5 rounded-md data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                  <span className="font-semibold text-sm">Cartão</span>
                </label>
                <label className="flex flex-col items-center gap-2 p-4 border border-border/50 rounded-xl hover:bg-muted/30 cursor-pointer transition-colors">
                  <Checkbox
                    checked={acceptsPix}
                    onCheckedChange={(checked) => setAcceptsPix(checked as boolean)}
                    className="h-5 w-5 rounded-md data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                  <span className="font-semibold text-sm">Pix</span>
                </label>
              </div>

              {/* Campo de Chave Pix */}
              {acceptsPix && (
                <div className="space-y-2">
                  <Label htmlFor="pixKey" className="text-sm font-medium">Chave Pix</Label>
                  <Input
                    id="pixKey"
                    value={pixKey}
                    onChange={(e) => setPixKey(e.target.value)}
                    placeholder="CPF, CNPJ, email, telefone ou chave aleatória"
                    className="rounded-xl"
                  />
                  <p className="text-xs text-muted-foreground">Esta chave será exibida para o cliente copiar ao selecionar Pix como forma de pagamento.</p>
                </div>
              )}

              <Button onClick={handleSaveServiceSettings} disabled={isPending} className="rounded-xl shadow-sm">
                <Save className="h-4 w-4 mr-2" />
                {isPending ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </SectionCard>

          {/* Informações e entrega */}
          <SectionCard title="Informações e entrega">
            <div className="space-y-5">
              {/* Layout principal - todos os elementos na mesma linha em desktop */}
              <div className="flex flex-col lg:flex-row gap-4 lg:items-stretch">
                {/* Tipo de entrega */}
                <div className="flex gap-3 shrink-0">
                  <label
                    className={cn(
                      "relative flex flex-col items-center gap-2 p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 min-w-[100px]",
                      allowsDelivery
                        ? "border-primary bg-primary/5 shadow-soft"
                        : "border-border/50 hover:border-muted-foreground/30 hover:bg-muted/30"
                    )}
                  >
                    <div className={cn(
                      "p-2 rounded-lg",
                      allowsDelivery ? "bg-primary/10" : "bg-muted/50"
                    )}>
                      <Truck className={cn("h-5 w-5", allowsDelivery ? "text-primary" : "text-muted-foreground")} />
                    </div>
                    <span className={cn("font-medium text-sm", allowsDelivery ? "text-primary" : "text-muted-foreground")}>
                      Entrega
                    </span>
                    <Checkbox
                      checked={allowsDelivery}
                      onCheckedChange={(checked) => setAllowsDelivery(checked as boolean)}
                      className="sr-only"
                    />
                    {allowsDelivery && (
                      <span className="absolute top-2 right-2 h-2.5 w-2.5 bg-primary rounded-full ring-2 ring-white" />
                    )}
                  </label>

                  <label
                    className={cn(
                      "relative flex flex-col items-center gap-2 p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 min-w-[100px]",
                      allowsPickup
                        ? "border-primary bg-primary/5 shadow-soft"
                        : "border-border/50 hover:border-muted-foreground/30 hover:bg-muted/30"
                    )}
                  >
                    <div className={cn(
                      "p-2 rounded-lg",
                      allowsPickup ? "bg-primary/10" : "bg-muted/50"
                    )}>
                      <Store className={cn("h-5 w-5", allowsPickup ? "text-primary" : "text-muted-foreground")} />
                    </div>
                    <span className={cn("font-medium text-sm", allowsPickup ? "text-primary" : "text-muted-foreground")}>
                      Retirada
                    </span>
                    <Checkbox
                      checked={allowsPickup}
                      onCheckedChange={(checked) => setAllowsPickup(checked as boolean)}
                      className="sr-only"
                    />
                    {allowsPickup && (
                      <span className="absolute top-2 right-2 h-2.5 w-2.5 bg-primary rounded-full ring-2 ring-white" />
                    )}
                  </label>
                </div>

                {/* Tempo de entrega e Pedido mínimo lado a lado */}
                <div className="flex flex-col md:flex-row gap-4 flex-1">
                  {/* Exibir tempo de entrega */}
                  <div className="flex-1 flex items-start gap-3 p-4 bg-muted/30 rounded-xl border border-border/30">
                    <div className={cn(
                      "p-2 rounded-lg shrink-0",
                      deliveryTimeEnabled ? "bg-primary/10" : "bg-muted/50"
                    )}>
                      <Clock className={cn("h-5 w-5", deliveryTimeEnabled ? "text-primary" : "text-muted-foreground")} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-semibold text-sm">Tempo de entrega</h4>
                        <label className="relative inline-flex items-center cursor-pointer shrink-0">
                          <input
                            type="checkbox"
                            checked={deliveryTimeEnabled}
                            onChange={(e) => setDeliveryTimeEnabled(e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-10 h-5 bg-muted rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                        </label>
                      </div>
                      {deliveryTimeEnabled && (
                        <div className="mt-2 flex items-center gap-2 flex-wrap">
                          <div className="flex items-center gap-1">
                            <Input
                              type="number"
                              value={deliveryTimeMin}
                              onChange={(e) => setDeliveryTimeMin(parseInt(e.target.value) || 0)}
                              className="w-16 h-8 rounded-lg text-sm"
                              min={0}
                            />
                            <span className="text-xs text-muted-foreground">-</span>
                            <Input
                              type="number"
                              value={deliveryTimeMax}
                              onChange={(e) => setDeliveryTimeMax(parseInt(e.target.value) || 0)}
                              className="w-16 h-8 rounded-lg text-sm"
                              min={0}
                            />
                            <span className="text-xs text-muted-foreground">min</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Pedido Mínimo */}
                  <div className="flex-1 flex items-start gap-3 p-4 bg-muted/30 rounded-xl border border-border/30">
                    <div className={cn(
                      "p-2 rounded-lg shrink-0",
                      minimumOrderEnabled ? "bg-primary/10" : "bg-muted/50"
                    )}>
                      <CreditCard className={cn("h-5 w-5", minimumOrderEnabled ? "text-primary" : "text-muted-foreground")} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-semibold text-sm">Pedido mínimo</h4>
                        <label className="relative inline-flex items-center cursor-pointer shrink-0">
                          <input
                            type="checkbox"
                            checked={minimumOrderEnabled}
                            onChange={(e) => setMinimumOrderEnabled(e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-10 h-5 bg-muted rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                        </label>
                      </div>
                      {minimumOrderEnabled && (
                        <div className="mt-2 flex items-center gap-1">
                          <span className="text-sm text-muted-foreground">R$</span>
                          <Input
                            type="number"
                            value={minimumOrderValue}
                            onChange={(e) => setMinimumOrderValue(e.target.value)}
                            className="w-20 h-8 rounded-lg text-sm"
                            min={0}
                            step="0.01"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <Button onClick={handleSaveServiceSettings} disabled={isPending} className="rounded-xl shadow-sm">
                <Save className="h-4 w-4 mr-2" />
                {isPending ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </SectionCard>

          {/* Notificações SMS */}
          <SectionCard title="Notificações SMS">
            <div className="space-y-5">
              <div className="flex items-start gap-4 p-4 bg-muted/30 rounded-xl border border-border/30">
                <div className={cn(
                  "p-3 rounded-xl",
                  smsEnabled ? "bg-emerald-100" : "bg-muted/50"
                )}>
                  <MessageSquare className={cn("h-6 w-6", smsEnabled ? "text-emerald-600" : "text-muted-foreground")} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-sm">SMS de pedido saindo para entrega</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        Quando ativado, o cliente receberá um SMS automático quando o status do pedido mudar para "Pronto".
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={smsEnabled}
                        onChange={(e) => setSmsEnabled(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                    </label>
                  </div>
                  {smsEnabled && (
                    <div className="mt-3 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                      <p className="text-xs text-emerald-700">
                        <strong>Mensagem enviada:</strong> "{name || 'Seu Restaurante'}: Seu pedido está saindo para entrega."
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <Button onClick={handleSaveServiceSettings} disabled={isPending} className="rounded-xl shadow-sm">
                <Save className="h-4 w-4 mr-2" />
                {isPending ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </SectionCard>
          


          {/* Taxa de Entrega */}
          <SectionCard title="Taxa de entrega">
            <div className="space-y-5">
              <p className="text-sm text-muted-foreground">
                Configure como a taxa de entrega será calculada para seus clientes.
              </p>
              
              <div className="flex gap-3 flex-wrap">
                {/* Opção Grátis */}
                <label
                  className={cn(
                    "relative flex flex-col items-center gap-3 p-5 border-2 rounded-2xl cursor-pointer transition-all duration-200 min-w-[120px]  flex-1",
                    deliveryFeeType === "free"
                      ? "border-emerald-500 bg-emerald-50"
                      : "border-border/50 hover:border-muted-foreground/30 hover:bg-muted/30"
                  )}
                >
                  <div className={cn(
                    "p-3 rounded-xl",
                    deliveryFeeType === "free" ? "bg-emerald-100" : "bg-muted/50"
                  )}>
                    <Truck className={cn("h-6 w-6", deliveryFeeType === "free" ? "text-emerald-600" : "text-muted-foreground")} />
                  </div>
                  <span className={cn("font-semibold text-sm", deliveryFeeType === "free" ? "text-emerald-700" : "text-muted-foreground")}>
                    Grátis
                  </span>
                  <input
                    type="radio"
                    name="deliveryFeeType"
                    value="free"
                    checked={deliveryFeeType === "free"}
                    onChange={() => setDeliveryFeeType("free")}
                    className="sr-only"
                  />
                  {deliveryFeeType === "free" && (
                    <span className="absolute top-2 right-2 h-3 w-3 bg-emerald-500 rounded-full ring-2 ring-white" />
                  )}
                </label>

                {/* Opção Fixa */}
                <label
                  className={cn(
                    "relative flex flex-col items-center gap-3 p-5 border-2 rounded-2xl cursor-pointer transition-all duration-200 min-w-[120px] flex-1",
                    deliveryFeeType === "fixed"
                      ? "border-primary bg-primary/5"
                      : "border-border/50 hover:border-muted-foreground/30 hover:bg-muted/30"
                  )}
                >
                  <div className={cn(
                    "p-3 rounded-xl",
                    deliveryFeeType === "fixed" ? "bg-primary/10" : "bg-muted/50"
                  )}>
                    <CreditCard className={cn("h-6 w-6", deliveryFeeType === "fixed" ? "text-primary" : "text-muted-foreground")} />
                  </div>
                  <span className={cn("font-semibold text-sm", deliveryFeeType === "fixed" ? "text-primary" : "text-muted-foreground")}>
                    Fixa
                  </span>
                  <input
                    type="radio"
                    name="deliveryFeeType"
                    value="fixed"
                    checked={deliveryFeeType === "fixed"}
                    onChange={() => setDeliveryFeeType("fixed")}
                    className="sr-only"
                  />
                  {deliveryFeeType === "fixed" && (
                    <span className="absolute top-2 right-2 h-3 w-3 bg-primary rounded-full ring-2 ring-white" />
                  )}
                </label>

                {/* Opção Por Bairros */}
                <label
                  className={cn(
                    "relative flex flex-col items-center gap-3 p-5 border-2 rounded-2xl cursor-pointer transition-all duration-200 min-w-[120px] flex-1",
                    deliveryFeeType === "byNeighborhood"
                      ? "border-blue-500 bg-blue-50"
                      : "border-border/50 hover:border-muted-foreground/30 hover:bg-muted/30"
                  )}
                >
                  <div className={cn(
                    "p-3 rounded-xl",
                    deliveryFeeType === "byNeighborhood" ? "bg-blue-100" : "bg-muted/50"
                  )}>
                    <MapPin className={cn("h-6 w-6", deliveryFeeType === "byNeighborhood" ? "text-blue-600" : "text-muted-foreground")} />
                  </div>
                  <span className={cn("font-semibold text-sm", deliveryFeeType === "byNeighborhood" ? "text-blue-700" : "text-muted-foreground")}>
                    Por Bairros
                  </span>
                  <input
                    type="radio"
                    name="deliveryFeeType"
                    value="byNeighborhood"
                    checked={deliveryFeeType === "byNeighborhood"}
                    onChange={() => setDeliveryFeeType("byNeighborhood")}
                    className="sr-only"
                  />
                  {deliveryFeeType === "byNeighborhood" && (
                    <span className="absolute top-2 right-2 h-3 w-3 bg-blue-500 rounded-full ring-2 ring-white" />
                  )}
                </label>
              </div>

              {/* Campo de valor fixo */}
              {deliveryFeeType === "fixed" && (
                <div className="p-4 bg-muted/30 rounded-xl border border-border/30">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm font-medium">Valor da taxa:</Label>
                    <div className="flex items-center">
                      <span className="text-sm text-muted-foreground mr-1">R$</span>
                      <Input
                        type="number"
                        value={deliveryFeeFixed}
                        onChange={(e) => setDeliveryFeeFixed(e.target.value)}
                        className="w-24 h-9 rounded-lg text-sm"
                        min={0}
                        step="0.01"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Lista de bairros */}
              {deliveryFeeType === "byNeighborhood" && (
                <div className="p-4 bg-muted/30 rounded-xl border border-border/30 space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Bairros e taxas</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setNeighborhoodFees([...neighborhoodFees, { neighborhood: "", fee: "0" }])}
                      className="rounded-lg"
                    >
                      + Adicionar bairro
                    </Button>
                  </div>
                  
                  {neighborhoodFees.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Nenhum bairro cadastrado. Clique em "Adicionar bairro" para começar.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {neighborhoodFees.map((item, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <Input
                            placeholder="Nome do bairro"
                            value={item.neighborhood}
                            onChange={(e) => {
                              const updated = [...neighborhoodFees];
                              updated[index].neighborhood = e.target.value;
                              setNeighborhoodFees(updated);
                            }}
                            className="flex-1 h-9 rounded-lg text-sm"
                          />
                          <div className="flex items-center gap-1">
                            <span className="text-sm text-muted-foreground">R$</span>
                            <Input
                              type="number"
                              placeholder="0,00"
                              value={item.fee}
                              onChange={(e) => {
                                const updated = [...neighborhoodFees];
                                updated[index].fee = e.target.value;
                                setNeighborhoodFees(updated);
                              }}
                              className="w-20 h-9 rounded-lg text-sm"
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
                            className="h-9 w-9 text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <Button onClick={handleSaveServiceSettings} disabled={isPending} className="rounded-xl shadow-sm">
                <Save className="h-4 w-4 mr-2" />
                {isPending ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </SectionCard>

          {/* Horários de Funcionamento */}
          <SectionCard title="Horários de funcionamento">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Configure os horários de funcionamento do seu estabelecimento. O menu público exibirá automaticamente se o restaurante está aberto ou fechado.
              </p>
              
              <div className="space-y-3">
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
                        "flex items-center gap-4 p-4 rounded-xl border transition-all",
                        hourData?.isActive
                          ? "border-primary/30 bg-primary/5"
                          : "border-border/50 bg-muted/30"
                      )}
                    >
                      {/* Toggle */}
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
                        <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                      
                      {/* Day name */}
                      <span className={cn(
                        "font-medium min-w-[120px]",
                        hourData?.isActive ? "text-foreground" : "text-muted-foreground"
                      )}>
                        {name}
                      </span>
                      
                      {/* Time inputs */}
                      {hourData?.isActive && (
                        <div className="flex items-center gap-2 ml-auto">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <Input
                              type="time"
                              value={hourData.openTime}
                              onChange={(e) => {
                                setBusinessHours(prev => prev.map(h =>
                                  h.dayOfWeek === day ? { ...h, openTime: e.target.value } : h
                                ));
                              }}
                              className="w-[100px] h-9 rounded-lg text-sm"
                            />
                          </div>
                          <span className="text-muted-foreground">até</span>
                          <Input
                            type="time"
                            value={hourData.closeTime}
                            onChange={(e) => {
                              setBusinessHours(prev => prev.map(h =>
                                h.dayOfWeek === day ? { ...h, closeTime: e.target.value } : h
                              ));
                            }}
                            className="w-[100px] h-9 rounded-lg text-sm"
                          />
                        </div>
                      )}
                      
                      {!hourData?.isActive && (
                        <span className="text-sm text-muted-foreground ml-auto">Fechado</span>
                      )}
                    </div>
                  );
                })}
              </div>
              
              <Button
                onClick={() => {
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
                disabled={saveBusinessHoursMutation.isPending}
                className="rounded-xl shadow-sm"
              >
                <Save className="h-4 w-4 mr-2" />
                {saveBusinessHoursMutation.isPending ? "Salvando..." : "Salvar Horários"}
              </Button>
            </div>
          </SectionCard>
        </TabsContent>

        {/* Impressoras Tab */}
        <TabsContent value="impressoras" className="space-y-5">
          {/* Configurações de Impressão */}
          <SectionCard
            title="Configurações de Impressão"
            description="Configure como os pedidos serão impressos automaticamente"
          >
            <div className="space-y-6">
              {/* Toggle de Impressão Automática */}
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                <div className="space-y-1">
                  <Label className="text-base font-medium">Impressão Automática</Label>
                  <p className="text-sm text-muted-foreground">
                    Imprimir pedidos automaticamente quando recebidos
                  </p>
                </div>
                <Switch
                  checked={autoPrintEnabled}
                  onCheckedChange={setAutoPrintEnabled}
                />
              </div>

              {autoPrintEnabled && (
                <div className="space-y-4 pl-4 border-l-2 border-primary/20">
                  {/* Quando Imprimir */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-muted-foreground">Quando imprimir:</Label>
                    
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Ao receber novo pedido</Label>
                      <Switch
                        checked={printOnNewOrder}
                        onCheckedChange={setPrintOnNewOrder}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Ao mudar status do pedido</Label>
                      <Switch
                        checked={printOnStatusChange}
                        onCheckedChange={setPrintOnStatusChange}
                      />
                    </div>
                  </div>

                  {/* Número de Cópias */}
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Número de cópias</Label>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPrintCopies(Math.max(1, printCopies - 1))}
                        disabled={printCopies <= 1}
                      >
                        -
                      </Button>
                      <span className="w-8 text-center">{printCopies}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPrintCopies(Math.min(5, printCopies + 1))}
                        disabled={printCopies >= 5}
                      >
                        +
                      </Button>
                    </div>
                  </div>

                  {/* Largura do Papel */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Largura do papel:</Label>
                    <div className="flex gap-2">
                      <Button
                        variant={printPaperWidth === '58mm' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setPrintPaperWidth('58mm')}
                        className="flex-1"
                      >
                        58mm
                      </Button>
                      <Button
                        variant={printPaperWidth === '80mm' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setPrintPaperWidth('80mm')}
                        className="flex-1"
                      >
                        80mm
                      </Button>
                    </div>
                  </div>

                  {/* Opções de Layout */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-muted-foreground">Layout do cupom:</Label>
                    
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Mostrar logo</Label>
                      <Switch
                        checked={printShowLogo}
                        onCheckedChange={setPrintShowLogo}
                      />
                    </div>

                    {printShowLogo && (
                      <div className="space-y-2 pl-4">
                        <Label className="text-sm">URL do logo personalizado (opcional)</Label>
                        <Input
                          value={printLogoUrl}
                          onChange={(e) => setPrintLogoUrl(e.target.value)}
                          placeholder="https://exemplo.com/logo.png"
                        />
                        <p className="text-xs text-muted-foreground">
                          Deixe em branco para usar o logo do estabelecimento
                        </p>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Mostrar QR Code</Label>
                      <Switch
                        checked={printShowQrCode}
                        onCheckedChange={setPrintShowQrCode}
                      />
                    </div>
                  </div>

                  {/* Mensagem do Cabeçalho */}
                  <div className="space-y-2">
                    <Label className="text-sm">Mensagem do cabeçalho</Label>
                    <Input
                      value={printHeaderMessage}
                      onChange={(e) => setPrintHeaderMessage(e.target.value)}
                      placeholder="Ex: Delivery - (34) 99880-7793"
                    />
                  </div>

                  {/* Mensagem do Rodapé */}
                  <div className="space-y-2">
                    <Label className="text-sm">Mensagem do rodapé</Label>
                    <Textarea
                      value={printFooterMessage}
                      onChange={(e) => setPrintFooterMessage(e.target.value)}
                      placeholder="Ex: Obrigado pela preferência!"
                      rows={2}
                    />
                  </div>
                </div>
              )}
              
              {/* POSPrinterDriver - Impressão Automática via Servidor */}
              <div className="mt-6 pt-6 border-t">
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl border border-blue-500/20">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Label className="text-base font-medium">POSPrinterDriver</Label>
                      <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full">Recomendado</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Impressão 100% automática via servidor - sem precisar clicar em nada!
                    </p>
                  </div>
                  <Switch
                    checked={posPrinterEnabled}
                    onCheckedChange={setPosPrinterEnabled}
                  />
                </div>
                
                {posPrinterEnabled && (
                  <div className="space-y-4 mt-4 pl-4 border-l-2 border-blue-500/30">
                    {/* Instruções */}
                    <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                      <p className="text-sm font-medium">Como configurar:</p>
                      <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                        <li>Baixe o app <strong>POSPrinterDriver</strong> na Play Store</li>
                        <li>Configure sua impressora térmica no app</li>
                        <li>Copie o <strong>Linkcode</strong> gerado pelo app</li>
                        <li>Cole o Linkcode abaixo e clique em "Testar Conexão"</li>
                      </ol>
                      <a 
                        href="https://play.google.com/store/apps/details?id=com.nicola.posprinterdriver" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-blue-500 hover:underline mt-2"
                      >
                        Baixar POSPrinterDriver
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                    
                    {/* Linkcode */}
                    <div className="space-y-2">
                      <Label className="text-sm">Linkcode do Terminal</Label>
                      <Input
                        value={posPrinterLinkcode}
                        onChange={(e) => setPosPrinterLinkcode(e.target.value.toUpperCase())}
                        placeholder="Ex: ABC123"
                        className="font-mono uppercase"
                      />
                      <p className="text-xs text-muted-foreground">
                        O Linkcode é gerado automaticamente pelo app POSPrinterDriver
                      </p>
                    </div>
                    
                    {/* Número da Impressora */}
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label className="text-sm">Número da Impressora</Label>
                        <p className="text-xs text-muted-foreground">Se tiver múltiplas impressoras configuradas</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPosPrinterNumber(Math.max(1, posPrinterNumber - 1))}
                          disabled={posPrinterNumber <= 1}
                        >
                          -
                        </Button>
                        <span className="w-8 text-center font-mono">{posPrinterNumber}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPosPrinterNumber(Math.min(10, posPrinterNumber + 1))}
                          disabled={posPrinterNumber >= 10}
                        >
                          +
                        </Button>
                      </div>
                    </div>
                    
                    {/* Botão Testar */}
                    <Button
                      variant="outline"
                      onClick={handleTestPosPrinter}
                      disabled={isTestingPosPrinter || !posPrinterLinkcode.trim()}
                      className="w-full"
                    >
                      {isTestingPosPrinter ? (
                        <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Testando...</>
                      ) : (
                        <><Printer className="h-4 w-4 mr-2" /> Testar Conexão</>
                      )}
                    </Button>
                    
                    {/* Resultado do Teste */}
                    {posPrinterTestResult && (
                      <div className={`p-3 rounded-lg text-sm ${
                        posPrinterTestResult.success 
                          ? 'bg-green-500/10 text-green-600 border border-green-500/20' 
                          : 'bg-red-500/10 text-red-600 border border-red-500/20'
                      }`}>
                        {posPrinterTestResult.success ? (
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4" />
                            {posPrinterTestResult.message}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <XCircle className="h-4 w-4" />
                            {posPrinterTestResult.message}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Impressão Direta via Rede Local */}
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium flex items-center gap-2">
                      <Wifi className="h-4 w-4 text-green-500" />
                      Impressão Direta via Rede
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Imprime automaticamente direto na impressora via rede local (recomendado)
                    </p>
                  </div>
                  <Switch
                    checked={directPrintEnabled}
                    onCheckedChange={setDirectPrintEnabled}
                  />
                </div>
                
                {directPrintEnabled && (
                  <div className="space-y-4 mt-4 pl-4 border-l-2 border-green-500/30">
                    {/* Instruções */}
                    <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                      <p className="text-sm font-medium">Como funciona:</p>
                      <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                        <li>Sua impressora térmica deve estar conectada na mesma rede Wi-Fi</li>
                        <li>Informe o IP da impressora (ex: 192.168.68.100)</li>
                        <li>A porta padrão é 9100 (não precisa alterar)</li>
                        <li>Quando chegar um pedido, ele será impresso automaticamente!</li>
                      </ol>
                    </div>
                    
                    {/* IP da Impressora */}
                    <div className="space-y-2">
                      <Label className="text-sm">IP da Impressora</Label>
                      <Input
                        value={directPrintIp}
                        onChange={(e) => setDirectPrintIp(e.target.value)}
                        placeholder="Ex: 192.168.68.100"
                        className="font-mono"
                      />
                      <p className="text-xs text-muted-foreground">
                        Encontre o IP nas configurações da impressora ou no app de configuração
                      </p>
                    </div>
                    
                    {/* Porta */}
                    <div className="space-y-2">
                      <Label className="text-sm">Porta</Label>
                      <Input
                        type="number"
                        value={directPrintPort}
                        onChange={(e) => setDirectPrintPort(parseInt(e.target.value) || 9100)}
                        placeholder="9100"
                        className="font-mono w-32"
                      />
                      <p className="text-xs text-muted-foreground">
                        Porta padrão: 9100 (não altere a menos que necessário)
                      </p>
                    </div>
                    
                    {/* Botão Testar */}
                    <Button
                      variant="outline"
                      onClick={handleTestDirectPrint}
                      disabled={isTestingDirectPrint || !directPrintIp.trim()}
                      className="w-full"
                    >
                      {isTestingDirectPrint ? (
                        <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Testando...</>
                      ) : (
                        <><Printer className="h-4 w-4 mr-2" /> Testar Impressão</>
                      )}
                    </Button>
                    
                    {/* Resultado do Teste */}
                    {directPrintTestResult && (
                      <div className={`p-3 rounded-lg text-sm ${
                        directPrintTestResult.success 
                          ? 'bg-green-500/10 text-green-600 border border-green-500/20' 
                          : 'bg-red-500/10 text-red-600 border border-red-500/20'
                      }`}>
                        {directPrintTestResult.success ? (
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4" />
                            {directPrintTestResult.message}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <XCircle className="h-4 w-4" />
                            {directPrintTestResult.message}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Botão Salvar Configurações */}
              <div className="flex justify-end pt-4 border-t">
                <Button
                  onClick={handleSavePrinterSettings}
                  disabled={savePrinterSettingsMutation.isPending}
                  className="rounded-xl shadow-sm"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {savePrinterSettingsMutation.isPending ? "Salvando..." : "Salvar Configurações"}
                </Button>
              </div>
            </div>
          </SectionCard>

          {/* Lista de Impressoras */}
          <SectionCard
            title="Impressoras Cadastradas"
            description="Gerencie suas impressoras térmicas"
            actions={
              <Button onClick={openAddPrinterModal} size="sm" className="rounded-xl">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Impressora
              </Button>
            }
          >
            <div className="space-y-3">
              {!printers || printers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Printer className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhuma impressora cadastrada</p>
                  <p className="text-sm">Clique em "Adicionar Impressora" para começar</p>
                </div>
              ) : (
                printers.map((printer) => (
                  <div
                    key={printer.id}
                    className="flex items-center justify-between p-4 bg-muted/30 rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "p-2 rounded-lg",
                        printer.isActive ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"
                      )}>
                        <Printer className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{printer.name}</span>
                          {printer.isDefault && (
                            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Star className="h-3 w-3" />
                              Padrão
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {printer.ipAddress}:{printer.port}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditPrinterModal(printer)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeletePrinter(printer)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </SectionCard>

          {/* Informações sobre Impressão */}
          <SectionCard
            title="Como funciona a impressão"
            description="Entenda como configurar sua impressora térmica"
          >
            <div className="space-y-4 text-sm text-muted-foreground">
              <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                <Info className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-blue-700 mb-1">Requisitos</p>
                  <p className="text-blue-600">
                    Para impressão automática funcionar, você precisa de uma impressora térmica 
                    conectada à mesma rede Wi-Fi e um aplicativo de impressão rodando no computador 
                    ou dispositivo que receberá os pedidos.
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <p><strong>Impressoras compatíveis:</strong> Epson TM-T20, Elgin i9, Bematech MP-4200, e outras com suporte ESC/POS.</p>
                <p><strong>Porta padrão:</strong> A maioria das impressoras térmicas usa a porta 9100 para comunicação de rede.</p>
              </div>
            </div>
          </SectionCard>
        </TabsContent>

        
        {/* WhatsApp Tab */}
        <TabsContent value="whatsapp" className="space-y-5">
          <WhatsAppTab hideConnectionCard />
        </TabsContent>
        
        {/* Teste Impressão Tab */}
        <TabsContent value="teste-impressao" className="space-y-5">
          <PrintTestTab establishmentId={establishment?.id || 0} />
        </TabsContent>
      </Tabs>

      {/* Modal de Adicionar/Editar Impressora */}
      <Dialog open={isPrinterModalOpen} onOpenChange={setIsPrinterModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingPrinter ? "Editar Impressora" : "Adicionar Impressora"}
            </DialogTitle>
            <DialogDescription>
              {editingPrinter
                ? "Atualize as informações da impressora"
                : "Cadastre uma nova impressora térmica"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="printerName">Nome da Impressora</Label>
              <Input
                id="printerName"
                value={printerName}
                onChange={(e) => setPrinterName(e.target.value)}
                placeholder="Ex: Cozinha, Caixa, Bar"
              />
            </div>

            <div className="space-y-2">
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
              <p className="text-xs text-muted-foreground">
                A porta padrão para impressoras ESC/POS é 9100
              </p>
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

            {/* Botão de Teste de Conexão */}
            <div className="pt-2 border-t">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleTestConnection}
                disabled={isTestingConnection || !printerIpAddress.trim()}
              >
                {isTestingConnection ? (
                  <>
                    <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Testando conexão...
                  </>
                ) : (
                  <>
                    <Wifi className="h-4 w-4 mr-2" />
                    Testar Conexão
                  </>
                )}
              </Button>
              
              {/* Resultado do Teste */}
              {testConnectionResult && (
                <div className={`mt-3 p-3 rounded-lg text-sm ${
                  testConnectionResult.success 
                    ? 'bg-green-50 text-green-700 border border-green-200' 
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  <div className="flex items-start gap-2">
                    {testConnectionResult.success ? (
                      <Wifi className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    ) : (
                      <WifiOff className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    )}
                    <span>{testConnectionResult.message}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPrinterModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSavePrinter}
              disabled={createPrinterMutation.isPending || updatePrinterMutation.isPending}
            >
              {createPrinterMutation.isPending || updatePrinterMutation.isPending
                ? "Salvando..."
                : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Exclusão de Impressora */}
      <AlertDialog open={printerDeleteConfirmOpen} onOpenChange={setPrinterDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Impressora</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover a impressora "{printerToDelete?.name}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeletePrinter}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
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
        minWidth={cropType === "cover" ? 1200 : undefined}
      />
    </AdminLayout>
  );
}
