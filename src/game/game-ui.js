const $ = id => document.getElementById(id);
export const resourceNames = {
  wood: ['⌁', 'Madeira'],
  stone: ['◇', 'Pedra'],
  grain: ['♧', 'Grãos'],
  food: ['◒', 'Comida'],
  water: ['♢', 'Água'],
  crystal: ['✧', 'Cristais'],
  herbs: ['❧', 'Ervas']
};
export function createGameUI(state, refreshExperience) {
  let toastTimer;
  function toast(t) {
    $('toast').textContent = t;
    $('toast').classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => $('toast').classList.remove('show'), 3500);
  }
  function updateUI() {
    $('inventory').innerHTML = Object.entries(resourceNames).map(([k, [i, n]]) => `<div class="resource"><i>${i}</i><span>${n}</span><b>${state.inventory[k]}</b></div>`).join('');
    const goals = [[state.collected >= 3, `Colete recursos · ${Math.min(3, state.collected)}/3`], [state.buildings.some(b => b.type === 'cabin'), 'Construa sua cabana'], [state.harvested > 0, 'Faça a primeira colheita']];
    $('objectives').innerHTML = goals.map(([d, n]) => `<div class="objective ${d ? 'done' : ''}">${d ? '✓' : '○'} &nbsp; ${n}</div>`).join('');
    $('progress').style.width = `${goals.filter(g => g[0]).length / 3 * 100}%`;
    refreshExperience();
  }
  function updateClock() {
    $('clock').textContent = `${String(Math.floor(state.time)).padStart(2, '0')}:${String(Math.floor(state.time % 1 * 60)).padStart(2, '0')}`;
    $('day').textContent = `DIA ${String(state.day).padStart(2, '0')} · PRIMAVERA`;
  }
  return {
    toast,
    updateUI,
    updateClock
  };
}
