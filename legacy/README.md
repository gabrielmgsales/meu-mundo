# Arquivos históricos

Estes arquivos não participam do jogo aberto por `index.html`:

- `src/App.jsx`, `main.jsx`, `styles.css` e `world-layout.js`: protótipo React anterior. Os imports relativos entre eles foram preservados. O teste de layout continua cobrindo esse protótipo.
- `src/game/previous-*.txt`: cópias de versões anteriores.
- `upgrade.py` e `upgrade.mjs`: scripts de migração antigos baseados em substituições literais. Não devem ser executados sobre o código atual.

As dependências React foram mantidas para preservar o protótipo. Para trabalhar no jogo atual, consulte `docs/MAINTENANCE.md`.
