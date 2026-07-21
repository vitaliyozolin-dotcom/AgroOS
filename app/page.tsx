"use client";

import { useMemo, useState } from "react";

type View = "home" | "cameras" | "assistant" | "more";
type Device = { id: string; name: string; room: string; status: "online" | "attention" };

const initialDevices: Device[] = [
  { id: "climate-01", name: "Climate-01", room: "Перепелиный цех", status: "online" },
  { id: "vision-01", name: "Vision-01", room: "Перепелиный цех", status: "online" },
  { id: "water-01", name: "Water-01", room: "Поилка", status: "attention" }
];

const Icon = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => <span className={`ui-icon ${className}`}>{children}</span>;

export default function HomePage() {
  const [view, setView] = useState<View>("home");
  const [devices, setDevices] = useState<Device[]>(initialDevices);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<string[]>(["Срочных проблем нет. Система работает штатно."]);

  const attentionCount = useMemo(() => devices.filter((d) => d.status === "attention").length + 1, [devices]);

  const resolveAttention = () => setDevices((items) => items.map((d) => d.id === "water-01" ? { ...d, status: "online" } : d));
  const sendQuestion = () => {
    const value = question.trim();
    if (!value) return;
    setMessages((items) => [...items, `Вы: ${value}`, "AgroOS: По текущим данным критических отклонений нет."]);
    setQuestion("");
  };

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-leaf">❧</span>
          <span>AgroOS</span>
        </div>
        <div className="header-actions">
          <button className="icon-button" aria-label="Уведомления"><span className="bell-shape">♢</span><b>3</b></button>
          <div className="avatar">В</div>
        </div>
      </header>

      {view === "home" && <section className="home-view">
        <div className="hero-copy">
          <h1>Доброе утро, Виталий! <span className="wave">👋</span></h1>
          <p className="system-status"><span className="status-check">✓</span>Хозяйство работает штатно</p>
          <p className="last-check">Последняя проверка 2 мин назад</p>
        </div>

        <RoomCard
          imageClass="quail-photo"
          title="Перепелиный цех"
          status="Всё спокойно"
          subtitle="Перепела активны, климат в норме"
          icon="🐦"
          accent="green"
        />

        <div className="pager"><i className="active"/><i/><i/><i/></div>

        <RoomCard
          imageClass="incubator-photo"
          title="Инкубатор"
          status="Вывод идёт по плану"
          subtitle="Ожидается 18 птенцов сегодня"
          icon="🥚"
          accent="amber"
        />

        <section className="panel attention-panel">
          <div className="panel-title"><h2><span className="title-bell">♧</span>Требуют внимания</h2><span className="counter">2</span></div>
          {devices.some((d) => d.id === "water-01" && d.status === "attention") && <div className="attention-row">
            <Icon className="warning-icon">!</Icon>
            <div className="attention-copy"><b>Обновить прошивку</b><p>Water-01 (Поилка)</p></div>
            <button className="action-button green-action" onClick={resolveAttention}>Обновить</button>
          </div>}
          <div className="attention-row">
            <Icon className="clock-icon">◷</Icon>
            <div className="attention-copy"><b>Через 3 часа кормление</b><p>Перепелиный цех</p></div>
            <button className="action-button neutral-action">Подробнее</button>
          </div>
        </section>

        <section className="panel events-panel">
          <div className="panel-title"><h2>Последние события</h2><button className="text-button">Смотреть все</button></div>
          <div className="events-strip">
            <EventCard image="event-night" time="03:15" title="Ночная активность" />
            <EventCard image="event-feed" time="07:42" title="Птицы у кормушки" />
            <EventCard image="event-eggs" time="08:21" title="Снесено яйцо" />
            <EventCard image="event-chick" time="11:08" title="Первый птенец" />
          </div>
        </section>
      </section>}

      {view === "cameras" && <section className="secondary-view"><h1>Камеры</h1><p>Живое изображение и события хозяйства</p><RoomCard imageClass="quail-photo" title="Перепелиный цех" status="Связь стабильна" subtitle="Камера работает" icon="🐦" accent="green"/><div className="stack-gap"/><RoomCard imageClass="incubator-photo" title="Инкубатор" status="Связь стабильна" subtitle="Камера работает" icon="🥚" accent="amber"/></section>}

      {view === "assistant" && <section className="secondary-view"><h1>ИИ-помощник</h1><p>Отвечает на основе состояния хозяйства</p><div className="panel assistant-card">{messages.map((m, i) => <div className="message" key={i}>{m}</div>)}<div className="assistant-input"><input value={question} onChange={(e) => setQuestion(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendQuestion()} placeholder="Задайте вопрос"/><button onClick={sendQuestion}>Отправить</button></div></div></section>}

      {view === "more" && <section className="secondary-view"><h1>Ещё</h1><p>Устройства, автоматизация и настройка</p><div className="device-grid">{devices.map((d) => <article className="panel device-card" key={d.id}><h3>{d.name}</h3><p>{d.room}</p><span className={d.status === "online" ? "pill" : "pill warning-pill"}>{d.status === "online" ? "Работает" : "Внимание"}</span></article>)}</div></section>}

      <nav className="bottom-nav">
        <NavButton active={view === "home"} icon="⌂" label="Хозяйство" onClick={() => setView("home")}/>
        <NavButton active={view === "cameras"} icon="▣" label="Камеры" onClick={() => setView("cameras")}/>
        <NavButton active={view === "assistant"} icon="▢" label="ИИ-помощник" onClick={() => setView("assistant")}/>
        <NavButton active={view === "more"} icon="☰" label="Ещё" onClick={() => setView("more")}/>
      </nav>
    </main>
  );
}

function RoomCard({ imageClass, title, status, subtitle, icon, accent }: { imageClass:string; title:string; status:string; subtitle:string; icon:string; accent:"green"|"amber" }) {
  return <article className="room-card">
    <div className={`camera-feed ${imageClass}`}><span className="live-badge">● LIVE</span><button className="more-button">•••</button></div>
    <div className="room-summary"><div className={`round-icon ${accent}`}>{icon}</div><div className="room-copy"><h3>{title}</h3><strong className={accent === "green" ? "ok-text" : "amber-text"}>{status}</strong><p>{subtitle}</p></div><button className="chevron">›</button></div>
  </article>;
}

function EventCard({ image, time, title }: { image:string; time:string; title:string }) {
  return <article className="event-card"><div className={`event-image ${image}`}><span>{time}</span><b>▶</b></div><p>{title}</p></article>;
}

function NavButton({ active, icon, label, onClick }: { active:boolean; icon:string; label:string; onClick:()=>void }) {
  return <button className={active ? "active" : ""} onClick={onClick}><span>{icon}</span><b>{label}</b></button>;
}
