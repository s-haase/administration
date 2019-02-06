const settingsPage = require('administration/page-objects/module/sw-settings.page-object.js');

module.exports = {
    '@tags': ['setting', 'snippet-set-delete', 'snippets', 'snippet-set', 'delete'],
    '@disabled': !global.flags.isActive('next717'),
    before: (browser, done) => {
        global.FixtureService.create('snippet-set').then(() => {
            done();
        });
    },
    'open snippet module': (browser) => {
        browser
            .openMainMenuEntry('#/sw/settings/index', 'Settings', '#/sw/settings/snippet/index', 'Snippets');
    },
    'verify snippet set to be edited': (browser) => {
        const page = settingsPage(browser);

        browser
            .expect.element(`${page.elements.gridRow}--0 a`).to.have.text.that.equals('A Set Name Snippet');
    },
    'delete snippet': (browser) => {
        const page = settingsPage(browser);

        browser
            .clickContextMenuItem('.sw-context-menu-item--danger', page.elements.contextMenuButton)
            .waitForElementVisible(page.elements.modal)
            .assert.containsText(`${page.elements.modal} ${page.elements.modal}__body`, `Are you sure you want to delete the snippet set "${global.FixtureService.basicFixture.name}"?`)
            .click(`${page.elements.modal}__footer button${page.elements.primaryButton}`)
            .checkNotification('Snippet set has been deleteced successfully.')
            .waitForElementNotPresent(page.elements.loader);
    },
    'verify deletion': (browser) => {
        const page = settingsPage(browser);

        browser
            .expect.element(`${page.elements.gridRow}--0 a`).to.have.text.that.not.equals('A Set Name Snippet');
    },
    after: (browser) => {
        browser.end();
    }
};
