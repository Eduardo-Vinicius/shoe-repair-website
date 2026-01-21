"use client";

import React, { useEffect, useState } from "react";
import { getSetoresEstatisticasService } from "@/lib/apiService";

type EstatisticaSetor = {
  nome: string;
  cor: string;
  quantidade: number;
  pedidos: Array<{
    id: string;
    codigo?: string;
    cliente?: string;
    tempoNoSetor?: number;
  }>;
};

export default function TVDashboard() {
  const [estatisticas, setEstatisticas] = useState<Record<string, EstatisticaSetor> | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string>(new Date().toLocaleTimeString("pt-BR"));

  const buscar = async () => {
    try {
      const data = await getSetoresEstatisticasService();
      setEstatisticas(data);
      setLastUpdate(new Date().toLocaleTimeString("pt-BR"));
    } catch (error) {
      console.error("Erro ao buscar estatísticas:", error);
    }
  };

  useEffect(() => {
    buscar();
    const interval = setInterval(buscar, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Dashboard de Produção</h1>
        <p className="text-gray-400">Atualizado em: {lastUpdate}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {estatisticas &&
          Object.entries(estatisticas).map(([setorId, dados]) => (
            <div
              key={setorId}
              className="bg-gray-800 rounded-lg p-6 text-center"
              style={{ borderTop: `4px solid ${dados.cor}` }}
            >
              <h3 className="text-white text-2xl font-bold mb-4">{dados.nome}</h3>
              <div className="text-6xl font-bold mb-2" style={{ color: dados.cor }}>
                {dados.quantidade}
              </div>
              <div className="text-gray-400 text-lg">
                {dados.quantidade === 1 ? "pedido" : "pedidos"}
              </div>

              {dados.quantidade > 0 && (
                <div className="mt-4 space-y-2 max-h-60 overflow-y-auto">
                  {dados.pedidos.map((pedido) => (
                    <div key={pedido.id} className="bg-gray-700 rounded p-3 text-left">
                      <div className="text-white font-mono text-sm">#{pedido.codigo}</div>
                      <div className="text-gray-300 text-xs">{pedido.cliente}</div>
                      {pedido.tempoNoSetor && pedido.tempoNoSetor > 0 && (
                        <div className="text-yellow-400 text-xs mt-1">⏱ {pedido.tempoNoSetor}h</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
      </div>
    </div>
  );
}
