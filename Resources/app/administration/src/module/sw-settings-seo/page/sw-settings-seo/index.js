import template from './sw-settings-seo.html.twig';

const { Component } = Shopware;

// eslint-disable-next-line sw-deprecation-rules/private-feature-declarations
Component.register('sw-settings-seo', {
    template,

    data() {
        return {
            isLoading: false,
        };
    },

    metaInfo() {
        return {
            title: this.$createTitle(),
        };
    },

    methods: {
        onClickSave() {
            this.$refs.seoUrlTemplateCard.onClickSave();
            this.$refs.systemConfig.saveAll();
        },

        onLoadingChanged(loading) {
            this.isLoading = loading;
        },
    },
});
