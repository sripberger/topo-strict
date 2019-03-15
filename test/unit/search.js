import { CycleError } from '../../lib/cycle-error';
import { Graph } from '../../lib/graph';
import { Search } from '../../lib/search';

describe('Search', function() {
	it('creates a set for storing nodes', function() {
		const search = new Search();

		expect(search._nodes).to.deep.equal(new Set());
	});

	it('creates a set for storing marked nodes', function() {
		const search = new Search();

		expect(search._markedNodes).to.deep.equal(new Set());
	});

	it('creates an array for storing the result', function() {
		const search = new Search();

		expect(search._result).to.deep.equal([]);
	});

	it('puts all nodes of provided graph into own node set', function() {
		const graph = new Graph();
		const fooNode = { id: 'foo' };
		const barNode = { id: 'bar' };
		sinon.stub(graph, 'nodes').get(() => [ fooNode, barNode ]);

		const search = new Search(graph);

		expect(search._nodes).to.deep.equal(new Set([ fooNode, barNode ]));
	});

	describe('#run', function() {
		const fooNode = { id: 'foo' };
		const barNode = { id: 'bar' };
		const bazNode = { id: 'baz' };
		let search, result;

		beforeEach(function() {
			search = new Search();

			const nodeQueue = [ fooNode, barNode, bazNode ];
			search._nodes = new Set(nodeQueue);

			sinon.stub(search, '_getNextNode').callsFake(() => nodeQueue[0]);
			sinon.stub(search, '_visitNode').callsFake(() => {
				search._nodes.delete(nodeQueue.shift());
			});

			result = search.run();
		});

		it('visits the next node until no nodes remain', function() {
			expect(search._getNextNode).to.be.calledThrice;
			expect(search._getNextNode).to.always.be.calledOn(search);
			expect(search._visitNode).to.be.calledThrice;
			expect(search._visitNode).to.always.be.calledOn(search);
			expect(search._visitNode.args).to.deep.equal([
				[ fooNode ],
				[ barNode ],
				[ bazNode ],
			]);
		});

		it('returns search result when finished', function() {
			expect(result).to.equal(search._result);
		});
	});

	describe('#_getNextNode', function() {
		let search;

		beforeEach(function() {
			search = new Search();
		});

		it('returns the node with the latest id, alphabetically', function() {
			const nodeA = { id: 'a' };
			const nodeC = { id: 'c' };
			const nodeB = { id: 'b' };
			search._nodes = new Set([ nodeA, nodeC, nodeB ]);

			expect(search._getNextNode()).to.equal(nodeC);
		});

		it('returns null if there are no nodes', function() {
			expect(search._getNextNode()).to.be.null;
		});
	});

	describe('#_visitNode', function() {
		let search, _nodes, _markedNodes, _result, node;

		beforeEach(function() {
			search = new Search();
			({ _nodes, _markedNodes, _result } = search);
			node = { id: 'node id' };

			sinon.stub(search, '_visitEdges');
			sinon.stub(_nodes, 'has').returns(true);
			sinon.stub(_nodes, 'delete');
			sinon.stub(_markedNodes, 'has').returns(false);
			sinon.stub(_markedNodes, 'add');
			sinon.stub(_result, 'unshift');
		});

		it('checks if node is in node set', function() {
			search._visitNode(node);

			expect(_nodes.has).to.be.calledOnce;
			expect(_nodes.has).to.be.calledOn(_nodes);
			expect(_nodes.has).to.be.calledWith(node);
		});

		it('checks if node is in marked node set', function() {
			search._visitNode(node);

			expect(_markedNodes.has).to.be.calledOnce;
			expect(_markedNodes.has).to.be.calledOn(_markedNodes);
			expect(_markedNodes.has).to.be.calledWith(node);
		});

		it('adds node to marked nodes', function() {
			search._visitNode(node);

			expect(_markedNodes.add).to.be.calledOnce;
			expect(_markedNodes.add).to.be.calledOn(_markedNodes);
			expect(_markedNodes.add).to.be.calledWith(node);
		});

		it('visits the node\'s edges after adding to marked nodes', function() {
			search._visitNode(node);

			expect(search._visitEdges).to.be.calledOnce;
			expect(search._visitEdges).to.be.calledOn(search);
			expect(search._visitEdges).to.be.calledWith(node);
			expect(search._visitEdges).to.be.calledAfter(_markedNodes.add);
		});

		it('deletes node from node set after visiting edges', function() {
			search._visitNode(node);

			expect(_nodes.delete).to.be.calledOnce;
			expect(_nodes.delete).to.be.calledOn(_nodes);
			expect(_nodes.delete).to.be.calledWith(node);
			expect(_nodes.delete).to.be.calledAfter(search._visitEdges);
		});

		it('unshifts node\'s id on to the result after visiting edges', function() {
			search._visitNode(node);

			expect(_result.unshift).to.be.calledOnce;
			expect(_result.unshift).to.be.calledOn(_result);
			expect(_result.unshift).to.be.calledWith(node.id);
			expect(_result.unshift).to.be.calledAfter(search._visitEdges);
		});

		it('returns without changing anything if node is not in the node set', function() {
			_nodes.has.returns(false);
			_markedNodes.has.returns(true);

			search._visitNode(node);

			expect(_markedNodes.add).to.not.be.called;
			expect(search._visitEdges).to.not.be.called;
			expect(_nodes.delete).to.not.be.called;
			expect(_result.unshift).to.not.be.called;
		});

		it('throws without changing anything if node is marked', function() {
			_markedNodes.has.returns(true);

			expect(() => {
				search._visitNode(node);
			}).to.throw(CycleError).that.satisfies((err) => {
				expect(err.message).to.equal(
					`Cycle detected at node with id '${node.id}'`
				);
				expect(err.info).to.deep.equal({ id: node.id });
				return true;
			});
			expect(_markedNodes.add).to.not.be.called;
			expect(search._visitEdges).to.not.be.called;
			expect(_nodes.delete).to.not.be.called;
			expect(_result.unshift).to.not.be.called;
		});
	});

	describe('#_visitEdges', function() {
		it('visits node\'s edges in reverse alpabetical order', function() {
			const search = new Search();
			const node = { id: 'node' };
			const fooNode = { id: 'foo' };
			const barNode = { id: 'bar' };
			const bazNode = { id: 'baz' };
			node.edges = [ fooNode, barNode, bazNode ];
			sinon.stub(search, '_visitNode');

			search._visitEdges(node);

			expect(search._visitNode).to.be.calledThrice;
			expect(search._visitNode).to.always.be.calledOn(search);
			expect(search._visitNode.args).to.deep.equal([
				[ fooNode ],
				[ bazNode ],
				[ barNode ],
			]);
		});
	});
});
