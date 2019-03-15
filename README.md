# topo-strict
Strict topological sorting, with API inspired by
[topo](https://www.npmjs.com/package/topo).


## Basic Usage
The basic API is fairly similar to `topo`. You can create an instance of
`Problem` and add items to it, then solve using the `Problem#solve` method:

```js
const { Problem } = require('topo-strict');

const morning = new Problem();

morning.add('Nap', { after: [ 'breakfast', 'prep' ] });

morning.add([
	'Make toast',
	'Pour juice',
], { before: 'breakfast', group: 'prep' });

morning.add('Eat breakfast', { group: 'breakfast' });

console.log(morning.solve());
// [ 'Make toast', 'Pour juice', 'Eat breakfast', 'Nap' ]
```


## The Rules
True to the name, `topo-strict` enforces several rules that are not enforced by
`topo`, and leverages [Nani](https://www.npmjs.com/package/nani) to produce
detailed errors whenever something goes wrong. The rules are as follows:

- Strings added to a Problem-- henceforth known as *ids*-- must be unique, and
  must not be empty.

- Strings provided to the `group` option-- henceforth known as *group keys*--
  must also be non-empty and may not share a value with any ids in the Problem.

- Strings provided to the `before` and `after` options-- henceforth known as
  *constraint keys*-- need not reference existing ids or group keys at the time
  they are added, but *must* do so by the the time `Problem#solve` is called.

Violating any of these rules-- or providing non-string values to any of these
options-- will cause a `ValidationError` that contains `KeyErrors` identifying
all bad keys, making it easy to tell exactly what went wrong.


## Advantages vs. `topo`
- The strict enforcement of the rules above makes `topo-strict` more appropriate
  for situations where you really want to make sure nothing unexpected every
  happens-- where failing fast with detailed errors is preferable-- such as
  dependency ordering that occurs when a server starts up.

- `topo` only allows referencing of group keys through `before` and `after`
  constraints. Any ungrouped items cannot be sorted topologically. This means
  that in order to make a truly extensible dependency order, you have to specify
  a group with everything you add, even if you don't intend to add anything else
  to the group.

- The final order of ids from `topo-strict` is completely independent of
  insertion order. Instead, a single canonical solution is found by prioritizing
  ids alphabetically. This can make things a bit more predictable.

- `topo-strict` supports several additional signatures to the `#add` method,
  described below.

- `topo-strict` also comes with some features for easily viewing the Problem
  and the graph that will be used to solve it, also described below.

- `topo-strict` does not attempt to solve the problem until you actually call
  `Problem#solve`, whereas `topo` solves it after every single call to `add`.
  This is unlikely to make a significant difference performance-wise unless you
  have a huge number if `ids`,  so it's hardly worth noting. I noted it anyway,
  though. :\


## Disadvantages vs `topo`
- The rules of `topo-strict` are obviously not always appropriate, and in
  situations where you'd rather be loose, you should probably use `topo`.

- `topo-strict` has a much larger footprint than `topo`, not least of which
  because it depends on the whole of `lodash`, so `topo` will usually be more
  appropriate for use in browsers.

- Because `topo-strict` does not attempt to solve the Problem until you actually
  call `Problem#solve`, it won't detect cycles at the precise moment you create
  them, the way `topo` does.


## More Stuff
A few more features of `topo-strict` will be discussed here. You can read about
anything else in the [api docs](https://sripberger.github.io/topo-strict).

### Alternate `#add` Signatures
When you're adding stuff to a Problem, you can use the signatures demonstrated
in Basic Usage above, or you can do these:

```js
// The canonical form
problem.add({
	values: [ 'foo', 'bar' ],
	group: 'baz',
});

// Shorthand form with multiple ids.
problem.add('foo', 'bar', { group: 'baz' });

// Multiple arrays of ids.
problem.add([ 'foo', 'bar' ], [ 'baz', 'qux' ], { group: 'wow' });

// Go crazy with it...
problem.add('foo', [ 'bar', 'baz '], { values: 'qux' });
```

### Debugging and Visualization Features
TODO
