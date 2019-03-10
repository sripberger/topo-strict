import { Graph } from '../../lib/graph';
import { KeyError } from '../../lib/key-error';

describe('Graph', function() {
	let graph;

	beforeEach(function() {
		graph = new Graph();
	});

	it('creates an object to store nodes by value', function() {
		expect(graph.nodes).to.deep.equal({});
	});

	describe('#add', function() {
		it('adds a node with no constraints', function() {
			graph.add('foo');

			expect(graph.nodes.foo).to.deep.equal({ value: 'foo', edges: [] });
		});

		it('adds a node with before constraints', function() {
			const fooNode = graph.nodes.foo = { value: 'foo', edges: [] };
			const barNode = graph.nodes.bar = { value: 'bar', edges: [] };

			graph.add('baz', { before: [ 'foo', 'bar' ] });

			expect(graph.nodes).to.have.property('baz');
			expect(graph.nodes.baz.value).to.equal('baz');
			expect(graph.nodes.baz.edges).to.have.length(2);
			expect(graph.nodes.baz.edges[0]).to.equal(fooNode);
			expect(graph.nodes.baz.edges[1]).to.equal(barNode);
		});

		it('adds a node with after constraints', function() {
			const fooNode = graph.nodes.foo = { value: 'foo', edges: [] };
			const barNode = graph.nodes.bar = {
				value: 'bar',
				edges: [ fooNode ],
			};
			const bazNode = graph.nodes.baz = {
				value: 'baz',
				edges: [ barNode ],
			};

			graph.add('qux', { after: [ 'bar', 'baz' ] });

			expect(graph.nodes).to.have.property('qux');
			expect(graph.nodes.qux.value).to.equal('qux');
			expect(graph.nodes.qux.edges).to.be.empty;
			expect(barNode.edges).to.have.length(2);
			expect(barNode.edges[0]).to.equal(fooNode);
			expect(barNode.edges[1]).to.equal(graph.nodes.qux);
			expect(bazNode.edges[0]).to.equal(barNode);
			expect(bazNode.edges[1]).to.equal(graph.nodes.qux);
		});

		it('throws without changing graph if value is already a node', function() {
			graph.nodes.foo = { value: 'foo', edges: [] };

			expect(() => {
				graph.add('foo');
			}).to.throw(KeyError).that.satisfies((err) => {
				expect(err.message).to.equal(
					'Value \'foo\' is already in the graph'
				);
				expect(err.info).to.deep.equal({ key: 'foo' });
				return true;
			});
		});
	});
});
