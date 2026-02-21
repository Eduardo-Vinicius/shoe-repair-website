"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Clock,
  Play,
  Eye,
  Loader2,
  FileText,
  Search,
  Zap,
  Move,
  Users,
  Package,
  Settings,
  TrendingUp,
  AlertTriangle,
  ChevronRight,
  Filter
} from "lucide-react"
import Link from "next/link"
import { CardDetalhesPedido, PedidoDetalhes } from "@/components/CardDetalhesPedido"
import { getStatusColumnsService, getOrdersStatusService, updateOrderStatusService, generateOrderPDFService, getUserInfoService, downloadBlobAsFile } from "@/lib/apiService"
import { toast } from "sonner"
import { SETORES_CORES, SETORES_NOMES } from "@/lib/setores"

// Interface para as colunas de status
interface StatusColumn {
  [columnName: string]: any[];
}

// Interface para um pedido
interface Order {
  id: string;
  codigo?: string;
  funcionarioAtual?: string;
  clientName: string;
  clientId: string;
  clientCpf: string;
  sneaker: string;
  serviceType: string;
  servicos: string;
  description: string;
  observacoes: string;
  price: number;
  prioridade?: number;
  status: string;
  createdDate: string;
  expectedDate: string;
  statusHistory: Array<{
    status: string;
    date: string;
    time: string;
    userId?: string;
    userName?: string;
  }>;
  // Novos campos da API
  modeloTenis: string;
  tipoServico: string;
  descricaoServicos: string;
  preco: number;
  precoTotal: number;
  valorSinal: number;
  valorRestante: number;
  dataPrevistaEntrega: string;
  dataCriacao: string;
  fotos: string[];
  garantia: {
    ativa: boolean;
    preco: number;
    duracao: string;
    data?: string;
  };
  acessorios: string[];
  // Sistema de setores (novos campos)
  setorAtual?: string;
  setoresFluxo?: string[];
  setoresHistorico?: Array<{
    setorId: string;
    setorNome?: string;
    entradaEm: string;
    saidaEm?: string | null;
    funcionarioEntrada?: string;
    funcionarioSaida?: string | null;
  }>;
  // Quem criou o pedido
  createdBy?: {
    userId: string;
    userName: string;
    userEmail: string;
    userRole: string;
  };
}

interface UserInfo {
  id: string;
  email: string;
  role: string;
  departamento: string | null;
  nome: string;
}

const getStatusInfo = (status: string) => {
  // Map common status to their display info
  const statusMap: { [key: string]: any } = {
    "A Fazer": {
      label: "A Fazer",
      color: "bg-yellow-100 text-yellow-800 border-yellow-300",
      icon: Play,
      bgColor: "bg-yellow-50",
      gradient: "from-yellow-400 to-yellow-500"
    },
    "Em Andamento": {
      label: "Em Andamento",
      color: "bg-blue-100 text-blue-800 border-blue-300",
      icon: Clock,
      bgColor: "bg-blue-50",
      gradient: "from-blue-400 to-blue-500"
    },
    "Concluído": {
      label: "Concluído",
      color: "bg-green-100 text-green-800 border-green-300",
      icon: CheckCircle,
      bgColor: "bg-green-50",
      gradient: "from-green-400 to-green-500"
    },
    "iniciado": {
      label: "Iniciado",
      color: "bg-yellow-100 text-yellow-800 border-yellow-300",
      icon: Play,
      bgColor: "bg-yellow-50",
      gradient: "from-yellow-400 to-yellow-500"
    },
    "em-processamento": {
      label: "Em Processamento",
      color: "bg-blue-100 text-blue-800 border-blue-300",
      icon: Clock,
      bgColor: "bg-blue-50",
      gradient: "from-blue-400 to-blue-500"
    },
    "concluido": {
      label: "Concluído",
      color: "bg-green-100 text-green-800 border-green-300",
      icon: CheckCircle,
      bgColor: "bg-green-50",
      gradient: "from-green-400 to-green-500"
    }
  };

  return statusMap[status] || {
    label: status,
    color: "bg-gray-100 text-gray-800 border-gray-300",
    icon: Clock,
    bgColor: "bg-gray-50",
    gradient: "from-gray-400 to-gray-500"
  };
}

export default function StatusControlPage() {
  const formatServicos = (value: unknown): string => {
    if (!value) return "";
    if (typeof value === "string") return value;

    if (Array.isArray(value)) {
      return value
        .map((item) => {
          if (typeof item === "string") return item;
          if (item && typeof item === "object") {
            const obj = item as Record<string, unknown>;
            return String(obj.nome || obj.name || obj.descricao || obj.id || "").trim();
          }
          return "";
        })
        .filter(Boolean)
        .join(", ");
    }

    if (typeof value === "object") {
      const obj = value as Record<string, unknown>;
      return String(obj.nome || obj.name || obj.descricao || obj.id || "").trim();
    }

    return String(value);
  };

  const [statusColumns, setStatusColumns] = useState<StatusColumn>({});
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState("");
  const [draggedOrderId, setDraggedOrderId] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [selectedSector, setSelectedSector] = useState("next");
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [pendingOrderIds, setPendingOrderIds] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Dialog de movimento
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [moveOrderId, setMoveOrderId] = useState<string | null>(null);
  const [moveNewStatus, setMoveNewStatus] = useState<string | null>(null);
  const [movedByName, setMovedByName] = useState<string>("");
  const [movedByNote, setMovedByNote] = useState<string>("");

  // Carrega as colunas de status, pedidos e informações do usuário
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // Carrega dados em paralelo
        const [columnsData, ordersData, userData] = await Promise.all([
          getStatusColumnsService(),
          getOrdersStatusService(),
          getUserInfoService().catch(() => ({ 
            id: '', 
            email: '', 
            role: 'user', 
            departamento: null, 
            nome: 'Usuário' 
          })) // Fallback se não conseguir obter info do usuário
        ]);

        setStatusColumns(columnsData);
        setOrders(ordersData);
        setUserInfo(userData);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
        // Em caso de erro, mostra mensagem e mantém tela vazia
        setSuccessMessage("Erro ao carregar dados. Verifique sua conexão e tente novamente.");
        setStatusColumns({});
        setOrders([]);
        setUserInfo({ 
          id: '', 
          email: '', 
          role: 'user', 
          departamento: null, 
          nome: 'Usuário' 
        }); // Fallback completo
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const updateOrderStatus = async (orderId: string, newStatus: string, movedByName?: string, note?: string) => {
    if (pendingOrderIds.includes(orderId)) {
      toast.error("Este pedido já está sendo atualizado. Aguarde...");
      return;
    }

    const previousOrder = orders.find((order) => order.id === orderId) || null;
    const previousSelectedOrder = selectedOrder && selectedOrder.id === orderId ? selectedOrder : null;

    try {
      const nome = (movedByName || userInfo?.nome || "").trim();
      if (!nome) {
        toast.error("Informe o nome do funcionário.");
        return;
      }

      setPendingOrderIds((prev) => [...prev, orderId]);

      setOrders((prevOrders) =>
        prevOrders.map((order) => {
          if (order.id !== orderId) return order;
          return {
            ...order,
            status: newStatus,
            funcionarioAtual: nome || order.funcionarioAtual,
          };
        }),
      );

      setSelectedOrder((prevSelected) => {
        if (!prevSelected || prevSelected.id !== orderId) return prevSelected;
        return {
          ...prevSelected,
          status: newStatus,
          funcionarioAtual: nome || prevSelected.funcionarioAtual,
        };
      });

      // Atualiza no backend
      const updatedOrderRaw = await updateOrderStatusService(orderId, newStatus, nome, note);
      const updatedOrder = (updatedOrderRaw && typeof updatedOrderRaw === "object")
        ? updatedOrderRaw as Partial<Order>
        : {};

      // Atualiza localmente com os dados retornados do backend
      setOrders((prevOrders) =>
        prevOrders.map((order) => {
          if (order.id === orderId) {
            return {
              ...order,
              ...updatedOrder,
              status: updatedOrder.status || newStatus,
              statusHistory: updatedOrder.statusHistory || order.statusHistory || [],
              setoresHistorico: updatedOrder.setoresHistorico || order.setoresHistorico || [],
            };
          }
          return order;
        }),
      );

      setSelectedOrder((prevSelected) => {
        if (!prevSelected || prevSelected.id !== orderId) return prevSelected;

        return {
          ...prevSelected,
          ...updatedOrder,
          status: updatedOrder.status || newStatus,
          statusHistory: updatedOrder.statusHistory || prevSelected.statusHistory || [],
          setoresHistorico: updatedOrder.setoresHistorico || prevSelected.setoresHistorico || [],
        };
      });

      // Reconciliação final para garantir consistência entre colunas/campos derivados
      const refreshedOrders = await getOrdersStatusService();
      setOrders(refreshedOrders);
      setSelectedOrder((prevSelected) => {
        if (!prevSelected || prevSelected.id !== orderId) return prevSelected;
        const refreshed = refreshedOrders.find((order: Order) => order.id === orderId);
        return refreshed || prevSelected;
      });

      setSuccessMessage(`Pedido #${updatedOrder?.codigo || orderId} atualizado para ${getStatusInfo(newStatus).label}`);
      toast.success(`Movido por ${nome}`);
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error: any) {
      if (previousOrder) {
        setOrders((prevOrders) =>
          prevOrders.map((order) => (order.id === orderId ? previousOrder : order)),
        );
      }

      if (previousSelectedOrder) {
        setSelectedOrder(previousSelectedOrder);
      }

      console.error("Erro ao atualizar status:", error);

      // Mensagens de erro mais específicas
      let errorMessage = "Erro ao atualizar status do pedido";
      if (error.message?.toLowerCase().includes("status") && error.message?.toLowerCase().includes("invál")) {
        errorMessage = error.message;
      } else if (error.message?.toLowerCase().includes("status") && error.message?.includes("400")) {
        errorMessage = "Status inválido para este fluxo. O pedido foi mantido na coluna atual.";
      } else if (error.message?.toLowerCase().includes("status")) {
        errorMessage = `Status inválido: ${error.message}`;
      }
      if (error.message.includes("não tem permissão")) {
        errorMessage = "Você não tem permissão para alterar para este status";
      } else if (error.message.includes("não encontrado")) {
        errorMessage = "Pedido não encontrado";
      } else if (error.message.includes("Token")) {
        errorMessage = "Sessão expirada. Faça login novamente";
      }

      setSuccessMessage(errorMessage);
      setTimeout(() => setSuccessMessage(""), 5000);
    } finally {
      setPendingOrderIds((prev) => prev.filter((id) => id !== orderId));
    }
  };

  const handleDragStart = (orderId: string) => {
    setDraggedOrderId(orderId);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (status: string) => {
    if (draggedOrderId) {
      setMoveDialogOpen(true);
      setMoveOrderId(draggedOrderId);
      setMoveNewStatus(status);
      setMovedByName(userInfo?.nome || "");
      setMovedByNote("");
    }
  };
  const getResponsavelAtual = (order: Order): string | null => {
    if (order.funcionarioAtual?.trim()) {
      return order.funcionarioAtual.trim();
    }

    // Helper para ler diferentes chaves possíveis vindas do backend
    const readAny = (obj: any, keys: string[]): string | null => {
      for (const k of keys) {
        const v = obj?.[k];
        if (typeof v === 'string' && v.trim()) return v;
      }
      return null;
    };

    // Preferir funcionário do setor atual, se presente
    const hist = order.setoresHistorico || [];
    if (hist.length > 0) {
      const atual: any = hist[hist.length - 1] as any;
      const nome = readAny(atual, [
        'funcionarioEntrada',
        'funcionarioNome',
        'funcionario',
        'responsavelEntrada',
      ]);
      if (nome) return nome;
    }
    // Caso contrário, último usuário que moveu status
    const sh = order.statusHistory || [];
    if (sh.length > 0) {
      const last: any = sh[sh.length - 1] as any;
      const nome = readAny(last, [
        'userName',
        'funcionarioNome',
        'funcionario',
        'movedByName',
        'responsavel',
      ]);
      if (nome) return nome;
    }
    // Fallback: quem criou o pedido
    const createdByNome = readAny(order.createdBy as any, ['userName', 'nome', 'name']);
    if (createdByNome) return createdByNome;
    return null;
  };


  // Função para gerar PDF do pedido
  const generateOrderPDF = async (order: Order) => {
    try {
      setSuccessMessage("Gerando PDF do pedido...");

      // Chama o service do backend para gerar o PDF
      const pdfBlob = await generateOrderPDFService(order.id);
      downloadBlobAsFile(pdfBlob, `pedido-${order.id}.pdf`);

      setSuccessMessage(`PDF do pedido #${order.codigo || order.id} gerado com sucesso!`);
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error: any) {
      console.error("Erro ao gerar PDF:", error);

      // Mensagens de erro mais específicas
      let errorMessage = "Erro ao gerar PDF do pedido";
      if (error.message.includes("não encontrado")) {
        errorMessage = "Pedido não encontrado";
      } else if (error.message.includes("Token")) {
        errorMessage = "Sessão expirada. Faça login novamente";
      } else if (error.message.includes("permissão")) {
        errorMessage = "Você não tem permissão para gerar PDF deste pedido";
      }

      setSuccessMessage(errorMessage);
      setTimeout(() => setSuccessMessage(""), 5000);
    }
  };

  const handlePedidoUpdated = (updated: PedidoDetalhes) => {
    setSelectedOrder(updated as unknown as Order);
    setOrders((prev) => prev.map((order) => (order.id === updated.id ? { ...order, ...updated } : order)));
  };

  // Função para avançar pedido por número do pedido ou CPF do cliente
  const handleQuickAdvance = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;

    // Busca por número do pedido (id) ou código visível
    let foundOrder = orders.find(o => o.id === trimmed || (o.codigo && o.codigo === trimmed));
    // Se não achou, busca por CPF do cliente
    if (!foundOrder) {
      foundOrder = orders.find(o => o.clientCpf.replace(/\D/g, "") === trimmed.replace(/\D/g, ""));
    }

    if (foundOrder) {
      let nextStatus: string | null = null;
      let actionMessage = "";

      if (selectedSector === "next") {
        // Comportamento original: próximo status sequencial dentro das colunas que o usuário vê
        const columnNames = Object.keys(filteredStatusColumns);
        const currentIndex = columnNames.indexOf(foundOrder.status);
        const nextIndex = currentIndex + 1;

        if (nextIndex < columnNames.length) {
          nextStatus = columnNames[nextIndex];
          actionMessage = `avançado para ${getStatusInfo(nextStatus).label}`;
        }
      } else if (selectedSector === "prev") {
        // Status anterior dentro das colunas que o usuário vê
        const columnNames = Object.keys(filteredStatusColumns);
        const currentIndex = columnNames.indexOf(foundOrder.status);
        const prevIndex = currentIndex - 1;

        if (prevIndex >= 0) {
          nextStatus = columnNames[prevIndex];
          actionMessage = `voltado para ${getStatusInfo(nextStatus).label}`;
        }
      } else if (Object.keys(statusColumns).includes(selectedSector)) {
        // Mover diretamente para uma coluna específica (qualquer coluna do sistema)
        nextStatus = selectedSector;
        actionMessage = `movido para ${getStatusInfo(nextStatus).label}`;
      } else {
        // Mover para setor específico (fallback para compatibilidade)
        const targetStatus = getFirstStatusForSector(selectedSector);
        if (targetStatus) {
          nextStatus = targetStatus;
          actionMessage = `movido para ${getAvailableSectors().find(s => s.value === selectedSector)?.label || selectedSector}`;
        }
      }

      if (nextStatus) {
        // Abrir diálogo para capturar funcionário antes de mover
        setMoveDialogOpen(true);
        setMoveOrderId(foundOrder.id);
        setMoveNewStatus(nextStatus);
        setMovedByName(userInfo?.nome || "");
        setMovedByNote("");
      } else {
        if (selectedSector === "next") {
          setSuccessMessage(`Pedido #${foundOrder.codigo || foundOrder.id} já está no status final`);
        } else {
          setSuccessMessage(`Não foi possível mover para o setor ${selectedSector}`);
        }
      }
      setTimeout(() => setSuccessMessage(""), 3000);
    } else {
      setSuccessMessage("Pedido ou cliente não encontrado");
      setTimeout(() => setSuccessMessage(""), 3000);
    }
    setInputValue("");
    inputRef.current?.focus();
  };

  // Função para obter o primeiro status de um setor específico
  const getFirstStatusForSector = (sector: string): string | null => {
    const columnNames = Object.keys(statusColumns);

    // Mapeamento mais robusto de setores para padrões de coluna
    const sectorPatterns = {
      atendimento: ['atendimento', 'Atendimento', 'ATENDIMENTO'],
      sapataria: ['sapataria', 'Sapataria', 'SAPATARIA'],
      costura: ['costura', 'Costura', 'COSTURA'],
      lavagem: ['lavagem', 'Lavagem', 'LAVAGEM'],
      pintura: ['pintura', 'Pintura', 'PINTURA'],
      montagem: ['montagem', 'Montagem', 'MONTAGEM'],
      acabamento: ['acabamento', 'Acabamento', 'ACABAMENTO']
    };

    const patterns = sectorPatterns[sector as keyof typeof sectorPatterns];
    if (!patterns) return null;

    // Procura por qualquer coluna que contenha qualquer um dos padrões
    for (const pattern of patterns) {
      const found = columnNames.find(col =>
        col.toLowerCase().includes(pattern.toLowerCase())
      );
      if (found) return found;
    }

    return null;
  };

  // Função para obter setores disponíveis baseado nas colunas (todos os setores, independente das permissões)
  const getAvailableSectors = () => {
    const columnNames = Object.keys(statusColumns);
    const sectors: { value: string; label: string }[] = [];

    // Mapeamento de setores e seus padrões
    const sectorDefinitions = [
      { value: "atendimento", label: "Atendimento", patterns: ['atendimento', 'Atendimento', 'ATENDIMENTO'] },
      { value: "sapataria", label: "Sapataria", patterns: ['sapataria', 'Sapataria', 'SAPATARIA'] },
      { value: "costura", label: "Costura", patterns: ['costura', 'Costura', 'COSTURA'] },
      { value: "lavagem", label: "Lavagem", patterns: ['lavagem', 'Lavagem', 'LAVAGEM'] },
      { value: "pintura", label: "Pintura", patterns: ['pintura', 'Pintura', 'PINTURA'] },
      { value: "montagem", label: "Montagem", patterns: ['montagem', 'Montagem', 'MONTAGEM'] },
      { value: "acabamento", label: "Acabamento", patterns: ['acabamento', 'Acabamento', 'ACABAMENTO'] }
    ];

    sectorDefinitions.forEach(sector => {
      const hasSector = sector.patterns.some(pattern =>
        columnNames.some(col => col.toLowerCase().includes(pattern.toLowerCase()))
      );
      if (hasSector) {
        sectors.push({ value: sector.value, label: sector.label });
      }
    });

    return sectors;
  };

  // Exibir todas as colunas para todos os usuários
  const filteredStatusColumns = useMemo(() => statusColumns, [statusColumns]);

  // Organiza os pedidos por status baseado nas colunas filtradas
  const ordersByStatus = useMemo(() => {
    const grouped: { [key: string]: Order[] } = {};

    Object.keys(filteredStatusColumns).forEach((columnName) => {
      grouped[columnName] = [];
    });

    for (const order of orders) {
      if (!grouped[order.status]) {
        grouped[order.status] = [];
      }
      grouped[order.status].push(order);
    }

    return grouped;
  }, [filteredStatusColumns, orders]);

  const getNextStatus = (currentStatus: string) => {
    const columnNames = Object.keys(filteredStatusColumns);
    const currentIndex = columnNames.indexOf(currentStatus);
    return currentIndex >= 0 && currentIndex < columnNames.length - 1
      ? columnNames[currentIndex + 1]
      : null;
  };

  const getPreviousStatus = (currentStatus: string) => {
    const columnNames = Object.keys(filteredStatusColumns);
    const currentIndex = columnNames.indexOf(currentStatus);
    return currentIndex > 0 ? columnNames[currentIndex - 1] : null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-xl font-semibold text-slate-700">Carregando controle de status...</p>
        </div>
      </div>
    );
  }

  // Verificar se não há dados (possível erro de API ou usuário sem permissões)
  const hasData = Object.keys(filteredStatusColumns).length > 0;
  const hasOrders = orders.length > 0;

  if (!hasData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        {/* Header Moderno */}
        <header className="bg-white shadow-lg border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-20">
              <div className="flex items-center space-x-6">
                <img
                  src="/worqera_icon.png"
                  alt="Worqera"
                  className="h-12 w-auto"
                />
                <div>
                  <h1 className="text-2xl font-bold text-slate-800 font-serif">Controle de Status</h1>
                  <p className="text-sm text-slate-600">Gestão de pedidos</p>
                </div>
              </div>
              <Link href="/dashboard">
                <Button variant="outline" className="border-slate-300 text-slate-700 hover:bg-slate-50">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar ao Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Alert className="mb-6 border-yellow-200 bg-yellow-50">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              Não foi possível carregar as colunas de status. Verifique sua conexão e permissões.
            </AlertDescription>
          </Alert>

          <Card className="border-0 shadow-lg">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Settings className="w-20 h-20 text-slate-300 mb-6" />
              <h3 className="text-xl font-semibold text-slate-600 mb-2">
                Nenhuma coluna de status disponível
              </h3>
              <p className="text-slate-500 text-center max-w-md mb-6">
                Isso pode acontecer se você não tiver permissões adequadas ou se houver um problema na conexão.
              </p>
              <Button
                onClick={() => window.location.reload()}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Tentar Novamente
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header Minimalista */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <img src="/worqera_icon.png" alt="Worqera" className="w-8 h-8" />
              <div>
                <h1 className="text-xl font-semibold text-slate-800">Worqera • Controle de Status</h1>
                <p className="text-xs text-slate-500">
                  {userInfo ? (
                    userInfo.role === 'admin' ? 
                      'Administrador' : 
                      `${userInfo.role} • ${Object.keys(filteredStatusColumns).length} colunas`
                  ) : (
                    'Gestão de pedidos'
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="hidden sm:flex items-center space-x-4 text-sm">
                <div className="text-center">
                  <p className="text-slate-500">Total</p>
                  <p className="font-semibold text-slate-800">{orders.length}</p>
                </div>
                <div className="w-px h-8 bg-slate-200"></div>
                <div className="text-center">
                  <p className="text-slate-500">Ativos</p>
                  <p className="font-semibold text-blue-600">
                    {Object.values(ordersByStatus).reduce((sum, orders) => sum + orders.length, 0)}
                  </p>
                </div>
              </div>
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-800">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Ações Rápidas - Minimalista */}
        <Card className="mb-6 border border-slate-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Buscar pedido
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <Input
                    ref={inputRef}
                    type="text"
                    placeholder="Código do pedido ou CPF..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleQuickAdvance()}
                    className="pl-9 h-9 border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="sm:w-48">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Mover para
                </label>
                <Select value={selectedSector} onValueChange={setSelectedSector}>
                  <SelectTrigger className="h-9 border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                    <SelectValue placeholder="Selecionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="next">
                      <div className="flex items-center">
                        <ChevronRight className="w-4 h-4 mr-2" />
                        Próximo Status
                      </div>
                    </SelectItem>
                    <SelectItem value="prev">
                      <div className="flex items-center">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Status Anterior
                      </div>
                    </SelectItem>
                    <SelectItem value="divider1" disabled>
                      <hr className="my-1 border-slate-300" />
                    </SelectItem>

                    {/* Agrupar colunas por departamento */}
                    {(() => {
                      // Mostra todas as colunas disponíveis para mover
                      const columnsToShow = statusColumns;

                      const groupedColumns = Object.keys(columnsToShow).reduce((acc, columnName) => {
                        const lowerName = columnName.toLowerCase();
                        let department = 'Outros';

                        if (lowerName.includes('atendimento')) department = '🏢 Atendimento';
                        else if (lowerName.includes('sapataria')) department = '👞 Sapataria';
                        else if (lowerName.includes('costura')) department = '🪡 Costura';
                        else if (lowerName.includes('lavagem')) department = '🧼 Lavagem';
                        else if (lowerName.includes('pintura')) department = '🎨 Pintura';
                        else if (lowerName.includes('montagem')) department = '🔧 Montagem';
                        else if (lowerName.includes('acabamento')) department = '✨ Acabamento';

                        if (!acc[department]) acc[department] = [];
                        acc[department].push(columnName);
                        return acc;
                      }, {} as Record<string, string[]>);

                      return Object.entries(groupedColumns).map(([department, columns]) => (
                        <div key={department}>
                          <SelectItem value={`header-${department}`} disabled className="font-semibold text-slate-700 bg-slate-50">
                            {department}
                          </SelectItem>
                          {columns.map((columnName) => (
                            <SelectItem key={columnName} value={columnName} className="pl-6">
                              <div className="flex items-center">
                                <Move className="w-4 h-4 mr-2" />
                                {getStatusInfo(columnName).label}
                              </div>
                            </SelectItem>
                          ))}
                          <SelectItem value={`divider-${department}`} disabled>
                            <hr className="my-1 border-slate-200" />
                          </SelectItem>
                        </div>
                      ));
                    })()}
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleQuickAdvance}
                disabled={!inputValue.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white h-9 px-6 sm:mt-0 mt-2"
              >
                <Move className="w-4 h-4 mr-2" />
                Mover
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Mensagens de Status */}
        {successMessage && (
          <Alert className={`mb-6 ${
            successMessage.includes("Erro") || successMessage.includes("não")
              ? "border-red-200 bg-red-50"
              : "border-green-200 bg-green-50"
          }`}>
            {successMessage.includes("Erro") || successMessage.includes("não") ? (
              <AlertTriangle className="h-5 w-5 text-red-600" />
            ) : (
              <CheckCircle className="h-5 w-5 text-green-600" />
            )}
            <AlertDescription className={
              successMessage.includes("Erro") || successMessage.includes("não")
                ? "text-red-800"
                : "text-green-800"
            }>
              {successMessage}
            </AlertDescription>
          </Alert>
        )}

        {/* Kanban Board Moderno */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-800 flex items-center">
              <TrendingUp className="w-6 h-6 mr-3 text-slate-600" />
              Fluxo de Produção
            </h2>
            <div className="flex items-center space-x-4 text-sm text-slate-600">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                Arrastar pedidos entre colunas
              </div>
              <div className="flex items-center">
                <Eye className="w-4 h-4 mr-1" />
                {orders.length} pedidos ativos
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 overflow-x-auto pb-4">
            {Object.entries(filteredStatusColumns).map(([columnName, columnOrders]) => {
              const statusInfo = getStatusInfo(columnName);
              const StatusIcon = statusInfo.icon;
              const ordersInColumn = ordersByStatus[columnName] || [];

              return (
                <Card
                  key={columnName}
                  className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white"
                  onDragOver={handleDragOver}
                  onDrop={() => handleDrop(columnName)}
                >
                  <CardHeader className={`bg-gradient-to-r ${statusInfo.gradient} text-white rounded-t-lg`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <StatusIcon className="w-5 h-5" />
                        <CardTitle className="text-lg font-semibold">
                          {statusInfo.label}
                        </CardTitle>
                      </div>
                      <Badge className="bg-white/20 text-white border-white/30">
                        {ordersInColumn.length}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="p-4 min-h-96">
                    <div className="space-y-3">
                      {ordersInColumn.map((order) => (
                        <div
                          key={order.id}
                          draggable={!pendingOrderIds.includes(order.id)}
                          onDragStart={() => handleDragStart(order.id)}
                          className={`bg-slate-50 border border-slate-200 rounded-lg p-4 transition-all duration-200 group ${pendingOrderIds.includes(order.id) ? "opacity-60 cursor-wait" : "cursor-move hover:shadow-md hover:border-slate-300"}`}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-semibold text-slate-800">#{order.codigo || order.id}</h4>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 px-2 text-slate-600 hover:text-slate-800"
                                  disabled={pendingOrderIds.includes(order.id)}
                                  draggable={false}
                                  onMouseDown={(e) => { e.stopPropagation(); }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigator.clipboard.writeText(order.codigo || order.id);
                                    toast.success("Número do pedido copiado");
                                  }}
                                  title="Copiar número do pedido"
                                >
                                  Copiar
                                </Button>
                                {typeof order.prioridade === 'number' && (
                                  <span>
                                    {order.prioridade === 1 && (
                                      <Badge className="bg-red-500 text-white">I - Alta</Badge>
                                    )}
                                    {order.prioridade === 2 && (
                                      <Badge className="bg-yellow-500 text-white">II - Média</Badge>
                                    )}
                                    {order.prioridade === 3 && (
                                      <Badge className="bg-green-500 text-white">III - Baixa</Badge>
                                    )}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-slate-600">{order.clientName}</p>
                              <p className="text-sm text-slate-500">{order.modeloTenis}</p>
                              <div className="text-xs text-slate-500">
                                {new Date(order.dataCriacao).toLocaleDateString('pt-BR')}
                              </div>
                              <div className="text-xs">
                                <span className="text-slate-500">Funcionário atual: </span>
                                <span className="font-medium text-slate-700 break-all">{getResponsavelAtual(order) || '—'}</span>
                              </div>
                              {order.servicos && (
                                <div className="text-xs text-slate-600">
                                  Serviços: <span className="text-slate-700">{(() => {
                                    const texto = formatServicos(order.servicos || order.serviceType || "");
                                    return `${texto.slice(0, 80)}${texto.length > 80 ? '…' : ''}`;
                                  })()}</span>
                                </div>
                              )}
                              {order.setorAtual && (
                                <div className="flex items-center gap-2 mt-1">
                                  <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: SETORES_CORES[order.setorAtual] || '#ddd' }}
                                  />
                                  <span className="text-xs text-slate-600">
                                    {SETORES_NOMES[order.setorAtual] || order.setorAtual}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 hover:bg-slate-200"
                                disabled={pendingOrderIds.includes(order.id)}
                                draggable={false}
                                onMouseDown={(e) => { e.stopPropagation(); }}
                                onClick={() => {
                                  setSelectedOrder(order);
                                  setShowOrderDetails(true);
                                }}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 hover:bg-slate-200"
                                disabled={pendingOrderIds.includes(order.id)}
                                draggable={false}
                                onMouseDown={(e) => { e.stopPropagation(); }}
                                onClick={() => generateOrderPDF(order)}
                              >
                                <FileText className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          {pendingOrderIds.includes(order.id) && (
                            <div className="text-xs text-blue-600 mt-2">Atualizando status...</div>
                          )}
                          
                        </div>
                      ))}

                      {ordersInColumn.length === 0 && (
                        <div className="text-center py-8 text-slate-400">
                          <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">Nenhum pedido</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Modal de Detalhes do Pedido */}
        {selectedOrder && (
          <CardDetalhesPedido
            pedido={selectedOrder}
            open={showOrderDetails}
            onClose={() => setShowOrderDetails(false)}
            onPedidoUpdated={handlePedidoUpdated}
          />
        )}

        {/* Dialog para confirmar movimento e registrar funcionário */}
        <Dialog open={moveDialogOpen} onOpenChange={setMoveDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Registrar movimentação</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              {moveOrderId && moveNewStatus && (() => {
                const order = orders.find(o => o.id === moveOrderId);
                const currentLabel = getStatusInfo(order?.status || "").label;
                const newLabel = getStatusInfo(moveNewStatus).label;
                return (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded">
                    <p className="text-sm text-slate-700">
                      Pedido #{order?.codigo || moveOrderId}: {currentLabel || ""} → {newLabel}
                    </p>
                  </div>
                );
              })()}
              <div>
                <p className="text-sm text-slate-600">
                  Informe quem está movendo o pedido para o novo status.
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Funcionário</label>
                <Input
                  value={movedByName}
                  onChange={(e) => setMovedByName(e.target.value)}
                  placeholder="Nome do funcionário"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Observação (opcional)</label>
                <Input
                  value={movedByNote}
                  onChange={(e) => setMovedByNote(e.target.value)}
                  placeholder="Ex.: Motivo da mudança"
                />
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setMoveDialogOpen(false);
                  setMoveOrderId(null);
                  setMoveNewStatus(null);
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={async () => {
                  if (moveOrderId && moveNewStatus) {
                    const nome = movedByName.trim();
                    if (!nome) {
                      toast.error("Informe o nome do funcionário.");
                      return;
                    }
                    await updateOrderStatus(moveOrderId, moveNewStatus, nome, movedByNote);
                  }
                  setMoveDialogOpen(false);
                  setMoveOrderId(null);
                  setMoveNewStatus(null);
                  setDraggedOrderId(null);
                }}
              >
                Confirmar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Footer */}
        <div className="text-center mt-8 text-slate-500">
          <p className="text-sm">Worqera • Sistema de Controle de Status • Arrastar pedidos entre colunas para alterar status</p>
        </div>
      </div>
    </div>
  );
}