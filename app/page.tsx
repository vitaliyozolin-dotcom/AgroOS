"use client";

import { useMemo, useState } from "react";
import ClientApp from "./client-app";

type Mode = "owner" | "engineer";
type SystemStatus = "normal" | "warning";
type TestStatus = "idle" | "running" | "passed";

const ownerNavigation = [
  { icon: "⌂", label: "Главная", active: true },
  { icon: "▦", label: "Помещения" },
  { icon: "◉", label: "События", badge: "1" },
  { icon: "✓", label: "Задачи" },
];

const roomData = [
  {
    name: "Перепелиный цех",
    meta: "Зона 01 · 35 птиц",
    temperature: "24,6 °C",
    humidity: "58%",
    state: "Штатно",
    tone: "green",
  },
  {
    name: "Инкубатор",
    meta: "Зона 02 · цикл 7/17",
    temperature: "37,7 °C",
    humidity: "61%",
    state: "Штатно",
    tone: "amber",
  },
];

function LeafMark() {
  return (
    <span className="leaf-mark" aria-hidden="true">
      <i />
      <i />
    </span>
  );
}

function ModeSwitch({ mode, onChange }: { mode: Mode; onChange: (mode: Mode) => void }) {
  return (
    <div className="mode-switch" aria-label="Режим приложения">
      <button className={mode === "owner" ? "active" : ""} onClick={() => onChange("owner")}>
        Владелец
      </button>
      <button className={mode === "engineer" ? "active" : ""} onClick={() => onChange("engineer")}>
        Инженер
      </button>
    </div>
  );
}

function Sidebar({ mode, onModeChange }: { mode: Mode; onModeChange: (mode: Mode) => void }) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <LeafMark />
        <span>AgroOS</span>
      </div>

      <div className="farm-mini">
        <span className="farm-avatar">М</span>
        <div>
          <strong>Малышево</strong>
          <small>Перепелиное хозяйство</small>
        </div>
        <span className="chevron">⌄</span>
      </div>

      <nav className="side-nav" aria-label="Основная навигация">
        <span className="nav-caption">ХОЗЯЙСТВО</span>
        {ownerNavigation.map((item) => (
          <button className={item.active && mode === "owner" ? "active" : ""} key={item.label}>
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>
            {item.badge && <span className="nav-badge">{item.badge}</span>}
          </button>
        ))}
        <span className="nav-caption technical">СИСТЕМА</span>
        <button className={mode === "engineer" ? "active" : ""} onClick={() => onModeChange("engineer")}>
          <span className="nav-icon">⌘</span>
          <span>Инженерная</span>
          <span className="beta">BETA</span>
        </button>
        <button>
          <span className="nav-icon">⚙</span>
          <span>Настройки</span>
        </button>
      </nav>

      <div className="sidebar-bottom">
        <ModeSwitch mode={mode} onChange={onModeChange} />
        <div className="user-card">
          <span className="user-avatar">ВМ</span>
          <div>
            <strong>Виталий</strong>
            <small>Владелец</small>
          </div>
          <span className="more">•••</span>
        </div>
      </div>
    </aside>
  );
}

function MobileHeader({ mode, onModeChange }: { mode: Mode; onModeChange: (mode: Mode) => void }) {
  return (
    <header className="mobile-header">
      <div className="brand">
        <LeafMark />
        <span>AgroOS</span>
      </div>
      <ModeSwitch mode={mode} onChange={onModeChange} />
      <button className="avatar-button" aria-label="Профиль пользователя">ВМ</button>
    </header>
  );
}

function StatusHero({ status, fanOn }: { status: SystemStatus; fanOn: boolean }) {
  const warning = status === "warning";
  return (
    <section className={`status-hero ${warning ? "warning" : ""}`}>
      <div className="status-illustration" aria-hidden="true">
        <span className="sun" />
        <span className="barn-roof" />
        <span className="barn-body" />
        <span className="field-line one" />
        <span className="field-line two" />
      </div>
      <div className="status-copy">
        <span className="eyebrow">СОСТОЯНИЕ ХОЗЯЙСТВА</span>
        <div className="status-title-row">
          <span className={`status-seal ${warning ? "warning" : ""}`}>{warning ? "!" : "✓"}</span>
          <h1>{warning ? "Температура выше нормы" : "Всё работает штатно"}</h1>
        </div>
        <p>
          {warning
            ? fanOn
              ? "AgroOS включила вентиляцию и проверяет физический результат. Ваше участие пока не требуется."
              : "Отклонение обнаружено. Система проверяет доступные безопасные действия."
            : "Критических отклонений нет. Автоматика активна, данные обновлены несколько секунд назад."}
        </p>
      </div>
      <div className="hero-meta">
        <span className="live-dot" />
        LIVE
      </div>
    </section>
  );
}

function MetricCard({ icon, label, value, detail, tone = "green" }: { icon: string; label: string; value: string; detail: string; tone?: string }) {
  return (
    <article className="metric-card">
      <div className={`metric-icon ${tone}`}>{icon}</div>
      <div className="metric-main">
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
      <span className="metric-detail">{detail}</span>
    </article>
  );
}

function RoomCard({ room, warning }: { room: (typeof roomData)[number]; warning?: boolean }) {
  return (
    <article className={`room-card ${room.tone} ${warning ? "room-warning" : ""}`}>
      <div className="room-visual" aria-hidden="true">
        <span className="room-grid" />
        <span className="bird b1">●</span>
        <span className="bird b2">●</span>
        <span className="bird b3">●</span>
      </div>
      <div className="room-content">
        <div className="room-heading">
          <div>
            <h3>{room.name}</h3>
            <p>{room.meta}</p>
          </div>
          <span className={`room-state ${warning ? "warning" : ""}`}>{warning ? "Внимание" : room.state}</span>
        </div>
        <div className="room-values">
          <span><i>Температура</i><strong>{warning ? "31,8 °C" : room.temperature}</strong></span>
          <span><i>Влажность</i><strong>{room.humidity}</strong></span>
        </div>
        <button className="text-button">Открыть помещение <span>→</span></button>
      </div>
    </article>
  );
}

function EventTimeline({ status, fanOn }: { status: SystemStatus; fanOn: boolean }) {
  const warning = status === "warning";
  return (
    <section className="panel event-panel">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">ПОСЛЕДНИЕ СОБЫТИЯ</span>
          <h2>Что произошло</h2>
        </div>
        <button className="ghost-button">Вся история</button>
      </div>
      <div className="timeline">
        {warning && (
          <div className="timeline-item important">
            <span className="timeline-icon">!</span>
            <div>
              <strong>{fanOn ? "Вентиляция включена автоматически" : "Обнаружен рост температуры"}</strong>
              <p>{fanOn ? "Реле CLM-01-FAN-01 подтверждено · ожидаем снижение температуры" : "Перепелиный цех · верхний датчик SHT41"}</p>
            </div>
            <time>сейчас</time>
          </div>
        )}
        <div className="timeline-item">
          <span className="timeline-icon water">≈</span>
          <div>
            <strong>Уровень воды восстановлен</strong>
            <p>Основной бак · автодолив завершён</p>
          </div>
          <time>08:42</time>
        </div>
        <div className="timeline-item">
          <span className="timeline-icon check">✓</span>
          <div>
            <strong>Утренний контроль пройден</strong>
            <p>12 устройств на связи · ошибок нет</p>
          </div>
          <time>07:10</time>
        </div>
      </div>
    </section>
  );
}

function ActionCard({ status, fanOn }: { status: SystemStatus; fanOn: boolean }) {
  const warning = status === "warning";
  return (
    <section className={`panel action-panel ${warning ? "warning" : ""}`}>
      <span className="eyebrow">AGROOS УЖЕ СДЕЛАЛА</span>
      <div className="action-symbol">{warning ? (fanOn ? "↻" : "…") : "✓"}</div>
      <h2>{warning ? (fanOn ? "Включила основной вентилятор" : "Проверяет контур вентиляции") : "Проверила ночной режим"}</h2>
      <p>{warning ? (fanOn ? "Команда получена устройством, ток двигателя подтверждён." : "Проверяем реле, питание и возможность безопасного запуска.") : "Температура, вода и связь оставались в норме. Ночных задач для человека нет."}</p>
      <div className="action-footer">
        <span>{warning ? "Контроль результата" : "Завершено"}</span>
        <strong>{warning ? (fanOn ? "до 09:24" : "в процессе") : "06:58"}</strong>
      </div>
    </section>
  );
}

// Legacy desktop composition retained while the canonical client shell is rolled out.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function OwnerDashboard({ status, fanOn, onDemo }: { status: SystemStatus; fanOn: boolean; onDemo: () => void }) {
  const warning = status === "warning";
  return (
    <div className="page owner-page">
      <div className="page-topbar">
        <div>
          <p className="welcome">Доброе утро, Виталий</p>
          <p className="date-line">Среда, 22 июля · хозяйство «Малышево»</p>
        </div>
        <div className="topbar-actions">
          <button className="demo-button" onClick={onDemo}>{warning ? "Вернуть норму" : "Проверить сценарий"}</button>
          <button className="round-button" aria-label="Уведомления">♢<span /></button>
        </div>
      </div>

      <StatusHero status={status} fanOn={fanOn} />

      <section className="metrics-grid" aria-label="Главные показатели">
        <MetricCard icon="°" label="Средняя температура" value={warning ? "28,7 °C" : "24,6 °C"} detail={warning ? "выше профиля" : "в пределах нормы"} tone={warning ? "amber" : "green"} />
        <MetricCard icon="≈" label="Вода" value="87%" detail="запас на 2,4 дня" tone="blue" />
        <MetricCard icon="ϟ" label="Энергия сегодня" value="5,8 кВт·ч" detail="−8% к среднему" tone="yellow" />
        <MetricCard icon="⌁" label="Устройства" value="12 / 12" detail="все на связи" tone="violet" />
      </section>

      <section className="rooms-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">ПОМЕЩЕНИЯ</span>
            <h2>Живые зоны хозяйства</h2>
          </div>
          <button className="ghost-button desktop-only">Все помещения</button>
        </div>
        <div className="rooms-grid">
          {roomData.map((room, index) => <RoomCard key={room.name} room={room} warning={warning && index === 0} />)}
        </div>
      </section>

      <section className="lower-grid">
        <EventTimeline status={status} fanOn={fanOn} />
        <ActionCard status={status} fanOn={fanOn} />
      </section>
    </div>
  );
}

const buildSteps = [
  { label: "Комплект", caption: "Сверяем BOM" },
  { label: "Проводка", caption: "Соединяем безопасно" },
  { label: "Прошивка", caption: "Загружаем Runtime" },
  { label: "Обнаружение", caption: "Получаем паспорт" },
  { label: "Испытания", caption: "Подтверждаем результат" },
];

const initialBom = [
  { id: "esp", name: "ESP32-S3 DevKitC-1 N16R8", detail: "Узел управления · USB-C", checked: true, required: true },
  { id: "sht", name: "SHT41", detail: "Температура и влажность", checked: true, required: true },
  { id: "relay", name: "Релейный модуль 5 В", detail: "1 канал · сухой контакт", checked: true, required: true },
  { id: "fan", name: "Вентилятор 12 В", detail: "Лабораторная низковольтная нагрузка", checked: true, required: true },
  { id: "psu", name: "Стабилизированный БП 5 В", detail: "Отдельное питание релейной платы", checked: false, required: true },
  { id: "feedback", name: "Датчик тока / тахометр", detail: "Независимое подтверждение вентилятора", checked: false, required: true },
  { id: "mux", name: "I²C-мультиплексор", detail: "Нужен при подключении второго SHT41", checked: false, required: false },
];

const nodeTests = [
  { id: "T-001", name: "Питание и запуск", expectation: "device_id опубликован" },
  { id: "T-003", name: "Чтение SHT41", expectation: "качество GOOD" },
  { id: "T-006", name: "Порог вентиляции", expectation: "реле не дребезжит" },
  { id: "T-008", name: "Verified Actuation", expectation: "ток/обороты подтверждены" },
];

function StageBadge({ index, current, completed }: { index: number; current: number; completed: boolean }) {
  return <span className={`stage-number ${current === index ? "current" : ""} ${completed ? "completed" : ""}`}>{completed ? "✓" : index + 1}</span>;
}

function BomStage({ bom, onToggle, onNext }: { bom: typeof initialBom; onToggle: (id: string) => void; onNext: () => void }) {
  const missing = bom.filter((item) => item.required && !item.checked).length;
  return (
    <div className="stage-content">
      <div className="stage-title">
        <div>
          <span className="eyebrow">ШАГ 1 ИЗ 5</span>
          <h2>Проверяем комплект стенда</h2>
          <p>AgroOS не разрешит сборку, пока обязательные компоненты физически не подтверждены.</p>
        </div>
        <span className={`completion-chip ${missing === 0 ? "ready" : ""}`}>{missing === 0 ? "Комплект готов" : `Не хватает: ${missing}`}</span>
      </div>
      <div className="bom-list">
        {bom.map((item) => (
          <button key={item.id} className={`bom-item ${item.checked ? "checked" : ""}`} onClick={() => onToggle(item.id)}>
            <span className="check-box">{item.checked ? "✓" : ""}</span>
            <span className="bom-copy"><strong>{item.name}</strong><small>{item.detail}</small></span>
            <span className={`requirement ${item.required ? "required" : "optional"}`}>{item.required ? "Обязательно" : "Опция"}</span>
          </button>
        ))}
      </div>
      <div className="safety-note"><span>!</span><p><strong>Только безопасное низкое напряжение.</strong> На макетной плате запрещено подключать 230 В. Силовую часть позднее собирает квалифицированный специалист.</p></div>
      <div className="stage-actions"><span>{missing ? "Отметьте обязательные дополнения к исходному BOM" : "Можно переходить к проводке"}</span><button className="primary-button" disabled={missing > 0} onClick={onNext}>Перейти к схеме <b>→</b></button></div>
    </div>
  );
}

function WiringStage({ onNext }: { onNext: () => void }) {
  return (
    <div className="stage-content">
      <div className="stage-title">
        <div><span className="eyebrow">ШАГ 2 ИЗ 5</span><h2>Соединяем Climate Node</h2><p>Показываем не только контакт, но и назначение, цвет, питание и способ проверки.</p></div>
        <span className="completion-chip draft">Макетная схема</span>
      </div>
      <div className="wiring-layout">
        <div className="wiring-diagram" aria-label="Схема соединений ESP32, SHT41 и реле">
          <div className="board board-esp"><span className="board-led"/><strong>ESP32-S3</strong><small>CLM-01</small><i>USB-C</i></div>
          <div className="wire wire-one"><span>SDA / SCL</span></div>
          <div className="board board-sensor"><strong>SHT41</strong><small>T + RH</small></div>
          <div className="wire wire-two"><span>CTRL 3,3 В</span></div>
          <div className="board board-relay"><span className="relay-led"/><strong>Relay 01</strong><small>5 В отдельно</small></div>
          <div className="wire wire-three"><span>12 В</span></div>
          <div className="board board-fan"><span className="fan-blades">✣</span><strong>Fan 12 V</strong><small>feedback</small></div>
        </div>
        <div className="wiring-table-wrap">
          <table className="wiring-table">
            <thead><tr><th>Сигнал</th><th>Откуда</th><th>Куда</th><th>Цвет</th><th>Статус</th></tr></thead>
            <tbody>
              <tr><td>3V3</td><td>ESP32 3V3</td><td>SHT41 VCC</td><td><i className="cable red"/>Красный</td><td><span className="table-status ready">готово</span></td></tr>
              <tr><td>GND</td><td>ESP32 GND</td><td>SHT41 GND</td><td><i className="cable black"/>Чёрный</td><td><span className="table-status ready">готово</span></td></tr>
              <tr><td>I²C SDA</td><td>GPIO 8*</td><td>SHT41 SDA</td><td><i className="cable green"/>Зелёный</td><td><span className="table-status draft">сверить</span></td></tr>
              <tr><td>I²C SCL</td><td>GPIO 9*</td><td>SHT41 SCL</td><td><i className="cable yellow"/>Жёлтый</td><td><span className="table-status draft">сверить</span></td></tr>
              <tr><td>Relay CTRL</td><td>GPIO 18*</td><td>Relay IN1</td><td><i className="cable orange"/>Оранжевый</td><td><span className="table-status draft">тест 3,3 В</span></td></tr>
            </tbody>
          </table>
          <p className="table-footnote">* GPIO — конфигурация лабораторного профиля. Перед пайкой сверяем маркировку именно вашей ревизии платы и сохраняем фото монтажа.</p>
        </div>
      </div>
      <div className="stage-actions"><span>Следующий шаг не подаст питание на нагрузку</span><button className="primary-button" onClick={onNext}>Проводка проверена <b>→</b></button></div>
    </div>
  );
}

function FirmwareStage({ flashed, onFlash, onNext }: { flashed: boolean; onFlash: () => void; onNext: () => void }) {
  return (
    <div className="stage-content">
      <div className="stage-title">
        <div><span className="eyebrow">ШАГ 3 ИЗ 5</span><h2>Загружаем AgroOS Runtime</h2><p>Узел получает постоянную идентичность, драйверы, безопасный профиль и локальные правила.</p></div>
        <span className={`completion-chip ${flashed ? "ready" : ""}`}>{flashed ? "Прошивка записана" : "Ожидает USB"}</span>
      </div>
      <div className="firmware-grid">
        <div className="firmware-package">
          <span className="package-icon">⌘</span>
          <div><small>ПАКЕТ ПРОШИВКИ</small><h3>agro-node-climate</h3><p>v0.1.0-lab · ESP32-S3 · signed profile</p></div>
          <span className="hash">SHA256<br/><b>84f1…c92a</b></span>
        </div>
        <div className="firmware-contract">
          <span>В пакет входят</span>
          <ul><li>Identity Service и постоянный UUID</li><li>Driver SHT4x и контроль качества данных</li><li>Relay Manager с гистерезисом</li><li>Watchdog, offline journal и safe state</li></ul>
        </div>
      </div>
      <div className={`flash-console ${flashed ? "done" : ""}`}>
        <div className="console-top"><span>USB · /dev/ttyACM0</span><i>{flashed ? "готово" : "подключено"}</i></div>
        <pre>{flashed ? "> chip ESP32-S3 detected\n> erase completed\n> writing 100%\n> verify OK\n> rebooting into agro-node-climate v0.1.0" : "> chip ESP32-S3 detected\n> flash size 16 MB\n> waiting for operator…"}</pre>
      </div>
      <div className="stage-actions"><span>{flashed ? "Контрольная сумма совпала, можно искать устройство" : "Во время записи нагрузка остаётся отключённой"}</span>{flashed ? <button className="primary-button" onClick={onNext}>Найти устройство <b>→</b></button> : <button className="primary-button" onClick={onFlash}>Записать прошивку</button>}</div>
    </div>
  );
}

function DiscoveryStage({ connected, onConnect, onNext }: { connected: boolean; onConnect: () => void; onNext: () => void }) {
  return (
    <div className="stage-content">
      <div className="stage-title">
        <div><span className="eyebrow">ШАГ 4 ИЗ 5</span><h2>AgroOS обнаруживает узел</h2><p>Сначала система получает паспорт и capabilities. Назначение помещению подтверждает человек.</p></div>
        <span className={`completion-chip ${connected ? "ready" : ""}`}>{connected ? "Узел ACTIVE" : "Поиск в локальной сети"}</span>
      </div>
      <div className="discovery-radar">
        <div className={`radar ${connected ? "found" : ""}`}><span/><i/><b>{connected ? "✓" : "⌁"}</b></div>
        <div className="found-device">
          <span className="device-state"><i/> {connected ? "ONLINE" : "SIMULATOR READY"}</span>
          <h3>Climate Node CLM-01</h3>
          <p>ESP32-S3 DevKitC-1 · MAC …A7:4C · firmware 0.1.0-lab</p>
          <dl><div><dt>Назначение</dt><dd>Перепелиный цех · зона main</dd></div><div><dt>Паспорт</dt><dd>agro.device/1.0</dd></div><div><dt>Последний запуск</dt><dd>{connected ? "сейчас" : "ещё не подключён"}</dd></div></dl>
        </div>
      </div>
      <div className="capability-row">
        <span><i>°</i><b>temperature.measure</b><small>SHT41 · °C</small></span>
        <span><i>≈</i><b>humidity.measure</b><small>SHT41 · %</small></span>
        <span><i>↻</i><b>ventilation.switch</b><small>Relay 01</small></span>
        <span><i>✓</i><b>ventilation.verify</b><small>Current / tacho</small></span>
      </div>
      <div className="stage-actions"><span>Это симулятор того же контракта, который будет использовать реальный ESP32</span>{connected ? <button className="primary-button" onClick={onNext}>Перейти к тестам <b>→</b></button> : <button className="primary-button" onClick={onConnect}>Подключить симулятор</button>}</div>
    </div>
  );
}

function TestStage({ statuses, onRun, onRunAll, relayOn, onRelayChange }: { statuses: Record<string, TestStatus>; onRun: (id: string) => void; onRunAll: () => void; relayOn: boolean; onRelayChange: (value: boolean) => void }) {
  const passed = nodeTests.filter((test) => statuses[test.id] === "passed").length;
  return (
    <div className="stage-content">
      <div className="stage-title">
        <div><span className="eyebrow">ШАГ 5 ИЗ 5</span><h2>Проверяем физический результат</h2><p>Команда считается выполненной только после независимого сигнала тока, оборотов или воздушного потока.</p></div>
        <span className={`completion-chip ${passed === nodeTests.length ? "ready" : ""}`}>{passed} / {nodeTests.length} пройдено</span>
      </div>
      <div className="test-layout">
        <div className="live-node-card">
          <div className="live-node-head"><span><i/> CLM-01 ONLINE</span><small>обновлено сейчас</small></div>
          <div className="live-readings"><span><small>Температура</small><strong>24,7 °C</strong><i>GOOD</i></span><span><small>Влажность</small><strong>57,8%</strong><i>GOOD</i></span><span><small>Ток вентилятора</small><strong>{relayOn ? "0,84 A" : "0,00 A"}</strong><i>{relayOn ? "CONFIRMED" : "OFF"}</i></span></div>
          <div className="relay-control"><div><span>Основной вентилятор</span><small>Relay 01 · безопасная нагрузка 12 В</small></div><button className={`switch ${relayOn ? "on" : ""}`} onClick={() => onRelayChange(!relayOn)} aria-label="Переключить основной вентилятор"><i/></button></div>
        </div>
        <div className="tests-card">
          <div className="tests-head"><div><span className="eyebrow">ACCEPTANCE MATRIX</span><h3>Обязательные испытания</h3></div><button className="secondary-button" onClick={onRunAll}>Запустить все</button></div>
          <div className="tests-list">
            {nodeTests.map((test) => {
              const state = statuses[test.id] ?? "idle";
              return <button key={test.id} className={`test-row ${state}`} onClick={() => onRun(test.id)} disabled={state === "running"}><span className="test-id">{test.id}</span><span className="test-copy"><strong>{test.name}</strong><small>{test.expectation}</small></span><span className="test-result">{state === "passed" ? "✓ Пройден" : state === "running" ? "••• Проверка" : "Запустить →"}</span></button>;
            })}
          </div>
        </div>
      </div>
      {passed === nodeTests.length && <div className="acceptance-banner"><span>✓</span><div><strong>Climate Node v0.1 готов к пилотному наблюдению</strong><p>Автоматическое управление остаётся ограниченным лабораторным профилем до установки на объекте и повторной приёмки.</p></div></div>}
    </div>
  );
}

function EngineeringWorkbench({ onOpenOwner, onFanChange }: { onOpenOwner: () => void; onFanChange: (value: boolean) => void }) {
  const [stage, setStage] = useState(0);
  const [maxStage, setMaxStage] = useState(0);
  const [bom, setBom] = useState(initialBom);
  const [flashed, setFlashed] = useState(false);
  const [connected, setConnected] = useState(false);
  const [relayOn, setRelayOn] = useState(false);
  const [statuses, setStatuses] = useState<Record<string, TestStatus>>({});
  const [consoleLines, setConsoleLines] = useState(["09:14:02  workbench ready", "09:14:03  simulator transport available"]);

  function pushConsole(line: string) { setConsoleLines((current) => [...current.slice(-4), `${new Date().toLocaleTimeString("ru-RU", { hour12: false })}  ${line}`]); }
  function goNext() { const next = Math.min(4, stage + 1); setStage(next); setMaxStage((current) => Math.max(current, next)); }
  function toggleBom(id: string) { setBom((items) => items.map((item) => item.id === id ? { ...item, checked: !item.checked } : item)); }
  function flash() { pushConsole("flash started · agro-node-climate 0.1.0"); window.setTimeout(() => { setFlashed(true); pushConsole("flash verified · reboot OK"); }, 850); }
  function connect() { setConnected(true); pushConsole("device CLM-01 announced · 4 capabilities"); }
  function changeRelay(value: boolean) { setRelayOn(value); onFanChange(value); pushConsole(value ? "command SET_FAN_ON · current 0.84 A" : "command SET_FAN_OFF · current 0.00 A"); }
  function runTest(id: string) {
    setStatuses((current) => ({ ...current, [id]: "running" }));
    if (id === "T-008") changeRelay(true);
    window.setTimeout(() => { setStatuses((current) => ({ ...current, [id]: "passed" })); pushConsole(`${id} passed`); }, 700);
  }
  async function runAll() {
    for (const test of nodeTests) {
      setStatuses((current) => ({ ...current, [test.id]: "running" }));
      if (test.id === "T-008") changeRelay(true);
      await new Promise<void>((resolve) => window.setTimeout(resolve, 520));
      setStatuses((current) => ({ ...current, [test.id]: "passed" }));
      pushConsole(`${test.id} passed`);
    }
  }

  return (
    <div className="page engineering-page">
      <div className="engineering-topbar">
        <div><span className="eyebrow">AGROOS ENGINEERING</span><h1>Сборочный стенд</h1><p>Сегодня собираем первый климатический узел и замыкаем путь «датчик → решение → физический результат».</p></div>
        <div className="engineering-top-actions"><span className="sim-chip"><i/> SIMULATOR</span><button className="ghost-button" onClick={onOpenOwner}>Открыть лицо клиента →</button></div>
      </div>
      <section className="workbench-shell">
        <aside className="build-stepper">
          <div className="stepper-head"><span>CLM-01</span><small>Climate Node v0.1</small></div>
          {buildSteps.map((item, index) => (
            <button
              key={item.label}
              className={stage === index ? "active" : ""}
              disabled={index > maxStage}
              onClick={() => setStage(index)}
            >
              <StageBadge index={index} current={stage} completed={index < maxStage} />
              <span><strong>{item.label}</strong><small>{item.caption}</small></span>
            </button>
          ))}
          <div className="stepper-safety"><span>SAFE</span><p>Все действия ограничены лабораторным профилем 5–12 В.</p></div>
        </aside>
        <section className="stage-panel">
          {stage === 0 && <BomStage bom={bom} onToggle={toggleBom} onNext={goNext} />}
          {stage === 1 && <WiringStage onNext={goNext} />}
          {stage === 2 && <FirmwareStage flashed={flashed} onFlash={flash} onNext={goNext} />}
          {stage === 3 && <DiscoveryStage connected={connected} onConnect={connect} onNext={goNext} />}
          {stage === 4 && <TestStage statuses={statuses} onRun={runTest} onRunAll={runAll} relayOn={relayOn} onRelayChange={changeRelay} />}
        </section>
      </section>
      <section className="engineering-console"><div><span className="console-light red"/><span className="console-light amber"/><span className="console-light green"/><strong>Журнал стенда</strong></div><pre>{consoleLines.join("\n")}</pre></section>
    </div>
  );
}

function MobileNav({ mode, onModeChange }: { mode: Mode; onModeChange: (mode: Mode) => void }) {
  const items = mode === "owner" ? ownerNavigation.slice(0, 4) : [
    { icon: "⌘", label: "Стенд", active: true },
    { icon: "▣", label: "Устройства" },
    { icon: "✓", label: "Тесты" },
    { icon: "⚙", label: "Ещё" },
  ];
  return (
    <nav className="mobile-nav" aria-label="Мобильная навигация">
      {items.map((item) => (
        <button key={item.label} className={item.active ? "active" : ""} onClick={() => item.label === "Стенд" && onModeChange("engineer")}>
          <span>{item.icon}</span>
          <small>{item.label}</small>
        </button>
      ))}
    </nav>
  );
}

export default function Home() {
  const [mode, setMode] = useState<Mode>("owner");
  const [status, setStatus] = useState<SystemStatus>("normal");
  const [fanOn, setFanOn] = useState(false);

  const demoLabel = useMemo(() => status === "normal" ? "start" : "reset", [status]);

  function toggleDemo() {
    if (demoLabel === "reset") {
      setStatus("normal");
      setFanOn(false);
      return;
    }
    setStatus("warning");
    setFanOn(false);
    window.setTimeout(() => setFanOn(true), 1200);
  }

  if (mode === "owner") {
    return (
      <ClientApp
        status={status}
        fanOn={fanOn}
        onRunScenario={toggleDemo}
        onOpenEngineer={() => setMode("engineer")}
      />
    );
  }

  return (
    <main className="agro-shell">
      <Sidebar mode={mode} onModeChange={setMode} />
      <MobileHeader mode={mode} onModeChange={setMode} />
      <section className="app-content">
        <EngineeringWorkbench onOpenOwner={() => setMode("owner")} onFanChange={(value) => { setStatus(value ? "warning" : "normal"); setFanOn(value); }} />
      </section>
      <MobileNav mode={mode} onModeChange={setMode} />
    </main>
  );
}
