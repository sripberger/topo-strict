import chai from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';

// Add sinon assertions to chai.
chai.use(sinonChai);

// Create globals for use in tests.
global.expect = chai.expect;
global.sinon = sinon;

// Restore anything replaced by sinon after each test.
afterEach(() => {
	sinon.restore();
});
