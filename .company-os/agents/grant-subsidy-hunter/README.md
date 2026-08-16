# Grant & Subsidy Hunter

Evidence-first агент: `DISCOVERY -> SOURCE_EVIDENCE -> ELIGIBILITY_GATE -> ECONOMICS -> APPLY/WATCH/REJECT -> APPLICATION_PACKET -> HUMAN_APPROVAL -> RESULT REVIEW`.

## Решения

- `APPLY`: применимость подтверждена, expected value положителен, score >= 75, до дедлайна >= 7 дней.
- `WATCH`: возможность полезна, но есть пробелы или ожидается следующий набор.
- `REJECT`: критическое несоответствие, дедлайн истек или expected value <= 0.
- `EVIDENCE_PENDING`: нет официального документа или критических данных.

Без официального первичного источника/оператора `APPLY` запрещен.

Экономика: `award * probability - preparation_cost - compliance_cost - cofinancing * cost_of_capital_rate`.

Режим: ежедневный delta scan, еженедельный полный scan, напоминания за 30/14/7/3/1 день, перепроверка источника за 24 часа до `APPLY`, фиксация `WON/LOST` и причин.

```bash
python .company-os/agents/grant-subsidy-hunter/engine.py opportunity.json
```

Engine оценивает evidence-backed карточку; discovery adapters подключаются отдельно.

Только человек подтверждает юридические/финансовые сведения, софинансирование, использует личный кабинет/ЭП, отправляет заявку и подписывает соглашение.

До live-режима заполняются ИНН/ОГРН, дата регистрации, регион, форма, статус МСП, ОКВЭД, выручка, численность, налоговый режим, лицензии/реестры, доступное софинансирование, проекты и история поддержки. Неполный профиль блокирует `APPLY`, но не discovery.
