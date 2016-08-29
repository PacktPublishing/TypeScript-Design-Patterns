describe('some feature', function () {
    it('should pass', function () {
        'foo'.should.not.equal('bar');
    });
    it('should error', function () {
        (function () {
            throw new Error();
        }).should.throw();
    });
});
