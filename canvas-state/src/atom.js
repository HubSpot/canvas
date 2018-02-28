import { makeUniqueId } from './utils';

function makeSymbol(key) {
  return typeof Symbol === 'function' ? Symbol(key) : `@@${key}`;
}

const VALIDATOR = makeSymbol('validator');
const VALUE = makeSymbol('value');
const WATCHER_ID = makeSymbol('watcherId');
const WATCHERS = makeSymbol('watchers');
const UNREFERENCED_WATCHERS = makeSymbol('unreferenced-watchers');

const nextId = makeUniqueId('watcher');

function getWatcherId(callback) {
  if (!callback[WATCHER_ID]) {
    callback[WATCHER_ID] = nextId();
  }
  return callback[WATCHER_ID];
}

function addWatcher(watchers, callback) {
  const id = getWatcherId(callback);
  return {
    ...watchers,
    [id]: callback,
  };
}

function removeWatcher(watchers, callback) {
  if (watchers === null) {
    return null;
  }
  const id = getWatcherId(callback);
  if (!watchers[id]) {
    return watchers;
  }
  const nextWatchers = { ...watchers };
  delete nextWatchers[id];
  if (Object.keys(nextWatchers).length === 0) {
    return null;
  }
  return nextWatchers;
}

function runWatchers(watchers, ...args) {
  if (watchers === null) {
    return;
  }
  Object.keys(watchers).forEach(key => {
    const watcher = watchers[key];
    watcher(...args);
  });
}

function defaultValidator() {
  return true;
}

class Atom {
  constructor(value = undefined, validator = defaultValidator) {
    this[VALIDATOR] = validator;
    this[VALUE] = value;
    this[WATCHERS] = null;
    this[UNREFERENCED_WATCHERS] = null;
  }

  toString() {
    return `Atom<${this[VALUE]}>`;
  }
}

/**
 * Retrieves the value stored inside the atomInstance.
 * "deref" is short for "dereference".
 *
 * @example
 * import {atom, deref} from 'atom';
 * const count = atom(0);
 * deref(atom) === 0;
 *
 * @param  {Atom<T>} atomInstance
 * @return {T}
 */
export function deref(atomInstance) {
  return atomInstance[VALUE];
}

/**
 * Creates a new Atom.
 * Takes an initial value and an optional validator function.
 *
 * Alias: `atom`
 *
 * @example
 * import {makeAtom} from 'atom';
 * const count = makeAtom(0);
 *
 * @param  {T} initialValue
 * @param  {?Function} validator
 * @return {Atom<T>}
 */
export function makeAtom(initialValue, validator) {
  if (validator && typeof validator !== 'function') {
    throw new Error(
      `expected \`validator\` to be a function or undefined but got \`${validator}\``
    );
  }
  return new Atom(initialValue, validator);
}

/**
 * Alias of `makeAtom`.
 *
 * Creates a new Atom.
 * Takes an initial value and an optional validator function.
 *
 * @example
 * import {atom} from 'atom';
 * const count = atom(0);
 *
 * @param  {T} initialValue
 * @param  {?Function} validator
 * @return {Atom<T>}
 */
export const atom = makeAtom;

/**
 * Takes a value and returns true if that value is an Atom.
 *
 * @example
 * import {isAtom} from 'atom';
 * isAtom(atom(0)) === true;
 * isAtom(0) === false;
 *
 * @param  {any}  thing
 * @return {Boolean}
 */
export function isAtom(thing) {
  return thing instanceof Atom;
}

/**
 * Takes an Atom and some value and returns true if the value passes Atom's
 * validator.
 *
 * @example
 * import {atom, isValidValue} from 'atom';
 * const count = atom(0, v => typeof v === 'number');
 * isValidValue(count, 1) === true;
 * isValidValue(count, 'random') === false;
 *
 * @param  {Atom<T>} atomInstance
 * @param  {any} value
 * @return {Boolean}
 */
export function isValidValue(atomInstance, value) {
  return atomInstance[VALIDATOR](value, deref(atomInstance));
}

/**
 * @private
 * Used internally to set the value of an Atom.
 *
 * @param  {Atom<T>} atomInstance
 * @param  {T} nextValue
 * @return {Atom<T>}
 */
function transition(atomInstance, nextValue) {
  if (!isValidValue(atomInstance, nextValue)) {
    throw new Error(`invariant atomInstance value \`${nextValue}\``);
  }
  const previousValue = atomInstance[VALUE];
  atomInstance[VALUE] = nextValue;
  runWatchers(atomInstance[WATCHERS], nextValue, previousValue, atomInstance);
  return atomInstance;
}

/**
 * Takes an atomInstance and a transition function which is applied to the
 * current value of the Atom to produce a new one.
 *
 * @example
 * import {atom, swap} from 'atom';
 * const count = atom(0);
 * swap(count, n => n + 1);
 * //> Atom<1>
 *
 * @param  {Atom<T>} atomInstance
 * @param  {Function} swapper
 * @return {Atom<T>}
 */
export function swap(atomInstance, swapper) {
  return transition(atomInstance, swapper(deref(atomInstance)));
}

/**
 * Overwrites the value of an Atom.
 * In most cases, prefer `swap`.
 *
 * @example
 * import {atom, reset} from 'atom';
 * const count = atom(0);
 * reset(count, 1);
 * //> Atom<1>
 *
 * @param  {Atom<T>} atomInstance
 * @param  {T} nextValue
 * @return {Atom<T>}
 */
export function reset(atomInstance, nextValue) {
  return transition(atomInstance, nextValue);
}

function baseWatch(key, atomInstance, callback) {
  atomInstance[key] = addWatcher(atomInstance[key], callback);
  return atomInstance;
}

/**
 * Registers a callback to run each time the Atom's value changes.
 * A given callback will run once, even if it's passed to watch multiple times.
 *
 * @example
 * import {atom, swap, watch} from 'atom';
 * const count = atom(0);
 * watch(
 *   count,
 *   (count, prevCount) => console.info('count changed from', count, 'to', prevCount)
 * );
 * swap(count, count => count + 1);
 * // count is 1
 *
 * @param  {Atom<T>} atomInstance
 * @param  {Function} callback
 * @return {Atom<T>}
 */
export const watch = baseWatch.bind(null, WATCHERS);

/**
 * Register a callback to run if the atom's watcher count reaches 0.
 * This can be useful when creating atoms dynamically
 *
 * @param  {Atom<T>}  atomInstance
 * @param  {Function} callback
 * @return {Atom<T>}
 */
export const watchUnreferenced = baseWatch.bind(null, UNREFERENCED_WATCHERS);

/**
 * Unregisters a watch callback.
 *
 * @param  {Atom<T>} atomInstance
 * @param  {Function} callback
 * @return {Atom<T>}
 */
export function unwatch(atomInstance, callback) {
  const prevWatchers = atomInstance[WATCHERS];
  const nextWatchers = removeWatcher(prevWatchers, callback);
  atomInstance[WATCHERS] = nextWatchers;
  if (nextWatchers === null && prevWatchers !== null) {
    runWatchers(atomInstance[UNREFERENCED_WATCHERS], atomInstance);
  }
  return atomInstance;
}

/**
 * Unregisters an "unreferenced" callback.
 *
 * @param  {[type]}   atomInstance [description]
 * @param  {Function} callback     [description]
 * @return {[type]}                [description]
 */
export function unwatchUnreferenced(atomInstance, callback) {
  atomInstance[UNREFERENCED_WATCHERS] = removeWatcher(
    atomInstance[UNREFERENCED_WATCHERS],
    callback
  );
  return atomInstance;
}