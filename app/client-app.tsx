"use client";

/* eslint-disable @next/next/no-img-element */

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  Bell,
  Bird,
  Bot,
  Camera,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Cpu,
  Droplets,
  Egg,
  Fan,
  Home,
  ListChecks,
  Menu,
  MoreHorizontal,
  Play,
  Power,
  RefreshCw,
  Search,
  Send,
  Settings2,
  ShieldCheck,
  Sparkles,
  Sprout,
  Thermometer,
  UserRound,
  Video,
  Wifi,
  Wrench,
  X,
} from "lucide-react";

type ClientView = "farm" | "cameras" | "assistant" | "more" | "room" | "events";
type RoomId = "quail" | "incubator";
type SystemStatus = "normal" | "warning";
type UpdateStatus = "ready" | "updating" | "done";
type TelemetryRange = "1h" | "6h" | "24h" | "7d";

type TelemetryPoint = {
  id: number;
  receivedAt: string;
  temperatureC: number;
  humidityPct: number;
  rssiDbm: number | null;
  sequence: number;
};

type TelemetryLatest = TelemetryPoint & {
  deviceId: string;
  messageId: string;
  recordedAt: string | null;
  uptimeSeconds: number | null;
  firmwareVersion: string | null;
  quality: string;
};

type TelemetryResponse = {
  deviceId: string;
  range: TelemetryRange;
  latest: TelemetryLatest | null;
  series: TelemetryPoint[];
  count: number;
  generatedAt: string;
};

type TelemetryState = {
  data: TelemetryResponse | null;
  loading: boolean;
  error: string | null;
};

type SheetState =
  | null
  | { type: "notifications" }
  | { type: "profile" }
  | { type: "update" }
  | { type: "feeding" }
  | { type: "event"; id: string }
  | { type: "camera"; id: RoomId }
  | { type: "feature"; title: string; description: string };

type ClientAppProps = {
  status: SystemStatus;
  fanOn: boolean;
  onRunScenario: () => void;
  onOpenEngineer: () => void;
};

const rooms = {
  quail: {
    id: "quail" as RoomId,
    name: "Перепелиный цех",
    image: "/assets/quail-room.webp",
    status: "Всё спокойно",
    description: "Перепела активны, климат в норме",
    meta: "35 птиц · основное помещение",
    temperature: "24,6 °C",
    humidity: "58%",
    water: "Нет датчика",
  },
  incubator: {
    id: "incubator" as RoomId,
    name: "Инкубатор",
    image: "/assets/incubator.webp",
    status: "Вывод идёт по плану",
    description: "Ожидается 18 птенцов сегодня",
    meta: "Цикл 7 из 17 · партия Q-0722",
    temperature: "37,7 °C",
    humidity: "61%",
    water: "—",
  },
};

function formatMetric(value: number | undefined, suffix: string) {
  if (value === undefined || !Number.isFinite(value)) return "—";
  return `${value.toLocaleString("ru-RU", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} ${suffix}`;
}

function formatReadingTime(value: string | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "short",
  }).format(date);
}

function useTelemetry(deviceId: string, range: TelemetryRange): TelemetryState {
  const [state, setState] = useState<TelemetryState>({ data: null, loading: true, error: null });

  useEffect(() => {
    let disposed = false;
    let controller: AbortController | null = null;

    async function load() {
      controller?.abort();
      controller = new AbortController();
      try {
        const response = await fetch(`/api/telemetry?deviceId=${encodeURIComponent(deviceId)}&range=${range}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const firstPayload = (await response.json()) as TelemetryResponse | { gatewayUrl?: string };
        let data: TelemetryResponse;
        if ("gatewayUrl" in firstPayload && typeof firstPayload.gatewayUrl === "string") {
          const telemetryResponse = await fetch(firstPayload.gatewayUrl, {
            cache: "no-store",
            signal: controller.signal,
          });
          if (!telemetryResponse.ok) throw new Error(`Telemetry HTTP ${telemetryResponse.status}`);
          data = (await telemetryResponse.json()) as TelemetryResponse;
        } else {
          data = firstPayload as TelemetryResponse;
        }
        if (!disposed) setState({ data, loading: false, error: null });
      } catch (error) {
        if (disposed || (error instanceof DOMException && error.name === "AbortError")) return;
        setState((current) => ({ ...current, loading: false, error: "Не удалось получить телеметрию" }));
      }
    }

    void load();
    const timer = window.setInterval(load, 20_000);
    return () => {
      disposed = true;
      controller?.abort();
      window.clearInterval(timer);
    };
  }, [deviceId, range]);

  return state;
}

const events = [
  {
    id: "night",
    title: "Ночная активность",
    time: "03:15",
    image: "/assets/quail-room.webp",
    copy: "Камера заметила обычное движение у поилки. Отклонений не обнаружено.",
    tone: "night",
  },
  {
    id: "feeding",
    title: "Птицы у кормушки",
    time: "07:42",
    image: "/assets/quail-feeding.webp",
    copy: "Кормушка использовалась равномерно. Признаков скучивания нет.",
    tone: "",
  },
  {
    id: "egg",
    title: "Снесено яйцо",
    time: "08:21",
    image: "/assets/incubator.webp",
    copy: "Событие сохранено камерой. Суточный подсчёт обновлён.",
    tone: "mono",
  },
  {
    id: "chick",
    title: "Первый птенец",
    time: "11:08",
    image: "/assets/incubator.webp",
    copy: "Первый птенец партии появился. Параметры инкубатора стабильны.",
    tone: "",
  },
];

const navItems = [
  { id: "farm" as ClientView, label: "Хозяйство", Icon: Home },
  { id: "cameras" as ClientView, label: "Камеры", Icon: Video },
  { id: "assistant" as ClientView, label: "ИИ-помощник", Icon: Bot },
  { id: "more" as ClientView, label: "Ещё", Icon: Menu },
];

function Logo() {
  return (
    <div className="client-logo" aria-label="AgroOS">
      <span className="client-logo-mark"><Sprout size={29} strokeWidth={2.6} /></span>
      <strong>AgroOS</strong>
    </div>
  );
}

function DesktopNavigation({
  view,
  onNavigate,
  onOpenEngineer,
}: {
  view: ClientView;
  onNavigate: (view: ClientView) => void;
  onOpenEngineer: () => void;
}) {
  const activeView = view === "room" || view === "events" ? "farm" : view;
  return (
    <aside className="client-desktop-nav">
      <Logo />
      <div className="client-farm-switch">
        <span>М</span>
        <div><strong>Малышево</strong><small>Перепелиное хозяйство</small></div>
        <ChevronRight size={17} />
      </div>
      <nav aria-label="Навигация AgroOS">
        {navItems.map(({ id, label, Icon }) => (
          <button
            key={id}
            className={activeView === id ? "active" : ""}
            onClick={() => onNavigate(id)}
          >
            <Icon size={20} strokeWidth={2} />
            <span>{label}</span>
            {id === "farm" && <i>2</i>}
          </button>
        ))}
      </nav>
      <button className="client-engineer-entry" onClick={onOpenEngineer}>
        <Wrench size={19} />
        <span><strong>Инженерный режим</strong><small>Сборка и испытания</small></span>
        <ChevronRight size={17} />
      </button>
      <div className="client-sidebar-profile">
        <span>ВМ</span>
        <div><strong>Виталий</strong><small>Владелец</small></div>
      </div>
    </aside>
  );
}

function ClientHeader({
  notifications,
  onNotifications,
  onProfile,
}: {
  notifications: number;
  onNotifications: () => void;
  onProfile: () => void;
}) {
  return (
    <header className="client-header">
      <div className="client-mobile-logo"><Logo /></div>
      <div className="client-header-actions">
        <button className="client-icon-button" onClick={onNotifications} aria-label="Открыть уведомления">
          <Bell size={23} />
          {notifications > 0 && <span className="client-notification-badge">{notifications}</span>}
        </button>
        <button className="client-avatar" onClick={onProfile} aria-label="Открыть профиль">ВМ</button>
      </div>
    </header>
  );
}

function RoomCard({
  room,
  warning,
  onOpen,
  onMenu,
}: {
  room: (typeof rooms)[RoomId];
  warning?: boolean;
  onOpen: () => void;
  onMenu: () => void;
}) {
  const RoomIcon = room.id === "quail" ? Bird : Egg;
  return (
    <article
      className={"live-room-card " + (room.id === "incubator" ? "incubator" : "")}
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") onOpen();
      }}
    >
      <img src={room.image} alt={room.name} />
      <span className="client-live-pill"><i /> LIVE</span>
      <button
        className="client-card-menu"
        onClick={(event) => {
          event.stopPropagation();
          onMenu();
        }}
        aria-label={"Действия: " + room.name}
      >
        <MoreHorizontal size={22} />
      </button>
      <div className="live-room-copy">
        <span className="room-round-icon"><RoomIcon size={24} /></span>
        <div>
          <h2>{room.name}</h2>
          <strong className={warning ? "warning" : ""}>
            {warning ? "Вентиляция включена автоматически" : room.status}
          </strong>
          <p>{warning ? "Температура снижается, ток вентилятора подтверждён" : room.description}</p>
        </div>
        <span className="room-open-arrow"><ChevronRight size={28} /></span>
      </div>
    </article>
  );
}

function AttentionCard({
  onUpdate,
  onFeeding,
}: {
  onUpdate: () => void;
  onFeeding: () => void;
}) {
  return (
    <section className="client-panel attention-panel">
      <div className="client-section-title">
        <div><Bell size={23} /><h2>Требуют внимания</h2></div>
        <span>2</span>
      </div>
      <button className="attention-row" onClick={onUpdate}>
        <span className="attention-icon"><AlertTriangle size={25} /></span>
        <div><strong>Обновить прошивку</strong><small>Water-01 (Поилка)</small></div>
        <b className="attention-action">Обновить</b>
      </button>
      <button className="attention-row" onClick={onFeeding}>
        <span className="attention-icon clock"><Clock3 size={25} /></span>
        <div><strong>Через 3 часа кормление</strong><small>Перепелиный цех</small></div>
        <b className="attention-action neutral">Подробнее</b>
      </button>
    </section>
  );
}

function EventsStrip({
  onAll,
  onEvent,
}: {
  onAll: () => void;
  onEvent: (id: string) => void;
}) {
  return (
    <section className="client-panel events-panel">
      <div className="client-section-title">
        <h2>Последние события</h2>
        <button onClick={onAll}>Смотреть все</button>
      </div>
      <div className="events-strip">
        {events.map((event) => (
          <button className="event-tile" key={event.id} onClick={() => onEvent(event.id)}>
            <span className={"event-image " + event.tone}>
              <img src={event.image} alt="" />
              <i>{event.time}</i>
              <b><Play size={17} fill="currentColor" /></b>
            </span>
            <strong>{event.title}</strong>
          </button>
        ))}
      </div>
    </section>
  );
}

function FarmHome({
  status,
  fanOn,
  telemetry,
  onOpenRoom,
  onOpenSheet,
  onAllEvents,
}: {
  status: SystemStatus;
  fanOn: boolean;
  telemetry: TelemetryState;
  onOpenRoom: (room: RoomId) => void;
  onOpenSheet: (sheet: SheetState) => void;
  onAllEvents: () => void;
}) {
  const warning = status === "warning";
  const latest = telemetry.data?.latest ?? null;
  const lastSeenMs = latest ? new Date(latest.receivedAt).getTime() : 0;
  const referenceMs = telemetry.data ? new Date(telemetry.data.generatedAt).getTime() : 0;
  const telemetryOnline = lastSeenMs > 0 && referenceMs - lastSeenMs < 180_000;
  const quailRoom = {
    ...rooms.quail,
    status: telemetryOnline
      ? "Климатический узел на связи"
      : telemetry.loading
        ? "Подключаем климатический узел"
        : "Нет свежей телеметрии",
    description: latest
      ? `${formatMetric(latest.temperatureC, "°C")} · ${formatMetric(latest.humidityPct, "%")} · обновлено ${formatReadingTime(latest.receivedAt)}`
      : telemetry.error ?? "Ожидаем первую запись от CLM-01",
    temperature: formatMetric(latest?.temperatureC, "°C"),
    humidity: formatMetric(latest?.humidityPct, "%"),
  };
  return (
    <div className="client-page farm-page">
      <section className="client-greeting">
        <h1>Доброе утро, Виталий! <span>👋</span></h1>
        <button
          className={"farm-status-line " + (warning ? "warning" : "")}
          onClick={() =>
            onOpenSheet({
              type: "feature",
              title: warning ? "Вентиляция работает" : "Хозяйство работает штатно",
              description: warning
                ? "AgroOS обнаружила рост температуры, включила вентиляцию и подтвердила ток двигателя. Система ожидает возврат климата в профиль."
                : "Критических отклонений нет. Климат, вода, питание и связь проверены. Следующая автоматическая проверка через две минуты.",
            })
          }
        >
          {warning ? <Fan size={24} /> : <CheckCircle2 size={24} />}
          <span>
            <strong>{warning ? "Вентиляция включена автоматически" : "Хозяйство работает штатно"}</strong>
            <small>{warning && fanOn ? "Результат подтверждён физически" : "Последняя проверка 2 мин назад"}</small>
          </span>
          <ChevronRight size={20} />
        </button>
      </section>

      <div className="farm-dashboard-grid">
        <section className="rooms-column" aria-label="Помещения хозяйства">
          <RoomCard
            room={quailRoom}
            warning={warning}
            onOpen={() => onOpenRoom("quail")}
            onMenu={() =>
              onOpenSheet({
                type: "feature",
                title: "Перепелиный цех",
                description: "Открыть камеру, историю климата, автоматику или карточку оборудования.",
              })
            }
          />
          <div className="room-pager" aria-label="Помещения"><i className="active" /><i /><i /><i /></div>
          <RoomCard
            room={rooms.incubator}
            onOpen={() => onOpenRoom("incubator")}
            onMenu={() =>
              onOpenSheet({
                type: "feature",
                title: "Инкубатор",
                description: "Открыть цикл инкубации, живую камеру, историю температуры или журнал партии.",
              })
            }
          />
        </section>
        <aside className="farm-side-column">
          <AttentionCard
            onUpdate={() => onOpenSheet({ type: "update" })}
            onFeeding={() => onOpenSheet({ type: "feeding" })}
          />
          <EventsStrip
            onAll={onAllEvents}
            onEvent={(id) => onOpenSheet({ type: "event", id })}
          />
        </aside>
      </div>
    </div>
  );
}

function ScreenHeader({
  title,
  subtitle,
  onBack,
  action,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  action?: React.ReactNode;
}) {
  return (
    <div className="client-screen-header">
      <div>
        {onBack && <button className="client-back-button" onClick={onBack}><ArrowLeft size={21} /></button>}
        <span><h1>{title}</h1>{subtitle && <p>{subtitle}</p>}</span>
      </div>
      {action}
    </div>
  );
}

function CamerasView({
  onCamera,
  onEvent,
  onFeature,
}: {
  onCamera: (id: RoomId) => void;
  onEvent: (id: string) => void;
  onFeature: (title: string, description: string) => void;
}) {
  return (
    <div className="client-page">
      <ScreenHeader
        title="Камеры"
        subtitle="2 камеры в сети · архив событий сохранён локально"
        action={<button className="client-small-button" onClick={() => onFeature("Поиск по архиву", "Выберите камеру, дату и тип события. Архив хранится локально и доступен даже при потере интернета.")}><Search size={17} /> Найти событие</button>}
      />
      <div className="camera-grid">
        {Object.values(rooms).map((room) => (
          <button className="camera-card" key={room.id} onClick={() => onCamera(room.id)}>
            <span className="camera-frame">
              <img src={room.image} alt={"Камера: " + room.name} />
              <i><span /> LIVE</i>
              <b><Camera size={18} /> CAM-{room.id === "quail" ? "01" : "02"}</b>
            </span>
            <span className="camera-copy">
              <span><strong>{room.name}</strong><small>Движение: штатно · запись по событиям</small></span>
              <ChevronRight size={21} />
            </span>
          </button>
        ))}
      </div>
      <section className="camera-events">
        <div className="client-section-title"><h2>Сегодня камера заметила</h2><button onClick={() => onFeature("Настройки событий", "Здесь задаются зоны наблюдения, чувствительность и события, которые нужно сохранять.")}>Настроить</button></div>
        <div className="camera-event-list">
          {events.slice(0, 3).map((event) => (
            <button key={event.id} onClick={() => onEvent(event.id)}>
              <img src={event.image} alt="" />
              <span><strong>{event.title}</strong><small>{event.time} · событие проверено AgroOS</small></span>
              <ChevronRight size={20} />
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

function AssistantView({ onToast }: { onToast: (message: string) => void }) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Доброе утро! Я проверила хозяйство. Срочных действий нет. Water-01 можно обновить в удобное время.",
    },
  ]);

  const suggestions = [
    "Что происходило ночью?",
    "Почему включалась вентиляция?",
    "Когда понадобится корм?",
  ];

  function sendMessage(text: string) {
    const clean = text.trim();
    if (!clean) return;
    setMessages((current) => [
      ...current,
      { role: "user", text: clean },
      {
        role: "assistant",
        text: clean.includes("вентиляц")
          ? "Температура кратко выросла до 28,7 °C. AgroOS включила вентилятор, получила подтверждение тока 0,84 А и продолжает наблюдение."
          : clean.includes("ноч")
            ? "Ночью камера зафиксировала обычную активность у поилки в 03:15. Климат и вода оставались в норме."
            : "По текущему расходу корма хватит примерно на 2,6 дня. Следующее плановое кормление — через 3 часа.",
      },
    ]);
    setInput("");
    onToast("Ответ подготовлен по данным хозяйства");
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    sendMessage(input);
  }

  return (
    <div className="client-page assistant-page">
      <ScreenHeader title="ИИ-помощник" subtitle="Объясняет состояние хозяйства человеческим языком" />
      <section className="assistant-hero">
        <span><Sparkles size={26} /></span>
        <div><small>AGROOS AI</small><h2>Чем помочь по хозяйству?</h2><p>Ответы основаны на событиях, телеметрии и журнале автоматических действий.</p></div>
      </section>
      <div className="assistant-suggestions">
        {suggestions.map((suggestion) => (
          <button key={suggestion} onClick={() => sendMessage(suggestion)}>{suggestion}</button>
        ))}
      </div>
      <section className="assistant-chat" aria-live="polite">
        {messages.map((message, index) => (
          <div className={"chat-message " + message.role} key={index}>
            {message.role === "assistant" && <span><Bot size={18} /></span>}
            <p>{message.text}</p>
          </div>
        ))}
      </section>
      <form className="assistant-input" onSubmit={submit}>
        <input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Спросить AgroOS…" />
        <button aria-label="Отправить"><Send size={19} /></button>
      </form>
    </div>
  );
}

function MoreView({
  status,
  onOpenEngineer,
  onRunScenario,
  onOpenSheet,
}: {
  status: SystemStatus;
  onOpenEngineer: () => void;
  onRunScenario: () => void;
  onOpenSheet: (sheet: SheetState) => void;
}) {
  const features = [
    { title: "Устройства", description: "12 устройств · все на связи", Icon: Cpu },
    { title: "Задачи", description: "2 плановых действия", Icon: ListChecks },
    { title: "Аналитика", description: "Климат, вода, энергия", Icon: BarChart3 },
    { title: "Настройки", description: "Хозяйство и уведомления", Icon: Settings2 },
  ];
  return (
    <div className="client-page">
      <ScreenHeader title="Ещё" subtitle="Настройки, обслуживание и инженерные инструменты" />
      <button className="engineer-banner" onClick={onOpenEngineer}>
        <span><Wrench size={26} /></span>
        <div><small>AGROOS ENGINEERING</small><strong>Открыть сборочный стенд</strong><p>Комплект, проводка, прошивка, обнаружение и испытания</p></div>
        <ChevronRight size={24} />
      </button>
      <div className="more-grid">
        {features.map(({ title, description, Icon }) => (
          <button
            key={title}
            onClick={() => onOpenSheet({ type: "feature", title, description })}
          >
            <span><Icon size={23} /></span>
            <div><strong>{title}</strong><small>{description}</small></div>
            <ChevronRight size={19} />
          </button>
        ))}
      </div>
      <section className="system-test-card">
        <div><Activity size={23} /><span><strong>Проверка сквозного сценария</strong><small>Датчик → решение → реле → результат</small></span></div>
        <button onClick={onRunScenario}>{status === "normal" ? "Запустить тест" : "Вернуть норму"}</button>
      </section>
      <section className="about-card">
        <Logo />
        <p>Локально автономная операционная система хозяйства</p>
        <span>Версия интерфейса 0.2.0 · пилот «Малышево»</span>
      </section>
    </div>
  );
}

function MiniTelemetryChart({
  points,
  metric,
  color,
  label,
  unit,
}: {
  points: TelemetryPoint[];
  metric: "temperatureC" | "humidityPct";
  color: string;
  label: string;
  unit: string;
}) {
  const values = points.map((point) => point[metric]);
  const rawMin = values.length ? Math.min(...values) : 0;
  const rawMax = values.length ? Math.max(...values) : 0;
  const padding = Math.max((rawMax - rawMin) * 0.15, metric === "temperatureC" ? 0.4 : 1.2);
  const min = rawMin - padding;
  const max = rawMax + padding;
  const span = Math.max(max - min, 1);
  const polyline = points
    .map((point, index) => {
      const x = points.length === 1 ? 50 : (index / (points.length - 1)) * 100;
      const y = 40 - ((point[metric] - min) / span) * 34;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");

  return (
    <article className="telemetry-chart-card">
      <div className="telemetry-chart-heading">
        <span><small>{label}</small><strong>{formatMetric(values.at(-1), unit)}</strong></span>
        <span className="telemetry-extremes">мин. {formatMetric(rawMin, unit)} · макс. {formatMetric(rawMax, unit)}</span>
      </div>
      <svg viewBox="0 0 100 44" preserveAspectRatio="none" role="img" aria-label={`${label}: история показаний`}>
        <line x1="0" y1="8" x2="100" y2="8" />
        <line x1="0" y1="23" x2="100" y2="23" />
        <line x1="0" y1="38" x2="100" y2="38" />
        {polyline && <polyline points={polyline} style={{ stroke: color }} />}
      </svg>
      <div className="telemetry-chart-axis">
        <span>{formatReadingTime(points[0]?.receivedAt)}</span>
        <span>{formatReadingTime(points.at(-1)?.receivedAt)}</span>
      </div>
    </article>
  );
}

function TelemetryHistory({
  telemetry,
  range,
  onRangeChange,
}: {
  telemetry: TelemetryState;
  range: TelemetryRange;
  onRangeChange: (range: TelemetryRange) => void;
}) {
  const ranges: Array<{ id: TelemetryRange; label: string }> = [
    { id: "1h", label: "1 час" },
    { id: "6h", label: "6 часов" },
    { id: "24h", label: "24 часа" },
    { id: "7d", label: "7 дней" },
  ];
  const points = telemetry.data?.series ?? [];
  const latest = telemetry.data?.latest ?? null;
  const referenceMs = telemetry.data ? new Date(telemetry.data.generatedAt).getTime() : 0;
  const isOnline = latest ? referenceMs - new Date(latest.receivedAt).getTime() < 180_000 : false;

  return (
    <section className="telemetry-history-card">
      <div className="telemetry-history-head">
        <div>
          <span className={isOnline ? "telemetry-online" : "telemetry-offline"}><i /> {isOnline ? "CLM-01 на связи" : "CLM-01 ждёт данные"}</span>
          <h2>История климата</h2>
          <p>{points.length ? `${points.length} записей · последняя ${formatReadingTime(latest?.receivedAt)}` : "Первая запись появится после подключения узла"}</p>
        </div>
        {telemetry.loading && <RefreshCw className="telemetry-refresh" size={19} />}
      </div>
      <div className="telemetry-range" aria-label="Период графика">
        {ranges.map((item) => (
          <button key={item.id} className={range === item.id ? "active" : ""} onClick={() => onRangeChange(item.id)}>{item.label}</button>
        ))}
      </div>
      {telemetry.error && <div className="telemetry-message error"><AlertTriangle size={18} /> {telemetry.error}</div>}
      {!telemetry.error && points.length === 0 && <div className="telemetry-message"><Activity size={18} /> Хранилище готово. Ожидаем телеметрию от контроллера.</div>}
      {points.length > 0 && (
        <div className="telemetry-charts">
          <MiniTelemetryChart points={points} metric="temperatureC" color="#279d5c" label="Температура" unit="°C" />
          <MiniTelemetryChart points={points} metric="humidityPct" color="#3c82d4" label="Влажность" unit="%" />
        </div>
      )}
      <div className="telemetry-foot">
        <span>Источник: SHT41 · GPIO 8/9</span>
        <span>{latest?.rssiDbm !== null && latest?.rssiDbm !== undefined ? `Wi-Fi ${latest.rssiDbm} dBm` : "Wi-Fi —"}</span>
      </div>
    </section>
  );
}

function RoomDetail({
  roomId,
  status,
  fanOn,
  telemetry,
  telemetryRange,
  onTelemetryRangeChange,
  onBack,
  onCamera,
  onEvent,
  onToast,
}: {
  roomId: RoomId;
  status: SystemStatus;
  fanOn: boolean;
  telemetry: TelemetryState;
  telemetryRange: TelemetryRange;
  onTelemetryRangeChange: (range: TelemetryRange) => void;
  onBack: () => void;
  onCamera: () => void;
  onEvent: (id: string) => void;
  onToast: (message: string) => void;
}) {
  const latest = telemetry.data?.latest ?? null;
  const lastSeenMs = latest ? new Date(latest.receivedAt).getTime() : 0;
  const referenceMs = telemetry.data ? new Date(telemetry.data.generatedAt).getTime() : 0;
  const online = lastSeenMs > 0 && referenceMs - lastSeenMs < 180_000;
  const connectionLabel = roomId === "quail"
    ? latest?.rssiDbm !== null && latest?.rssiDbm !== undefined
      ? `${latest.rssiDbm} dBm`
      : online ? "На связи" : "Нет данных"
    : "Стабильно";
  const room = roomId === "quail"
    ? {
        ...rooms.quail,
        status: online ? "Климатический узел работает" : "Ожидаем свежие данные",
        description: latest
          ? `Последнее измерение получено ${formatReadingTime(latest.receivedAt)}`
          : telemetry.error ?? "Хранилище готово к первой записи",
        temperature: formatMetric(latest?.temperatureC, "°C"),
        humidity: formatMetric(latest?.humidityPct, "%"),
      }
    : rooms[roomId];
  const warning = roomId === "quail" && status === "warning";
  const [automation, setAutomation] = useState(true);
  return (
    <div className="client-page room-detail-page">
      <ScreenHeader title={room.name} subtitle={room.meta} onBack={onBack} />
      <button className="room-detail-camera" onClick={onCamera}>
        <img src={room.image} alt={"Живая камера: " + room.name} />
        <span className="client-live-pill"><i /> LIVE</span>
        <b><Camera size={18} /> Открыть камеру</b>
      </button>
      <section className={"room-state-card " + (warning ? "warning" : "")}>
        <span>{warning ? <Fan size={26} /> : <CheckCircle2 size={26} />}</span>
        <div>
          <strong>{warning ? "Вентиляция включена автоматически" : room.status}</strong>
          <p>{warning && fanOn ? "Ток 0,84 А подтверждён. Ожидаем снижение температуры." : room.description}</p>
        </div>
      </section>
      <div className="room-metrics">
        <button onClick={() => onToast("Открыта история температуры")}><Thermometer size={21} /><span><small>Температура</small><strong>{warning ? "28,7 °C" : room.temperature}</strong></span></button>
        <button onClick={() => onToast("Открыта история влажности")}><Droplets size={21} /><span><small>Влажность</small><strong>{room.humidity}</strong></span></button>
        <button onClick={() => onToast("Открыт уровень воды")}><Activity size={21} /><span><small>Вода</small><strong>{room.water}</strong></span></button>
        <button onClick={() => onToast(online ? "Климатический узел на связи" : "Свежих данных от климатического узла нет")}><Wifi size={21} /><span><small>Связь</small><strong>{connectionLabel}</strong></span></button>
      </div>
      {roomId === "quail" && (
        <TelemetryHistory telemetry={telemetry} range={telemetryRange} onRangeChange={onTelemetryRangeChange} />
      )}
      <section className="automation-card">
        <div><span><ShieldCheck size={22} /></span><div><strong>Автоматический режим</strong><small>Безопасные правила работают локально</small></div></div>
        <button
          className={"client-switch " + (automation ? "on" : "")}
          onClick={() => {
            setAutomation((value) => !value);
            onToast(automation ? "Автоматический режим приостановлен" : "Автоматический режим включён");
          }}
          aria-label="Переключить автоматический режим"
        ><i /></button>
      </section>
      <section className="room-history">
        <div className="client-section-title"><h2>История помещения</h2><button onClick={() => onEvent("feeding")}>Вся история</button></div>
        {events.slice(0, 3).map((event) => (
          <button key={event.id} onClick={() => onEvent(event.id)}>
            <span><Check size={17} /></span>
            <div><strong>{event.title}</strong><small>{event.copy}</small></div>
            <time>{event.time}</time>
          </button>
        ))}
      </section>
    </div>
  );
}

function EventsView({
  onBack,
  onEvent,
}: {
  onBack: () => void;
  onEvent: (id: string) => void;
}) {
  return (
    <div className="client-page">
      <ScreenHeader title="Все события" subtitle="Сегодня · 4 значимых события" onBack={onBack} />
      <div className="all-events-list">
        {events.map((event) => (
          <button key={event.id} onClick={() => onEvent(event.id)}>
            <img src={event.image} alt="" />
            <span><small>{event.time} · проверено системой</small><strong>{event.title}</strong><p>{event.copy}</p></span>
            <ChevronRight size={21} />
          </button>
        ))}
      </div>
    </div>
  );
}

function BottomNavigation({
  view,
  onNavigate,
}: {
  view: ClientView;
  onNavigate: (view: ClientView) => void;
}) {
  const activeView = view === "room" || view === "events" ? "farm" : view;
  return (
    <nav className="client-bottom-nav" aria-label="Основная навигация">
      {navItems.map(({ id, label, Icon }) => (
        <button className={activeView === id ? "active" : ""} key={id} onClick={() => onNavigate(id)}>
          <Icon size={25} strokeWidth={2.1} />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}

function Sheet({
  sheet,
  updateStatus,
  onClose,
  onStartUpdate,
  onNavigate,
  onOpenEngineer,
  onToast,
}: {
  sheet: Exclude<SheetState, null>;
  updateStatus: UpdateStatus;
  onClose: () => void;
  onStartUpdate: () => void;
  onNavigate: (view: ClientView) => void;
  onOpenEngineer: () => void;
  onToast: (message: string) => void;
}) {
  const event = sheet.type === "event" ? events.find((item) => item.id === sheet.id) : null;
  const cameraRoom = sheet.type === "camera" ? rooms[sheet.id] : null;

  return (
    <div className="sheet-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="client-sheet" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
        <div className="sheet-grabber" />
        <button className="sheet-close" onClick={onClose} aria-label="Закрыть"><X size={21} /></button>

        {sheet.type === "notifications" && (
          <>
            <div className="sheet-heading"><span><Bell size={23} /></span><div><h2>Уведомления</h2><p>Только события, которые важны человеку</p></div></div>
            <div className="notification-list">
              <button onClick={() => { onClose(); onNavigate("events"); }}><span className="green"><CheckCircle2 size={20} /></span><div><strong>Климат восстановлен</strong><small>Перепелиный цех · 8 минут назад</small></div><ChevronRight size={19} /></button>
              <button onClick={() => { onClose(); onNavigate("more"); }}><span className="amber"><RefreshCw size={20} /></span><div><strong>Доступно обновление Water-01</strong><small>Можно установить без остановки поилки</small></div><ChevronRight size={19} /></button>
              <button onClick={() => { onClose(); onNavigate("events"); }}><span className="blue"><Camera size={20} /></span><div><strong>Первый птенец</strong><small>Инкубатор · событие сохранено</small></div><ChevronRight size={19} /></button>
            </div>
          </>
        )}

        {sheet.type === "profile" && (
          <>
            <div className="profile-sheet-head"><span>ВМ</span><div><h2>Виталий</h2><p>Владелец · хозяйство «Малышево»</p></div></div>
            <div className="sheet-action-list">
              <button onClick={() => onToast("Профиль хозяйства открыт")}><UserRound size={20} /><span><strong>Профиль</strong><small>Личные данные и роль</small></span><ChevronRight size={19} /></button>
              <button onClick={() => onToast("Настройки уведомлений открыты")}><Bell size={20} /><span><strong>Уведомления</strong><small>Каналы и критичность</small></span><ChevronRight size={19} /></button>
              <button onClick={onOpenEngineer}><Wrench size={20} /><span><strong>Инженерный режим</strong><small>Сборка и диагностика</small></span><ChevronRight size={19} /></button>
            </div>
          </>
        )}

        {sheet.type === "update" && (
          <>
            <div className="sheet-heading"><span className="amber"><RefreshCw size={23} /></span><div><h2>Обновление Water-01</h2><p>Поилка · версия 0.3.1 → 0.3.2</p></div></div>
            <div className="update-card">
              <div><ShieldCheck size={22} /><span><strong>Безопасное обновление</strong><small>Поилка продолжит работать по локальным правилам</small></span></div>
              <ul><li><Check size={16} /> Проверена совместимость</li><li><Check size={16} /> Резервная версия сохранена</li><li><Check size={16} /> Автоматический откат доступен</li></ul>
              {updateStatus === "updating" && <div className="update-progress"><i /><span>Устанавливаем и проверяем устройство…</span></div>}
              {updateStatus === "done" && <div className="update-done"><CheckCircle2 size={21} /> Water-01 обновлён и снова на связи</div>}
            </div>
            <button className="sheet-primary" disabled={updateStatus === "updating"} onClick={updateStatus === "done" ? onClose : onStartUpdate}>
              {updateStatus === "ready" ? "Установить обновление" : updateStatus === "updating" ? "Идёт проверка…" : "Готово"}
            </button>
          </>
        )}

        {sheet.type === "feeding" && (
          <>
            <div className="sheet-heading"><span className="amber"><Clock3 size={23} /></span><div><h2>Кормление через 3 часа</h2><p>Перепелиный цех · плановое действие</p></div></div>
            <div className="feeding-summary"><span><strong>12:30</strong><small>Плановое время</small></span><span><strong>2,4 кг</strong><small>Расчётный объём</small></span><span><strong>2,6 дня</strong><small>Остаток корма</small></span></div>
            <p className="sheet-copy">AgroOS напомнит за 30 минут. После кормления камера проверит активность птиц у кормушки.</p>
            <button className="sheet-primary" onClick={() => { onToast("Задача кормления подтверждена"); onClose(); }}>Подтвердить задачу</button>
          </>
        )}

        {event && (
          <>
            <div className="sheet-media"><img src={event.image} alt={event.title} /><span>{event.time}</span><b><Play size={24} fill="currentColor" /></b></div>
            <div className="sheet-heading plain"><div><h2>{event.title}</h2><p>Событие камеры · проверено AgroOS</p></div></div>
            <p className="sheet-copy">{event.copy}</p>
            <div className="event-facts"><span><CheckCircle2 size={18} /><b>Отклонений нет</b></span><span><Camera size={18} /><b>Камера CAM-01</b></span></div>
            <button className="sheet-primary" onClick={onClose}>Понятно</button>
          </>
        )}

        {cameraRoom && (
          <>
            <div className="sheet-media live"><img src={cameraRoom.image} alt={cameraRoom.name} /><span><i /> LIVE</span></div>
            <div className="sheet-heading plain"><div><h2>{cameraRoom.name}</h2><p>Камера на связи · задержка меньше секунды</p></div></div>
            <div className="camera-controls">
              <button onClick={() => onToast("Снимок сохранён в историю")}><Camera size={20} /> Снимок</button>
              <button onClick={() => onToast("Запись события началась")}><Play size={20} /> Запись</button>
              <button onClick={() => onToast("Камера перезапущена")}><Power size={20} /> Перезапуск</button>
            </div>
          </>
        )}

        {sheet.type === "feature" && (
          <>
            <div className="sheet-heading"><span><Sprout size={23} /></span><div><h2>{sheet.title}</h2><p>AgroOS · хозяйство «Малышево»</p></div></div>
            <p className="sheet-copy">{sheet.description}</p>
            <div className="feature-preview">
              <Activity size={24} />
              <div><strong>Данные обновлены сейчас</strong><small>Источники проверены, связь с объектами стабильна</small></div>
            </div>
            <button className="sheet-primary" onClick={onClose}>Закрыть</button>
          </>
        )}
      </section>
    </div>
  );
}

export default function ClientApp({
  status,
  fanOn,
  onRunScenario,
  onOpenEngineer,
}: ClientAppProps) {
  const [view, setView] = useState<ClientView>("farm");
  const [roomId, setRoomId] = useState<RoomId>("quail");
  const [sheet, setSheet] = useState<SheetState>(null);
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus>("ready");
  const [toast, setToast] = useState<string | null>(null);
  const [telemetryRange, setTelemetryRange] = useState<TelemetryRange>("24h");
  const telemetry = useTelemetry("clm-01", telemetryRange);

  const notificationCount = useMemo(() => (updateStatus === "done" ? 2 : 3), [updateStatus]);

  function navigate(next: ClientView) {
    setView(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function openRoom(nextRoom: RoomId) {
    setRoomId(nextRoom);
    navigate("room");
  }

  function notify(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(null), 1800);
  }

  function startUpdate() {
    setUpdateStatus("updating");
    window.setTimeout(() => {
      setUpdateStatus("done");
      notify("Water-01 успешно обновлён");
    }, 1500);
  }

  return (
    <main className="client-app">
      <div className="client-shell">
        <DesktopNavigation view={view} onNavigate={navigate} onOpenEngineer={onOpenEngineer} />
        <div className="client-main">
          <ClientHeader
            notifications={notificationCount}
            onNotifications={() => setSheet({ type: "notifications" })}
            onProfile={() => setSheet({ type: "profile" })}
          />
          {view === "farm" && (
            <FarmHome
              status={status}
              fanOn={fanOn}
              telemetry={telemetry}
              onOpenRoom={openRoom}
              onOpenSheet={setSheet}
              onAllEvents={() => navigate("events")}
            />
          )}
          {view === "cameras" && (
            <CamerasView
              onCamera={(id) => setSheet({ type: "camera", id })}
              onEvent={(id) => setSheet({ type: "event", id })}
              onFeature={(title, description) => setSheet({ type: "feature", title, description })}
            />
          )}
          {view === "assistant" && <AssistantView onToast={notify} />}
          {view === "more" && (
            <MoreView
              status={status}
              onOpenEngineer={onOpenEngineer}
              onRunScenario={onRunScenario}
              onOpenSheet={setSheet}
            />
          )}
          {view === "room" && (
            <RoomDetail
              roomId={roomId}
              status={status}
              fanOn={fanOn}
              telemetry={telemetry}
              telemetryRange={telemetryRange}
              onTelemetryRangeChange={setTelemetryRange}
              onBack={() => navigate("farm")}
              onCamera={() => setSheet({ type: "camera", id: roomId })}
              onEvent={(id) => setSheet({ type: "event", id })}
              onToast={notify}
            />
          )}
          {view === "events" && (
            <EventsView
              onBack={() => navigate("farm")}
              onEvent={(id) => setSheet({ type: "event", id })}
            />
          )}
        </div>
      </div>
      <BottomNavigation view={view} onNavigate={navigate} />
      {sheet && (
        <Sheet
          sheet={sheet}
          updateStatus={updateStatus}
          onClose={() => setSheet(null)}
          onStartUpdate={startUpdate}
          onNavigate={navigate}
          onOpenEngineer={onOpenEngineer}
          onToast={notify}
        />
      )}
      {toast && <div className="client-toast"><CheckCircle2 size={18} /> {toast}</div>}
    </main>
  );
}
