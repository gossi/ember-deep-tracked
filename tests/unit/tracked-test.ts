/* eslint-disable @typescript-eslint/no-explicit-any */
import { cached } from '@glimmer/tracking';
import { settled } from '@ember/test-helpers';
import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';

import { tracked } from 'ember-deep-tracked';

module('deep tracked', function (hooks) {
  setupTest(hooks);

  module('Objects', function () {
    test('object access', async function (assert) {
      class Foo {
        @tracked obj = {} as any;

        @cached
        get objDeep() {
          return this.obj.foo?.bar;
        }
      }

      let instance = new Foo();

      assert.notOk(instance.objDeep);

      instance.obj.foo = { bar: 3 };
      await settled();
      assert.equal(instance.objDeep, 3);

      instance.obj.foo = { bar: 4 };
      await settled();
      assert.equal(instance.objDeep, 4);

      instance.obj = { foo: { bar: 5 } };
      await settled();
      assert.equal(instance.objDeep, 5);

      instance.obj.foo = { bar: 4 };
      await settled();
      assert.equal(instance.objDeep, 4);
    });

    test('object access in an array', async function (assert) {
      class Foo {
        @tracked arr: any[] = [];

        @cached
        get arrDeep() {
          return this.arr[0]?.foo?.bar;
        }
      }

      let instance = new Foo();

      assert.notOk(instance.arrDeep);

      instance.arr.push({ foo: { bar: 2 } });
      await settled();

      assert.equal(instance.arrDeep, 2);
    });

    test('undefined to object', async function (assert) {
      class Foo {
        @tracked obj?: Record<string, any>;
      }

      let instance = new Foo();

      assert.strictEqual(instance.obj, null);

      instance.obj = {};
      await settled();

      assert.deepEqual(instance.obj, {});
    });

    test('null to object', async function (assert) {
      class Foo {
        @tracked obj: Record<string, any> | null = null;
      }

      let instance = new Foo();

      assert.strictEqual(instance.obj, null);

      instance.obj = {};
      await settled();

      assert.deepEqual(instance.obj, {});
    });
  });

  module('Arrays', function () {
    module('#splice', function () {
      test('it works', async function (assert) {
        class Foo {
          @tracked arr: any[] = [0, 1, 3];

          @cached
          get arrDeep() {
            return this.arr[0]?.foo?.bar;
          }
        }

        let instance = new Foo();

        instance.arr.splice(1, 1);

        assert.deepEqual(instance.arr, [0, 3]);
      });

      test('it works on deeply nested arrays', async function (assert) {
        class Foo {
          @tracked obj = { children: [{ property: [0, 1, 3] }] };

          splice = () => this.obj.children[0].property.splice(1, 1);

          @cached
          get output() {
            return this.obj.children[0].property;
          }
        }

        let instance = new Foo();

        assert.deepEqual(instance.output, [0, 1, 3]);
        instance.splice();
        assert.deepEqual(instance.output, [0, 3]);
      });
    });
  });

  test('array data can be re-set', async function (assert) {
    class Foo {
      @tracked arr: any[] = [0, 1, 3];

      @cached
      get arrDeep() {
        return this.arr[0]?.foo?.bar;
      }
    }

    let instance = new Foo();

    instance.arr = [4, 8];

    assert.deepEqual(instance.arr, [4, 8]);
  });

  test('array data can be immutably treated', async function (assert) {
    class Foo {
      @tracked arr: { id: number; prop: string }[] = [
        {
          id: 1,
          prop: 'foo',
        },
        {
          id: 2,
          prop: 'bar',
        },
        {
          id: 3,
          prop: 'baz',
        },
      ];
    }

    let instance = new Foo();

    assert.deepEqual(instance.arr, [
      {
        id: 1,
        prop: 'foo',
      },
      {
        id: 2,
        prop: 'bar',
      },
      {
        id: 3,
        prop: 'baz',
      },
    ]);

    instance.arr = instance.arr.map((el) => {
      if (el.id === 2) {
        return {
          ...el,
          prop: 'boink',
        };
      }

      return el;
    });

    assert.deepEqual(instance.arr, [
      {
        id: 1,
        prop: 'foo',
      },
      {
        id: 2,
        prop: 'boink',
      },
      {
        id: 3,
        prop: 'baz',
      },
    ]);
  });
});
