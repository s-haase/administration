const { warn } = Shopware.Utils.debug;
const { DeviceHelper } = Shopware.Helper;

let pluginInstalled = false;

// eslint-disable-next-line sw-deprecation-rules/private-feature-declarations
export default {
    install(Vue) {
        if (pluginInstalled) {
            warn('DeviceHelper', 'This plugin is already installed');
            return false;
        }

        const deviceHelper = new DeviceHelper();

        Object.defineProperties(Vue.prototype, {
            $device: {
                get() {
                    return deviceHelper;
                },
            },
        });

        Vue.mixin({
            destroyed() {
                this.$device.removeResizeListener(this);
            },
        });

        pluginInstalled = true;

        return true;
    },
};
