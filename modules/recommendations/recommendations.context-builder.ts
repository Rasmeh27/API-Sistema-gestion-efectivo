// modules/recommendations/recommendations.context-builder.ts
//
// Arma el prompt con datos reales del sistema.
// Consulta KPIs, movimientos, sesiones y arqueos para dar contexto al LLM.

import { KpiRepository } from "../kpis/kpis.repository";

export interface SystemContext {
  cashSummary: {
    efectivoTotalEnCirculacion: number;
    cajasAbiertas: number;
    cajasCerradas: number;
  };
  transactionVolume24h: { tipo: string; cantidad: number; total: number }[];
  transactionVolume7d: { tipo: string; cantidad: number; total: number }[];
  balanceAlerts: { arqueoId: string; cajaId: string; diferencia: number; fecha: string }[];
  trend7d: { fecha: string; ingresos: number; egresos: number; balance: number }[];
  averageBalance: {
    promedioGeneral: number;
    porCaja: { cajaId: string; cajaNombre: string; promedio: number }[];
  };
}

export class ContextBuilder {
  constructor(private readonly kpiRepo: KpiRepository) {}

  /**
   * Recopila datos del sistema para inyectar como contexto al LLM.
   */
  async buildContext(sucursalId?: string): Promise<SystemContext> {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      cashSummary,
      transactionVolume24h,
      transactionVolume7d,
      balanceAlerts,
      trend7d,
      averageBalance,
    ] = await Promise.all([
      this.kpiRepo.getCashSummary(sucursalId),
      this.kpiRepo.getTransactionVolume(24, sucursalId),
      this.kpiRepo.getTransactionVolume(168, sucursalId),
      this.kpiRepo.getBalanceAlerts(10, sucursalId),
      this.kpiRepo.getTrend({
        from: sevenDaysAgo.toISOString(),
        to: now.toISOString(),
        groupBy: "day",
        sucursalId,
      }),
      this.kpiRepo.getAverageBalance({ sucursalId }),
    ]);

    return {
      cashSummary,
      transactionVolume24h,
      transactionVolume7d,
      balanceAlerts,
      trend7d,
      averageBalance,
    };
  }

  /**
   * Convierte el contexto del sistema a un texto legible para el LLM.
   */
  formatContextForPrompt(ctx: SystemContext): string {
    const lines: string[] = [];

    lines.push("=== ESTADO ACTUAL DEL SISTEMA DE GESTIÓN DE EFECTIVO ===\n");

    // Resumen de caja
    lines.push("## Resumen de Efectivo");
    lines.push(`- Efectivo total en circulación: RD$${ctx.cashSummary.efectivoTotalEnCirculacion.toLocaleString()}`);
    lines.push(`- Cajas abiertas: ${ctx.cashSummary.cajasAbiertas}`);
    lines.push(`- Cajas cerradas: ${ctx.cashSummary.cajasCerradas}`);
    lines.push("");

    // Volumen transaccional
    lines.push("## Volumen de Transacciones (últimas 24h)");
    if (ctx.transactionVolume24h.length === 0) {
      lines.push("- Sin transacciones en las últimas 24 horas");
    } else {
      for (const v of ctx.transactionVolume24h) {
        lines.push(`- ${v.tipo}: ${v.cantidad} operaciones por RD$${v.total.toLocaleString()}`);
      }
    }
    lines.push("");

    lines.push("## Volumen de Transacciones (últimos 7 días)");
    if (ctx.transactionVolume7d.length === 0) {
      lines.push("- Sin transacciones en los últimos 7 días");
    } else {
      for (const v of ctx.transactionVolume7d) {
        lines.push(`- ${v.tipo}: ${v.cantidad} operaciones por RD$${v.total.toLocaleString()}`);
      }
    }
    lines.push("");

    // Alertas de balance
    if (ctx.balanceAlerts.length > 0) {
      lines.push("## Alertas de Discrepancias en Arqueos");
      for (const a of ctx.balanceAlerts) {
        lines.push(`- Arqueo #${a.arqueoId} en caja #${a.cajaId}: diferencia de RD$${a.diferencia.toLocaleString()} (${a.fecha})`);
      }
      lines.push("");
    }

    // Tendencia 7 días
    if (ctx.trend7d.length > 0) {
      lines.push("## Tendencia Diaria (últimos 7 días)");
      for (const t of ctx.trend7d) {
        lines.push(`- ${t.fecha}: Ingresos RD$${t.ingresos.toLocaleString()} | Egresos RD$${t.egresos.toLocaleString()} | Balance RD$${t.balance.toLocaleString()}`);
      }
      lines.push("");
    }

    // Saldo promedio
    lines.push("## Saldo Promedio por Caja (últimos 30 días)");
    lines.push(`- Promedio general: RD$${ctx.averageBalance.promedioGeneral.toLocaleString()}`);
    for (const c of ctx.averageBalance.porCaja) {
      lines.push(`- ${c.cajaNombre} (#${c.cajaId}): RD$${c.promedio.toLocaleString()}`);
    }

    return lines.join("\n");
  }

  /**
   * Prompt del sistema para generación de recomendaciones automáticas.
   */
  getGenerateSystemPrompt(): string {
    return `Eres un asistente financiero experto en gestión de efectivo para instituciones financieras en República Dominicana.

Tu tarea es analizar los datos del sistema y generar recomendaciones accionables.

REGLAS:
- Responde ÚNICAMENTE en formato JSON válido (un array de objetos).
- Cada recomendación debe tener: tipo, prioridad, titulo, descripcion.
- tipo: "ALERTA" (problemas urgentes), "OPTIMIZACION" (mejoras operativas), "PREVISION" (predicciones), "GENERAL" (observaciones).
- prioridad: "ALTA", "MEDIA", "BAJA".
- titulo: máximo 100 caracteres, conciso y directo.
- descripcion: 1-3 oraciones explicando el problema y la acción sugerida.
- Genera entre 2 y 5 recomendaciones basadas en los datos proporcionados.
- Moneda principal: DOP (Peso Dominicano).
- Si no hay datos suficientes para una recomendación, omítela.

Ejemplo de formato:
[
  {
    "tipo": "ALERTA",
    "prioridad": "ALTA",
    "titulo": "Discrepancia alta en Caja Principal",
    "descripcion": "Se detectó una diferencia de RD$800 en el último arqueo. Se recomienda realizar un arqueo de verificación."
  }
]`;
  }

  /**
   * Prompt del sistema para el chatbot.
   */
  getChatSystemPrompt(): string {
    return `Eres un asistente financiero inteligente para un sistema de gestión de efectivo en República Dominicana.

Tienes acceso a datos en tiempo real del sistema que se proporcionan como contexto.

REGLAS:
- Responde en español, de forma clara y profesional.
- Basa tus respuestas en los datos proporcionados del sistema.
- Si no tienes datos suficientes para responder, indícalo honestamente.
- Puedes hacer cálculos, comparaciones y análisis basados en los datos.
- Sugiere acciones concretas cuando sea apropiado.
- Moneda principal: DOP (Peso Dominicano).
- No inventes datos que no están en el contexto proporcionado.
- Sé conciso pero completo en tus respuestas.`;
  }
}
