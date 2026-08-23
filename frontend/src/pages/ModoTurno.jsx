import React, { useMemo, useState } from "react";
import { toast } from "sonner";
import { ChevronRight, Clock, Filter, Users, Monitor, Volume2, VolumeX } from "lucide-react";
import { useApp, fmtMoney } from "../context/AppContext";
import { STATUS_STYLE } from "../lib/seed";
import { Button } from "../components/ui/button";
import { dingAdvance, dingSuccess } from "../lib/sound";

const STAGES = ["Recibida", "Clasificación", "En lavado", "En secado", "Planchado", "Control de calidad", "Lista para entregar"];
const NEXT_OF = STAGES.reduce((acc, s, i) => { acc[s] = STAGES[i + 1] || "Entregada"; return acc; }, {});

const ROLE_STAGES = {
  "Administrador": STAGES,
  "Recepción": ["Recibida", "Clasificación"],
  "Operador": ["Clasificación", "En lavado", "En secado", "Planchado", "Control de calidad"],
  "Cajero": ["Lista para entregar"],
};

const elapsed = (iso) => {
  const ms = Date.now() - new Date(iso).getTime();
  const h = Math.floor(ms / 3600000);
  if (h < 1) return `${Math.floor(ms / 60000)}m`;
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d ${h % 24}h`;
};

export default function ModoTurno() {
  const { data, currentUser, updateOrderStatus } = useApp();
  const currency = data.config.business.currencySymbol;
  const [scope, setScope] = useState("mi");
  const [tablet, setTablet] = useState(() => localStorage.getItem("turno_tablet") === "1");
  const [soundOn, setSoundOn] = useState(() => localStorage.getItem("turno_sound") !== "0");

  const toggleTablet = () => {
    const next = !tablet;
    setTablet(next);
    localStorage.setItem("turno_tablet", next ? "1" : "0");
  };
  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    localStorage.setItem("turno_sound", next ? "1" : "0");
    if (next) dingAdvance();
  };

  const visibleStages = useMemo(() => {
    if (scope === "todas") return STAGES;
    return ROLE_STAGES[currentUser?.role] || STAGES;
  }, [scope, currentUser]);

  const grouped = useMemo(() => {
    const g = {};
    visibleStages.forEach(s => { g[s] = []; });
    data.orders.forEach(o => {
      if (visibleStages.includes(o.status)) g[o.status].push(o);
    });
    Object.keys(g).forEach(s => g[s].sort((a, b) => new Date(a.promisedAt) - new Date(b.promisedAt)));
    return g;
  }, [data.orders, visibleStages]);

  const totalPending = Object.values(grouped).reduce((s, arr) => s + arr.length, 0);

  const advance = (order) => {
    const next = NEXT_OF[order.status];
    updateOrderStatus(order.id, next);
    if (soundOn) {
      if (next === "Lista para entregar" || next === "Entregada") dingSuccess();
      else dingAdvance();
    }
    toast.success(`${order.number} → ${next}`);
  };

  return (
    <div data-testid="turno-page" className={`space-y-6 animate-fadeInUp ${tablet ? "text-base" : ""}`}>
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-widest text-blue-600 font-semibold">Panel operativo</div>
          <h1 className={`font-heading font-extrabold text-slate-900 tracking-tight mt-1 ${tablet ? "text-4xl md:text-5xl" : "text-3xl md:text-4xl"}`}>Modo Turno</h1>
          <p className={`text-slate-500 mt-1 ${tablet ? "text-base" : ""}`}>{totalPending} órdenes en las etapas visibles · Rol: <span className="font-semibold text-slate-700">{currentUser?.role}</span></p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            data-testid="turno-sound-toggle"
            onClick={toggleSound}
            title={soundOn ? "Silenciar sonidos" : "Activar sonidos"}
            className={`p-2 rounded-lg border transition-colors ${soundOn ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-white text-slate-500"}`}
          >
            {soundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
          <button
            data-testid="turno-tablet-toggle"
            onClick={toggleTablet}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-semibold transition-colors ${tablet ? "border-blue-600 bg-blue-600 text-white" : "border-slate-200 bg-white text-slate-600 hover:border-blue-400"}`}
          >
            <Monitor className="w-4 h-4" /> Tablero tablet
          </button>
          <div className="inline-flex bg-white border border-slate-200 rounded-lg p-1">
            <button data-testid="turno-scope-mi" onClick={() => setScope("mi")}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${scope === "mi" ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-50"}`}>
              <Filter className="w-3 h-3 inline mr-1" /> Mi turno
            </button>
            <button data-testid="turno-scope-todas" onClick={() => setScope("todas")}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${scope === "todas" ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-50"}`}>
              <Users className="w-3 h-3 inline mr-1" /> Ver todas
            </button>
          </div>
        </div>
      </div>

      <div className={`grid gap-3 ${tablet ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-7"}`}>
        {visibleStages.map(stage => (
          <div key={stage} data-testid={`turno-col-${stage}`} className={`bg-slate-50/70 border border-slate-200 rounded-xl flex flex-col ${tablet ? "min-h-[500px]" : "min-h-[400px]"}`}>
            <div className={`px-3 border-b border-slate-200 rounded-t-xl flex items-center justify-between ${tablet ? "py-3.5" : "py-2.5"} ${STATUS_STYLE[stage]}`}>
              <div className={`font-heading font-bold uppercase tracking-wider truncate ${tablet ? "text-sm" : "text-xs"}`}>{stage}</div>
              <span className={`font-bold bg-white/60 rounded-full px-2 py-0.5 ${tablet ? "text-sm" : "text-xs"}`}>{grouped[stage].length}</span>
            </div>
            <div className={`flex-1 overflow-y-auto space-y-2 max-h-[70vh] ${tablet ? "p-3" : "p-2"}`}>
              {grouped[stage].length === 0 ? (
                <div className={`text-center text-slate-400 ${tablet ? "py-12 text-sm" : "py-8 text-xs"}`}>Sin órdenes</div>
              ) : grouped[stage].map(o => {
                const late = new Date(o.promisedAt) < new Date() && stage !== "Lista para entregar";
                return (
                  <div
                    key={o.id}
                    data-testid={`turno-card-${o.number}`}
                    className={`bg-white border rounded-lg hover:shadow-md hover:border-blue-400 transition-all ${tablet ? "p-4" : "p-2.5"} ${late ? "border-rose-300 bg-rose-50/30" : "border-slate-200"}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`font-mono font-bold text-blue-600 ${tablet ? "text-base" : "text-xs"}`}>{o.number}</span>
                      <span className={`inline-flex items-center gap-1 font-semibold ${late ? "text-rose-600" : "text-slate-500"} ${tablet ? "text-xs" : "text-[10px]"}`}>
                        <Clock className={tablet ? "w-3.5 h-3.5" : "w-3 h-3"} />{elapsed(o.timeline[o.timeline.length - 1]?.at || o.createdAt)}
                      </span>
                    </div>
                    <div className={`font-semibold text-slate-900 mt-1 truncate ${tablet ? "text-lg" : "text-sm"}`}>{o.customerName}</div>
                    <div className={`text-slate-500 ${tablet ? "text-sm" : "text-[10px]"}`}>{o.items.length} servicio(s) · {fmtMoney(o.total, currency)}</div>
                    {stage !== "Lista para entregar" && (
                      <Button
                        data-testid={`turno-advance-${o.number}`}
                        onClick={() => advance(o)}
                        className={`w-full mt-2 bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 font-semibold ${tablet ? "h-12 text-base" : "h-7 text-xs"}`}
                      >
                        Avanzar a {NEXT_OF[stage]} <ChevronRight className={tablet ? "w-5 h-5 ml-1" : "w-3 h-3 ml-1"} />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
