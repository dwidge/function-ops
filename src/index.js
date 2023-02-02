const transform = require("transform-ast");

const loggerName = "_instrument_";
const pre = `return `;
const skip = pre.length;

const pre2 = `
function _call(type,pos,[expk,expf],args)=>{
  const r=await expf(...a.map(([k,v])=>v))
  await _log(type,pos,[expn,r],args)
  return r
}
return `;

const escape = (s) => s.replace(/\'/g, "\\'");

const isNodeAsync = (node) =>
  node.async === undefined
    ? node.parent
      ? isNodeAsync(node.parent)
      : false
    : node.async;

const isNodeInLogger = (node) => (
  console.log(node.edit.source()),
  node.edit.source().includes(loggerName) ||
    (node.parent && isNodeInLogger(node.parent))
);

const update2 = (node, old, vals) => {
  const asy = isNodeAsync(node) ? "await" : "";
  const src = node.edit.source();
  const eqs = [old, ...vals].map(
    (a) => `'${escape(a)} = '+${isNodeAsync(node) ? "await" : ""} (${a})`
  );
  const pos = [node.start - pre.length, node.end - pre.length];
  const log = `${loggerName}('${node.type}',[${pos.join(",")}],${eqs.join(
    ","
  )})`;
  const mod = `(${log},${src})`;
  `(()=>{
    const a=[${val.map((a) => a).join(",")}]
    const r=${old}(a)
    ${loggerName}('${node.type}',[${pos.join(",")}],r,a)
    return r
  })()`;
  const [p0, p1] = [node.start - pre.length, node.end - pre.length];
  `${asy} call('exp',[2,3],['a+b',(a,b)=>a+b],[['1',${asy} 1],['3+4',3+4],['await d()',await d()]])`;
  const opEntry = `['${escape(opdesc)}',${op}]`;
  const argEntrys = args.map((a) => `['${escape(a)}',${asy} ${a}]`).join(",");
  const mod = `${asy} call('${node.type}',[${p0},${p1}],${opEntry},[${argEntrys}])`;
  node.edit.old = old;
  node.edit.update(mod);
};

const update = (node, old, vals) => {
  const asy = isNodeAsync(node) ? "await " : "";
  const src = node.edit.source();
  const eqs = [old, ...vals]
    .map((a) => `['${escape(a)}',${asy}(${a})]`)
    .join(",");
  const [p0, p1] = [node.start - skip, node.end - skip];
  const log = `${asy}${loggerName}('${node.type}',[${p0},${p1}],${eqs})`;
  const mod = `(${log},${src})`;
  node.edit.old = old;
  node.edit.update(mod);
};

const getSource = (source, node) => source.slice(node.start, node.end);

const transformers = (source) => ({
  BinaryExpression(node) {
    const left = getSource(source, node.left);
    const right = getSource(source, node.right);
    const old = getSource(source, node);
    update(node, old, [left, right]);
  },
  AssignmentExpression(node) {
    const left = getSource(source, node.left);
    const right = getSource(source, node.right);
    const old = getSource(source, node);
    //update(node, old, [left, right]);
  },
  CallExpression(node) {
    const callee = node.callee.source();
    const args = node.arguments.map((a) => a.edit.old || a.edit.source());
    const old = `${callee}(${args.join(", ")})`;
    update(node, old, args);
  },
});

/**
 * Instruments a function with a logger function. When the instrumented function
 * is called, the logger function will be called with certain arguments to log
 * information about the function call.
 *
 * @param {function} func - The function to instrument.
 * @param {function} logger - The logger function to call when the instrumented
 *   function is called. The logger function will be called with four
 *   arguments:
 *
 *   - Type: a string representing the type of the expression being logged
 *   - [start, end]: an array representing the start and end positions of the
 *       expression in the original function
 *   - [exp, val]: an array representing the expression and its value
 *   - Args: an array of arrays representing the arguments of the expression, each
 *       array containing two elements [exp, val] representing the expression
 *       and its value
 *
 * @returns {function} A new function that behaves the same as the original
 *   function, but calls the logger function with the above arguments whenever
 *   an expression is evaluated.
 */
function instrument(func, log) {
  const f = `${pre}${func.toString()}`;
  const t = transformers(f);
  var src = transform(f, function (node) {
    //console.log(node.type, node.edit.source(), node);
    if (t[node.type]) t[node.type](node);
  });
  return new Function(loggerName, src.toString())(log);
}

module.exports = instrument;
