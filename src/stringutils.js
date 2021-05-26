const crypto = require('crypto');
const uslug = require('uslug');
const { escape, unescape } = require('html-escaper');
const {
    camelCase,
    capitalCase,
    constantCase,
    dotCase,
    headerCase,
    noCase,
    paramCase,
    pascalCase,
    pathCase,
    sentenceCase,
    snakeCase
} = require('change-case');

const { titleCase } = require('title-case');
const { lowerCase, localeLowerCase } = require('lower-case');
const { upperCase, localeUpperCase } = require('upper-case');
const GraphemeBreaker = require('../libs/grapheme-breaker-mjs-mod');

const { ObjectUtils } = require('jsobjectutils');
const { IllegalArgumentException } = require('jsexception');

const UnicodeCharType = require('./unicodechartype');
const CaseType = require('./casetype');
const HashAlgorithm = require('./hashalgorithm');

// 字符串中的占位符的正则式
// 比如
// ${aaa.bbb.ccc}
//
// 占位符可以包含一个默认值，默认值跟占位符名称使用冒号 “:” 分隔，比如
// ${abc.bbb.ccc:default Value}
//
// 占位符名称可以是一个对象名称路径（name path），其中对象（属性）名称只能由
// [\w- ] 字符（即 a-zA-Z0-9_- ）组成。
const stringPlaceholderPattern = '\\${([\\w- ]+(\\.[\\w- ]+)*)(:.+)?}';

// 字符串格式化的说明符（specifier）的正则式
// 比如 "%s", "%d"
const stringFormatSpecifierPattern = '%[sd]';

// ## CJK 字符的 Unicode 范围表：
//
// CJK is for "Chinese, Japanese and Korean".
// The constant CJK contains following Unicode blocks:
//
// 	\u2e80-\u2eff CJK Radicals Supplement 中日韩字基补充
// 	\u2f00-\u2fdf Kangxi Radicals 康熙字根
// 	\u3040-\u309f Hiragana 平假名
// 	\u30a0-\u30ff Katakana 片假名
// 	\u3100-\u312f Bopomofo 注音
// 	\u3200-\u32ff Enclosed CJK Letters and Months 中日韩字母和月份
// 	\u3400-\u4dbf CJK Unified Ideographs Extension A 扩充汉字
// 	\u4e00-\u9fff CJK Unified Ideographs 汉字
//  \uA960—\uA97F Hangul Jamo Extended-A
//  \uAC00—\uD7AF Hangul Syllables 韩文
//  \uD7B0—\uD7FF Hangul Jamo Extended-B 韩文
// 	\uf900-\ufaff CJK Compatibility Ideographs 中日韩兼容性表意文字
//
// \u20000—\u2A6DF CJK Unified Ideographs Extension B
// \u2A700—\u2B73F CJK Unified Ideographs Extension C
// \u2B740—\u2B81F CJK Unified Ideographs Extension D
// \u2B820—\u2CEAF CJK Unified Ideographs Extension E
// \u2CEB0—\u2EBEF CJK Unified Ideographs Extension F
// \u2F800—\u2FA1F CJK Compatibility Ideographs Supplement
//
// ### 其他:
//
// \u0391-\u03c9 // 希腊字母
// \u00c0-\u00ff // 拉丁字母
// \u0600-\u06ff // 阿拉伯字母
//
// \u3000-\u302f // 中文符号
// \uff00-\uff3f // 全角符号（包括英文符号对应的中文符号，比如全角逗号） 数字 字母
//
// ### 更多有关 Unicode blocks 的信息：
//
// https://github.com/vinta/pangu.js/blob/master/src/shared/core.js
// http://unicode-table.com/en/
// https://unicode-table.com/en/blocks/
// https://github.com/vinta/pangu

const CJKCharRanges = [
    0x2e80, 0x2eff, // CJK Radicals Supplement 中日韩字基补充
    0x2f00, 0x2fdf, // Kangxi Radicals 康熙字根
    0x3040, 0x309f, // Hiragana 平假名
    0x30a0, 0x30ff, // Katakana 片假名
    0x3100, 0x312f, // Bopomofo 注音
    0x3200, 0x32ff, // Enclosed CJK Letters and Months 中日韩字母和月份
    0x3400, 0x4dbf, // CJK Unified Ideographs Extension A 扩充汉字
    0x4e00, 0x9fff, // CJK Unified Ideographs 汉字
    0xA960, 0xA97F, // Hangul Jamo Extended-A
    0xAC00, 0xD7AF, // Hangul Syllables 韩文
    0xD7B0, 0xD7FF, // Hangul Jamo Extended-B 韩文
    0xf900, 0xfaff, // CJK Compatibility Ideographs 中日韩兼容性表意文字

    0x20000, 0x2A6DF, // CJK Unified Ideographs Extension B
    0x2A700, 0x2B73F, // CJK Unified Ideographs Extension C
    0x2B740, 0x2B81F, // CJK Unified Ideographs Extension D
    0x2B820, 0x2CEAF, // CJK Unified Ideographs Extension E
    0x2CEB0, 0x2EBEF, // CJK Unified Ideographs Extension F
    0x2F800, 0x2FA1F, // CJK Compatibility Ideographs Supplement
];

const camelCasePattern = '^([a-z][a-z0-9]*)([A-Z][a-z0-9]*)*$';
const spaceCasePattern = '^([a-z][a-z0-9]*)( [a-z][a-z0-9]*)*$';
const dashCasePattern = '^([a-z][a-z0-9]*)(-[a-z][a-z0-9]*)*$';

class StringUtils {

    /**
     * 转换文本当中的 HTML 实体（entities）
     *
     * 在 HTML 文档里显示文本内容需要先进行 HTML Escape。
     *
     * @param {*} text
     * @returns
     */
    static escapeHtml(text) {
        return escape(text);

        // HTML Escape 的原理如下：
        //
        // const htmlEntityMap = {
        //     '&': '&amp;',
        //     '<': '&lt;',
        //     '>': '&gt;',
        //     '"': '&quot;',
        //     "'": '&#39;'
        // };
        //
        // return text.replace(/[&<>"']/g, (s) => {
        //     return htmlEntityMap[s];
        // });

    }

    /**
     * 还原 HTML 实体（entities）
     *
     * @param {*} text
     * @returns
     */
    static unescapeHtml(text) {
        return unescape(text);

        // HTML Unescape 的原理如下：
        //
        // const reverseHtmlEntityMap = {
        //     '&amp;': '&',
        //     '&#38;': '&',
        //     '&lt;': '<',
        //     '&#60;': '<',
        //     '&gt;': '>',
        //     '&#62;': '>',
        //     '&quot;': '"',
        //     '&#34;': '"',
        //     '&apos;': "'",
        //     '&#39;': "'"
        // };
        //
        // return text.replace(/(&amp;|&#38;|&lt;|&#60;|&gt;|
        //     &#62;|&quot;|&#34;|&apos;|&#39;)/g, (s) => {
        //     return reverseHtmlEntityMap[s];
        // });
    }

    /**
     * 转换文本当中的正则表达式字符。
     *
     * 用于从用户输入的文本当中安全地构建正则表达式。
     *
     * @param {*} text
     * @returns
     */
    static escapeRegularExpress(text) {
        // the regular express characters:
        // "^$\\.*+?()[]{}|"

        return text.replace(/[\\^$*+?.()|[\]{}]/g, '\\$&');
    }

    /**
     * 比较字符串
     *
     * 返回值：
     *  1: left 字符串 > right 字符串
     * -1: left 字符串 < right 字符串
     *  0: left 字符串 = right 字符串
     *
     * JavaScript 的 Array.sort() 方法是把数组元素转换为字符串
     * 然后再进行比较排序，比如
     *
     * let array1 = [1, 30, 4, 21, 100000];
     * array1.sort();
     * array1: [1, 100000, 21, 30, 4]
     *
     * 所以当排序字符串数组时，并不需要这个方法参与。
     *
     * @param {*} left
     * @param {*} right
     * @returns
     */
    static compare(left, right) {
        if (left < right) {
            return -1;
        } else if (left > right) {
            return 1;
        } else {
            return 0;
        }
    }

    /**
     * 删除或者替换字符串内部分内容，类似 Array.splice() 方法。
     *
     * @param {*} text
     * @param {*} startIndex 操作开始的索引值
     * @param {*} deleteCount 需删除的字符个数
     * @param {*} addText 需添加的文本
     * @returns
     */
    static splice(text, startIndex, deleteCount, addText) {
        let items = [];
        items.push(text.substring(0, startIndex));

        if (addText !== undefined && addText !== null && addText !== '') {
            items.push(addText);
        }

        items.push(text.substring(startIndex + deleteCount));

        return items.join('');
    }

    /**
     * 格式化字符串，类似 C 语言的 printf() 方法。
     * 目前只支持 '%d' 和 '%s' 两个说明符（specifier）。
     *
     * 示例：
     * let s = format('Hello %s, my number is %d', 'Foo', 123456);
     * s: 'Hello Foo, my number is 123456'
     *
     * Java 还有一种字符串格式化方式 MessageFormat.format()，使用占位符
     * 取代说明符，比如：
     * "At {1, time} on {1, date}, there was {2} on planet {0, number, integer}."
     * 这里的 0,1,2 会被传入的参数所填充。鉴于这种格式比较少用，StringUtils 暂时不
     * 实现这种格式化方法。
     *
     * @param {*} text
     * @param  {...any} values
     * @returns
     */
    static format(text, ...values) {
        let buffer = [];
        let bufferPos = 0;

        let idx = 0;

        let placeholderExp = new RegExp(stringFormatSpecifierPattern, 'g');
        let result = placeholderExp.exec(text);
        while (result !== null) {
            let length = result[0].length;
            // let type = result[0].substring(1);
            if (result.index !== bufferPos) {
                // add leading or gap string.
                buffer.push(text.substring(bufferPos, result.index));
                bufferPos = result.index;
            }

            if (idx < values.length) {
                buffer.push(values[idx]);
                idx++;
            }

            bufferPos += length;
            result = placeholderExp.exec(text);
        }

        // add the tail string.
        if (bufferPos < text.length) {
            buffer.push(text.substring(bufferPos, text.length));
        }

        return buffer.join('');
    }

    /**
     * 替换字符串当中的占位符。
     *
     * - 本方法会找到字符串当中格式如 '${aaa.bbb.ccc}' 的占位符，并把
     *   占位符名称（即示例中的 'aaa.bbb.ccc'）作为参数传递给 resolverFunc，
     *   resolverFunc 方法需返回解析后的字符串。
     * - 占位符可以包含一个默认值，默认值跟占位符名称使用冒号 “:” 分隔，比如：
     *   ${abc.bbb.ccc:default Value}
     * - 占位符名称可以是一个对象名称路径（name path），其中对象（属性）名称只能由
     *   [\w- ] 字符（即 a-zA-Z0-9_- ）组成。
     *
     * @param {*} text
     * @param {*} resolverFunc 解析占位符的方法，方法签名如下：
     *            function (placeholderName) {
     *                return 'value';
     *            }
     * @returns
     */
    static resolvePlaceholder(text, resolverFunc) {

        // resolverFunc 方法签名如下：
        //
        // function (placeholderName) {
        //      return 'value';
        // }

        let buffer = [];
        let bufferPos = 0;

        // see also:
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/exec
        let placeholderExp = new RegExp(stringPlaceholderPattern, 'g');
        let result = placeholderExp.exec(text);
        while (result !== null) {
            let length = result[0].length;
            let name = result[1];
            if (result.index !== bufferPos) {
                // add leading or gap string.
                buffer.push(text.substring(bufferPos, result.index));
                bufferPos = result.index;
            }

            // convert hyphen and space case name path into camel case,
            // e.g.
            // ${abc.def-ijk.lmn opq.xyz} -> ${abc.defIjk.lmnOpq.uvw}

            let camelName = StringUtils.camelCaseNamePath(name);
            let value = resolverFunc(camelName);
            if (value === undefined) {
                // 占位符可以包含一个默认值，默认值跟占位符名称使用冒号 “:” 分隔，比如：
                // ${abc.bbb.ccc:default Value}
                // 当解析函数没返回值时，先尝试查找默认值，如果没有默认值
                // 则用占位符名称替换占位符。
                if (result[3] !== undefined) {
                    // 添加默认值
                    buffer.push(result[3]);
                } else {
                    // 添加原始的占位符名称
                    buffer.push(`${name}`);
                }
            } else {
                buffer.push(value);
            }

            bufferPos += length;
            result = placeholderExp.exec(text);
        }

        if (bufferPos < text.length) {
            buffer.push(text.substring(bufferPos, text.length));
        }

        return buffer.join('');
    }

    /**
     * 通过一个上下文对象（context object）解析字符串当中的占位符。
     *
     * 比如有字符串：
     * "Hello ${user.name}, your number is ${user.number}."
     *
     * 构建一个上下文对象：
     * {
     *     user: {name: 'Foo', number: 123456}
     * }
     *
     * 解析后的字符串为：
     * "Hello Foo, your number is 123456."
     *
     * @param {*} text
     * @param {*} contextObject
     * @returns
     */
    static resolvePlaceholderByContextObject(text, contextObject) {
        return StringUtils.resolvePlaceholder(text, (placeholderName) => {
            return ObjectUtils.getPropertyValueByNamePath(contextObject, placeholderName);
        });
    }

    /**
     * 将字符串转为仅包含以下字符的字符串：
     * - 小写字母
     * - 横线（减号）、下划线（_）和波浪号（~）
     * - Unicode 字符
     *
     * 其中诸如空格（ ）、逗号（,）等字符会被转为横线（减号），连续的
     * 横线将会被合并为一个横线。
     *
     * 比如 "Hello, I'm Foo!" 将被转换为 “hello-im-foo”
     *
     * 如果字符串是一个 URL 路径，需要先将路径的各个部分分隔出来，然后分别
     * slug 处理，再拼接，比如：
     *
     * "/path/to/some-file"
     *
     * 不能直接用于 slug 处理，需要分隔为 ['path','to','some-file'] 分别 slug
     * 再拼接。
     *
     * @param {*} text
     */
    static slugify(text) {
        return uslug(text);
    }

    /**
     * slug 处理文件路径
     *
     * 示例：
     * '/usr/local/share/my demo.app'
     * 将会被转为：
     * '/usr/local/share/my-demoapp'
     *
     * @param {*} filePath
     * @param {*} sepChar 路径分隔符，默认为 '/'
     * @returns
     */
    static slugifyFilePath(filePath, sepChar = '/') {
        return filePath.split(sepChar).map((item) => {
            return StringUtils.slugify(item);
        }).join(sepChar);
    }

    /**
     * 转换大小写类型
     *
     * @param {*} text 源文本
     * @param {*} caseType 大小写类型
     * @param {*} localeCode 本地代码（Locale Code），可选，
     *     仅用于 CaseType.upper 和 CaseType.lower 两种类型。
     * @returns
     */
    static changeCase(text, caseType, localeCode = '') {
        switch (caseType) {
            case CaseType.camel:
                return camelCase(text);

            case CaseType.pascal:
                return pascalCase(text);

            case CaseType.constant:
                return constantCase(text);

            case CaseType.space:
                return noCase(text);

            case CaseType.dash:
                return paramCase(text);

            case CaseType.underscore:
                return snakeCase(text);

            case CaseType.dot:
                return dotCase(text);

            case CaseType.capital:
                return capitalCase(text);

            case CaseType.title:
                return titleCase(text);

            case CaseType.sentence:
                return sentenceCase(text);

            case CaseType.lower:
                return localeLowerCase(text, localeCode);

            case CaseType.upper:
                return localeUpperCase(text, localeCode);

            default:
                throw new IllegalArgumentException('Unknown case type.');
        }
    }

    /**
     * 转换文本大小写为驼峰式 （Camel Case）
     *
     * e.g.
     * foo bar -> fooBar
     * foo-bar -> fooBar
     * foo_bar -> fooBar
     *
     * @param {*} text
     * @returns
     */
    static camelCase(text) {
        return StringUtils.changeCase(text, CaseType.camel);

        // let camel = text;
        //
        // if (camel.match(/[-_ ]/)) {
        //     camel = camel.toLowerCase(); // ignore case
        //     camel = camel.replace(/([-_ ])([a-zA-Z0-9])/g, (match, p1, p2) => {
        //         return p2.toUpperCase();
        //     });
        // }
        //
        // if (camel.match(/^[A-Z]/)) {
        //     camel = camel.charAt(0).toLowerCase() + camel.slice(1);
        // }
        //
        // return camel;
    }

    /**
     * 将对象名称路径（Name path）的大小写转换为驼峰式（Camel Case）。
     *
     * 对象名称路径是指层次型对象的属性名称通过点号（.）进行的连接，比如
     *
     * {
     *     foo: {
     *         bar: {id: 123, name:'Foobar'}
     *     }
     * }
     *
     * 当中 'id' 的路径为 'foo.bar.id'
     *
     * 有时名称路径由用户输入，一般用户输入习惯使用空格式或者横线式大小写，
     * 而对象的属性定义则习惯驼峰式，此方法的作用是让用户输入的名称路径转换
     * 成可以直接访问的对象属性名称。
     *
     * 比如：
     * - 'abc-dev.opq-rst.uvw-xyz'
     * - 'abc dev.opq rst.uvw xyz'
     * - 'abc_dev.opq_rst.uvw_xyz'
     *
     * 都会转为：
     * 'abcDev.opqRst.uvwXyz'
     *
     * @param {*} namePath
     * @returns
     */
    static camelCaseNamePath(namePath) {
        let parts = namePath.split('.');
        for (let idx = 0; idx < parts.length; idx++) {
            parts[idx] = StringUtils.camelCase(parts[idx]);
        }
        return parts.join('.');
    }

    /**
     * 判断字符串大小写为 camel case 格式。
     *
     * @param {*} text
     * @returns
     */
    static isCamelCase(text) {
        return new RegExp(camelCasePattern).test(text);
    }

    /**
     * 转换文本大小写为空格式
     *
     * e.g.
     * fooBar -> foo bar
     * foo-bar -> foo bar
     * foo_bar -> foo bar
     *
     * @param {*} text
     * @returns
     */
    static spaceCase(text) {
        return StringUtils.changeCase(text, CaseType.space);

        // let key = text;
        // if (/^[A-Za-z0-9]+$/.test(key)) {
        //     key = text.replace(/([A-Z])/g, ' $1');
        // } else if (/[-_]/.test(key)) {
        //     key = text.replace(/[-_]/g, ' ');
        // }
        // key = key.replace(/ {2,}/g, ' ');
        // key = key.toLowerCase();
        // key = key.trim();
        // return key;
    }

    /**
     * 判断字符串大小写为 space case 格式。
     *
     * @param {*} text
     * @returns
     */
    static isSpaceCase(text) {
        return new RegExp(spaceCasePattern).test(text);
    }

    /**
     * 转换文本大小写为横线式
     *
     * e.g.
     * fooBar -> foo-bar
     * foo bar -> foo-bar
     *
     * @param {*} text
     * @returns
     */
    static dashCase(text) {
        return StringUtils.changeCase(text, CaseType.dash);

        // let key = text;
        // if (/^[A-Za-z0-9]+$/.test(key)) {
        //     key = text.replace(/([A-Z])/g, '-$1');
        // } else if (/ /.test(key)) {
        //     key = text.replace(/ /g, '-');
        // }
        // key = key.replace(/-{2,}/g, '-');
        // key = key.toLowerCase();
        // key = key.trim();
        // return key;
    }

    /**
     * 判断字符串大小写为 dash case 格式。
     *
     * @param {*} text
     * @returns
     */
    static isDashCase(text) {
        return new RegExp(dashCasePattern).test(text);
    }

    /**
     * 将对象的所有属性的名称大小写转换为指定的类型。
     *
     * @param {*} obj
     * @param {*} caseType
     * @returns
     */
    static changeObjectKeysCase(obj, caseType) {
        let result;

        if (obj === undefined || obj === null) {
            result = obj;

        } else if (Array.isArray(obj)) {
            result = [];
            for (let item of obj) {
                result.push(StringUtils.changeObjectKeysCase(item, caseType));
            }

        } else if (obj instanceof Date) {
            result = obj;

        } else if (typeof obj === 'object') {
            result = {};
            for (let key in obj) {
                let camelCaseKey = StringUtils.changeCase(key, caseType);
                let value = StringUtils.changeObjectKeysCase(obj[key], caseType);
                result[camelCaseKey] = value;
            }

        } else {
            return obj;
        }

        return result;
    }

    /**
     * 将对象的所有属性的名称大小写转换为驼峰式（Camel Case）
     *
     * @param {*} obj
     * @returns
     */
    static camelCaseObjectKeys(obj) {
        return StringUtils.changeObjectKeysCase(obj, CaseType.camel);
    }

    /**
     * 将对象的所有属性的名称大小写转换为空格式
     *
     * @param {*} obj
     * @returns
     */
    static spaceCaseObjectKeys(obj) {
        return StringUtils.changeObjectKeysCase(obj, CaseType.space);
    }

    /**
     * 判断一个字符是否为 CJK 字符。
     *
     * @param {*} char
     * @returns
     */
    static isCJKChar(char) {
        let found = false;
        let code = char.codePointAt(0);
        for (let idx = 0; idx < CJKCharRanges.length / 2; idx++) {
            if (code >= CJKCharRanges[idx * 2] &&
                code <= CJKCharRanges[idx * 2 + 1]) {
                found = true;
                break;
            }
        }
        return found;
    }

    /**
     * 获取指定位置的下一个 Unicode 字符。
     *
     * @param {*} text
     * @param {*} offset 开始查找的位置（索引值）
     *     如果索引值超出文本范围，将会返回空字符串
     * @returns
     */
    static getNextUnicodeChar(text, offset) {
        // 对于复合字符 unicode, 使用库 'GraphemeBreaker' 的
        // 'graphemeBreaker.nextBreak()' 方法可以获得下一个复合字符 unicode 字符的位置。
        // 复合字符字符是指由多个 Unicode 字符 “合并显示” 为一个字符的字符。

        // 复合字符比如一些 emoji 和中文字符，比如'🉑︎',𠮷 等。
        //
        // 顺带一提，unicode 字符最多可以是 4 个字节 (在 JavaScript 内部, 每个字符
        // 使用 2 个字节储存），char code 在 0xffff 以上的有可能是多字节字符。

        // 复合字符长度：
        // - 🉑 length = 2
        // - '🉑︎' length = 3, 有一个 char Variation Selectors 在末尾。（注：在某些编辑器
        //   看起来以上两个字符可能显示为一模一样，同时在某些编辑器复制粘贴过程中也会
        //   丢失后缀的 \ufe0e，完整的字符为 '🉑\ufe0e'）
        // - 吉 length = 1 (1 CN letter)
        // - 𠮷 length = 2

        // 参考：
        // https://segmentfault.com/a/1190000007594620
        // http://www.ruanyifeng.com/blog/2017/04/emoji.html
        // https://en.wikipedia.org/wiki/Zero-width_joiner
        // https://en.wikipedia.org/wiki/Fitzpatrick_scale
        // https://en.wikipedia.org/wiki/Variation_Selectors_(Unicode_block)
        // https://unicode.org/emoji/charts/full-emoji-list.html
        // https://unicode.org/emoji/charts/full-emoji-modifiers.html

        // 复合字符测试：
        // - 🉑 (length = 2),
        // - '🉑︎' (length = 3, x + U+FE0E, with Variation Selectors U+FE0E, U+FE0F),
        // - 🤚🏾 (length = 3, U+1F91A + U+1F3FE, with modifier <U+1F3FB> – <U+1F3FF> named as FITZ-1-2, FITZ-3, FITZ-4, FITZ-5, FITZ-6.)
        // - 👩‍🏫 (length = 5, U+1F469 + U+200D + U+1F3EB, with Zero-width joiner U+200D)
        // - 🕵️‍♂️ (length = 6, U+1F575 U+FE0F U+200D U+2642 U+FE0F,)
        // - 💂‍♀️ (length = 5, U+1F482 U+200D U+2640 U+FE0F)
        // - 👩‍❤️‍💋‍👨 (length = 11, U+1F469 U+200D U+2764 U+FE0F U+200D U+1F48B U+200D U+1F468)

        // '😜👍🏼👍🤦🏻‍♂️' // 长度分别是 2,4,2,7
        // GraphemeBreaker.nextBreak('😜👍🏼👍🤦🏻‍♂️', 6)     // 返回结果 => 👍
        // GraphemeBreaker.previousBreak('😜👍🏼👍🤦🏻‍♂️', 6) // 返回结果 => 👍🏼
        //
        // 参考
        // https://github.com/taisukef/grapheme-breaker-mjs
        let nextOffset = GraphemeBreaker.nextBreak(text, offset);
        return text.substring(offset, nextOffset);
    }

    /**
     *
     * @param {*} text
     * @param {*} offset 如果 offset 超出文本范围，则返回文本的长度。
     * @returns
     */
    static getNextUnicodeOffset(text, offset) {
        return GraphemeBreaker.nextBreak(text, offset);
    }

    /**
     * 获取指定位置的前一个 Unicode 字符。
     * @param {*} text
     * @param {*} offset 开始查找的位置（索引值），结果字符不包括此位置
     *     - 如果索引值超出文本范围，将会返回空字符串
     *     - 如果索引值为 0，也会返回空字符串
     * @returns
     */
    static getPreviousUnicodeChar(text, offset) {
        let previousOffset = GraphemeBreaker.previousBreak(text, offset);
        return text.substring(previousOffset, offset);
    }

    /**
     *
     * @param {*} text
     * @param {*} offset 如果 offset 超出文本范围，则返回文本的长度。
     *     如果 offset 为 0，则返回 0。
     * @returns
     */
    static getPreviousUnicodeOffset(text, offset) {
        return GraphemeBreaker.previousBreak(text, offset);
    }

    /**
     * 将文本拆分为 Unicode 字符
     * @param {*} text
     * @returns 返回字符数组 [Char,...]
     */
    static splitIntoUnicodeChar(text) {
        return GraphemeBreaker.break(text);
    }

    /**
     * 计算 Unicode 字符个数
     * @param {*} text
     * @returns
     */
    static countUnicodeChars(text) {
        return GraphemeBreaker.countBreaks(text);
    }

    /**
    * 判断一个 Unicode 字符是否为普通字符还是标点符号。
    *
    * @param {*} char
    * @param {*} wordType
    */
    static getUnicodeCharType(char) {

        // unicode category and unicode property:
        // https://www.regular-expressions.info/unicode.html#category
        // https://2ality.com/2017/07/regexp-unicode-property-escapes.html

        let letterRegex = /([0-9\p{L}])/u;
        let punctuationRegex = /([`\p{P}])/u;

        // 注：
        // - '\p{L}' 不包含数字 [0-9]；
        // - '\p{P}' 包含数字 [0-9]；
        // - 当前方法将数字纳入 “字符” 范围，所以把 '[0-9]' 添加到
        //   第一个正则表达式里；
        // - '`' 即不是字符，也不是标点，所以添加到第二个正则表达式里。

        // switch (wordType) {
        //     case UnicodeCharType.letter:
        //         {
        //             return letterRegex.test(char) ?
        //                 UnicodeCharType.letter : UnicodeCharType.other;
        //         }
        //
        //     case UnicodeCharType.punctuation:
        //         {
        //             return punctuationRegex.test(char) ?
        //                 UnicodeCharType.punctuation : UnicodeCharType.other;
        //         }
        //
        //     default:
        //         {
        let isLetter = letterRegex.test(char);
        if (isLetter) {
            return UnicodeCharType.letter;
        } else {
            let isPunc = punctuationRegex.test(char);
            if (isPunc) {
                return UnicodeCharType.punctuation;
            } else {
                return UnicodeCharType.other;
            }
        }
        //     }
        // }
    }

    /**
     * 以忽略大小写的方式查找字符串数组里的匹配项。
     *
     * @param {*} items
     * @param {*} text
     * @returns
     */
    static arrayIndexOfIgnoreCase(items, text) {
        let upperCaseText = text.toUpperCase();
        // let pos = -1;
        // for (let idx = 0; idx < items.length; idx++) {
        //     if (items[idx].toUpperCase() === upperCaseText) {
        //         pos = idx;
        //         break;
        //     }
        // }
        // return pos;

        return items.findIndex(item => {
            return item.toUpperCase() === upperCaseText;
        });
    }

    /**
     * 根据指定的范围列表裁剪字符串。
     *
     * @param {*} text
     * @param {*} ranges 为 {start: int, end: int} 对象的数组，示例：
     *     [{start: 1, end: 5}, {start: 10, end: 20}, ...]，
     *     start, end 均为字符的索引值（位置），其中包括 start，而不包括 end。
     * @param {*} rangeOffset start 和 end 的偏移值。可以是正整数，也可以是
     *     负整数。当为负整数时，start 和 end 对向左移动。
     * @returns
     */
    static truncateTextByRanges(text, ranges, rangeOffset = 0) {

        // 将 ranges 按照 start 值从小到大排序。
        //
        // 注意 Array.sort 方法是将元素转换为字符串之后再排序，这里
        // 我们需要按整型排序。
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort?v=example
        ranges.sort((left, right) => {
            return left.start - right.start;
        });

        for (let idx = ranges.length - 1; idx >= 0; idx--) {
            let range = ranges[idx];
            text = StringUtils.splice(text, range.start + rangeOffset, range.end - range.start);
        }

        return text;
    }

    /**
     * 计算文本的 Hash 值
     *
     * 注意这个方法仅用于计算短文本的 Hash 值，对于一个文本文件，
     * 因为不知道它的文件大小，最好不要使用这个方法来计算 Hash 以免
     * 出现性能问题。
     *
     * @param {*} text
     * @param {*} hashAlgorithm
     * @returns 返回 Hash 值的 16 进制的小写字符串。
     */
    static hashText(text, hashAlgorithm = HashAlgorithm.sha256) {
        let hash

        switch (hashAlgorithm) {
            case HashAlgorithm.sha256:
                hash = crypto.createHash('sha256');
                break;

            default:
                throw new IllegalArgumentException('Unsupport hash algorithm.');
        }

        hash.update(text, 'utf8');
        return hash.digest('hex');
    }

    static get stringPlaceholderPattern() {
        return stringPlaceholderPattern;
    }

    static get stringFormatSpecifierPattern() {
        return stringFormatSpecifierPattern;
    }
}

module.exports = StringUtils;
