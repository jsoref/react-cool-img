import MyImg from '../MyImg';

describe('MyImg', () => {
  const SUCCESS_SRC = 'SUCCESS_SRC';
  const FAILURE_SRC = 'FAILURE_SRC';
  const ERROR_EVT = { mock: '' };
  const LOAD_EVT = { mock: '' };

  const myImg = new MyImg();
  const myImgDelegation = {
    load: ({
      src,
      crossOrigin,
      decode,
      onError,
      onLoad
    }: {
      src?: string;
      crossOrigin?: string;
      decode?: boolean;
      onError?: (event: Event) => void;
      onLoad?: (event: Event) => void;
    }): void => {
      myImg.load(
        src || SUCCESS_SRC,
        crossOrigin,
        decode || false,
        onError,
        onLoad
      );
    },
    unload: (): void => {
      myImg.unload();
    }
  };

  beforeAll(() => {
    let source: undefined;
    let crossOrigin: undefined;

    // Mock Image events
    // @ts-ignore
    Object.defineProperties(global.Image.prototype, {
      src: {
        set(src): void {
          source = src;

          if (src === FAILURE_SRC) {
            setTimeout(() => this.onerror(ERROR_EVT));
          } else if (src === SUCCESS_SRC) {
            setTimeout(() => this.onload(LOAD_EVT));
          }
        },
        get(): string {
          return source;
        }
      },
      crossOrigin: {
        set(str): void {
          crossOrigin = str;
        },
        get(): void {
          return crossOrigin;
        }
      },
      decode: {
        value: (): any => Promise.resolve(),
        writable: true
      }
    });
  });

  it('image loaded failure, trigger onError callback', done => {
    const onError = (event: Event): void => {
      expect(event).toMatchObject(ERROR_EVT);
      done();
    };
    const onLoad = jest.fn();

    myImgDelegation.load({ src: FAILURE_SRC, onError, onLoad });

    expect(onLoad).not.toBeCalled();
  });

  it('image loaded success, trigger onLoad callback', done => {
    const onError = jest.fn();
    const onLoad = (event: Event): void => {
      expect(event).toMatchObject(LOAD_EVT);
      done();
    };

    myImgDelegation.load({ src: SUCCESS_SRC, onError, onLoad });

    expect(onError).not.toBeCalled();
  });

  it("set Image's crossOrigin attribute correctly", () => {
    myImgDelegation.load({});

    expect(myImg.img.crossOrigin).toBeUndefined();

    const crossOrigin = '';

    myImgDelegation.load({ crossOrigin });

    setTimeout(() => {
      expect(myImg.img.crossOrigin).toBe(crossOrigin);
    });
  });

  it("call Image's decode method correctly", () => {
    // @ts-ignore
    const decode = jest.spyOn(global.Image.prototype, 'decode');

    myImgDelegation.load({});

    expect(decode).not.toBeCalled();

    myImgDelegation.load({ decode: true });

    expect(decode).toBeCalled();
  });

  it('image unload, clear "onerror", "onload", "src" properties and Image instance', () => {
    const src = 'mock src';

    myImgDelegation.load({ src });

    expect(myImg.img.onerror).toBeInstanceOf(Function);
    expect(myImg.img.onload).toBeInstanceOf(Function);
    expect(myImg.img.src).toBe(src);
    expect(myImg.img).toBeInstanceOf(HTMLImageElement);

    myImgDelegation.unload();

    expect(myImg.img).toBeNull();
  });
});
