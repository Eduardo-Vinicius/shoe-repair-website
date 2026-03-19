"use client"
import { useState, useEffect, useMemo } from "react"
import { getOrdersService } from "@/lib/apiService"
import { Package, CheckCircle, Timer, TrendingUp } from "lucide-react"

export default function TvDashboardPage() {
  const [allOrders, setAllOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const data = await getOrdersService()
        if (!data || !Array.isArray(data)) {
          setError("Dados inválidos recebidos da API")
          setAllOrders([])
          return
        }
        setAllOrders(data)
        setError("")
      } catch (err: any) {
        console.error('Erro ao buscar pedidos:', err)
        setError(err.message || "Erro ao carregar dados")
        setAllOrders([])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
    const interval = setInterval(fetchData, 30 * 1000)
    return () => clearInterval(interval)
  }, [])

  const totalOrders = allOrders.length
  const { pendingOrders, inProgressOrders, completedOrders, completionRate, activePairs } = useMemo(() => {
    const pendingStatuses = ["Atendimento - Recebido", "Atendimento - Orçado", "Atendimento - Aprovado"]
    const inProgressStatuses = ["Lavagem - A Fazer", "Lavagem - Em Andamento", "Lavagem - Concluído", "Pintura - A Fazer", "Pintura - Em Andamento", "Pintura - Concluído", "Atendimento - Finalizado"]
    const completedStatuses = ["Atendimento - Entregue"]
    const completed = allOrders.filter(order => completedStatuses.includes(order.status)).length
    const inProgress = allOrders.filter(order => inProgressStatuses.includes(order.status)).length
    const pending = allOrders.filter(order => pendingStatuses.includes(order.status)).length
    const completion = totalOrders > 0 ? Math.round((completed / totalOrders) * 100) : 0
    return { pendingOrders: pending, inProgressOrders: inProgress, completedOrders: completed, completionRate: completion, activePairs: totalOrders - completed }
  }, [allOrders, totalOrders])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-20 w-20 border-b-4 border-sky-400 mx-auto mb-6"></div>
          <p className="text-2xl font-light text-slate-200">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Header Minimalista */}
      <header className="bg-white/5 border-b border-white/10 backdrop-blur py-6">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold text-white tracking-tight">Worqera</h1>
              <p className="text-lg text-slate-200 mt-1">Cuidado e Qualidade em Tempo Real</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-300">Atualizado em</p>
              <p className="text-2xl font-mono text-white">
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
        {error && (
          <div className="mb-8 p-4 rounded-xl border border-amber-400/40 bg-amber-500/10 text-amber-100">
            <p className="font-semibold">Erro ao carregar pedidos</p>
            <p className="text-sm opacity-80">{error}</p>
          </div>
        )}

        {/* KPIs Principais - Números Grandes */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <div className="text-center rounded-2xl bg-white/5 border border-white/10 p-6 shadow-xl">
            <div className="text-7xl font-black text-sky-300 mb-2">{totalOrders}</div>
            <p className="text-lg text-slate-200 font-medium">Pedidos Recebidos</p>
            <Package className="w-8 h-8 text-sky-200 mx-auto mt-3" />
          </div>

          <div className="text-center rounded-2xl bg-white/5 border border-white/10 p-6 shadow-xl">
            <div className="text-7xl font-black text-emerald-300 mb-2">{completedOrders}</div>
            <p className="text-lg text-slate-200 font-medium">Concluídos</p>
            <CheckCircle className="w-8 h-8 text-emerald-200 mx-auto mt-3" />
          </div>

          <div className="text-center rounded-2xl bg-white/5 border border-white/10 p-6 shadow-xl">
            <div className="text-7xl font-black text-amber-300 mb-2">{activePairs}</div>
            <p className="text-lg text-slate-200 font-medium">Pares na Loja</p>
            <Timer className="w-8 h-8 text-amber-200 mx-auto mt-3" />
          </div>

          <div className="text-center rounded-2xl bg-white/5 border border-white/10 p-6 shadow-xl">
            <div className="text-7xl font-black text-indigo-300 mb-2">{completionRate}%</div>
            <p className="text-lg text-slate-200 font-medium">Taxa de Sucesso</p>
            <TrendingUp className="w-8 h-8 text-indigo-200 mx-auto mt-3" />
          </div>
        </div>

        {/* Fluxo Simplificado */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 mb-16 shadow-xl">
          <h2 className="text-3xl font-bold text-white text-center mb-8">Fluxo de Produção</h2>
          <div className="flex justify-center items-center space-x-12">
            <div className="text-center">
              <div className="text-6xl font-bold text-amber-300 mb-2">{pendingOrders}</div>
              <p className="text-lg text-slate-200">Aguardando</p>
            </div>
            <div className="text-4xl text-slate-300">→</div>
            <div className="text-center">
              <div className="text-6xl font-bold text-sky-300 mb-2">{inProgressOrders}</div>
              <p className="text-lg text-slate-200">Em Processo</p>
            </div>
            <div className="text-4xl text-slate-300">→</div>
            <div className="text-center">
              <div className="text-6xl font-bold text-emerald-300 mb-2">{completedOrders}</div>
              <p className="text-lg text-slate-200">Entregues</p>
            </div>
          </div>
        </div>

        {/* Mensagem de Valor */}
        <div className="text-center bg-gradient-to-r from-sky-900/60 via-slate-900/60 to-emerald-900/60 border border-white/10 rounded-2xl p-12 shadow-xl">
          <h3 className="text-4xl font-bold text-white mb-6">Excelência em Cada Detalhe</h3>
          <p className="text-xl text-slate-200 max-w-2xl mx-auto leading-relaxed">
            Cada par recebe atenção especializada da nossa equipe dedicada.
            Qualidade superior, pontualidade garantida.
          </p>
          <div className="flex justify-center mt-8 space-x-16">
            <div className="text-center">
              <div className="text-3xl font-bold text-sky-200">100%</div>
              <p className="text-slate-200">Satisfação</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-emerald-200">24h</div>
              <p className="text-slate-200">Prazo Médio</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-indigo-200">5★</div>
              <p className="text-slate-200">Avaliação</p>
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