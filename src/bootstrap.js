import { loadWorlds, chooseWorld, createWorld, renameWorld, deleteWorld } from './game/worlds.js';
import { ValleyAudio } from './game/audio.js';
const screen = document.createElement('main');
screen.id = 'welcome';
screen.innerHTML = `<div class="welcome-landscape" aria-hidden="true"><i></i><i></i><i></i></div>
  <section class="welcome-copy"><small>UM LUGAR PARA CHAMAR DE SEU</small><h1>Meu Mundo<span>Vale Verde</span></h1><p>O riacho segue seu caminho.<br>O resto da história é você quem cria.</p><button id="menu-sound" aria-pressed="false">♫ Ativar música e natureza</button>
    <button id="play-quickstart" class="play-quickstart" type="button" aria-label="Jogar agora"><span class="play-icon" aria-hidden="true">▶</span><span>Jogar</span></button>
  </section>
  <section class="world-card"><small>SUA PRÓXIMA HISTÓRIA</small><h2>Entre no seu mundo</h2>
    <form id="new-world"><label for="world-name">Nome do novo mundo</label><input id="world-name" maxlength="60" value="Meu novo vale" required><button class="primary" type="submit">＋ Iniciar um novo jogo</button></form>
    <h3>Mundos salvos</h3><div id="world-list"></div><p id="menu-error" role="alert"></p><p class="local-note">Sem login. Seus mundos ficam salvos neste navegador e neste endereço.</p>
  </section>`;
document.body.append(screen);
document.body.classList.add('in-menu');
const audio = new ValleyAudio();
let musicTimer,
  busy = false;
document.getElementById('menu-sound').onclick = async e => {
  await audio.unlock();
  audio.enabled = e.target.getAttribute('aria-pressed') !== 'true';
  audio.apply();
  e.target.setAttribute('aria-pressed', String(audio.enabled));
  e.target.textContent = audio.enabled ? '♫ Música e natureza ligadas' : '♫ Ativar música e natureza';
  if (!musicTimer) musicTimer = setInterval(() => {
    audio.ambience(0.2);
    audio.play('bird');
  }, 4500);
  audio.ambience(.2);
};
document.getElementById('play-quickstart').onclick = () => {
  if (busy) return;
  let worlds;
  try {
    worlds = loadWorlds();
  } catch {
    error('Não foi possível ler seus mundos. Os dados foram preservados.');
    return;
  }
  const latest = [...worlds].sort((a, b) => b.updated - a.updated)[0];
  if (latest) {
    enter(latest);
    return;
  }
  const name = document.getElementById('world-name').value.trim() || 'Meu novo vale';
  try {
    enter(createWorld(name));
  } catch {
    error('Não foi possível abrir o jogo. Verifique o armazenamento do navegador.');
  }
};
function error(message) {
  document.getElementById('menu-error').textContent = message;
}
async function enter(world) {
  if (busy) return;
  busy = true;
  chooseWorld(world);
  try {
    await import('../game.js');
    clearInterval(musicTimer);
    await audio.context?.close();
    screen.remove();
    document.body.classList.remove('in-menu');
  } catch (e) {
    console.error(e);
    error('Não foi possível abrir o jogo. Recarregue a página para tentar novamente.');
  }
}
function render() {
  const list = document.getElementById('world-list');
  list.replaceChildren();
  let worlds;
  try {
    worlds = loadWorlds();
  } catch {
    error('Não foi possível ler os mundos. Os dados existentes foram preservados. Verifique o armazenamento do navegador.');
    return;
  }
  if (!worlds.length) {
    const p = document.createElement('p');
    p.textContent = 'Seu primeiro vale está esperando por você.';
    list.append(p);
  }
  for (const world of [...worlds].sort((a, b) => b.updated - a.updated)) {
    const row = document.createElement('div');
    row.className = 'world-row';
    const play = document.createElement('button');
    play.className = 'world-play';
    const name = document.createElement('strong');
    name.textContent = world.name;
    const date = document.createElement('span');
    date.textContent = `Dia ${world.data?.day || 1} · ${new Date(world.updated).toLocaleDateString('pt-BR')}`;
    play.append(name, date);
    play.onclick = () => enter(world);
    const rename = document.createElement('button');
    rename.textContent = 'Renomear';
    rename.className = 'rename';
    rename.onclick = () => {
      const form = document.createElement('form');
      form.className = 'rename-form';
      const input = document.createElement('input');
      input.value = world.name;
      input.maxLength = 60;
      input.required = true;
      input.setAttribute('aria-label', 'Novo nome do mundo');
      const submit = document.createElement('button');
      submit.textContent = 'Salvar';
      const cancel = document.createElement('button');
      cancel.type = 'button';
      cancel.textContent = 'Cancelar';
      cancel.onclick = render;
      form.append(input, submit, cancel);
      row.replaceChildren(form);
      input.focus();
      input.select();
      form.onsubmit = e => {
        e.preventDefault();
        if (!input.value.trim()) return;
        try {
          renameWorld(world.id, input.value);
          render();
        } catch {
          error('Não foi possível salvar o nome.');
        }
      };
    };
    const remove = document.createElement('button');
    remove.textContent = 'Excluir';
    remove.className = 'delete';
    remove.onclick = () => {
      const definitely = window.confirm(`Excluir o mundo "${world.name}"? Esta ação não pode ser desfeita.`);
      if (!definitely) return;
      try {
        deleteWorld(world.id);
        render();
      } catch {
        error('Não foi possível excluir o mundo no momento.');
      }
    };
    row.append(play, rename, remove);
    list.append(row);
  }
}
document.getElementById('new-world').onsubmit = e => {
  e.preventDefault();
  if (busy) return;
  const name = document.getElementById('world-name').value.trim();
  if (!name) return;
  try {
    enter(createWorld(name));
  } catch {
    error('Não foi possível criar um mundo. Verifique o espaço e a permissão de armazenamento.');
  }
};
render();
