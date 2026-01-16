"use client"
import { useState, useEffect } from "react"
import { getOrdersService } from "@/lib/apiService"
import { Package, CheckCircle, Timer, TrendingUp, Clock } from "lucide-react"

export default function TvDashboardPage() {
  const [allOrders, setAllOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const token = localStorage.getItem("token")
        if (!token) {
          setError("Você precisa estar logado para acessar esta página")
          return
        }

        const data = await getOrdersService()
        if (!data || !Array.isArray(data)) {
          setError("Dados inválidos recebidos da API")
          return
        }

        setAllOrders(data)
      } catch (err: any) {
        console.error('Erro ao buscar pedidos:', err)
        setError(err.message || "Erro ao carregar dados")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
    const interval = setInterval(fetchData, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const totalOrders = allOrders.length
  const pendingStatuses = ["Atendimento - Recebido", "Atendimento - Orçado", "Atendimento - Aprovado"]
  const inProgressStatuses = ["Lavagem - A Fazer", "Lavagem - Em Andamento", "Lavagem - Concluído", "Pintura - A Fazer", "Pintura - Em Andamento", "Pintura - Concluído", "Atendimento - Finalizado"]
  const completedStatuses = ["Atendimento - Entregue"]
  const completedOrders = allOrders.filter(order => completedStatuses.includes(order.status)).length
  const inProgressOrders = allOrders.filter(order => inProgressStatuses.includes(order.status)).length
  const pendingOrders = allOrders.filter(order => pendingStatuses.includes(order.status)).length
  const completionRate = totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0
  const activePairs = totalOrders - completedOrders

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-20 w-20 border-b-4 border-blue-600 mx-auto mb-6"></div>
          <p className="text-2xl font-light text-slate-600">Carregando...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md">
          <p className="text-red-600 text-xl mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header Minimalista */}
      <header className="bg-slate-50 border-b border-slate-200 py-6">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold text-slate-800 tracking-tight">Worqera</h1>
              <p className="text-lg text-slate-600 mt-1">Cuidado e Qualidade em Tempo Real</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-500">Atualizado em</p>
              <p className="text-2xl font-mono text-slate-800">
                {new Date().toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* KPIs Principais - Números Grandes */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <div className="text-center">
            <div className="text-8xl font-black text-blue-600 mb-4">{totalOrders}</div>
            <p className="text-xl text-slate-600 font-medium">Pedidos Recebidos</p>
            <Package className="w-8 h-8 text-blue-400 mx-auto mt-3" />
          </div>

          <div className="text-center">
            <div className="text-8xl font-black text-green-600 mb-4">{completedOrders}</div>
            <p className="text-xl text-slate-600 font-medium">Concluídos</p>
            <CheckCircle className="w-8 h-8 text-green-400 mx-auto mt-3" />
          </div>

          <div className="text-center">
            <div className="text-8xl font-black text-orange-600 mb-4">{activePairs}</div>
            <p className="text-xl text-slate-600 font-medium">Pares na Loja</p>
            <Timer className="w-8 h-8 text-orange-400 mx-auto mt-3" />
          </div>

          <div className="text-center">
            <div className="text-8xl font-black text-purple-600 mb-4">{completionRate}%</div>
            <p className="text-xl text-slate-600 font-medium">Taxa de Sucesso</p>
            <TrendingUp className="w-8 h-8 text-purple-400 mx-auto mt-3" />
          </div>
        </div>

        {/* Fluxo Simplificado */}
        <div className="bg-slate-50 rounded-2xl p-8 mb-16">
          <h2 className="text-3xl font-bold text-slate-800 text-center mb-8">Fluxo de Produção</h2>
          <div className="flex justify-center items-center space-x-12">
            <div className="text-center">
              <div className="text-6xl font-bold text-yellow-600 mb-2">{pendingOrders}</div>
              <p className="text-lg text-slate-600">Aguardando</p>
            </div>
            <div className="text-4xl text-slate-400">→</div>
            <div className="text-center">
              <div className="text-6xl font-bold text-blue-600 mb-2">{inProgressOrders}</div>
              <p className="text-lg text-slate-600">Em Processo</p>
            </div>
            <div className="text-4xl text-slate-400">→</div>
            <div className="text-center">
              <div className="text-6xl font-bold text-green-600 mb-2">{completedOrders}</div>
              <p className="text-lg text-slate-600">Entregues</p>
            </div>
          </div>
        </div>

        {/* Mensagem de Valor */}
        <div className="text-center bg-gradient-to-r from-blue-50 to-green-50 rounded-2xl p-12">
          <h3 className="text-4xl font-bold text-slate-800 mb-6">Excelência em Cada Detalhe</h3>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Cada par recebe atenção especializada da nossa equipe dedicada.
            Qualidade superior, pontualidade garantida.
          </p>
          <div className="flex justify-center mt-8 space-x-16">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">100%</div>
              <p className="text-slate-600">Satisfação</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">24h</div>
              <p className="text-slate-600">Prazo Médio</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">5★</div>
              <p className="text-slate-600">Avaliação</p>
            </div>
          </div>
        </div>

        {/* Footer Minimal */}
        <div className="text-center mt-12 text-slate-400">
          <p className="text-sm">Sistema Atualizado Automaticamente • {new Date().toLocaleDateString('pt-BR')}</p>
        </div>
      </div>
    </div>
  )
}