require("jest-specific-snapshot");
const instrument = require("../index");

const snapshotSrc = "__snapshots__/index.js.src.txt";

const makeLogger = (f) =>
  jest.fn((type, pos, ...args) => {
    //expect(snippet(f, pos)).toEqual(args[0][0]);
  });

const snippet = (f, pos) => f.toString().slice(...pos);

test("binary", async () => {
  const f = function (a, b, c) {
    a = b + c * 2;
    return a;
  };

  const logger = makeLogger(f);
  const logging = instrument(f, logger);
  expect(await logging(3, 4, 5)).toBe(14);
  expect(logger.mock.calls).toMatchSnapshot();
  expect(logging.toString()).toMatchSpecificSnapshot(snapshotSrc);
});

test("escape string", async () => {
  const f = function (a, b, c) {
    return "x'x" + a * b + c + 'z"z';
  };

  const logger = makeLogger(f);
  const logging = instrument(f, logger);
  expect(await logging(3, 4, "y")).toBe("x'x12yz\"z");
  expect(logger.mock.calls).toMatchSnapshot();
  expect(logging.toString()).toMatchSpecificSnapshot(snapshotSrc);
});

test("call", async () => {
  const f = function (a, b, c) {
    const d = (x, y) => x ** y;
    return Math.pow(4 * a, 2) + d(a, b) + c;
  };

  const logger = makeLogger(f);
  const logging = instrument(f, logger);
  expect(await logging(3, 4, 5)).toBe(230);
  expect(logger.mock.calls).toMatchSnapshot();
  expect(logging.toString()).toMatchSpecificSnapshot(snapshotSrc);
});

test("async", async () => {
  const f = async function (a, b, c) {
    const d = async (x, y) => x ** y;
    return (await d(a, b)) + c;
  };

  const logger = makeLogger(f);
  const logging = instrument(f, logger);
  expect(await logging(3, 4, 5)).toBe(86);
  expect(logger.mock.calls).toMatchSnapshot();
  expect(logging.toString()).toMatchSpecificSnapshot(snapshotSrc);
});

test("for loop", async () => {
  const f = async function (a, b, c) {
    for (var i = 0; i < a + b; i++) c = c + i;
    return c;
  };

  const logger = makeLogger(f);
  const logging = instrument(f, logger);
  expect(await logging(3, 4, 5)).toBe(26);
  expect(logger.mock.calls).toMatchSnapshot();
  expect(logging.toString()).toMatchSpecificSnapshot(snapshotSrc);
});

test("assignment", async () => {
  const f = function (a, b, c) {
    c += a - b;
    return c;
  };

  const logger = makeLogger(f);
  const logging = instrument(f, logger);
  expect(await logging(3, 4, 5)).toBe(4);
  expect(logger.mock.calls).toMatchSnapshot();
  expect(logging.toString()).toMatchSpecificSnapshot(snapshotSrc);
});
