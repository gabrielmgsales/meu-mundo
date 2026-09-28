import { resourceNames as names } from './game-ui.js';
import { catalog } from './buildings.js';
const $ = id => document.getElementById(id);
export function createCollection({
  state,
  player,
  resources,
  crops,
  editable,
  riverX,
  toast,
  updateUI,
  save,
  current
}) {
  let nearest = null;
  function collect() {
    const {
      boating,
      editor,
      experience,
      elapsed
    } = current();
    if (boating?.nearby) {
      boating.interact();
      return;
    }
    if (editor?.pose.active) {
      editor.clearPose();
      return;
    }
    if (experience.busy || nearest?.resource?.deleted || nearest?.crop?.deleted) return;
    if (!nearest) return toast('Aproxime-se de árvores, rochas, hortas ou do rio.');
    const collectedType = nearest.type,
      target = nearest.resource || nearest.crop?.g.position;
    if (nearest.type === 'crop') {
      if (nearest.crop.readyAt > elapsed) return;
      state.inventory.grain += 5;
      state.inventory.food += 3;
      state.harvested++;
      nearest.crop.readyAt = elapsed + 45;
      toast('Colheita: +5 grãos e +3 alimentos. Nova colheita em 45 s.');
    } else {
      if (nearest.resource) {
        if (nearest.resource.cooldown > elapsed) return;
        nearest.resource.cooldown = elapsed + (['herbs', 'crystal'].includes(nearest.type) ? 25 : 4);
      }
      const n = nearest.type === 'water' ? 3 : 2;
      state.inventory[nearest.type] += n;
      state.collected++;
      toast(`+${n} ${names[nearest.type][1].toLowerCase()} na mochila`);
    }
    experience.burst(collectedType, target);
    nearest = null;
    updateUI();
    save();
  }
  function interaction() {
    const {
      boating,
      editor,
      elapsed,
      selected
    } = current();
    if (boating?.nearby) {
      $('interaction').textContent = boating.prompt;
      nearest = null;
      return;
    }
    if (editor?.pose.active) {
      $('interaction').textContent = '[ E ] Levantar';
      nearest = null;
      return;
    }
    let best = 3,
      found = null;
    for (const r of resources) {
      if (r.deleted) continue;
      const d = Math.hypot(r.x - player.position.x, r.z - player.position.z);
      if (d < best && r.cooldown <= elapsed) {
        best = d;
        found = {
          type: r.type,
          resource: r
        };
      }
    }
    for (const crop of crops) {
      if (crop.deleted) continue;
      const d = crop.g.position.distanceTo(player.position);
      if (d < best && crop.readyAt <= elapsed) {
        best = d;
        found = {
          type: 'crop',
          crop
        };
      }
    }
    if (!found && Math.abs(player.position.x - riverX(player.position.z)) < 3.8) found = {
      type: 'water'
    };
    if (!found && editable.some(e => e.g.visible && e.label === catalog.well.label && Math.hypot(e.g.position.x - player.position.x, e.g.position.z - player.position.z) < 3)) found = {
      type: 'water'
    };
    nearest = found;
    $('interaction').textContent = selected ? '↖ Clique para construir' : found ? '[ E ]  ' + {
      wood: 'Coletar madeira',
      stone: 'Coletar pedra',
      water: 'Recolher água',
      crop: 'Colher a horta',
      crystal: 'Extrair cristais',
      herbs: 'Colher ervas'
    }[found.type] : '[ E ]  Aproxime-se de um recurso';
  }
  return {
    collect,
    interaction
  };
}
