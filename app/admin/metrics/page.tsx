"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getMetricsAtrasosService, getMetricsDepartamentosService, getMetricsFuncionariosService, getMetricsResumoService } from "@/lib/apiService"
import { Loader2, RefreshCw, TrendingUp, BarChart3, Clock, Users, AlertTriangle, Award, ArrowLeft } from "lucide-react"
import Link from "next/link"

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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-50">
      <header className="border-b border-white/10 bg-slate-950/70 backdrop-blur supports-[backdrop-filter]:bg-slate-950/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-white">Painel de Métricas</h1>
              <p className="text-xs text-slate-300">Visão executiva de desempenho</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {lastUpdated && (
              <Badge variant="outline" className="border-white/20 bg-white/5 text-slate-100">
                Atualizado {new Date(lastUpdated).toLocaleString('pt-BR')}
              </Badge>
            )}
            <Button variant="outline" size="sm" onClick={loadData} disabled={loading} className="border-white/30 text-white hover:bg-white/10">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              <span className="ml-2">Atualizar</span>
            </Button>
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="h-9 text-slate-200 hover:text-white">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {error && (
          <Alert variant="destructive" className="bg-rose-950/70 border-rose-700 text-rose-100">
            <AlertTriangle className="w-4 h-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[{
            title: "Pedidos abertos",
            value: resumo?.abertos ?? 0,
            hint: "Em produção",
            icon: TrendingUp,
            bg: "from-blue-500/80 to-indigo-500/80",
          }, {
            title: "Pedidos finalizados",
            value: resumo?.finalizados ?? 0,
            hint: "Concluídos",
            icon: Award,
            bg: "from-emerald-500/80 to-teal-500/80",
          }, {
            title: "Pedidos em atraso",
            value: atrasos?.totalAtrasados ?? resumo?.atrasados ?? 0,
            hint: "Atenção imediata",
            icon: Clock,
            bg: "from-amber-500/90 to-orange-500/80",
          }, {
            title: "Atraso médio",
            value: atrasos?.atrasoMedioMs ? formatDays(atrasos.atrasoMedioMs) : "0",
            hint: "Entre atrasados",
            icon: AlertTriangle,
            bg: "from-slate-800 to-slate-700",
          }].map((card) => {
            const Icon = card.icon;
            return (
              <Card key={card.title} className="relative overflow-hidden border border-white/10 bg-gradient-to-br shadow-xl shadow-black/30">
                <div className="absolute inset-0 opacity-70" style={{ background: "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.12), transparent 35%)" }} />
                <div className={`absolute inset-0 bg-gradient-to-br ${card.bg}`} />
                <CardHeader className="pb-1 relative text-white">
                  <CardTitle className="text-sm font-semibold text-white/80">{card.title}</CardTitle>
                </CardHeader>
                <CardContent className="relative flex items-center justify-between text-white">
                  <div>
                    <div className="text-3xl font-bold leading-tight">{card.value}</div>
                    <p className="text-sm text-white/80">{card.hint}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/15 border border-white/10">
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="shadow-2xl shadow-black/30 border border-white/10 bg-slate-900/80 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="text-white">Métricas avançadas</CardTitle>
            <CardDescription className="text-slate-300">Lead time, risco de SLA e eficiência</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-3 rounded-lg bg-white/5 border border-white/10">
              <p className="text-xs uppercase tracking-wide text-slate-200">Lead time (atrasados)</p>
              <p className="text-2xl font-semibold text-white">{derived.atrasoMedio ? formatDays(derived.atrasoMedio) : "—"}</p>
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
          <Card className="lg:col-span-2 shadow-xl shadow-black/20 border border-white/10 bg-white/5">
            <CardHeader>
              <CardTitle className="text-white">Pedidos por departamento</CardTitle>
              <CardDescription className="text-slate-300">Distribuição atual por setor</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {setoresList.length === 0 && <p className="text-sm text-slate-300">Sem dados.</p>}
              {setoresList.map((item) => {
                const pct = (resumo?.total ?? 0) ? (item.total / (resumo?.total ?? 0)) * 100 : 0
                return (
                  <div key={item.setorId || item.setorNome || "setor"} className="space-y-2">
                    <div className="flex justify-between text-sm text-slate-100">
                      <span className="font-medium">{item.setorNome || item.setorId}</span>
                      <span className="text-slate-300">{item.total} • {formatPct(pct)}</span>
                    </div>
                    <div className="h-2.5 rounded-full bg-white/10 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-blue-400 to-indigo-500" style={{ width: `${pct}%` }}></div>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          <Card className="shadow-xl shadow-black/20 border border-white/10 bg-white/5">
            <CardHeader>
              <CardTitle className="text-white">Top 5 funcionários</CardTitle>
              <CardDescription className="text-slate-300">Pedidos associados (funcionário atual)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {(funcionarios?.length ?? 0) === 0 && <p className="text-sm text-slate-300">Sem dados.</p>}
              {funcionarios?.map((item, idx) => (
                <div key={item.funcionarioNome} className="flex items-center justify-between text-sm text-white/90 bg-white/5 border border-white/10 rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-xs font-semibold text-white/80">
                      {idx + 1}
                    </div>
                    <div className="flex flex-col leading-tight">
                      <span className="font-medium text-white">{item.funcionarioNome}</span>
                      <span className="text-[11px] text-slate-300">Pedidos atuais</span>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-100 border-emerald-500/30">{item.total}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-2xl shadow-black/25 border border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle className="text-white">Pedidos em atraso</CardTitle>
            <CardDescription className="text-slate-300">Lista resumida dos pedidos que passaram do prazo</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {(atrasos?.itens?.length ?? 0) === 0 && (
              <p className="text-sm text-slate-300">Sem pedidos em atraso.</p>
            )}
            {atrasos?.itens?.slice(0, 10).map((o) => {
              const atrasoMs = Date.now() - new Date(o.dataPrevistaEntrega as string).getTime()
              return (
                <div key={o.id} className="flex items-center justify-between rounded-lg px-4 py-3 border border-white/10 bg-gradient-to-r from-rose-950/50 to-rose-900/30 text-white">
                  <div className="space-y-1">
                    <div className="font-semibold">#{o.codigo || o.id}</div>
                    <div className="text-xs text-rose-100/80">Status: {o.status}</div>
                    {o.funcionarioAtual && <div className="text-xs text-rose-100/80">Resp.: {o.funcionarioAtual}</div>}
                  </div>
                  <div className="text-right">
                    <Badge variant="destructive" className="bg-rose-600 text-white border-rose-500/60">{formatDays(atrasoMs)}</Badge>
                    <div className="text-xs text-rose-100/80 mt-1">Venc. {new Date(o.dataPrevistaEntrega as string).toLocaleDateString('pt-BR')}</div>
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
