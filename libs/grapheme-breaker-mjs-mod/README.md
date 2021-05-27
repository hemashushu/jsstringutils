因为原始包 grapheme-breaker-mjs 是基于 ES module，在 CommonJS 环境中
加载较为麻烦，所以这里把它重新打包为 CommonJS 形式。

在当前模块（grapheme-breaker-mjs-mod）下运行：

```
$ npm run generate_data
```

可以重新产生 "classes-v13.0.0.js" 文件。

## Original Package

name: grapheme-breaker-mjs
version: 1.0.1
repo: https://github.com/taisukef/grapheme-breaker-mjs
license: MIT