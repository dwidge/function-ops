# @dwidge/function-ops

This package provides a utility to instrument a function with a logger function.

The instrument function returns a new function that behaves the same as the original function, but calls the logger function whenever an expression is evaluated.

## Installation

`npm i @dwidge/function-ops`

## Usage

```js
instrument(
  () => {},
  (type, [start, end], [exp, val], ...args) => {}
);
```

```js
const instrument = require("@dwidge/function-ops");

const f = function (a, b, c) {
  a = b + c * 2;
  return a - Math.min(1, 2, 3, c);
};

const logger = (type, [start, end], [exp, val], ...args) => {
  console.log(`${type}@${start}-${end}`);
  console.log(`  ${exp} = ${val}`);
  console.log(
    `  where ${args.map(([exp, val]) => `${exp} = ${val}`).join(" and ")}`
  );
};

const flog = instrument(f, logger);
console.log(flog(3, 4, 5));
```

```
BinaryExpression@28-37
  b + c * 2 = 14
  where b = 4 and c * 2 = 10
BinaryExpression@32-37
  c * 2 = 10
  where c = 5 and 2 = 2
BinaryExpression@49-73
  a - Math.min(1, 2, 3, c) = 13
  where a = 14 and Math.min(1, 2, 3, c) = 1
CallExpression@53-73
  Math.min(1, 2, 3, c) = 1
  where 1 = 1 and 2 = 2 and 3 = 3 and c = 5
13
```

## Logger

```js
(type, [start, end], [exp, val], ...args) => {};
```

| Argument     | Type   | Description                                                                                                                                              |
| ------------ | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| type         | string | The type of the expression being logged                                                                                                                  |
| [start, end] | array  | An array representing the start and end positions of the expression in the original function                                                             |
| [exp, val]   | array  | An array representing the expression and its value                                                                                                       |
| args         | array  | An array of arrays representing the arguments of the expression, each array containing two elements [exp, val] representing the expression and its value |

## Testing

`npm test`

## Credits

transform-ast  
ChatGPT

## License

This package is licensed under the Boost Software License. See the LICENSE file for more information.
