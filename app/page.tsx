"use client";

import { useMemo, useState } from "react";

type View = "home" | "cameras" | "assistant" | "more";

type Device = {
  id: string;
  name: string;
  room: string;
  status: "online" | "attention";
};

const initialDevices: Device[] = [
  { id: "climate-01", name: "Climate-01", room: "Перепелиный цех", status: "online" },
  { id: "vision-01", name: "Vision-01", room: "Перепелиный цех", status: "online" },
  { id: "water-01", name: "Water-01", room: "Поилка", status: "attention" }
];

export default function HomePage() {
  const [view, setView] = useState<View>("home");
  const [temperatureHigh, setTemperatureHigh] = useState(false);
  const [devices, setDevices] = useState<Device[]>(initialDevices);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<string[]>([
    "Срочных проблем нет. Система работает штатно."
  ]);

  const attentionCount = useMemo(
    () => devices.filter((device) => device.status === "attention").length,
    [devices]
  );

  function addDevice() {
    const nextNumber = devices.length + 1;
    setDevices((current) => [
      ...current,
      {
        id: `module-${nextNumber}`,
        name: `Новый модуль ${nextNumber}`,
        room: "Перепелиный цех",
        status: "online"
      }
    ]);
    setView("more");
  }

  function sendQuestion() {
    const value = question.trim();
    if (!value) return;
    setMessages((current) => [
      ...current,
      `Вы: ${value}`,
      temperatureHigh
        ? "AgroOS: Температура повышена. Вентиляция включена автоматически, результат контролируется."
        : "AgroOS: По текущим данным критических отклонений нет."
    ]);
    setQuestion("");
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand"><span className="logo">🌱</span><span>AgroOS</span></div>
        <div className="header-actions">
          <button className="icon-button" aria-label="Уведомления">🔔<b>{attentionCount}</b></button>
          <div className="avatar">В</div>
        </div>
      </header>

      {view === "home" && (
        <section>
          <h1>Доброе утро, Виталий</h1>
          <p className={temperatureHigh ? "system-status warning" : "system-status"}>
            {temperatureHigh ? "Система регулирует климат" : "Хозяйство работает штатно"}
          </p>
          <p className="muted">Последняя проверка: только что</p>

          <div className="dashboard-grid">
            <div>
              <div className="section-heading"><h2>Хозяйство</h2><button onClick={() => setView("cameras")}>Все камеры</button></div>
              <article className="card room-card">
                <div className="camera-feed"><span>● В ЭФИРЕ</span></div>
                <div className="card-body">
                  <h3>Перепелиный цех</h3>
                  <strong className={temperatureHigh ? "warning-text" : "ok-text"}>
                    {temperatureHigh ? "Вентиляция включена автоматически" : "Всё спокойно"}
                  </strong>
                  <p className="muted">
                    {temperatureHigh
                      ? "Температура повышена. AgroOS проверяет результат"
                      : "Перепела активны, климат в норме"}
                  </p>
                  <div className="metric-row">
                    <span>Температура <b>{temperatureHigh ? "28,7" : "22,4"} °C</b></span>
                    <span>Влажность <b>56%</b></span>
                  </div>
                </div>
              </article>
            </div>

            <div>
              <div className="section-heading"><h2>Требуют внимания</h2><span className="counter">{attentionCount}</span></div>
              <div className="card list-card">
                {devices.filter((device) => device.status === "attention").map((device) => (
                  <div className="attention-row" key={device.id}>
                    <span className="attention-icon">⚠️</span>
                    <div><b>Обновить прошивку</b><p>{device.name} · {device.room}</p></div>
                    <button onClick={() => setDevices((items) => items.map((item) => item.id === device.id ? { ...item, status: "online" } : item))}>Обновить</button>
                  </div>
                ))}
                <div className="attention-row">
                  <span className="attention-icon">🕒</span>
                  <div><b>Через 3 часа кормление</b><p>Перепелиный цех</p></div>
                </div>
              </div>

              <div className="section-heading"><h2>Лабораторный режим</h2></div>
              <div className="card simulator-card">
                <div><b>Повышенная температура</b><p className="muted">Проверка автоматической реакции</p></div>
                <button className={temperatureHigh ? "toggle active" : "toggle"} onClick={() => setTemperatureHigh((value) => !value)} aria-label="Переключить эмулятор" />
              </div>
            </div>
          </div>
        </section>
      )}

      {view === "cameras" && (
        <section>
          <h1>Камеры</h1><p className="muted">Живое изображение и события хозяйства</p>
          <div className="camera-grid">
            {["Перепелиный цех", "Инкубатор", "Кормовой склад"].map((room, index) => (
              <article className="card room-card" key={room}>
                <div className={`camera-feed variant-${index}`}><span>● В ЭФИРЕ</span></div>
                <div className="card-body"><h3>{room}</h3><p className="ok-text">Связь стабильна</p></div>
              </article>
            ))}
          </div>
        </section>
      )}

      {view === "assistant" && (
        <section>
          <h1>ИИ-помощник</h1><p className="muted">Отвечает на основе состояния хозяйства</p>
          <div className="card assistant-card">
            {messages.map((message, index) => <div className="message" key={`${message}-${index}`}>{message}</div>)}
            <div className="assistant-input">
              <input value={question} onChange={(event) => setQuestion(event.target.value)} onKeyDown={(event) => event.key === "Enter" && sendQuestion()} placeholder="Задайте вопрос" />
              <button onClick={sendQuestion}>Отправить</button>
            </div>
          </div>
        </section>
      )}

      {view === "more" && (
        <section>
          <h1>Ещё</h1><p className="muted">Устройства, автоматизация и настройка</p>
          <div className="device-grid">
            {devices.map((device) => (
              <article className="card device-card" key={device.id}>
                <div className="device-head"><h3>{device.name}</h3><span className={device.status === "online" ? "pill" : "pill warning-pill"}>{device.status === "online" ? "Работает" : "Внимание"}</span></div>
                <p>{device.room}</p><small>{device.id}</small>
              </article>
            ))}
            <button className="card add-device" onClick={addDevice}><span>＋</span><b>Подключить оборудование</b><small>AgroOS определит возможности устройства</small></button>
          </div>
        </section>
      )}

      <button className="floating-button" onClick={addDevice}>＋</button>
      <nav className="bottom-nav">
        {([
          ["home", "⌂", "Хозяйство"],
          ["cameras", "▣", "Камеры"],
          ["assistant", "◉", "ИИ-помощник"],
          ["more", "☰", "Ещё"]
        ] as const).map(([id, icon, label]) => (
          <button key={id} className={view === id ? "active" : ""} onClick={() => setView(id)}><span>{icon}</span>{label}</button>
        ))}
      </nav>
    </main>
  );
}
