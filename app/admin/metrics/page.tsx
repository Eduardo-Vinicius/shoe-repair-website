"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getMetricsAtrasosService, getMetricsDepartamentosService, getMetricsFuncionariosService, getMetricsResumoService } from "@/lib/apiService"
import { Loader2, RefreshCw, TrendingUp, BarChart3, Clock, Users, AlertTriangle, Award } from "lucide-react"

const formatPct = (value: number) => `${Math.round(value)}%`

const formatDays = (ms: number) => {
  const days = ms / (1000 * 60 * 60 * 24)
  if (days < 1) return `${Math.round(days * 24)} h`
  return `${days.toFixed(1)} d`
}

type Resumo = { total: number; abertos: number; finalizados: number; atrasados: number }
type Departamento = { setorId: string; setorNome?: string; total: number }
type FuncionarioMetrica = { funcionarioNome: string; total: number }
type AtrasoItem = { id: string; codigo?: string; status: string; funcionarioAtual?: string | null; dataPrevistaEntrega: string }
type Atrasos = { totalAtrasados: number; atrasoMedioMs: number; itens: AtrasoItem[] }

export default function AdminMetricsPage() {
  const [resumo, setResumo] = useState<Resumo | null>(null)
  const [departamentos, setDepartamentos] = useState<Departamento[]>([])
  const [funcionarios, setFuncionarios] = useState<FuncionarioMetrica[]>([])
  const [atrasos, setAtrasos] = useState<Atrasos | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string>("")

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      const [resumoData, depData, funcData, atrasoData] = await Promise.all([
        getMetricsResumoService(),
        getMetricsDepartamentosService(),
        getMetricsFuncionariosService(5),
        getMetricsAtrasosService(),
      ])
      setResumo(resumoData || null)
      setDepartamentos(Array.isArray(depData) ? depData : [])
      setFuncionarios(Array.isArray(funcData) ? funcData : [])
      setAtrasos(atrasoData || null)
      setLastUpdated(new Date().toISOString())
    } catch (err: any) {
      setError(err?.message || "Falha ao carregar métricas")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const setoresList = useMemo(() => {
    return [...departamentos].sort((a, b) => b.total - a.total)
  }, [departamentos])

  const derived = useMemo(() => {
    const total = resumo?.total ?? 0
    const abertos = resumo?.abertos ?? 0
    const finalizados = resumo?.finalizados ?? 0
    const atrasados = atrasos?.totalAtrasados ?? resumo?.atrasados ?? 0
    const atrasoMedio = atrasos?.atrasoMedioMs ?? 0
    const atrasoPct = total > 0 ? (atrasados / total) * 100 : 0
    const onTimePct = total > 0 ? ((total - atrasados) / total) * 100 : 0
    return { total, abertos, finalizados, atrasados, atrasoMedio, atrasoPct, onTimePct }
  }, [resumo, atrasos])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-blue-700" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Painel de Métricas</h1>
              <p className="text-xs text-slate-500">Visão de desempenho operacional</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {lastUpdated && <Badge variant="outline" className="text-slate-600">Atualizado {new Date(lastUpdated).toLocaleString('pt-BR')}</Badge>}
            <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              <span className="ml-2">Atualizar</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="w-4 h-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-blue-600 text-white border-0 shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-blue-100">Pedidos abertos</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold">{resumo?.abertos ?? 0}</div>
                <p className="text-sm text-blue-100">Em produção</p>
              </div>
              <TrendingUp className="w-8 h-8 text-white/80" />
            </CardContent>
          </Card>

          <Card className="bg-emerald-600 text-white border-0 shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-emerald-100">Pedidos finalizados</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold">{resumo?.finalizados ?? 0}</div>
                <p className="text-sm text-emerald-100">Concluídos</p>
              </div>
              <Award className="w-8 h-8 text-white/80" />
            </CardContent>
          </Card>

          <Card className="bg-amber-500 text-white border-0 shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-amber-100">Pedidos em atraso</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold">{atrasos?.totalAtrasados ?? resumo?.atrasados ?? 0}</div>
                <p className="text-sm text-amber-100">Atenção imediata</p>
              </div>
              <Clock className="w-8 h-8 text-white/80" />
            </CardContent>
          </Card>

          <Card className="bg-slate-900 text-white border-0 shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-slate-200">Atraso médio</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold">{atrasos?.atrasoMedioMs ? formatDays(atrasos.atrasoMedioMs) : "0"}</div>
                <p className="text-sm text-slate-200">Entre pedidos atrasados</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-white/80" />
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-sm bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white">
          <CardHeader className="pb-2">
            <CardTitle>Métricas avançadas</CardTitle>
            <CardDescription className="text-slate-200">Lead time, risco de SLA e eficiência</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-3 rounded-lg bg-white/5 border border-white/10">
              <p className="text-xs uppercase tracking-wide text-slate-200">Lead time (atrasados)</p>
              <p className="text-2xl font-semibold">{derived.atrasoMedio ? formatDays(derived.atrasoMedio) : "—"}</p>
              <p className="text-[11px] text-slate-300">Tempo médio além do prazo</p>
            </div>
            <div className="p-3 rounded-lg bg-white/5 border border-white/10">
              <p className="text-xs uppercase tracking-wide text-slate-200">Risco SLA</p>
              <p className="text-2xl font-semibold text-amber-300">{derived.atrasoPct ? formatPct(derived.atrasoPct) : "0%"}</p>
              <p className="text-[11px] text-slate-300">Pedidos atrasados vs total</p>
            </div>
            <div className="p-3 rounded-lg bg-white/5 border border-white/10">
              <p className="text-xs uppercase tracking-wide text-slate-200">On-time</p>
              <p className="text-2xl font-semibold text-emerald-200">{derived.onTimePct ? formatPct(derived.onTimePct) : "100%"}</p>
              <p className="text-[11px] text-slate-300">Entregues dentro do prazo</p>
            </div>
            <div className="p-3 rounded-lg bg-white/5 border border-white/10">
              <p className="text-xs uppercase tracking-wide text-slate-200">Retrabalho</p>
              <p className="text-2xl font-semibold text-slate-100">—</p>
              <p className="text-[11px] text-slate-300">Aguardando dado do backend</p>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 shadow-sm">
            <CardHeader>
              <CardTitle>Pedidos por departamento</CardTitle>
              <CardDescription>Distribuição atual por setor</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {setoresList.length === 0 && <p className="text-sm text-slate-500">Sem dados.</p>}
              {setoresList.map((item) => {
                const pct = (resumo?.total ?? 0) ? (item.total / (resumo?.total ?? 0)) * 100 : 0
                return (
                  <div key={item.setorId || item.setorNome || "setor"} className="space-y-1">
                    <div className="flex justify-between text-sm text-slate-700">
                      <span>{item.setorNome || item.setorId}</span>
                      <span>{item.total} • {formatPct(pct)}</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full bg-blue-500" style={{ width: `${pct}%` }}></div>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Top 5 funcionários</CardTitle>
              <CardDescription>Pedidos associados (funcionário atual)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {(funcionarios?.length ?? 0) === 0 && <p className="text-sm text-slate-500">Sem dados.</p>}
              {funcionarios?.map((item, idx) => (
                <div key={item.funcionarioNome} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-slate-500" />
                    <span className="font-medium text-slate-800">{idx + 1}. {item.funcionarioNome}</span>
                  </div>
                  <Badge variant="secondary" className="bg-slate-100 text-slate-700">{item.total}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Pedidos em atraso</CardTitle>
            <CardDescription>Lista resumida dos pedidos que passaram do prazo</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {(atrasos?.itens?.length ?? 0) === 0 && (
              <p className="text-sm text-slate-500">Sem pedidos em atraso.</p>
            )}
            {atrasos?.itens?.slice(0, 10).map((o) => {
              const atrasoMs = Date.now() - new Date(o.dataPrevistaEntrega as string).getTime()
              return (
                <div key={o.id} className="flex items-center justify-between border border-slate-200 rounded-lg p-3">
                  <div className="space-y-1">
                    <div className="font-semibold text-slate-800">#{o.codigo || o.id}</div>
                    <div className="text-xs text-slate-500">Status: {o.status}</div>
                    {o.funcionarioAtual && <div className="text-xs text-slate-500">Resp.: {o.funcionarioAtual}</div>}
                  </div>
                  <div className="text-right">
                    <Badge variant="destructive">{formatDays(atrasoMs)}</Badge>
                    <div className="text-xs text-slate-500 mt-1">Venc. {new Date(o.dataPrevistaEntrega as string).toLocaleDateString('pt-BR')}</div>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
