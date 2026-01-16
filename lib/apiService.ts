import { log } from "node:console";

export interface ServicoPedido {
  preco: number;
  nome: string;
  id: string;
  descricao: string;
}

export interface StatusHistoryPedido {
  date: string;
  time: string;
  userName: string;
  userId: string;
  status: string;
}

export interface Pedido {
  observacoes: string;
  departamento: string;
  status: string;
  fotos: string[];
  createdAt: string;
  precoTotal: number;
  servicos: ServicoPedido[];
  statusHistory: StatusHistoryPedido[];
  dataCriacao: string;
  dataPrevistaEntrega: string;
  modeloTenis: string;
  updatedAt: string;
  id: string;
  clienteId: string;
}

// ...existing code...
// Busca cliente por ID
export async function getClienteByIdService(id: string) {
  const token = localStorage.getItem("token");
  const response = await fetch(`${API_BASE_URL}/clientes/${id}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
  });
  if (!response.ok) throw new Error("Erro ao buscar cliente");
  return response.json();
}

// Atualiza um cliente
export async function updateClienteService(id: string, cliente: Partial<{
  nomeCompleto: string;
  cpf: string;
  telefone: string;
  email: string;
  cep: string;
  logradouro: string;
  numero: string;
  bairro: string;
  cidade: string;
  estado: string;
  complemento: string;
  observacoes: string;
}>) {
  const token = localStorage.getItem("token");
  const response = await fetch(`${API_BASE_URL}/clientes/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify(cliente),
  });
  if (!response.ok) throw new Error("Erro ao atualizar cliente");
  return response.json();
}

// Busca pedido por ID
export async function getPedidoByIdService(id: string) {
  const token = localStorage.getItem("token");
  const response = await fetch(`${API_BASE_URL}/pedidos/${id}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
  });
  if (!response.ok) throw new Error("Erro ao buscar pedido");
  return response.json();
}
// lib/apiService.ts

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

// Cria um novo pedido
export async function createPedidoService(pedido: {
  clienteId: string;
  clientName: string;
  modeloTenis: string;
  servicos: Array<{
    id: string;
    nome: string;
    preco: number;
    descricao: string;
  }>;
  fotos: string[];
  precoTotal: number;
  valorSinal: number;
  valorRestante: number;
  dataPrevistaEntrega: string;
  departamento: string;  
  observacoes: string;
  garantia: {
    ativa: boolean;
    preco: number;
    duracao: string;
    data: string;
  };
  acessorios: string[];
  status?: string;
}) {
  const token = localStorage.getItem("token");
  const response = await fetch(`${API_BASE_URL}/pedidos`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify(pedido),
  });
  if (!response.ok) throw new Error("Erro ao criar pedido");
  return response.json();
}

// Cria um novo cliente
export async function createClienteService(cliente: {
  nomeCompleto: string;
  cpf: string;
  telefone: string;
  email: string;
  cep: string;
  logradouro: string;
  numero: string;
  bairro: string;
  cidade: string;
  estado: string;
  complemento?: string;
  observacoes?: string;
}) {
  const token = localStorage.getItem("token");
  const response = await fetch(`${API_BASE_URL}/clientes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify(cliente),
  });
  if (!response.ok) throw new Error("Erro ao criar cliente");
  return response.json();
}

// Busca lista de clientes
export async function getClientesService() {
  const token = localStorage.getItem("token")
  const response = await fetch(`${API_BASE_URL}/clientes`, {
    method: "GET",
    headers: { 
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
  })
  if (!response.ok) throw new Error("Email ou senha incorretos");
  const data = await response.json()
  return data
}

export async function loginService(email: string, password: string) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  })
  if (!response.ok) throw new Error("Email ou senha incorretos");
  const data = await response.json()
  // Salva no localStorage
  localStorage.setItem("token", data.token)
  // Salva no cookie (disponível para o middleware)
  document.cookie = `token=${data.token}; path=/; max-age=604800; secure; samesite=strict`;
  return data
}

// Busca as colunas de status baseadas no cargo do usuário
export async function getStatusColumnsService() {
  const token = localStorage.getItem("token");
  const response = await fetch(`${API_BASE_URL}/status/columns`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Erro ao buscar colunas de status");
  }
  
  const result = await response.json();
  return result.data; // Retorna apenas os dados das colunas
}

// Busca lista de pedidos
export async function getOrdersStatusService() {
  const token = localStorage.getItem("token");
  const response = await fetch(`${API_BASE_URL}/pedidos/kanban/status`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Erro ao buscar pedidos");
  }
  
  const result = await response.json();
  return result.data; // Retorna apenas o array de pedidos
}

export async function getOrdersService() {
  const token = localStorage.getItem("token");
  const response = await fetch(`${API_BASE_URL}/pedidos`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Erro ao buscar pedidos");
  }
  
  const result = await response.json();
  return result.data || result; // Retorna result.data se existir, senão result
}

// Atualiza o status de um pedido
export async function updateOrderStatusService(orderId: string, newStatus: string) {
  const token = localStorage.getItem("token");
  const response = await fetch(`${API_BASE_URL}/pedidos/${orderId}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify({ status: newStatus }),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Erro ao atualizar status do pedido");
  }
  
  const result = await response.json();
  return result.data; // Retorna o pedido atualizado
}

// Atualiza os dados completos de um pedido
export async function updateOrderService(orderId: string, orderData: {
  modeloTenis?: string;
  servicos?: string;
  descricaoServicos?: string;
  price?: number;
  status?: string;
  dataPrevistaEntrega?: string;
}) {
  const token = localStorage.getItem("token");
  const response = await fetch(`${API_BASE_URL}/pedidos/${orderId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify(orderData),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Erro ao atualizar pedido");
  }
  
  const result = await response.json();
  return result.data; // Retorna o pedido atualizado
}

export async function getDashboardService() {
  const token = localStorage.getItem("token");
  const response = await fetch(`${API_BASE_URL}/dashboard`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Erro ao buscar dados do dashboard");
  }
  
  const result = await response.json();
  return result; // Retorna o objeto completo, não result.data
}

export async function apiFetch(
  endpoint: string,
  options: RequestInit = {}
) {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  }
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  })
  if (!response.ok) throw new Error("Erro na requisição")
  return response.json()
}

// Gera PDF de um pedido
export async function generateOrderPDFService(pedidoId: string) {
  const token = localStorage.getItem("token");
  const response = await fetch(`${API_BASE_URL}/pedidos/document/pdf`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify({ pedidoId }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Erro ao gerar PDF do pedido");
  }

  // Retorna o blob do PDF para download
  return response.blob();
}

// Busca informações do usuário logado
export async function getUserInfoService() {
  const token = localStorage.getItem("token");
  if (!token) {
    throw new Error("Token não encontrado");
  }

  try {
    // Tenta decodificar o token JWT para obter informações básicas
    const payload = JSON.parse(atob(token.split('.')[1]));
    return {
      id: payload.id || payload.sub,
      email: payload.email,
      role: payload.role || payload.perfil || 'user',
      departamento: payload.departamento || payload.department,
      nome: payload.nome || payload.name,
      // Se não conseguir decodificar, tenta buscar da API
      ...payload
    };
  } catch (error) {
    // Se não conseguir decodificar o token, tenta buscar da API
    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Erro ao buscar informações do usuário");
      }

      const result = await response.json();
      return result.data || result;
    } catch (apiError) {
      // Se a API não tiver endpoint /auth/me, retorna informações básicas do token
      console.warn("Não foi possível obter informações completas do usuário:", apiError);
      return {
        id: '',
        email: '',
        role: 'user',
        departamento: null,
        nome: 'Usuário'
      };
    }
  }
}
