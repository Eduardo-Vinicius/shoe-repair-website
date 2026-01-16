"use client"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getOrdersService } from "@/lib/apiService"
import { Clock, AlertTriangle, TrendingUp, Package, CheckCircle, Calendar, Timer, Users, Star, ArrowRight } from "lucide-react"

// Interface para pedidos atrasados
interface OverdueOrder {
  id: string
  clienteNome: string
  modeloTenis: string
  dataPrevistaEntrega: string
  status: string
  diasAtraso: number
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case "iniciado":
      return (
        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-300">
          Iniciado
        </Badge>
      )
    case "em-processamento":
      return (
        <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-300">
          Em Processamento
        </Badge>
      )
    case "concluido":
      return (
        <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-300">
          Concluído
        </Badge>
      )
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

const getOverdueBadge = (diasAtraso: number) => {
  if (diasAtraso <= 1) {
    return <Badge className="bg-orange-100 text-orange-800 border-orange-300">Atraso Leve</Badge>
  } else if (diasAtraso <= 3) {
    return <Badge className="bg-red-100 text-red-800 border-red-300">Atraso Moderado</Badge>
  } else {
    return <Badge className="bg-red-600 text-white border-red-700">Atraso Grave</Badge>
  }
}

export default function TvDashboardPage() {
  const [overdueOrders, setOverdueOrders] = useState<OverdueOrder[]>([])
  const [allOrders, setAllOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)

        // Verificar se o token existe
        const token = localStorage.getItem("token")
        if (!token) {
          setError("Você precisa estar logado para acessar esta página")
          return
        }

        const data = await getOrdersService()

        // Verificar se data existe e é um array
        if (!data || !Array.isArray(data)) {
          console.error('Dados recebidos não são um array:', data)
          setError("Dados inválidos recebidos da API")
          return
        }

        setAllOrders(data)

        // Processar dados para calcular diasAtraso e filtrar atrasados
        const today = new Date()
        const processedData = data
          .map((order: any) => {
            const expectedDate = new Date(order.dataPrevistaEntrega)
            const diffTime = today.getTime() - expectedDate.getTime()
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
            return {
              id: order.id,
              clienteNome: order.cliente?.nomeCompleto || 'Cliente não encontrado',
              modeloTenis: order.modeloTenis,
              dataPrevistaEntrega: order.dataPrevistaEntrega,
              status: order.status,
              diasAtraso: diffDays > 0 ? diffDays : 0
            }
          })
          .filter((order: OverdueOrder) => order.diasAtraso > 0 && order.status !== 'concluido')
          .sort((a: OverdueOrder, b: OverdueOrder) => b.diasAtraso - a.diasAtraso) // Ordenar por maior atraso primeiro
        setOverdueOrders(processedData)
      } catch (err: any) {
        console.error('Erro ao buscar pedidos:', err)
        setError(err.message || "Erro ao carregar pedidos atrasados")
      } finally {
        setLoading(false)
      }
    }

    fetchData()

    // Atualizar a cada 5 minutos
    const interval = setInterval(fetchData, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  // Calcular estatísticas
  const totalOrders = allOrders.length
  const completedOrders = allOrders.filter(order => order.status === 'concluido').length
  const inProgressOrders = allOrders.filter(order => order.status === 'em-processamento').length
  const pendingOrders = allOrders.filter(order => order.status === 'iniciado').length
  const completionRate = totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-xl font-semibold text-slate-700">Carregando dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 text-xl mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Header com Logo */}
      <header className="bg-white shadow-lg border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-4">
              <img
                src="/placeholder-logo.svg"
                alt="Logo da Empresa"
                className="h-12 w-auto"
              />
              <div>
                <h1 className="text-3xl font-bold text-slate-800 font-serif">Sistema de Gestão de Calçados</h1>
                <p className="text-sm text-slate-600">Cuidado e Qualidade em Cada Par • Dashboard em Tempo Real</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-600">Última atualização</p>
              <p className="text-lg font-semibold text-slate-800">
                {new Date().toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit'
                })}
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-100">Total de Pedidos</CardTitle>
              <Package className="h-5 w-5 text-blue-200" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalOrders}</div>
              <p className="text-xs text-blue-200 mt-1">Pedidos registrados</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-100">Concluídos</CardTitle>
              <CheckCircle className="h-5 w-5 text-green-200" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{completedOrders}</div>
              <p className="text-xs text-green-200 mt-1">{completionRate}% de taxa de conclusão</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-orange-100">Em Andamento</CardTitle>
              <Timer className="h-5 w-5 text-orange-200" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{inProgressOrders}</div>
              <p className="text-xs text-orange-200 mt-1">Pedidos sendo processados</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-100">Pares na Loja</CardTitle>
              <Package className="h-5 w-5 text-purple-200" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalOrders - completedOrders}</div>
              <p className="text-xs text-purple-200 mt-1">Aguardando processamento</p>
            </CardContent>
          </Card>
        </div>

        {/* Fluxo de Pedidos */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-0 shadow-lg mb-8">
          <CardHeader>
            <CardTitle className="flex items-center text-2xl text-slate-800">
              <TrendingUp className="w-7 h-7 mr-3 text-blue-600" />
              Fluxo de Pedidos - Do Recebimento à Entrega
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col lg:flex-row items-center justify-between space-y-6 lg:space-y-0 lg:space-x-8">
              <div className="flex-1 text-center">
                <div className="bg-yellow-100 rounded-full p-6 inline-block mb-4">
                  <Package className="w-12 h-12 text-yellow-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">Recebidos</h3>
                <p className="text-4xl font-bold text-yellow-600">{totalOrders}</p>
                <p className="text-slate-600">pedidos registrados</p>
              </div>

              <ArrowRight className="w-8 h-8 text-slate-400 hidden lg:block" />

              <div className="flex-1 text-center">
                <div className="bg-blue-100 rounded-full p-6 inline-block mb-4">
                  <Timer className="w-12 h-12 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">Em Processamento</h3>
                <p className="text-4xl font-bold text-blue-600">{inProgressOrders}</p>
                <p className="text-slate-600">sendo trabalhados</p>
              </div>

              <ArrowRight className="w-8 h-8 text-slate-400 hidden lg:block" />

              <div className="flex-1 text-center">
                <div className="bg-green-100 rounded-full p-6 inline-block mb-4">
                  <CheckCircle className="w-12 h-12 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">Concluídos</h3>
                <p className="text-4xl font-bold text-green-600">{completedOrders}</p>
                <p className="text-slate-600">entregues com sucesso</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Gráfico de Status e Pedidos Atrasados */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Status Overview */}
          <Card className="bg-white shadow-lg border-0">
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <TrendingUp className="w-6 h-6 mr-2 text-blue-600" />
                Visão Geral dos Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center">
                    <CheckCircle className="w-8 h-8 text-green-600 mr-3" />
                    <div>
                      <p className="font-semibold text-green-800">Concluídos</p>
                      <p className="text-sm text-green-600">Pedidos finalizados</p>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-green-600">{completedOrders}</div>
                </div>

                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center">
                    <Timer className="w-8 h-8 text-blue-600 mr-3" />
                    <div>
                      <p className="font-semibold text-blue-800">Em Processamento</p>
                      <p className="text-sm text-blue-600">Sendo trabalhados</p>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-blue-600">{inProgressOrders}</div>
                </div>

                <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="flex items-center">
                    <Clock className="w-8 h-8 text-yellow-600 mr-3" />
                    <div>
                      <p className="font-semibold text-yellow-800">Pendentes</p>
                      <p className="text-sm text-yellow-600">Aguardando início</p>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-yellow-600">{pendingOrders}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Progress Bar */}
          <Card className="bg-white shadow-lg border-0">
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <Calendar className="w-6 h-6 mr-2 text-purple-600" />
                Taxa de Conclusão
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-5xl font-bold text-purple-600 mb-2">{completionRate}%</div>
                  <p className="text-slate-600">dos pedidos foram concluídos</p>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-4">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-purple-600 h-4 rounded-full transition-all duration-1000"
                    style={{ width: `${completionRate}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-sm text-slate-600">
                  <span>0%</span>
                  <span>100%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pares na Loja */}
        <Card className="bg-white shadow-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center text-2xl text-slate-800">
              <Package className="w-7 h-7 mr-3 text-blue-600" />
              Pares na Loja - Cuidado Personalizado
              <Badge className="ml-3 bg-blue-100 text-blue-800 border-blue-300">
                {totalOrders - completedOrders} pares
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {allOrders
                .filter(order => order.status !== 'concluido')
                .slice(0, 6)
                .map((order) => (
                  <div key={order.id} className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg text-slate-800 mb-1">{order.cliente?.nomeCompleto || 'Cliente'}</h3>
                        <p className="text-slate-600 text-sm mb-2">{order.modeloTenis}</p>
                        <div className="flex items-center text-sm text-slate-500 mb-3">
                          <Calendar className="w-4 h-4 mr-1" />
                          Previsão: {new Date(order.dataPrevistaEntrega).toLocaleDateString('pt-BR')}
                        </div>
                      </div>
                      {getStatusBadge(order.status)}
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-blue-600 font-medium">Em cuidado especializado</p>
                    </div>
                  </div>
                ))}
            </div>
            {(totalOrders - completedOrders) === 0 && (
              <div className="text-center py-12">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <p className="text-2xl text-slate-700 font-semibold">Todos os pares foram entregues! 🎉</p>
                <p className="text-slate-600 mt-2">Excelente trabalho da equipe</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Mensagem de Qualidade */}
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-0 shadow-lg">
          <CardContent className="pt-6">
            <div className="text-center">
              <Star className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-slate-800 mb-4">Compromisso com a Excelência</h3>
              <p className="text-lg text-slate-600 max-w-3xl mx-auto">
                Cada par de tênis recebe atenção individualizada, desde o diagnóstico até a entrega final.
                Nossa equipe dedicada garante que seu calçado volte como novo, com qualidade e pontualidade.
              </p>
              <div className="flex justify-center items-center mt-6 space-x-8">
                <div className="text-center">
                  <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <p className="font-semibold text-slate-800">Equipe Especializada</p>
                </div>
                <div className="text-center">
                  <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <p className="font-semibold text-slate-800">Qualidade Garantida</p>
                </div>
                <div className="text-center">
                  <Timer className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <p className="font-semibold text-slate-800">Entrega Pontual</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-slate-500">
          <p className="text-sm">Sistema de Gestão de Pedidos • Atualizado automaticamente a cada 5 minutos</p>
          <p className="text-xs mt-1">{new Date().toLocaleString('pt-BR')}</p>
        </div>
      </div>
    </div>
  )
}