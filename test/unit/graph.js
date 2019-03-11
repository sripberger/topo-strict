import { Graph } from '../../lib/graph';
import { KeyError } from '../../lib/key-error';

describe('Graph', function() {
	let graph;

	beforeEach(function() {
		graph = new Graph();
	});

	it('creates an object to store nodes by id', function() {
		expect(graph.nodes).to.deep.equal({});
	});

	describe('#addNode', function() {
		it('adds a node with the provided id to the graph', function() {
			graph.addNode('foo');
			graph.addNode('bar');

			expect(graph.nodes).to.have.keys('foo', 'bar');
			expect(graph.nodes.foo).to.deep.equal({ id: 'foo', edges: [] });
			expect(graph.nodes.bar).to.deep.equal({ id: 'bar', edges: [] });
		});

		it('throws without adding if id already has a node', function() {
			const fooNode = graph.nodes.foo = { id: 'foo', edges: [] };

			expect(() => {
				graph.addNode('foo');
			}).to.throw(KeyError).that.satisfies((err) => {
				expect(err.message).to.equal(
					'Id \'foo\' is already in the graph'
				);
				expect(err.info).to.deep.equal({ key: 'foo' });
				return true;
			});
			expect(graph.nodes.foo).to.equal(fooNode);
		});
	});

	describe('#addEdge', function() {
		let fooNode, barNode, bazNode;

		beforeEach(function() {
			fooNode = graph.nodes.foo = { id: 'foo', edges: [] };
			barNode = graph.nodes.bar = { id: 'bar', edges: [ fooNode ] };
			bazNode = graph.nodes.baz = { id: 'baz', edges: [] };
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
});
