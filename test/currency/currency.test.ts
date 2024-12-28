
describe('currency', () => {
    it('should return a list of currencies', () => {
        // Test the getAllCurrencies function
        const currencies = getAllCurrencies();
        expect(currencies).toBeDefined();
        expect(currencies).not.toBeNull();
        expect(currencies.length).toBeGreaterThan(0);
    });
});