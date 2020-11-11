const fs = require("fs");
const path = require("path");
const babylon = require("@babel/parser");
const traverse = require("@babel/traverse").default;
const babel = require("@babel/core");

let ID = 0;
function createAssert(filename) {
  const content = fs.readFileSync(filename, "utf-8");
  const ast = babylon.parse(content, {
    sourceType: "module",
  });
  const dependencies = [];
  traverse(ast, {
    ImportDeclaration: ({ node }) => {
      dependencies.push(node.source.value);
    },
  });
  id = ID++;
  const { code } = babel.transformFromAst(ast, null, {
    presets: ["@babel/preset-env"],
  });
  return {
    id,
    filename,
    dependencies,
    code,
  };
}

function createGraph(entry) {
  const mainAssert = createAssert(entry);
  const queue = [mainAssert];

  for (const assert of queue) {
    const dirname = path.dirname(assert.filename);
    assert.mapping = {};

    assert.dependencies.forEach((relativePath) => {
      const absolutePath = path.join(dirname, relativePath);
      const child = createAssert(absolutePath);
      assert.mapping[relativePath] = child.id;
      queue.push(child);
    });
  }

  return queue;
}

function bundle(graph) {
  let modules = "";

  graph.forEach((mod) => {
    modules += `${mod.id}: [
      function (require, module, exports) {
        ${mod.code}
      },
      ${JSON.stringify(mod.mapping)}
    ],
    `;
  });

  const result = `(function(modules){
    function require(id) {
      const [fn, mapping] = modules[id];
      function localRequire(relativePath) {
        const id = mapping[relativePath];
        return require(id);
      }

      const module = {exports:{}};
      fn(localRequire, module, module.exports);
      return module.exports;
    }

    require(0);
  })({${modules}})`;
  return result;
}

const graph = createGraph("./src/index.js");
const result = bundle(graph);
console.log(result);
