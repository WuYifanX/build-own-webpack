const fs = require("fs");
const path = require("path");
const babylon = require("babylon");
const { assert } = require("console");
const traverse = require("babel-traverse").default;

let ID = 1;
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
  return {
    id,
    filename,
    dependencies,
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

const graph = createGraph("./src/index.js");
console.log(graph);
