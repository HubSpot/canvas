import EventTarget from 'event-target';
import createReactContext from 'create-react-context';
import { atom, deref, reset, swap, watch } from './atom';

const events = {
  changed: 'canvas-state:changed',
  created: 'canvas-state:initialized',
};

const createEvent = (name, detail = {}) => {
  return new CustomEvent(name, { detail });
};

function triggerChangeEvent(state, previousState) {
  this.dispatchEvent(createEvent(events.changed, { state, previousState }));
}

export default class Container extends EventTarget {
  constructor(name, initialState = {}) {
    super();
    this.name = name;

    const state = atom(initialState);
    const { Consumer, Provider } = createReactContext(atom);
    this.state = state;
    this.Consumer = Consumer;
    this.Producer = Producer;

    watch(state, triggerChangeEvent.bind(this));
    this.dispatchEvent(createEvent(events.created, { state }));
  }

  getState() {
    return deref(this.state);
  }

  setState(nextState) {
    if (
      typeof nextState === 'function' &&
      typeof this.getState() !== 'function'
    ) {
      return swap(this.state, nextState);
    }
    return reset(this.state, nextState);
  }
}
