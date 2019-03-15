import * as graphModule from '../../lib/graph';
import * as keySetModule from '../../lib/key-set';
import { Problem } from '../../lib/problem';
import { Validatable } from '../../lib/validatable';

describe('Problem', function() {
	let problem;

	beforeEach(function() {
		problem = new Problem();
	});

	it('extends Validatable', function() {
		expect(problem).to.be.an.instanceof(Validatable);
	});

	it('creates an object for storing ids with their constraints', function() {
		expect(problem._ids).to.deep.equal({});
	});

	it('creates an object for storing groups with their ids', function() {
		expect(problem._groups).to.deep.equal({});
	});

	describe('@keysByType', function() {
		it('returns categorized keys from ids and groups', function() {
			problem._ids = { foo: {}, bar: {} };
			problem._groups = { baz: [], qux: [] };

			expect(problem.keysByType).to.deep.equal({
				ids: [ 'foo', 'bar' ],
				groups: [ 'baz', 'qux' ],
			});
		});
	});

	describe('@keys', function() {
		it('returns all keys in an array', function() {
			problem._ids = { foo: {}, bar: {} };
			problem._groups = { baz: [], qux: [] };

			expect(problem.keys).to.deep.equal([ 'foo', 'bar', 'baz', 'qux' ]);
		});
	});

	describe('#add', function() {
		let keySet;

		beforeEach(function() {
			keySet = new keySetModule.KeySet();
			sinon.stub(keySetModule, 'KeySet').returns(keySet);
			sinon.stub(keySet, 'validate');
			sinon.stub(problem, '_addKeySet');
		});

		it('creates a key set with provided arguments', function() {
			problem.add('foo', 'bar');

			expect(keySetModule.KeySet).to.be.calledOnce;
			expect(keySetModule.KeySet).to.be.calledWithNew;
			expect(keySetModule.KeySet).to.be.calledWith('foo', 'bar');
		});

		it('validates the key set with existing keys by type', function() {
			const keysByType = {};
			sinon.stub(problem, 'keysByType').get(() => keysByType);

			problem.add();

			expect(keySet.validate).to.be.calledOnce;
			expect(keySet.validate).to.be.calledOn(keySet);
			expect(keySet.validate).to.be.calledWith(
				sinon.match.same(keysByType)
			);
		});

		it('adds the key set to the problem', function() {
			problem.add();

			expect(problem._addKeySet).to.be.calledOnce;
			expect(problem._addKeySet).to.be.calledOn(problem);
			expect(problem._addKeySet).to.be.calledWith(keySet);
		});

		it('does not add the key set if validation throws', function() {
			keySet.validate.throws(new Error('omg'));

			expect(() => problem.add()).to.throw();
			expect(problem._addKeySet).to.not.be.called;
		});
	});

	describe('#toString', function() {
		it('returns a string representation of the problem', function() {
			problem._ids = {
				foo: { before: [ 'omg', 'wow' ], after: [ 'wtf' ] },
				bar: { before: [ 'wut' ] },
				baz: { after: [ 'ffs', 'gdi' ] },
				qux: {},
			};
			problem._groups = {
				groupB: [ 'foo', 'bar' ],
				groupA: [ 'baz' ],
			};

			expect(problem.toString()).to.equal(
				'ids\n' +
				'---\n' +
				'bar\n' +
				'    before: wut\n' +
				'baz\n' +
				'    after: ffs\n' +
				'    after: gdi\n' +
				'foo\n' +
				'    before: omg\n' +
				'    before: wow\n' +
				'    after: wtf\n' +
				'qux\n\n' +
				'groups\n' +
				'------\n' +
				'groupA\n' +
				'    baz\n' +
				'groupB\n' +
				'    foo\n' +
				'    bar'
			);
		});

		it('skips groups section if there are none', function() {
			problem._ids = { foo: {}, bar: {} };

			expect(problem.toString()).to.equal(
				'ids\n' +
				'---\n' +
				'bar\n' +
				'foo'
			);
		});

		it('skips ids section if there are none', function() {
			problem._groups = { foo: [], bar: [] };

			expect(problem.toString()).to.equal(
				'groups\n' +
				'------\n' +
				'bar\n' +
				'foo'
			);
		});

		it('returns an appropriate string if problem is empty', function() {
			expect(problem.toString()).to.equal('Empty problem');
		});
	});

	describe('#toGraph', function() {
		it('validates instance before returning the full graph', function() {
			const graph = sinon.createStubInstance(graphModule.Graph);
			sinon.stub(problem, '_validate');
			sinon.stub(problem, '_toFullGraph').returns(graph);

			const result = problem.toGraph();

			expect(problem._validate).to.be.calledOnce;
			expect(problem._validate).to.be.calledOn(problem);
			expect(problem._toFullGraph).to.be.calledOnce;
			expect(problem._toFullGraph).to.be.calledOn(problem);
			expect(problem._toFullGraph).to.be.calledAfter(problem._validate);
			expect(result).to.equal(graph);
		});
	});

	describe('#solve', function() {
		it('converts the instance to a graph and returns its solution', function() {
			const graph = sinon.createStubInstance(graphModule.Graph);
			const solution = [ 'foo', 'bar' ];
			graph.solve.returns(solution);
			sinon.stub(problem, 'toGraph').returns(graph);

			const result = problem.solve();

			expect(problem.toGraph).to.be.calledOnce;
			expect(problem.toGraph).to.be.calledOn(problem);
			expect(graph.solve).to.be.calledOnce;
			expect(graph.solve).to.be.calledOn(graph);
			expect(result).to.equal(solution);
		});
	});

	describe('#_addKeySet', function() {
		let keySet;

		beforeEach(function() {
			keySet = new keySetModule.KeySet();
		});

		it('adds entry for each id', function() {
			problem._ids = { foo: {} };
			keySet.ids.push('bar', 'baz');

			problem._addKeySet(keySet);

			expect(problem._ids).to.have.keys('foo', 'bar', 'baz');
		});

		it('copies constraints to new entries', function() {
			keySet.ids.push('foo');
			keySet.before = [ 'bar', 'baz' ];
			keySet.after = [ 'omg', 'wow' ];

			problem._addKeySet(keySet);

			expect(problem._ids.foo).to.deep.equal({
				before: keySet.before,
				after: keySet.after,
			});
		});

		it('skips empty before constraint', function() {
			keySet.ids.push('foo');
			keySet.after = [ 'bar' ];

			problem._addKeySet(keySet);

			expect(problem._ids.foo).to.deep.equal({ after: keySet.after });
		});

		it('skips empty after constraint', function() {
			keySet.ids.push('foo');
			keySet.before = [ 'bar' ];

			problem._addKeySet(keySet);

			expect(problem._ids.foo).to.deep.equal({ before: keySet.before });
		});

		it('adds a group with ids, if key set has one', function() {
			keySet.ids.push('foo', 'bar', 'baz');
			keySet.group = 'qux';

			problem._addKeySet(keySet);

			expect(problem._groups).to.have.keys('qux');
			expect(problem._groups.qux).to.deep.equal([ 'foo', 'bar', 'baz' ]);
		});

		it('appends to group ids, if they already exist', function() {
			keySet.ids.push('foo', 'bar');
			keySet.group = 'baz';
			problem._groups.baz = [ 'qux' ];

			problem._addKeySet(keySet);

			expect(problem._groups).to.have.keys('baz');
			expect(problem._groups.baz).to.deep.equal([ 'qux', 'foo', 'bar' ]);
		});
	});

	describe('#_getErrorInfo', function() {
		it('gets info objects for any constraint keys with no target', function() {
			problem._ids = {
				id1: {
					before: [ 'id2', 'foo', 'bar', 'group1', 'baz' ],
					after: [ 'id3', 'qux', 'group2' ],
				},
				id2: { before: [ 'omg', 'group1', 'wow', 'id3' ] },
				id3: { after: [ 'wtf', 'group2' ] },
			};
			problem._groups = { group1: [], group2: [] };

			expect(problem._getErrorInfo()).to.deep.equal([
				{ type: 'missingTarget', keyType: 'before', key: 'foo' },
				{ type: 'missingTarget', keyType: 'before', key: 'bar' },
				{ type: 'missingTarget', keyType: 'before', key: 'baz' },
				{ type: 'missingTarget', keyType: 'after', key: 'qux' },
				{ type: 'missingTarget', keyType: 'before', key: 'omg' },
				{ type: 'missingTarget', keyType: 'before', key: 'wow' },
				{ type: 'missingTarget', keyType: 'after', key: 'wtf' },
			]);
		});
	});

	describe('#_toFullGraph', function() {
		let graph, groupsApplied, result;

		beforeEach(function() {
			graph = sinon.createStubInstance(graphModule.Graph);
			groupsApplied = {
				id1: { before: [ 'foo', 'bar' ], after: [ 'baz', 'qux' ] },
				id2: { before: [ 'wtf', 'omg', 'wow' ] },
				id3: { after: [ 'ffs' ] },
			};
			sinon.stub(problem, '_toGraphWithNodes').returns(graph);
			sinon.stub(problem, '_applyGroups').returns(groupsApplied);

			result = problem._toFullGraph();
		});

		it('gets the graph with nodes', function() {
			expect(problem._toGraphWithNodes).to.be.calledOnce;
			expect(problem._toGraphWithNodes).to.be.calledOn(problem);
		});

		it('applies groups to constraints', function() {
			expect(problem._applyGroups).to.be.calledOnce;
			expect(problem._applyGroups).to.be.calledOn(problem);
		});

		it('adds edges to the graph for all constraints', function() {
			expect(graph.addEdge).to.have.callCount(8);
			expect(graph.addEdge).to.always.be.calledOn(graph);
			expect(graph.addEdge).to.be.calledWith('id1', 'foo');
			expect(graph.addEdge).to.be.calledWith('id1', 'bar');
			expect(graph.addEdge).to.be.calledWith('baz', 'id1');
			expect(graph.addEdge).to.be.calledWith('qux', 'id1');
			expect(graph.addEdge).to.be.calledWith('id2', 'wtf');
			expect(graph.addEdge).to.be.calledWith('id2', 'omg');
			expect(graph.addEdge).to.be.calledWith('id2', 'wow');
			expect(graph.addEdge).to.be.calledWith('ffs', 'id3');
		});

		it('returns the graph', function() {
			expect(result).to.equal(graph);
		});
	});

	describe('#_toGraphWithNodes', function() {
		let graph, result;

		beforeEach(function() {
			graph = sinon.createStubInstance(graphModule.Graph);
			sinon.stub(graphModule, 'Graph').returns(graph);
			problem._ids = { foo: {}, bar: {} };

			result = problem._toGraphWithNodes();
		});

		it('creates a graph', function() {
			expect(graphModule.Graph).to.be.calledOnce;
			expect(graphModule.Graph).to.be.calledWithNew;
		});

		it('adds id keys as nodes to the graph', function() {
			expect(graph.addNode).to.be.calledTwice;
			expect(graph.addNode).to.always.be.calledOn(graph);
			expect(graph.addNode).to.be.calledWith('foo');
			expect(graph.addNode).to.be.calledWith('bar');
		});

		it('returns the created graph', function() {
			expect(result).to.equal(graph);
		});
	});

	describe('#_applyGroups', function() {
		it('returns constraints by id with groups applied', function() {
			problem._ids = {
				id1: {
					before: [ 'id2', 'group1' ],
					after: [ 'id3', 'group2' ],
				},
				id2: { before: [ 'group1', 'group2', 'id3' ] },
				id3: { after: [ 'group2' ] },
			};
			problem._groups = {
				group1: [ 'foo', 'bar' ],
				group2: [ 'baz' ],
			};

			expect(problem._applyGroups()).to.deep.equal({
				id1: {
					before: [ 'id2', 'foo', 'bar' ],
					after: [ 'id3', 'baz' ],
				},
				id2: { before: [ 'foo', 'bar', 'baz', 'id3' ] },
				id3: { after: [ 'baz' ] },
			});
		});
	});
});
