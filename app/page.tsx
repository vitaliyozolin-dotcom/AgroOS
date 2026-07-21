"use client";

import { useMemo, useState } from "react";

type View = "home" | "cameras" | "assistant" | "more";
type Device = { id: string; name: string; room: string; status: "online" | "attention" };

const initialDevices: Device[] = [
  { id: "climate-01", name: "Climate-01", room: "Перепелиный цех", status: "online" },
  { id: "vision-01", name: "Vision-01", room: "Перепелиный цех", status: "online" },
  { id: "water-01", name: "Water-01", room: "Поилка", status: "attention" }
];

const events = [
  { time: "03:15", title: "Ночная активность", image: "quail-night" },
  { time: "07:42", title: "Птицы у кормушки", image: "quail-feed" },
  { time: "08:21", title: "Снесено яйцо", image: "eggs" },
  { time: "11:08", title: "Первый птенец", image: "chick" }
];

export default function HomePage() {
  const [view, setView] = useState<View>("home");
  const [temperatureHigh, setTemperatureHigh] = useState(false);
  const [devices, setDevices] = useState<Device[]>(initialDevices);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<string[]>(["Срочных проблем нет. Система работает штатно."]);

  const attentionCount = useMemo(() => devices.filter((device) => device.status === "attention").length, [devices]);

  function addDevice() {
    const next = devices.length + 1;
    setDevices((items) => [...items, { id: `module-${next}`, name: `Новый модуль ${next}`, room: "Перепелиный цех", status: "online" }]);
    setView("more");
  }

  function sendQuestion() {
    const value = question.trim();
    if (!value) return;
    setMessages((items) => [...items, `Вы: ${value}`, temperatureHigh ? "AgroOS: Температура повышена. Вентиляция включена автоматически." : "AgroOS: Критических отклонений нет."]);
    setQuestion("");
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand"><span className="leaf-mark">◒</span><span>AgroOS</span></div>
        <div className="header-actions">
          <button className="icon-button bell" aria-label="Уведомления"><span>♢</span><b>{attentionCount + 1}</b></button>
          <div className="avatar">В</div>
        </div>
      </header>

      {view === "home" && (
        <section className="home-view">
          <div className="hero-copy">
            <h1>Доброе утро, Виталий! <span className="wave">👋</span></h1>
            <p className={temperatureHigh ? "system-status warning" : "system-status"}><span className="status-check">✓</span>{temperatureHigh ? "Система регулирует климат" : "Хозяйство работает штатно"}</p>
            <p className="muted last-check">Последняя проверка 2 мин назад</p>
          </div>

          <article className="room-card primary-room">
            <div className="camera-feed quail-photo">
              <span className="live-badge">● LIVE</span>
              <button className="more-button">•••</button>
            </div>
            <div className="room-summary">
              <div className="round-icon green">◌</div>
              <div className="room-copy">
                <h3>Перепелиный цех</h3>
                <strong className={temperatureHigh ? "warning-text" : "ok-text"}>{temperatureHigh ? "Вентиляция включена" : "Всё спокойно"}</strong>
                <p>Перепела активны, климат в норме</p>
              </div>
              <button className="chevron">›</button>
            </div>
          </article>

          <div className="pager"><i className="active" /><i /><i /><i /></div>

          <article className="room-card secondary-room">
            <div className="camera-feed incubator-photo">
              <span className="live-badge">● LIVE</span>
              <button className="more-button">•••</button>
            </div>
            <div className="room-summary">
              <div className="round-icon amber">◉</div>
              <div className="room-copy">
                <h3>Инкубатор</h3>
                <strong className="amber-text">Вывод идёт по плану</strong>
                <p>Ожидается 18 птенцов сегодня</p>
              </div>
              <button className="chevron">›</button>
            </div>
          </article>

          <section className="panel attention-panel">
            <div className="panel-title"><h2>Требуют внимания</h2><span className="counter">2</span></div>
            {devices.filter((device) => device.status === "attention").map((device) => (
              <div className="attention-row" key={device.id}>
                <span className="line-icon amber-outline">△</span>
                <div><b>Обновить прошивку</b><p>{device.name} (Поилка)</p></div>
                <button onClick={() => setDevices((items) => items.map((item) => item.id === device.id ? { ...item, status: "online" } : item))}>Обновить</button>
              </div>
            ))}
            <div className="attention-row">
              <span className="line-icon clock-icon">◷</span>
              <div><b>Через 3 часа кормление</b><p>Перепелиный цех</p></div>
              <button className="plain-button">Подробнее</button>
            </div>
          </section>

          <section className="panel events-panel">
            <div className="panel-title"><h2>Последние события</h2><button className="text-button">Смотреть все</button></div>
            <div className="events-strip">
              {events.map((event) => (
                <article className="event-card" key={event.time}>
                  <div className={`event-image ${event.image}`}><span>{event.time}</span><b>▶</b></div>
                  <p>{event.title}</p>
                </article>
              ))}
            </div>
          </section>
        </section>
      )}

      {view === "cameras" && (
        <section><h1>Камеры</h1><p className="muted">Живое изображение и события хозяйства</p><div className="camera-grid">{["Перепелиный цех", "Инкубатор", "Кормовой склад"].map((room, index) => <article className="room-card" key={room}><div className={`camera-feed ${index === 0 ? "quail-photo" : index === 1 ? "incubator-photo" : "storage-photo"}`}><span className="live-badge">● LIVE</span></div><div className="room-summary"><div className="round-icon green">◌</div><div className="room-copy"><h3>{room}</h3><strong className="ok-text">Связь стабильна</strong></div></div></article>)}</div></section>
      )}

      {view === "assistant" && (
        <section><h1>ИИ-помощник</h1><p className="muted">Отвечает на основе состояния хозяйства</p><div className="panel assistant-card">{messages.map((message, index) => <div className="message" key={`${message}-${index}`}>{message}</div>)}<div className="assistant-input"><input value={question} onChange={(event) => setQuestion(event.target.value)} onKeyDown={(event) => event.key === "Enter" && sendQuestion()} placeholder="Задайте вопрос" /><button onClick={sendQuestion}>Отправить</button></div></div></section>
      )}

      {view === "more" && (
        <section><h1>Ещё</h1><p className="muted">Устройства, автоматизация и настройка</p><div className="device-grid">{devices.map((device) => <article className="panel device-card" key={device.id}><div className="device-head"><h3>{device.name}</h3><span className={device.status === "online" ? "pill" : "pill warning-pill"}>{device.status === "online" ? "Работает" : "Внимание"}</span></div><p>{device.room}</p><small>{device.id}</small></article>)}<button className="panel add-device" onClick={addDevice}><span>＋</span><b>Подключить оборудование</b><small>AgroOS определит возможности устройства</small></button></div></section>
      )}

      {view === "home" && <button className="floating-button" onClick={addDevice}>＋</button>}
      <nav className="bottom-nav">{([ ["home", "⌂", "Хозяйство"], ["cameras", "▣", "Камеры"], ["assistant", "▢", "ИИ-помощник"], ["more", "☰", "Ещё"] ] as const).map(([id, icon, label]) => <button key={id} className={view === id ? "active" : ""} onClick={() => setView(id)}><span>{icon}</span>{label}</button>)}</nav>
    </main>
  );
}
