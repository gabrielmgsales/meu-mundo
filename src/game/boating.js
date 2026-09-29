import { createBoatModel } from './lake-region.js';
import { LAKE, DOCK, canSail, moveBoat } from './region.js';
export function createBoating({
  scene,
  M,
  player,
  state,
  save,
  toast,
  editor,
  blocked,
  height,
  ripple,
  onVisit = () => {}
}) {
  const model = createBoatModel(M);
  model.visible = !!state.boat;
  scene.add(model);
  let rowing = false,
    wake = 0;
  const distance = () => state.boat ? Math.hypot(player.position.x - state.boat.x, player.position.z - state.boat.z) : Infinity;
  function sync(time = 0) {
    const b = state.boat;
    model.visible = !!b;
    if (!b) return;
    model.position.set(b.x, LAKE.level + .06 + (b.docked ? 0 : Math.sin(time * 2) * .035), b.z);
    model.rotation.set(0, b.heading, b.docked ? 0 : Math.sin(time * 1.7) * .012);
    if (b.occupied) {
      player.position.set(b.x, model.position.y - .2, b.z);
      player.rotation.y = b.heading;
    }
  }
  function placementError(x, z) {
    if (state.boat) return 'Seu barco já está no lago. Use “Trazer barco ao deck” para recuperá-lo.';
    if (!canSail(x, z, 0)) return 'Coloque o barco na água do lago grande, longe da margem e do deck.';
    return '';
  }
  function place(x, z) {
    const error = placementError(x, z);
    if (error) {
      toast(error);
      return false;
    }
    state.boat = {
      x,
      z,
      heading: 0,
      occupied: false,
      docked: false
    };
    sync();
    save();
    toast('Barco colocado. Aproxime-se e pressione E para embarcar.');
    return true;
  }
  function recall() {
    if (state.boat?.occupied) {
      toast('Aproxime o barco do deck e pressione E para atracar.');
      return;
    }
    state.boat = {
      ...DOCK.berth,
      heading: 0,
      occupied: false,
      docked: true
    };
    sync();
    save();
    toast('Barco pronto ao lado do deck, no lago a leste.');
  }
  function interact() {
    if(state.truck?.occupied){toast('Saia da picape primeiro.');return true;}
    const b = state.boat;
    if (!b) return false;
    if (!b.occupied) {
      if (distance() > 3.2) {
        toast('Aproxime-se do barco para embarcar.');
        return true;
      }
      editor()?.clearPose();
      editor()?.cancel();
      b.occupied = true;
      b.docked = false;
      sync();
      save();
      toast('Navegue com WASD ou setas. E desembarca perto da margem ou atraca no deck.');
      return true;
    }
    let exit = null;
    if (Math.hypot(b.x - DOCK.berth.x, b.z - DOCK.berth.z) < 3.2 && !blocked(DOCK.exit.x, DOCK.exit.z)) {
      Object.assign(b, DOCK.berth, {
        heading: 0,
        docked: true
      });
      exit = DOCK.exit;
    } else {
      for (let radius = 1.8; radius <= 3; radius += .3) {
        for (let i = 0; i < 24; i++) {
          const a = i * Math.PI / 12,
            x = b.x + Math.sin(a) * radius,
            z = b.z + Math.cos(a) * radius;
          if (!blocked(x, z) && Math.abs(height(x, z) - LAKE.level) < 1.2 && [[.25, 0], [-.25, 0], [0, .25], [0, -.25]].every(([dx, dz]) => !blocked(x + dx, z + dz))) {
            exit = {
              x,
              z
            };
            break;
          }
        }
        if (exit) break;
      }
    }
    if (!exit) {
      toast('Aproxime-se do deck ou de uma margem livre para desembarcar.');
      return true;
    }
    b.occupied = false;
    rowing = false;
    player.position.set(exit.x, height(exit.x, exit.z), exit.z);
    sync();
    save();
    toast(b.docked ? 'Barco atracado. Você desembarcou no deck.' : 'Você desembarcou na margem.');
    return true;
  }
  sync();
  return {
    model,
    place,
    placementError,
    recall,
    interact,
    visit() {
      if(state.truck?.occupied){toast('Saia da picape primeiro.');return;}
      if (state.boat?.occupied) {
        toast('Desembarque antes de viajar.');
        return;
      }
      const x = DOCK.exit.x,
        z = DOCK.exit.z + .5;
      if (blocked(x, z)) {
        toast('Libere o deck antes de viajar.');
        return;
      }
      editor()?.clearPose();
      editor()?.cancel();
      player.position.set(x, height(x, z), z);
      onVisit();
      save();
      toast('Você chegou ao deck do lago. Traga o barco e pressione E para embarcar.');
    },
    get occupied() {
      return !!state.boat?.occupied;
    },
    get nearby() {
      return !!state.boat && (state.boat.occupied || distance() < 3.2);
    },
    get prompt() {
      return state.boat?.occupied ? '[ E ] Desembarcar / atracar · WASD ou setas para navegar' : '[ E ] Entrar no barco';
    },
    step(dx, dz, angle, dt) {
      rowing = moveBoat(state.boat, dx, dz, angle, dt, (x, z) => editor()?.objectBlocks(x, z));
      sync();
    },
    tick(dt, time) {
      sync(time);
      if (dt <= 0) return;
      for (const [i, oar] of model.userData.oars.entries()) {
        oar.rotation.y = rowing ? Math.sin(time * 7) * (i ? -.45 : .45) : 0;
        oar.rotation.z = rowing ? Math.cos(time * 7) * .12 : 0;
      }
      if (state.boat?.occupied && rowing) {
        wake += dt;
        if (wake > .18) {
          wake = 0;
          ripple(state.boat.x - Math.sin(state.boat.heading) * 1.2, state.boat.z - Math.cos(state.boat.heading) * 1.2, LAKE.level, .65);
        }
      }
    }
  };
}
