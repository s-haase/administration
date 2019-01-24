import template from './sw-sidebar-navigation-item.html.twig';
import './sw-sidebar-navigation-item.less';

/**
 * @private
 */
export default {
    name: 'sw-sidebar-navigation-item',
    template,

    props: {
        sidebarItem: {
            type: Object,
            required: true
        }
    },

    methods: {
        emitButtonClicked() {
            this.$emit('sw-sidebar-navigation-item-clicked', this.sidebarItem);
        }
    }
};
