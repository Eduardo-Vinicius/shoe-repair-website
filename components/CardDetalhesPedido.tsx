import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { getClienteByIdService } from "@/lib/apiService";
import SetorProgress from "@/components/SetorProgress";
import MoverSetorButton from "@/components/MoverSetorButton";

export interface PedidoDetalhes {
  id: string;
  clientId: string;
  clientName: string;
  clientCpf: string;
  clientPhone?: string; // Adicionado telefone do cliente (opcional)
  sneaker: string;
  servicos: string;
  price: number;
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
  modeloTenis?: string;
  tipoServico?: string;
  descricaoServicos?: string;
  preco?: number;
  precoTotal?: number;
  valorSinal?: number;
  valorRestante?: number;
  dataPrevistaEntrega?: string;
  dataCriacao?: string;
  fotos?: string[];
  observacoes?: string;
  garantia?: {
    ativa: boolean;
    preco: number;
    duracao: string;
    data?: string;
  };
  acessorios?: string[];
  // Sistema de setores
  setoresFluxo?: string[];
  setorAtual?: string;
  setoresHistorico?: Array<{
    setorId: string;
    setorNome?: string;
    entradaEm: string;
    saidaEm?: string | null;
  }>;
  // Informações de criação
  createdBy?: {
    userId: string;
    userName: string;
    userEmail: string;
    userRole: string;
  };
  [key: string]: any; // Para permitir campos extras
}

interface Cliente {
  id: string;
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
}

export interface CardDetalhesPedidoProps {
  open: boolean;
  pedido: PedidoDetalhes | null;
  onClose: () => void;
}

export const CardDetalhesPedido: React.FC<CardDetalhesPedidoProps> = ({ open, onClose, pedido }) => {
  const router = useRouter();
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [loadingCliente, setLoadingCliente] = useState(false);
  const [errorCliente, setErrorCliente] = useState("");

  // Busca os dados do cliente quando o modal é aberto
  useEffect(() => {
    const fetchCliente = async () => {
      if (!open || !pedido?.clientId) return;

      try {
        setLoadingCliente(true);
        setErrorCliente("");
        console.log("Buscando dados do cliente para ID:", pedido.clientId);
        const clienteData = await getClienteByIdService(pedido.clientId);
        setCliente(clienteData);
      } catch (err: any) {
        console.error("Erro ao carregar cliente:", err);
        setErrorCliente(err.message || "Erro ao carregar dados do cliente");
        setCliente(null);
      } finally {
        setLoadingCliente(false);
      }
    };

    fetchCliente();
  }, [open, pedido?.clientId]);

  // Reset do estado quando o modal fecha
  useEffect(() => {
    if (!open) {
      setCliente(null);
      setErrorCliente("");
      setLoadingCliente(false);
    }
  }, [open]);

  if (!pedido) return null;
  return (
    <Dialog open={open} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Detalhes do Pedido #{pedido.id}</DialogTitle>
          <DialogDescription>
            {loadingCliente ? (
              "Carregando dados do cliente..."
            ) : errorCliente ? (
              <span className="text-red-500">Erro: {errorCliente}</span>
            ) : cliente ? (
              <>
                Cliente: <span className="font-semibold">{cliente.nomeCompleto}</span> ({cliente.cpf}
                {cliente.telefone ? ` • ${cliente.telefone}` : ""})
              </>
            ) : (
              <>
                Cliente: <span className="font-semibold">{pedido.clientName}</span> ({pedido.clientCpf}
                {pedido.clientPhone ? ` • ${pedido.clientPhone}` : ""})
              </>
            )}
          </DialogDescription>
          {/* Progresso dos Setores */}
          {pedido.setoresFluxo && pedido.setorAtual && pedido.setoresHistorico && (
            <div className="mt-3">
              <SetorProgress
                pedido={{
                  setoresFluxo: pedido.setoresFluxo,
                  setorAtual: pedido.setorAtual,
                  setoresHistorico: pedido.setoresHistorico,
                }}
              />
            </div>
          )}
        </DialogHeader>
        <div className="flex-1 overflow-y-auto space-y-2 py-2 pr-2">{/*Conteúdo com scroll*/}
          <div><strong>Tênis:</strong> {pedido.modeloTenis || pedido.sneaker}</div>
          <div><strong>Serviço:</strong> {pedido.servicos || pedido.tipoServico}</div>
          {pedido.descricaoServicos && (
            <div><strong>Descrição:</strong> {pedido.descricaoServicos}</div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div><strong>Valor Total:</strong> R$ {(pedido.precoTotal || pedido.price || 0).toFixed(2)}</div>
            {(pedido.valorSinal && pedido.valorSinal > 0) && (
              <div className="text-green-600"><strong>Sinal Pago:</strong> R$ {pedido.valorSinal.toFixed(2)}</div>
            )}
          </div>
          {(pedido.valorRestante && pedido.valorRestante > 0) && (
            <div className="text-orange-600"><strong>Valor Restante:</strong> R$ {pedido.valorRestante.toFixed(2)}</div>
          )}
          <div><strong>Status:</strong> {pedido.status}</div>
          <div><strong>Data de Criação:</strong> {pedido.dataCriacao || pedido.createdDate}</div>
          <div><strong>Previsão de Entrega:</strong> {pedido.dataPrevistaEntrega || pedido.expectedDate}</div>

          {/* Informações de criação */}
          {pedido.createdBy && (
            <div className="border-t pt-3 mt-4 bg-gray-50 p-3 rounded">
              <div className="text-sm font-medium text-gray-700 mb-2">Informações de Criação</div>
              <div className="space-y-1 text-sm">
                <div>
                  <span className="text-gray-500">Criado por:</span>{" "}
                  <span className="font-medium">{pedido.createdBy.userName}</span>
                </div>
                <div>
                  <span className="text-gray-500">Email:</span>{" "}
                  <span>{pedido.createdBy.userEmail}</span>
                </div>
                <div>
                  <span className="text-gray-500">Cargo:</span>{" "}
                  <span className="capitalize">{pedido.createdBy.userRole}</span>
                </div>
                <div>
                  <span className="text-gray-500">Data:</span>{" "}
                  <span>{new Date(pedido.dataCriacao || pedido.createdDate).toLocaleString('pt-BR')}</span>
                </div>
              </div>
            </div>
          )}
          
          {/* Garantia */}
          {pedido.garantia?.ativa && (
            <div className="border-t pt-3 mt-4 bg-blue-50 p-3 rounded">
              <div className="font-semibold mb-2 text-blue-800">Garantia Contratada:</div>
              <div className="text-sm space-y-1">
                <div><strong>Duração:</strong> {pedido.garantia.duracao}</div>
                <div><strong>Valor:</strong> R$ {pedido.garantia.preco.toFixed(2)}</div>
                {pedido.garantia.data && (
                  <div><strong>Válida até:</strong> {pedido.garantia.data}</div>
                )}
              </div>
            </div>
          )}
          
          {/* Acessórios */}
          {pedido.acessorios && pedido.acessorios.length > 0 && (
            <div className="border-t pt-3 mt-4">
              <div className="font-semibold mb-2">Acessórios Inclusos:</div>
              <div className="flex flex-wrap gap-1">
                {pedido.acessorios.map((acessorio, index) => (
                  <span key={index} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-sm">
                    {acessorio}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {/* Fotos */}
          {pedido.fotos && pedido.fotos.length > 0 && (
            <div className="border-t pt-3 mt-4">
              <div className="font-semibold mb-2">Fotos do Tênis:</div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {pedido.fotos.map((foto, index) => (
                  <img 
                    key={index}
                    src={foto} 
                    alt={`Foto ${index + 1}`}
                    className="w-full h-24 object-cover rounded border cursor-pointer hover:opacity-75"
                    onClick={() => window.open(foto, '_blank')}
                  />
                ))}
              </div>
            </div>
          )}
          
          {/* Observações do pedido */}
          {pedido.observacoes && (
            <div className="border-t pt-3 mt-4">
              <div><strong>Observações do Pedido:</strong></div>
              <div className="whitespace-pre-wrap text-sm mt-1 p-2 bg-gray-50 rounded border">
                {pedido.observacoes}
              </div>
            </div>
          )}
          
          {/* Dados completos do cliente */}
          {cliente && (
            <div className="border-t pt-3 mt-4">
              <div className="font-semibold mb-2">Dados do Cliente:</div>
              <div><strong>Nome:</strong> {cliente.nomeCompleto}</div>
              <div><strong>CPF:</strong> {cliente.cpf}</div>
              <div><strong>Telefone:</strong> {cliente.telefone}</div>
              <div><strong>Email:</strong> {cliente.email}</div>
              <div>
                <strong>Endereço:</strong> {cliente.logradouro}, {cliente.numero}
                {cliente.complemento && `, ${cliente.complemento}`}
                <br />
                {cliente.bairro}, {cliente.cidade} - {cliente.estado}
                <br />
                CEP: {cliente.cep}
              </div>
              {cliente.observacoes && (
                <div><strong>Observações do Cliente:</strong> {cliente.observacoes}</div>
              )}
            </div>
          )}
          
          <div>
            <strong>Histórico:</strong>
            <ul className="list-disc ml-5">
              {pedido.statusHistory.map((h, i) => (
                <li key={i}>{h.status} - {h.date} às {h.time}</li>
              ))}
            </ul>
          </div>
        </div>
        <div className="flex gap-2 mt-4 flex-shrink-0 border-t pt-4">{/*Botões fixos na parte inferior*/}
          <Button
            variant="secondary"
            className="flex-1"
            onClick={() => router.push(`/clientes/${pedido.clientId}`)}
            disabled={loadingCliente}
          >
            {loadingCliente ? "Carregando..." : "Ver Cliente"}
          </Button>
          {/* Botão para mover entre setores */}
          {pedido.id && (
            <MoverSetorButton
              pedidoId={pedido.id}
              onSuccess={() => {
                // sem ações adicionais aqui; componente pai pode recarregar dados
              }}
            />
          )}
          <DialogClose asChild>
            <Button variant="outline" className="flex-1">Fechar</Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
};
