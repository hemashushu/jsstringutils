const assert = require('assert/strict');
const { ObjectUtils } = require('jsobjectutils');

const {
    StringUtils,
    CaseType,
    HashAlgorithm,
    UnicodeCharType } = require('../index');

describe('StringUtils Test', () => {
    it('Test escapeHtml()', () => {
        let s1 = 'test <DIV> & "quote" & \'single\'';
        let e1 = 'test &lt;DIV&gt; &amp; &quot;quote&quot; &amp; &#39;single&#39;'
        let r1 = StringUtils.escapeHtml(s1);
        assert.equal(r1, e1);
    });

    it('Test unescapeHtml()', () => {
        let e1 = 'test &lt;DIV&gt; &amp; &quot;quote&quot; &amp; &#39;single&#39;'
        let e2 = 'test &#60;DIV&#62; &#38; &#34;quote&#34; &#38; &#39;single&#39;'
        let s1 = 'test <DIV> & "quote" & \'single\'';
        let r1 = StringUtils.unescapeHtml(e1);
        let r2 = StringUtils.unescapeHtml(e2);

        assert.equal(r1, s1);
        assert.equal(r2, s1);
    });

    it('Test escapeRegularExpress()', () => {
        let s1 = '^$\\.*+?()[]{}|';
        let e1 = String.raw`\^\$\\\.\*\+\?\(\)\[\]\{\}\|`;

        let r1 = StringUtils.escapeRegularExpress(s1);
        assert.equal(r1, e1);
    });

    it('Test compare()', () => {
        let c1 = StringUtils.compare('abc', 'xyz');
        let c2 = StringUtils.compare('abc', 'abc');
        let c3 = StringUtils.compare('xyz', 'abc');

        assert.equal(c1, -1);
        assert.equal(c2, 0);
        assert.equal(c3, 1);
    });

    it('Test splice()', () => {
        let s1 = 'Hello123World';

        let r1 = StringUtils.splice(s1, 5, 3);
        assert.equal(r1, 'HelloWorld');

        let r2 = StringUtils.splice(r1, 5, 0, ' ');
        assert.equal(r2, 'Hello World');

        let r3 = StringUtils.splice(r2, 1, 9, '00000');
        assert.equal(r3, 'H00000d');
    });

    it('Test format()', () => {
        let s1 = 'Hello %s, my number is %d.';
        let r1 = StringUtils.format(s1, 'Foo', 123456);

        assert.equal(r1, 'Hello Foo, my number is 123456.');
    });

    it('Test resolvePlaceholder()', () => {
        let s1 = 'Hello ${name}, my number is ${number}.';
        let r1 = StringUtils.resolvePlaceholder(s1, (placeholder) => {
            switch (placeholder) {
                case 'name':
                    return 'Foo';

                case 'number':
                    return 123456;
            }
        });

        assert.equal(r1, 'Hello Foo, my number is 123456.');
    });

    it('Test resolvePlaceholderByContextObject()', () => {
        let s1 = 'Hello ${user.name}, my number is ${user.number}.';
        let o1 = {
            user: {
                name: 'Foo',
                number: 123456
            }
        };

        let r1 = StringUtils.resolvePlaceholderByContextObject(s1, o1);
        assert.equal(r1, 'Hello Foo, my number is 123456.');
    });

    it('Test slugify()', () => {
        let s1 = 'Hello, I\'m Foo!';
        let r1 = StringUtils.slugify(s1);
        assert.equal(r1, 'hello-im-foo');
    });

    it('Test slugifyFilePath()', () => {
        let s1 = '/usr/local/share/my demo.app';
        let r1 = StringUtils.slugifyFilePath(s1);
        assert.equal(r1, '/usr/local/share/my-demoapp');
    });

    it('Test changeCase()', () => {
        let s1 = 'This is an example';

        assert.equal(StringUtils.changeCase(s1, CaseType.camel), 'thisIsAnExample');
        assert.equal(StringUtils.changeCase(s1, CaseType.pascal), 'ThisIsAnExample');
        assert.equal(StringUtils.changeCase(s1, CaseType.constant), 'THIS_IS_AN_EXAMPLE');
        assert.equal(StringUtils.changeCase(s1, CaseType.space), 'this is an example');
        assert.equal(StringUtils.changeCase(s1, CaseType.dash), 'this-is-an-example');
        assert.equal(StringUtils.changeCase(s1, CaseType.underscore), 'this_is_an_example');
        assert.equal(StringUtils.changeCase(s1, CaseType.dot), 'this.is.an.example');
        assert.equal(StringUtils.changeCase(s1, CaseType.capital), 'This Is An Example');
        assert.equal(StringUtils.changeCase(s1, CaseType.title), 'This Is an Example');
        assert.equal(StringUtils.changeCase(s1, CaseType.sentence), 'This is an example');
        assert.equal(StringUtils.changeCase(s1, CaseType.lower), 'this is an example');
        assert.equal(StringUtils.changeCase(s1, CaseType.upper), 'THIS IS AN EXAMPLE');
    });

    it('Test camelCase()', () => {
        let s1 = 'This is an example';
        assert.equal(StringUtils.camelCase(s1), 'thisIsAnExample');
    });

    it('Test camelCaseNamePath()', () => {
        let s1 = 'Some path.to.Some Directory.text-file';
        assert.equal(StringUtils.camelCaseNamePath(s1), 'somePath.to.someDirectory.textFile');
    });

    it('Test isCamelCase()', () => {
        assert(StringUtils.isCamelCase('abc'));
        assert(StringUtils.isCamelCase('abcFooBar'));
        assert(StringUtils.isCamelCase('abcHTMLText'));
        assert(StringUtils.isCamelCase('abc1Foo2Bar3'));
        assert(!StringUtils.isCamelCase('Abc'));
        assert(!StringUtils.isCamelCase('AbcFooBar'));
        assert(!StringUtils.isCamelCase('abc-foo-bar'));
        assert(!StringUtils.isCamelCase('abc foo bar'));
        assert(!StringUtils.isCamelCase('abc.foo.bar'));
    });

    it('Test spaceCase()', () => {
        let s1 = 'This is an example';
        assert.equal(StringUtils.spaceCase(s1), 'this is an example');
    });

    it('Test isSpaceCase()', () => {
        assert(StringUtils.isSpaceCase('abc'));
        assert(StringUtils.isSpaceCase('abc foo bar'));
        assert(StringUtils.isSpaceCase('abc a k a xyz'));
        assert(StringUtils.isSpaceCase('abc1 foo2 bar3'));
        assert(!StringUtils.isSpaceCase('Abc'));
        assert(!StringUtils.isSpaceCase('AbcFooBar'));
        assert(!StringUtils.isSpaceCase('abcFooBar'));
        assert(!StringUtils.isSpaceCase('Abc Foo Bar'));
        assert(!StringUtils.isSpaceCase('abc-foo-bar'));
        assert(!StringUtils.isSpaceCase('abc.foo.bar'));
    });

    it('Test dashCase()', () => {
        let s1 = 'This is an example';
        assert.equal(StringUtils.dashCase(s1), 'this-is-an-example');
    });

    it('Test isDashCase()', () => {
        assert(StringUtils.isDashCase('abc'));
        assert(StringUtils.isDashCase('abc-foo-bar'));
        assert(StringUtils.isDashCase('abc-a-k-a-xyz'));
        assert(StringUtils.isDashCase('abc1-foo2-bar3'));
        assert(!StringUtils.isDashCase('Abc'));
        assert(!StringUtils.isDashCase('AbcFooBar'));
        assert(!StringUtils.isDashCase('abcFooBar'));
        assert(!StringUtils.isDashCase('Abc Foo Bar'));
        assert(!StringUtils.isDashCase('abc foo bar'));
        assert(!StringUtils.isDashCase('abc-2-foo'));
        assert(!StringUtils.isDashCase('abc-Foo'));
        assert(!StringUtils.isDashCase('abc.foo.bar'));
    });

    it('Test changeObjectKeysCase()', () => {
        let o1 = {
            user: {
                'first-name': 'Foo',
                'last name': 'Bar',
                'work phone': {
                    'Country code': '+86',
                    number: '1234567'
                }
            }
        }

        let r1 = StringUtils.changeObjectKeysCase(o1, CaseType.dash);
        assert(ObjectUtils.objectEquals(r1, {
            user: {
                'first-name': 'Foo',
                'last-name': 'Bar',
                'work-phone': {
                    'country-code': '+86',
                    number: '1234567'
                }
            }
        }));
    });

    it('Test camelCaseObjectKeys()', () => {
        let o1 = {
            user: {
                'first-name': 'Foo',
                'last name': 'Bar',
                'work phone': {
                    'Country code': '+86',
                    number: '1234567'
                }
            }
        }

        let r1 = StringUtils.camelCaseObjectKeys(o1);
        assert(ObjectUtils.objectEquals(r1, {
            user: {
                'firstName': 'Foo',
                'lastName': 'Bar',
                'workPhone': {
                    'countryCode': '+86',
                    number: '1234567'
                }
            }
        }));
    });

    it('Test spaceCaseObjectKeys()', () => {
        let o1 = {
            user: {
                'first-name': 'Foo',
                'last name': 'Bar',
                'work phone': {
                    'Country code': '+86',
                    number: '1234567'
                }
            }
        }

        let r1 = StringUtils.spaceCaseObjectKeys(o1, CaseType.dash);
        assert(ObjectUtils.objectEquals(r1, {
            user: {
                'first name': 'Foo',
                'last name': 'Bar',
                'work phone': {
                    'country code': '+86',
                    number: '1234567'
                }
            }
        }));
    });

    it('Test isCJKChar()', () => {
        assert(StringUtils.isCJKChar('好'));
        assert(!StringUtils.isCJKChar('g'));
    });

    it('Test getNextUnicodeChar()', () => {
        let s1 = '😜👍🏼👍🤦🏻‍♂️'; // 长度分别是 2,4,2,7

        //  2 4 2 7   <-- char length
        // 0,2,6,8,15 <-- offset

        let c1 = StringUtils.getNextUnicodeChar(s1, 0);
        let l1 = c1.length;
        assert.equal(c1, '😜');
        assert.equal(l1, 2);

        let c2 = StringUtils.getNextUnicodeChar(s1, l1);
        let l2 = c2.length;
        assert.equal(c2, '👍🏼');
        assert.equal(l2, 4);

        let c3 = StringUtils.getNextUnicodeChar(s1, l1 + l2);
        let l3 = c3.length;
        assert.equal(c3, '👍');
        assert.equal(l3, 2);

        let c4 = StringUtils.getNextUnicodeChar(s1, l1 + l2 + l3);
        let l4 = c4.length;
        assert.equal(c4, '🤦🏻‍♂️');
        assert.equal(l4, 7);

        let c5 = StringUtils.getNextUnicodeChar(s1, l1 + l2 + l3 + l4);
        let l5 = c5.length;
        assert.equal(c5, '');
        assert.equal(l5, 0);

    });

    it('Test getNextUnicodeOffset()', () => {
        let s1 = '😜👍🏼👍🤦🏻‍♂️'; // 长度分别是 2,4,2,7

        //  2 4 2 7   <-- char length
        // 0,2,6,8,15 <-- offset

        let i1 = StringUtils.getNextUnicodeOffset(s1, 0);
        assert.equal(i1, 2);

        let i2 = StringUtils.getNextUnicodeOffset(s1, i1);
        assert.equal(i2, 6);

        let i3 = StringUtils.getNextUnicodeOffset(s1, i2);
        assert.equal(i3, 8);

        let i4 = StringUtils.getNextUnicodeOffset(s1, i3);
        assert.equal(i4, 15);

        let i5 = StringUtils.getNextUnicodeOffset(s1, i4);
        assert.equal(i5, 15);

        let i6 = StringUtils.getNextUnicodeOffset(s1, 100); // 超出范围
        assert.equal(i6, 15);
    });

    it('Test getPreviousUnicodeChar()', () => {
        let s1 = '😜👍🏼👍🤦🏻‍♂️'; // 长度分别是 2,4,2,7

        //  2 4 2 7   <-- char length
        // 0,2,6,8,15 <-- offset

        let c1 = StringUtils.getPreviousUnicodeChar(s1, 15);
        let l1 = c1.length;
        assert.equal(c1, '🤦🏻‍♂️');
        assert.equal(l1, 7);

        let c2 = StringUtils.getPreviousUnicodeChar(s1, 8);
        let l2 = c2.length;
        assert.equal(c2, '👍');
        assert.equal(l2, 2);

        let c3 = StringUtils.getPreviousUnicodeChar(s1, 6);
        let l3 = c3.length;
        assert.equal(c3, '👍🏼');
        assert.equal(l3, 4);

        let c4 = StringUtils.getPreviousUnicodeChar(s1, 2);
        let l4 = c4.length;
        assert.equal(c4, '😜');
        assert.equal(l4, 2);

        let c5 = StringUtils.getPreviousUnicodeChar(s1, 0);
        let l5 = c5.length;
        assert.equal(c5, '');
        assert.equal(l5, 0);
    });

    it('Test getPreviousUnicodeOffset()', () => {
        let s1 = '😜👍🏼👍🤦🏻‍♂️'; // 长度分别是 2,4,2,7

        //  2 4 2 7   <-- char length
        // 0,2,6,8,15 <-- offset

        let i1 = StringUtils.getPreviousUnicodeOffset(s1, 100); // 超出范围
        assert.equal(i1, 15);

        let i2 = StringUtils.getPreviousUnicodeOffset(s1, i1);
        assert.equal(i2, 8);

        let i3 = StringUtils.getPreviousUnicodeOffset(s1, i2);
        assert.equal(i3, 6);

        let i4 = StringUtils.getPreviousUnicodeOffset(s1, i3);
        assert.equal(i4, 2);

        let i5 = StringUtils.getPreviousUnicodeOffset(s1, i4);
        assert.equal(i5, 0);

        let i6 = StringUtils.getPreviousUnicodeOffset(s1, 0);
        assert.equal(i6, 0);
    });

    it('Test splitIntoUnicodeChar()', () => {
        let s1 = '😜👍🏼👍🤦🏻‍♂️'; // 长度分别是 2,4,2,7
        let c1 = StringUtils.splitIntoUnicodeChar(s1);

        assert(ObjectUtils.arrayEquals(c1, ['😜', '👍🏼', '👍', '🤦🏻‍♂️']));
    });

    it('Test countUnicodeChars()', () => {
        let s1 = '😜👍🏼👍🤦🏻‍♂️'; // 长度分别是 2,4,2,7
        let c1 = StringUtils.countUnicodeChars(s1);

        assert.equal(c1, 4);
    });

    it('Test getUnicodeCharType()', () => {
        assert.equal(StringUtils.getUnicodeCharType('好'), UnicodeCharType.letter);
        assert.equal(StringUtils.getUnicodeCharType('！'), UnicodeCharType.punctuation);
        assert.equal(StringUtils.getUnicodeCharType('g'), UnicodeCharType.letter);
        assert.equal(StringUtils.getUnicodeCharType('@'), UnicodeCharType.punctuation);
        assert.equal(StringUtils.getUnicodeCharType('1'), UnicodeCharType.letter);
    });

    it('Test arrayIndexOfIgnoreCase()', () => {
        let a1 = ['X', 'B', 'Y', 'A', 'b', 'x'];
        let i1 = StringUtils.arrayIndexOfIgnoreCase(a1, 'y'); // 2
        let i2 = StringUtils.arrayIndexOfIgnoreCase(a1, 'b'); // 1
        let i3 = StringUtils.arrayIndexOfIgnoreCase(a1, 'x'); // 0

        assert.equal(i1, 2);
        assert.equal(i2, 1);
        assert.equal(i3, 0);
    });

    it('Test truncateTextByRanges()', () => {

        let s1 = 'ab00cde000x0000z';
        // index: 0123456789012345

        let ranges1 = [
            { start: 2, end: 4 },
            { start: 7, end: 10 },
            { start: 11, end: 15 },
        ];

        let r1 = StringUtils.truncateTextByRanges(s1, ranges1);
        assert.equal(r1, 'abcdexz');

        let r2 = StringUtils.truncateTextByRanges(s1, ranges1, 1);
        assert.equal(r2, 'ab0de00');

    });

    it('Test hashText()', () => {
        let s1 = 'abc';
        let h1 = 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad';

        let r1 = StringUtils.hashText(s1, HashAlgorithm.sha256);
        assert.equal(r1, h1);
    });
});
