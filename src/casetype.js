/**
 * 大小写模式
 *
 */
const CaseType = {
    camel: 'camel',             // thisIsAnExample   // 驼峰式，第一个单词的首字母小写，后续单词的首字母大写，单词间无分隔
    pascal: 'pascal',           // ThisIsAnExample    // Pascal式，每个单词首字母大写，单词间无分隔
    constant: 'constant',       // THIS_IS_AN_EXAMPLE // 常量式，所有字母大写，单词间下划线分隔
    space: 'space',             // this is an example // 空格式，全小写，单词间空格分隔，也叫 noCase，常见于配置文件的字段名称（field/property name）
    dash: 'dash',               // this-is-an-example // 横线式，全小写，单词间横线分隔，也叫 paramCase，常见于文件名命名
    underscore: 'underscore',   // this_is_an_example // 下划线式，全小写，单词间下划线分隔，也叫 snakeCase，常见于函数名称
    dot: 'dot',                 // this.is.an.example // 点式，全小写，单词间用点号分隔，常见于对象名称路径（name path）
    capital: 'capital',         // This Is An Example // 首字母大写式，单词间空格分隔，每个单词首字母大写
    title: 'title',             // This Is an Example // 标题式，单词间空格分隔，每个单词首字母大写，遵循英语使用规则，比如 'This Is A Step-By-Step Example'
    sentence: 'sentence',       // This is an example // 句子式，句子首字母大写，其他小写，单词间空格分隔
    lower: 'lower',             // this is an example // 全小写式
    upper: 'upper'              // THIS IS AN EXAMPLE // 全大写式
};

// 还有其他不常用的大小写模式，此处省略
//
// headerCase    // This-Is-An-Example
// pathCase      // this/is/an/example

module.exports = CaseType;