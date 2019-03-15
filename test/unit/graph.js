import * as searchModule from '../../lib/search';
import { Graph } from '../../lib/graph';
import { KeyError } from '../../lib/key-error';

describe('Graph', function() {
	let graph;

	beforeEach(function() {
		graph = new Graph();
	});

	it('creates an object to store nodes by id', function() {
		expect(graph._nodesById).to.deep.equal({});
	});

	describe('@nodes', function() {
		it('returns array of all node values', function() {
			const fooNode = graph._nodesById.foo = { id: 'foo' };
			const barNode = graph._nodesById.bar = { id: 'bar' };

			expect(graph.nodes).to.deep.equal([ fooNode, barNode ]);
		});
	});

	describe('#addNode', function() {
		it('adds a node with the provided id to the graph', function() {
			graph.addNode('foo');
			graph.addNode('bar');

			expect(graph._nodesById).to.have.keys('foo', 'bar');
			expect(graph._nodesById.foo)
				.to.deep.equal({ id: 'foo', edges: [] });
			expect(graph._nodesById.bar)
				.to.deep.equal({ id: 'bar', edges: [] });
		});

		it('throws without adding if id already has a node', function() {
			const fooNode = graph._nodesById.foo = { id: 'foo', edges: [] };

			expect(() => {
				graph.addNode('foo');
			}).to.throw(KeyError).that.satisfies((err) => {
				expect(err.message).to.equal(
					'Id \'foo\' is already in the graph'
				);
				expect(err.info).to.deep.equal({ key: 'foo' });
				return true;
			});
			expect(graph._nodesById.foo).to.equal(fooNode);
		});
	});

	describe('#addEdge', function() {
		let fooNode, barNode, bazNode;

		beforeEach(function() {
			fooNode = graph._nodesById.foo = { id: 'foo', edges: [] };
			barNode = graph._nodesById.bar = { id: 'bar', edges: [ fooNode ] };
			bazNode = graph._nodesById.baz = { id: 'baz', edges: [] };
		});

		it('appends `to` node to `from` node\'s edges', function() {
			graph.addEdge('foo', 'baz');
			graph.addEdge('bar', 'baz');

			expect(fooNode.edges).to.have.length(1);
			expect(fooNode.edges[0]).to.equal(bazNode);
			expect(barNode.edges).to.have.length(2);
			expect(barNode.edges[0]).to.equal(fooNode);
			expect(barNode.edges[1]).to.equal(bazNode);
		});

		it('throws without appending if `from` node does not exist', function() {
			expect(() => {
				graph.addEdge('qux', 'foo');
			}).to.throw(KeyError).that.satisfies((err) => {
				expect(err.message).to.equal(
					'Id \'qux\' is not in the graph'
				);
				return true;
			});
			expect(fooNode.edges).to.be.empty;
			expect(barNode.edges).to.have.length(1);
			expect(bazNode.edges).to.be.empty;
		});

		it('throws without appending if `to` node does not exist', function() {
			expect(() => {
				graph.addEdge('foo', 'qux');
			}).to.throw(KeyError).that.satisfies((err) => {
				expect(err.message).to.equal(
					'Id \'qux\' is not in the graph'
				);
				return true;
			});
			expect(fooNode.edges).to.be.empty;
			expect(barNode.edges).to.have.length(1);
			expect(bazNode.edges).to.be.empty;
		});
	});

	describe('#toString', function() {
		it('returns a string representation of the graph', function() {
			const fooNode = graph._nodesById.foo = { id: 'foo', edges: [] };
			const barNode = graph._nodesById.bar = {
				id: 'bar',
				edges: [ fooNode ],
			};
			graph._nodesById.baz = { id: 'baz', edges: [ fooNode, barNode ] };

			expect(graph.toString()).to.equal(
				'nodes\n' +
				'-----\n' +
				'bar\n' +
				'baz\n' +
				'foo\n\n' +
				'edges\n' +
				'-----\n' +
				'from: bar, to: foo\n' +
				'from: baz, to: bar\n' +
				'from: baz, to: foo'
			);
		});

		it('skips edge section, if there are none', function() {
			graph._nodesById = {
				foo: { id: 'foo', edges: [] },
				bar: { id: 'bar', edges: [] },
			};

			expect(graph.toString()).to.equal(
				'nodes\n' +
				'-----\n' +
				'bar\n' +
				'foo'
			);
		});

		it('returns an appropriate string if the graph is empty', function() {
			expect(graph.toString()).to.equal('Empty graph');
		});
	});

	describe('#solve', function() {
		const searchResult = [ 'foo', 'bar' ];
		let search, result;

		beforeEach(function() {
			search = sinon.createStubInstance(searchModule.Search);
			sinon.stub(searchModule, 'Search').returns(search);
			search.run.returns(searchResult);

			result = graph.solve();
		});

		it('creates a search with the instance', function() {
			expect(searchModule.Search).to.be.calledOnce;
			expect(searchModule.Search).to.be.calledWithNew;
			expect(searchModule.Search).to.be.calledWith(graph);
		});

		it('runs the search', function() {
			expect(search.run).to.be.calledOnce;
			expect(search.run).to.be.calledOn(search);
		});

		it('returns the search result', function() {
			expect(result).to.equal(searchResult);
		});
	});
});
