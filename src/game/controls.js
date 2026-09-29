import {dragOrbit,zoomOrbit} from './camera-orbit.js';
import { catalog } from './buildings.js';
export function bindControls({
  renderer,
  keys,
  view,
  current,
  select,
  setPaused,
  collect,
  aim,
  place
}) {
  let drag = null,
    moved = false;
  window.addEventListener('keydown', e => {
    const {
      editor,
      selected,
      paused
    } = current();
    if (['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName)) return;
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
    keys[e.code] = true;
    if (e.repeat) return;
    if (e.code === 'Escape') {
      if (editor?.active) {
        editor.cancel();
        return;
      }
      if (selected) select(selected);else setPaused(!paused);
    }
    if (paused) return;
    if (e.code === 'KeyE') collect();
    if (/^Digit[1-5]$/.test(e.code)) select(Object.keys(catalog)[Number(e.code.at(-1)) - 1]);
  });
  window.addEventListener('keyup', e => keys[e.code] = false);
  window.addEventListener('blur', () => {for(const key of Object.keys(keys))keys[key]=false;setPaused(true);});
  renderer.domElement.addEventListener('pointerdown', e => {
    drag = {
      x: e.clientX,
      y: e.clientY,
      last: e.clientX,
      lastY: e.clientY
    };
    moved = false;
    renderer.domElement.setPointerCapture(e.pointerId);
    aim(e);
  });
  renderer.domElement.addEventListener('pointermove', e => {
    const {
      editor,
      paused
    } = current();
    if (drag) {
      if (Math.hypot(e.clientX - drag.x, e.clientY - drag.y) > 5) moved = true;
      if (moved && !paused) {
        dragOrbit(view,e.clientX-drag.last,e.clientY-drag.lastY,editor?.firstPerson);
        editor?.look(e.clientY - drag.lastY,e.clientX - drag.last);
      }
      drag.last = e.clientX;
      drag.lastY = e.clientY;
    }
    aim(e);
  });
  renderer.domElement.addEventListener('pointerup', e => {
    const {
      editor,
      paused,
      selected
    } = current();
    if (!moved && !paused) {
      if (selected) {
        aim(e);
        place();
      } else editor?.click(e);
    }
    drag = null;
  });
  renderer.domElement.addEventListener('pointercancel', () => drag = null);
  renderer.domElement.addEventListener('wheel', e => {
    e.preventDefault();
    if(!current().paused)zoomOrbit(view,e.deltaY);
  }, {
    passive: false
  });
}
