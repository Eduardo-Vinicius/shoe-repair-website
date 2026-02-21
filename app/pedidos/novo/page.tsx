"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Loader2, CheckCircle, Search, Upload, X, Plus, Minus } from "lucide-react"
import Link from "next/link"
import { createPedidoService, getClientesService, getStatusColumnsService, getPedidoIdFromCreateResponse, uploadPedidoFotosService } from "@/lib/apiService"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

// Serviços disponíveis com preços sugeridos
const availableServices = [
  { id: "limpeza-simples", name: "Limpeza Simples", suggestedPrice: 30 },
  { id: "limpeza-completa", name: "Limpeza Completa", suggestedPrice: 50 },
  { id: "restauracao", name: "Restauração", suggestedPrice: 80 },
  { id: "reparo", name: "Reparo", suggestedPrice: 40 },
  { id: "customizacao", name: "Customização", suggestedPrice: 120 },
  { id: "pintura", name: "Pintura", suggestedPrice: 60 },
  { id: "troca-sola", name: "Troca de Sola", suggestedPrice: 70 },
  { id: "costura", name: "Costura", suggestedPrice: 35 },
];

// Acessórios disponíveis (vindos do env ou padrão)
const defaultAccessories = [
  "Cadarços originais",
  "Palmilhas",
  "Sola extra",
  "Etiquetas de marca",
  "Caixa original",
  "Sacola de proteção",
  "Manual de cuidados",
  "Certificado de garantia"
];

interface StatusColumn {
  [columnName: string]: any[];
}

// Departamentos disponíveis
const departments = [
  { value: "atendimento", label: "Atendimento" },
  { value: "sapataria", label: "Sapataria" },
  { value: "costura", label: "Costura" },
  { value: "lavagem", label: "Lavagem" },
  { value: "acabamento", label: "Acabamento" },
  { value: "pintura", label: "Pintura" },
];

// Interface para serviços selecionados
interface SelectedService {
  id: string;
  name: string;
  price: number;
  description: string;
}

import { useEffect } from "react"

export default function NewOrderPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    clientId: "",
    sneaker: "",
    expectedDate: "",
    department: "atendimento", // Departamento de destino
    observations: "",
  })
  const [prioridade, setPrioridade] = useState<string>("2")
  const [selectedServices, setSelectedServices] = useState<SelectedService[]>([])
  const [totalPrice, setTotalPrice] = useState(0)
  const [signalType, setSignalType] = useState("50") // "50", "100", "custom"
  const [signalValue, setSignalValue] = useState(0)
  const [hasWarranty, setHasWarranty] = useState(false)
  const [warrantyPrice, setWarrantyPrice] = useState(0) // Preço padrão da garantia
  const [selectedAccessories, setSelectedAccessories] = useState<string[]>([])
  const [customAccessory, setCustomAccessory] = useState("")
  const [clientSearch, setClientSearch] = useState("")
  const [clients, setClients] = useState<any[]>([]);
  const [statusColumns, setStatusColumns] = useState<StatusColumn>({});
  const [loadingClients, setLoadingClients] = useState(true);

  useEffect(() => {
    async function fetchdata() {
      try {
        const [columnsData, clientsData] = await Promise.all([
          getStatusColumnsService(),
          getClientesService()
        ]);

        setStatusColumns(columnsData);
        setClients(clientsData);
      } catch (err) {
        // erro ao buscar clientes
      } finally {
        setLoadingClients(false);
      }
    }
    fetchdata();
  }, []);

  // Fotos do tênis (armazenamos também a preview para poder revogar URLs e evitar leaks)
  const MAX_PHOTOS = parseInt(process.env.NEXT_PUBLIC_MAX_PHOTOS || "8", 10) || 8;
  const MAX_FILE_MB = 5; // limite por arquivo antes da compressão
  type PhotoItem = { file: File; preview: string; uploadedUrl?: string };
  const [photos, setPhotos] = useState<PhotoItem[]>([])

  // Manipuladores de upload/remover foto
  // Faz resize/compress antes de adicionar ao estado para reduzir uso de memória
  const MAX_DIMENSION = 1280; // px
  const JPEG_QUALITY = 0.75;

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const filesArray = Array.from(e.target.files);

    const slotsLeft = Math.max(0, MAX_PHOTOS - photos.length);
    const toProcess = filesArray.slice(0, slotsLeft);

    const processed: PhotoItem[] = [];

    for (const f of toProcess) {
      // skip huge files (even though we'll try to compress)
      if (f.size > MAX_FILE_MB * 1024 * 1024 * 10) {
        // very big file (safety) -> skip
        continue;
      }

      try {
        // try createImageBitmap for efficient decode
        const bitmap = await createImageBitmap(f as Blob);
        const maxSide = Math.max(bitmap.width, bitmap.height);
        const scale = maxSide > MAX_DIMENSION ? MAX_DIMENSION / maxSide : 1;
        const w = Math.round(bitmap.width * scale);
        const h = Math.round(bitmap.height * scale);

        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          bitmap.close?.();
          continue;
        }
        ctx.drawImage(bitmap, 0, 0, w, h);
        bitmap.close?.();

        const blob: Blob | null = await new Promise((resolve) =>
          canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY)
        );

        if (!blob) continue;

        const newFile = new File([blob], f.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" });
        const preview = URL.createObjectURL(blob);
        processed.push({ file: newFile, preview });
      } catch (err) {
        // fallback: use original file but still create preview URL
        const preview = URL.createObjectURL(f);
        processed.push({ file: f, preview });
      }
    }

    if (processed.length === 0) {
      // clear input so user can re-select same files if needed
      e.currentTarget.value = "";
      return;
    }

    setPhotos((prev) => {
      const merged = [...prev, ...processed].slice(0, MAX_PHOTOS);
      return merged;
    });

    // limpa input para permitir re-seleção do mesmo arquivo
    e.currentTarget.value = "";
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => {
      const item = prev[index];
      if (item?.preview) URL.revokeObjectURL(item.preview);
      return prev.filter((_, i) => i !== index);
    });
  };
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [uploadStatus, setUploadStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [uploadMessage, setUploadMessage] = useState("")

  const filteredClients = clients.filter(
    (client: any) =>
      (client.nomeCompleto?.toLowerCase() || "").includes(clientSearch.toLowerCase()) ||
      (client.cpf || "").includes(clientSearch)
  );

  const selectedClient = clients.find((client: any) => client.id === formData.clientId);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }))
    }
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }))
    }
  }

  // Funções para gerenciar serviços selecionados
  const toggleService = (serviceId: string, checked: boolean) => {
    if (checked) {
      const service = availableServices.find(s => s.id === serviceId);
      if (service && !selectedServices.find(s => s.id === serviceId)) {
        const newService = {
          id: service.id,
          name: service.name,
          price: service.suggestedPrice,
          description: ""
        };
        const newServices = [...selectedServices, newService];
        setSelectedServices(newServices);
        // Atualizar preço total automaticamente
        const servicesTotal = newServices.reduce((total, s) => total + s.price, 0);
        const newTotal = servicesTotal + (hasWarranty ? warrantyPrice : 0);
        setTotalPrice(newTotal);
        // Atualizar valor do sinal
        updateSignalValue(newTotal);
      }
    } else {
      const newServices = selectedServices.filter(s => s.id !== serviceId);
      setSelectedServices(newServices);
      // Atualizar preço total automaticamente
      const servicesTotal = newServices.reduce((total, s) => total + s.price, 0);
      const newTotal = servicesTotal + (hasWarranty ? warrantyPrice : 0);
      setTotalPrice(newTotal);
      // Atualizar valor do sinal
      updateSignalValue(newTotal);
    }
  };

  const updateService = (serviceId: string, field: 'price' | 'description', value: string | number) => {
    const newServices = selectedServices.map(service =>
      service.id === serviceId
        ? { ...service, [field]: value }
        : service
    );
    setSelectedServices(newServices);
    
    // Atualizar preço total automaticamente se for alteração de preço
    if (field === 'price') {
      const servicesTotal = newServices.reduce((total, s) => total + s.price, 0);
      const newTotal = servicesTotal + (hasWarranty ? warrantyPrice : 0);
      setTotalPrice(newTotal);
      // Atualizar valor do sinal
      updateSignalValue(newTotal);
    }
  };

  const getTotalPrice = () => {
    return totalPrice;
  };

  // Função para atualizar valor do sinal baseado no tipo
  const updateSignalValue = (total: number) => {
    if (signalType === "50") {
      setSignalValue(total * 0.5);
    } else if (signalType === "100") {
      setSignalValue(total);
    }
    // Para "custom", mantém o valor atual
  };

  // Handler para mudança de preço total
  const handleTotalPriceChange = (newTotal: number) => {
    setTotalPrice(newTotal);
    updateSignalValue(newTotal);
  };

  // Handler para mudança de tipo de sinal
  const handleSignalTypeChange = (type: string) => {
    setSignalType(type);
    if (type === "50") {
      setSignalValue(totalPrice * 0.5);
    } else if (type === "100") {
      setSignalValue(totalPrice);
    }
    // Para "custom", mantém o valor atual
  };

  // Função para toggle da garantia
  const toggleWarranty = (checked: boolean) => {
    setHasWarranty(checked);
    const servicesTotal = selectedServices.reduce((total, s) => total + s.price, 0);
    const newTotal = servicesTotal + (checked ? warrantyPrice : 0);
    setTotalPrice(newTotal);
    updateSignalValue(newTotal);
  };

  // Função para atualizar preço da garantia
  const handleWarrantyPriceChange = (newPrice: number) => {
    setWarrantyPrice(newPrice);
    if (hasWarranty) {
      const servicesTotal = selectedServices.reduce((total, s) => total + s.price, 0);
      const newTotal = servicesTotal + newPrice;
      setTotalPrice(newTotal);
      updateSignalValue(newTotal);
    }
  };

  // Função para toggle de acessório
  const toggleAccessory = (accessory: string, checked: boolean) => {
    if (checked) {
      setSelectedAccessories(prev => [...prev, accessory]);
    } else {
      setSelectedAccessories(prev => prev.filter(acc => acc !== accessory));
    }
  };

  // Função para adicionar acessório customizado
  const addCustomAccessory = () => {
    if (customAccessory.trim() && !selectedAccessories.includes(customAccessory.trim())) {
      setSelectedAccessories(prev => [...prev, customAccessory.trim()]);
      setCustomAccessory("");
    }
  };

  // Função para remover acessório
  const removeAccessory = (accessory: string) => {
    setSelectedAccessories(prev => prev.filter(acc => acc !== accessory));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.clientId) {
      newErrors.clientId = "Cliente é obrigatório"
    }

    if (!formData.sneaker.trim()) {
      newErrors.sneaker = "Modelo do tênis é obrigatório"
    }

    if (selectedServices.length === 0) {
      newErrors.services = "Pelo menos um serviço deve ser selecionado"
    }

    // Validar se todos os serviços têm preço válido
    const hasInvalidService = selectedServices.some(service =>
      service.price <= 0 || isNaN(service.price)
    );
    if (hasInvalidService) {
      newErrors.services = "Todos os serviços devem ter preços válidos"
    }

    if (!formData.expectedDate) {
      newErrors.expectedDate = "Data prevista é obrigatória"
    }

    if (!formData.department) {
      newErrors.department = "Departamento é obrigatório"
    }

    // Validar valor de sinal
    if (signalValue < 0 || signalValue > totalPrice) {
      newErrors.signal = "Valor de sinal deve estar entre R$ 0,00 e o valor total"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const getFirstStatusForSector = (sector: string): string | null => {
    const columnNames = Object.keys(statusColumns);

    // Padrões de identificação por setor (case-insensitive)
    const sectorPatterns: Record<string, string[]> = {
      atendimento: ['atendimento', 'Atendimento', 'ATENDIMENTO'],
      sapataria: ['sapataria', 'Sapataria', 'SAPATARIA'],
      costura: ['costura', 'Costura', 'COSTURA'],
      lavagem: ['lavagem', 'Lavagem', 'LAVAGEM'],
      pintura: ['pintura', 'Pintura', 'PINTURA'],
      acabamento: ['acabamento', 'Acabamento', 'ACABAMENTO'],
    };

    const patterns = sectorPatterns[sector];
    if (!patterns) return null;

    // Prioriza colunas com indicação de primeiro passo (ex.: "A Fazer", "Recebido")
    const firstStepHints = ['a fazer', 'recebido', 'início', 'inicial'];

    // Busca primeiro por um nome de coluna que contenha o setor e um hint de primeiro passo
    const foundWithHint = columnNames.find((col) => {
      const lower = col.toLowerCase();
      const matchesSector = patterns.some((p) => lower.includes(p.toLowerCase()));
      const matchesHint = firstStepHints.some((h) => lower.includes(h));
      return matchesSector && matchesHint;
    });
    if (foundWithHint) return foundWithHint;

    // Senão, retorna a primeira coluna que contenha o setor
    const foundAny = columnNames.find((col) => {
      const lower = col.toLowerCase();
      return patterns.some((p) => lower.includes(p.toLowerCase()));
    });
    return foundAny || null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Validação explícita de máximo de 8 fotos
    if (photos.length > 8) {
      toast.error('Máximo de 8 fotos permitidas');
      return;
    }

    setIsLoading(true);
    setErrors({});
    setSuccess(false);
    setUploadStatus("idle");
    setUploadMessage("");
    let uploadInProgress = false;

    try {
      // Agregar informações dos serviços
      const servicosInfo = selectedServices.map(service => ({
        id: service.id,
        nome: service.name,
        preco: service.price,
        descricao: service.description
      }));

      // Preparar dados de garantia
      const garantiaData = {
        ativa: hasWarranty,
        preco: hasWarranty ? warrantyPrice : 0,
        duracao: hasWarranty ? "3 meses" : "",
        data: hasWarranty ? new Date().toISOString().split('T')[0] : "",
      };

      // Calcular valores de sinal e restante
      const valorRestante = Math.max(0, totalPrice - signalValue);

      // Observações apenas com o texto inserido pelo usuário
      const observacoesFinais = formData.observations || '';

      const createdPedidoResponse = await createPedidoService({
        clienteId: formData.clientId,
        clientName: selectedClient?.nomeCompleto || "",
        modeloTenis: formData.sneaker,
        servicos: servicosInfo,
        fotos: [],
        precoTotal: getTotalPrice(),
        valorSinal: signalValue,
        valorRestante: valorRestante,
        dataPrevistaEntrega: formData.expectedDate,
        departamento: formData.department,
        observacoes: observacoesFinais,
        prioridade: Number(prioridade),
        garantia: garantiaData,
        acessorios: selectedAccessories,
        status: getFirstStatusForSector(formData.department) || undefined,
      });

      if (photos.length > 0) {
        const pedidoId = getPedidoIdFromCreateResponse(createdPedidoResponse);
        if (!pedidoId) {
          throw new Error("Pedido criado, mas não foi possível identificar o ID para upload das fotos");
        }

        uploadInProgress = true;
        setUploadStatus("loading");
        setUploadMessage("Enviando fotos...");
        await uploadPedidoFotosService(pedidoId, photos.map((photo) => photo.file));
        uploadInProgress = false;
        setUploadStatus("success");
        setUploadMessage("Fotos enviadas com sucesso.");
      }

      setSuccess(true);
      setIsLoading(false);
      // revoke previews to free memory
      photos.forEach(p => { if (p.preview) URL.revokeObjectURL(p.preview); });
      setTimeout(() => {
        router.push("/dashboard");
      }, 1000);
    } catch (err: any) {
      setIsLoading(false);
      if (uploadInProgress) {
        setUploadStatus("error");
        setUploadMessage(err.message || "Erro ao enviar fotos");
      }
      setErrors({ api: err.message || "Erro ao criar pedido" });
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header Moderno */}
      <header className="bg-white shadow-lg border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-800 hover:bg-slate-100">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-slate-800 font-serif">Novo Pedido</h1>
                <p className="text-sm text-slate-600">Criar pedido de reforma</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {success && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">Pedido criado com sucesso!</AlertDescription>
          </Alert>
        )}

        <Card className="shadow-lg border-0 bg-white">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-slate-100">
            <CardTitle className="text-2xl text-slate-800">Criar Novo Pedido</CardTitle>
            <CardDescription className="text-slate-600">Preencha os dados do pedido de reforma de calçados</CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Client Selection */}
              <div className="space-y-2">
                <Label htmlFor="client">Cliente *</Label>
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar cliente por nome ou CPF..."
                      value={clientSearch}
                      onChange={(e) => setClientSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  {clientSearch && (
                    <div className="border rounded-md max-h-40 overflow-y-auto">
                      {filteredClients.map((client) => (
                        <div
                          key={client.id}
                          className={`p-3 cursor-pointer hover:bg-muted ${formData.clientId === client.id ? "bg-accent" : ""
                            }`}
                          onClick={() => {
                            handleSelectChange("clientId", client.id)
                            setClientSearch("")
                          }}
                        >
                          <p className="font-medium">{client.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Nome: {client.nomeCompleto} - cpf: {client.cpf}
                          </p>
                        </div>
                      ))}
                      {filteredClients.length === 0 && (
                        <div className="p-3 text-center text-muted-foreground">Nenhum cliente encontrado</div>
                      )}
                    </div>
                  )}
                  {selectedClient && (
                    <div className="p-3 bg-muted rounded-md">
                      <p className="font-medium">{selectedClient.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Nome: {selectedClient.nomeCompleto} - cpf: {selectedClient.cpf}
                      </p>
                    </div>
                  )}
                </div>
                {errors.clientId && <p className="text-sm text-destructive">{errors.clientId}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sneaker">Modelo do Tênis *</Label>
                  <Input
                    id="sneaker"
                    name="sneaker"
                    value={formData.sneaker}
                    onChange={handleInputChange}
                    placeholder="Ex: Nike Air Max 90"
                    className={errors.sneaker ? "border-destructive" : ""}
                  />
                  {errors.sneaker && <p className="text-sm text-destructive">{errors.sneaker}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="department">Departamento *</Label>
                  <Select
                    value={formData.department}
                    onValueChange={(value) => handleSelectChange("department", value)}
                  >
                    <SelectTrigger className={errors.department ? "border-destructive" : ""}>
                      <SelectValue placeholder="Selecione o departamento" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept.value} value={dept.value}>
                          {dept.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.department && <p className="text-sm text-destructive">{errors.department}</p>}
                </div>
              </div>

              {/* Prioridade */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="prioridade">Prioridade</Label>
                  <Select value={prioridade} onValueChange={(value) => setPrioridade(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar prioridade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Alta (I) - Urgente</SelectItem>
                      <SelectItem value="2">Média (II) - Normal</SelectItem>
                      <SelectItem value="3">Baixa (III) - Sem pressa</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-slate-500">Se não informado, assume Média (II).</p>
                </div>
              </div>


              {/* Seleção de Serviços */}
              <div className="space-y-4">
                <Label>Serviços *</Label>
                
                {/* Lista de Checkboxes para Serviços */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {availableServices.map((service) => {
                    const isSelected = selectedServices.find(s => s.id === service.id);
                    return (
                      <div key={service.id} className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                        <input
                          type="checkbox"
                          id={service.id}
                          checked={!!isSelected}
                          onChange={(e) => toggleService(service.id, e.target.checked)}
                          className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                        />
                        <label htmlFor={service.id} className="flex-1 cursor-pointer">
                          <div className="font-medium">{service.name}</div>
                          <div className="text-sm text-gray-500">R$ {service.suggestedPrice.toFixed(2)}</div>
                        </label>
                      </div>
                    );
                  })}
                </div>

                {/* Seção de Garantia */}
                <div className="border rounded-lg p-4 bg-blue-50">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="warranty"
                          checked={hasWarranty}
                          onChange={(e) => toggleWarranty(e.target.checked)}
                          className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                        />
                        <label htmlFor="warranty" className="font-medium cursor-pointer">
                          Adicionar Garantia de 3 meses
                        </label>
                      </div>
                      <div className="text-sm text-gray-600">
                        Proteção adicional para o serviço
                      </div>
                    </div>
                    {hasWarranty && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-blue-200">
                        <div className="space-y-2">
                          <Label htmlFor="warrantyPrice">Preço da Garantia (R$)</Label>
                          <Input
                            id="warrantyPrice"
                            type="number"
                            step="0.01"
                            min="0"
                            value={warrantyPrice}
                            onChange={(e) => handleWarrantyPriceChange(Number(e.target.value))}
                            placeholder="0.00"
                            className="bg-white"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm text-gray-600">Cobertura</Label>
                          <div className="p-2 bg-white rounded text-sm">
                            <p>✓ Retrabalho gratuito por defeitos</p>
                            <p>✓ Troca de peças com defeito</p>
                            <p>✓ Suporte técnico especializado</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Detalhes dos Serviços Selecionados */}
                {selectedServices.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium text-lg">Detalhes dos Serviços Selecionados:</h4>
                    {selectedServices.map((service) => (
                      <div key={service.id} className="border rounded-lg p-4 space-y-3 bg-gray-50">
                        <div className="flex justify-between items-center">
                          <h5 className="font-medium">{service.name}</h5>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => toggleService(service.id, false)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label>Preço (R$)</Label>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={service.price}
                              onChange={(e) => updateService(service.id, 'price', Number(e.target.value))}
                              placeholder="0.00"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Descrição/Observações</Label>
                            <Input
                              value={service.description}
                              onChange={(e) => updateService(service.id, 'description', e.target.value)}
                              placeholder="Detalhes específicos do serviço..."
                            />
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Preço Total Editável */}
                    <div className="border-t pt-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-2">
                          <Label htmlFor="totalPrice">Preço Total (R$) *</Label>
                          <Input
                            id="totalPrice"
                            type="number"
                            step="0.01"
                            min="0"
                            value={totalPrice}
                            onChange={(e) => handleTotalPriceChange(Number(e.target.value))}
                            placeholder="0.00"
                            className="w-32 text-lg font-semibold"
                          />
                        </div>
                        <div className="text-right text-sm text-gray-600">
                          <p>Soma dos serviços: R$ {selectedServices.reduce((total, service) => total + service.price, 0).toFixed(2)}</p>
                          {hasWarranty && <p>Garantia (3 meses): R$ {warrantyPrice.toFixed(2)}</p>}
                          <p className="font-semibold">Subtotal: R$ {(selectedServices.reduce((total, service) => total + service.price, 0) + (hasWarranty ? warrantyPrice : 0)).toFixed(2)}</p>
                          <p className="text-xs">(Você pode ajustar o valor total acima)</p>
                        </div>
                      </div>
                    </div>

                    {/* Valor de Sinal */}
                    <div className="border-t pt-4">
                      <div className="space-y-4">
                        <Label>Valor de Sinal</Label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {/* Opções de Porcentagem */}
                          <div className="space-y-3">
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="signal50"
                                name="signalType"
                                value="50"
                                checked={signalType === "50"}
                                onChange={(e) => handleSignalTypeChange(e.target.value)}
                                className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
                              />
                              <label htmlFor="signal50" className="text-sm font-medium cursor-pointer">
                                50% do total
                              </label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="signal100"
                                name="signalType"
                                value="100"
                                checked={signalType === "100"}
                                onChange={(e) => handleSignalTypeChange(e.target.value)}
                                className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
                              />
                              <label htmlFor="signal100" className="text-sm font-medium cursor-pointer">
                                100% do total (à vista)
                              </label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="signalCustom"
                                name="signalType"
                                value="custom"
                                checked={signalType === "custom"}
                                onChange={(e) => handleSignalTypeChange(e.target.value)}
                                className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
                              />
                              <label htmlFor="signalCustom" className="text-sm font-medium cursor-pointer">
                                Valor personalizado
                              </label>
                            </div>
                          </div>
                          {/* Valor do Sinal */}
                          <div className="space-y-2">
                            <Label htmlFor="signalValue">Valor do Sinal (R$)</Label>
                            <Input
                              id="signalValue"
                              type="number"
                              step="0.01"
                              min="0"
                              max={totalPrice}
                              value={signalValue}
                              onChange={(e) => setSignalValue(Number(e.target.value))}
                              placeholder="0.00"
                              disabled={signalType !== "custom"}
                              className={`text-lg font-semibold ${signalType !== "custom" ? "bg-gray-100" : ""}`}
                            />
                          </div>
                          {/* Valor Restante */}
                          <div className="space-y-2">
                            <Label className="text-sm text-gray-600">Valor Restante</Label>
                            <div className="p-3 bg-gray-50 rounded-lg text-center">
                              <p className="text-lg font-semibold text-gray-700">
                                R$ {Math.max(0, totalPrice - signalValue).toFixed(2)}
                              </p>
                              <p className="text-xs text-gray-500">
                                {signalValue >= totalPrice ? "Pago integralmente" : "A pagar na entrega"}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {errors.services && <p className="text-sm text-destructive">{errors.services}</p>}
                {errors.signal && <p className="text-sm text-destructive">{errors.signal}</p>}
              </div>

              {/* Acessórios */}
              <div className="space-y-4">
                <Label>Acessórios</Label>
                
                {/* Lista de Acessórios Padrão */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {defaultAccessories.map((accessory) => {
                    const isSelected = selectedAccessories.includes(accessory);
                    return (
                      <div key={accessory} className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                        <input
                          type="checkbox"
                          id={accessory}
                          checked={isSelected}
                          onChange={(e) => toggleAccessory(accessory, e.target.checked)}
                          className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                        />
                        <label htmlFor={accessory} className="flex-1 cursor-pointer text-sm">
                          {accessory}
                        </label>
                      </div>
                    );
                  })}
                </div>

                {/* Acessório Customizado */}
                <div className="border rounded-lg p-4 bg-gray-50">
                  <div className="space-y-3">
                    <Label className="font-medium">Adicionar Acessório Personalizado</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Ex: Fivela especial, Solado antiderrapante..."
                        value={customAccessory}
                        onChange={(e) => setCustomAccessory(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addCustomAccessory();
                          }
                        }}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        onClick={addCustomAccessory}
                        disabled={!customAccessory.trim()}
                        variant="outline"
                        size="sm"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Adicionar
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Acessórios Selecionados */}
                {selectedAccessories.length > 0 && (
                  <div className="space-y-3">
                    <Label className="font-medium text-lg">Acessórios Selecionados:</Label>
                    <div className="flex flex-wrap gap-2">
                      {selectedAccessories.map((accessory, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                        >
                          <span>{accessory}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeAccessory(accessory)}
                            className="h-4 w-4 p-0 hover:bg-blue-200"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Photo Upload */}
              <div className="space-y-4">
                <Label>Fotos do Tênis</Label>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    capture="environment"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    id="photo-upload"
                  />
                  <label htmlFor="photo-upload" className="cursor-pointer">
                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Clique para adicionar fotos (máximo 8 fotos, até 5MB cada)
                    </p>
                  </label>
                </div>

                {photos.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {photos.map((photo, index) => (
                      <div key={index} className="relative">
                        <img
                          src={photo.preview || "/placeholder.svg"}
                          alt={`Foto ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2 h-6 w-6 p-0"
                          onClick={() => removePhoto(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {(uploadStatus !== "idle" || uploadMessage) && (
                  <p className={`text-sm ${uploadStatus === "error" ? "text-red-600" : uploadStatus === "success" ? "text-green-600" : "text-slate-600"}`}>
                    {uploadStatus === "loading" ? "Fazendo upload das fotos..." : uploadMessage}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expectedDate">Data Prevista *</Label>
                  <Input
                    id="expectedDate"
                    name="expectedDate"
                    type="date"
                    value={formData.expectedDate}
                    onChange={handleInputChange}
                    className={errors.expectedDate ? "border-destructive" : ""}
                  />
                  {errors.expectedDate && <p className="text-sm text-destructive">{errors.expectedDate}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="observations">Observações Gerais</Label>
                  <Textarea
                    id="observations"
                    name="observations"
                    value={formData.observations}
                    onChange={handleInputChange}
                    placeholder="Observações adicionais sobre o pedido..."
                    rows={2}
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="submit" disabled={isLoading} className="flex-1">
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Criando Pedido...
                    </>
                  ) : (
                    "Criar Pedido"
                  )}
                </Button>
                <Link href="/pedidos">
                  <Button type="button" variant="outline">
                    Cancelar
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
