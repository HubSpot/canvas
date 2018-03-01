const { Application } = require('./application');

it('is a function', () => {
  expect(typeof Application).toBe('function');
});

describe('Application', () => {
  let app;
  beforeEach(() => {
    app = new Application();
  });

  it('returns a new instance', () => {
    expect(app instanceof Application).toBe(true);
  });

  it('implements EventTarget', () => {
    expect(typeof app.addEventListener).toEqual(expect.any(Function));
    expect(typeof app.removeEventListener).toEqual(expect.any(Function));
  });

  it('initializes a bare registry', () => {
    expect(app.registry).toEqual({});
  });

  it('initializes a bare set of containers', () => {
    expect(app.containers).toEqual({});
  });

  it('initializes the Producer component', () => {
    expect(app.Producer).toEqual(expect.any(Function));
  });

  it('initializes the Consumer component', () => {
    expect(app.Producer).toEqual(expect.any(Function));
  });

  describe('register', () => {
    it('returns a promise', () => {
      expect(app.register().then).toEqual(expect.any(Function));
    });

    it('resolves with metadata', async () => {
      await expect(app.register('test', { test: true })).resolves.toEqual({
        name: 'test',
        value: { test: true },
      });
      await expect(app.resolve('test')).resolves.toEqual({
        name: 'test',
        value: { test: true },
      });
    });

    it('rejects with empty args', async () => {
      await expect(app.register()).rejects.toThrow();
      await expect(app.resolve('test')).rejects;
    });

    it('rejects with empty name', async () => {
      await expect(app.register(null, {})).rejects.toThrow();
    });

    it('rejects with empty instance', async () => {
      await expect(app.register('null')).rejects.toThrow();
    });

    it('returns a promise', async () => {
      await expect(
        app.register('test', {
          test: true,
        })
      ).resolves.toEqual({ name: 'test', value: { test: true } });
    });
  });

  describe('init', () => {});

  describe('resolve', () => {});

  describe('unregister', () => {});
});
